function isAdmin(user) { return user?.role === 'Admin'; }
function canReadProject(db, user, projectId) {
  if (!user) return false;
  if (isAdmin(user)) return !!db.prepare('SELECT id FROM projects WHERE id=?').get(projectId);
  return !!db.prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(projectId, user.id);
}
function membership(db, projectId, userId) {
  return db.prepare('SELECT * FROM project_members WHERE project_id=? AND user_id=?').get(projectId, userId);
}
function canManageProject(db, user, projectId) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const m = membership(db, projectId, user.id);
  return user.role === 'Project Manager' && !!m && m.role === 'Project Manager';
}
function canEditTasks(db, user, projectId) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (user.role === 'Viewer') return false;
  const m = membership(db, projectId, user.id);
  return !!m && m.role !== 'Viewer';
}
module.exports = { isAdmin, canReadProject, canManageProject, canEditTasks, membership };
