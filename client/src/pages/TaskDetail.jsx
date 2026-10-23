import { useEffect,useState } from 'react';
import { Link,useNavigate,useParams } from 'react-router-dom';
import { ArrowLeft,CalendarDays,MessageCircle,Send,Trash2,Edit3,RefreshCw } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import TaskForm from '../components/TaskForm';
import { Button,Loading,Status,Priority,ErrorBanner,Empty } from '../components/ui';
import { initials,prettyDate } from '../utils';
export default function TaskDetail(){
 const {id}=useParams();const {user}=useAuth();const navigate=useNavigate();const [data,setData]=useState(null);const [comment,setComment]=useState('');const [error,setError]=useState('');const [showEdit,setShowEdit]=useState(false);const [conflict,setConflict]=useState(null);const [saving,setSaving]=useState(false);
 async function load(){try{setData(await api(`/tasks/${id}`));setError('');setConflict(null);}catch(e){setError(e.message);}}
 useEffect(()=>{load();},[id]);
 async function addComment(e){e.preventDefault();if(!comment.trim())return;setSaving(true);try{await api(`/tasks/${id}/comments`,{method:'POST',body:JSON.stringify({body:comment})});setComment('');await load();}catch(e){setError(e.message);}finally{setSaving(false);}}
 async function deleteTask(){if(!confirm('Delete this task permanently?'))return;try{await api(`/tasks/${id}`,{method:'DELETE'});navigate(-1);}catch(e){setError(e.message);}}
 if(error&&!data)return <div className="page-stack"><ErrorBanner>{error}</ErrorBanner><Link to="/projects" className="back-link"><ArrowLeft size={16}/> Back to projects</Link></div>;
 if(!data)return <Loading/>;
 const {task,comments,canEdit}=data;
 return <div className="page-stack"><Link to={`/projects/${task.project_id}/tasks`} className="back-link"><ArrowLeft size={16}/> Back to project tasks</Link><div className="task-detail-layout"><section className="panel task-detail-main"><div className="task-detail-top"><div className="eyebrow">TASK #{task.id} · PROJECT #{task.project_id}</div></div><h1 className="task-detail-title">{task.title}</h1><div className="task-detail-tags"><Status value={task.status}/><Priority value={task.priority}/></div><div className="task-command-bar"><span>Task controls</span><div className="task-actions">{canEdit&&<Button variant="secondary" onClick={()=>setShowEdit(true)}><Edit3 size={15}/> Edit task</Button>}{(user?.role==='Admin'||user?.role==='Project Manager')&&<Button variant="danger" onClick={deleteTask}><Trash2 size={15}/> Delete task</Button>}</div></div><div className="description-block"><h3>Description</h3><p>{task.description||'No description has been added yet.'}</p></div><div className="comments-section"><div className="comments-title"><MessageCircle size={18}/><h2>Discussion</h2><span className="count-chip">{comments.length}</span></div>{comments.length===0?<Empty title="Start the conversation" text="Add a comment to share an update with your team."/>:<div className="comments-list">{comments.map(c=><div className="comment" key={c.id}><div className="mini-avatar">{initials(c.author_name)}</div><div className="comment-body"><div className="comment-meta"><strong>{c.author_name}</strong><span>{prettyDate(c.created_at)}</span></div><p>{c.body}</p></div></div>)}</div>}{user?.role!=='Viewer'&&<form className="comment-form" onSubmit={addComment}><textarea rows="2" placeholder="Write a comment…" value={comment} onChange={e=>setComment(e.target.value)} maxLength="3000"/><Button disabled={saving||!comment.trim()}><Send size={15}/> Send</Button></form>}</div></section>
 <aside className="panel task-details-side"><h3>Task details</h3><Detail label="Status"><Status value={task.status}/></Detail><Detail label="Priority"><Priority value={task.priority}/></Detail><Detail label="Assignee"><span className="assignee"><span className="mini-avatar small">{initials(task.assignee_name||'Unassigned')}</span>{task.assignee_name||'Unassigned'}</span></Detail><Detail label="Due date"><span className="due-date"><CalendarDays size={14}/>{prettyDate(task.due_date)}</span></Detail><Detail label="Last updated"><span>{prettyDate(task.updated_at)}</span></Detail><Detail label="Version"><span>v{task.version}</span></Detail></aside></div>
 {error&&<ErrorBanner>{error}</ErrorBanner>}
 {showEdit&&<TaskForm projectId={task.project_id} task={task} onClose={()=>setShowEdit(false)} onSaved={async()=>{setShowEdit(false);await load();}}/>}
 </div>;
}
function Detail({label,children}){return <div className="detail-item"><span>{label}</span><div>{children}</div></div>}
