import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {localStack} from './local-stack.mjs';
import {localTotp} from './local-mfa.mjs';
const settings=localStack();
const fixture=JSON.parse(readFileSync('.local-review/owner-mfa.json','utf8'));
const client=createClient(settings.API_URL,settings.PUBLISHABLE_KEY||settings.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await client.auth.signInWithPassword({email:'owner@kazicoach.test',password:'LocalReview123!'});
try {
  if(error||data.user.id!==fixture.user_id||fixture.origin!==settings.API_URL)throw new Error('Matching synthetic local owner fixture required');
  console.log('Synthetic local owner only; do not save in reports or screenshots. Current authenticator code:');
  console.log(localTotp(fixture.secret));
} finally {await client.auth.signOut({scope:'local'});}
