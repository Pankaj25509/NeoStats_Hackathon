import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Search, ArrowUpRight, CalendarDays } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Button,Field,Empty,Loading,Status,ErrorBanner } from '../components/ui';
export default function Projects(){
 const {user}=useAuth();const [projects,setProjects]=useState(null);const [q,setQ]=useState('');const [show,setShow]=useState(false);const [name,setName]=useState('');const [description,setDescription]=useState('');const [error,setError]=useState('');
 async function load(){try{setProjects((await api('/projects')).projects);}catch(e){setError(e.message);}}
 useEffect(()=>{load();},[]);
 async function create(e){e.preventDefault();setError('');try{await api('/projects',{method:'POST',body:JSON.stringify({name,description})});setShow(false);setName('');setDescription('');await load();}catch(e){setError(e.message);}}
 if(error&&!projects)return <ErrorBanner>{error}</ErrorBanner>;if(!projects)return <Loading/>;
 const filtered=projects.filter(p=>(p.name+' '+p.description).toLowerCase().includes(q.toLowerCase()));
 return <div className="page-stack"><div className="page-heading"><div><div className="eyebrow">WORKSPACES</div><h1>Projects</h1><p>Keep the moving pieces connected to the bigger picture.</p></div></div>
 <div className="toolbar projects-toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search projects…" value={q} onChange={e=>setQ(e.target.value)}/></div><span className="result-count">{filtered.length} project{filtered.length===1?'':'s'}</span>{['Admin','Project Manager'].includes(user?.role)&&<Button onClick={()=>setShow(true)}><Plus size={17}/> Create project</Button>}</div>
 {error&&<ErrorBanner>{error}</ErrorBanner>}
 {filtered.length===0?<Empty title="No matching projects" text="Try another search, or create your first project."/>:<div className="projects-grid">{filtered.map((p,i)=><Link className="project-card" to={`/projects/${p.id}`} key={p.id}><div className="project-card-top"><div className={`project-symbol symbol-${i%4}`}><FolderKanban size={20}/></div><Status value={p.status}/></div><h2>{p.name}</h2><p>{p.description||'A shared space for planning and delivering work.'}</p><div className="project-card-foot"><span><CalendarDays size={14}/> Created {new Date(p.created_at+'Z').toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span><ArrowUpRight size={17}/></div></Link>)}</div>}
 {show&&<div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><div className="eyebrow">NEW WORKSPACE</div><h2>Create a project</h2></div><button className="icon-btn" onClick={()=>setShow(false)}>×</button></div><form className="form-stack" onSubmit={create}><Field label="Project name" value={name} onChange={e=>setName(e.target.value)} required minLength="2" maxLength="120" placeholder="e.g. Website refresh"/><label className="field"><span>Description</span><textarea rows="3" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What are you building together?"/></label><div className="modal-actions"><Button type="button" variant="secondary" onClick={()=>setShow(false)}>Cancel</Button><Button type="submit">Create project</Button></div></form></div></div>}
 </div>;
}
