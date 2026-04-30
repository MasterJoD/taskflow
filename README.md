# TaskFlow - Team Task Manager

A full-stack web application where teams can create projects, assign tasks, and track progress with role-based access control (Admin/Member).

---

## Live Demo

Live App: https://taskflow-production-821c.up.railway.app

GitHub Repo: https://github.com/MasterJoD/taskflow

---

## Features

- User signup and login with JWT authentication
- Create and manage projects
- Invite team members by email
- Create tasks with title, description, priority and due date
- Assign tasks to team members
- Track task status: To Do, In Progress, Done
- Role-based access: Admins manage everything, Members update their own task status
- Dashboard showing total projects, tasks, assigned tasks and overdue count

---

## Tech Stack

- Backend: Node.js, Express.js
- Database: NeDB (file-based NoSQL)
- Authentication: JWT and bcryptjs
- Frontend: HTML, CSS, JavaScript
- Deployment: Railway

---

## Project Structure

taskflow/
├── backend/
│   ├── server.js
│   ├── db/index.js
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js
│       ├── projects.js
│       ├── tasks.js
│       └── users.js
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── package.json
└── README.md

---

## API Endpoints

Auth
- POST /api/auth/signup
- POST /api/auth/login
- GET  /api/auth/me

Projects
- GET    /api/projects
- POST   /api/projects
- GET    /api/projects/:id
- PUT    /api/projects/:id
- DELETE /api/projects/:id
- POST   /api/projects/:id/invite
- DELETE /api/projects/:id/members/:userId

Tasks
- GET    /api/tasks?projectId=xxx
- POST   /api/tasks
- PUT    /api/tasks/:id
- DELETE /api/tasks/:id
- GET    /api/tasks/dashboard

---

## Role-Based Access

Admin:
- Create and delete projects
- Invite and remove members
- Create, assign and delete tasks
- Update task status

Member:
- View project and tasks
- Update status of tasks assigned to them

---

## Run Locally

1. Clone the repo
   git clone https://github.com/MasterJoD/taskflow.git
   cd taskflow

2. Install dependencies
   npm install

3. Create .env file
   cp .env.example .env
   Change JWT_SECRET to any random string

4. Start the server
   npm start

5. Open http://localhost:3000 in your browser

---

## Deployment

Deployed on Railway.
Environment variables required:
- JWT_SECRET: any random secret string
- DB_PATH: ./data

---

