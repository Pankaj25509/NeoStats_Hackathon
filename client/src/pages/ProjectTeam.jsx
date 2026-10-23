import { useEffect,useState } from 'react';
import { useOutletContext,useParams } from 'react-router-dom';
import { UserPlus,Users,Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Button,Empty,Loading,ErrorBanner,SelectField } from '../components/ui';
import { initials } from '../utils';
export default function ProjectTeam(){
 const {project}=useOutletContext();const {id}=useParams();const {user}=useAuth();const [members,setMembers]=useState(null);const [users,setUsers]=useState([]);const [show,setShow]=useState(false);const [userId,setUserId]=useState('');const [role,setRole]=useState('Team Member');const [error,setError]=useState('');
 async function load(){try{setMembers((await api(`/projects/${id}/members`)).members);if(user?.role==='Admin'||user?.role==='Project Manager'){setUsers((await api(`/projects/${id}/available-members`)).users);}}catch(e){if(e.status!==403)setError(e.message);}}
 useEffect(()=>{load();},[id]);
 const canManage=user?.role==='Admin'||(user?.role==='Project Manager');
 async function add(e){e.preventDefault();try{await api(`/projects/${id}/members`,{method:'POST',body:JSON.stringify({user_id:Number(userId),role})});setShow(false);setUserId('');await load();}catch(e){setError(e.message);}}
 async function remove(uid){if(!confirm('Remove this person from the project?'))return;try{await api(`/projects/${id}/members/${uid}`,{method:'DELETE'});await load();}catch(e){setError(e.message);}}
 if(!members)return error?<ErrorBanner>{error}</ErrorBanner>:<Loading/>;
 return <div className="page-stack compact-stack"><div className="section-heading"><div><h2>Project team <span className="count-chip">{members.length}</span></h2><p>The people making this project happen.</p></div></div><div className="team-toolbar"><span className="toolbar-note"><Users size={15}/> People on this project</span>{canManage&&<Button onClick={()=>setShow(true)}><UserPlus size={16}/> Invite teammate</Button>}</div>{error&&<ErrorBanner>{error}</ErrorBanner>}{members.length===0?<Empty title="No members yet"/>:<div className="panel member-list">{members.map(m=><div className="member-row" key={m.id}><div className="mini-avatar">{initials(m.name)}</div><div className="member-main"><strong>{m.name}</strong><span>{m.email}</span></div><span className="role-chip">{m.project_role}</span>{canManage&&m.id!==user.id&&<button className="icon-btn danger-icon" title="Remove member" onClick={()=>remove(m.id)}><Trash2 size={16}/></button>}</div>)}</div>}
 {show&&<div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><div className="eyebrow">TEAM SETTINGS</div><h2>Add a member</h2></div><button className="icon-btn" onClick={()=>setShow(false)}>×</button></div><form className="form-stack" onSubmit={add}><SelectField label="Person" value={userId} onChange={e=>setUserId(e.target.value)} required><option value="">Choose a user</option>{users.filter(u=>u.active&&!members.some(m=>m.id===u.id)&&u.role!=='Admin').map(u=><option value={u.id} key={u.id}>{u.name} · {u.email}</option>)}</SelectField><SelectField label="Project role" value={role} onChange={e=>setRole(e.target.value)}><option>Team Member</option><option>Viewer</option><option>Project Manager</option></SelectField><div className="modal-actions"><Button type="button" variant="secondary" onClick={()=>setShow(false)}>Cancel</Button><Button type="submit">Add to project</Button></div></form></div></div>}
 </div>;
}
