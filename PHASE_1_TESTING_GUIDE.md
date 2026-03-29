# Phase 1 Testing & Validation Guide

**Date**: March 29, 2026  
**Purpose**: Comprehensive testing of all Phase 1 features  
**Estimated Time**: 1-2 hours

---

## Pre-Testing Setup

### 1. Start the Server

```bash
cd c:\Users\cn108578\CascadeProjects\health\server
npm run dev
```

**Expected Output**:
```
Server is running on port 3020
Health API available at http://localhost:3020/health
```

**Verify**:
- Server starts without errors
- Port 3020 is accessible
- No TypeScript compilation errors

---

### 2. Start the Mobile App

```bash
cd c:\Users\cn108578\CascadeProjects\health\mobile
npm start
```

**Expected Output**:
```
Metro bundler running
Expo DevTools running at http://localhost:19002
```

**Verify**:
- Metro bundler starts
- No compilation errors
- App loads in simulator/device

---

### 3. Verify Environment Variables

**Check**: `mobile/.env` exists with:
```
EXPO_PUBLIC_API_URL=http://localhost:3020
```

**If missing**: Copy from `.env.example` and update

---

## Test Scenarios

### Test 1: Bottom Tab Navigation ✅

**Objective**: Verify all 5 tabs are functional

**Steps**:
1. Open the mobile app
2. Tap each tab in the bottom navigation
3. Verify each screen loads

**Expected Results**:
- ✅ Dashboard tab shows DashboardV13Screen
- ✅ Health Data tab shows HealthDataHubScreen
- ✅ Agent tab shows AgentInterviewScreen
- ✅ Trends tab shows TrendsScreen
- ✅ Settings tab shows SettingsScreen
- ✅ No "Coming Soon" placeholders
- ✅ Tab icons display correctly
- ✅ Active tab highlighted in blue

**Pass Criteria**: All 5 tabs functional, no placeholders

---

### Test 2: Dashboard V13 ✅

**Objective**: Verify dashboard displays all 14 sections

**Steps**:
1. Navigate to Dashboard tab
2. Pull down to refresh
3. Scroll through all sections

**Expected Results**:
- ✅ Overall Health section (Control Tower)
- ✅ Recovery section
- ✅ Stress/CNS section
- ✅ Workout section
- ✅ Supplements section
- ✅ Joint/Injury section
- ✅ Adherence section
- ✅ Bloodwork section (if data exists)
- ✅ Cardiovascular section
- ✅ Sexual Health section
- ✅ Nutrition section
- ✅ Body Composition section
- ✅ Trends & Insights section
- ✅ Today's Recommendations section

**Pass Criteria**: All 14 sections visible, data loads from APIs

---

### Test 3: Health Data Hub ✅

**Objective**: Verify all 6 upload sections work

**Steps**:
1. Navigate to Health Data tab
2. Check all 6 sections are present
3. Try expanding a section

**Expected Results**:
- ✅ Bloodwork Results section
- ✅ Baseline Health Profile section
- ✅ Workout Schedule section
- ✅ Supplement Stack section
- ✅ Body Composition section
- ✅ Nutrition Logs section
- ✅ Sections expand/collapse
- ✅ Upload buttons visible

**Pass Criteria**: All 6 sections present and interactive

---

### Test 4: Agent Interview ✅

**Objective**: Complete a full interview flow

**Steps**:
1. Navigate to Agent tab
2. Wait for interview to load
3. Complete Step 1 (primary question)
4. Complete Step 2 (follow-up if exists)
5. Complete Step 3 (health metrics)
6. Submit interview

**Expected Results**:
- ✅ Interview loads from API
- ✅ Context card shows focus areas
- ✅ Progress bar updates
- ✅ Step 1: Text input works
- ✅ Step 2: Follow-up displays (if available)
- ✅ Step 3: All metric inputs work
- ✅ Scale buttons (1-5) work
- ✅ Submit button sends data
- ✅ Success alert appears
- ✅ Completion state shows

**Pass Criteria**: Complete interview submission successful

---

### Test 5: Trends & History ✅

**Objective**: Verify trend visualizations work

**Steps**:
1. Navigate to Trends tab
2. Check each trend category
3. Pull to refresh

**Expected Results**:
- ✅ Overall Health trends display
- ✅ Bloodwork trends display (if data)
- ✅ Recovery trends display
- ✅ Stress trends display
- ✅ Adherence trends display
- ✅ Mini bar charts render
- ✅ Data lists show recent entries
- ✅ Empty states show when no data
- ✅ Pull-to-refresh works

**Pass Criteria**: All trend categories functional, charts render

---

### Test 6: Settings ✅

**Objective**: Verify settings screen displays

**Steps**:
1. Navigate to Settings tab
2. Check all sections present

