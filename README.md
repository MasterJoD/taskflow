# TaskFlow — Team Task Manager

A full-stack web app to manage projects, assign tasks, and track progress with **role-based access control (Admin/Member)**.

## Features

- **Authentication** — Signup, Login with JWT tokens
- **Projects** — Create, manage, and invite team members
- **Role-Based Access** — Admins create/edit tasks; Members update their task status
- **Task Board** — Kanban-style: To Do → In Progress → Done
- **Dashboard** — Stats: total projects, tasks, overdue count, progress bars

## Tech Stack

- **Backend** — Node.js, Express.js
- **Database** — NeDB (file-based, no setup needed)
- **Auth** — JWT (JSON Web Tokens) + bcryptjs for password hashing
- **Frontend** — Plain HTML, CSS, JavaScript (no framework)
- **Deployment** — Railway

---

## Run Locally

```bash
# 1. Clone and install
git clone <your-repo-url>
cd taskflow
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env and change JWT_SECRET to something random

# 3. Start the server
npm start

# 4. Open in browser
# Go to http://localhost:3000
```

---

## Deploy to Railway (Step by Step)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - TaskFlow app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign up (free)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub and select your repository
5. Railway will auto-detect it's a Node.js app

### Step 3: Add Environment Variables

In Railway dashboard → your project → **Variables tab**, add:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | `some-random-long-string-here` |
| `PORT` | `3000` |

### Step 4: Done!

Railway will give you a live URL like `https://taskflow-production.up.railway.app`

---

## API Routes

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Projects
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | /api/projects | List all projects | Any |
| POST | /api/projects | Create project | Any |
| GET | /api/projects/:id | Get project details | Member+ |
| PUT | /api/projects/:id | Update project | Admin |
| DELETE | /api/projects/:id | Delete project | Admin |
| POST | /api/projects/:id/invite | Add member by email | Admin |
| DELETE | /api/projects/:id/members/:userId | Remove member | Admin |

### Tasks
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | /api/tasks?projectId=xxx | Get all tasks | Any |
| POST | /api/tasks | Create task | Admin |
| PUT | /api/tasks/:id | Update task | Admin (all) / Member (status only) |
| DELETE | /api/tasks/:id | Delete task | Admin |
| GET | /api/tasks/dashboard | Dashboard stats | Any |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── db/index.js        # NeDB database setup
│   ├── middleware/auth.js  # JWT authentication
│   └── routes/
│       ├── auth.js        # Login/signup
│       ├── projects.js    # Project CRUD
│       ├── tasks.js       # Task CRUD
│       └── users.js       # User search
├── frontend/
│   ├── index.html         # Single page app
│   ├── style.css          # All styles
│   └── app.js             # Frontend logic
├── package.json
├── .env.example
└── README.md
```
