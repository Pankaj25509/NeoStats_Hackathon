# TaskFlow — Interview Preparation

## What it does
TaskFlow is a local-first collaborative project management MVP. Users sign in, see authorized projects, manage tasks, assign team members, and comment on tasks. Admins manage users.

## Architecture
- React + Vite frontend on port 5173.
- Express REST API on port 4000.
- SQLite database file at `server/data/taskflow.sqlite`.
- Passwords are hashed with bcryptjs. Sessions are stored in SQLite and sent through HTTP-only cookies.
- Vite proxies `/api` requests to Express during development.

## Database
- `users`: accounts, password hash, global role, active state.
- `projects`: project metadata and creator.
- `project_members`: project membership and project-specific role.
- `tasks`: project, assignee, status, priority, due date, version.
- `comments`: task discussion.
- `sessions`: session store data.

## Authorization
The API checks authentication and role permissions. Project data is only returned to users with access. Viewers are read-only. Admin user-management endpoints require the Admin role.

## Optimistic concurrency
Each task has a `version`. An update succeeds only if the submitted version matches the database version; the update increments the version. If two users edit the same version, the second update receives HTTP 409 instead of silently overwriting the first.

## Useful demo flow
1. Sign in as Admin and review the dashboard/projects.
2. Sign out and sign in as Project Manager; open a project and create/update a task.
3. Sign in as Team Member and add a comment/update task status.
4. Sign in as Viewer and confirm mutation controls are unavailable and API writes are rejected.
5. Open the same task in two sessions, save one version, then submit the stale version from the other session to demonstrate conflict handling.

## Likely interview questions
1. Why SQLite? It is file-based and needs no separate server, making local setup simple.
2. Why React and Express? They separate UI from API and are widely understood.
3. How are passwords stored? As bcrypt hashes, never plain text.
4. Where is authorization enforced? In backend middleware and route handlers, not only in the UI.
5. What is a session cookie? A browser cookie that references server-side session state.
6. Why HTTP-only cookies? JavaScript cannot read them directly, reducing token theft via script access.
7. What is optimistic concurrency? It assumes conflicts are uncommon and checks a version when saving.
8. Why HTTP 409? It indicates the request conflicts with current resource state.
9. How is SQL injection reduced? Queries use prepared/parameterized statements.
10. Why foreign keys? They preserve relationships and prevent orphan records.
11. Why seed data? It makes the app immediately demoable.
12. Why validate on the server? Client-side checks can be bypassed.
13. Why project membership? It scopes users to relevant project data.
14. How would you improve production security? Add CSRF protection, login throttling, audit logs, secure deployment config, and stronger operational monitoring.
15. How would you scale it? Use a managed relational database, durable session infrastructure, background jobs, and monitoring.
