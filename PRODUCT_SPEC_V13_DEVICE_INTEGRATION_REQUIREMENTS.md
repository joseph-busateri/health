# Product Spec V13 - Device Integration Requirements

**Version**: 13.2  
**Date**: March 29, 2026  
**Status**: ✅ **UPDATED - Oura Ring Gen 3 Integration Complete**

---

## 🎯 Device Integration Philosophy

**CRITICAL REQUIREMENT**: All device integrations MUST implement **automatic data synchronization** with **ZERO user interaction** required after initial account connection.

---

## 📋 Device Integration Requirements

### **Core Principle**:
> Users connect their device account ONCE. After that, data syncs automatically every day without any user action.

### **User Experience Flow**:
```
1. User opens "Connect [Device]" screen (ONE TIME)
2. User enters device account credentials (ONE TIME)
3. App authenticates and stores encrypted tokens (ONE TIME)
4. Initial sync runs immediately (AUTOMATIC)
5. Daily sync scheduled (AUTOMATIC)
6. Every day: Data syncs automatically at scheduled time (AUTOMATIC)
7. User wakes up to fresh data (NO ACTION REQUIRED)
```

---

## ✅ Reference Implementation: Sleep Number

### **Status**: ✅ **COMPLETE** (March 29, 2026)

**What Was Built**:
- ✅ Database schema for OAuth tokens and sync queue
- ✅ API client with automatic token refresh
- ✅ Background sync service with encryption
- ✅ Mobile connect screen (one-time setup)
- ✅ Cron job system for daily execution
- ✅ Sync history and statistics tracking

**Files Created**:
- `20260329_sleep_number_api_integration.sql` (400 lines)
- `sleepNumberApiClient.ts` (350 lines)
- `sleepNumberSyncService.ts` (450 lines)
- `SleepNumberConnectScreen.tsx` (600 lines)

**Key Features**:
- AES-256 encrypted token storage
- Automatic token refresh
- Smart date range syncing (only new data)
- Error handling and retry logic (max 3 attempts)
- Sync statistics and history
- Manual sync option available
- Easy disconnect

**Automatic Flow**:
```
6:00 AM → Cron job triggers
6:01 AM → System fetches pending sync jobs
6:02 AM → Decrypts tokens, connects to API
6:03 AM → Fetches new sleep data
6:04 AM → Saves sessions to database
6:05 AM → Schedules next sync
```

---

## 🔄 Required Components for Each Device Integration

### **1. Database Schema** ✅
**Required Tables**:
- `[device]_connections` - OAuth tokens, sync settings
- `[device]_sync_history` - Track all sync operations
- `[device]_sync_queue` - Job queue for scheduled syncs

**Required Fields in Connections Table**:
- `user_id` - Link to user
- `access_token_encrypted` - AES-256 encrypted
- `refresh_token_encrypted` - AES-256 encrypted
- `token_expires_at` - Token expiration
- `connection_status` - active/expired/disconnected
- `last_sync_date` - Last successful sync
- `auto_sync_enabled` - Enable/disable toggle
- `sync_frequency` - daily/twice_daily/hourly
- `preferred_sync_time` - When to sync

**Required Helper Functions**:
- `schedule_next_sync()` - Calculate next sync time
- `queue_sync_job()` - Add job to queue
- `get_pending_sync_jobs()` - Get jobs ready to run
- `start_sync_job()` - Mark job as processing
- `complete_sync_job()` - Complete and schedule next
- `get_sync_statistics()` - Get sync stats

**Required Triggers**:
- Auto-schedule initial sync on connection
- Auto-update timestamps

---

### **2. API Client** ✅
**Required Methods**:
- `login(credentials)` - Authenticate with device API
- `refreshAccessToken()` - Refresh expired tokens
- `setTokens(tokens)` - Set authentication tokens
- `getData(dateRange)` - Fetch device data
- `testConnection()` - Test API connection
- `logout()` - Logout and clear tokens

**Required Features**:
- Automatic token refresh (before expiration)
- Request/response interceptors
- Error handling and retry logic
- 401 (unauthorized) auto-retry after refresh

---

### **3. Sync Service** ✅
**Required Methods**:
- `connectAccount(userId, credentials)` - Connect account
- `disconnectAccount(userId)` - Disconnect account
- `runAutomaticSync()` - Run sync for all connections (cron job)
- `processSyncJob(jobId, connectionId, userId)` - Process single job
- `syncData(connection, userId)` - Sync data from API
- `queueSyncJob(connectionId, scheduledFor, priority)` - Queue job
- `getSyncStatistics(userId, days)` - Get sync stats

**Required Features**:
- AES-256 encryption/decryption for tokens
- Smart date range (from last sync to today)
- Duplicate prevention
- Error handling and retry logic
- Sync history tracking
- Automatic rescheduling

---

### **4. Mobile Connect Screen** ✅
**Required UI States**:

**Not Connected State**:
- Login form (email/password or OAuth)
- Show/hide password toggle
- Connect button with loading state
- Benefits list (automatic sync, no interaction, etc.)
- Security notice (encryption)

