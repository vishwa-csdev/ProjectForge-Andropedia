openssl rand -hex 32openssl rand -hex 32# Andropedia Hub

A project collaboration platform for technical club project work. Members create and join projects, assign and track tasks, manage deadlines, share resources, log contributions, and generate reports.

## Tech Stack

- **Backend:** FastAPI (Python 3.11+), SQLAlchemy ORM, SQLite
- **Frontend:** React + Vite (JavaScript), Tailwind CSS
- **Auth:** Session cookies (Starlette SessionMiddleware)

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- uv (recommended) or pip

### Backend Setup
```bash
cd backend
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Development
Run both in separate terminals:

```bash
# Terminal 1 — Backend
cd backend && source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend (dev server with API proxy)
cd frontend
npm run dev
```

The Vite dev server at `http://localhost:5173` proxies `/api` requests to the FastAPI backend.

### Production
```bash
# Build the frontend
cd frontend && npm run build

# Serve everything from FastAPI
cd backend && source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

One process, one port — FastAPI serves both the API and the built React app.

### Vercel Deployment

This repository is configured for a single Vercel project. Import the repository
with the repository root as the project root; `vercel.json` builds the Vite app
and routes `/api/*` to the FastAPI function in `api/index.py`.

Set these Project Settings values in Vercel:

| Name | Value |
|------|-------|
| `DATABASE_URL` | A hosted database URL, such as a PostgreSQL connection string |
| `SECRET_KEY` | A long random production secret |
| `FRONTEND_URL` | The deployed URL, such as `https://your-project.vercel.app` |
| `DEV_MODE` | `false` |
| `UPLOAD_DIR` | Optional; defaults to `/tmp/andropedia-uploads` on Vercel |
| `SMTP_HOST` | Optional SMTP server hostname |
| `SMTP_PORT` | Optional SMTP server port, normally `587` |
| `SMTP_USER` | Optional SMTP username |
| `SMTP_PASSWORD` | Optional SMTP password |
| `SMTP_FROM` | Optional sender email address |

Use the same values for Preview and Production, except `FRONTEND_URL` can point
to the relevant preview URL. SQLite and Vercel's filesystem are not persistent
storage: use a hosted database, and move uploaded files to object storage when
uploads must survive function restarts or deployments.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./andropedia.db` | Database connection URL |
| `SECRET_KEY` | dev fallback | Session signing key (change in production!) |
| `UPLOAD_DIR` | `./uploads` | File upload storage directory |
| `DEV_MODE` | `true` | Include password recovery links in API responses for local testing |
| `FRONTEND_URL` | `http://localhost:5173` | Base URL used to build password recovery links |
| `SMTP_HOST` | empty | Optional SMTP host for password recovery delivery |
| `SMTP_PORT` | `587` | Optional SMTP port |
| `SMTP_USER` / `SMTP_PASSWORD` | empty | Optional SMTP credentials |
| `SMTP_FROM` | `SMTP_USER` | Optional sender address |
