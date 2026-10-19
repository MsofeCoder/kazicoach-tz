import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

const result=process.platform==='win32'?spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c','supabase status --output json'],{encoding:'utf8'}):spawnSync('supabase',['status','--output','json'],{encoding:'utf8'});
if(result.status!==0) throw new Error('Local Supabase must be running');
const config=JSON.parse(result.stdout);
if(config.API_URL!=='http://127.0.0.1:57421') throw new Error('This fixture helper permits only the isolated local test stack');
const make=()=>createClient(config.API_URL,config.PUBLISHABLE_KEY||config.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const file='.local-review/mobile-uat.json';
if(process.argv.includes('--cleanup')) {
  const fixtures=JSON.parse(readFileSync(file,'utf8'));
  for(const fixture of fixtures) {
    if(!/^uat-(basic|plus)-[0-9a-f-]+@kazicoach\.test$/.test(fixture.email)) throw new Error('Refusing to remove a non-fixture account');
    const client=make();
    const signed=await client.auth.signInWithPassword({email:fixture.email,password:'LocalReview123!'});
    if(signed.error||signed.data.user.id!==fixture.id) throw new Error('Cannot verify disposable fixture identity');
    const deleted=await client.rpc('kc_delete_account');
    if(deleted.error) throw new Error('Disposable fixture cleanup failed');
    await client.auth.signOut({scope:'local'});
  }
  unlinkSync(file); console.log('Disposable mobile UAT accounts deleted; existing review accounts preserved.');
} else {
  const owner=make();
  if((await owner.auth.signInWithPassword({email:'owner@kazicoach.test',password:'LocalReview123!'})).error) throw new Error('Local review administrator unavailable');
  const fixtures=[];
  for(const tier of ['basic','plus']) {
    const client=make(); const email=`uat-${tier}-${randomUUID()}@kazicoach.test`;
    const created=await client.auth.signUp({email,password:'LocalReview123!'});
    if(created.error||!created.data.user) throw new Error('Cannot create disposable UAT account');
    const fixture={tier,email,id:created.data.user.id}; fixtures.push(fixture);
    mkdirSync('.local-review',{recursive:true}); writeFileSync(file,JSON.stringify(fixtures,null,2));
    const activation=await owner.rpc('kc_admin_action',{action:'activate',target:fixture.id,payload:{package_id:tier}});
    if(activation.error) throw new Error('Cannot activate disposable UAT package');
    await client.auth.signOut();
  }
  await owner.auth.signOut(); console.log('Disposable local UAT accounts prepared; details stored in ignored .local-review/mobile-uat.json.');
}
