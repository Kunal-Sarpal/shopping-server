import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import dataRoutes from './routes/data.js';
import dashboardRoutes from './routes/dashboard.js';
import storeRoutes from './routes/store.js';
import analyticsRoutes from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB (non-blocking)
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if frontend dist exists
const distPath = join(__dirname, '..', 'suraj', 'dist');
const hasFrontendDist = existsSync(join(distPath, 'index.html'));

if (hasFrontendDist) {
  app.use(express.static(distPath));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', dataRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root / SPA fallback for React Client-Side Routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (hasFrontendDist) {
    return res.sendFile(join(distPath, 'index.html'));
  }
  res.json({
    status: 'online',
    message: 'Fashion ERP API Server',
    health: '/api/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Fashion ERP Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
