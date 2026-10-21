import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {localStack} from './local-stack.mjs';

const settings=localStack();
const inbox=new URL(settings.MAILPIT_URL||settings.INBUCKET_URL);
assert.equal(inbox.hostname,'127.0.0.1');assert.equal(inbox.protocol,'http:');
const store=new Map();
const make=(storage=new Map())=>createClient(settings.API_URL,settings.PUBLISHABLE_KEY||settings.ANON_KEY,{auth:{flowType:'pkce',detectSessionInUrl:false,autoRefreshToken:false,persistSession:true,storage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}}});
const client=make(store);
const email=`recovery-${randomUUID()}@kazicoach.test`,password='LocalRecoveryTest123!';
const created=await client.auth.signUp({email,password});assert.equal(created.error,null);
const id=created.data.user.id;const oldRefresh=created.data.session.refresh_token;
try {
  await client.auth.signOut({scope:'local'});
  const sent=await client.auth.resetPasswordForEmail(email,{redirectTo:'http://127.0.0.1:5173/?kc_recovery=1'});assert.equal(sent.error,null);
  let message;
  for(let attempt=0;attempt<20;attempt++) {
    const search=new URL('/api/v1/search',inbox);search.searchParams.set('query',`to:${email}`);
    const found=await (await fetch(search)).json();
    const entry=found.messages?.find(row=>row.To?.some(to=>to.Address===email));
    if(entry){message=await (await fetch(new URL(`/api/v1/message/${entry.ID}`,inbox))).json();break;}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert.ok(message,'Local recovery email not received');
  const links=[...(message.Text||message.HTML||'').matchAll(/https?:\/\/[^\s<>"']+/g)].map(match=>match[0].replaceAll('&amp;','&'));
  const verification=links.map(link=>new URL(link)).find(url=>url.pathname==='/auth/v1/verify');
  assert.ok(verification,'Local recovery verification link missing');assert.equal(verification.origin,settings.API_URL);
  const redirect=await fetch(verification,{redirect:'manual'});assert.ok(redirect.status>=300&&redirect.status<400);
  const callback=new URL(redirect.headers.get('location'));assert.equal(callback.origin,'http://127.0.0.1:5173');
  assert.equal(callback.searchParams.get('kc_recovery'),'1');const code=callback.searchParams.get('code');assert.ok(code);
  const wrongBrowser=make();assert.ok((await wrongBrowser.auth.exchangeCodeForSession(code)).error,'Missing PKCE verifier must fail');await wrongBrowser.auth.signOut({scope:'local'});
  let recoveryEvent=false;const listener=client.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')recoveryEvent=true;});
  const exchanged=await client.auth.exchangeCodeForSession(code);assert.equal(exchanged.error,null);assert.equal(exchanged.data.user.id,id);assert.equal(recoveryEvent,true);listener.data.subscription.unsubscribe();
  assert.equal((await client.auth.updateUser({password:'ChangedLocalRecovery123!'})).error,null);
  assert.equal((await client.auth.signOut({scope:'global'})).error,null);
  const other=make();assert.ok((await other.auth.refreshSession({refresh_token:oldRefresh})).error,'Old refresh token must fail');
  assert.ok((await other.auth.signInWithPassword({email,password})).error,'Old password must fail');
  assert.equal((await client.auth.signInWithPassword({email,password:'ChangedLocalRecovery123!'})).error,null);
  assert.ok((await other.auth.exchangeCodeForSession(code)).error,'Used code must not be reusable');
  await other.auth.signOut({scope:'local'});
  console.log('Local recovery passed: synthetic inbox delivery, exact callback, PKCE wrong-browser denial, recovery event, password replacement, old-password/refresh denial and used-code denial. No hosted email/provider used.');
} finally {
  const user=await client.auth.getUser();
  if(user.data.user?.id!==id)await client.auth.signInWithPassword({email,password:'ChangedLocalRecovery123!'});
  const current=await client.auth.getUser();
  if(current.data.user?.id===id)assert.equal((await client.rpc('kc_delete_account')).error,null);
  else throw new Error('Recovery fixture requires manual cleanup; no unrelated identity was removed');
  await client.auth.signOut({scope:'local'});
}
