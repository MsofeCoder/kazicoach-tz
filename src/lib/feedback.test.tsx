import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {authFailure,requestRecovery} from './feedback';
import ActionNotice from '../views/ActionNotice';

describe('account action feedback',()=>{
  it('distinguishes local credentials from staging accounts',()=>{
    expect(authFailure({code:'invalid_credentials',status:400},true).message).toContain('staging');
    expect(authFailure({code:'invalid_credentials',status:400}).message).toContain('Forgot password?');
  });
  it('identifies connection failures without exposing raw provider content',()=>{
    const notice=authFailure({name:'AuthRetryableFetchError',message:'password=private token=secret'},true);
    expect(notice.message).toContain('local test account service');
    expect(JSON.stringify(notice)).not.toMatch(/private token|password=|secret/);
  });
  it('gives next steps for unconfirmed email and rate limits',()=>{
    expect(authFailure({code:'email_not_confirmed',status:400}).message).toContain('Confirm your email');
    expect(authFailure({status:429}).message).toContain('Wait a few minutes');
  });
  it('does not report a rejected reset request as success',async()=>{
    expect((await requestRecovery(async()=>({error:{status:500}}))).tone).toBe('error');
  });
  it('does not report a thrown network failure as success',async()=>{
    expect((await requestRecovery(async()=>{throw new TypeError('Failed to fetch');},true)).tone).toBe('error');
  });
  it('keeps accepted reset responses non-enumerating',async()=>{
    const notice=await requestRecovery(async()=>({error:null}));
    expect(notice.tone).toBe('success');
    expect(notice.message).toContain('If this email has an eligible account');
  });
  it('explains the synthetic inbox for local requests',async()=>{
    expect((await requestRecovery(async()=>({error:null}),true)).message).toContain('No real email is sent');
  });
  it('announces errors as alerts and successful actions as status',()=>{
    expect(renderToStaticMarkup(<ActionNotice notice={authFailure({status:500})}/>)).toContain('role="alert"');
    expect(renderToStaticMarkup(<ActionNotice notice={{tone:'success',title:'Saved',message:'Done'}}/>)).toContain('role="status"');
    expect(renderToStaticMarkup(<ActionNotice notice={null}/>)).toBe('');
  });
});
