require('dotenv').config({ path: require('node:path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db = require('./db');

const users = [
  ['Admin User', 'admin@taskflow.local', 'Admin@123', 'Admin'],
  ['Morgan Manager', 'manager@taskflow.local', 'Manager@123', 'Project Manager'],
  ['Alice Member', 'alice@taskflow.local', 'Member@123', 'Team Member'],
  ['Bob Member', 'bob@taskflow.local', 'Member@123', 'Team Member'],
  ['Vera Viewer', 'viewer@taskflow.local', 'Viewer@123', 'Viewer']
];

const insertUser = db.prepare(`INSERT INTO users(name,email,password_hash,role)
VALUES(?,?,?,?) ON CONFLICT(email) DO NOTHING`);
const findUser = db.prepare('SELECT id FROM users WHERE email = ?');
const insertProject = db.prepare(`INSERT INTO projects(name,description,created_by)
SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = ?)`);
const insertMember = db.prepare(`INSERT INTO project_members(project_id,user_id,role)
VALUES(?,?,?) ON CONFLICT(project_id,user_id) DO NOTHING`);
const insertTask = db.prepare(`INSERT INTO tasks(project_id,title,description,status,priority,assignee_id,created_by,due_date)
SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE project_id=? AND title=?)`);

const seed = db.transaction(() => {
  for (const [name,email,password,role] of users) {
    insertUser.run(name,email,bcrypt.hashSync(password, 10),role);
  }
  const admin = findUser.get('admin@taskflow.local').id;
  const manager = findUser.get('manager@taskflow.local').id;
  const alice = findUser.get('alice@taskflow.local').id;
  const bob = findUser.get('bob@taskflow.local').id;
  const viewer = findUser.get('viewer@taskflow.local').id;

  insertProject.run('Launch TaskFlow', 'A sample project for demonstrating planning, assignments, and delivery.', manager, 'Launch TaskFlow');
  const project = db.prepare('SELECT id FROM projects WHERE name=?').get('Launch TaskFlow').id;
  insertMember.run(project, manager, 'Project Manager');
  insertMember.run(project, alice, 'Team Member');
  insertMember.run(project, bob, 'Team Member');
  insertMember.run(project, viewer, 'Viewer');
  insertMember.run(project, admin, 'Project Manager');

  insertTask.run(project,'Create project brief','Define scope, audience, and success criteria.','Done','High',alice,manager,'2026-11-01',project,'Create project brief');
  insertTask.run(project,'Build task board','Implement task creation, assignment, and status updates.','In Progress','Urgent',bob,manager,'2026-11-05',project,'Build task board');
  insertTask.run(project,'Review accessibility','Check keyboard navigation and readable contrast.','Todo','Medium',alice,manager,'2026-11-10',project,'Review accessibility');
});
seed();
console.log('SQLite database initialized and demo data seeded.');
console.log('Demo logins: admin@taskflow.local / Admin@123; manager@taskflow.local / Manager@123; alice@taskflow.local / Member@123; viewer@taskflow.local / Viewer@123');
db.close();
