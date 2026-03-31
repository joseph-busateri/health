# Comprehensive Testing Guide - Health Intelligence App

## Table of Contents
1. [Backend API Testing](#backend-api-testing)
2. [Mobile UI Testing](#mobile-ui-testing)
3. [Database Testing](#database-testing)
4. [Integration Testing](#integration-testing)
5. [Automated Test Scripts](#automated-test-scripts)

---

## Backend API Testing

### Environment Setup
- **Production Backend:** `https://health-production-2244.up.railway.app`
- **Local Backend:** `http://localhost:3002`
- **Database:** Supabase at `https://awzovfxfzsburnlkqjcx.supabase.co`

### 1. Health Check Endpoints

#### Test: Server Status
```powershell
# Test server is running
Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/" -Method GET

# Expected Response:
# { "message": "Health API Server is running!" }
```

---

### 2. Sleep Number Integration Tests

#### Test 2.1: Connect Sleep Number Account
```powershell
$body = @{
    username = "your-sleep-number-email@example.com"
    password = "your-password"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/sleep-number/test-user-123/connect" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Expected Success Response:
# {
#   "success": true,
#   "message": "Sleep Number connected successfully",
#   "connectionId": "uuid",
#   "bedId": "bed-id"
# }

# Expected Failure Response:
# {
#   "success": false,
#   "error": "Failed to authenticate with Sleep Number: ..."
# }
```

#### Test 2.2: Get Sync Statistics
```powershell
Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/sleep-number/test-user-123/sync/stats?days=30" `
    -Method GET

# Expected Response:
# {
#   "success": true,
#   "statistics": {
#     "totalSyncs": 10,
#     "successfulSyncs": 9,
#     "failedSyncs": 1,
#     "lastSyncDate": "2026-03-31T10:00:00Z",
#     "totalSessionsSynced": 30
#   }
# }
```

#### Test 2.3: Manual Sync Trigger
```powershell
Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/sleep-number/test-user-123/sync" `
    -Method POST `
    -ContentType "application/json"

# Expected Response:
# {
#   "success": true,
#   "message": "Sync completed",
#   "sessionsFetched": 7,
#   "sessionsSaved": 5,
#   "sessionsUpdated": 2
# }
```

#### Test 2.4: Get Latest Sleep Session
```powershell
Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/sleep-number/test-user-123/sleep/latest" `
    -Method GET

# Expected Response:
# {
#   "success": true,
#   "session": {
#     "date": "2026-03-30",
#     "sleepIQ": 85,
#     "totalSleepTime": 480,
#     "deepSleep": 120,
#     "lightSleep": 240,
#     "remSleep": 90,
#     "awakeTime": 30
#   }
# }
```

#### Test 2.5: Get Sleep Trends
```powershell
Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/sleep-number/test-user-123/trend?days=7" `
    -Method GET

# Expected Response:
# {
#   "success": true,
#   "trends": [
#     { "date": "2026-03-30", "sleepIQ": 85, "totalSleepTime": 480 },
#     { "date": "2026-03-29", "sleepIQ": 82, "totalSleepTime": 465 }
#   ]
# }
```

#### Test 2.6: Upload Sleep Number CSV
```powershell
$csvContent = Get-Content "path/to/sleep-data.csv" -Raw
$body = @{
    fileContent = $csvContent
    fileType = "csv"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/sleep-number/test-user-123/upload" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Expected Response:
# {
#   "success": true,
#   "sessionCount": 30,
#   "sessionIds": ["id1", "id2", ...]
# }
```

#### Test 2.7: Disconnect Sleep Number Account
```powershell
Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/sleep-number/test-user-123/disconnect" `
    -Method POST `
    -ContentType "application/json"

# Expected Response:
# {
#   "success": true,
#   "message": "Sleep Number disconnected"
# }
```

---

### 3. Health Data Integration Tests

#### Test 3.1: Sync Health Data
```powershell
$healthData = @{
    steps = @(
        @{ date = "2026-03-30"; value = 8500; source = "Apple Watch" }
        @{ date = "2026-03-29"; value = 7200; source = "Apple Watch" }
    )
    heartRate = @(
        @{ timestamp = "2026-03-30T14:30:00Z"; value = 72; source = "Apple Watch" }
    )
    sleep = @(
        @{ date = "2026-03-30"; duration = 480; quality = "good"; source = "Apple Watch" }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/api/health-data/test-user-123/sync" `
    -Method POST `
    -Body $healthData `
    -ContentType "application/json"

# Expected Response:
# {
#   "success": true,
#   "synced": {
#     "steps": 2,
#     "heartRate": 1,
#     "sleep": 1
#   }
# }
```

#### Test 3.2: Get Health Summary
```powershell
Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/api/health-data/test-user-123/summary?startDate=2026-03-01&endDate=2026-03-31" `
    -Method GET

# Expected Response:
# {
#   "success": true,
#   "summary": {
#     "totalSteps": 245000,
#     "avgHeartRate": 68,
#     "totalSleepHours": 224,
#     "avgSleepQuality": 85
#   }
# }
```

---

### 4. Voice Interview Tests

#### Test 4.1: Start Voice Interview
```powershell
$body = @{
    userId = "test-user-123"
    interviewType = "daily_checkin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/api/interview/start" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Expected Response:
# {
#   "success": true,
#   "sessionId": "session-uuid",
#   "firstQuestion": "How are you feeling today?"
# }
```

#### Test 4.2: Process Voice Response
```powershell
# Note: This requires actual audio file
$audioBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("path/to/audio.mp3"))
$body = @{
    sessionId = "session-uuid"
    audioData = $audioBase64
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/api/interview/process-audio" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Expected Response:
# {
#   "success": true,
#   "transcription": "I'm feeling great today",
#   "nextQuestion": "How did you sleep last night?",
#   "isComplete": false
# }
```

---

### 5. Daily Log Tests

#### Test 5.1: Create Daily Log
```powershell
$body = @{
    userId = "test-user-123"
    date = "2026-03-30"
    mood = "good"
    energy = 8
    notes = "Felt productive today"
    symptoms = @("headache")
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/api/daily-logs" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Expected Response:
# {
#   "success": true,
#   "logId": "log-uuid"
# }
```

#### Test 5.2: Get Daily Logs
```powershell
Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/api/daily-logs/test-user-123?startDate=2026-03-01&endDate=2026-03-31" `
    -Method GET

# Expected Response:
# {
#   "success": true,
#   "logs": [
#     { "date": "2026-03-30", "mood": "good", "energy": 8 },
#     { "date": "2026-03-29", "mood": "fair", "energy": 6 }
#   ]
# }
```

---

## Mobile UI Testing

### Prerequisites
- Expo Go app installed on iPhone
- Mobile app connected to Railway backend
- Test user account created

### 1. Navigation Testing

#### Test 1.1: Bottom Tab Navigation
**Steps:**
1. Open app in Expo Go
2. Tap each bottom tab: Home, Journal, Insights, Profile
3. Verify each screen loads without errors
4. Verify tab icons highlight correctly

**Expected Result:**
- All tabs navigate successfully
- No white screens or crashes
- Active tab is visually indicated

#### Test 1.2: Stack Navigation
**Steps:**
1. From Home, tap "Sleep Number i10"
2. Verify Sleep Number Connect screen opens
3. Tap back button
4. Verify returns to Home screen

**Expected Result:**
- Navigation flows smoothly
- Back button works correctly
- No navigation stack errors

---

### 2. Sleep Number Integration UI Tests

#### Test 2.1: Sleep Number Connection Flow
**Steps:**
1. Navigate to Sleep Number Connect screen
2. Enter valid Sleep Number credentials
3. Tap "Connect Account"
4. Wait for connection (up to 30 seconds)
5. Verify success message appears

**Expected Result:**
- Loading indicator shows during connection
- Success message: "Connected successfully"
- Connection status updates to "Connected"
- Bed ID is displayed

**Error Cases to Test:**
- Invalid credentials → Shows error message
- Network timeout → Shows timeout message
- Empty fields → Shows validation error

#### Test 2.2: Sleep Number Data Display
**Steps:**
1. After connecting, tap "View Sleep Data"
2. Verify latest sleep session displays
3. Check all metrics are shown: SleepIQ, total sleep time, deep/light/REM sleep
4. Scroll through sleep history

**Expected Result:**
- Latest sleep data loads within 3 seconds
- All metrics display correctly
- Charts render properly
- Historical data shows trends

#### Test 2.3: Manual Sync
**Steps:**
1. On Sleep Number screen, tap "Sync Now"
2. Wait for sync to complete
3. Verify new data appears

**Expected Result:**
- Loading indicator during sync
- Success message after sync
- New sleep sessions appear in list
- Sync timestamp updates

#### Test 2.4: CSV Upload
**Steps:**
1. Navigate to Sleep Number Upload screen
2. Tap "Choose File"
3. Select a Sleep Number CSV export
4. Tap "Upload"
5. Wait for processing

**Expected Result:**
- File picker opens
- Selected file name displays
- Upload progress shows
- Success message with session count
- New data appears in sleep history

#### Test 2.5: Disconnect Account
**Steps:**
1. On Sleep Number screen, tap "Disconnect"
2. Confirm disconnection
3. Verify connection status updates

**Expected Result:**
- Confirmation dialog appears
- After confirming, status shows "Not Connected"
- Sleep data remains visible (historical)
- Can reconnect again

---

### 3. Voice Interview UI Tests

#### Test 3.1: Start Voice Interview
**Steps:**
1. Navigate to Voice Interview screen
2. Grant microphone permissions (first time)
3. Tap "Start Interview"
4. Verify first question appears

**Expected Result:**
- Microphone permission prompt (first time only)
- Interview starts immediately
- First question displays clearly
- Audio playback of question (if enabled)

#### Test 3.2: Record Response
**Steps:**
1. During interview, tap and hold "Record" button
2. Speak response (5-10 seconds)
3. Release button
4. Wait for transcription

**Expected Result:**
- Recording indicator shows while holding
- Audio waveform animates
- Transcription appears within 2-3 seconds
- Next question loads automatically

#### Test 3.3: Complete Interview
**Steps:**
1. Answer all interview questions
2. Verify completion screen
3. Check summary of responses

**Expected Result:**
- Progress indicator shows throughout
- Completion message displays
- Summary shows all Q&A pairs
- Option to save or review

#### Test 3.4: Pause/Resume Interview
**Steps:**
1. Start interview
2. Answer first question
3. Tap "Pause"
4. Close app
5. Reopen app
6. Navigate back to interview
7. Verify can resume

**Expected Result:**
- Pause button works
- Interview state persists
- Can resume from last question
- Previous answers are saved

---

### 4. Hybrid Interview UI Tests

#### Test 4.1: Text Input Mode
**Steps:**
1. Navigate to Hybrid Interview screen
2. Select "Type Response" mode
3. Type answer to question
4. Tap "Submit"

**Expected Result:**
- Keyboard appears
- Text input is smooth
- Submit button enables when text entered
- Next question loads

#### Test 4.2: Voice Input Mode
**Steps:**
1. In Hybrid Interview, select "Voice Response"
2. Record answer
3. Verify transcription
4. Edit transcription if needed
5. Submit

**Expected Result:**
- Mode switches smoothly
- Voice recording works
- Transcription is editable
- Can switch back to typing

#### Test 4.3: Mixed Mode Interview
**Steps:**
1. Answer Q1 with voice
2. Answer Q2 with text
3. Answer Q3 with voice
4. Complete interview

**Expected Result:**
- Can freely switch between modes
- All responses are saved correctly
- Summary shows all answers regardless of input method

---

### 5. Health Data Sync UI Tests

#### Test 5.1: Manual Health Data Sync
**Steps:**
1. Navigate to Health Data screen
2. Tap "Sync Now"
3. Grant HealthKit permissions (iOS)
4. Wait for sync to complete

**Expected Result:**
- Permission prompt appears (first time)
- Sync progress indicator shows
- Success message with data counts
- Dashboard updates with new data

#### Test 5.2: View Health Metrics
**Steps:**
1. On Dashboard, view health metrics cards
2. Tap on Steps card
3. View detailed steps history
4. Check chart displays correctly

**Expected Result:**
- All metric cards display current values
- Tapping card opens detail view
- Charts render smoothly
- Data is accurate and up-to-date

#### Test 5.3: Automatic Background Sync
**Steps:**
1. Enable automatic sync in settings
2. Close app
3. Wait 24 hours
4. Reopen app
5. Check for new data

**Expected Result:**
- Background sync runs automatically
- New data appears without manual sync
- Sync timestamp shows recent update

---

### 6. Daily Log UI Tests

#### Test 6.1: Create Daily Log
**Steps:**
1. Navigate to Journal/Daily Log screen
2. Tap "New Entry"
3. Select mood (emoji or slider)
4. Rate energy level (1-10)
5. Add notes
6. Add symptoms (if any)
7. Tap "Save"

**Expected Result:**
- All input fields work smoothly
- Mood selector is intuitive
- Energy slider responds well
- Notes text area expands
- Save button creates log entry
- Returns to log list

#### Test 6.2: View Daily Log History
**Steps:**
1. On Journal screen, view list of logs
2. Scroll through history
3. Tap on a log entry
4. View full details

**Expected Result:**
- Logs display in reverse chronological order
- Infinite scroll loads more logs
- Tapping opens detail view
- All saved data displays correctly

#### Test 6.3: Edit Daily Log
**Steps:**
1. Open existing log entry
2. Tap "Edit"
3. Modify mood, energy, or notes
4. Tap "Save"
5. Verify changes persist

**Expected Result:**
- Edit mode enables all fields
- Changes save successfully
- Updated timestamp shows
- Returns to detail view

#### Test 6.4: Delete Daily Log
**Steps:**
1. Open log entry
2. Tap "Delete"
3. Confirm deletion
4. Verify removed from list

**Expected Result:**
- Confirmation dialog appears
- After confirming, log is deleted
- List updates immediately
- Cannot undo (or undo option works)

---

### 7. Insights & Analytics UI Tests

#### Test 7.1: View Sleep Insights
**Steps:**
1. Navigate to Insights screen
2. Tap "Sleep" category
3. View sleep quality trends
4. Check sleep recommendations

**Expected Result:**
- Sleep charts render correctly
- Trends show over time (7/30/90 days)
- Insights are personalized
- Recommendations are actionable

#### Test 7.2: View Activity Insights
**Steps:**
1. On Insights screen, tap "Activity"
2. View steps, exercise, heart rate trends
3. Check goal progress

**Expected Result:**
- Activity charts display
- Multiple metrics shown together
- Goal progress is clear
- Can toggle between metrics

#### Test 7.3: Correlations & Patterns
**Steps:**
1. Navigate to Correlations view
2. View sleep vs mood correlation
3. View exercise vs energy correlation
4. Check AI-generated insights

**Expected Result:**
- Correlation charts are clear
- Patterns are highlighted
- AI insights are relevant
- Can explore different correlations

---

### 8. Profile & Settings UI Tests

#### Test 8.1: Update Profile
**Steps:**
1. Navigate to Profile screen
2. Tap "Edit Profile"
3. Update name, email, or avatar
4. Tap "Save"

**Expected Result:**
- All fields are editable
- Changes save successfully
- Profile updates immediately
- Avatar upload works (if applicable)

#### Test 8.2: Notification Settings
**Steps:**
1. Go to Settings
2. Navigate to Notifications
3. Toggle daily reminder
4. Set reminder time
5. Save settings

**Expected Result:**
- Toggle switches work
- Time picker appears
- Settings persist after closing
- Notifications trigger at set time

#### Test 8.3: Data Export
**Steps:**
1. In Settings, tap "Export Data"
2. Select date range
3. Choose export format (CSV/JSON)
4. Tap "Export"
5. Share or save file

**Expected Result:**
- Date picker works
- Format selection is clear
- Export generates file
- Can share via email/cloud

#### Test 8.4: Account Deletion
**Steps:**
1. In Settings, tap "Delete Account"
2. Read warning message
3. Confirm deletion
4. Verify account is deleted

**Expected Result:**
- Warning message is clear
- Requires confirmation
- Account and data are deleted
- Logged out automatically

---

## Database Testing

### 1. Supabase Direct Testing

#### Test 1.1: Verify Sleep Number Tables
```sql
-- Run in Supabase SQL Editor

-- Check sleep_number_connections table
SELECT * FROM sleep_number_connections 
WHERE user_id = 'test-user-123';

-- Expected: Connection record with encrypted tokens

-- Check sleep_number_sessions table
SELECT * FROM sleep_number_sessions 
WHERE user_id = 'test-user-123' 
ORDER BY session_date DESC 
LIMIT 10;

-- Expected: Recent sleep sessions with all metrics

-- Check sleep_number_sync_history
SELECT * FROM sleep_number_sync_history 
WHERE user_id = 'test-user-123' 
ORDER BY sync_started_at DESC 
LIMIT 5;

-- Expected: Sync history with success/failure status
```

#### Test 1.2: Verify Health Data Tables
```sql
-- Check steps data
SELECT * FROM health_steps 
WHERE user_id = 'test-user-123' 
ORDER BY date DESC 
LIMIT 7;

-- Check heart rate data
SELECT * FROM health_heart_rate 
WHERE user_id = 'test-user-123' 
ORDER BY timestamp DESC 
LIMIT 20;

-- Check sleep data
SELECT * FROM health_sleep 
WHERE user_id = 'test-user-123' 
ORDER BY date DESC 
LIMIT 7;
```

#### Test 1.3: Test Database Functions
```sql
-- Test get_sync_statistics function
SELECT * FROM get_sync_statistics('test-user-123', 30);

-- Expected: Sync statistics for last 30 days

-- Test sleep trend functions
SELECT * FROM get_sleep_trends('test-user-123', 7);

-- Expected: Sleep trends for last 7 days
```

#### Test 1.4: Verify Data Integrity
```sql
-- Check for duplicate sleep sessions
SELECT session_date, COUNT(*) 
FROM sleep_number_sessions 
WHERE user_id = 'test-user-123' 
GROUP BY session_date 
HAVING COUNT(*) > 1;

-- Expected: No duplicates (or handled correctly)

-- Check for missing required fields
SELECT * FROM sleep_number_sessions 
WHERE user_id = 'test-user-123' 
AND (sleep_iq IS NULL OR total_sleep_time IS NULL);

-- Expected: No records with missing critical data
```

---

### 2. Row Level Security (RLS) Testing

#### Test 2.1: Verify RLS Policies
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'sleep_number%';

-- Expected: rowsecurity = true for all tables

-- Test user can only access own data
-- (Run as authenticated user)
SELECT * FROM sleep_number_sessions 
WHERE user_id != auth.uid();

-- Expected: No results (or error)
```

---

## Integration Testing

### 1. End-to-End Sleep Number Flow

**Test Scenario:** New user connects Sleep Number and syncs data

**Steps:**
1. Create new test user in app
2. Navigate to Sleep Number Connect screen
3. Enter Sleep Number credentials
4. Connect account (API call to Railway)
5. Verify connection saved in Supabase
6. Trigger manual sync
7. Verify sleep sessions saved in database
8. View sleep data in mobile app
9. Check insights generated from sleep data

**Verification Points:**
- ✅ API authentication succeeds
- ✅ Connection record created in `sleep_number_connections`
- ✅ Tokens encrypted correctly
- ✅ Sync job queued
- ✅ Sleep sessions fetched from Sleep Number API
- ✅ Sessions saved to `sleep_number_sessions`
- ✅ Sync history recorded
- ✅ Mobile app displays new data
- ✅ Insights update with new sleep data

---

### 2. End-to-End Health Data Sync Flow

**Test Scenario:** User syncs HealthKit data from iPhone

**Steps:**
1. Open app on iPhone
2. Navigate to Health Data screen
3. Tap "Sync Now"
4. Grant HealthKit permissions
5. Wait for sync to complete
6. Verify data in Supabase
7. Check dashboard updates
8. View detailed metrics

**Verification Points:**
- ✅ HealthKit permission granted
- ✅ Data fetched from HealthKit
- ✅ API call to Railway succeeds
- ✅ Data saved to health_* tables
- ✅ Dashboard shows updated metrics
- ✅ Charts render with new data

---

### 3. End-to-End Voice Interview Flow

**Test Scenario:** User completes daily check-in interview

**Steps:**
1. Start voice interview
2. Answer 5 questions via voice
3. Review transcriptions
4. Complete interview
5. Verify responses saved
6. Check insights generated

**Verification Points:**
- ✅ Interview session created
- ✅ Audio recorded successfully
- ✅ Transcription accurate
- ✅ Responses saved to database
- ✅ Interview marked complete
- ✅ Insights generated from responses

---

## Automated Test Scripts

### PowerShell Test Suite

Create `test-api.ps1`:

```powershell
# Health App API Test Suite

$baseUrl = "https://health-production-2244.up.railway.app"
$testUserId = "test-user-" + (Get-Random -Maximum 9999)

Write-Host "=== Health App API Test Suite ===" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host "Test User ID: $testUserId" -ForegroundColor Gray
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method GET
    if ($response.message -eq "Health API Server is running!") {
        Write-Host "✅ PASS: Server is running" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Unexpected response" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Sleep Number Connection (will fail without real credentials)
Write-Host "`nTest 2: Sleep Number Connection..." -ForegroundColor Yellow
try {
    $body = @{
        username = "test@example.com"
        password = "test123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/sleep-number/$testUserId/connect" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "❌ FAIL: Should have failed with invalid credentials" -ForegroundColor Red
} catch {
    if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*authenticate*") {
        Write-Host "✅ PASS: Correctly rejected invalid credentials" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Sleep Number Sync Stats (should return empty for new user)
Write-Host "`nTest 3: Sleep Number Sync Stats..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/sleep-number/$testUserId/sync/stats?days=30" -Method GET
    Write-Host "✅ PASS: Sync stats endpoint accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Health Data Sync
Write-Host "`nTest 4: Health Data Sync..." -ForegroundColor Yellow
try {
    $healthData = @{
        steps = @(
            @{ date = (Get-Date -Format "yyyy-MM-dd"); value = 8500; source = "Test" }
        )
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health-data/$testUserId/sync" `
        -Method POST `
        -Body $healthData `
        -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ PASS: Health data synced successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Sync failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Suite Complete ===" -ForegroundColor Cyan
```

Run with:
```powershell
.\test-api.ps1
```

---

## Test Checklist Summary

### Backend API Tests
- [ ] Server health check
- [ ] Sleep Number connection
- [ ] Sleep Number sync
- [ ] Sleep Number data retrieval
- [ ] Sleep Number CSV upload
- [ ] Health data sync
- [ ] Health data retrieval
- [ ] Voice interview endpoints
- [ ] Daily log CRUD operations
- [ ] Error handling
- [ ] Timeout handling
- [ ] Authentication/authorization

### Mobile UI Tests
- [ ] Navigation (tabs and stack)
- [ ] Sleep Number connection flow
- [ ] Sleep Number data display
- [ ] Sleep Number manual sync
- [ ] Sleep Number CSV upload
- [ ] Sleep Number disconnect
- [ ] Voice interview recording
- [ ] Voice interview completion
- [ ] Hybrid interview modes
- [ ] Health data sync
- [ ] Health metrics display
- [ ] Daily log creation
- [ ] Daily log editing
- [ ] Insights visualization
- [ ] Profile management
- [ ] Settings configuration
- [ ] Notifications
- [ ] Data export

### Database Tests
- [ ] Table structure verification
- [ ] Data integrity checks
- [ ] RLS policy verification
- [ ] Function testing
- [ ] Index performance
- [ ] Duplicate prevention
- [ ] Cascade deletes

### Integration Tests
- [ ] End-to-end Sleep Number flow
- [ ] End-to-end health data flow
- [ ] End-to-end voice interview flow
- [ ] Cross-feature data consistency
- [ ] Background sync functionality

---

## Performance Testing

### Load Testing
```powershell
# Simple load test - 10 concurrent requests
1..10 | ForEach-Object -Parallel {
    Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/" -Method GET
} -ThrottleLimit 10

# Measure response time
Measure-Command {
    Invoke-RestMethod -Uri "https://health-production-2244.up.railway.app/sleep-number/test-user/sync/stats?days=30" -Method GET
}
```

### Expected Performance
- Health check: < 200ms
- Sleep Number connection: < 30s (Sleep Number API dependent)
- Data sync: < 5s for 30 days of data
- Data retrieval: < 1s for typical queries

---

## Troubleshooting Guide

### Common Issues

**Issue:** Sleep Number connection fails with 401
- **Check:** Credentials are correct
- **Check:** Sleep Number account is active
- **Check:** No 2FA or special security on account

**Issue:** Mobile app shows "Network Error"
- **Check:** Railway backend is running
- **Check:** Mobile .env has correct Railway URL
- **Check:** Phone has internet connection

**Issue:** Data not syncing
- **Check:** Supabase connection is active
- **Check:** Environment variables are set
- **Check:** Database tables exist
- **Check:** RLS policies allow access

**Issue:** Voice interview not recording
- **Check:** Microphone permissions granted
- **Check:** OpenAI API key is valid
- **Check:** Audio format is supported

---

## Continuous Testing

### Daily Automated Tests
Set up a scheduled task to run API tests daily:

```powershell
# Create scheduled task (Windows)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\test-api.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 9am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "HealthAppAPITests"
```

### Monitoring
- Set up Railway alerts for errors
- Monitor Supabase performance metrics
- Track API response times
- Monitor mobile app crash reports (via Expo)

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test user data
DELETE FROM sleep_number_connections WHERE user_id LIKE 'test-user-%';
DELETE FROM sleep_number_sessions WHERE user_id LIKE 'test-user-%';
DELETE FROM sleep_number_sync_history WHERE user_id LIKE 'test-user-%';
DELETE FROM health_steps WHERE user_id LIKE 'test-user-%';
DELETE FROM health_heart_rate WHERE user_id LIKE 'test-user-%';
DELETE FROM daily_logs WHERE user_id LIKE 'test-user-%';
```

---

## Next Steps

1. Run through all backend API tests
2. Complete mobile UI testing checklist
3. Verify database integrity
4. Run integration tests
5. Set up automated testing
6. Monitor production usage
7. Iterate based on findings

**Happy Testing! 🧪✅**
