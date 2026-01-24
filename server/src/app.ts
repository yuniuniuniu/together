import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import spacesRoutes from './routes/spaces.js';
import memoriesRoutes from './routes/memories.js';
import milestonesRoutes from './routes/milestones.js';
import notificationsRoutes from './routes/notifications.js';
import reactionsRoutes from './routes/reactions.js';
import uploadRoutes from './routes/upload.js';

const app = express();

app.use(cors({
  exposedHeaders: ['X-New-Token'], // Allow frontend to read token refresh header
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spacesRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reactions', reactionsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// Error handling
app.use(errorHandler);

export default app;
