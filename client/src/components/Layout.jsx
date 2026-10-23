import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, FolderKanban, LayoutDashboard, LogOut, Settings, ShieldCheck, Users, CheckSquare, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth';
import { initials } from '../utils';
export default function Layout(){
  const {user,logout}=useAuth(); const navigate=useNavigate(); const [open,setOpen]=useState(false);
  async function signOut(){try{await logout();navigate('/login');}catch(e){alert(e.message)}}
  const links=[
    {to:'/dashboard',label:'Dashboard',icon:LayoutDashboard},
    {to:'/projects',label:'Projects',icon:FolderKanban},
    {to:'/profile',label:'My profile',icon:Settings},
    ...(user?.role==='Admin'?[{to:'/users',label:'User management',icon:Users}]:[])
  ];
  return <div className="app-shell">
    <aside className={`sidebar ${open?'sidebar-open':''}`}>
      <div className="brand"><div className="brand-mark"><CheckSquare size={21}/></div><span>taskflow<span className="brand-dot">.</span></span><button className="icon-btn mobile-close" onClick={()=>setOpen(false)}><X/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{links.map(({to,label,icon:Icon})=><NavLink key={to} to={to} onClick={()=>setOpen(false)} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="mini-avatar">{initials(user?.name)}</div><div className="user-mini"><strong>{user?.name}</strong><span>{user?.role}</span></div><button className="icon-btn" title="Sign out" onClick={signOut}><LogOut size={17}/></button></div>
    </aside>
    {open&&<button className="scrim" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
    <main className="main-area"><header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setOpen(true)}><Menu/></button><div className="crumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>TaskFlow</strong></div><div className="topbar-right"><span className="online-dot"/><span>Local workspace</span><div className="top-avatar">{initials(user?.name)}</div></div></header><div className="page-wrap"><Outlet/></div></main>
  </div>;
}
