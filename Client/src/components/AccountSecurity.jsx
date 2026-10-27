import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../redux/usersSlice';
import { clearLibrary } from '../redux/librarySlice';
import api from '../services/api';
export default function AccountSecurity({user}) {
 const [password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const dispatch=useDispatch(),navigate=useNavigate();
 async function action(kind){setBusy(true);setMessage('');setError('');try{
  const r=kind==='delete'?await api.delete('/auth/account',{data:{password,confirmation}}):await api.post(`/auth/${kind}`);
  setMessage(r.message);
  if(kind==='delete'||kind==='logout-all'){dispatch(logout());dispatch(clearLibrary());navigate('/login',{replace:true});}
 }catch(e){setError(e.message);}finally{setBusy(false);setPassword('');}}
 return <section className='cl-panel cl-account-form'><h2>Account security</h2><p>{user.emailVerifiedAt?'Your email is verified.':'Your email has not been verified.'}</p>
 {!user.emailVerifiedAt&&<button className='cl-button secondary' disabled={busy} onClick={()=>action('send-verification')}>Send verification email</button>}
 <div className='cl-feature-links'><Link to='/forgot-password'>Reset password</Link><button disabled={busy} onClick={()=>action('logout-all')}>Sign out on all devices</button></div>
 {message&&<p role='status'>{message}</p>}{error&&<p role='alert'>{error}</p>}
 <details><summary>Delete my account</summary><p>This permanently deletes your account, ratings, reviews, library, episode history and collections. Shared collection links will stop working.</p>
 <form onSubmit={e=>{e.preventDefault();action('delete');}}><label>Current password<input required type='password' autoComplete='current-password' maxLength={72} value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Type DELETE to confirm<input required autoComplete='off' value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><button className='cl-button secondary' disabled={busy||confirmation!=='DELETE'}>Permanently delete my account</button></form></details></section>;
}
