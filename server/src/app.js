require('dotenv').config({ path: require('node:path').join(__dirname, '../../.env') });
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const db = require('./db');
const { fail } = require('./errors');
const { isAdmin, canReadProject, canManageProject, canEditTasks, membership } = require('./policy');

const SQLiteStore = SQLiteStoreFactory(session);
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, '..', 'data'), table: 'sessions' }),
  secret: process.env.SESSION_SECRET || 'local-development-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 }
}));

const publicUser = (u) => ({ id:u.id, name:u.name, email:u.email, role:u.role, active:!!u.active });
function auth(req,res,next) {
  if (!req.session.userId) return fail(res,401,'Authentication required');
  const user = db.prepare('SELECT id,name,email,role,active FROM users WHERE id=?').get(req.session.userId);
  if (!user || !user.active) {
    req.session.destroy(() => {});
    return fail(res,401,'Account is inactive or session has expired');
  }
  req.user = user;
  next();
}
function adminOnly(req,res,next) {
  if (!isAdmin(req.user)) return fail(res,403,'Administrator access required');
  next();
}
function positiveId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}
function projectOr404(req,res,projectId) {
  if (!positiveId(projectId) || !canReadProject(db,req.user,Number(projectId))) {
    fail(res,404,'Project not found');
    return false;
  }
  return true;
}
function taskOr404(req,res,taskId) {
  const id = positiveId(taskId);
  const task = id ? db.prepare('SELECT * FROM tasks WHERE id=?').get(id) : null;
  if (!task || !canReadProject(db,req.user,task.project_id)) {
    fail(res,404,'Task not found');
    return null;
  }
  return task;
}
const validStatuses = ['Todo','In Progress','Done'];
const validPriorities = ['Low','Medium','High','Urgent'];

app.get('/api/health', (req,res) => res.json({ ok:true, database:'sqlite' }));

app.post('/api/auth/login', (req,res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return fail(res,400,'Email and password are required');
  const row = db.prepare('SELECT * FROM users WHERE email=? COLLATE NOCASE').get(email);
  if (!row || !row.active || !require('bcryptjs').compareSync(password,row.password_hash)) return fail(res,401,'Invalid email or password');
  req.session.regenerate(err => {
    if (err) return fail(res,500,'Could not create session');
    req.session.userId = row.id;
    req.session.save(err2 => {
      if (err2) return fail(res,500,'Could not save session');
      res.json({ user: publicUser(row) });
    });
  });
});
app.post('/api/auth/logout', (req,res) => req.session.destroy(err => {
  if (err) return fail(res,500,'Could not log out');
  res.clearCookie('connect.sid');
  res.json({ ok:true });
}));
app.get('/api/auth/me', auth, (req,res) => res.json({ user:publicUser(req.user) }));

app.get('/api/dashboard', auth, (req,res) => {
  const projects = isAdmin(req.user)
    ? db.prepare("SELECT p.*, u.name AS creator_name FROM projects p JOIN users u ON u.id=p.created_by WHERE p.status='Active' ORDER BY p.updated_at DESC").all()
    : db.prepare("SELECT p.*, u.name AS creator_name FROM projects p JOIN project_members pm ON pm.project_id=p.id JOIN users u ON u.id=p.created_by WHERE pm.user_id=? AND p.status='Active' ORDER BY p.updated_at DESC").all(req.user.id);
  const projectIds = projects.map(p=>p.id);
  let tasks = [];
  if (projectIds.length) {
    const marks = projectIds.map(()=>'?').join(',');
    tasks = db.prepare(`SELECT t.*, p.name AS project_name, u.name AS assignee_name FROM tasks t JOIN projects p ON p.id=t.project_id LEFT JOIN users u ON u.id=t.assignee_id WHERE t.project_id IN (${marks}) ORDER BY t.updated_at DESC LIMIT 12`).all(...projectIds);
  }
  res.json({ projects, tasks, stats:{projects:projects.length,totalTasks:tasks.length,todo:tasks.filter(t=>t.status==='Todo').length,inProgress:tasks.filter(t=>t.status==='In Progress').length,done:tasks.filter(t=>t.status==='Done').length,assignedToMe:tasks.filter(t=>t.assignee_id===req.user.id).length} });
});

