import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Circle, Clock3, FolderKanban, Plus, ListTodo } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Button,Empty,Loading,Status,Priority,ErrorBanner } from '../components/ui';
import { prettyDate, initials } from '../utils';
export default function Dashboard(){
 const {user}=useAuth();const [data,setData]=useState(null);const [error,setError]=useState('');
 async function load(){try{setData(await api('/dashboard'));}catch(e){setError(e.message);}}
 useEffect(()=>{load();},[]);
 if(error)return <ErrorBanner>{error}</ErrorBanner>;if(!data)return <Loading/>;
 const {stats,projects,tasks}=data;
 return <div className="page-stack"><div className="page-heading"><div><div className="eyebrow">OVERVIEW</div><h1>Good {new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening'}, {user?.name?.split(' ')[0]}.</h1><p>Here's what's happening across your workspace today.</p></div></div>
 <div className="dashboard-quick-actions"><div><span className="quick-actions-kicker">READY WHEN YOU ARE</span><strong>Make progress on something new</strong><p>Start a project or pick up a task from your workspace.</p></div><Link to="/projects" className="quick-action-link"><Button><Plus size={17}/> Start a project</Button></Link></div>
 <div className="stats-grid"><Stat icon={FolderKanban} label="Active projects" value={stats.projects} color="violet" hint="Projects you can access"/><Stat icon={ListTodo} label="Tasks in view" value={stats.totalTasks} color="blue" hint="Latest tasks across projects"/><Stat icon={Clock3} label="In progress" value={stats.inProgress} color="amber" hint="Work moving forward"/><Stat icon={CheckCircle2} label="Completed" value={stats.done} color="green" hint="Tasks marked done"/></div>
 <div className="dashboard-grid"><section className="panel project-panel"><div className="panel-heading"><div><h2>Your projects</h2><p>Spaces where work gets done</p></div><Link className="text-link" to="/projects">View all <ArrowUpRight size={15}/></Link></div>{projects.length===0?<Empty title="No projects yet" text="Create a project to get your team moving."/>:<div className="project-list">{projects.slice(0,4).map(p=><Link className="project-row" key={p.id} to={`/projects/${p.id}`}><div className="project-symbol"><FolderKanban size={19}/></div><div className="project-row-main"><strong>{p.name}</strong><span>{p.description||'No description yet'}</span></div><div className="project-row-meta"><span>{tasks.filter(t=>t.project_id===p.id).length} tasks</span><ArrowUpRight size={16}/></div></Link>)}</div>}</section>
 <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent tasks</h2><p>A snapshot of the latest work</p></div><ListTodo size={19} className="muted-icon"/></div>{tasks.length===0?<Empty title="No tasks to show"/>:<div className="task-list">{tasks.slice(0,6).map(t=><Link className="task-row" key={t.id} to={`/tasks/${t.id}`}><div className={`task-check ${t.status==='Done'?'is-done':''}`}>{t.status==='Done'?<CheckCircle2 size={17}/>:<Circle size={17}/>}</div><div className="task-row-main"><strong>{t.title}</strong><span>{t.project_name} · {t.assignee_name||'Unassigned'}</span><div className="task-row-tags"><Status value={t.status}/><Priority value={t.priority}/></div></div></Link>)}</div>}</section></div>
 <div className="dashboard-footer"><span><span className="online-dot"/> Your workspace is up to date</span><span>Signed in as {user?.role}</span></div>
 </div>;
}
function Stat({icon:Icon,label,value,color,hint}){return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={19}/></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-hint">{hint}</div></div>}
