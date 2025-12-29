# SSO Setup Guide: Google & Microsoft OAuth

This guide walks you through setting up Google and Microsoft Single Sign-On (SSO) for ISOHub.

---

## Part 1: Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it (e.g., "ISOHub Production")
4. Click **Create**

### Step 2: Configure OAuth Consent Screen

1. In the left menu, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have Google Workspace)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: ISOHub
   - **User support email**: Your email
   - **App logo**: Upload your logo (optional)
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
7. Select these scopes:
   - `openid`
   - `email`
   - `profile`
8. Click **Update** → **Save and Continue**
9. Add test users if you're in testing mode
10. Click **Save and Continue** → **Back to Dashboard**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Name it (e.g., "ISOHub Web Client")
5. Under **Authorized JavaScript origins**, add:
   ```
   https://your-repl-name.replit.app
   ```
6. Under **Authorized redirect URIs**, add:
   ```
   https://your-repl-name.replit.app/api/sso/google/callback
   ```
7. Click **Create**
8. **Copy the Client ID and Client Secret** - you'll need these!

### Step 4: Add Secrets to Replit

1. In Replit, go to **Secrets** (lock icon in the sidebar)
2. Add these secrets:
   - `GOOGLE_SSO_CLIENT_ID`: Your Google Client ID
   - `GOOGLE_SSO_CLIENT_SECRET`: Your Google Client Secret

---

## Part 2: Microsoft Azure AD Setup

### Step 1: Register an Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for **Microsoft Entra ID** (formerly Azure AD)
3. Click **App registrations** in the left menu
4. Click **+ New registration**
5. Fill in:
   - **Name**: ISOHub
   - **Supported account types**: Select "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: Select "Web" and enter:
     ```
     https://your-repl-name.replit.app/api/sso/microsoft/callback
     ```
6. Click **Register**

### Step 2: Get Application (Client) ID

1. After registration, you'll see the **Overview** page
2. Copy the **Application (client) ID** - you'll need this!

### Step 3: Create a Client Secret

1. In the left menu, click **Certificates & secrets**
2. Click **+ New client secret**
3. Add a description (e.g., "ISOHub Production")
4. Choose an expiration (24 months recommended)
5. Click **Add**
6. **Copy the secret Value immediately** - it won't be shown again!

### Step 4: Configure API Permissions

1. In the left menu, click **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Search and select:
   - `openid`
   - `email`
   - `profile`
   - `User.Read`
6. Click **Add permissions**
7. Click **Grant admin consent for [Your Tenant]** (if you're an admin)

### Step 5: Add Secrets to Replit

1. In Replit, go to **Secrets** (lock icon in the sidebar)
2. Add these secrets:
   - `MICROSOFT_SSO_CLIENT_ID`: Your Application (client) ID
   - `MICROSOFT_SSO_CLIENT_SECRET`: Your Client Secret Value

---

## Part 3: Testing Your Setup

### Verify Configuration

1. Restart your Replit application
2. Go to your login page
3. You should see "Sign in with Google" and/or "Sign in with Microsoft" buttons
4. Click a button to test the flow

### Check SSO Status

You can verify the configuration by visiting:
```
https://your-repl-name.replit.app/api/sso/status
```

This will show:
```json
{
  "google": { "configured": true, "redirectUri": "..." },
  "microsoft": { "configured": true, "redirectUri": "..." }
}
```

---

## Troubleshooting

### "redirect_uri_mismatch" Error

The redirect URI in your OAuth console must **exactly match** the one your app uses:
- Google: `https://your-repl-name.replit.app/api/sso/google/callback`
- Microsoft: `https://your-repl-name.replit.app/api/sso/microsoft/callback`

### Buttons Not Showing

1. Check that the secrets are properly set in Replit
2. Restart the application
3. Check `/api/sso/status` to verify configuration

### "No email" Error

The user's Google/Microsoft account must have an email address associated with it.

### User Gets "Agent" Role

New users created via SSO are assigned the "Users/Reps" role by default. Admins can update their role in the Super Admin panel.

---

## Security Notes

1. **Never share your Client Secret** - treat it like a password
2. **Secrets expire** - Microsoft secrets expire after the period you chose (set a reminder!)
3. **SSO users get a placeholder password** - they can only log in via SSO unless an admin sets a password
4. **Your existing MFA still works** - SSO users can also enable TOTP 2FA for additional security

---

## Quick Reference: Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_SSO_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_SSO_CLIENT_SECRET` | Google OAuth Client Secret |
| `MICROSOFT_SSO_CLIENT_ID` | Microsoft/Azure Application ID |
| `MICROSOFT_SSO_CLIENT_SECRET` | Microsoft/Azure Client Secret |