app.get('/api/projects', auth, (req,res) => {
  const projects = isAdmin(req.user)
    ? db.prepare('SELECT p.*,u.name AS creator_name FROM projects p JOIN users u ON u.id=p.created_by ORDER BY p.updated_at DESC').all()
    : db.prepare('SELECT p.*,u.name AS creator_name FROM projects p JOIN project_members pm ON pm.project_id=p.id JOIN users u ON u.id=p.created_by WHERE pm.user_id=? ORDER BY p.updated_at DESC').all(req.user.id);
  res.json({ projects });
});
app.post('/api/projects', auth, (req,res) => {
  if (!['Admin','Project Manager'].includes(req.user.role)) return fail(res,403,'You cannot create projects');
  const name = String(req.body?.name || '').trim();
  const description = String(req.body?.description || '').trim();
  if (name.length < 2 || name.length > 120) return fail(res,400,'Project name must be 2–120 characters');
  const result = db.prepare('INSERT INTO projects(name,description,created_by) VALUES(?,?,?)').run(name,description,req.user.id);
  const projectId = Number(result.lastInsertRowid);
  db.prepare('INSERT INTO project_members(project_id,user_id,role) VALUES(?,?,?)').run(projectId,req.user.id,req.user.role === 'Admin' ? 'Project Manager' : 'Project Manager');
  res.status(201).json({ project:db.prepare('SELECT * FROM projects WHERE id=?').get(projectId) });
});
app.get('/api/projects/:id', auth, (req,res) => {
  if (!projectOr404(req,res,req.params.id)) return;
  const project = db.prepare('SELECT p.*,u.name AS creator_name FROM projects p JOIN users u ON u.id=p.created_by WHERE p.id=?').get(Number(req.params.id));
  const tasks = db.prepare('SELECT t.*,u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id WHERE t.project_id=? ORDER BY t.updated_at DESC').all(project.id);
  const members = db.prepare('SELECT u.id,u.name,u.email,u.role AS global_role,pm.role AS project_role FROM project_members pm JOIN users u ON u.id=pm.user_id WHERE pm.project_id=? ORDER BY u.name').all(project.id);
  res.json({ project, tasks, members });
});
app.patch('/api/projects/:id', auth, (req,res) => {
  const id = positiveId(req.params.id);
  if (!id || !db.prepare('SELECT id FROM projects WHERE id=?').get(id)) return fail(res,404,'Project not found');
  if (!canManageProject(db,req.user,id)) return fail(res,403,'You cannot manage this project');
  const current = db.prepare('SELECT * FROM projects WHERE id=?').get(id);
  const name = req.body?.name === undefined ? current.name : String(req.body.name).trim();
  const description = req.body?.description === undefined ? current.description : String(req.body.description).trim();
  const status = req.body?.status === undefined ? current.status : req.body.status;
  if (name.length < 2 || name.length > 120 || !['Active','Archived'].includes(status)) return fail(res,400,'Invalid project fields');
  db.prepare("UPDATE projects SET name=?,description=?,status=?,updated_at=datetime('now') WHERE id=?").run(name,description,status,id);
  res.json({ project:db.prepare('SELECT * FROM projects WHERE id=?').get(id) });
});
app.get('/api/projects/:id/available-members', auth, (req,res) => {
  const projectId = positiveId(req.params.id);
  if (!projectId || !canManageProject(db, req.user, projectId)) return fail(res,404,'Project not found');
  const users = db.prepare(`SELECT id,name,email,role FROM users
    WHERE active=1 AND role<>'Admin'
    AND id NOT IN (SELECT user_id FROM project_members WHERE project_id=?)
    ORDER BY name`).all(projectId);
  res.json({ users });
});
app.get('/api/projects/:id/members', auth, (req,res) => {
  if (!projectOr404(req,res,req.params.id)) return;
  const members = db.prepare('SELECT u.id,u.name,u.email,u.role AS global_role,pm.role AS project_role FROM project_members pm JOIN users u ON u.id=pm.user_id WHERE pm.project_id=? ORDER BY u.name').all(Number(req.params.id));
  res.json({ members });
});
app.post('/api/projects/:id/members', auth, (req,res) => {
  const id = positiveId(req.params.id);
  if (!id || !canManageProject(db,req.user,id)) return fail(res,404,'Project not found');
  const userId = positiveId(req.body?.user_id);
  const role = req.body?.role || 'Team Member';
  if (!userId || !['Project Manager','Team Member','Viewer'].includes(role)) return fail(res,400,'Valid user_id and project role are required');
  const target = db.prepare('SELECT id,role,active FROM users WHERE id=?').get(userId);
  if (!target || !target.active || target.role==='Admin') return fail(res,400,'Choose an active non-admin user');
  if (role==='Project Manager' && target.role!=='Project Manager') return fail(res,400,'Only a Project Manager account can have the Project Manager project role');
  try {
    db.prepare('INSERT INTO project_members(project_id,user_id,role) VALUES(?,?,?)').run(id,userId,role);
  } catch(e) { return fail(res,409,'User is already a project member'); }
  res.status(201).json({ ok:true });
});
app.patch('/api/projects/:id/members/:userId', auth, (req,res) => {
  const id=positiveId(req.params.id), userId=positiveId(req.params.userId), role=req.body?.role;
  if (!id || !userId || !canManageProject(db,req.user,id)) return fail(res,404,'Project not found');
  if (!['Project Manager','Team Member','Viewer'].includes(role)) return fail(res,400,'Invalid project role');
  db.prepare('UPDATE project_members SET role=? WHERE project_id=? AND user_id=?').run(role,id,userId);
  res.json({ ok:true });
});
app.delete('/api/projects/:id/members/:userId', auth, (req,res) => {
  const id=positiveId(req.params.id), userId=positiveId(req.params.userId);
  if (!id || !userId || !canManageProject(db,req.user,id)) return fail(res,404,'Project not found');
  if (userId===req.user.id) return fail(res,400,'You cannot remove yourself from the project');
  db.prepare('DELETE FROM project_members WHERE project_id=? AND user_id=?').run(id,userId);
  res.json({ ok:true });
});

