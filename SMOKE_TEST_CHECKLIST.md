# SMOKE TEST CHECKLIST

**Phase 3: Verify Broken User Journeys Fixed**  
**Quick Validation Checklist**  
**Date**: April 16, 2026

---

## Pre-Test Setup

- [ ] Backend server running on `http://localhost:3000`
- [ ] Frontend app running on device/simulator
- [ ] Test user ID available: `_______________`
- [ ] React Native debugger console open

---

## Quick Frontend Tests (5 minutes)

### Navigation Tests

Execute these commands in React Native debugger console:

```javascript
// From Insights Tab
navigation.navigate('AnalyticsDashboard')          // ✅ Should load
navigation.navigate('MetabolicHealthDashboard')    // ✅ Should load
navigation.navigate('ControlTower')                // ✅ Should load
navigation.navigate('HealthDataHub')               // ✅ Should load
navigation.navigate('BaselineProfile')             // ✅ Should load

// From Home Tab
navigation.navigate('NutritionDashboard')          // ✅ Should load
navigation.navigate('MealLog')                     // ✅ Should load
navigation.navigate('NutritionExtraction')         // ✅ Should load
navigation.navigate('AIAssistant')                 // ✅ Should load
navigation.navigate('AIChat')                      // ✅ Should load
```

**Pass Criteria**: All 10 screens load without console errors

- [ ] All 10 screens load successfully
- [ ] No console errors
- [ ] No app crashes

---

## Quick Backend Tests (5 minutes)

### API Endpoint Tests

Replace `{userId}` with your test user ID.

```bash
# Test new routes
curl http://localhost:3000/api/health
curl http://localhost:3000/api/control-tower/overall-health?user_id={userId}
curl http://localhost:3000/api/health-data-hub/status
curl http://localhost:3000/api/baseline/{userId}
curl http://localhost:3000/api/meal-logs/{userId}
curl http://localhost:3000/api/nutrition/entries/{userId}
curl http://localhost:3000/api/bloodwork-recommendations/{userId}
curl http://localhost:3000/api/bloodwork-trends/{userId}
curl http://localhost:3000/api/adherence/{userId}/today
curl http://localhost:3000/api/autonomous/{userId}/today
```

**Pass Criteria**: All endpoints return 200 OK or 404 (no 500 errors)

- [ ] All endpoints respond (200 or 404)
- [ ] No 500 server errors
- [ ] Responses are valid JSON

---

## Integration Tests (5 minutes)

### End-to-End Flows

**Test 1: Analytics Journey**
1. Navigate to `AnalyticsDashboard`
2. Screen should attempt to fetch from `/api/analytics`
3. Screen should display (data or empty state)

- [ ] Screen loads
- [ ] API called
- [ ] Data displayed or empty state shown

**Test 2: Nutrition Journey**
1. Navigate to `NutritionDashboard`
2. Screen should attempt to fetch nutrition data
3. Navigate to `MealLog`
4. Screen should display meal log form

- [ ] Dashboard loads
- [ ] API called
- [ ] Meal log accessible

**Test 3: Control Tower Journey**
1. Navigate to `ControlTower`
2. Screen should fetch from `/api/control-tower/overall-health`
3. Screen should display overall health

- [ ] Screen loads
- [ ] API called
- [ ] Data displayed or empty state shown

---

## Regression Tests (2 minutes)

### Existing Functionality

**Test existing screens still work**:
1. Navigate to Home tab → ModernHomeScreen
2. Navigate to Insights tab → InsightsHomeScreen
3. Navigate to existing screens (Bloodwork, Workouts, etc.)

- [ ] Home tab works
- [ ] Insights tab works
- [ ] Existing screens load
- [ ] No new console errors

---

## Final Checklist

- [ ] All 10 new screens accessible
- [ ] All 9 new backend routes respond
- [ ] No console errors
- [ ] No server errors
- [ ] Existing functionality intact
- [ ] App stable (no crashes)

---

## Status

**Date Tested**: _______________  
**Tester**: _______________  
**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________

---

## If Tests Fail

**Frontend Issues**:
- Check TypeScript compilation: `npx tsc --noEmit`
- Check for import errors
- Verify navigation types match

**Backend Issues**:
- Check server logs for errors
- Verify routes registered in `server/src/routes/index.ts`
- Verify controllers exist

**Integration Issues**:
- Check network tab for API calls
- Verify API base URL correct
- Check for CORS issues

---

## Known Issues

1. **Metabolic Health**: Backend route not registered (metabolicEngineRoutes)
2. **Empty States**: Screens may show empty if no data (acceptable)
3. **No UI Entry Points**: Screens accessible via console only (future enhancement)

---

## Production Deployment Readiness

After passing all smoke tests:

- [ ] All tests pass
- [ ] No critical issues
- [ ] Known issues documented
- [ ] Rollback plan ready

**Ready for Production**: [ ] YES [ ] NO
