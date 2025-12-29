import 'dotenv/config';
import fetch from 'cross-fetch';
import { webcrypto, randomFillSync } from 'crypto';

// Polyfill `fetch` for Node versions < 18 so OpenAI client works
if (!globalThis.fetch) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.fetch = fetch as any;
}

// Ensure global crypto.getRandomValues exists (Vite expects it)
if (typeof (globalThis as any).crypto !== 'object') {
  (globalThis as any).crypto = {};
}
if (typeof (globalThis as any).crypto.getRandomValues !== 'function') {
  (globalThis as any).crypto.getRandomValues = (arr: Uint8Array) => randomFillSync(arr);
}

// ALSO patch the Node `crypto` module namespace so libraries that import
// `node:crypto` (Vite and others) can call `crypto.getRandomValues`.
import nodeCrypto from 'node:crypto';
if (typeof (nodeCrypto as any).getRandomValues !== 'function') {
  (nodeCrypto as any).getRandomValues = (arr: Uint8Array) => (nodeCrypto as any).randomFillSync(arr);
}
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ISOAIService } from "./services/isoAIService";
import { 
  securityHeaders, 
  apiRateLimit, 
  sanitizeInput, 
  corsOptions,
  securityLogger,
  securityErrorHandler,
  setCSRFToken,
  validateCSRFToken
} from "./middleware/security";
import { 
  monitoringMiddleware, 
  healthCheckHandler, 
  metricsHandler 
} from "./services/MonitoringService";
import { CacheService, cacheMiddleware } from "./services/cacheService";
import { optionalAuth } from "./middleware/auth";
import { sessionMiddleware } from "./middleware/session";
import businessOwnerAuthRouter from "./routes/businessOwnerAuth";
import businessOwnerAnalyticsRouter from "./routes/businessOwnerAnalytics";
import { seedAdminUser } from "./utils/seedAdminUser";
import { runMigrations } from "./utils/runMigrations";
import { runStartupDataSeeding } from "./utils/startupDataSeeder";

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CORS configuration
app.use(cors(corsOptions));

// Cookie parser - required for CSRF protection
app.use(cookieParser());

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(securityLogger);
app.use(monitoringMiddleware);

// Session middleware - MUST come before auth and routes
app.use(sessionMiddleware);

// CSRF Protection - Set token on all requests, validate on state-changing requests
// Must come after session and before routes
app.use(setCSRFToken);
app.use(validateCSRFToken);

// Body parsing with limits - exclude multipart routes
app.use((req, res, next) => {
  // Skip JSON parsing for agency/organization creation routes that handle file uploads
  if (req.path === '/api/agencies' && req.method === 'POST') {
    return next();
  }
  if (req.path === '/api/organizations' && req.method === 'POST') {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Business Owner routes (session-based authentication) - MUST be before cache middleware
app.use('/api/business-owner/auth', businessOwnerAuthRouter);
app.use('/api/business-owner/analytics', businessOwnerAnalyticsRouter);

// Rate limiting and caching for API routes (excluding business-owner routes above)
app.use('/api', apiRateLimit);
app.use('/api', cacheMiddleware(300)); // 5-minute cache for API responses

// Authentication middleware - applies to all routes
// Uses optionalAuth so public routes work, protected routes check req.user
app.use(optionalAuth);

// Health check and metrics endpoints (before other routes)
app.get('/health', healthCheckHandler);
app.get('/metrics', metricsHandler);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run database migrations
  try {
    await runMigrations();
  } catch (error) {
    console.error('Migration failed, continuing with server startup:', error);
  }

  // Skip problematic initializations for now
  console.log("Security systems ready - migrations available via API");
  console.log("ISO-AI initialization skipped - manual setup available");

  // Run data integrity check and seed required organizations
  try {
    await runStartupDataSeeding();
  } catch (error) {
    console.error('[Startup] Data seeding failed:', error);
  }

  // Seed default admin user if none exists - disabled due to schema issues
  // await seedAdminUser();

  // In development, provide easy login credentials shown in the UI
  if (app.get('env') === 'development') {
    try {
      const { seedDevUsers } = await import('./utils/seedDevUsers');
      await seedDevUsers();
    } catch (err) {
      console.warn('⚠️ Failed to seed dev users:', err);
    }
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    console.log('DEBUG: globalThis.crypto:', typeof (globalThis as any).crypto, 'getRandomValues:', typeof (globalThis as any).crypto?.getRandomValues);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🔒 Secure ISO Hub server running on port ${port}`);
    log(`🔍 Health check: http://localhost:${port}/health`);
    log(`📊 Metrics: http://localhost:${port}/metrics`);
    
    // Log security status
    console.log('[SECURITY] Security middleware initialized');
    console.log('[MONITORING] Application monitoring active');
    console.log('[CACHE] Cache service ready');
  });
})();
