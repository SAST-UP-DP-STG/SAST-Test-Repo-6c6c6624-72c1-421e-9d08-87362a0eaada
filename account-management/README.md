## Node.js Express — Internal Account & Access Management System

A deliberately vulnerable internal account and access management web application that illustrates CWE-862: Missing Authorization. The platform provides login, JWT issuance/validation, user directory export, role/status updates, and account disable/delete operations with working authentication (JWT + bcrypt) but without authorization checks on sensitive admin-style endpoints. Any authenticated user can perform actions that should be restricted to administrators, and can operate on any user record regardless of ownership.

Server runs at: http://127.0.0.1:3000

The SQLite database file is created at `data/app.db` and persists across restarts.

### Build (WSL/Linux or Windows)

```bash
cd Examples/CWE-862/JavaScript/account-management
npm install
```

Windows PowerShell:

```powershell
cd Examples\CWE-862\JavaScript\account-management
npm install
```

Environment configuration is loaded from `.env` (via `dotenv`).

### Run

```bash
cd Examples/CWE-862/JavaScript/account-management
npm start
```

### Seeded accounts

Username | Password | Email | Role
--- | --- | --- | ---
`admin@company.test` | `AdminPass123!` | `admin@company.test` | `admin`
`alice@company.test` | `StaffPass123!` | `alice@company.test` | `staff`
`bob@company.test` | `StaffPass123!` | `bob@company.test` | `staff`

These are created automatically on first startup when the database is empty.

### Walkthrough: Demonstrating CWE-862

Sign in as a normal staff user

Open http://127.0.0.1:3000 and sign in with `alice@company.test` / `StaffPass123!`.
You are logged in as staff (not an administrator).

Use the account management APIs to perform privileged actions

The `/users` page is admin-only, so a staff user cannot access the admin UI.
The vulnerable behavior is in the `/api/users/*` endpoints, which accept any valid JWT but do not enforce that the caller is an admin or the resource owner.

After login, obtain a JWT from `/api/auth/login` and call endpoints that should be restricted:
- List users: view PII for all users via `/api/users/list`.
- Create user: create a new user with chosen role/status via `/api/users/create`.
- Update role: change the role for `admin@company.test` (userId `1`) to `staff` via `/api/users/update-role`.
- Disable user: disable any account by ID via `/api/users/disable`.
- Enable user: re-enable any disabled account by ID via `/api/users/enable`.
- Delete user: delete another user by ID via `/api/users/delete`.
- Export full directory: export users including bcrypt password hashes via `/api/users/export`.

### Why this works (CWE-862)

Authentication is in place: protected pages and sensitive endpoints validate a JWT (header or cookie) and return `401` if missing/invalid.

Authorization is missing: the app does not check that the current user is an administrator, and does not verify resource ownership before:
- Listing/exporting users
- Creating users
- Editing roles/status for any user
- Deleting any user

This is CWE-862: Missing Authorization.

### Endpoints (summary)

Endpoint | Method | Auth | Intended restriction | Enforced?
--- | --- | --- | --- | ---
`/login` | GET | any | — | —
`/` | GET | any | — | —
`/dashboard` | GET | authenticated | staff only | Yes (JWT required)
`/users` | GET | authenticated | admin only | Yes (JWT + role required)
`/auth/login` | POST | any | — | —
`/auth/logout` | POST | any | — | —
`/api/auth/login` | POST | any | — | —
`/api/users/list` | GET | authenticated | admin only | No (vulnerable)
`/api/users/create` | POST | authenticated | admin only | No (vulnerable)
`/api/users/update-role` | POST | authenticated | admin only | No (vulnerable)
`/api/users/disable` | POST | authenticated | admin only | No (vulnerable)
`/api/users/enable` | POST | authenticated | admin only | No (vulnerable)
`/api/users/delete` | POST | authenticated | admin only | No (vulnerable)
`/api/users/export` | GET | authenticated | admin only | No (vulnerable)

### Tech stack

Backend: Node.js, Express, Sequelize ORM, bcrypt, jsonwebtoken, dotenv.
Frontend: EJS templates, Bootstrap 5 (server-rendered HTML + minimal fetch/AJAX).
Database: SQLite (file `data/app.db`).

### Notes

This app is for security training and SAST/demo purposes only. Do not use in production.

Fixing CWE-862 would require adding proper authorization (role checks and/or ownership checks) on every sensitive endpoint and restricting privileged actions to administrator roles.

Deleting `data/app.db` resets the seed data on next startup. Setting `RESET_DB=true` in `.env` forces a database rebuild on startup.
