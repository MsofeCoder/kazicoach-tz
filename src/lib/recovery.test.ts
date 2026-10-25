import {describe,it,expect,vi} from 'vitest';
import {createClient} from '@supabase/supabase-js';
import {guardedRecovery,recoveryCooldownKey,recoveryWait} from './recovery';

function storage(){const rows=new Map<string,string>();return {rows,getItem:(key:string)=>rows.get(key)??null,setItem:(key:string,value:string)=>{rows.set(key,value);}};}

describe('recovery resend protection',()=>{
  it('blocks a second SDK invocation across component or page reloads',async()=>{
    const saved=storage(),send=vi.fn(async()=>({error:null}));
    expect((await guardedRecovery(send,saved,false,1000)).tone).toBe('success');
    expect((await guardedRecovery(send,saved,false,11000)).tone).toBe('info');
    expect(send).toHaveBeenCalledTimes(1);
    expect(recoveryWait(saved,11000)).toBe(55);
    expect([...saved.rows.keys()]).toEqual([recoveryCooldownKey]);
  });
  it('allows a new request after cooldown',async()=>{
    const saved=storage(),send=vi.fn(async()=>({error:null}));
    await guardedRecovery(send,saved,false,1000);
    await guardedRecovery(send,saved,false,66000);
    expect(send).toHaveBeenCalledTimes(2);
  });
  it('retains cooldown after provider failure',async()=>{
    const saved=storage(),send=vi.fn(async()=>({error:{status:429}}));
    expect((await guardedRecovery(send,saved,false,1000)).tone).toBe('error');
    expect((await guardedRecovery(send,saved,false,2000)).tone).toBe('info');
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('handles invalid stored timestamps',()=>{
    const saved=storage();saved.setItem(recoveryCooldownKey,'not-a-timestamp');
    expect(recoveryWait(saved,1000)).toBe(0);
  });
  it('reproduces SDK verifier loss after a rate-limited retry using mocked HTTP only',async()=>{
    const rows=new Map<string,string>();let calls=0;
    const fakeFetch=vi.fn(async()=>{calls++;return new Response(JSON.stringify(calls===1?{}:{code:'over_email_send_rate_limit',msg:'Too many requests'}),{status:calls===1?200:429,headers:{'Content-Type':'application/json'}});});
    const client=createClient('https://diagnostic.invalid','synthetic-public-key',{
      auth:{storageKey:'diagnostic',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,flowType:'pkce',storage:{getItem:key=>rows.get(key)??null,setItem:(key,value)=>{rows.set(key,value);},removeItem:key=>{rows.delete(key);}}},global:{fetch:fakeFetch}});
    await client.auth.resetPasswordForEmail('synthetic@diagnostic.invalid');
    expect(rows.has('diagnostic-code-verifier')).toBe(true);
    expect((await client.auth.resetPasswordForEmail('synthetic@diagnostic.invalid')).error?.status).toBe(429);
    expect(rows.has('diagnostic-code-verifier')).toBe(false);
    expect((await client.auth.exchangeCodeForSession('synthetic-code')).error?.name).toBe('AuthPKCECodeVerifierMissingError');
    expect(fakeFetch).toHaveBeenCalledTimes(2);
  });
});
