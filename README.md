# TaskFlow — Project & Task Management

A full-stack web app for managing projects, assigning tasks, and tracking progress with role-based access control (Admin/Member).

## Live Demo
> Deploy URL goes here after Railway deployment

## Features

### Authentication
- JWT-based signup & login
- Persistent sessions (7-day token)
- Secure password hashing (bcryptjs)

### Projects
- Create, edit, delete projects
- Invite members by email
- Role-based access: **Admin** or **Member**
- Progress tracking per project

### Tasks
- Create tasks with title, description, priority, assignee, due date
- Statuses: `Todo` → `In Progress` → `Done`
- Quick inline status updates
- Filter by status and priority
- Overdue detection

### Dashboard
- Overview stats (projects, total/done/overdue tasks)
- My Tasks list (tasks assigned to you)
- Overdue tasks highlighted
- Recent projects

### Role-Based Access Control
| Action | Admin | Member |
|--------|-------|--------|
| Edit/Delete project | ✅ | ❌ |
| Add/Remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Edit any task | ✅ | Own tasks only |
| Delete any task | ✅ | Own tasks only |
| View project & tasks | ✅ | ✅ |

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite (via better-sqlite3)
- **Auth**: JWT + bcryptjs
- **Frontend**: Vanilla JS SPA (no build step)
- **Deployment**: Railway

## API Endpoints

### Auth
```
POST   /api/auth/signup        Create account
POST   /api/auth/login         Login
GET    /api/auth/me            Get current user
```

### Projects
```
GET    /api/projects           List user's projects
POST   /api/projects           Create project
GET    /api/projects/:id       Get project + members
PUT    /api/projects/:id       Update project (Admin)
DELETE /api/projects/:id       Delete project (Admin)
POST   /api/projects/:id/members         Add member (Admin)
PUT    /api/projects/:id/members/:uid    Change role (Admin)
DELETE /api/projects/:id/members/:uid   Remove member (Admin)
```

### Tasks
```
GET    /api/projects/:pid/tasks          List tasks (filterable)
POST   /api/projects/:pid/tasks          Create task
GET    /api/projects/:pid/tasks/:id      Get task
PUT    /api/projects/:pid/tasks/:id      Update task
PATCH  /api/projects/:pid/tasks/:id/status  Quick status update
DELETE /api/projects/:pid/tasks/:id      Delete task
```

### Dashboard
```
GET    /api/dashboard          Overview stats + my tasks + overdue
```

## Local Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd taskflow

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your JWT_SECRET

# Start dev server
npm run dev

# Or production
npm start
```

Open http://localhost:3000

## Deploy to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables:
   - `JWT_SECRET` = any long random string
   - `PORT` = 3000 (Railway sets this automatically)
5. Railway auto-detects Node.js and deploys

**Note on SQLite persistence**: Railway's filesystem is ephemeral. For production use, consider adding a PostgreSQL service via Railway's plugin marketplace, or use a persistent volume mount. For this demo/submission, SQLite works fine.

## Project Structure

```
taskflow/
├── src/
│   ├── server.js          # Express app entry point
│   ├── db.js              # SQLite setup & schema
│   ├── auth.js            # JWT middleware
│   └── routes/
│       ├── auth.js        # Signup/login routes
│       ├── projects.js    # Project CRUD + members
│       ├── tasks.js       # Task CRUD
│       └── dashboard.js   # Stats endpoint
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js         # API client
│       ├── ui.js          # UI utilities
│       ├── app.js         # Router + auth flow
│       └── views/
│           ├── dashboard.js
│           ├── projects.js
│           ├── project-detail.js
│           └── my-tasks.js
├── package.json
├── railway.toml
└── .env.example
```

## Screenshots
> Add screenshots here

## Author
> Your name here
