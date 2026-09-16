# Andropedia Hub

> **A collaborative project management platform built for technical clubs.**

Andropedia Hub is a full-stack collaboration platform designed to help technical clubs organize, build, and document projects in one place.

Instead of scattering project information across chats, spreadsheets, cloud drives, and task boards, Andropedia brings **projects, members, tasks, deadlines, resources, contributions, and reports** into a single workspace.

---

## What is Andropedia?

Technical club projects often involve multiple members, changing responsibilities, deadlines, documentation, and shared resources.

Andropedia provides a centralized workspace where club members can:

- Create and manage projects
- Build project teams
- Assign and track tasks
- Manage deadlines and milestones
- Store project resources
- Track individual contributions
- Monitor project progress
- Generate project reports
- Manage accounts and authentication
- Support password recovery through email
- Deploy the entire platform to the cloud

The goal is simple:

**Turn a collection of club projects into an organized, searchable project ecosystem.**

---

## Architecture

```text
                         ┌─────────────────────┐
                         │      User / Club     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React + Vite UI   │
                         │     Tailwind CSS    │
                         └──────────┬──────────┘
                                    │
                              REST / API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend   │
                         │     Python 3.11+    │
                         └──────────┬──────────┘
                                    │
                              SQLAlchemy ORM
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ PostgreSQL / Neon   │
                         └─────────────────────┘
```

For production deployments, the frontend and API can be deployed through a single Vercel project while PostgreSQL is hosted separately.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React | UI framework |
| Vite | Development & build tooling |
| Tailwind CSS | Styling |
| JavaScript | Application logic |

### Backend

| Technology | Purpose |
|---|---|
| Python 3.11+ | Backend runtime |
| FastAPI | REST API |
| SQLAlchemy | Database ORM |
| Starlette | Sessions & middleware |

### Database

**PostgreSQL / Neon**

SQLite is supported for local development, while PostgreSQL is recommended for production deployments.

### Deployment

- Vercel
- Neon PostgreSQL
- Serverless API functions
- GitHub

---

# Features

## Project Management

Create and manage club projects from a centralized dashboard.

Each project can contain its own:

- Project information
- Members
- Tasks
- Deadlines
- Resources
- Contribution history
- Progress information

---

## Team Collaboration

Projects can have multiple members working together.

Members can be assigned responsibilities and their contributions can be tracked throughout the project's lifecycle.

---

## Task Management

Break projects into manageable tasks.

Track:

- Task ownership
- Status
- Deadlines
- Project progress

This makes it easier for teams to understand what needs to be done and who is responsible for it.

---

## Deadlines & Progress

Keep important project milestones visible and organized.

Project progress can be tracked without relying on external spreadsheets or task-management tools.

---

## Resource Management

Keep useful project resources associated with the project instead of storing everything across disconnected platforms.

Resources can include:

- Documentation
- References
- Links
- Project files
- Supporting material

---

## Contribution Tracking

Andropedia keeps track of project contributions, making it easier for club leadership to understand how members participate throughout a project.

This can eventually serve as a foundation for:

- Contribution reports
- Member activity
- Project evaluations
- Club documentation

---

## Project Reports

Generate structured information about projects and their activity.

Reports can provide a consolidated view of:

- Project information
- Members
- Tasks
- Progress
- Contributions
- Resources

---

## Authentication

The platform uses session-based authentication.

Features include:

- Account registration
- Login/logout
- Secure session cookies
- Password recovery
- Production secret configuration

---

# Project Structure

```text
ProjectForge-Andropedia/
│
├── api/
│   └── index.py
│
├── backend/
│   ├── main.py
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .agents/
│   └── skills/
│
├── neon.ts
├── hello.ts
├── package.json
├── requirements.txt
├── vercel.json
└── README.md
```

> The exact internal structure may evolve as the platform grows.

---

# Getting Started

## Prerequisites

Make sure you have:

- Python **3.11+**
- Node.js **18+**
- npm
- Git
- `uv` *(recommended)* or pip

---

## 1. Clone the Repository

```bash
git clone https://github.com/vishwa-csdev/ProjectForge-Andropedia.git

cd ProjectForge-Andropedia
```

---

## 2. Setup the Backend

Using `uv`:

```bash
cd backend

uv venv .venv

source .venv/bin/activate

uv pip install -r requirements.txt
```

Or using pip:

```bash
cd backend

python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt
```

---

## 3. Setup the Frontend

```bash
cd frontend

npm install
```

---

# Running Locally

You'll need two terminals.

### Terminal 1 — Backend

```bash
cd backend

source .venv/bin/activate

uvicorn main:app --reload --port 8000
```

### Terminal 2 — Frontend

