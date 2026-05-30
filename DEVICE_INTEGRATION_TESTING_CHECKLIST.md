# Device Integration End-to-End Testing Checklist

## Overview
This comprehensive checklist covers end-to-end testing for all three device integrations: Oura Ring, Apple Watch, and Sleep Number. Use this to validate functionality before production deployment.

---

## Pre-Testing Setup

### Backend Setup
- [ ] Backend deployed to Railway
- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] Cron jobs initialized
- [ ] Monitoring endpoints accessible

### Frontend Setup
- [ ] Mobile app built and deployed to TestFlight/Internal Testing
- [ ] Environment variables configured
- [ ] Deep linking configured (for Oura)
- [ ] HealthKit capability enabled (for Apple Watch)
- [ ] Push notifications enabled (for Apple Watch)

### Test Devices Required
- [ ] Physical iPhone with iOS 14+
- [ ] Apple Watch Series 4+ paired with iPhone
- [ ] Oura Ring Gen 3 with active subscription
- [ ] Sleep Number 360 Smart Bed or newer
- [ ] Stable internet connection

---

## Phase 1: Oura Ring Integration Testing

### 1.1 OAuth Flow Testing

#### Initial Connection
- [ ] Open Oura Connect screen in app
- [ ] Tap "Connect Oura Ring" button
- [ ] Verify redirect to Oura authorization page in browser
- [ ] Log in with Oura credentials
- [ ] Grant all requested permissions
- [ ] Verify redirect back to app
- [ ] Verify success message displayed
- [ ] Verify connection status shows "Connected"

#### OAuth Error Scenarios
- [ ] Test with incorrect credentials (should show error)
- [ ] Test with denied permissions (should handle gracefully)
- [ ] Test with network disconnection (should show error)
- [ ] Test canceling authorization (should return to app)

### 1.2 Data Sync Testing

#### Initial Sync
- [ ] Verify initial sync triggers automatically after connection
- [ ] Check backend logs for sync initiation
- [ ] Wait for sync completion (30-60 seconds)
- [ ] Verify readiness score displays correctly
- [ ] Verify sync statistics display (records synced, date range)
- [ ] Check database for synced data:
  ```sql
  SELECT * FROM oura_daily_sleep WHERE user_id = 'test-user-id' ORDER BY date DESC LIMIT 5;
  SELECT * FROM oura_daily_readiness WHERE user_id = 'test-user-id' ORDER BY date DESC LIMIT 5;
  SELECT * FROM oura_daily_activity WHERE user_id = 'test-user-id' ORDER BY date DESC LIMIT 5;
  ```

#### Manual Sync
- [ ] Tap "Sync Now" button
- [ ] Verify loading indicator appears
- [ ] Wait for sync completion
- [ ] Verify success message
- [ ] Verify last sync time updates
- [ ] Check sync history in database:
  ```sql
  SELECT * FROM oura_sync_history WHERE user_id = 'test-user-id' ORDER BY sync_started_at DESC LIMIT 5;
  ```

#### Automatic Sync (Cron)
- [ ] Wait for scheduled sync at 6 AM UTC (or trigger manually)
- [ ] Check backend logs for cron execution
- [ ] Verify sync completes successfully
- [ ] Check sync history for cron-triggered sync
- [ ] Verify data updates in database

### 1.3 Data Quality Testing

#### Readiness Data
- [ ] Verify readiness score is between 0-100
- [ ] Verify contributors display correctly
- [ ] Verify date matches today or yesterday
- [ ] Compare with Oura app for accuracy

#### Sleep Data
- [ ] Verify sleep duration is reasonable (0-12 hours)
- [ ] Verify sleep stages add up to total duration
- [ ] Verify sleep efficiency is between 0-100%
- [ ] Compare with Oura app for accuracy

#### Activity Data
- [ ] Verify step count is reasonable
- [ ] Verify calorie burn is reasonable
- [ ] Verify activity score is between 0-100
- [ ] Compare with Oura app for accuracy

### 1.4 Connection Management

#### Disconnect
- [ ] Tap "Disconnect Oura Ring" button
- [ ] Confirm disconnection
- [ ] Verify connection status shows "Not Connected"
- [ ] Verify historical data remains visible
- [ ] Check database connection status:
  ```sql
  SELECT connection_status FROM oura_connections WHERE user_id = 'test-user-id';
  ```

#### Reconnect
- [ ] Reconnect Oura Ring
- [ ] Verify OAuth flow works again
- [ ] Verify historical data is preserved
- [ ] Verify new data syncs correctly

### 1.5 Error Handling

