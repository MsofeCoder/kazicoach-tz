import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
const base={...process.env,KAZICOACH_RELEASE_ACCOUNTS:'true',KAZICOACH_RELEASE_APP_ORIGIN:'https://release-test.invalid',KAZICOACH_RELEASE_SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co',KAZICOACH_RELEASE_PUBLISHABLE_KEY:'sb_publishable_'+'x'.repeat(32)};
function run(command,env){
  return process.platform==='win32'
    ? spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c',command],{env,encoding:'utf8'})
    : spawnSync('npm',command.split(' ').slice(1),{env,encoding:'utf8'});
}
try {
  assert.notEqual(run('npm run build',{...base,KAZICOACH_RELEASE_SUPABASE_URL:'http://127.0.0.1:57251'}).status,0,'Hosted build must reject local endpoints');
  assert.equal(run('npm run build',base).status,0,'Synthetic hosted configuration build failed');
  assert.equal(run('npm run audit:release',base).status,0,'Hosted release isolation failed');
  const scripts=readdirSync('dist/assets').filter(name=>name.endsWith('.js')).map(name=>readFileSync('dist/assets/'+name,'utf8')).join('\n');
  assert.ok(scripts.includes(base.KAZICOACH_RELEASE_SUPABASE_URL));assert.ok(scripts.includes(base.KAZICOACH_RELEASE_APP_ORIGIN));
  assert.ok(readFileSync('dist/_headers','utf8').includes("connect-src 'self' "+base.KAZICOACH_RELEASE_SUPABASE_URL));
  console.log('Release configuration passed: invalid endpoint rejected, synthetic hosted build/CSP/artifact audit verified without contacting any hosted endpoint.');
} finally {
  assert.equal(run('npm run build',{...process.env,KAZICOACH_RELEASE_ACCOUNTS:'false'}).status,0,'Could not restore default private build');
  console.log('Default sanitized private-mode build restored.');
}
