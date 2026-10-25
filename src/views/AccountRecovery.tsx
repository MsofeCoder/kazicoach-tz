import {useEffect,useId,useRef,useState} from 'react';
import {cloud} from '../lib/cloud';
import PasswordField from './PasswordField';

// Explicit PKCE callback only. The SDK verifies the verifier; recovery intent is checked too.
export function AccountRecovery() {
  const started=useRef(false);
  const [active,setActive]=useState(()=>{const url=new URL(location.href);return url.searchParams.get('kc_recovery')==='1'||url.searchParams.get('kc_auth')==='1';});
  const [ready,setReady]=useState(false);
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [message,setMessage]=useState('Checking your recovery link…');
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
        setMessage('Recovery link is invalid, expired, already used or opened in a different browser. Request a new link.');
      } else if(recovery) {setReady(true);setMessage('Choose a new password. Never share this link or your password with support.');}
      else {setMessage('Email confirmed. Your account is signed in.');}
    }).catch(()=>setMessage('Recovery could not complete. Request a new link.')).finally(()=>listener.subscription.unsubscribe());
  },[active]);
  if(!active)return null;
  async function submit(event:React.FormEvent) {
    event.preventDefault();if(!cloud||!ready||password!==confirmation)return;
    setBusy(true);
    try {
      const {error}=await cloud.auth.updateUser({password});if(error)throw error;
      const signedOut=await cloud.auth.signOut({scope:'global'});
      setReady(false);setPassword('');setConfirmation('');
      setMessage(signedOut.error?'Password updated. Session sign-out needs a retry before continuing.':'Password updated. Sign in again from Settings. Existing browser-private materials were preserved.');
    } catch {setMessage('Password update did not complete. Use a new link or retry with a stronger password.');}
    finally {setBusy(false);}
  }
  return <section className="panel settings-section" aria-label="Account recovery"><h2>Recover your account</h2><p role="status">{message}</p>
    {ready&&<form className="account-form" onSubmit={event=>void submit(event)}>
      <PasswordField label="New password" autoComplete="new-password" minLength={12} required value={password} onChange={event=>setPassword(event.target.value)}/>
      <PasswordField label="Confirm password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={event=>setConfirmation(event.target.value)}/>
      <button className="button primary" disabled={busy||password!==confirmation}>Save new password</button>
    </form>}
    {!ready&&<button className="button secondary" onClick={()=>setActive(false)}>Close recovery</button>}
  </section>;
}

export function RecoveryRequest({ initialEmail = '' }: { initialEmail?: string }) {
  const [open,setOpen]=useState(false);
  const formId=useId();
  const emailInput=useRef<HTMLInputElement>(null);
  const [email,setEmail]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  useEffect(()=>{if(open)emailInput.current?.focus();},[open]);
  if(!cloud)return null;
  return <div className="recovery-request"><button type="button" className="button secondary recovery-toggle" aria-expanded={open} aria-controls={formId} onClick={()=>{
    if(!open){setEmail(initialEmail.trim());setMessage('');}setOpen(current=>!current);
  }}>Forgot password?</button>{open&&<section id={formId} className="recovery-request-body" aria-label="Request password reset"><h3>Reset your password</h3><p>Enter your account email. We’ll send a link to choose a new password. Open it in this browser.</p><form className="account-form" onSubmit={event=>{
    event.preventDefault();if(busy)return;setBusy(true);
    const redirect=new URL(location.pathname,location.origin);redirect.searchParams.set('kc_recovery','1');
    void cloud!.auth.resetPasswordForEmail(email.trim(),{redirectTo:redirect.href}).catch(()=>null).finally(()=>{
      setEmail('');setMessage('If this address has an eligible account, recovery instructions will be sent. Open the link in this browser.');setBusy(false);
    });
  }}><label>Account email<input ref={emailInput} type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={event=>setEmail(event.target.value)}/></label><button className="button primary" disabled={busy}>{busy?'Sending…':'Send reset link'}</button><p role="status" aria-live="polite">{message}</p></form></section>}</div>;
}
