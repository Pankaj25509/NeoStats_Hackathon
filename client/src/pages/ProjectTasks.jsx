import { useEffect,useState } from 'react';
import { Link,useOutletContext,useParams } from 'react-router-dom';
import { Plus,Search,ArrowUpRight,CalendarDays } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import TaskForm from '../components/TaskForm';
import { Button,Empty,Loading,Status,Priority,ErrorBanner } from '../components/ui';
import { prettyDate,initials } from '../utils';
export default function ProjectTasks(){
 const {project}=useOutletContext();const {id}=useParams();const {user}=useAuth();const [tasks,setTasks]=useState(null);const [q,setQ]=useState('');const [show,setShow]=useState(false);const [error,setError]=useState('');
 async function load(){try{setTasks((await api(`/projects/${id}/tasks?q=${encodeURIComponent(q)}`)).tasks);}catch(e){setError(e.message);}}
 useEffect(()=>{load();},[id,q]);
 const editable=user?.role!=='Viewer';
 if(!tasks)return error?<ErrorBanner>{error}</ErrorBanner>:<Loading/>;
 return <div className="page-stack compact-stack"><div className="section-heading"><div><h2>Tasks <span className="count-chip">{tasks.length}</span></h2><p>Track the work, one step at a time.</p></div></div><div className="toolbar task-toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search tasks…" value={q} onChange={e=>setQ(e.target.value)}/></div>{editable&&<Button onClick={()=>setShow(true)}><Plus size={16}/> Add task</Button>}</div>{error&&<ErrorBanner>{error}</ErrorBanner>}
 {tasks.length===0?<Empty title="No tasks found" text="Create a task or change your search."/>:<div className="panel task-table-wrap"><table className="data-table"><thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due date</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td><Link className="table-title" to={`/tasks/${t.id}`}>{t.title}<ArrowUpRight size={14}/></Link><span className="table-subtitle">{t.description||'No description'}</span></td><td><Status value={t.status}/></td><td><Priority value={t.priority}/></td><td><span className="assignee"><span className="mini-avatar small">{initials(t.assignee_name||'Unassigned')}</span>{t.assignee_name||'Unassigned'}</span></td><td><span className="due-date"><CalendarDays size={14}/>{prettyDate(t.due_date)}</span></td></tr>)}</tbody></table></div>}
 {show&&<TaskForm projectId={Number(id)} onClose={()=>setShow(false)} onSaved={async()=>{setShow(false);await load();}}/>}
 </div>;
}
