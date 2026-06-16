# Setup Instructions

## Prerequisites
- Node.js 18+ (https://nodejs.org/)
- MongoDB 7.0+ locally or MongoDB Atlas account
- Git

## Option 1: Quick Start with Mock DB (Local Dev, no Docker)

### 1. Backend Setup
```bash
cd server
npm install
npm run dev:mock    # Starts in-memory MongoDB and auto-seeds data on http://localhost:5000
```

### 2. Frontend Setup (new terminal)
```bash
cd client
npm install
npm run dev    # Starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

## Option 2: Docker Compose (Production / Full Stack)

Em produção, os mapeamentos de pasta não ocorrem para que a imagem construída seja usada.

```bash
docker-compose up --build
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- MongoDB: localmente na rede do docker

## Features to Try

### Main Page (Home)
1. Select an **Application** (e.g., "Apriso")
2. Choose a **Module** from the dropdown
3. Select an **Incident** and **Action**
4. Add **Tags** from categories
5. Write **Motivo** (reason) and **Análise** (analysis)
6. Copy the generated **Short Description** or **Resolution Notes**

### Admin Dashboard
1. Navigate to **Admin Dashboard** in navbar
2. View stats on all taxonomy items
3. Click links to manage each category

### Manage Applications
1. Go to **Applications** page
2. See all existing applications (prevents duplicates)
3. Add new application
4. Edit or delete as needed

### Manage Modules/Incidents/Actions
- Similar workflow: see existing items, add new ones
- Items are tied to specific applications
- Prevents duplicates per application

### Manage Tags
- Tags are organized by categories (Fábrica, Gerais, etc.)
- Add new tags to categories
- All tags available in main form

## Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running
- Check connection string in `.env`
- For MongoDB Atlas, verify IP whitelist

### "Port 5000/5173 already in use"
- Change PORT in `.env` (server) or vite.config.ts (client)
- Or kill the process using that port

### "Duplicate key error"
- This is by design! The app prevents duplicate entries
- Check existing items before adding new ones
- Edit existing entry instead of creating duplicate

### API not responding from frontend
- Check backend is running on port 5000
- Verify CORS settings in server code
- Check browser console for errors

## Database Seeding

To re-seed the database with initial data:

```bash
cd server
npm run seed
```

## API Documentation

All endpoints return JSON. Base URL: `http://localhost:5000/api`

### Health Check
- `GET /health` - Server status

### Applications
- `GET /applications` - List all
- `POST /applications` - Create (name required)
- `PUT /applications/:id` - Update
- `DELETE /applications/:id` - Delete

### Modules
- `GET /modules?applicationId=:id` - Filter by app
- `POST /modules` - Create (name, applicationId required)
- `PUT /modules/:id` - Update
- `DELETE /modules/:id` - Delete

Similar endpoints for `/incidents`, `/actions`, `/tags`

## Production Deployment

See `DEPLOYMENT.md` for production deployment options (Railway, Render, Docker, etc.)

## Development Tips

- Backend auto-restarts on file changes (nodemon)
- Frontend hot-reloads on save (Vite)
- Check browser console for frontend errors
- Check server console for backend errors
- MongoDB indexes automatically prevent duplicates

## Stopping Services

```bash
# Docker Compose
docker-compose down

# Manual processes
Ctrl+C in each terminal
```

---

Questions? Check the code comments or refer to the plan at `/home/maschior/.claude/plans/async-mapping-quasar.md`