app.get('/api/projects/:id/tasks', auth, (req,res) => {
  const projectId=positiveId(req.params.id);
  if (!projectId || !canReadProject(db,req.user,projectId)) return fail(res,404,'Project not found');
  const status = validStatuses.includes(req.query.status) ? req.query.status : null;
  const q = String(req.query.q || '').trim().slice(0,100);
  const limit = Math.min(100,Math.max(1,Number(req.query.limit)||50));
  const offset = Math.max(0,Number(req.query.offset)||0);
  const rows = db.prepare(`SELECT t.*,u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id WHERE t.project_id=? AND (? IS NULL OR t.status=?) AND (?='' OR t.title LIKE '%'||?||'%' OR t.description LIKE '%'||?||'%') ORDER BY t.updated_at DESC LIMIT ? OFFSET ?`).all(projectId,status,status,q,q,q,limit,offset);
  res.json({ tasks:rows, limit, offset });
});
app.post('/api/projects/:id/tasks', auth, (req,res) => {
  const projectId=positiveId(req.params.id);
  if (!projectId || !canEditTasks(db,req.user,projectId)) return fail(res,403,'You cannot create tasks in this project');
  const title=String(req.body?.title||'').trim();
  const description=String(req.body?.description||'').trim();
  const status=req.body?.status||'Todo';
  const priority=req.body?.priority||'Medium';
  const due_date=req.body?.due_date||null;
  const assigneeId=req.body?.assignee_id ? positiveId(req.body.assignee_id) : null;
  if (title.length<2 || title.length>180 || !validStatuses.includes(status) || !validPriorities.includes(priority)) return fail(res,400,'Invalid task fields');
  if (assigneeId) {
    const member=membership(db,projectId,assigneeId);
    const target=db.prepare('SELECT role,active FROM users WHERE id=?').get(assigneeId);
    if (!member || !target || !target.active || target.role==='Viewer' || member.role==='Viewer') return fail(res,400,'Assignee must be an active non-viewer project member');
  }
  const result=db.prepare('INSERT INTO tasks(project_id,title,description,status,priority,assignee_id,created_by,due_date) VALUES(?,?,?,?,?,?,?,?)').run(projectId,title,description,status,priority,assigneeId,req.user.id,due_date);
  res.status(201).json({ task:db.prepare('SELECT * FROM tasks WHERE id=?').get(Number(result.lastInsertRowid)) });
});
app.get('/api/tasks/:id', auth, (req,res) => {
  const task=taskOr404(req,res,req.params.id); if (!task) return;
  task.assignee_name = task.assignee_id ? (db.prepare('SELECT name FROM users WHERE id=?').get(task.assignee_id)?.name || null) : null;
  const comments=db.prepare('SELECT c.id,c.body,c.created_at,u.id AS user_id,u.name AS author_name FROM comments c JOIN users u ON u.id=c.user_id WHERE c.task_id=? ORDER BY c.created_at ASC').all(task.id);
  const members=db.prepare('SELECT u.id,u.name FROM project_members pm JOIN users u ON u.id=pm.user_id WHERE pm.project_id=? AND pm.role<>\'Viewer\' AND u.active=1 ORDER BY u.name').all(task.project_id);
  res.json({ task, comments, members, canEdit:canEditTasks(db,req.user,task.project_id) });
});
app.patch('/api/tasks/:id', auth, (req,res) => {
  const task=taskOr404(req,res,req.params.id); if (!task) return;
  if (!canEditTasks(db,req.user,task.project_id)) return fail(res,403,'You cannot edit this task');
  const version=Number(req.body?.version);
  if (!Number.isInteger(version)) return fail(res,400,'Task version is required');
  const title=req.body?.title===undefined?task.title:String(req.body.title).trim();
  const description=req.body?.description===undefined?task.description:String(req.body.description).trim();
  const status=req.body?.status===undefined?task.status:req.body.status;
  const priority=req.body?.priority===undefined?task.priority:req.body.priority;
  const due_date=req.body?.due_date===undefined?task.due_date:(req.body.due_date||null);
  const assigneeId=req.body?.assignee_id===undefined?task.assignee_id:(req.body.assignee_id?positiveId(req.body.assignee_id):null);
  if (title.length<2 || title.length>180 || !validStatuses.includes(status) || !validPriorities.includes(priority)) return fail(res,400,'Invalid task fields');
  if (assigneeId) {
    const member=membership(db,task.project_id,assigneeId);
    const target=db.prepare('SELECT role,active FROM users WHERE id=?').get(assigneeId);
    if (!member || !target || !target.active || target.role==='Viewer' || member.role==='Viewer') return fail(res,400,'Assignee must be an active non-viewer project member');
  }
  const result=db.prepare(`UPDATE tasks SET title=?,description=?,status=?,priority=?,due_date=?,assignee_id=?,version=version+1,updated_at=datetime('now') WHERE id=? AND version=?`).run(title,description,status,priority,due_date,assigneeId,task.id,version);
  if (result.changes===0) return fail(res,409,'This task changed since you opened it. Reload the latest version before saving.',{ latest:db.prepare('SELECT * FROM tasks WHERE id=?').get(task.id) });
  res.json({ task:db.prepare('SELECT * FROM tasks WHERE id=?').get(task.id) });
});
app.delete('/api/tasks/:id', auth, (req,res) => {
  const task=taskOr404(req,res,req.params.id); if (!task) return;
  if (!canManageProject(db,req.user,task.project_id) && req.user.role!=='Admin') return fail(res,403,'Only project managers can delete tasks');
  db.prepare('DELETE FROM tasks WHERE id=?').run(task.id);
  res.json({ ok:true });
});
app.post('/api/tasks/:id/comments', auth, (req,res) => {
  const task=taskOr404(req,res,req.params.id); if (!task) return;
  if (req.user.role==='Viewer') return fail(res,403,'Viewers cannot comment');
  const member=membership(db,task.project_id,req.user.id);
  if (!isAdmin(req.user) && !member) return fail(res,403,'Project membership required');
  const body=String(req.body?.body||'').trim();
  if (!body || body.length>3000) return fail(res,400,'Comment must be 1–3000 characters');
  const result=db.prepare('INSERT INTO comments(task_id,user_id,body) VALUES(?,?,?)').run(task.id,req.user.id,body);
  res.status(201).json({ comment:db.prepare('SELECT c.id,c.body,c.created_at,u.name AS author_name FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?').get(Number(result.lastInsertRowid)) });
});
app.delete('/api/comments/:id', auth, (req,res) => {
  const comment=db.prepare('SELECT c.*,t.project_id FROM comments c JOIN tasks t ON t.id=c.task_id WHERE c.id=?').get(positiveId(req.params.id));
  if (!comment || !canReadProject(db,req.user,comment.project_id)) return fail(res,404,'Comment not found');
  if (comment.user_id!==req.user.id && !isAdmin(req.user) && !canManageProject(db,req.user,comment.project_id)) return fail(res,403,'You cannot delete this comment');
  db.prepare('DELETE FROM comments WHERE id=?').run(comment.id);
  res.json({ ok:true });
});