#### Token Expiration
- [ ] Wait for token to expire (or manually expire in database)
- [ ] Trigger sync
- [ ] Verify token refresh happens automatically
- [ ] Verify sync completes successfully

#### API Errors
- [ ] Simulate Oura API downtime (disconnect internet temporarily)
- [ ] Trigger sync
- [ ] Verify error message displays
- [ ] Verify consecutive failures increment
- [ ] Reconnect internet and verify recovery

---

## Phase 2: Apple Watch Integration Testing

### 2.1 HealthKit Authorization

#### Initial Authorization
- [ ] Open Apple Watch Connect screen
- [ ] Tap "Connect Apple Watch" button
- [ ] Verify HealthKit permission dialog appears
- [ ] Grant all requested permissions
- [ ] Verify success message
- [ ] Verify connection status shows "Connected"

#### Permission Scenarios
- [ ] Test denying some permissions (should handle gracefully)
- [ ] Test denying all permissions (should show error)
- [ ] Test granting permissions later (should work on retry)

### 2.2 Data Reading Testing

#### Heart Rate Data
- [ ] Verify heart rate data reads successfully
- [ ] Check for resting heart rate
- [ ] Check for walking average heart rate
- [ ] Verify data is from last 7 days
- [ ] Compare with Apple Health app

#### HRV Data
- [ ] Verify HRV (SDNN) data reads successfully
- [ ] Check for reasonable values (20-100 ms)
- [ ] Verify data is from last 7 days
- [ ] Compare with Apple Health app

#### Activity Data
- [ ] Verify step count reads successfully
- [ ] Verify active energy reads successfully
- [ ] Verify exercise minutes read successfully
- [ ] Verify stand hours read successfully
- [ ] Compare with Apple Health app

#### Activity Rings
- [ ] Verify Move ring percentage displays
- [ ] Verify Exercise ring percentage displays
- [ ] Verify Stand ring percentage displays
- [ ] Verify goals display correctly
- [ ] Compare with Apple Watch

#### Workout Data
- [ ] Verify workouts read successfully
- [ ] Check workout type, duration, distance
- [ ] Check heart rate data for workouts
- [ ] Verify energy burned
- [ ] Compare with Apple Health app

### 2.3 Data Sync Testing

#### Initial Sync
- [ ] Verify initial sync triggers after authorization
- [ ] Wait for sync completion (1-2 minutes)
- [ ] Verify activity rings display
- [ ] Check database for synced data:
  ```sql
  SELECT * FROM apple_watch_health_data WHERE user_id = 'test-user-id' ORDER BY data_date DESC LIMIT 7;
  SELECT * FROM apple_watch_workouts WHERE user_id = 'test-user-id' ORDER BY start_time DESC LIMIT 5;
  ```

#### Manual Sync
- [ ] Tap "Sync Now" button
- [ ] Verify loading indicator
- [ ] Wait for sync completion
- [ ] Verify success message
- [ ] Verify data updates

#### Background Sync (APNs)
- [ ] Ensure APNs configured correctly
- [ ] Wait for scheduled sync at 6 AM UTC
- [ ] Verify silent notification sent (check backend logs)
- [ ] Verify app receives notification in background
- [ ] Verify HealthKit data reads in background
- [ ] Verify data uploads to backend
- [ ] Check sync history for background sync

### 2.4 APNs Testing

#### Device Token Registration
- [ ] Verify device token registered on app launch
- [ ] Check backend logs for token registration
- [ ] Verify token saved in database:
  ```sql
  SELECT ios_device_token, ios_push_enabled FROM users WHERE id = 'test-user-id';
  ```

#### Silent Notification Delivery
- [ ] Trigger manual sync from backend
- [ ] Verify APNs notification sent (check logs)
- [ ] Verify notification delivered to device
- [ ] Verify app wakes in background
- [ ] Verify sync completes

#### APNs Error Handling
- [ ] Test with invalid device token
- [ ] Verify backend handles error gracefully
- [ ] Verify push disabled for invalid token
- [ ] Re-register token and verify recovery

### 2.5 Connection Management

#### Disconnect
- [ ] Tap "Disconnect Apple Watch"
- [ ] Confirm disconnection
- [ ] Verify connection status updates
- [ ] Verify historical data remains
- [ ] Check database connection status

#### Reconnect
- [ ] Reconnect Apple Watch
- [ ] Verify HealthKit permissions still granted
- [ ] Verify data syncs correctly
- [ ] Verify historical data preserved

---

## Phase 3: Sleep Number Integration Testing

### 3.1 Authentication Testing

#### Initial Login
- [ ] Open Sleep Number Connect screen
- [ ] Enter Sleep Number email
- [ ] Enter Sleep Number password
- [ ] Tap "Connect" button
- [ ] Verify connection success
- [ ] Verify connection status shows "Connected"

