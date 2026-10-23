import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CheckSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth';
import { Button, Field, ErrorBanner } from '../components/ui';
export default function Login(){
 const {user,login}=useAuth();const navigate=useNavigate();const [email,setEmail]=useState('admin@taskflow.local');const [password,setPassword]=useState('Admin@123');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 if(user)return <Navigate to="/dashboard" replace/>;
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{await login(email,password);navigate('/dashboard');}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <div className="login-screen"><div className="login-decoration decor-one"/><div className="login-decoration decor-two"/><div className="login-card"><div className="brand login-brand"><div className="brand-mark"><CheckSquare size={21}/></div><span>taskflow<span className="brand-dot">.</span></span></div><div className="login-intro"><div className="eyebrow">YOUR WORKSPACE, IN SYNC</div><h1>Good work<br/>starts <em>together.</em></h1><p>One calm place to plan projects, move tasks forward, and keep your team on the same page.</p></div>
 <form onSubmit={submit} className="form-stack login-form">{error&&<ErrorBanner>{error}</ErrorBanner>}<Field label="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/><Field label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/><Button type="submit" disabled={busy} className="login-submit">{busy?'Signing in…':'Sign in to TaskFlow'} <ArrowRight size={17}/></Button></form>
 <div className="demo-note"><ShieldCheck size={17}/><div><strong>Demo workspace</strong><span>Use the prefilled admin credentials, or try manager@taskflow.local / Manager@123.</span></div></div><div className="login-foot">LOCAL MVP <span>•</span> BUILT FOR TEAMS</div></div><div className="login-side-note">Less chasing. More making.</div></div>;
}
