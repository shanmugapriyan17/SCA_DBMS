# 🎯 Smart Career Advisor

> **A DBMS-Driven Career Guidance & Skill Assessment Platform**  
> Powered by **MongoDB Atlas**, **MySQL (PlanetScale)**, and **Neo4j AuraDB**

[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?logo=node.js)](https://nodejs.org)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TypeScript-blue?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/DB1-MongoDB%20Atlas-47A248?logo=mongodb)](https://cloud.mongodb.com)
[![MySQL](https://img.shields.io/badge/DB2-MySQL%20%2F%20PlanetScale-4479A1?logo=mysql)](https://planetscale.com)
[![Neo4j](https://img.shields.io/badge/DB3-Neo4j%20AuraDB-008CC1?logo=neo4j)](https://neo4j.com/cloud)
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [System Architecture](#-system-architecture)
3. [Database Design (DBMS Core)](#-database-design-dbms-core)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [Quick Start (Local)](#-quick-start-local)
7. [Online Deployment Guide](#-online-deployment-guide)
   - [Step 1 — MongoDB Atlas](#step-1--mongodb-atlas-free)
   - [Step 2 — MySQL PlanetScale](#step-2--mysql-planetscale-free)
   - [Step 3 — Neo4j AuraDB](#step-3--neo4j-auradb-free)
   - [Step 4 — Backend on Render](#step-4--backend-on-render-free)
   - [Step 5 — Frontend on Vercel](#step-5--frontend-on-vercel-free)
8. [API Reference](#-api-reference)
9. [Environment Variables](#-environment-variables)

---

## 🔍 Project Overview

**Smart Career Advisor** is a full-stack academic DBMS project that demonstrates the practical integration of **three different database paradigms** in a single real-world application:

| Database | Paradigm | Usage |
|----------|----------|-------|
| **MongoDB Atlas** | Document / NoSQL | Core app data — users, assessments, questions, skills, careers, attempts |
| **MySQL (PlanetScale)** | Relational / SQL + PL/SQL | Analytics & reporting — login history, assessment stats, platform metrics |
| **Neo4j AuraDB** | Graph Database | Career recommendation engine — skill-to-career relationship graph |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────┐
│              FRONTEND (Vercel)              │
│   React 18 + TypeScript + Vite + Tailwind   │
└────────────────────┬────────────────────────┘
                     │ HTTPS / REST API
┌────────────────────▼────────────────────────┐
│              BACKEND (Render)               │
│         Node.js + Express.js API            │
│  /api/auth  /api/skills  /api/assessments   │
│  /api/careers  /api/analytics               │
└───────┬──────────────┬──────────────┬───────┘
        │              │              │
┌───────▼───┐  ┌───────▼───┐  ┌──────▼──────┐
│  MongoDB  │  │   MySQL   │  │   Neo4j     │
│  (Atlas)  │  │(PlanetSc.)│  │  (AuraDB)   │
│  NoSQL    │  │  SQL/PLSQL│  │   Graph     │
└───────────┘  └───────────┘  └─────────────┘
```

---

## 🗄 Database Design (DBMS Core)

### MongoDB Collections (NoSQL)

| Collection | Purpose |
|------------|---------|
| `users` | User accounts, profiles, authentication |
| `assessments` | Skill test definitions, metadata |
| `questions` | MCQ question bank per skill/difficulty |
| `skills` | Skill catalogue with categories |
| `careers` | Career path definitions with required skills |
| `attempts` | Assessment attempt records & scores |
| `userskills` | Per-user skill proficiency tracking |

**Key Aggregation Pipelines:**
- `$lookup` joins (Users ↔ Skills ↔ Attempts)
- `$group` with `$avg`, `$sum` for scoring
- Career matching with `$filter` + `$divide` (match %)

### MySQL Tables (Relational / Analytics)

| Table | Purpose |
|-------|---------|
| `login_history` | Security audit — all login events |
| `assessment_analytics` | Aggregated test performance stats |
| `platform_stats` | Daily platform usage metrics |
| `skill_popularity` | Which skills are trending |
| `user_activity_summary` | Per-user engagement scores |

**PL/SQL Stored Procedures:**  
See [`backend-node/database/sql/plsql_procedures.sql`](./backend-node/database/sql/plsql_procedures.sql)

### Neo4j Graph (Career Recommendation)

```
(:Skill {name}) -[:REQUIRED_FOR]-> (:Career {title})
(:User {id})    -[:HAS_SKILL]->    (:Skill {name})
```
The graph engine ranks careers by how many of the user's skills overlap with required skills.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| UI Components | Radix UI + shadcn/ui + MUI |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Routing | React Router v7 |
| Backend | Node.js + Express.js |
| Primary DB | MongoDB + Mongoose |
| Analytics DB | MySQL2 |
| Graph DB | Neo4j Driver v5 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| Dev | Nodemon |

---

## 📁 Project Structure

```
Smart_Career_Advisor/
├── .gitignore
├── README.md
├── render.yaml                    ← Render.com deploy config (backend)
│
├── backend-node/
│   ├── .env.example               ← ⭐ Copy to .env and fill values
│   ├── package.json
│   ├── src/
│   │   ├── app.js                 ← Express entry point
│   │   ├── config/
│   │   │   ├── mongodb.js         ← MongoDB Atlas connection
│   │   │   ├── mysql.js           ← MySQL / PlanetScale connection (SSL)
│   │   │   ├── neo4j.js           ← Neo4j AuraDB connection (auto-TLS)
│   │   │   └── constants.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js ← JWT verification
│   │   ├── models/                ← Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Assessment.js
│   │   │   ├── Question.js
│   │   │   ├── Skill.js
│   │   │   ├── Career.js
│   │   │   ├── Attempt.js
│   │   │   └── UserSkill.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── skills.routes.js
│   │   │   ├── assessments.routes.js
│   │   │   ├── careers.routes.js
│   │   │   └── analytics.routes.js
│   │   └── services/
│   │       ├── mongodb.service.js ← CRUD + Aggregation layer
│   │       └── plsql.service.js   ← MySQL / PL/SQL operations
│   └── database/
│       ├── seed/
│       │   ├── seed.js            ← Seed MongoDB
│       │   ├── seed-sql.js        ← Seed MySQL
│       │   └── seed-neo4j.js      ← Seed Neo4j graph
│       └── sql/
│           ├── init-sql.sql       ← MySQL schema creation
│           ├── plsql_procedures.sql
│           └── plsql_demo.sql
│
└── frontend/
    ├── .env.example               ← ⭐ Copy to .env and fill values
    ├── vercel.json                ← Vercel deploy config
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        └── app/
            ├── App.tsx
            ├── components/
            └── pages/
                ├── landing.tsx
                ├── login.tsx
                ├── signup.tsx
                ├── dashboard.tsx
                ├── assessments.tsx
                ├── skills.tsx
                ├── careers.tsx
                ├── results.tsx
                └── about.tsx
```

---

## ⚡ Quick Start (Local)

### Prerequisites

- Node.js 18+
- MongoDB installed locally **OR** MongoDB Atlas account
- MySQL 8+ installed locally **OR** PlanetScale account
- Neo4j Desktop installed locally **OR** Neo4j AuraDB account

### 1 — Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/smart-career-advisor.git
cd smart-career-advisor

# Install backend dependencies
cd backend-node
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2 — Configure Environment

```bash
# Backend
cd backend-node
cp .env.example .env
# Edit .env with your actual DB credentials

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env — set VITE_API_URL=http://localhost:10000/api
```

### 3 — Initialize Databases

```bash
cd backend-node

# MySQL: create schema tables
# Run this SQL in MySQL workbench / CLI:
# mysql -u root -p < database/sql/init-sql.sql

# Seed MongoDB with sample data
npm run seed

# Seed MySQL with analytics data
npm run seed-sql

# Seed Neo4j graph (optional)
node database/seed/seed-neo4j.js
```

### 4 — Run Locally

```bash
# Terminal 1 — Backend (port 10000)
cd backend-node
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open → **http://localhost:5173**  
API Health → **http://localhost:10000/api/health**

---

## 🌐 Online Deployment Guide

### Step 1 — MongoDB Atlas (Free)

1. Go to → **https://cloud.mongodb.com** → Create a free account
2. Create a **Free M0 Cluster** (choose any region)
3. Under **Database Access** → Create a user with read/write permissions
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — for Render)
5. Click **Connect** → **Drivers** → Copy the **SRV connection string**
6. Replace `<password>` with your DB user's password
7. Save → `MONGODB_URI=mongodb+srv://...` (use in Step 4)

### Step 2 — MySQL PlanetScale (Free)

> **Alternative:** Railway.app MySQL or Clever Cloud MySQL also work  
> PlanetScale is recommended — it has a generous free tier with no cold starts

1. Go to → **https://planetscale.com** → Create a free account
2. Create a new database → name it `skill_career_analytics`
3. Click **Connect** → choose **Node.js** → copy credentials
4. Go to the **Console** tab → paste and run the SQL from:
   ```
   backend-node/database/sql/init-sql.sql
   ```
5. Note: `MYSQL_SSL=true` must be set for PlanetScale

### Step 3 — Neo4j AuraDB (Free)

1. Go to → **https://neo4j.com/cloud/platform/aura-graph-database/**
2. Sign up → Create a **Free AuraDB** instance
3. Download or copy the generated password (shown only once!)
4. Copy the **Connection URI** — it starts with `neo4j+s://`
5. After backend deploys, run the Neo4j seed from your local machine:
   ```bash
   cd backend-node
   node database/seed/seed-neo4j.js
   ```

### Step 4 — Backend on Render (Free)

1. Go to → **https://render.com** → Connect your GitHub account
2. Click **New → Web Service**
3. Select your `smart-career-advisor` repository
4. Render will auto-detect `render.yaml` — click **Apply**
5. In the **Environment** tab, add all secret variables:
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your Atlas SRV string |
   | `MYSQL_HOST` | PlanetScale host |
   | `MYSQL_USER` | PlanetScale user |
   | `MYSQL_PASSWORD` | PlanetScale password |
   | `NEO4J_URI` | `neo4j+s://xxxx.databases.neo4j.io` |
   | `NEO4J_PASSWORD` | AuraDB password |
   | `JWT_SECRET` | Random 64-char hex string |
   | `FRONTEND_URL` | Your Vercel URL (after Step 5) |
6. Click **Deploy** — wait ~3 minutes
7. Test: `https://your-backend.onrender.com/api/health`

> ⚠️ **Free Render tier sleeps after 15 min.** First request takes ~30s to wake up.

### Step 5 — Frontend on Vercel (Free)

1. Go to → **https://vercel.com** → Connect your GitHub account
2. Click **New Project** → import `smart-career-advisor`
3. Set **Root Directory** → `frontend`
4. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` |
5. Click **Deploy** — done in ~2 minutes
6. Copy the Vercel URL → go back to Render → update `FRONTEND_URL`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (🔒) |
| PUT | `/api/auth/profile` | Update profile (🔒) |

### Skills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | List all skills |
| GET | `/api/skills/:id` | Get skill details |
| POST | `/api/skills` | Create skill (🔒) |

### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments` | List assessments |
| GET | `/api/assessments/:id` | Get with questions |
| POST | `/api/assessments/:id/submit` | Submit attempt (🔒) |
| GET | `/api/assessments/history` | User history (🔒) |

### Careers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/careers` | All careers |
| GET | `/api/careers/recommendations` | Personalized (🔒 + Neo4j) |

### Analytics (MySQL)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Platform overview |
| GET | `/api/analytics/skills` | Skill popularity stats |
| GET | `/api/analytics/assessments` | Assessment performance |

🔒 = Requires `Authorization: Bearer <jwt_token>` header

---

## 🔐 Environment Variables

### Backend (`backend-node/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 10000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `JWT_SECRET` | **Yes** | 64+ char random secret |
| `JWT_EXPIRES_IN` | Yes | Token expiry (e.g. `7d`) |
| `MONGODB_URI` | **Yes** | MongoDB Atlas SRV string |
| `MYSQL_HOST` | Yes | MySQL host |
| `MYSQL_PORT` | Yes | MySQL port (3306) |
| `MYSQL_USER` | Yes | MySQL username |
| `MYSQL_PASSWORD` | **Yes** | MySQL password |
| `MYSQL_DATABASE` | Yes | Database name |
| `MYSQL_SSL` | Yes | `true` for cloud providers |
| `NEO4J_URI` | Yes | Neo4j AuraDB URI |
| `NEO4J_USER` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | **Yes** | Neo4j password |
| `FRONTEND_URL` | **Yes** | Allowed CORS origin(s) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Full backend API URL |

---

## 👥 Authors

- Smart Career Advisor Team — DBMS Academic Project 2026

---

## 📄 License

This project is for academic purposes. MIT License.
