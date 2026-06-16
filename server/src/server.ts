import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './utils/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

import applicationsRouter from './routes/applications.js';
import modulesRouter from './routes/modules.js';
import incidentsRouter from './routes/incidents.js';
import actionsRouter from './routes/actions.js';
import tagsRouter from './routes/tags.js';
import importRouter from './routes/import.js';
import closuresRouter from './routes/closures.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/applications', applicationsRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/import', importRouter);
app.use('/api/closures', closuresRouter);

app.use(errorHandler);

import { performSeed } from './routes/seed.js';

const startServer = async () => {
  try {
    await connectDB();
    
    if (process.env.USE_MEMORY_DB === 'true') {
      await performSeed();
    }
    
    app.listen(PORT, () => {
      logger.info(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
