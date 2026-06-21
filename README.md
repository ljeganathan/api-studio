# API Studio

A full-stack, Postman-like API client for testing and managing HTTP APIs — collections, folders, requests, request history with replay, Postman v2.1 import/export, JWT auth, an admin dashboard, and a usage leaderboard.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TailwindCSS, shadcn/ui, Zustand, @dnd-kit |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15 |
| Auth | JWT (python-jose) + bcrypt |
| Containerization | Docker + Docker Compose |

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture and step-by-step build guide.

## Quick Start (Docker)

```bash
git clone https://github.com/ljeganathan/api-studio.git
cd api-studio
docker compose up -d --build
```

This starts three containers: `db` (Postgres), `backend` (FastAPI on port 8000), and `frontend` (nginx serving the built React app on port 3000).

| Service | URL |
|---|---|
| App UI | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Admin dashboard | http://localhost:3000/admin |
| Leaderboard | http://localhost:3000/leaderboard |

## Creating Your First Account

1. Open http://localhost:3000/register and create a user.
2. Promote it to admin (there's no admin yet, so this has to be done from the backend container):
   ```bash
   docker exec api-studio-backend-1 python scripts/make_admin.py you@example.com
   ```
3. Log back in (or refresh) — the **Admin** and **Leaderboard** nav links now appear in the top bar. Both are admin-only; non-admin users are redirected away from `/admin` and `/leaderboard`.

To list current admins:
```bash
docker exec api-studio-db-1 psql -U apistudio -d apistudio -c "select id, email, username from users where is_admin=true;"
```

## Local Development (without Docker)

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env         # adjust DATABASE_URL to point at a local Postgres instance
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
The Vite dev server proxies `/api/*` to `http://localhost:8000` (see `vite.config.js`), so no extra env vars are needed on the frontend.

## Environment Variables (backend)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://apistudio:apistudio@localhost:5432/apistudio` | PostgreSQL connection string |
| `SECRET_KEY` | `dev-secret-key` | JWT signing key — **change in production** |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token TTL (24h) |

## Useful Backend Scripts (`backend/scripts/`)

- `make_admin.py <email>` — promote an existing user to admin.
- `seed_data.py` — seed a sample collection/folder/requests for quick manual testing.

Run either with:
```bash
docker exec api-studio-backend-1 python scripts/<script>.py [args]
```

## Troubleshooting

- **Admin/leaderboard page blank with a "failed to load" toast**: your account was deactivated (`is_active=false`) or isn't an admin. Reactivate directly via SQL if you're locked out of every admin account:
  ```bash
  docker exec api-studio-db-1 psql -U apistudio -d apistudio -c "update users set is_active = true where email = 'you@example.com';"
  ```
- **API calls failing from the frontend**: confirm the backend container is healthy (`docker compose ps`, `curl http://localhost:8000/health`) and that you're logged in with a non-expired token.

## Testing

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test

# Manual proxy smoke test
curl -X POST http://localhost:8000/proxy/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","url":"https://httpbin.org/get","headers":[],"params":[]}'
```

## Roadmap

- [ ] WebSocket support for streaming responses
- [ ] Environment variables (like Postman environments)
- [x] Import/Export Postman collections (JSON format)
- [x] History panel — replay past requests
- [ ] Team workspaces — share collections across users
- [ ] Pre-request scripts and tests (JavaScript)
- [ ] Mock server mode
- [ ] gRPC & GraphQL support