#### Authentication Errors
- [ ] Test with incorrect email (should show error)
- [ ] Test with incorrect password (should show error)
- [ ] Test with network disconnection (should show error)
- [ ] Test with empty fields (should validate)

### 3.2 Data Sync Testing

#### Initial Sync
- [ ] Verify initial sync triggers after connection
- [ ] Wait for sync completion (30-60 seconds)
- [ ] Verify sleep score displays
- [ ] Verify sleep duration displays
- [ ] Check database for synced data:
  ```sql
  SELECT * FROM sleep_number_sleep_data WHERE user_id = 'test-user-id' ORDER BY date DESC LIMIT 7;
  ```

#### Manual Sync
- [ ] Tap "Sync Now" button
- [ ] Verify loading indicator
- [ ] Wait for sync completion
- [ ] Verify success message
- [ ] Verify data updates

#### Automatic Sync (Cron)
- [ ] Wait for scheduled sync at 6 AM UTC
- [ ] Check backend logs for cron execution
- [ ] Verify sync completes successfully
- [ ] Check sync history

### 3.3 Data Quality Testing

#### Sleep Score
- [ ] Verify sleep score is between 0-100
- [ ] Verify score matches Sleep Number app
- [ ] Verify date is correct

#### Sleep Metrics
- [ ] Verify sleep duration is reasonable (0-12 hours)
- [ ] Verify heart rate is reasonable (40-100 bpm)
- [ ] Verify breathing rate is reasonable (10-25 breaths/min)
- [ ] Verify restlessness score is between 0-100
- [ ] Compare all metrics with Sleep Number app

### 3.4 Connection Management

#### Disconnect
- [ ] Tap "Disconnect Sleep Number"
- [ ] Confirm disconnection
- [ ] Verify connection status updates
- [ ] Verify historical data remains
- [ ] Check database connection status

#### Reconnect
- [ ] Reconnect Sleep Number
- [ ] Enter credentials again
- [ ] Verify connection succeeds
- [ ] Verify data syncs correctly

---

## Phase 4: Monitoring & Alerting Testing

### 4.1 Monitoring Endpoints

#### Sync Health Metrics
- [ ] Call `GET /monitoring/sync-health`
- [ ] Verify response includes all three devices
- [ ] Verify metrics are accurate:
  - Total users
  - Active users
  - Success rates (24h, 7d)
  - Average sync duration
  - Consecutive failures count

#### Failing Users
- [ ] Call `GET /monitoring/failing-users`
- [ ] Verify returns users with 3+ consecutive failures
- [ ] Verify includes device type and error message

#### Sync History
- [ ] Call `GET /monitoring/sync-history/oura/test-user-id`
- [ ] Verify returns last 10 syncs
- [ ] Verify includes status, duration, errors

### 4.2 Alert Testing

#### Consecutive Failure Alerts
- [ ] Cause 3 consecutive sync failures for a user
- [ ] Verify alert logged in backend
- [ ] Check `device_sync_alerts` table:
  ```sql
  SELECT * FROM device_sync_alerts ORDER BY alert_sent_at DESC LIMIT 5;
  ```
- [ ] Verify alert severity is "WARNING"

#### Critical Failure Alerts
- [ ] Cause 5 consecutive sync failures
- [ ] Verify critical alert logged
- [ ] Verify alert severity is "CRITICAL"

#### Alert Recovery
- [ ] Fix the issue causing failures
- [ ] Trigger successful sync
- [ ] Verify consecutive failures reset to 0
- [ ] Verify no more alerts sent

### 4.3 Monitoring Cron Job

#### Hourly Check
- [ ] Wait for hourly monitoring cron (or trigger manually)
- [ ] Check backend logs for execution
- [ ] Verify all devices checked
- [ ] Verify alerts sent for failing users

---

## Phase 5: Cross-Device Testing

### 5.1 Multiple Device Connection

#### Connect All Three Devices
- [ ] Connect Oura Ring
- [ ] Connect Apple Watch
- [ ] Connect Sleep Number
- [ ] Verify all show "Connected" status
- [ ] Verify all sync independently

#### Sync All Devices
- [ ] Trigger manual sync for all devices
- [ ] Verify all complete successfully
- [ ] Verify no conflicts or errors
- [ ] Check database for data from all devices

### 5.2 Data Consistency

#### Compare Overlapping Data
- [ ] Compare sleep data from Oura and Sleep Number
- [ ] Compare heart rate from Oura and Apple Watch
- [ ] Verify both devices' data is stored
- [ ] Verify no data overwrites or conflicts

