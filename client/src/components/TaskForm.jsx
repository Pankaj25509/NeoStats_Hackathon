import { useEffect, useState } from 'react';
import { api } from '../api';
import { Button, Field, SelectField, TextArea, ErrorBanner } from './ui';
export default function TaskForm({projectId,task,onClose,onSaved}){
  const [form,setForm]=useState({title:'',description:'',status:'Todo',priority:'Medium',assignee_id:'',due_date:'',version:task?.version});
  const [members,setMembers]=useState([]); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  useEffect(()=>{if(task)setForm({title:task.title,description:task.description||'',status:task.status,priority:task.priority,assignee_id:task.assignee_id||'',due_date:task.due_date||'',version:task.version});},[task]);
  useEffect(()=>{if(projectId)api(`/projects/${projectId}/members`).then(d=>setMembers(d.members.filter(m=>m.project_role!=='Viewer'))).catch(()=>{});},[projectId]);
  function change(e){setForm({...form,[e.target.name]:e.target.value});}
  async function submit(e){e.preventDefault();setError('');setBusy(true);try{
    const body={...form,assignee_id:form.assignee_id?Number(form.assignee_id):null,due_date:form.due_date||null};
    const data=task?await api(`/tasks/${task.id}`,{method:'PATCH',body:JSON.stringify(body)}):await api(`/projects/${projectId}/tasks`,{method:'POST',body:JSON.stringify(body)});
    onSaved(data.task);
  }catch(e){if(e.status===409)setError('Conflict: someone updated this task first. Close this form, reload the task, and reapply your changes.');else setError(e.message);}finally{setBusy(false);}}
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal"><div className="modal-head"><div><div className="eyebrow">{task?'TASK EDITOR':'NEW TASK'}</div><h2>{task?'Edit task':'Create a task'}</h2></div><button className="icon-btn" onClick={onClose}>×</button></div><form onSubmit={submit} className="form-stack">
    {error&&<ErrorBanner>{error}</ErrorBanner>}
    <Field label="Task title" name="title" value={form.title} onChange={change} required minLength="2" maxLength="180" placeholder="e.g. Finalize project brief"/>
    <TextArea label="Description" name="description" value={form.description} onChange={change} placeholder="Add details, acceptance criteria, or notes"/>
    <div className="form-grid"><SelectField label="Status" name="status" value={form.status} onChange={change}><option>Todo</option><option>In Progress</option><option>Done</option></SelectField><SelectField label="Priority" name="priority" value={form.priority} onChange={change}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></SelectField></div>
    <div className="form-grid"><SelectField label="Assignee" name="assignee_id" value={form.assignee_id} onChange={change}><option value="">Unassigned</option>{members.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</SelectField><Field label="Due date" type="date" name="due_date" value={form.due_date} onChange={change}/></div>
    <div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={busy} type="submit">{busy?'Saving…':task?'Save changes':'Create task'}</Button></div>
  </form></div></div>;
}
