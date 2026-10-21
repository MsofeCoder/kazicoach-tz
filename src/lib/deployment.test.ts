import {describe,expect,it,vi} from 'vitest';
import {canonicalHttpsOrigin,hostedEndpoint,securityHeaders} from './deployment';
import {hostedCloudConfig} from './cloud';
import {premiumAccess} from '../../functions/lib/access';
const app='https://coach.example.org',endpoint='https://abcdefghijklmnopqrst.supabase.co',key='sb_publishable_'+'a'.repeat(24);
describe('explicit hosted configuration',()=>{
  it('permits only the exact HTTPS release origin and Supabase endpoint with a public key',()=>{
    expect(hostedCloudConfig(endpoint,key,app,app)).toEqual({url:endpoint,key});
    expect(hostedCloudConfig(endpoint,key,'https://preview.example.org',app)).toBeNull();
    expect(hostedCloudConfig(endpoint,'sb_secret_'+'a'.repeat(24),app,app)).toBeNull();
    expect(hostedCloudConfig('https://attacker.invalid',key,app,app)).toBeNull();
  });
  it.each(['http://coach.example.org','https://user:pass@coach.example.org','https://coach.example.org/path','https://coach.example.org/?x=1','https://coach.example.org/#x','https://localhost'])('rejects unsafe origin %s',origin=>expect(canonicalHttpsOrigin(origin)).toBeNull());
  it('generates a constrained CSP without wildcard connections or inline scripts',()=>{
    expect(securityHeaders(endpoint)['Content-Security-Policy']).toContain(`connect-src 'self' ${endpoint}`);
    expect(securityHeaders('https://attacker.invalid')['Content-Security-Policy']).not.toContain('attacker');
    expect(hostedEndpoint(endpoint+'/extra')).toBeNull();
  });
  it('checks hosted authorization with a caller JWT and fails before networking for unapproved origins',async()=>{
    const env={ACCOUNTS_MODE:'hosted',APP_ORIGIN:app,SUPABASE_URL:endpoint,SUPABASE_PUBLISHABLE_KEY:key};
    const send=vi.fn<typeof fetch>().mockResolvedValue(new Response('true'));
    const request=new Request(app+'/api/generate',{headers:{authorization:'Bearer aaa.bbb.ccc'}});
    expect(await premiumAccess(request,env,send)).toBeNull();
    expect(String(send.mock.calls[0][0])).toBe(endpoint+'/rest/v1/rpc/kc_consume_cloud_request');
    send.mockClear();
    expect((await premiumAccess(new Request('https://attacker.invalid/api/generate'),env,send))?.status).toBe(503);expect(send).not.toHaveBeenCalled();
  });
});