app.get('/api/users', auth, adminOnly, (req,res) => {
  const users=db.prepare('SELECT id,name,email,role,active,created_at FROM users ORDER BY name').all().map(u=>({...u,active:!!u.active}));
  res.json({ users });
});
app.post('/api/users', auth, adminOnly, (req,res) => {
  const name=String(req.body?.name||'').trim(), email=String(req.body?.email||'').trim().toLowerCase(), password=String(req.body?.password||''), role=req.body?.role;
  if (name.length<2 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || password.length<8 || !['Admin','Project Manager','Team Member','Viewer'].includes(role)) return fail(res,400,'Provide a name, valid email, password of at least 8 characters, and valid role');
  try {
    const hash=require('bcryptjs').hashSync(password,10);
    const result=db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(name,email,hash,role);
    res.status(201).json({ user:publicUser(db.prepare('SELECT id,name,email,role,active FROM users WHERE id=?').get(Number(result.lastInsertRowid))) });
  } catch(e) { return fail(res,409,'Email is already in use'); }
});
app.patch('/api/users/:id', auth, adminOnly, (req,res) => {
  const id=positiveId(req.params.id), target=id?db.prepare('SELECT * FROM users WHERE id=?').get(id):null;
  if (!target) return fail(res,404,'User not found');
  const name=req.body?.name===undefined?target.name:String(req.body.name).trim();
  const role=req.body?.role===undefined?target.role:req.body.role;
  const active=req.body?.active===undefined?target.active:(req.body.active?1:0);
  if (name.length<2 || !['Admin','Project Manager','Team Member','Viewer'].includes(role)) return fail(res,400,'Invalid user fields');
  if (target.id===req.user.id && (role!=='Admin' || !active)) return fail(res,400,'You cannot remove your own admin access or deactivate yourself');
  if (target.role==='Admin' && (role!=='Admin' || !active)) {
    const count=db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='Admin' AND active=1").get().n;
    if (count<=1) return fail(res,400,'Cannot deactivate or demote the last active administrator');
  }
  db.prepare("UPDATE users SET name=?,role=?,active=?,updated_at=datetime('now') WHERE id=?").run(name,role,active,id);
  res.json({ user:publicUser(db.prepare('SELECT id,name,email,role,active FROM users WHERE id=?').get(id)) });
});
app.get('/api/profile', auth, (req,res) => res.json({ user:publicUser(db.prepare('SELECT id,name,email,role,active FROM users WHERE id=?').get(req.user.id)) }));
app.patch('/api/profile', auth, (req,res) => {
  const name=String(req.body?.name||'').trim();
  if (name.length<2 || name.length>100) return fail(res,400,'Name must be 2–100 characters');
  db.prepare("UPDATE users SET name=?,updated_at=datetime('now') WHERE id=?").run(name,req.user.id);
  res.json({ user:publicUser(db.prepare('SELECT id,name,email,role,active FROM users WHERE id=?').get(req.user.id)) });
});

app.use((req,res)=>fail(res,404,'Endpoint not found'));
app.use((err,req,res,next)=>{
  console.error(err);
  if (res.headersSent) return next(err);
  return fail(res,500,'Unexpected server error');
});

module.exports = app;