**Expected Results**:
- ✅ Account section
- ✅ Notifications section
- ✅ Data & Privacy section
- ✅ About section
- ✅ Version info displays
- ✅ User ID shows

**Pass Criteria**: All settings sections visible

---

## API Integration Tests

### Test 7: Control Tower API ✅

**Objective**: Verify Control Tower aggregation works

**Test Command**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3020/control-tower/overall-health?user_id=default-user" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "overallScore": 75,
    "overallStatus": "Stable",
    "components": {
      "cv": { "score": 72, "status": "Stable" },
      "rec": { "score": 65, "status": "Moderate" },
      "met": { "score": 80, "status": "Optimal" },
      "perf": { "score": 78, "status": "Stable" },
      "sh": { "score": 70, "status": "Stable" }
    }
  }
}
```

**Pass Criteria**: API returns aggregated scores

---

### Test 8: Recovery Engine API ✅

**Test Command**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3020/recovery/default-user/today" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "recoveryScore": 65,
    "recoveryStatus": "Moderate",
    "readinessClassification": "Moderate",
    "recommendation": {...}
  }
}
```

**Pass Criteria**: API returns recovery data

---

### Test 9: Stress Engine API ✅

**Test Command**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3020/stress/default-user/today" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "stressLevel": 3,
    "stressStatus": "Moderate",
    "cnsStatus": "Moderate",
    "recommendation": {...}
  }
}
```

**Pass Criteria**: API returns stress data

---

### Test 10: Adherence Engine API ✅

**Test Command**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3020/adherence/default-user/today" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "adherenceScore": 65,
    "breakdown": {
      "workout": 70,
      "nutrition": 75,
      "supplements": 50
    }
  }
}
```

**Pass Criteria**: API returns adherence data

---

### Test 11: Agent Interview API ✅

