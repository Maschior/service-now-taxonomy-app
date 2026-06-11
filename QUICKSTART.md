# Quick Start Guide

## 🚀 Get Running in 2 Minutes

### Option A: Docker (Easiest)
```bash
docker-compose up
```
Open http://localhost:5173 in your browser.

### Option B: Manual with Local MongoDB

**Prerequisites:**
- Node.js 18+
- MongoDB running locally (or use MongoDB Atlas connection string)

**Terminal 1 - Start MongoDB:**
```bash
mongod  # macOS/Linux
# or use MongoDB Atlas URL in .env
```

**Terminal 2 - Backend:**
```bash
cd server
npm install
npm run seed
npm run dev
```
Backend ready at: http://localhost:5000

**Terminal 3 - Frontend:**
```bash
cd client
npm install
npm run dev
```
Frontend ready at: http://localhost:5173

## 🧪 Test It Out

1. **Main Page:** Select an application → choose module/incident/action → add tags → copy results
2. **Admin Dashboard:** View data statistics
3. **Manage Applications:** Add new apps (duplicates prevented)
4. **Manage Modules/Incidents/Actions:** Add per application
5. **Manage Tags:** Add tags by category

## 📚 Production Deployment

See `DEPLOYMENT.md` for Railway, Render, or Docker deployment.

## ❓ Troubleshooting

**Port in use?**
- Change PORT in server/.env or vite.config.ts

**MongoDB connection error?**
- Update MONGODB_URI in server/.env
- Use MongoDB Atlas for cloud database

**Duplicate entry error?**
- This is by design! Check existing items first

See `SETUP.md` for detailed instructions.
