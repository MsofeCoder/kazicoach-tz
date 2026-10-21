import { localOwnerMfa } from './local-mfa.mjs';
import { localStack } from './local-stack.mjs';
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const config = localStack();
const make = () =>
  createClient(config.API_URL, config.PUBLISHABLE_KEY || config.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const owner = make(),
  a = make(),
  b = make(),
  anon = make(),
  disposable = make();
for (const [client, name] of [[owner, "owner"]]) {
  const { error } = await client.auth.signInWithPassword({
    email: `${name}@kazicoach.test`,
    password: "LocalReview123!",
  });
  assert.equal(error, null, "Run npm run preview:setup first");
}
assert.equal((await owner.rpc('kc_is_admin')).data,true,'Local owner role missing');
assert.ok((await owner.rpc('kc_admin_overview')).error,'Password-only owner must not read admin overview');
assert.ok((await owner.rpc('kc_set_contact',{phone:'255688010595'})).error,'Password-only owner must not change settings');
await localOwnerMfa(owner);
assert.equal((await owner.rpc('kc_admin_overview')).error,null,'Verified owner MFA should unlock admin overview');
// Do not reuse the review learners: owner UAT may have profiles/testimonials there.
for(const [client,label] of [[a,'a'],[b,'b']]) {
  const created=await client.auth.signUp({email:`integration-${label}-${randomUUID()}@kazicoach.test`,password:'LocalReview123!'});
  assert.equal(created.error,null,'Could not create disposable integration learner');
}
const aid = (await a.auth.getUser()).data.user.id;
const id = randomUUID();
let testimonialId;
try {
  // Neither editable JWT metadata nor direct API calls confer privileged roles.
  const originalMetadata=(await a.auth.getUser()).data.user.user_metadata;
  assert.equal((await a.auth.updateUser({data:{premium:true,role:'super_admin'}})).error,null);
  assert.equal((await a.rpc('kc_is_admin')).data,false);
  assert.ok((await a.rpc('kc_set_contact',{phone:'255688010595'})).error);
  assert.ok((await anon.rpc('kc_set_contact',{phone:'255688010595'})).error);
  assert.equal((await a.auth.updateUser({data:{...originalMetadata,premium:null,role:null}})).error,null);
  const beforeContact=(await owner.from('kc_settings').select('whatsapp').single()).data.whatsapp;
  assert.equal((await owner.rpc('kc_set_contact',{phone:beforeContact})).error,null);
  const afterContact=(await owner.rpc('kc_admin_overview')).data.audit.find(entry=>entry.action==='contact');
  assert.equal(afterContact.details.whatsapp,beforeContact);
  assert.equal(afterContact.details.previous_whatsapp,beforeContact);
  assert.equal(
    (
      await a
        .from("kc_profiles")
        .upsert({ user_id: aid, display_name: "Local integration fixture" })
    ).error,
    null,
  );
  assert.deepEqual(
    (await b.from("kc_profiles").select("*").eq("user_id", aid)).data,
    [],
  );
  assert.ok((await anon.from("kc_profiles").select("*")).error);
  assert.ok(
    (
      await a.rpc("kc_admin_action", {
        action: "activate",
        target: aid,
        payload: { package_id: "plus" },
      })
    ).error,
  );
  assert.equal(
    (
      await owner.rpc("kc_admin_action", {
        action: "activate",
        target: aid,
        payload: { package_id: "basic" },
      })
    ).error,
    null,
  );
  assert.equal(
    (await a.rpc("kc_has_capability", { capability: "practice" })).data,
    true,
  );
  assert.ok((await a.rpc("kc_advanced_progress")).error);
  const row = {
    user_id: aid,
    id,
    question_id: "local-api-fixture",
    category: "role",
    mode: "oral",
    score: 80,
    duration_seconds: 20,
    created_at: new Date().toISOString(),
  };
  for (let n = 0; n < 2; n++)
    assert.equal(
      (
        await a
          .from("kc_attempts")
          .upsert(row, { onConflict: "user_id,id", ignoreDuplicates: true })
      ).error,
      null,
    );
  assert.equal(
    (await a.from("kc_attempts").select("*").eq("id", id)).data.length,
    1,
  );
  assert.deepEqual(
    (await b.from("kc_attempts").select("*").eq("id", id)).data,
    [],
  );
  assert.equal(
    (
      await owner.rpc("kc_admin_action", {
        action: "activate",
        target: aid,
        payload: { package_id: "plus" },
      })
    ).error,
    null,
  );
  assert.ok(Array.isArray((await a.rpc("kc_advanced_progress")).data));
  // Downgrades replace the same row and remove Plus rights immediately.
  assert.equal((await owner.rpc('kc_admin_action',{action:'activate',target:aid,payload:{package_id:'basic'}})).error,null);
  assert.ok((await a.rpc('kc_advanced_progress')).error);
  assert.equal((await a.rpc('kc_has_capability',{capability:'practice'})).data,true);
  assert.equal((await a.from('kc_entitlements').select('*')).data.length,1);
  assert.deepEqual((await b.from('kc_entitlements').select('*')).data,[]);
  assert.equal((await owner.rpc('kc_admin_action',{action:'revoke',target:aid,payload:{}})).error,null);
  assert.equal((await a.rpc('kc_has_capability',{capability:'practice'})).data,false);
  assert.ok((await a.rpc('kc_consume_cloud_request')).error);
  assert.equal((await owner.rpc('kc_admin_action',{action:'activate',target:aid,payload:{package_id:'plus'}})).error,null);
  const submitted = await a
    .from("kc_testimonials")
    .insert({
      user_id: aid,
      display_name: "Local fixture",
      body: "This is a disposable local moderation test.",
    })
    .select("id")
    .single();
  assert.equal(submitted.error, null);
  testimonialId = submitted.data.id;
  assert.ok(
    !(await anon.rpc("kc_public_testimonials")).data.some(
      (t) => t.id === testimonialId,
    ),
  );
  assert.equal(
    (
      await owner.rpc("kc_admin_action", {
        action: "moderate",
        target: testimonialId,
        payload: { status: "approved" },
      })
    ).error,
    null,
  );
  const publication = (await anon.rpc("kc_public_testimonials")).data.find(
    (t) => t.id === testimonialId,
  );
  assert.deepEqual(
    Object.keys(publication).sort(),
    ["id", "display_name", "body"].sort(),
  );
  assert.equal(
    (await a.from("kc_testimonials").delete().eq("id", testimonialId)).error,
    null,
  );
  assert.ok(
    !(await anon.rpc("kc_public_testimonials")).data.some(
      (t) => t.id === testimonialId,
    ),
  );
  const created = await disposable.auth.signUp({
    email: `delete-${randomUUID()}@kazicoach.test`,
    password: "LocalReview123!",
  });
  assert.equal(created.error, null);
  const uid = created.data.user.id;
  assert.equal(
    (
      await disposable
        .from("kc_profiles")
        .insert({ user_id: uid, display_name: "Disposable local account" })
    ).error,
    null,
  );
  assert.equal((await disposable.rpc("kc_delete_account")).error, null);
  assert.deepEqual((await disposable.from("kc_profiles").select("*")).data, []);
  assert.ok(
    (
      await disposable
        .from("kc_profiles")
        .insert({ user_id: uid, display_name: "Stale token" })
    ).error,
  );
  console.log(
    "Local Auth + PostgREST passed: two-user isolation, anonymous denial, duplicate sync, Basic/Plus boundaries, moderation, withdrawal, cascading deletion and stale-token denial.",
  );
} finally {
  await a.from("kc_attempts").delete().eq("id", id);
  if (testimonialId)
    await a.from("kc_testimonials").delete().eq("id", testimonialId);
  await a.from("kc_profiles").delete().eq("user_id", aid);
  await owner.rpc("kc_admin_action", {
    action: "revoke",
    target: aid,
    payload: {},
  });
  await disposable.rpc("kc_delete_account");
  await a.rpc('kc_delete_account');
  await b.rpc('kc_delete_account');
  for (const client of [owner, a, b, disposable]) await client.auth.signOut();
}
