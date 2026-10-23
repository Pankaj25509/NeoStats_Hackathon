import { useEffect,useState } from 'react';
import { Link,NavLink,Outlet,useNavigate,useParams } from 'react-router-dom';
import { ArrowLeft,FolderKanban,Users,CheckSquare,Settings2 } from 'lucide-react';
import { api } from '../api';
import { Loading,ErrorBanner,Status } from '../components/ui';
export default function ProjectShell(){
 const {id}=useParams();const [project,setProject]=useState(null);const [error,setError]=useState('');
 useEffect(()=>{api(`/projects/${id}`).then(d=>setProject(d.project)).catch(e=>setError(e.message));},[id]);
 if(error)return <ErrorBanner>{error}</ErrorBanner>;if(!project)return <Loading/>;
 return <div className="page-stack"><Link to="/projects" className="back-link"><ArrowLeft size={16}/> All projects</Link><div className="project-hero"><div className="project-symbol large"><FolderKanban size={24}/></div><div className="project-hero-text"><div className="eyebrow">PROJECT SPACE</div><h1>{project.name}</h1><p>{project.description||'Your team’s shared project space.'}</p></div><Status value={project.status}/></div><div className="tabs"><NavLink end to={`/projects/${id}`}><FolderKanban size={16}/> Overview</NavLink><NavLink to={`/projects/${id}/tasks`}><CheckSquare size={16}/> Tasks</NavLink><NavLink to={`/projects/${id}/team`}><Users size={16}/> Team</NavLink></div><Outlet context={{project}}/></div>;
}
