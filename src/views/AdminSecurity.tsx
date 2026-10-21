import {useEffect,useState} from 'react';
import {cloud} from '../lib/cloud';
import {useAccount} from '../accounts';

export function AdminSecurity() {
  const {admin,refresh}=useAccount();
  const [factor,setFactor]=useState('');
  const [qr,setQr]=useState('');
  const [code,setCode]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{if(!admin||!cloud)return;void cloud.auth.mfa.listFactors().then(({data,error})=>{if(!error)setFactor(data.totp[0]?.id||'');});},[admin]);
  if(!admin||!cloud)return null;
  async function enroll() {
    setBusy(true);
    try {
      const {data,error}=await cloud!.auth.mfa.enroll({factorType:'totp',friendlyName:'KaziCoach owner authenticator'});
      if(error)throw error;
      setFactor(data.id);setQr(data.totp.qr_code);setMessage('Scan with your authenticator, then enter its code. Keep your authenticator recovery backup private.');
    } catch {setMessage('Authenticator setup could not complete. Retry or follow the owner recovery procedure.');}
    finally {setBusy(false);}
  }
  async function verify(event:React.FormEvent) {
    event.preventDefault();setBusy(true);
    try {
      const {error}=await cloud!.auth.mfa.challengeAndVerify({factorId:factor,code});
      if(error)throw error;
      setCode('');setQr('');setMessage('Authenticator verified. Administrative actions require verification within the last 15 minutes.');await refresh();
    } catch {setCode('');setMessage('Verification failed. Enter a current authenticator code.');}
    finally {setBusy(false);}
  }
  return <article className="panel settings-section"><h2>Owner security</h2><p>Administrative access requires your authenticator. Your password alone cannot activate packages, moderate testimonials or change settings.</p>
    {!factor&&<button className="button secondary" disabled={busy} onClick={()=>void enroll()}>Set up authenticator</button>}
    {qr&&<img src={qr} alt="Private authenticator enrollment QR code" width={200} height={200}/>}
    {factor&&<form className="account-form" onSubmit={event=>void verify(event)}><label>Authenticator code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event=>setCode(event.target.value)}/></label><button className="button primary" disabled={busy}>Verify authenticator</button></form>}
    <p role="status">{message}</p></article>;
}
