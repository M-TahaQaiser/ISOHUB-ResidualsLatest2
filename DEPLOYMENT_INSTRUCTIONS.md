# Production Deployment Instructions - Password Reset Feature

## Overview
This deployment includes the complete password reset security hardening with session revocation.

## Files Changed

### Backend
- `server/routes/auth.routes.ts` - Password reset endpoints
- `server/middleware/auth.ts` - Session revocation logic
- `server/routes/users.routes.ts` - Added authentication middleware (SECURITY FIX)
- `server/services/AuthService.ts` - JWT secret alignment
- `shared/schema.ts` - Added passwordChangedAt field and password_reset_tokens table

### Frontend
- `client/src/pages/ForgotPassword.tsx` - Forgot password form
- `client/src/pages/ResetPassword.tsx` - Reset password form with validation
- `client/src/pages/Login.tsx` - Added "Forgot Password?" link
- `client/src/App.tsx` - Added reset password routes

### Documentation
- `replit.md` - Updated with password reset feature documentation

## Database Changes

**New Table:**
```sql
password_reset_tokens (
  id, user_id, token, expires_at, created_at, is_used
)
```

**Modified Table:**
```sql
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
```

## Step 1: Commit Code to Git

```bash
# From your local terminal or Replit Shell
git add .
git commit -m "feat: Add production-ready password reset with session revocation

- Implemented secure password reset flow with email-based tokens
- Added automatic JWT session revocation via passwordChangedAt
- Fixed critical security bug: /api/users routes now require authentication
- Added Form validation with zodResolver for UX
- Updated replit.md documentation

Security improvements:
- Single active reset token per user
- 1-hour token expiry
- Password strength validation
- Session invalidation on password change
- JWT secret consistency across services"
```

## Step 2: Push to GitHub

```bash
git push origin main
```

This will trigger automatic deployment on Railway.

## Step 3: Run Database Migrations on Railway

### Option A: Via Railway Dashboard
1. Go to Railway dashboard (https://railway.app)
2. Select your ISOHub project
3. Click on your service
4. Go to "Variables" tab
5. Verify DATABASE_URL is set
6. Go to "Deployments" tab
7. Once deployment is complete, open the service
8. Click "Shell" or "Terminal"
9. Run: `npm run db:push -- --force`

### Option B: Via Railway CLI (if installed)
```bash
railway run npm run db:push -- --force
```

## Step 4: Verify Production Super Admin

After deployment, test login at https://app.isohub.io/login:

```
Username: prodsuper
Password: Pr0duction$2025!Secure
```

## Step 5: Test Password Reset Flow

1. Go to https://app.isohub.io/login
2. Click "Forgot Password?"
3. Enter: production@isohub.io
4. Check email for reset link
5. Complete password reset
6. Verify old sessions are invalidated

## Environment Variables Required

Verify these are set in Railway:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Should be 'dev-secret-key-2025' or your production secret
- `FRONTEND_URL` - Should be 'https://app.isohub.io'
- `RESEND_API_KEY` - For sending password reset emails
- `NODE_ENV` - Should be 'production'

## Security Notes

✅ All JWT sessions are invalidated on password change
✅ Reset tokens expire after 1 hour
✅ Only one active reset token per user
✅ Rate limiting protects against brute force
✅ /api/users routes now require authentication

## Rollback Plan

If issues occur:
```bash
git revert HEAD
git push origin main
```

## Post-Deployment Checklist

- [ ] Railway deployment completed successfully
- [ ] Database migrations ran without errors
- [ ] Super admin login works
- [ ] Password reset email sends correctly
- [ ] Password reset flow completes successfully
- [ ] Old tokens are invalidated after password change
- [ ] New logins work after password reset

## Support

If you encounter issues:
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure DATABASE_URL points to production database
4. Check email service configuration (RESEND_API_KEY)
