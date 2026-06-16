# Service Now Taxonomy App

A full-stack web application for managing ServiceNow incident taxonomy and classification, designed to help support teams build standardized Short Descriptions and Resolution Notes.

## Features

- **Taxonomy Classification**: Hierarchical classification using Applications, Modules, Incidents, and Actions.
- **Standardized Outputs**: Automatically generates copyable *Short Descriptions* (`Application:Module:Local Support:Incident:Action`) and *Resolution Notes*.
- **Ticket Closure Registration**: Save classification records directly to the database (including Short Description, Resolution Notes, taxonomy references, and custom notes).
- **Interactive High-Density UI**: Fully responsive interface using custom Vanilla CSS with vibrant color palettes, glassmorphism effects, dark mode aesthetics, and a clean sidebar layout.
- **State Persistence (localStorage)**: Form selections and inputs (Motivo, Análise, Solução, selected tags, hierarchy) are cached instantly on input and restored on page reload.
- **Clear Confirmation**: Prevents accidental data loss by prompting a confirmation dialog before clearing fields.
- **Frontend Module Deduplication**: Groups modules with identical names across different applications on the UI while maintaining strict 1:N relations in MongoDB to avoid incident leakage.
- **Type Safety**: Fully typed codebase using TypeScript across both backend and frontend.
- **REST API**: Built with Node.js/Express, MongoDB/Mongoose, and input validation using `express-validator`.

---

## Project Structure

```
├── client/               # React frontend (Vite + TypeScript + Vanilla CSS)
├── server/               # Node.js backend (Express + TypeScript + Mongoose)
├── docker-compose.yml    # Multi-container local deployment
└── AGENTS.md             # Developer instructions, design decisions & pitfalls
```

---

## Quick Start

### Run with Docker Compose (Production / Full Stack)

Para rodar em produção (ou com o stack completo isolado), os containers não mapeiam volumes locais de código. Eles compilam a versão atual para rodar.

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

### Run Locally (Development)

#### Prerequisites
- Node.js 18+

#### 1. Backend Setup (with in-memory Mock DB)

```bash
cd server
cp .env.example .env
npm install
npm run dev:mock  # Starts the Express server with an in-memory MongoDB on port 5000 and auto-seeds data
# (If you have a real local MongoDB, you can use `npm run dev` instead)
```

#### 2. Frontend Setup

```bash
cd client
npm install
npm run dev   # Start the Vite dev server on port 5173
```

---

## API Endpoints

- **Taxonomy Routes**:
  - `GET/POST /api/applications`
  - `GET/POST /api/modules`
  - `GET/POST /api/incidents`
  - `GET/POST /api/actions`
  - `GET/POST /api/tags`
  - `GET/POST /api/tags/categories`
- **Closure Logs**:
  - `GET/POST /api/closures` (Retrieve recent closures / Log a new ticket closure)
- **Data Import**:
  - `POST /api/import` (CSV bulk import)

---

## Best Practices Implemented

- ✅ **Strict 1:N Modeling** with Frontend grouping (Group By) to prevent incident leakage.
- ✅ **Atomic API Validations** using `express-validator` middleware.
- ✅ **Local Caching** with standard browser storage for optimal user experience.
- ✅ **Conventional Commits** for clean git history tracking.
- ✅ **Vanilla CSS** styling without framework overhead.
