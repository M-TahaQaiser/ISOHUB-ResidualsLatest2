# Railway Environment Variables Checklist

## Required Environment Variables for Railway Deployment

### Database (CRITICAL)
- `DATABASE_URL` - PostgreSQL connection string (provided by Railway PostgreSQL service)
  - Format: `postgresql://user:password@host:port/database`
  - Railway provides this automatically when you add PostgreSQL service

### Session & Security (CRITICAL)
- `SESSION_SECRET` - Random string for session encryption (generate with: `openssl rand -base64 32`)

### Email Service (Optional but recommended)
- `RESEND_API_KEY` - For sending emails via Resend

### AI Services (Optional)
- `ANTHROPIC_API_KEY` - For Claude AI features
- `OPENAI_API_KEY` - For OpenAI features

### OAuth (Optional)
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `GOOGLE_REDIRECT_URI` - OAuth redirect URL

### Other Services (Optional)
- `MONGO_URI` - MongoDB connection for vendor service
- `REPLIT_DB_URL` - Replit database (if using)

## Steps to Configure Railway

1. **Add PostgreSQL Service**
   - In Railway dashboard, click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL` environment variable

2. **Set Required Environment Variables**
   - Go to your service → "Variables" tab
   - Add `SESSION_SECRET` with a random value

3. **Run Database Migrations**
   - After first deployment, run: `railway run npm run db:push`
   - Or add to Railway build command

4. **Verify Deployment**
   - Check logs for startup errors
   - Visit `/health` endpoint to verify server is running
   - Check database connection

## Common Issues

### White Screen
- Backend server not starting (check logs)
- Database connection failed (verify DATABASE_URL)
- Missing SESSION_SECRET
- Database tables not created (run migrations)

### API Routes Return HTML
- Server crashed during startup
- Routes not registered properly
- Check Railway logs for errors
