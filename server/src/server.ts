import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './utils/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { ensureDefaultAdmin } from './utils/bootstrap.js';

import applicationsRouter from './routes/applications.js';
import modulesRouter from './routes/modules.js';
import incidentsRouter from './routes/incidents.js';
import actionsRouter from './routes/actions.js';
import tagsRouter from './routes/tags.js';
import importRouter from './routes/import.js';
import closuresRouter from './routes/closures.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import workspacesRouter from './routes/workspaces.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5005',
  'http://10.133.58.129:5173',
  'http://10.133.58.129:3000',
  'http://10.133.58.129:5005',
  'http://cbzlmdaassup06:5173',
  'http://cbzlmdaassup06:3000',
  'http://cbzlmdaassup06:5005'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

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
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/workspaces', workspacesRouter);

app.use(errorHandler);

import { performSeed } from './routes/seed.js';

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.USE_MEMORY_DB === 'true') {
      await performSeed();
    } else {
      await ensureDefaultAdmin();
    }

    app.listen(PORT, () => {
      logger.info(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:');
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error:', error);
    }
    process.exit(1);
  }
};

startServer();

export default app;
