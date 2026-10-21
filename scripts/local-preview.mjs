import { localOwnerMfa } from './local-mfa.mjs';
import { localStack } from './local-stack.mjs';
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// This script has no remote mode. Never print CLI status: it includes privileged local keys.
const branch = spawnSync("git", ["branch", "--show-current"], {
  encoding: "utf8",
}).stdout.trim();
if (branch !== "feature/kazicoach-v2")
  throw new Error("Switch to feature/kazicoach-v2 first.");
const settings = localStack();
const key = settings.PUBLISHABLE_KEY || settings.ANON_KEY;
const client = createClient(settings.API_URL, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const ids = {};
for (const name of ["owner", "learner", "other"]) {
  const email = `${name}@kazicoach.test`;
  const credentials = { email, password: "LocalReview123!" };
  let result = await client.auth.signInWithPassword(credentials);
  if (result.error) result = await client.auth.signUp(credentials);
  if (result.error || !result.data.user)
    throw new Error(
      `Could not create local ${name} review account. Check local auth configuration.`,
    );
  ids[name] = result.data.user.id;
  if (!/^[0-9a-f-]{36}$/.test(ids[name]))
    throw new Error("Invalid local account ID");
  await client.auth.signOut();
}
const query = `do $$ begin
  if not exists(select 1 from kc_private.admins) then
    insert into kc_private.admins values('${ids.owner}');
    insert into kc_private.audit(actor_id,action,target,details)
      values('${ids.owner}','bootstrap_admin','${ids.owner}','{"environment":"local-review"}');
  elsif not exists(select 1 from kc_private.admins where user_id='${ids.owner}') then
    raise exception 'Existing administrator differs; do not replace it automatically';
  end if;
end $$;`;
const bootstrap = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    "supabase_db_kazicoach-tz",
    "psql",
    "-U",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-q",
  ],
  { input: query, encoding: "utf8" },
);
if (bootstrap.status !== 0)
  throw new Error(
    "Local administrator bootstrap failed. No remote bootstrap is supported.",
  );
// Approved public business contact; never overwrite subsequent admin changes.
const ownerLogin=await client.auth.signInWithPassword({email:'owner@kazicoach.test',password:'LocalReview123!'});
if(ownerLogin.error) throw new Error('Cannot authenticate the local review administrator.');
await localOwnerMfa(client);
const contact=await client.from('kc_settings').select('whatsapp').single();
if(contact.error) throw new Error('Cannot read local contact settings.');
if(contact.data.whatsapp==='') {
  const configured=await client.rpc('kc_set_contact',{phone:'255688010595'});
  if(configured.error) throw new Error('Could not configure the approved business contact through the audited admin RPC.');
}
await client.auth.signOut();
if (existsSync('.env.local')) {
  const existing=readFileSync('.env.local','utf8');
  const existingUrl=existing.match(/^VITE_SUPABASE_URL=(.*)$/m)?.[1]?.trim();
  if(existingUrl!==settings.API_URL) throw new Error('Existing local environment targets a different endpoint; review it explicitly before setup.');
  // Local CLI publishable keys can rotate when the preserved stack restarts.
  const updated=existing.replace(/^VITE_SUPABASE_PUBLISHABLE_KEY=.*$/m,`VITE_SUPABASE_PUBLISHABLE_KEY=${key}`);
  if(updated===existing&&!existing.includes(`VITE_SUPABASE_PUBLISHABLE_KEY=${key}`)) throw new Error('Local publishable key setting is missing');
  writeFileSync('.env.local',updated);
} else
  writeFileSync(
    ".env.local",
    `# Generated for local review only; ignored by git.\nVITE_LOCAL_ACCOUNTS=true\nVITE_SUPABASE_URL=${settings.API_URL}\nVITE_SUPABASE_PUBLISHABLE_KEY=${key}\n`,
    { flag: "wx" },
  );
console.log(
  "Local review accounts ready: owner@kazicoach.test (Super Admin), learner@kazicoach.test, other@kazicoach.test.",
);
console.log("Local-only demo password: LocalReview123!");
console.log(
  "Run npm run dev; open http://127.0.0.1:5173. Existing local settings were preserved; the matching local public key was refreshed.",
);
