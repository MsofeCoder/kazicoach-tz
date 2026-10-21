import {createHmac} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';

// Disposable local owner only. No real owner email, remote URL, seed or recovery bypass.
export async function localOwnerMfa(client) {
  const {data:{user}} = await client.auth.getUser();
  if (user?.email !== 'owner@kazicoach.test' || !/^http:\/\/127\.0\.0\.1:\d+$/.test(client.supabaseUrl))
    throw new Error('Synthetic local owner required for MFA fixtures');
  const file='.local-review/owner-mfa.json';
  let fixture;
  try { fixture=JSON.parse(readFileSync(file,'utf8')); } catch (error) { if(error.code!=='ENOENT')throw error; }
  if (!fixture || fixture.user_id!==user.id || fixture.origin!==client.supabaseUrl) {
    const factors=await client.auth.mfa.listFactors();
    if (factors.error || factors.data.all.some(f=>f.status==='verified')) throw new Error('Existing MFA requires manual authentication; refusing to replace it');
    const enrolled=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Disposable local QA'});
    if (enrolled.error) throw new Error('Local MFA enrollment failed');
    fixture={user_id:user.id,origin:client.supabaseUrl,id:enrolled.data.id,secret:enrolled.data.totp.secret};
    mkdirSync('.local-review',{recursive:true});writeFileSync(file,JSON.stringify(fixture));
  }
  const code=localTotp(fixture.secret);
  const verified=await client.auth.mfa.challengeAndVerify({factorId:fixture.id,code});
  if(verified.error)throw new Error('Local MFA verification failed');
}
export function localTotp(secret) {
  let bits='';for(const c of secret.toUpperCase().replace(/=+$/,'')) {
    const value='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c);if(value<0)throw new Error('Invalid local MFA fixture');bits+=value.toString(2).padStart(5,'0');
  }
  const key=Buffer.from(bits.match(/.{8}/g).map(b=>parseInt(b,2)));
  const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
  const digest=createHmac('sha1',key).update(counter).digest();const offset=digest[19]&15;
  return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
}
