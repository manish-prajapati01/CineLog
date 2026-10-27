import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
export default function AccountHelp({ mode }) {
 const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const title=mode==='forgot'?'Forgot your password?':mode==='reset'?'Choose a new password':'Verify your email';
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{
  if(mode==='reset'&&password!==confirm)throw new Error('The passwords do not match.');
  const r=await api.post(`/auth/${mode==='forgot'?'forgot-password':mode==='reset'?'reset-password':'verify-email'}`,mode==='forgot'?{email}:mode==='reset'?{token,password}:{token});
  if(mode==='reset'){localStorage.removeItem('token');localStorage.removeItem('user');window.dispatchEvent(new Event('cinelog:session-expired'));}
  setMessage(r.message);setPassword('');setConfirm('');
  if(mode!=='forgot')window.history.replaceState(null,'',window.location.pathname);
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 return <div className='cl-page cl-top-space cl-account-help'><p className='cl-eyebrow'>YOUR ACCOUNT</p><h1>{title}</h1>
 {message?<p role='status' className='cl-notice'>{message}</p>:<form className='cl-panel cl-account-form' onSubmit={submit}>
 {mode==='forgot'?<><p>Enter your account email. We will send a link if an active account matches.</p><label>Email address<input required type='email' autoComplete='email' maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label></>:mode==='reset'?<><label>New password<input required type='password' autoComplete='new-password' minLength={8} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm new password<input required type='password' autoComplete='new-password' value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><p>At least 8 characters, up to 72 UTF-8 bytes.</p></>:<p>Confirm that this email belongs to you by continuing below.</p>}
 {mode!=='forgot'&&!token?<p role='alert'>Open the link from your email to continue.</p>:<button className='cl-button' disabled={busy}>{busy?'Please wait…':mode==='forgot'?'Send reset link':mode==='reset'?'Save new password':'Verify email'}</button>}
 </form>}{error&&<p role='alert' className='cl-notice'>{error}</p>}<div className='cl-feature-links'><Link to='/login'>Back to sign in</Link><Link to='/'>Keep exploring</Link></div></div>;
}
