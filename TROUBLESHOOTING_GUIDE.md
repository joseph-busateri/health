# Device Integration Troubleshooting Guide

## Overview
This comprehensive troubleshooting guide covers common issues across all three device integrations (Oura Ring, Apple Watch, Sleep Number) with step-by-step solutions.

---

## Table of Contents
1. [Oura Ring Troubleshooting](#oura-ring-troubleshooting)
2. [Apple Watch Troubleshooting](#apple-watch-troubleshooting)
3. [Sleep Number Troubleshooting](#sleep-number-troubleshooting)
4. [Backend Issues](#backend-issues)
5. [Database Issues](#database-issues)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [General Debugging](#general-debugging)

---

## Oura Ring Troubleshooting

### Issue: OAuth Authorization Fails

**Symptoms:**
- Redirect to Oura fails
- "Authorization failed" error
- Stuck on authorization page

**Possible Causes:**
1. Incorrect OURA_CLIENT_ID or OURA_CLIENT_SECRET
2. Redirect URI mismatch
3. Oura API temporarily unavailable
4. Network connectivity issue

**Solutions:**

**Step 1: Verify Environment Variables**
```bash
# Check Railway environment variables
OURA_CLIENT_ID=your-client-id
OURA_CLIENT_SECRET=your-client-secret
```

**Step 2: Verify Redirect URI**
- Check Oura Developer Portal settings
- Ensure redirect URI matches exactly: `healthapp://oura-callback`
- Update if needed and redeploy

**Step 3: Check Backend Logs**
```bash
# Railway logs
railway logs

# Look for:
"Oura OAuth error"
"Invalid client credentials"
"Redirect URI mismatch"
```

**Step 4: Test OAuth Flow Manually**
```bash
# Test authorization URL generation
curl http://localhost:3000/devices/oura/test-user/auth-url
```

**Step 5: Regenerate Credentials**
- Go to Oura Cloud Developer Portal
- Regenerate client secret
- Update Railway environment variables
- Redeploy backend

---

### Issue: Token Refresh Fails

**Symptoms:**
- Sync fails after initial success
- "Token expired" error
- Consecutive failures increasing

**Possible Causes:**
1. Refresh token expired (30 days)
2. User revoked access
3. Oura API changes

**Solutions:**

**Step 1: Check Token Expiration**
```sql
SELECT 
  user_id,
  token_expires_at,
  last_sync_at,
  consecutive_failures
FROM oura_connections
WHERE user_id = 'user-id-here';
```

**Step 2: Check Refresh Token**
```sql
SELECT 
  refresh_token_encrypted IS NOT NULL as has_refresh_token
FROM oura_connections
WHERE user_id = 'user-id-here';
```

**Step 3: Manual Token Refresh**
- User must reconnect their Oura account
- Disconnect and reconnect in app
- This will generate new tokens

**Step 4: Check Backend Logs**
```bash
# Look for token refresh attempts
grep "Token refresh" railway.log
grep "Oura token" railway.log
```

---

### Issue: No Data Syncing

**Symptoms:**
- Connection shows "Connected"
- Sync completes but no data appears
- Empty database tables

**Possible Causes:**
1. No data available in Oura account
2. Date range issue
3. API response format changed
4. Database write failure

**Solutions:**

**Step 1: Verify Data in Oura App**
- Open Oura mobile app
- Verify data exists for recent days
- Sync Oura Ring with app

**Step 2: Check Sync History**
```sql
SELECT *
FROM oura_sync_history
WHERE user_id = 'user-id-here'
ORDER BY sync_started_at DESC
LIMIT 5;
```

**Step 3: Check Backend Logs**
```bash
# Look for sync details
grep "Oura sync" railway.log
grep "records synced" railway.log
```

**Step 4: Manual API Test**
```bash
# Test Oura API directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.ouraring.com/v2/usercollection/daily_readiness
```

**Step 5: Check Database Tables**
```sql
-- Check if any data exists
SELECT COUNT(*) FROM oura_daily_readiness WHERE user_id = 'user-id-here';
SELECT COUNT(*) FROM oura_daily_sleep WHERE user_id = 'user-id-here';
SELECT COUNT(*) FROM oura_daily_activity WHERE user_id = 'user-id-here';
```

---

### Issue: Sync Takes Too Long

**Symptoms:**
- Sync times out
- App freezes during sync
- "Request timeout" error

**Possible Causes:**
1. Large date range (30+ days)
2. Network latency
3. Oura API slow response
4. Database write bottleneck

**Solutions:**

**Step 1: Check Sync Duration**
```sql
SELECT 
  sync_duration_seconds,
  records_synced,
  date_range_start,
  date_range_end
FROM oura_sync_history
WHERE user_id = 'user-id-here'
ORDER BY sync_started_at DESC
LIMIT 10;
```

**Step 2: Reduce Date Range**
- Modify sync to use smaller date ranges
- Sync in batches (7 days at a time)

**Step 3: Check Network**
```bash
# Test API response time
time curl -H "Authorization: Bearer TOKEN" \
  https://api.ouraring.com/v2/usercollection/daily_readiness
```

**Step 4: Optimize Database Writes**
- Use batch inserts instead of individual inserts
- Add database indexes if missing

---

## Apple Watch Troubleshooting

### Issue: HealthKit Authorization Fails

**Symptoms:**
- Permission dialog doesn't appear
- "HealthKit not available" error
- Authorization denied

**Possible Causes:**
1. Running on Android device
2. HealthKit capability not enabled in Xcode
3. iOS version too old
4. User denied permissions

**Solutions:**

**Step 1: Verify iOS Device**
- Ensure using iPhone (not Android)
- Check iOS version (14+ required)
- Restart iPhone

**Step 2: Check Xcode Configuration**
```
1. Open Xcode project
2. Select target
3. Go to Signing & Capabilities
4. Verify "HealthKit" capability is enabled
5. Rebuild app
```

**Step 3: Check iOS Settings**
```
Settings > Privacy > Health > [App Name]
- Verify app is listed
- Check permissions granted
```

**Step 4: Reset HealthKit Permissions**
```
Settings > Privacy > Health > [App Name]
- Turn off all permissions
- Delete app
- Reinstall app
- Grant permissions again
```

---

### Issue: APNs Notifications Not Working

**Symptoms:**
- Background sync not triggering
- No silent notifications received
- Automatic sync fails

**Possible Causes:**
1. APNs credentials not configured
2. Device token not registered
3. Push notifications disabled
4. APNs certificate expired

**Solutions:**

**Step 1: Verify APNs Configuration**
```bash
# Check Railway environment variables
APNS_KEY=base64:...
APNS_KEY_ID=AB12CD34EF
APNS_TEAM_ID=1234567890
APNS_BUNDLE_ID=com.yourcompany.healthapp
```

**Step 2: Check Device Token**
```sql
SELECT 
  ios_device_token,
  ios_push_enabled
FROM users
WHERE id = 'user-id-here';
```

**Step 3: Check Backend Logs**
```bash
# Look for APNs activity
grep "APNs" railway.log
grep "device token" railway.log
grep "push notification" railway.log
```

**Step 4: Test APNs Manually**
```bash
# Trigger sync from backend
curl -X POST http://localhost:3000/devices/apple-watch/user-id/sync
```

**Step 5: Verify iOS Settings**
```
Settings > Notifications > [App Name]
- Allow Notifications: ON
Settings > General > Background App Refresh
- Background App Refresh: ON
- [App Name]: ON
```

**Step 6: Check APNs Key**
```bash
# Verify .p8 file is valid
openssl asn1parse -in AuthKey_XXXXXXXXXX.p8
```

---

### Issue: No HealthKit Data Available

**Symptoms:**
- Query returns empty results
- "No data available" message
- Activity rings show 0%

**Possible Causes:**
1. Apple Watch not worn
2. No data in HealthKit
3. Date range too narrow
4. Permissions not granted for specific data types

**Solutions:**

**Step 1: Verify Data in Health App**
```
1. Open Health app on iPhone
2. Go to Browse > Activity
3. Verify data exists for today
4. Check Heart Rate, Steps, etc.
```

**Step 2: Check HealthKit Permissions**
```
Settings > Privacy > Health > [App Name]
- Verify all data types are enabled
- Re-enable if needed
```

**Step 3: Wear Apple Watch**
- Ensure watch is worn and unlocked
- Wait a few hours for data to accumulate
- Sync watch with iPhone

**Step 4: Expand Date Range**
```typescript
// Try wider date range
const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
```

**Step 5: Check Specific Data Types**
```typescript
// Test each data type individually
const heartRate = await HealthKit.querySamples(
  HealthKit.HKQuantityTypeIdentifier.heartRate,
  { from: startDate, to: endDate }
);
console.log('Heart rate samples:', heartRate.length);
```

---

### Issue: Background Sync Not Working

**Symptoms:**
- Manual sync works, automatic doesn't
- Data only updates when app is open
- Cron job runs but no data synced

**Possible Causes:**
1. Background App Refresh disabled
2. Low Power Mode enabled
3. APNs not configured
4. iOS restrictions

**Solutions:**

**Step 1: Enable Background App Refresh**
```
Settings > General > Background App Refresh
- Background App Refresh: ON
- Scroll to [App Name]: ON
```

**Step 2: Disable Low Power Mode**
```
Settings > Battery
- Low Power Mode: OFF
```

**Step 3: Check Background Modes**
```
Xcode > Target > Signing & Capabilities
- Background Modes capability enabled
- Background fetch: checked
- Remote notifications: checked
```

**Step 4: Test on Physical Device**
- Background sync doesn't work reliably in simulator
- Test on actual iPhone

---

## Sleep Number Troubleshooting

### Issue: Login Fails

**Symptoms:**
- "Invalid credentials" error
- "Login failed" message
- Connection timeout

**Possible Causes:**
1. Incorrect email or password
2. Sleep Number account locked
3. Network connectivity issue
4. Sleep Number API unavailable

**Solutions:**

**Step 1: Verify Credentials**
```bash
# Check environment variables
SLEEPNUMBER_EMAIL=your-email@example.com
SLEEPNUMBER_PASSWORD=your-password
```

**Step 2: Test Login in Sleep Number App**
- Open Sleep Number mobile app
- Try logging in
- Reset password if needed

**Step 3: Check Account Status**
- Go to sleepnumber.com
- Log in to web portal
- Verify account is active

**Step 4: Check Backend Logs**
```bash
grep "Sleep Number login" railway.log
grep "authentication error" railway.log
```

**Step 5: Update Credentials**
- Reset password at sleepnumber.com
- Update Railway environment variables
- Redeploy backend

---

### Issue: No Sleep Data

**Symptoms:**
- Connection successful but no data
- Empty sleep records
- "No data available" message

**Possible Causes:**
1. Haven't slept on bed yet
2. Bed not connected to WiFi
3. Sleep Number app not synced
4. Date range issue

**Solutions:**

**Step 1: Verify Bed Connection**
```
1. Open Sleep Number app
2. Check bed connectivity status
3. Ensure WiFi connection is active
4. Restart bed if needed (unplug for 30 seconds)
```

**Step 2: Sync Sleep Number App**
- Open Sleep Number app
- Pull down to refresh
- Wait for sync to complete

**Step 3: Check Data Availability**
```sql
SELECT *
FROM sleep_number_sleep_data
WHERE user_id = 'user-id-here'
ORDER BY date DESC
LIMIT 7;
```

**Step 4: Verify Date Range**
- Sleep data typically available morning after sleep
- Check if querying correct date range

**Step 5: Test API Directly**
```bash
# Test Sleep Number API
curl -X POST https://prod-api.sleepiq.sleepnumber.com/rest/login \
  -d "login=email&password=pass"
```

---

### Issue: Sync Fails After Working

**Symptoms:**
- Initial sync worked
- Subsequent syncs fail
- "Session expired" error

**Possible Causes:**
1. Session token expired
2. Password changed
3. Account locked
4. API changes

**Solutions:**

**Step 1: Check Session Status**
```sql
SELECT 
  last_sync_at,
  consecutive_failures,
  last_error_message
FROM sleep_number_connections
WHERE user_id = 'user-id-here';
```

**Step 2: Re-authenticate**
- Disconnect Sleep Number in app
- Reconnect with credentials
- This will create new session

**Step 3: Check Backend Logs**
```bash
grep "Sleep Number session" railway.log
grep "authentication failed" railway.log
```

**Step 4: Verify Credentials Still Valid**
- Log in to Sleep Number app
- Log in to sleepnumber.com
- Ensure password hasn't changed

---

## Backend Issues

### Issue: Cron Jobs Not Running

**Symptoms:**
- No automatic syncs happening
- Sync history shows no cron-triggered syncs
- Last sync time not updating

**Possible Causes:**
1. Cron jobs not initialized
2. Railway cron configuration missing
3. Server restart interrupted cron
4. Timezone issue

**Solutions:**

**Step 1: Check Cron Initialization**
```bash
# Check server logs on startup
grep "cron job initialized" railway.log
```

**Step 2: Verify Cron Schedule**
```typescript
// Check cron schedule in code
// Should be: '0 6 * * *' (6 AM UTC daily)
```

**Step 3: Check Railway Configuration**
```json
// railway.json should have:
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

**Step 4: Manual Cron Trigger**
```bash
# Trigger sync manually to test
curl -X POST http://localhost:3000/devices/oura/user-id/sync
```

**Step 5: Check Server Uptime**
```bash
# Verify server hasn't restarted
curl http://your-backend.railway.app/health
```

---

### Issue: Environment Variables Not Loading

**Symptoms:**
- "WARNING: credentials not configured"
- Features not working
- 500 errors on device endpoints

**Possible Causes:**
1. Variables not set in Railway
2. Typo in variable names
3. Variables not redeployed
4. .env file not loaded locally

**Solutions:**

**Step 1: Verify Railway Variables**
```
1. Go to Railway dashboard
2. Select project
3. Click on service
4. Go to Variables tab
5. Verify all required variables are set
```

**Step 2: Check Variable Names**
```bash
# Ensure exact match (case-sensitive)
OURA_CLIENT_ID (not oura_client_id)
APNS_KEY_ID (not apns_key_id)
```

**Step 3: Redeploy After Changes**
```
Railway auto-redeploys when variables change
Wait for deployment to complete
Check logs for successful startup
```

**Step 4: Local Development**
```bash
# Create .env file in server directory
cd server
touch .env

# Add variables
NODE_ENV=development
OURA_CLIENT_ID=...
# etc.
```

**Step 5: Verify Loading**
```typescript
// Add logging to verify
console.log('OURA_CLIENT_ID:', process.env.OURA_CLIENT_ID ? 'Set' : 'Not set');
```

---

### Issue: High Memory Usage

**Symptoms:**
- Server crashes
- Out of memory errors
- Slow response times

**Possible Causes:**
1. Memory leak in sync process
2. Large data sets not paginated
3. Too many concurrent syncs
4. Insufficient Railway resources

**Solutions:**

**Step 1: Check Memory Usage**
```bash
# Railway metrics
railway metrics

# Look for memory spikes
```

**Step 2: Optimize Sync Process**
```typescript
// Batch process large datasets
const batchSize = 100;
for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);
  await processBatch(batch);
}
```

**Step 3: Add Pagination**
```typescript
// Paginate API requests
const limit = 100;
let offset = 0;
while (true) {
  const results = await api.getData({ limit, offset });
  if (results.length === 0) break;
  await processResults(results);
  offset += limit;
}
```

**Step 4: Upgrade Railway Plan**
```
If consistently hitting memory limits:
1. Go to Railway dashboard
2. Upgrade to higher tier
3. Allocate more memory
```

---

## Database Issues

### Issue: Connection Timeout

**Symptoms:**
- "Database connection timeout"
- Queries fail intermittently
- 500 errors on API endpoints

**Possible Causes:**
1. Supabase connection limit reached
2. Network latency
3. Long-running queries
4. Connection pool exhausted

**Solutions:**

**Step 1: Check Supabase Status**
```
1. Go to Supabase dashboard
2. Check project status
3. View connection metrics
```

**Step 2: Optimize Queries**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_user_id ON oura_daily_readiness(user_id);
CREATE INDEX idx_date ON oura_daily_readiness(date);

-- Use EXPLAIN to analyze slow queries
EXPLAIN ANALYZE SELECT * FROM oura_daily_readiness WHERE user_id = 'x';
```

**Step 3: Increase Connection Pool**
```typescript
// In supabase config
const supabase = createClient(url, key, {
  db: {
    poolSize: 10 // Increase if needed
  }
});
```

**Step 4: Add Query Timeout**
```typescript
// Set statement timeout
await supabase.rpc('set_statement_timeout', { timeout: 30000 });
```

---

### Issue: Data Inconsistency

**Symptoms:**
- Duplicate records
- Missing data
- Incorrect values

**Possible Causes:**
1. Race condition in sync
2. Failed transaction rollback
3. Concurrent writes
4. Data type mismatch

**Solutions:**

**Step 1: Check for Duplicates**
```sql
-- Find duplicate records
SELECT user_id, date, COUNT(*)
FROM oura_daily_readiness
GROUP BY user_id, date
HAVING COUNT(*) > 1;
```

**Step 2: Add Unique Constraints**
```sql
-- Prevent duplicates
ALTER TABLE oura_daily_readiness
ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);
```

**Step 3: Use Upsert**
```typescript
// Use upsert instead of insert
await supabase
  .from('oura_daily_readiness')
  .upsert(data, { onConflict: 'user_id,date' });
```

**Step 4: Verify Data Types**
```sql
-- Check column types
\d+ oura_daily_readiness
```

---

## Monitoring & Alerts

### Issue: No Alerts for Failures

**Symptoms:**
- Syncs failing but no alerts
- Monitoring endpoint returns empty
- Alert table empty

**Possible Causes:**
1. Monitoring cron not running
2. Alert threshold not reached
3. Alert service not configured
4. Database write failure

**Solutions:**

**Step 1: Check Monitoring Cron**
```bash
grep "device monitoring" railway.log
grep "monitoring check" railway.log
```

**Step 2: Verify Alert Threshold**
```typescript
// Default threshold is 3 consecutive failures
// Check if failures >= 3
```

**Step 3: Check Alert Table**
```sql
SELECT * FROM device_sync_alerts
ORDER BY alert_sent_at DESC
LIMIT 10;
```

**Step 4: Manual Monitoring Trigger**
```bash
curl -X POST http://localhost:3000/monitoring/check-all
```

**Step 5: Check Consecutive Failures**
```sql
SELECT 
  user_id,
  consecutive_failures,
  last_error_message
FROM oura_connections
WHERE consecutive_failures >= 3;
```

---

## General Debugging

### Enable Debug Logging

**Backend:**
```typescript
// Add to logger config
logger.level = 'debug';

// Add debug logs
logger.debug('Sync started', { userId, deviceType });
```

**Frontend:**
```typescript
// Enable console logs
console.log('API request:', url, body);
console.log('API response:', response);
```

### Check API Response

```bash
# Test endpoint directly
curl -X GET http://localhost:3000/devices/oura/user-id/status

# With headers
curl -X GET http://localhost:3000/devices/oura/user-id/status \
  -H "Content-Type: application/json"
```

### Database Query Debugging

```sql
-- Enable query logging
SET log_statement = 'all';

-- Check recent queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### Network Debugging

```bash
# Test connectivity
ping api.ouraring.com
ping api.sleepiq.sleepnumber.com

# Test DNS
nslookup api.ouraring.com

# Test SSL
openssl s_client -connect api.ouraring.com:443
```

---

## Getting Help

### Collect Diagnostic Information

Before contacting support, collect:

1. **Backend Logs**
```bash
railway logs > backend-logs.txt
```

2. **Database State**
```sql
-- Connection status
SELECT * FROM oura_connections WHERE user_id = 'user-id';
SELECT * FROM apple_watch_connections WHERE user_id = 'user-id';
SELECT * FROM sleep_number_connections WHERE user_id = 'user-id';

-- Recent sync history
SELECT * FROM oura_sync_history WHERE user_id = 'user-id' ORDER BY sync_started_at DESC LIMIT 5;
```

3. **Environment Variables** (redact sensitive values)
```bash
# List of variables set (not values)
railway variables
```

4. **Error Messages**
- Screenshot of error in app
- Copy full error message from logs

### Contact Support

- **Email**: support@healthperformanceagent.com
- **Include**: Diagnostic information above
- **Describe**: What you were trying to do, what happened, what you expected

---

**Last Updated**: April 2026  
**Version**: 1.0
