# Environment Variables Documentation

## Overview
This document provides a comprehensive reference for all environment variables required by the Health Performance Agent application, with special focus on device integration configurations.

---

## Table of Contents
1. [Core Application Variables](#core-application-variables)
2. [Database Configuration](#database-configuration)
3. [Device Integration Variables](#device-integration-variables)
4. [AI/LLM Configuration](#aillm-configuration)
5. [Security Variables](#security-variables)
6. [Setup Instructions](#setup-instructions)

---

## Core Application Variables

### NODE_ENV
- **Required**: Yes
- **Values**: `development` | `production` | `test`
- **Default**: `development`
- **Description**: Determines the application environment
- **Impact**: Affects logging, error handling, and APNs endpoint selection

```bash
NODE_ENV=production
```

### PORT
- **Required**: No
- **Default**: `3000`
- **Description**: Port number for the Express server
- **Impact**: Server listening port

```bash
PORT=3000
```

---

## Database Configuration

### SUPABASE_URL
- **Required**: Yes
- **Description**: Supabase project URL
- **Format**: `https://[project-id].supabase.co`

```bash
SUPABASE_URL=https://your-project.supabase.co
```

### SUPABASE_ANON_KEY
- **Required**: Yes
- **Description**: Supabase anonymous/public API key
- **Security**: Public key, safe to expose in frontend

```bash
SUPABASE_ANON_KEY=your-anon-key-here
```

### SUPABASE_SERVICE_ROLE_KEY
- **Required**: Yes (for backend)
- **Description**: Supabase service role key with admin privileges
- **Security**: ⚠️ CRITICAL - Never expose in frontend or commit to version control

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## Device Integration Variables

### 1. Oura Ring Integration

#### OURA_CLIENT_ID
- **Required**: Yes (for Oura integration)
- **Description**: OAuth 2.0 client ID from Oura Cloud Developer Portal
- **Where to Get**: [Oura Cloud Developer Portal](https://cloud.ouraring.com/oauth/applications)
- **Format**: Alphanumeric string (e.g., `ABCDEF123456`)

```bash
OURA_CLIENT_ID=your-oura-client-id
```

#### OURA_CLIENT_SECRET
- **Required**: Yes (for Oura integration)
- **Description**: OAuth 2.0 client secret from Oura Cloud Developer Portal
- **Security**: ⚠️ CRITICAL - Backend only, never expose in frontend
- **Where to Get**: Oura Cloud Developer Portal (shown only once during app creation)

```bash
OURA_CLIENT_SECRET=your-oura-client-secret
```

**Setup Guide**: See `server/OURA_OAUTH_SETUP.md`

---

### 2. Apple Watch Integration

#### APNS_KEY
- **Required**: Yes (for Apple Watch push notifications)
- **Description**: APNs authentication key (.p8 file content)
- **Format**: Base64-encoded .p8 file OR raw .p8 file content
- **Where to Get**: Apple Developer Portal > Certificates, Identifiers & Profiles > Keys
- **Security**: ⚠️ CRITICAL - Backend only

**Option 1: Base64 Encoded (Recommended)**
```bash
# Encode .p8 file
base64 -i AuthKey_XXXXXXXXXX.p8 -o apns_key_base64.txt

# Set in Railway with base64: prefix
APNS_KEY=base64:LS0tLS1CRUdJTi...
```

**Option 2: Raw Content**
```bash
APNS_KEY=-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----
```

#### APNS_KEY_ID
- **Required**: Yes (for Apple Watch push notifications)
- **Description**: 10-character Key ID from Apple Developer Portal
- **Format**: Alphanumeric (e.g., `AB12CD34EF`)
- **Where to Get**: Apple Developer Portal > Keys section

```bash
APNS_KEY_ID=AB12CD34EF
```

#### APNS_TEAM_ID
- **Required**: Yes (for Apple Watch push notifications)
- **Description**: 10-character Team ID from Apple Developer Account
- **Format**: Alphanumeric (e.g., `1234567890`)
- **Where to Get**: Apple Developer Portal > Membership section (top-right corner)

```bash
APNS_TEAM_ID=1234567890
```

#### APNS_BUNDLE_ID
- **Required**: Yes (for Apple Watch push notifications)
- **Description**: iOS app bundle identifier
- **Format**: Reverse domain notation (e.g., `com.company.app`)
- **Must Match**: Bundle ID in Xcode project and Apple Developer Portal

```bash
APNS_BUNDLE_ID=com.yourcompany.healthapp
```

**Setup Guide**: See `server/APNS_SETUP_GUIDE.md`

---

### 3. Sleep Number Integration

#### SLEEPNUMBER_EMAIL
- **Required**: Yes (for Sleep Number integration)
- **Description**: Sleep Number account email
- **Security**: ⚠️ Store securely, backend only

```bash
SLEEPNUMBER_EMAIL=your-email@example.com
```

#### SLEEPNUMBER_PASSWORD
- **Required**: Yes (for Sleep Number integration)
- **Description**: Sleep Number account password
- **Security**: ⚠️ CRITICAL - Backend only, never log or expose

```bash
SLEEPNUMBER_PASSWORD=your-secure-password
```

---

### 4. Encryption Key (All Device Integrations)

#### ENCRYPTION_KEY
- **Required**: Yes (for all device integrations)
- **Description**: 32-character AES-256 encryption key for OAuth tokens and credentials
- **Format**: Exactly 32 characters (alphanumeric + special chars)
- **Security**: ⚠️ CRITICAL - Backend only, rotate periodically

**Generate New Key:**
```bash
# Option 1: OpenSSL
openssl rand -base64 32 | cut -c1-32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64').slice(0, 32))"

# Option 3: Python
python -c "import secrets; print(secrets.token_urlsafe(32)[:32])"
```

**Example:**
```bash
ENCRYPTION_KEY=a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6
```

**Setup Guide**: See `server/ENCRYPTION_KEY_SETUP.md`

---

## AI/LLM Configuration

### OPENAI_API_KEY
- **Required**: Yes (for AI features)
- **Description**: OpenAI API key for GPT models
- **Where to Get**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Security**: ⚠️ CRITICAL - Backend only

```bash
OPENAI_API_KEY=sk-...
```

### OPENAI_MODEL
- **Required**: No
- **Default**: `gpt-4`
- **Description**: OpenAI model to use
- **Options**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`

```bash
OPENAI_MODEL=gpt-4
```

---

## Security Variables

### JWT_SECRET
- **Required**: Yes (if using JWT authentication)
- **Description**: Secret key for signing JWT tokens
- **Format**: Long random string (min 32 characters)
- **Security**: ⚠️ CRITICAL - Backend only

```bash
JWT_SECRET=your-very-long-random-secret-key-here
```

---

## Mobile App Environment Variables

### EXPO_PUBLIC_API_URL
- **Required**: Yes (mobile app)
- **Description**: Backend API URL
- **Format**: Full URL with protocol
- **Development**: `http://localhost:3000`
- **Production**: `https://your-backend-url.railway.app`

```bash
# Development
EXPO_PUBLIC_API_URL=http://localhost:3000

# Production
EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### EXPO_PUBLIC_OURA_CLIENT_ID
- **Required**: Yes (for Oura integration in mobile app)
- **Description**: Same as backend OURA_CLIENT_ID
- **Security**: ✅ Safe to expose (public OAuth client ID)

```bash
EXPO_PUBLIC_OURA_CLIENT_ID=your-oura-client-id
```

---

## Setup Instructions

### Local Development Setup

1. **Create `.env` file in server directory:**
```bash
cd server
touch .env
```

2. **Add required variables:**
```bash
# Core
NODE_ENV=development
PORT=3000

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Encryption (generate new key)
ENCRYPTION_KEY=a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6

# AI
OPENAI_API_KEY=sk-...

# Device Integrations (optional for local dev)
# OURA_CLIENT_ID=...
# OURA_CLIENT_SECRET=...
# APNS_KEY=...
# APNS_KEY_ID=...
# APNS_TEAM_ID=...
# APNS_BUNDLE_ID=...
# SLEEPNUMBER_EMAIL=...
# SLEEPNUMBER_PASSWORD=...
```

3. **Create `.env` file in mobile directory:**
```bash
cd mobile
touch .env
```

4. **Add mobile variables:**
```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_OURA_CLIENT_ID=your-oura-client-id
```

---

### Railway Production Setup

1. **Navigate to Railway Project:**
   - Go to [Railway Dashboard](https://railway.app)
   - Select your project
   - Click on backend service
   - Go to "Variables" tab

2. **Add Variables One by One:**
   - Click "New Variable"
   - Enter variable name (exact match required)
   - Paste value
   - Click "Add"

3. **Critical Variables for Production:**
```bash
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=your-32-char-key
OPENAI_API_KEY=sk-...

# Device Integrations
OURA_CLIENT_ID=...
OURA_CLIENT_SECRET=...
APNS_KEY=base64:...
APNS_KEY_ID=...
APNS_TEAM_ID=...
APNS_BUNDLE_ID=...
SLEEPNUMBER_EMAIL=...
SLEEPNUMBER_PASSWORD=...
```

4. **Redeploy After Adding Variables:**
   - Railway auto-redeploys when variables change
   - Verify deployment succeeded
   - Check logs for any errors

---

## Validation Checklist

### Backend Startup Validation
When server starts, check logs for:

✅ **Success Indicators:**
- `Server is running on port 3000`
- `Oura cron job initialized`
- `Apple Watch cron job initialized`
- `Sleep Number cron job initialized`
- `Device monitoring cron job initialized`

⚠️ **Warning Indicators (Non-Critical):**
- `WARNING: APNs credentials not configured` - Expected if not using Apple Watch
- `WARNING: ENCRYPTION_KEY not configured` - Critical for device integrations
- `WARNING: Oura credentials not configured` - Expected if not using Oura

❌ **Error Indicators (Critical):**
- `Error connecting to database`
- `Error initializing cron jobs`
- Server fails to start

### Device Integration Validation

**Test Each Integration:**
1. Connect device in mobile app
2. Check backend logs for connection success
3. Trigger manual sync
4. Verify data appears in database
5. Wait for automatic sync (6 AM UTC)
6. Check monitoring endpoint: `GET /monitoring/sync-health`

---

## Troubleshooting

### Issue: "ENCRYPTION_KEY not configured" Warning

**Cause**: Missing or incorrect ENCRYPTION_KEY variable

**Solution:**
1. Generate new 32-character key (see generation commands above)
2. Set in Railway environment variables
3. Redeploy backend
4. Verify warning disappears from logs

### Issue: "APNs credentials not configured" Warning

**Cause**: Missing APNs variables (APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID)

**Solution:**
1. Complete Apple Developer Portal setup (see APNS_SETUP_GUIDE.md)
2. Generate APNs key and download .p8 file
3. Encode .p8 file to base64
4. Set all three APNs variables in Railway
5. Redeploy backend

### Issue: Oura OAuth Fails

**Cause**: Incorrect OURA_CLIENT_ID or OURA_CLIENT_SECRET

**Solution:**
1. Verify credentials in Oura Cloud Developer Portal
2. Ensure no extra spaces or characters
3. Regenerate client secret if needed
4. Update Railway variables
5. Redeploy backend

### Issue: Database Connection Fails

**Cause**: Incorrect SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY

**Solution:**
1. Verify credentials in Supabase dashboard
2. Check for typos in variable names
3. Ensure using service role key (not anon key) for backend
4. Update Railway variables
5. Redeploy backend

---

## Security Best Practices

### 1. Never Commit Secrets to Version Control

Add to `.gitignore`:
```
.env
.env.local
.env.production
*.p8
```

### 2. Rotate Keys Periodically

- **ENCRYPTION_KEY**: Rotate annually
- **APNS_KEY**: Rotate annually
- **OAuth Secrets**: Rotate when compromised
- **JWT_SECRET**: Rotate quarterly

### 3. Use Different Keys for Each Environment

- Development: Use test/development keys
- Staging: Use staging-specific keys
- Production: Use production keys only

### 4. Limit Access to Environment Variables

- Only authorized team members should have access
- Use Railway's team permissions
- Audit access logs regularly

### 5. Monitor for Exposed Secrets

- Use tools like GitGuardian or TruffleHog
- Set up alerts for exposed secrets
- Rotate immediately if exposed

---

## Quick Reference Table

| Variable | Required | Backend | Frontend | Security Level |
|----------|----------|---------|----------|----------------|
| NODE_ENV | Yes | ✅ | ❌ | Low |
| SUPABASE_URL | Yes | ✅ | ✅ | Low |
| SUPABASE_SERVICE_ROLE_KEY | Yes | ✅ | ❌ | CRITICAL |
| ENCRYPTION_KEY | Yes | ✅ | ❌ | CRITICAL |
| OURA_CLIENT_ID | Yes* | ✅ | ✅ | Low |
| OURA_CLIENT_SECRET | Yes* | ✅ | ❌ | CRITICAL |
| APNS_KEY | Yes* | ✅ | ❌ | CRITICAL |
| APNS_KEY_ID | Yes* | ✅ | ❌ | Medium |
| APNS_TEAM_ID | Yes* | ✅ | ❌ | Medium |
| APNS_BUNDLE_ID | Yes* | ✅ | ❌ | Low |
| SLEEPNUMBER_EMAIL | Yes* | ✅ | ❌ | High |
| SLEEPNUMBER_PASSWORD | Yes* | ✅ | ❌ | CRITICAL |
| OPENAI_API_KEY | Yes | ✅ | ❌ | CRITICAL |
| EXPO_PUBLIC_API_URL | Yes | ❌ | ✅ | Low |

*Required only if using that specific device integration

---

## Support

For issues with environment variables:
- Check logs for specific error messages
- Verify variable names match exactly (case-sensitive)
- Ensure no extra spaces or newlines in values
- Redeploy after changing variables
- Contact team lead if issues persist