```bash
cd frontend

npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

The FastAPI backend will run at:

```text
http://localhost:8000
```

The Vite development server proxies `/api` requests to FastAPI.

---

# Database

## Local Development

The application can use SQLite by default:

```env
DATABASE_URL=sqlite:///./andropedia.db
```

## Production

For production, use PostgreSQL.

Andropedia is designed to work with hosted PostgreSQL providers such as **Neon**.

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

> Never commit database credentials or production secrets to Git.

---

# Environment Variables

Create the required environment variables for your deployment.

| Variable | Required | Description |
|---|---:|---|
| `DATABASE_URL` | Yes | Database connection URL |
| `SECRET_KEY` | Yes | Secret used for session signing |
| `FRONTEND_URL` | Yes | Public application URL |
| `DEV_MODE` | No | Enables development-only functionality |
| `UPLOAD_DIR` | No | File upload directory |
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP server port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASSWORD` | No | SMTP password |
| `SMTP_FROM` | No | Sender email address |

### Example

```env
DATABASE_URL=your_neon_database_url
SECRET_KEY=your_long_random_secret
FRONTEND_URL=http://localhost:5173
DEV_MODE=true
```

For production:

```env
DEV_MODE=false
```

---

# Production Deployment

Andropedia can be deployed as a single Vercel project.

The repository contains Vercel configuration that builds the React frontend and routes `/api/*` requests to the FastAPI API function.

## Recommended Architecture

```text
GitHub
   │
   ▼
 Vercel
 ┌───────────────────────┐
 │ React + Vite          │
 │ FastAPI API           │
 └───────────┬───────────┘
             │
             ▼
       Neon PostgreSQL
```

### Vercel Environment Variables

Configure:

```text
DATABASE_URL
SECRET_KEY
FRONTEND_URL
DEV_MODE=false
```

Optional email configuration:

```text
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
```

---

# File Storage

Vercel's filesystem should **not** be treated as permanent storage.

For production deployments, uploaded files should eventually be moved to dedicated object storage.

Possible options include:

- Vercel Blob
- Cloudflare R2
- AWS S3
- Supabase Storage

The database should store metadata and references rather than relying on temporary serverless filesystem storage.

---

# Security

Before deploying publicly:

- Generate a strong `SECRET_KEY`
- Never commit `.env` files
- Never expose database credentials
- Disable development mode
- Use HTTPS
- Configure production CORS carefully
- Validate uploaded files
- Apply authentication checks to protected endpoints
- Use a production PostgreSQL database
- Store uploaded files in persistent object storage

Example secret generation:

```bash
openssl rand -hex 32
```

---

# Development Workflow

A typical development cycle:

```text
Create Project
      │
      ▼
Add Members
      │
      ▼
Create Tasks
      │
      ▼
Assign Responsibilities
      │
      ▼
Track Progress
      │
      ▼
Add Resources
      │
      ▼
Record Contributions
      │
      ▼
Generate Report
```

---

# Roadmap

## Core Platform

- [x] Project management
- [x] User authentication
- [x] Team collaboration
- [x] Task management
- [x] Resource management
- [x] Contribution tracking
- [x] Reports
- [x] PostgreSQL support
- [x] Vercel deployment configuration

## Planned

- [ ] Club-wide dashboard
- [ ] Project discovery
- [ ] Advanced search
- [ ] Notifications
- [ ] Activity timeline
- [ ] Project milestones
- [ ] Role-based permissions
- [ ] Admin dashboard
- [ ] Member profiles
- [ ] File/object storage
- [ ] Email notifications
- [ ] Analytics
- [ ] Project templates
- [ ] Audit logs

## Future

- [ ] GitHub integration
- [ ] GitHub contribution synchronization
- [ ] Discord integration
- [ ] Calendar integration
- [ ] Automated project documentation
- [ ] AI-assisted project summaries
- [ ] AI-assisted task generation
- [ ] Club-wide knowledge base

---

# Contributing

Contributions are welcome.

### 1. Fork the Repository

```bash
git clone https://github.com/vishwa-csdev/ProjectForge-Andropedia.git
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature
```

### 3. Make Your Changes

Test both the frontend and backend locally.

### 4. Commit

```bash
git add .

git commit -m "feat: add your feature"
```

### 5. Push

```bash
git push origin feature/your-feature
```

Then open a Pull Request.

---

# License

This project is currently maintained as a technical-club project.

Add the project's chosen open-source license here before distributing the project publicly.

---

# Project

**Andropedia Hub**

A centralized workspace for building, managing, and documenting technical club projects.

**Repository:**  
https://github.com/vishwa-csdev/ProjectForge-Andropedia

**Live Application:**  
https://andropedia-hub.vercel.app/

---

## Built for Technical Clubs

Andropedia is more than a task manager.

It is designed to become the **central project workspace for a technical club** — connecting people, projects, tasks, knowledge, resources, and contributions in one platform.

**Build together. Track progress. Preserve knowledge. Ship better projects.**
