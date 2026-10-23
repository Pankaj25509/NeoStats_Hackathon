import { useState } from 'react';
import { useAuth } from '../auth';
import { api } from '../api';
import { Button,Field,SuccessBanner,ErrorBanner } from '../components/ui';
import { initials } from '../utils';
export default function Profile(){
 const {user,setUser}=useAuth();const [name,setName]=useState(user?.name||'');const [error,setError]=useState('');const [success,setSuccess]=useState('');
 async function submit(e){e.preventDefault();setError('');setSuccess('');try{const d=await api('/profile',{method:'PATCH',body:JSON.stringify({name})});setUser(d.user);setSuccess('Your profile has been updated.');}catch(e){setError(e.message);}}
 return <div className="page-stack"><div className="page-heading"><div><div className="eyebrow">YOUR ACCOUNT</div><h1>My profile</h1><p>Keep your personal details up to date.</p></div></div><div className="profile-layout"><div className="panel profile-card"><div className="profile-avatar">{initials(user?.name)}</div><h2>{user?.name}</h2><p>{user?.email}</p><span className="role-chip">{user?.role}</span></div><div className="panel profile-form-panel"><h2>Personal information</h2><p>Update the name shown to your teammates.</p>{error&&<ErrorBanner>{error}</ErrorBanner>}{success&&<SuccessBanner>{success}</SuccessBanner>}<form className="form-stack" onSubmit={submit}><Field label="Full name" value={name} onChange={e=>setName(e.target.value)} required minLength="2" maxLength="100"/><Field label="Email address" value={user?.email||''} readOnly/><div className="form-end"><Button type="submit">Save changes</Button></div></form></div></div></div>;
}
