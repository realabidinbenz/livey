import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import dotenv from 'dotenv';
import { loggingMiddleware } from './middleware/logging.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { globalLimiter } from './middleware/rateLimiter.middleware.js';
import { sanitizeMiddleware } from './middleware/sanitize.middleware.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const WIDGET_ORIGINS = process.env.WIDGET_ORIGINS || ''; // Comma-separated list of allowed widget origins

// Security middleware
app.use(helmet());
app.use(hpp());
app.use(globalLimiter);

// CORS configuration - allow frontend + widget origins
const allowedOrigins = [FRONTEND_URL, ...WIDGET_ORIGINS.split(',').filter(Boolean)];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    const err = new Error('Not allowed by CORS');
    err.status = 403;
    callback(err);
  },
  credentials: true
}));

// Body parser with size limits (prevents payload DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization (strip XSS patterns from all inputs)
app.use(sanitizeMiddleware);

// Logging middleware (log all requests)
app.use(loggingMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'livey-backend',
    version: '1.0.0'
  });
});

// API routes
import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import sheetsRoutes from './routes/sheets.routes.js';
import cronRoutes from './routes/cron.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import chatRoutes from './routes/chat.routes.js';
import widgetRoutes from './routes/widget.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/widget', widgetRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.path
    }
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: FRONTEND_URL
  });
  console.log(`\n🚀 Livey Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
});
