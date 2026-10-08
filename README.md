# ComplyTrack

A modern SaaS web application for contractor compliance document tracking for small organisations in South Africa.
ComplyTrack is currently under active development.

## Stack

- Frontend: React + Vite, JSX, React Router, Lucide React, Axios
- Backend: Node.js + Express
- Database: PostgreSQL hosted on Neon
- Authentication foundation: JWT
- Version control: Git + GitHub
- Deployment-ready: Vercel (frontend) + Render/Railway (backend)

## Project structure

```text
complytrack/
├── frontend/
│   ├── public/
│   │   └── logo.svg
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── db.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── schema.sql
└── README.md
```

## Run locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Add your Neon DATABASE_URL and JWT_SECRET
npm run dev
```

API: `http://localhost:5000`

### 2. Frontend

Open another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

## Neon

Run `backend/schema.sql` against your Neon PostgreSQL database.

The starter UI includes realistic demo data so the frontend can be reviewed before the API is connected. The API layer is ready for PostgreSQL integration.

## Enterprise-minded features included in the architecture

- Role-based access foundation
- Audit log table
- Document version/history model
- Expiry/status calculation
- Contractor/document relationships
- Reminder model
- Report endpoints
- Health endpoint
- Environment variables
- Centralised API client
- Protected-route foundation
- Responsive dashboard shell
- Search/filter-ready contractor view

## Suggested production hardening

Before production, add:
- Real authentication and refresh tokens
- Object storage for uploaded files
- Malware/file validation
- Rate limiting
- Strong password hashing with Argon2/bcrypt
- Server-side validation
- Automated email reminders
- Background jobs/queue
- Database migrations
- Automated tests
- Error monitoring
- Security headers
- Backups and retention policies
