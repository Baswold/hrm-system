import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { CORS_CONFIG, APP_CONFIG } from './config/constants';
import logger, { stream } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimit.middleware';
import { sanitizeInput } from './middleware/validation.middleware';
import routes from './routes';

/**
 * Create Express application
 */
const createApp = (): Application => {
  const app = express();

  // Trust proxy - important for rate limiting and getting correct client IPs
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: CORS_CONFIG.ORIGIN,
    credentials: CORS_CONFIG.CREDENTIALS,
    methods: CORS_CONFIG.METHODS,
    allowedHeaders: CORS_CONFIG.ALLOWED_HEADERS,
  }));

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP request logger
  if (APP_CONFIG.ENV === 'development') {
    app.use(morgan('dev', { stream }));
  } else {
    app.use(morgan('combined', { stream }));
  }

  // Input sanitization
  app.use(sanitizeInput);

  // Rate limiting
  app.use(generalLimiter);

  // API routes
  app.use(`/api/${APP_CONFIG.VERSION}`, routes);

  // Root route
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: `Welcome to ${APP_CONFIG.NAME}`,
      version: APP_CONFIG.VERSION,
      documentation: `/api/${APP_CONFIG.VERSION}/docs`,
      health: `/api/${APP_CONFIG.VERSION}/health`,
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
