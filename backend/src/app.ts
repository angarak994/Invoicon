import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import invoiceRoutes from './modules/invoices/invoice.routes';

const app = express();

// 1. Parse cookie variables securely
app.use(cookieParser());

// 2. Load helmet security wrappers
app.use(helmet());

// 3. Explicit CORS settings - do not support wildcard '*' with credentials
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(',').map((url) => url.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept', 'Origin']
  })
);

// 4. Set payload limitations to prevent buffer overloads (support base64 signatures/logos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 5. Block NoSQL injections (Express 5-compliant Direct Mutation Sanitizer)
function sanitizeObject(obj: any): void {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
  }
}

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
});

// 6. Rate Limiter - general global calls (100 queries/minute)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP. Please try again after a minute.'
    }
  }
});
app.use('/api', globalLimiter);

// 7. Route health checkpoints (Liveness and readiness probes)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (_req: Request, res: Response) => {
  const dbConnected = mongoose.connection.readyState === 1;
  if (dbConnected) {
    res.status(200).json({
      status: 'ready',
      db: 'connected'
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      db: 'disconnected'
    });
  }
});

// 8. Bind API routers
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '✨ Welcome to the Invoicon SaaS API Service! ✨',
    version: '1.0.0',
    health: `http://localhost:${env.PORT}/health`
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// 8.5 Handle Unmatched Route 404s
app.use((req: Request, res: Response) => {
  console.warn(`⚠️ Unmatched route accessed: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`
    }
  });
});

// 9. Central error catcher (must be last)
app.use(errorHandler);

export default app;
