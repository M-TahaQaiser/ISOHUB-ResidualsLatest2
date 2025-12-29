# Tracer C2FS Multi-Tenant Migration Summary
## Quick Reference Guide

*Last Updated: January 2025*

---

## ✅ **WHAT'S BEEN DONE**

### 1. Updated Migration Plan for Tracer C2FS
- **First Tenant:** Changed from "ISO Hub Default Agency" to **"Tracer C2FS"**
- **All Existing Data:** 719 merchants, 716 monthly records, and 132 assignments will belong to Tracer C2FS
- **White-Label Enabled:** Tracer C2FS will have full white-label capabilities

### 2. Added OAuth Integration Requirements
Added support for **per-agency cloud storage integrations**:
- **Dropbox** - File upload/download with OAuth 2.0
- **OneDrive** - Microsoft Graph API integration
- **Google Drive** - Google Cloud project integration

Each tenant (including Tracer C2FS) will have independent OAuth connections for each provider.

### 3. Database Schema Updates

#### New Table: `agency_oauth_credentials`
Stores OAuth tokens for each agency and provider:
```sql
CREATE TABLE agency_oauth_credentials (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL REFERENCES agencies(id),
  provider VARCHAR(20) NOT NULL, -- 'dropbox', 'onedrive', 'google_drive'
  
  -- Encrypted OAuth credentials
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  
  -- Token management
  token_type VARCHAR(20),
  expires_at TIMESTAMP,
  scope TEXT,
  
  -- Connection status
  is_active BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  last_connected TIMESTAMP,
  last_refreshed TIMESTAMP,
  
  -- Metadata
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  
  -- Error handling
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  UNIQUE (agency_id, provider)
);
```

---

## 📋 **WHAT NEEDS TO HAPPEN NEXT**

### Phase 1: Database Migration (Maintenance Window Required)

#### Step 1: Backup Database
```bash
# Create full database backup before migration
pg_dump $DATABASE_URL > backup_before_migration_$(date +%Y%m%d).sql
```

#### Step 2: Run Migration Script
See the complete SQL script in `MULTI_TENANT_MIGRATION_PLAN.md` (Section: Complete SQL Migration Script)

This script will:
1. Create **Tracer C2FS** agency (ID = 1)
2. Link all existing users to Tracer C2FS
3. Add `agency_id` column to 8 core tables
4. Assign all existing data to Tracer C2FS (agency_id = 1)
5. Create OAuth credentials table
6. Add necessary indexes and constraints

#### Step 3: Push Schema Changes
```bash
# After running SQL migration, sync Drizzle schema
npm run db:push --force
```

---

## 🔐 **OAUTH SETUP FOR TRACER C2FS**

After migration, Tracer C2FS will need to configure OAuth for cloud storage:

### 1. Dropbox Setup
1. Create Dropbox App at https://www.dropbox.com/developers/apps
2. Configure OAuth redirect: `https://yourdomain.com/oauth/dropbox/callback`
3. Store credentials in database for Tracer C2FS (agency_id = 1):
   ```sql
   INSERT INTO agency_oauth_credentials (
     agency_id, provider, client_id, client_secret, is_active
   ) VALUES (
     1, 'dropbox', 'YOUR_CLIENT_ID', 'YOUR_CLIENT_SECRET', true
   );
   ```

### 2. OneDrive Setup
1. Register app in Azure Portal (Microsoft 365)
2. Configure redirect URI: `https://yourdomain.com/oauth/onedrive/callback`
3. Grant permissions: `Files.ReadWrite`, `Files.ReadWrite.All`
4. Store credentials for Tracer C2FS

### 3. Google Drive Setup
1. Create project in Google Cloud Console
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Configure redirect: `https://yourdomain.com/oauth/google/callback`
5. Store credentials for Tracer C2FS

---

## 🚨 **IMPORTANT SECURITY NOTES**

### Token Encryption
All OAuth tokens **MUST** be encrypted before storage:
- Use AES-256-GCM encryption
- Store encryption key in environment variables
- Never log decrypted tokens

### Example Encryption (Node.js)
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## 🧪 **TESTING CHECKLIST**

After migration, verify:

### Data Integrity
- [ ] All 719 merchants have `agency_id = 1` (Tracer C2FS)
- [ ] All 716 monthly_data records have `agency_id = 1`
- [ ] All 132 assignments have `agency_id = 1`
- [ ] No orphaned records (records without agency_id)

### Functionality
- [ ] Dashboard shows correct data for Tracer C2FS
- [ ] File uploads work and are associated with Tracer C2FS
- [ ] Reports filter by agency correctly
- [ ] Role assignments scoped to Tracer C2FS
- [ ] Intelligent role assignment interface works

### Multi-Tenancy
- [ ] Create test Agency #2
- [ ] Upload test data for Agency #2
- [ ] Verify data isolation (Tracer C2FS can't see Agency #2 data)
- [ ] Verify Agency #2 can't see Tracer C2FS data

### OAuth Integration
- [ ] Connect Tracer C2FS to Dropbox
- [ ] Test file upload to Dropbox
- [ ] Connect Tracer C2FS to OneDrive
- [ ] Connect Tracer C2FS to Google Drive
- [ ] Verify token refresh works
- [ ] Test disconnecting and reconnecting

---

## 📊 **CURRENT DATA SUMMARY**

Data that will be migrated to **Tracer C2FS**:

| Data Type | Count | Notes |
|-----------|-------|-------|
| Merchants | 719 | All existing merchant accounts |
| Monthly Data | 716 | May 2025 revenue records |
| Assignments | 132 | Role and commission assignments |
| Processors | 10 | Shared across all agencies |
| Users | All | Linked to Tracer C2FS |

**Total Revenue Tracked:** $33,649.43 (May 2025)

---

## 🔄 **FUTURE AGENCIES**

After Tracer C2FS migration is complete, you can add new agencies:

### Adding Agency #2
```sql
INSERT INTO agencies (
  company_name,
  contact_name,
  email,
  admin_username,
  status,
  is_whitelabel
) VALUES (
  'New Agency Name',
  'Admin Name',
  'admin@newagency.com',
  'admin',
  'active',
  true
);
```

### Each New Agency Gets:
- ✅ Clean, isolated data environment
- ✅ Independent OAuth connections (Dropbox, OneDrive, Google Drive)
- ✅ Separate merchant lists and revenue tracking
- ✅ Custom branding and white-label settings
- ✅ Independent user accounts and roles

---

## 📞 **QUESTIONS & SUPPORT**

### Common Questions

**Q: Will this affect our existing data?**
A: No. All existing data will be safely migrated to Tracer C2FS. Nothing is deleted.

**Q: Can Tracer C2FS users see other agencies' data?**
A: No. Complete data isolation between agencies.

**Q: Do we need to reconfigure our current setup?**
A: No. After migration, everything works the same for Tracer C2FS users.

**Q: How long does migration take?**
A: Approximately 5-10 minutes for database changes. Plan for 1-hour maintenance window.

**Q: Can we roll back if something goes wrong?**
A: Yes. We'll have a full database backup before migration starts.

---

## 📚 **RELATED DOCUMENTS**

1. **MULTI_TENANT_MIGRATION_PLAN.md** - Complete technical migration guide
2. **ISO_HUB_MARKETING_BRIEF.md** - Marketing materials and platform metrics
3. **shared/schema.ts** - Updated database schema with OAuth support

---

## ✅ **READY TO MIGRATE?**

When you're ready to proceed:

1. **Schedule maintenance window** (recommend off-peak hours)
2. **Notify Tracer C2FS users** of brief downtime
3. **Backup database** (critical step!)
4. **Run migration script** from MULTI_TENANT_MIGRATION_PLAN.md
5. **Test thoroughly** using checklist above
6. **Configure OAuth** for Dropbox, OneDrive, Google Drive
7. **Resume normal operations**

**Estimated Downtime:** 1 hour (includes testing)
**Data at Risk:** None (with proper backup)
**User Impact:** Minimal (brief interruption only)

---

**Document Version:** 1.0  
**Prepared For:** Tracer C2FS Migration Team  
**Next Steps:** Review and approve migration plan

*All 719 merchants and $33,649.43 in revenue will be safely migrated to Tracer C2FS.*
