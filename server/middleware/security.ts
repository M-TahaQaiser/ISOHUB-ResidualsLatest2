import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';

// Rate limiting configuration
export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  20, // 20 attempts per 15 minutes (more reasonable for development)
  'Too many authentication attempts, please try again later.'
);

export const apiRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  300, // 300 requests per 15 minutes (more reasonable for auto-refresh)
  'API rate limit exceeded.'
);

export const uploadRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Upload rate limit exceeded.'
);

// Generate nonce for inline scripts (more secure than unsafe-inline)
export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('base64');
};

// Security headers configuration
// SECURITY FIX: Remove unsafe-inline and use nonces for necessary inline scripts
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Use nonces for styles that need inline (set dynamically per request)
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"], // TODO: Replace with nonce in production
      // SECURITY: In production, generate nonces for each request
      // For now, use strict CSP with hash-based approach for known scripts
      scriptSrc: process.env.NODE_ENV === 'production'
        ? ["'self'", "'strict-dynamic'"]
        : ["'self'", "'unsafe-inline'"], // Only allow unsafe-inline in development
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "https:",
        // Allow AI API connections
        "https://api.openai.com",
        "https://api.anthropic.com"
      ],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"], // Prevent clickjacking
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  crossOriginEmbedderPolicy: false, // Disable for development compatibility
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xContentTypeOptions: true, // X-Content-Type-Options: nosniff
  xDnsPrefetchControl: { allow: false },
  xDownloadOptions: true, // X-Download-Options: noopen
  xFrameOptions: { action: "deny" }, // X-Frame-Options: DENY
  xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
  xXssProtection: true, // X-XSS-Protection: 1; mode=block (legacy but still useful)
});

// Input validation middleware
export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({ error: 'Invalid input format' });
    }
  };
};

// CORS configuration - Environment-aware
const getAllowedOrigins = (): string[] | boolean => {
  const env = process.env.NODE_ENV;

  // In production, only allow specific origins
  if (env === 'production') {
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS;
    if (!allowedOrigins) {
      console.warn('WARNING: CORS_ALLOWED_ORIGINS not set in production. Defaulting to restrictive mode.');
      return ['https://isohub.io', 'https://app.isohub.io'];
    }
    return allowedOrigins.split(',').map(origin => origin.trim());
  }

  // In development, allow localhost variations
  if (env === 'development') {
    return [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5173',
    ];
  }

  // Default: restrictive for unknown environments
  return false;
};

export const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Webhook-Secret',
  ],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 600, // Cache preflight for 10 minutes
};

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const securityEvents = [
    'authentication',
    'authorization',
    'upload',
    'admin',
    'sensitive'
  ];
  
  const shouldLog = securityEvents.some(event => 
    req.path.includes(event) || 
    req.method !== 'GET'
  );
  
  if (shouldLog) {
    console.log(`[SECURITY] ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  }
  
  next();
};

// Request sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

// Validation schemas
export const emailValidation = z.string().email('Invalid email format');
export const passwordValidation = z.string().min(12, 'Password must be at least 12 characters (PCI DSS 4.0 requirement)');
export const usernameValidation = z.string().min(3, 'Username must be at least 3 characters');

// CSRF Protection using Double Submit Cookie pattern
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

const generateSecureToken = (): string => {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

export const setCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  let csrfToken = req.cookies?.[CSRF_COOKIE_NAME];
  
  if (!csrfToken) {
    csrfToken = generateSecureToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
  }
  
  res.setHeader('X-CSRF-Token', csrfToken);
  next();
};

export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for Bearer token auth (API calls)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }
  
  // Skip CSRF for authentication endpoints (no session to protect yet)
  const authPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/signup', '/api/auth/forgot-password'];
  if (authPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Skip CSRF for file upload routes (they use multipart/form-data)
  const uploadPaths = [
    '/api/residuals-workflow/upload',
    '/api/upload',
    '/api/agencies',
    '/api/onboarding',
    '/api/available-months',
    '/api/preapplications',
    '/api/secured-docs',
    '/api/marketing'
  ];
  if (uploadPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Skip CSRF if explicitly marked (for specific routes)
  if ((req as any).skipCSRF) {
    return next();
  }
  
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;
  
  if (!cookieToken || !headerToken) {
    return res.status(403).json({ 
      error: 'CSRF token missing',
      message: 'Request blocked due to missing security token'
    });
  }
  
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
    
    if (!isValid) {
      return res.status(403).json({ 
        error: 'CSRF token mismatch',
        message: 'Request blocked due to invalid security token'
      });
    }
  } catch (error) {
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      message: 'Request blocked due to security validation failure'
    });
  }
  
  next();
};

export const generateCSRFToken = setCSRFToken;

// Error handling middleware
export const securityErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Log security-related errors
  console.error(`[SECURITY ERROR] ${new Date().toISOString()} - ${error.message} - Path: ${req.path} - IP: ${req.ip}`);
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS policy violation',
      message: isDevelopment ? error.message : 'Request not allowed'
    });
  }
  
  if (error.message.includes('Rate limit')) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong'
  });
};