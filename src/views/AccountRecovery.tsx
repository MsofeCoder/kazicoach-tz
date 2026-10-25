import {useEffect,useId,useRef,useState} from 'react';
import {accountEnvironment,cloud} from '../lib/cloud';
import {authFailure, type Notice, type NoticeTone} from '../lib/feedback';
import {guardedRecovery,recoveryWait} from '../lib/recovery';
import ActionNotice from './ActionNotice';
import PasswordField from './PasswordField';

// Explicit PKCE callback only. The SDK verifies the verifier; recovery intent is checked too.
export function AccountRecovery() {
  const started=useRef(false);
  const [active,setActive]=useState(()=>{const url=new URL(location.href);return url.searchParams.get('kc_recovery')==='1'||url.searchParams.get('kc_auth')==='1';});
  const [ready,setReady]=useState(false);
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [notice,setNotice]=useState<Notice>({tone:'loading',title:'Checking account link',message:'Please wait while we verify this link.'});
  const setMessage=(message:string,tone:NoticeTone='error')=>setNotice({message,tone,title:tone==='success'?'Action completed':tone==='info'?'Choose a new password':'Account recovery'});
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    if(!active||started.current)return;started.current=true;
    const url=new URL(location.href);const code=url.searchParams.get('code');const recovery=url.searchParams.get('kc_recovery')==='1';
    url.searchParams.delete('code');url.searchParams.delete('kc_recovery');url.searchParams.delete('kc_auth');url.hash='';
    history.replaceState(null,'',url.pathname+url.search);
    if(!cloud||!code){setMessage('Recovery link is missing or unavailable. Request a new link from Settings.');return;}
    let recoveryDetected=false;
    const {data:listener}=cloud.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')recoveryDetected=true;});
    void cloud.auth.exchangeCodeForSession(code).then(async({data,error})=>{
      if(error||(recovery&&!recoveryDetected)||!data.session) {
        if(!error)await cloud!.auth.signOut({scope:'local'});
        if(error)setNotice(authFailure(error,accountEnvironment==='local'));
        else setMessage('Recovery link is invalid, expired, already used or opened in a different browser. Request a new link.');
      } else if(recovery) {setReady(true);setMessage('Choose a new password. Never share this link or your password with support.','info');}
      else {setMessage('Email confirmed. Your account is signed in.','success');}
    }).catch(error=>setNotice(authFailure(error,accountEnvironment==='local'))).finally(()=>listener.subscription.unsubscribe());
  },[active]);
  if(!active)return null;
  async function submit(event:React.FormEvent) {
    event.preventDefault();if(!cloud||!ready||busy)return;
    if(password!==confirmation){setMessage('The passwords do not match. Enter the same new password in both fields.');return;}
    setBusy(true);
    setNotice({tone:'loading',title:'Updating password',message:'Please wait while your new password is saved.'});
    try {
      const {error}=await cloud.auth.updateUser({password});if(error)throw error;
      const signedOut=await cloud.auth.signOut({scope:'global'});
      setReady(false);setPassword('');setConfirmation('');
      setMessage(signedOut.error?'Password updated. Session sign-out needs a retry before continuing.':'Password updated. Sign in again from Settings. Existing browser-private materials were preserved.',signedOut.error?'error':'success');
    } catch (error) {setNotice(authFailure(error,accountEnvironment==='local'));}
    finally {setBusy(false);}
  }
  return <section className="panel settings-section" aria-label="Account recovery"><h2>Recover your account</h2><ActionNotice notice={notice}/>
    {ready&&<form className="account-form" onSubmit={event=>void submit(event)}>
      <PasswordField label="New password" autoComplete="new-password" minLength={12} required value={password} onChange={event=>setPassword(event.target.value)}/>
      <PasswordField label="Confirm password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={event=>setConfirmation(event.target.value)}/>
      {confirmation && password!==confirmation && <p className="password-mismatch" role="status">Passwords do not match yet.</p>}
      <button className="button primary" disabled={busy||password!==confirmation}>{busy?'Saving…':'Save new password'}</button>
    </form>}
    {!ready&&<button className="button secondary" onClick={()=>setActive(false)}>Close recovery</button>}
  </section>;
}

export function RecoveryRequest({ initialEmail = '', onOpen }: { initialEmail?: string; onOpen?: () => void }) {
  const [open,setOpen]=useState(false);
  const formId=useId();
  const emailInput=useRef<HTMLInputElement>(null);
  const [email,setEmail]=useState('');const [busy,setBusy]=useState(false);const [notice,setNotice]=useState<Notice|null>(null);
  const memory=useRef(new Map<string,string>());
  const gate=useRef({getItem:(key:string)=>{try{return localStorage.getItem(key)??memory.current.get(key)??null;}catch{return memory.current.get(key)??null;}},setItem:(key:string,value:string)=>{memory.current.set(key,value);try{localStorage.setItem(key,value);}catch{/* Session-only cooldown remains available. */}}});
  const [remaining,setRemaining]=useState(()=>recoveryWait(gate.current));
  useEffect(()=>{if(!open)return;const timer=window.setInterval(()=>setRemaining(recoveryWait(gate.current)),1000);return()=>clearInterval(timer);},[open]);
  useEffect(()=>{if(open)emailInput.current?.focus();},[open]);
  if(!cloud)return null;
  return <div className="recovery-request"><button type="button" className="button secondary recovery-toggle" aria-expanded={open} aria-controls={formId} onClick={()=>{
    if(!open){setEmail(initialEmail.trim());setNotice(null);onOpen?.();}setOpen(current=>!current);
  }}>Forgot password?</button>{open&&<section id={formId} className="recovery-request-body" aria-label="Request password reset"><h3>Reset your password</h3><p>Enter your account email. We’ll send a link to choose a new password. Open it in this browser.</p><form className="account-form" onSubmit={event=>{
    event.preventDefault();if(busy)return;setBusy(true);
    setNotice({tone:'loading',title:'Sending reset request',message:'Please wait while we contact the account service.'});
    const redirect=new URL(location.pathname,location.origin);redirect.searchParams.set('kc_recovery','1');
    void guardedRecovery(()=>cloud!.auth.resetPasswordForEmail(email.trim(),{redirectTo:redirect.href}),gate.current,accountEnvironment==='local').then(result=>{
      setNotice(result);if(result.tone==='success')setEmail('');
    }).finally(()=>{setBusy(false);setRemaining(recoveryWait(gate.current));});
  }}><label>Account email<input ref={emailInput} type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={event=>setEmail(event.target.value)}/></label><button className="button primary" disabled={busy||remaining>0}>{busy?'Sending…':remaining>0?`Wait ${remaining}s`:'Send reset link'}</button></form>{remaining>0&&<p role="status">Wait before requesting another link. Open any recovery email in the same browser and profile.</p>}<ActionNotice notice={notice}/></section>}</div>;
}