---

## Phase 6: Performance Testing

### 6.1 Sync Performance

#### Oura Sync
- [ ] Measure sync duration for 30 days of data
- [ ] Target: < 60 seconds
- [ ] Verify no timeouts

#### Apple Watch Sync
- [ ] Measure sync duration for 7 days of data
- [ ] Target: < 90 seconds
- [ ] Verify no timeouts

#### Sleep Number Sync
- [ ] Measure sync duration for 30 days of data
- [ ] Target: < 60 seconds
- [ ] Verify no timeouts

### 6.2 API Response Times

#### Connection Endpoints
- [ ] Measure response time for connect endpoints
- [ ] Target: < 5 seconds
- [ ] Verify no 500 errors

#### Data Retrieval Endpoints
- [ ] Measure response time for data endpoints
- [ ] Target: < 2 seconds
- [ ] Verify no 500 errors

---

## Phase 7: Error Recovery Testing

### 7.1 Network Interruption

#### During Sync
- [ ] Start sync
- [ ] Disconnect network mid-sync
- [ ] Verify error handling
- [ ] Reconnect network
- [ ] Retry sync
- [ ] Verify recovery

### 7.2 Token Expiration

#### Oura Token Expiration
- [ ] Wait for token expiration (or manually expire)
- [ ] Trigger sync
- [ ] Verify automatic token refresh
- [ ] Verify sync completes

### 7.3 API Rate Limiting

#### Rapid Sync Requests
- [ ] Trigger multiple rapid syncs
- [ ] Verify rate limiting handling
- [ ] Verify appropriate error messages
- [ ] Verify recovery after rate limit expires

---

## Phase 8: Security Testing

### 8.1 Credential Storage

#### Encryption Verification
- [ ] Check database for encrypted tokens
- [ ] Verify tokens are not plaintext
- [ ] Verify encryption IV is unique per token

#### Credential Exposure
- [ ] Check backend logs for credentials
- [ ] Verify no passwords logged
- [ ] Verify no tokens logged
- [ ] Verify API responses don't include credentials

### 8.2 API Security

#### Authentication
- [ ] Test endpoints without authentication
- [ ] Verify 401 Unauthorized responses
- [ ] Test with invalid user IDs
- [ ] Verify proper authorization checks

---

## Phase 9: User Experience Testing

### 9.1 Loading States

#### All Screens
- [ ] Verify loading indicators display during operations
- [ ] Verify loading indicators disappear on completion
- [ ] Verify no frozen UI states

### 9.2 Error Messages

#### User-Friendly Errors
- [ ] Verify error messages are clear and actionable
- [ ] Verify no technical jargon in user-facing errors
- [ ] Verify errors suggest next steps

### 9.3 Success Feedback

#### Confirmation Messages
- [ ] Verify success messages display after operations
- [ ] Verify success messages are clear
- [ ] Verify success messages auto-dismiss appropriately

---

## Phase 10: Regression Testing

### 10.1 Existing Functionality

#### App Navigation
- [ ] Verify all navigation still works
- [ ] Verify no broken links
- [ ] Verify back buttons work

#### Other Features
- [ ] Verify other app features unaffected
- [ ] Verify no performance degradation
- [ ] Verify no new crashes

---

## Test Results Summary

### Pass/Fail Criteria

**PASS Requirements:**
- All critical tests pass (connection, sync, data quality)
- No critical bugs
- Performance within targets
- Security tests pass

**FAIL Criteria:**
- Any critical test fails
- Critical bugs found
- Performance significantly below targets
- Security vulnerabilities found

### Test Execution Log

| Test Phase | Status | Notes | Date |
|------------|--------|-------|------|
| Oura OAuth | ⬜ | | |
| Oura Sync | ⬜ | | |
| Apple Watch Auth | ⬜ | | |
| Apple Watch Sync | ⬜ | | |
| APNs | ⬜ | | |
| Sleep Number Auth | ⬜ | | |
| Sleep Number Sync | ⬜ | | |
| Monitoring | ⬜ | | |
| Cross-Device | ⬜ | | |
| Performance | ⬜ | | |
| Error Recovery | ⬜ | | |
| Security | ⬜ | | |
| UX | ⬜ | | |
| Regression | ⬜ | | |

### Issues Found

| Issue ID | Severity | Description | Status | Resolution |
|----------|----------|-------------|--------|------------|
| | | | | |

---

## Sign-Off

**Tested By:** ___________________  
**Date:** ___________________  
**Overall Status:** ⬜ PASS / ⬜ FAIL  
**Ready for Production:** ⬜ YES / ⬜ NO  

**Notes:**