**Test Command**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3020/agent/interview/today/default-user" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "session-id",
    "primaryPrompt": "How are you feeling today?",
    "followUpPrompt": "...",
    "status": "pending",
    "focusComponents": ["Recovery", "Stress"]
  }
}
```

**Pass Criteria**: API returns interview session

---

## End-to-End User Journey Test

### Test 12: Complete User Flow ✅

**Objective**: Test the complete user experience

**Scenario**: New user's first day

**Steps**:

1. **Morning: Upload Bloodwork**
   - Navigate to Health Data tab
   - Expand Bloodwork Results section
   - Upload a bloodwork document
   - Verify processing status

2. **Midday: Complete Interview**
   - Navigate to Agent tab
   - Answer primary question
   - Answer follow-up question
   - Fill in health metrics
   - Submit interview

3. **Afternoon: Check Dashboard**
   - Navigate to Dashboard tab
   - Pull to refresh
   - Verify Overall Health score updated
   - Verify Recovery section shows data
   - Verify Stress section shows data
   - Check Today's Recommendations

4. **Evening: Review Trends**
   - Navigate to Trends tab
   - Check Overall Health trends
   - Check Recovery trends
   - Check Stress trends
   - Verify data from interview appears

5. **Night: Adjust Settings**
   - Navigate to Settings tab
   - Review account info
   - Check app version

**Expected Results**:
- ✅ Complete flow works without errors
- ✅ Data flows between screens
- ✅ Dashboard updates with interview data
- ✅ Trends show historical data
- ✅ All navigation smooth

**Pass Criteria**: Complete user journey successful

---

## Performance Tests

### Test 13: Dashboard Load Time ✅

**Steps**:
1. Navigate to Dashboard
2. Time how long it takes to load
3. Pull to refresh and time again

**Expected Results**:
- ✅ Initial load < 3 seconds
- ✅ Refresh < 2 seconds
- ✅ No lag or freezing
- ✅ Smooth scrolling

**Pass Criteria**: Dashboard loads quickly and smoothly

---

### Test 14: Tab Switching Performance ✅

**Steps**:
1. Rapidly switch between all 5 tabs
2. Observe transitions

**Expected Results**:
- ✅ Instant tab switching
- ✅ No lag between tabs
- ✅ Smooth animations
- ✅ No crashes

**Pass Criteria**: Tab switching is smooth and instant

---

## Error Handling Tests

### Test 15: Network Error Handling ✅

**Steps**:
1. Stop the server
2. Navigate to Dashboard
3. Pull to refresh
4. Observe error handling

**Expected Results**:
- ✅ Error message displays
- ✅ App doesn't crash
- ✅ Retry option available
- ✅ Graceful degradation

**Pass Criteria**: App handles network errors gracefully

---

### Test 16: Empty State Handling ✅

**Steps**:
1. Navigate to Trends tab
2. Check Bloodwork trends (if no data uploaded)

**Expected Results**:
- ✅ Empty state displays
- ✅ Helpful message shown
- ✅ Call-to-action text
- ✅ No crashes

**Pass Criteria**: Empty states display correctly

---

## Visual/UI Tests

### Test 17: Responsive Layout ✅

**Steps**:
1. Test on different screen sizes (if possible)
2. Rotate device (portrait/landscape)
3. Check all screens

**Expected Results**:
- ✅ Layout adapts to screen size
- ✅ No text cutoff
- ✅ Buttons accessible
- ✅ Scrolling works

**Pass Criteria**: UI responsive on all screens

---

### Test 18: Color Coding ✅

**Steps**:
1. Check Dashboard status indicators
2. Check Trends status colors
3. Verify consistency

**Expected Results**:
- ✅ Optimal = Green
- ✅ Stable = Blue
- ✅ Moderate = Orange
- ✅ At Risk = Red
- ✅ Consistent across screens

**Pass Criteria**: Color coding consistent and correct

---

## Data Validation Tests

### Test 19: Data Persistence ✅

**Steps**:
1. Complete an interview
2. Close and reopen the app
3. Check if data persists

**Expected Results**:
- ✅ Interview marked as completed
- ✅ Dashboard shows updated data
- ✅ Trends include new data point
- ✅ No data loss

**Pass Criteria**: Data persists across app restarts

---

### Test 20: Real-time Updates ✅

**Steps**:
1. Submit an interview
2. Immediately check Dashboard
3. Verify data updates

**Expected Results**:
- ✅ Dashboard reflects new data
- ✅ Scores update
- ✅ Recommendations update
- ✅ No stale data

**Pass Criteria**: Dashboard updates in real-time

---

## Test Results Summary

### Checklist

**Navigation** (6 tests):
- [ ] Test 1: Bottom Tab Navigation
- [ ] Test 14: Tab Switching Performance
- [ ] Test 17: Responsive Layout

**Dashboard** (4 tests):
- [ ] Test 2: Dashboard V13
- [ ] Test 13: Dashboard Load Time
- [ ] Test 18: Color Coding
- [ ] Test 20: Real-time Updates

**Health Data Hub** (1 test):
- [ ] Test 3: Health Data Hub

**Agent Interview** (2 tests):
- [ ] Test 4: Agent Interview
- [ ] Test 11: Agent Interview API

**Trends** (2 tests):
- [ ] Test 5: Trends & History
- [ ] Test 16: Empty State Handling

**Settings** (1 test):
- [ ] Test 6: Settings

**APIs** (4 tests):
- [ ] Test 7: Control Tower API
- [ ] Test 8: Recovery Engine API
- [ ] Test 9: Stress Engine API
- [ ] Test 10: Adherence Engine API

**End-to-End** (1 test):
- [ ] Test 12: Complete User Flow

**Error Handling** (2 tests):
- [ ] Test 15: Network Error Handling
- [ ] Test 19: Data Persistence

---

## Known Issues to Watch For

### Potential Issues

1. **TypeScript Lint Errors**
   - Environment-related (React/React Native types)
   - Don't affect runtime
   - Can be ignored for now

2. **Control Tower API**
   - Requires server restart to load new routes
   - If 404, restart server

3. **Mock Data**
   - Control Tower uses calculated scores
   - Workout Engine uses mock data
   - Expected behavior

4. **Empty States**
   - Bloodwork trends empty until data uploaded
   - Normal for first-time users

---

## Success Criteria

### Phase 1 is validated if:

**Critical (Must Pass)**:
- ✅ All 5 tabs functional
- ✅ Dashboard displays all 14 sections
- ✅ Agent interview completes successfully
- ✅ APIs return data
- ✅ No crashes or critical errors

**Important (Should Pass)**:
- ✅ Trends visualize data correctly
- ✅ Navigation is smooth
- ✅ Error handling works
- ✅ Data persists

**Nice to Have (Can Improve)**:
- Performance optimizations
- UI polish
- Additional features

---

## Next Steps After Testing

### If All Tests Pass ✅
- Phase 1 is production-ready
- Can proceed to Phase 2
- Can demo to stakeholders

### If Issues Found ⚠️
1. Document all issues
2. Prioritize by severity
3. Fix critical issues first
4. Re-test after fixes

### Recommended Follow-Up
1. Create test data for all engines
2. Test with multiple users
3. Performance profiling
4. User feedback session

---

## Testing Tips

1. **Test systematically** - Follow the order
2. **Document issues** - Note everything you find
3. **Take screenshots** - Visual proof of issues
4. **Test edge cases** - Empty data, errors, etc.
5. **Be thorough** - Don't skip tests

---

**Ready to start testing? Begin with Test 1 and work through systematically!**
