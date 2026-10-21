import {readFileSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

function files(dir){return readdirSync(dir).flatMap(name=>{const path=`${dir}/${name}`;return statSync(path).isDirectory()?files(path):[path];});}
const artifacts=files('dist');
const denied=[
  ['bundled candidate personal content',/Nyunyusa|Twaha Mrisho|Bugando|Don Bosco|Ocean Road|\bORCI\b|12-page application|2019–2024/i],
  ['review accounts',/@kazicoach\.test|uat-(?:basic|plus)-|integration-[ab]-/i],
  ['test password',/LocalReview123!/],
  ['review fixture testimonials',/This is a disposable local moderation test\.|Useful preparation tool\.|Spoofed testimonial|Local integration fixture/],
  ['privileged key',/sb_secret_[A-Za-z0-9_-]{20,}/],
  ['review publishable key',/sb_publishable_[A-Za-z0-9_-]{20,}/],
  ['local review endpoint',/(?:127\.0\.0\.1|localhost):(?:57421|57251)/],
  ['local bootstrap tooling',/bootstrap_admin|mobile-uat-fixtures|preview:setup/],
];
// Scan exact configured local values too, without printing key material.
try {
  const env=readFileSync('.env.local','utf8');
  for(const line of env.split(/\r?\n/)) {
    const match=line.match(/^VITE_SUPABASE_(?:URL|PUBLISHABLE_KEY)=(.+)$/);
    if(match&&match[1].length>10) denied.push(['configured local value',match[1].trim().replace(/^['"]|['"]$/g,'')]);
  }
} catch(error){if(error.code!=='ENOENT')throw error;}
for(const file of artifacts){
  assert.ok(!/\.map$|\.env|(^|\/)(scripts|tests|supabase|docs)\//.test(file),`Forbidden release artifact: ${file}`);
  const content=readFileSync(file,'utf8').replaceAll(process.env.KAZICOACH_RELEASE_ACCOUNTS==='true' ? (process.env.KAZICOACH_RELEASE_PUBLISHABLE_KEY || 'UNSET_RELEASE_KEY') : 'UNSET_RELEASE_KEY','PUBLIC_RELEASE_KEY');
  for(const [label,pattern] of denied)assert.ok(typeof pattern==='string'?!content.includes(pattern):!pattern.test(content),`Release audit failed: ${label} in ${file}`);
}
const inventory=artifacts.map(file=>({file,bytes:statSync(file).size,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}));
console.log(JSON.stringify({status:'PASS',checks:denied.map(([label])=>label),files:inventory},null,2));
