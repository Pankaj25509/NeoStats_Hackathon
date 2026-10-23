# TaskFlow MVP

A local collaborative project management app built with React, Vite, Express, and SQLite. No PostgreSQL, Docker, cloud database, or API key is required.

## Requirements
- Node.js 20 or newer (Node.js LTS recommended)
- npm

## Run on Windows
Open PowerShell in the extracted `TaskFlow` folder.

```powershell
npm install
npm --prefix server install
npm --prefix client install
Copy-Item .env.example .env
npm run db:seed
npm run dev
```

If `Copy-Item` says `.env` already exists, keep the existing file. Then open **http://localhost:5173**. The API runs at **http://localhost:4000** and Vite proxies `/api` requests to it.

The SQLite database is created automatically at `server/data/taskflow.sqlite`. No database server needs to be started.

## Demo accounts
All demo passwords are for local demonstration only.

| Role | Email | Password |
|---|---|---|
| Admin | admin@taskflow.local | Admin@123 |
| Project Manager | manager@taskflow.local | Manager@123 |
| Team Member | alice@taskflow.local | Member@123 |
| Team Member | bob@taskflow.local | Member@123 |
| Viewer | viewer@taskflow.local | Viewer@123 |

## Useful commands
```powershell
npm run dev       # Start frontend and backend
npm run build     # Build frontend
npm test          # Run backend tests
npm run db:seed   # Add/refresh demo data without deleting existing records
```

To reset the database, stop the app, delete `server/data/taskflow.sqlite` and any `taskflow.sqlite-shm` / `taskflow.sqlite-wal` files, then run `npm run db:seed` again. This deletes local data.

## MVP notes
- Authentication uses HTTP-only session cookies, bcrypt password hashes, and a SQLite-backed session store.
- Role and project-access checks run on the server.
- Task updates use optimistic concurrency (`version`) and return HTTP 409 when a stale version is submitted.
- This is a local hackathon MVP, not a production deployment. Before production, add robust CSRF protection, rate limiting, audit logging, and a hardened deployment configuration. Change the demo passwords.
