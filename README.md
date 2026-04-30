# TaskFlow — Team Task Manager

A full-stack web application where teams can create projects, assign tasks, and track progress with **role-based access control (Admin/Member)**.

---

## Live Demo

🔗 **Live App** — https://taskflow-production-821c.up.railway.app

📁 **GitHub Repo** — https://github.com/MasterJoD/taskflow

---

## Features

### Authentication
- Secure Signup and Login
- JWT-based session management
- Passwords hashed with bcryptjs

### Project Management
- Create and manage multiple projects
- Invite team members by email
- Admin can remove members

### Task Management
- Create tasks with title, description, priority (Low / Medium / High)
- Assign tasks to team members
- Set due dates
- Track status: **To Do → In Progress → Done**
- Overdue task detection

### Role-Based Access Control

| Feature | Admin | Member |
|---|---|---|
| Create project | ✅ | ❌ |
| Invite members | ✅ | ❌ |
| Create tasks | ✅ | ❌ |
| Assign tasks | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| View dashboard | ✅ | ✅ |

### Dashboard
- Total projects count
- Total tasks count
- Tasks assigned to current user
- Overdue tasks count
- Progress bars (To Do / In Progress / Done)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | NeDB (file-based NoSQL) |
| Authentication | JWT + bcryptjs |
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Deployment | Railway |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── db/
│   │   └── index.js           # Database setup (NeDB)
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   └── routes/
│       ├── auth.js            # Signup, Login, Me
│       ├── projects.js        # Project CRUD + member management
│       ├── tasks.js           # Task CRUD + dashboard stats
│       └── users.js           # User search
├── frontend/
│   ├── index.html             # Single page app
│   ├── style.css              # All styles
│   └── app.js                 # Frontend logic
├── package.json
├── .env.example
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/projects` | Get all projects | Any |
| POST | `/api/projects` | Create project | Any |
| GET | `/api/projects/:id` | Get project details | Member+ |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project | Admin |
| POST | `/api/projects/:id/invite` | Invite member by email | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Admin |

### Tasks
| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/tasks?projectId=xxx` | Get tasks for project | Any |
| POST | `/api/tasks` | Create task | Admin |
| PUT | `/api/tasks/:id` | Update task | Admin / Member (status only) |
| DELETE | `/api/tasks/:id` | Delete task | Admin |
| GET | `/api/tasks/dashboard` | Get dashboard stats | Any |

---

## Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/MasterJoD/taskflow.git
cd taskflow

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env and change JWT_SECRET to any random string

# 4. Start the server
npm start

# 5. Open in browser
# Go to http://localhost:3000
```

---

## Deployment (Railway)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select this repository
4. Add environment variables in the Variables tab:
   - `JWT_SECRET` = any random secret string
   - `DB_PATH` = `./data`
5. Go to Settings → Networking → Generate Domain
6. App is live ✅

---

## Author

Built as part of Full-Stack Developer Assessment.

> Completed within the given timeline of 1-2 days.
