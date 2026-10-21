import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

// Fresh disposable PostgreSQL. No ports, connection strings, linked projects or secrets.
const container = `kazicoach-rls-${process.pid}-${Date.now()}`;
const adminSession="20000000-0000-4000-8000-000000000003";
const adminFactor="30000000-0000-4000-8000-000000000003";
const a = "10000000-0000-4000-8000-000000000001";
const b = "10000000-0000-4000-8000-000000000002";
const admin = "10000000-0000-4000-8000-000000000003";
function docker(args: string[], input?: string) {
  return spawnSync("docker", args, {
    input,
    encoding: "utf8",
    timeout: 30_000,
  });
}
function sql(query: string, user?: string, role = "authenticated") {
  const prefix = user
    ? `set role ${role}; set request.jwt.claim.sub='${user}'; set request.jwt.claims='${JSON.stringify(user===admin?{aal:'aal2',session_id:adminSession,amr:[{method:'totp',timestamp:Math.floor(Date.now()/1000)}]}:{aal:'aal1'})}';`
    : "";
  const result = docker(
    [
      "exec",
      "-i",
      container,
      "psql",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-Atq",
    ],
    prefix + query,
  );
  if (result.status !== 0)
    throw new Error(
      result.stderr || result.error?.message || "Postgres failed",
    );
  return result.stdout.trim();
}
beforeAll(async () => {
  const result = docker([
    "run",
    "--rm",
    "-d",
    "--name",
    container,
    "-e",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "postgres:17-alpine",
  ]);
  if (result.status !== 0)
    throw new Error(`Local Docker required: ${result.stderr}`);
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (
      docker(["exec", container, "pg_isready", "-U", "postgres"]).status === 0
    ) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error("Local Postgres did not start");
  sql(`create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade, factor_id uuid,aal text,not_after timestamptz);
    create table auth.mfa_factors(id uuid primary key,user_id uuid,status text);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    insert into auth.users values('${a}'),('${b}'),('${admin}');`);
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    sql(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  sql(`insert into kc_private.admins values('${admin}');
    insert into auth.mfa_factors values('${adminFactor}','${admin}','verified');
    insert into auth.sessions values('${adminSession}','${admin}','${adminFactor}','aal2',null);`);
}, 60_000);
afterAll(() => {
  docker(["stop", container]);
});

describe.sequential(
  "real PostgreSQL grants, RLS and trusted operations",
  () => {
    it("enables RLS on every application table and denies anonymous private access", () => {
      expect(
        sql(`select count(*) from pg_class c join pg_namespace n on c.relnamespace=n.oid
      where c.relkind='r' and (c.relname like 'kc_%' or n.nspname='kc_private') and not c.relrowsecurity;`),
      ).toBe("0");
      expect(() => sql("select * from public.kc_profiles;", a, "anon")).toThrow(
        /permission denied/,
      );
      expect(() => sql("select * from kc_private.admins;", a)).toThrow(
        /permission denied/,
      );
      expect(sql("select count(*) from public.kc_packages;", a, "anon")).toBe(
        "2",
      );
    });
    it("isolates profiles and prevents ownership reassignment or admin forgery", () => {
      sql(`insert into public.kc_profiles values('${a}','Learner A');`, a);
      expect(sql("select count(*) from public.kc_profiles;", b)).toBe("0");
      expect(() =>
        sql(`insert into public.kc_profiles values('${b}','Forged');`, a),
      ).toThrow(/row-level security/);
      expect(() =>
        sql(`update public.kc_profiles set user_id='${b}';`, a),
      ).toThrow(/row-level security/);
      expect(
        sql(
          `update public.kc_profiles set display_name='No' where user_id='${a}'; select count(*) from public.kc_profiles;`,
          b,
        ),
      ).toBe("0");
      expect(sql(`select public.kc_is_admin();`, a)).toBe("f");
      expect(() =>
        sql(
          `select public.kc_admin_action('activate','${a}','{"package_id":"plus"}');`,
          a,
        ),
      ).toThrow(/Forbidden/);
      expect(() =>
        sql(`insert into kc_private.admins values('${a}');`, a),
      ).toThrow(/permission denied/);
    });
    it("allows only owned immutable attempts and idempotent replays", () => {
      const row = `('${a}','20000000-0000-4000-8000-000000000001','q1','role','oral',80,30,now())`;
      sql(
        `insert into public.kc_attempts values ${row}; insert into public.kc_attempts values ${row} on conflict do nothing;`,
        a,
      );
      expect(sql("select count(*) from public.kc_attempts;", a)).toBe("1");
      expect(sql("select count(*) from public.kc_attempts;", b)).toBe("0");
      expect(() =>
        sql(
          `insert into public.kc_attempts values('${b}','20000000-0000-4000-8000-000000000002','q1','role','oral',80,30,now());`,
          a,
        ),
      ).toThrow(/row-level security/);
      expect(() => sql(`update public.kc_attempts set score=100;`, a)).toThrow(
        /permission denied/,
      );
      sql(`delete from public.kc_attempts;`, b);
      expect(sql("select count(*) from public.kc_attempts;", a)).toBe("1");
    });
    it("denies entitlement forgery, enforces package capabilities and automatic expiry", () => {
      expect(() =>
        sql(
          `insert into public.kc_entitlements values('${a}','plus',now(),now()+interval '7 days');`,
          a,
        ),
      ).toThrow(/permission denied/);
      expect(() => sql(`select public.kc_consume_cloud_request();`, a)).toThrow(
        /Premium access required/,
      );
      sql(
        `select public.kc_admin_action('activate','${a}','{"package_id":"basic"}');`,
        admin,
      );
      expect(
        sql(
          `select public.kc_has_capability('practice'),public.kc_has_capability('panel'),public.kc_has_capability('invented');`,
          a,
        ),
      ).toBe("t|f|f");
      expect(() => sql("select public.kc_advanced_progress();", a)).toThrow(
        /Premium Plus required/,
      );
      expect(
        sql(
          `select extract(epoch from expires_at-starts_at)/86400 from public.kc_entitlements;`,
          a,
        ),
      ).toBe("7.0000000000000000");
      expect(sql("select count(*) from public.kc_entitlements;", b)).toBe("0");
      expect(sql("select public.kc_consume_cloud_request();", a)).toBe("t");
      sql(
        `update public.kc_entitlements set starts_at=now()-interval '8 days',expires_at=now()-interval '1 day';`,
      );
      expect(sql(`select public.kc_has_capability('practice');`, a)).toBe("f");
      expect(() => sql("select public.kc_consume_cloud_request();", a)).toThrow(
        /Premium access required/,
      );
      sql(
        `select public.kc_admin_action('activate','${a}','{"package_id":"plus"}');`,
        admin,
      );
      expect(sql(`select public.kc_has_capability('panel');`, a)).toBe("t");
      expect(sql("select public.kc_advanced_progress();", a)).toContain(
        "strong_answers",
      );
    });
    it('switches Plus to Basic immediately, preserves other users and audits revocation',()=>{
      sql(`select public.kc_admin_action('activate','${b}','{"package_id":"plus"}');`,admin);
      sql(`select public.kc_admin_action('activate','${a}','{"package_id":"basic"}');`,admin);
      expect(sql("select public.kc_has_capability('practice'),public.kc_has_capability('advanced_analysis');",a)).toBe('t|f');
      expect(()=>sql('select public.kc_advanced_progress();',a)).toThrow(/Premium Plus required/);
      expect(sql("select public.kc_has_capability('advanced_analysis');",b)).toBe('t');
      expect(sql(`select count(*) from public.kc_entitlements where user_id='${a}';`)).toBe('1');
      expect(sql(`select details->>'package_id' from kc_private.audit where action='activate' and target='${a}' order by id desc limit 1;`)).toBe('basic');
      sql(`select public.kc_admin_action('revoke','${a}','{}');`,admin);
      expect(sql("select public.kc_has_capability('practice');",a)).toBe('f');
      expect(()=>sql('select public.kc_consume_cloud_request();',a)).toThrow(/Premium access required/);
      expect(sql(`select action from kc_private.audit where target='${a}' order by id desc limit 1;`)).toBe('revoke');
      expect(sql("select public.kc_has_capability('practice');",b)).toBe('t');
      sql(`select public.kc_admin_action('activate','${a}','{"package_id":"plus"}');`,admin);
    });
    it('uses database-clock exact expiry and denies future grants',()=>{
      // One transaction fixes now() so the equality boundary is deterministic.
      expect(sql(`begin; update public.kc_entitlements set starts_at=now()-interval '7 days',expires_at=now() where user_id='${a}';
        set local role authenticated; set local request.jwt.claim.sub='${a}'; select public.kc_has_capability('practice'); rollback;`)).toBe('f');
      sql(`update public.kc_entitlements set starts_at=now()+interval '1 day',expires_at=now()+interval '8 days' where user_id='${a}';`);
      expect(sql("select public.kc_has_capability('practice');",a)).toBe('f');
      expect(()=>sql('select public.kc_consume_cloud_request();',a)).toThrow(/Premium access required/);
      sql(`select public.kc_admin_action('activate','${a}','{"package_id":"plus"}');`,admin);
    });
    it('restricts contact updates to the admin and audits values atomically',()=>{
      expect(sql('select whatsapp from public.kc_settings;')).toBe('255688010595');
      expect(sql("select count(*) from kc_private.audit where action='bootstrap_contact';")).toBe('1');
      sql("update public.kc_settings set whatsapp='255688010596';");
      expect(()=>sql("select public.kc_set_contact('255688010595');",a)).toThrow(/Forbidden/);
      expect(()=>sql("update public.kc_settings set whatsapp='255688010595';",a)).toThrow(/permission denied/);
      sql("select public.kc_set_contact('255688010595');",admin);
      expect(sql("select whatsapp from public.kc_settings;",b,'anon')).toBe('255688010595');
      expect(sql("select details->>'previous_whatsapp',details->>'whatsapp' from kc_private.audit where action='contact' order by id desc limit 1;")).toBe('255688010596|255688010595');
      const count=sql('select count(*) from kc_private.audit;');
      expect(()=>sql("select public.kc_set_contact('invalid?secret');",admin)).toThrow(/check constraint/);
      expect(sql('select count(*) from kc_private.audit;')).toBe(count);
      expect(sql('select whatsapp from public.kc_settings;')).toBe('255688010595');
    });
    it("supports audited package changes and atomic cloud abuse limits", () => {
      expect(() =>
        sql(`update public.kc_packages set price_tzs=0;`, a),
      ).toThrow(/permission denied/);
      sql(
        `select public.kc_admin_action('package','plus','{"price_tzs":5000,"duration_days":7,"free_questions":5,"daily_cloud_limit":1}');`,
        admin,
      );
      sql(`delete from kc_private.cloud_usage;`);
      expect(sql("select public.kc_consume_cloud_request();", a)).toBe("t");
      expect(() => sql("select public.kc_consume_cloud_request();", a)).toThrow(
        /Daily limit reached/,
      );
      expect(
        Number(sql("select count(*) from kc_private.audit;")),
      ).toBeGreaterThanOrEqual(3);
      expect(
        sql(
          "select details->>'price_tzs' from kc_private.audit where action='package' order by id desc limit 1;",
        ),
      ).toBe("5000");
      expect(() => sql("select public.kc_admin_overview();", a)).toThrow(
        /Forbidden/,
      );
    });
    it("keeps submissions private, prevents self-approval, allows moderation and withdrawal", () => {
      sql(
        `insert into public.kc_testimonials(user_id,display_name,body) values('${a}','Learner','Useful preparation tool.');`,
        a,
      );
      expect(sql("select count(*) from public.kc_testimonials;", b)).toBe("0");
      expect(
        sql("select count(*) from public.kc_public_testimonials();", b, "anon"),
      ).toBe("0");
      expect(() =>
        sql(`update public.kc_testimonials set status='approved';`, a),
      ).toThrow(/permission denied/);
      expect(() =>
        sql(
          `insert into public.kc_testimonials(user_id,display_name,body) values('${b}','No','Spoofed testimonial');`,
          a,
        ),
      ).toThrow(/row-level security/);
      const id = sql("select id from public.kc_testimonials;", a);
      sql(
        `select public.kc_admin_action('moderate','${id}','{"status":"approved"}');`,
        admin,
      );
      expect(
        sql("select count(*) from public.kc_public_testimonials();", b, "anon"),
      ).toBe("1");
      expect(
        sql(
          `select string_agg(column_name,',') from information_schema.columns where table_name='kc_testimonials';`,
        ),
      ).toContain("user_id");
      expect(() =>
        sql("select * from public.kc_testimonials;", b, "anon"),
      ).toThrow(/permission denied/);
      sql(`update public.kc_testimonials set body='Unreviewed edit';`, a);
      expect(sql("select body from public.kc_testimonials;", a)).toBe(
        "Useful preparation tool.",
      );
      sql("delete from public.kc_testimonials;", b);
      expect(
        sql("select count(*) from public.kc_public_testimonials();", b, "anon"),
      ).toBe("1");
      sql("delete from public.kc_testimonials;", a);
      expect(
        sql("select count(*) from public.kc_public_testimonials();", b, "anon"),
      ).toBe("0");
    });
    it("requires fresh MFA and a live session for privileged owner operations", () => {
      const denied=(claims:unknown)=> {
        const prefix=`set request.jwt.claims='${JSON.stringify(claims)}';`;
        expect(()=>sql(prefix+"select public.kc_admin_overview();",admin)).toThrow(/Forbidden/);
        expect(()=>sql(prefix+"select public.kc_set_contact('255688010595');",admin)).toThrow(/Forbidden/);
        expect(()=>sql(prefix+`select public.kc_admin_action('activate','${b}','{"package_id":"plus"}');`,admin)).toThrow(/Forbidden/);
      };
      denied({aal:'aal1'});
      denied({aal:'aal2',session_id:adminSession,amr:[{method:'totp',timestamp:Math.floor(Date.now()/1000)-901}]});
      denied({aal:'aal2',session_id:adminSession,amr:[{method:'totp',timestamp:Math.floor(Date.now()/1000)+3600}]});
      denied({aal:'aal2',session_id:a,amr:[{method:'totp',timestamp:Math.floor(Date.now()/1000)}]});
      sql(`update auth.sessions set not_after=now()-interval '1 second' where id='${adminSession}';`);
      expect(()=>sql('select public.kc_admin_overview();',admin)).toThrow(/Forbidden/);
      sql(`update auth.sessions set not_after=null where id='${adminSession}'; update auth.mfa_factors set status='unverified' where id='${adminFactor}';`);
      expect(()=>sql('select public.kc_admin_overview();',admin)).toThrow(/Forbidden/);
      sql(`update auth.mfa_factors set status='verified' where id='${adminFactor}';`);
      expect(sql('select public.kc_is_admin();',admin)).toBe('t');
      expect(sql("select public.kc_has_capability('sync');",b)).toBe('t');
    });
    it("pages admin records without truncation, duplicates or learner access",()=>{
      sql("insert into auth.users select gen_random_uuid() from generate_series(1,205);");
      const ids:string[]=[];let cursor:string|null=null;
      do {
        const page=JSON.parse(sql(`select public.kc_admin_page('users',${cursor?`'${cursor}'`:'null'});`,admin));
        expect(page.rows.length).toBeLessThanOrEqual(100);
        ids.push(...page.rows.map((row:{user_id:string})=>row.user_id));cursor=page.next_cursor;
      } while(cursor);
      expect(ids.length).toBe(208);expect(new Set(ids).size).toBe(208);
      expect(()=>sql("select public.kc_admin_page('users',null);",b)).toThrow(/Forbidden/);
      expect(()=>sql(`set request.jwt.claims='{"aal":"aal1"}'; select public.kc_admin_page('audit',null);`,admin)).toThrow(/Forbidden/);
      sql(`delete from auth.users where id not in ('${a}','${b}','${admin}');`);
    });
    it("restores an isolated database backup with RLS, audit and MFA protections intact",()=>{
      const dump=spawnSync('docker',['exec',container,'pg_dump','-U','postgres','--format=c','--dbname=postgres'],{maxBuffer:16*1024*1024});
      expect(dump.status).toBe(0);expect(dump.stdout.length).toBeGreaterThan(1000);
      expect(docker(['exec',container,'createdb','-U','postgres','restore_check']).status).toBe(0);
      const restored=spawnSync('docker',['exec','-i',container,'pg_restore','-U','postgres','--exit-on-error','--dbname=restore_check'],{input:dump.stdout,maxBuffer:16*1024*1024});
      expect(restored.status,restored.stderr.toString()).toBe(0);
      const check=docker(['exec','-i',container,'psql','-U','postgres','-d','restore_check','-Atq','-v','ON_ERROR_STOP=1'],
        `select count(*)>0 from kc_private.audit; set role authenticated; set request.jwt.claim.sub='${b}'; select count(*) from public.kc_profiles where user_id='${a}';`);
      expect(check.status).toBe(0);expect(check.stdout.trim()).toBe('t\n0');
      const denied=docker(['exec','-i',container,'psql','-U','postgres','-d','restore_check','-Atq','-v','ON_ERROR_STOP=1'],
        `set role authenticated; set request.jwt.claim.sub='${admin}'; set request.jwt.claims='{"aal":"aal1"}'; select public.kc_admin_overview();`);
      expect(denied.status).not.toBe(0);expect(denied.stderr).toContain('Forbidden');
    });
    it("deletes only the requesting account with cascade and prevents stale-token writes", () => {
      expect(() => sql("select public.kc_delete_account();", admin)).toThrow(
        /Transfer administration/,
      );
      sql("select public.kc_delete_account();", a);
      expect(sql(`select count(*) from auth.users where id='${b}';`)).toBe("1");
      expect(
        sql(`select count(*) from public.kc_attempts where user_id='${a}';`),
      ).toBe("0");
      expect(
        sql(
          `select count(*) from public.kc_entitlements where user_id='${a}';`,
        ),
      ).toBe("0");
      expect(sql(`select public.kc_has_capability('practice');`, a)).toBe("f");
      expect(() =>
        sql(`insert into public.kc_profiles values('${a}','Stale token');`, a),
      ).toThrow(/foreign key/);
    });
  },
);
