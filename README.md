# Andropedia Hub

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
