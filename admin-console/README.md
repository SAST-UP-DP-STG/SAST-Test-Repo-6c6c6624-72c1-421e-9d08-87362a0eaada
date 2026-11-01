## Node.js — Admin Console

An internal admin console for support staff to view user records and manage API access. The app uses SQLite (`data/admin.db`) to store dummy PII (name, email, last4, SSN last4) and a service API key. It exposes **critical functions** for deleting users, creating users, changing user roles, and generating API keys. It is vulnerable to CWE-306 (Missing Authentication for Critical Function) because the **critical routes are not protected by any authentication check**. A login form issues a token, but the server never validates it before executing the critical operations.

On first run the database is created and seeded with three users so you can test without creating accounts manually.

### Build (WSL/Linux, macOS, or Windows)

```bash
npm -C Examples/CWE-306/JavaScript/admin-console install
```

### Run

```bash
node Examples/CWE-306/JavaScript/admin-console/server.js
# or from app directory:
cd Examples/CWE-306/JavaScript/admin-console && npm start
```

Server starts on: **http://localhost:4000** (binds to `0.0.0.0`, all interfaces, by default).

### Browser flow

1. Visit **http://127.0.0.1:4000** (login page)
2. Sign in with a seeded user (e.g. `admin` / `adminpass`)
3. You are redirected to **/dashboard**, which loads user records
4. Use **Delete user**, **Create user**, or **Change role** (critical sinks)
5. Open the **Developer console** to generate an API key (critical sink)

### Routes

| Route | Method | Behavior |
|-------|--------|----------|
| `/` | GET | Login page (`login.html`). |
| `/login` | GET | Login page (`login.html`). |
| `/dashboard` | GET | Dashboard UI (`index.html`). |
| `/dev-console.html` | GET | Developer API key generation UI. |
| `/api/login` | POST | Validates credentials and returns a session token (not enforced anywhere). |
| `/api/records` | GET | Returns user records from SQLite. |
| `/api/users/create` | POST | **Critical function.** Creates a new user record. **No auth check.** |
| `/api/users/delete` | POST | **Critical function.** Deletes a user record. **No auth check.** |
| `/api/users/role` | POST | **Critical function.** Changes a user role to admin. **No auth check.** |
| `/api/dev/generate-key` | POST | **Critical function.** Generates a new API key. **No auth check.** |

### Seed data

| User   | Password   | Email                        | Role  |
|--------|------------|------------------------------|-------|
| admin  | adminpass  | admin@internal.example       | admin |
| jordan | jordanpass | jordan.lee@internal.example  | user  |
| sam    | sampass    | sam.rivera@internal.example  | user  |

### Testing missing authentication

1. Login to obtain a token (not required for critical actions):

```bash
curl -s -X POST http://127.0.0.1:4000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"adminpass\"}"
```

2. Create a user **without any auth**:

```bash
curl -s -X POST http://127.0.0.1:4000/api/users/create \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"casey\",\"password\":\"caseypass\",\"name\":\"Casey Patel\",\"email\":\"casey.patel@internal.example\",\"last4\":\"4421\",\"ssn_last4\":\"9132\",\"role\":\"user\"}"
```

3. Change a role to admin **without any auth**:

```bash
curl -s -X POST http://127.0.0.1:4000/api/users/role \
  -H "Content-Type: application/json" \
  -d "{\"id\":2,\"role\":\"admin\"}"
```

4. Delete a user **without any auth**:

```bash
curl -s -X POST http://127.0.0.1:4000/api/users/delete \
  -H "Content-Type: application/json" \
  -d "{\"id\":3}"
```

5. Generate an API key **without any auth**:

```bash
curl -s -X POST http://127.0.0.1:4000/api/dev/generate-key
```

### Vulnerable design (security notes)

- **Missing auth on critical functions** — `/api/users/create`, `/api/users/delete`, `/api/users/role`, and `/api/dev/generate-key` execute high-impact operations directly, with no session or token validation.
- **Token is decorative** — The login endpoint returns a token, but the server does not check it for any request.
- **Sensitive data in SQL** — PII and secrets are stored in SQLite and exposed by unauthenticated routes.
- **What real apps must do**
  - **Enforce authentication and authorization** on every sensitive endpoint (middleware or explicit checks).
  - **Least privilege** — only privileged roles should delete users or change roles.
  - **Audit logging** for destructive and privilege-changing events.

### Notes

- Server binds to **0.0.0.0** (all interfaces) by default, so the unauthenticated functionality is externally reachable and the missing-authentication issue is valid (set `HOST` or `PORT` to override).
- SQLite database is stored at `data/admin.db`. Delete it to reseed.
- Deleting `data/admin.db` resets the demo data on next start.
