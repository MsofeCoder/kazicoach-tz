import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

// Fresh disposable PostgreSQL. No ports, connection strings, linked projects or secrets.
const container = `kazicoach-rls-${process.pid}-${Date.now()}`;
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
    ? `set role ${role}; set request.jwt.claim.sub='${user}';`
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
    "postgres:16-alpine",
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
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    insert into auth.users values('${a}'),('${b}'),('${admin}');`);
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    sql(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  sql(`insert into kc_private.admins values('${admin}');`);
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
    it('restricts contact updates to the admin and audits values atomically',()=>{
      expect(()=>sql("select public.kc_set_contact('255688010595');",a)).toThrow(/Forbidden/);
      expect(()=>sql("update public.kc_settings set whatsapp='255688010595';",a)).toThrow(/permission denied/);
      sql("select public.kc_set_contact('255688010595');",admin);
      expect(sql("select whatsapp from public.kc_settings;",b,'anon')).toBe('255688010595');
      expect(sql("select details->>'previous_whatsapp',details->>'whatsapp' from kc_private.audit where action='contact' order by id desc limit 1;")).toBe('|255688010595');
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