**Connected State**:
- Connection status display
- Auto-sync toggle
- Sync frequency selector
- Sync time display
- Manual "Sync Now" button
- Disconnect button
- Sync statistics display

---

### **5. Cron Job System** ✅
**Required Setup**:
```typescript
// Daily sync execution
cron.schedule('0 6 * * *', async () => {
  await [device]SyncService.runAutomaticSync();
});
```

**Alternative: Database-Driven**:
```sql
-- Query runs every minute
SELECT * FROM get_pending_sync_jobs(10);
-- Process jobs scheduled for now or earlier
```

---

## 🔐 Security Requirements

### **Token Encryption** (MANDATORY):
- ✅ AES-256-CBC encryption algorithm
- ✅ Unique IV (initialization vector) per token
- ✅ Encrypted tokens stored in database
- ✅ Decrypted only during sync (in memory)
- ✅ Tokens cleared from memory after sync

### **Token Lifecycle**:
```
1. User logs in → Tokens received from device API
2. Tokens encrypted → Stored in database
3. Sync job runs → Tokens decrypted in memory
4. API calls made → Tokens used for authentication
5. Sync completes → Tokens cleared from memory
```

---

## 📊 Device Integration Roadmap

### **Priority 1: Sleep Number** ✅ **COMPLETE**
- Status: 100% Complete (March 29, 2026)
- Automatic daily sync operational
- Reference implementation for all other devices

### **Priority 2: Apple Watch Series 9** ✅ **COMPLETE**
- Status: 100% Complete (March 29, 2026)
- HealthKit integration via iOS app
- Heart rate, HRV, activity rings, sleep, workouts
- Automatic daily sync at 6 AM
- Silent push notifications trigger iOS app background sync
- **COMPLETE**: Automatic daily sync (no user interaction)

### **Priority 3: Oura Ring Gen 3 Horizon** ✅ **COMPLETE**
- Status: 100% Complete (March 29, 2026)
- OAuth-based API integration
- Sleep tracking with stages (REM, deep, light, awake)
- Readiness score with contributors
- Activity and movement data
- HRV and temperature tracking
- Automatic daily sync at 6 AM
- AES-256 encrypted token storage
- **COMPLETE**: Automatic daily sync (no user interaction)

### **Priority 4: Whoop** ⏳ **PENDING**
- Recovery data (strain, recovery score)
- Sleep performance
- HRV tracking
- **REQUIREMENT**: Automatic daily sync (no user interaction)

### **Priority 5: Apple Health** ⏳ **PENDING**
- Workouts
- Steps, heart rate
- Historical data export
- **REQUIREMENT**: Automatic daily sync (no user interaction)

### **Priority 6: Blood Pressure Monitor** ⏳ **PENDING**
- BP readings
- Heart rate
- Historical tracking
- **REQUIREMENT**: Automatic daily sync (no user interaction)

---

## 🎯 Success Criteria

### **For Each Device Integration**:
- ✅ User connects account ONCE
- ✅ Initial sync runs immediately
- ✅ Daily sync scheduled automatically
- ✅ Data syncs every day at scheduled time
- ✅ NO user interaction required after setup
- ✅ Encrypted token storage (AES-256)
- ✅ Automatic token refresh
- ✅ Error handling and retry logic
- ✅ Sync history and statistics
- ✅ Manual sync option available
- ✅ Easy disconnect option

---

## 🚫 What NOT to Build

### **Manual Upload Flows** ❌
- ❌ File upload screens for device data
- ❌ Manual data entry for device metrics
- ❌ "Sync Now" as primary interaction
- ❌ Daily reminders to upload data

### **Why**:
Device integrations should be **set-and-forget**. Users connect once and never think about it again.

---

## 📋 Implementation Checklist

### **For Each New Device Integration**:
- [ ] Database schema with OAuth tables
- [ ] API client with auto-refresh
- [ ] Sync service with encryption
- [ ] Mobile connect screen
- [ ] Cron job setup
- [ ] Sync history tracking
- [ ] Error handling and retry
- [ ] Manual sync option
- [ ] Disconnect functionality
- [ ] Sync statistics
- [ ] Documentation
- [ ] Testing (connection, sync, error cases)

---

## 🎊 Summary

**CRITICAL REQUIREMENT**: All device integrations MUST implement automatic data synchronization with ZERO user interaction after initial account connection.

**Reference Implementations**: 
- ✅ Sleep Number (100% complete) - OAuth-based API integration
- ✅ Apple Watch Series 9 (100% complete) - HealthKit integration via iOS app
- ✅ Oura Ring Gen 3 Horizon (100% complete) - OAuth-based API integration

**User Experience**: Connect once, data syncs automatically forever.

**Security**: AES-256 encryption for all OAuth tokens.

**No Exceptions**: Every device integration must follow this pattern.

---

**Updated**: March 29, 2026  
**Status**: Sleep Number, Apple Watch & Oura Ring complete, all other devices must follow same pattern
