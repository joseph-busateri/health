# Critical Fixes Required - InputDetailsPanel Not Showing

## Root Causes Identified

### 1. SSL Certificate Errors (FIXED IN CODE)
**Problem:** All Supabase connections failing with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`
**Fix Applied:** Added SSL bypass in `server/src/index.ts` for development environment
**Status:** Code fixed, requires server restart

### 2. Mobile App Cache Issue
**Problem:** Mobile app is running old cached code - console logs from my fixes aren't appearing
**Evidence:** 
- Console shows "Recovery data loaded: Object" but NOT "Recovery detailedInputs: ..."
- Console shows NO "Analytics detailedInputs loaded: 8"
**Fix Required:** Clear mobile app cache and rebuild

### 3. InputDetailsPanel Positioning (FIXED IN CODE)
**Problem:** Panels were in wrong locations
**Fixes Applied:**
- **Recovery Dashboard:** Moved InputDetailsPanel from Deload tab to Overview tab (inside ScrollView)
- **Analytics Dashboard:** Moved InputDetailsPanel inside ScrollView (was outside, off-screen)
**Status:** Code fixed, requires mobile app rebuild

### 4. Metabolic V2 Route 404 Error
**Problem:** Server returning 404 for `/metabolic/v2/:userId/today`
**Possible Cause:** Server crashed or running old compiled code
**Fix Required:** Restart server with `npm run dev`

## Step-by-Step Fix Instructions

### Step 1: Stop All Running Processes
```bash
# Stop the server (Ctrl+C in server terminal)
# Stop the mobile app (Ctrl+C in mobile terminal)
```

### Step 2: Restart Server
```bash
cd c:\Users\cn108578\CascadeProjects\health\server
npm run dev
```
**Wait for:** "Server listening on port 3000" message

### Step 3: Clear Mobile Cache and Restart
```bash
cd c:\Users\cn108578\CascadeProjects\health\mobile
# Clear cache
npx expo start --clear

# OR if that doesn't work:
rm -rf node_modules/.cache
rm -rf .expo
npx expo start
```

### Step 4: Hard Refresh Browser
- Open browser DevTools (F12)
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"
- OR press Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

## Expected Results After Fix

### Recovery Dashboard
- Navigate to Recovery Dashboard
- Click "Overview" tab (default)
- **Scroll down** past the component scores and key factors
- **Should see:** "Recovery Inputs" panel (expanded by default)
- **Will show:** 8 inputs, all marked as "No Data" (red badges) because device data is missing

### Analytics/Performance Dashboard  
- Navigate to Analytics Dashboard
- Select any tab (Insights, Correlations, Trends, Goals)
- **Scroll to bottom** of content
- **Should see:** "Performance Inputs" panel (expanded by default)
- **Will show:** 8 mock inputs (6 "Real Data" in green, 2 "Calculated" in blue)

### Console Logs to Verify
After refresh, you should see in browser console:
```
Recovery data received: { ... }
Recovery detailedInputs: [array of 8 inputs]
Analytics detailedInputs loaded: 8
```

## Files Changed

### Server
- `c:\Users\cn108578\CascadeProjects\health\server\src\index.ts`
  - Added SSL certificate bypass for development

### Mobile
- `c:\Users\cn108578\CascadeProjects\health\mobile\src\screens\RecoveryDashboardScreen.tsx`
  - Moved InputDetailsPanel from renderDeload() to renderOverview()
  - Added console.log for detailedInputs

- `c:\Users\cn108578\CascadeProjects\health\mobile\src\screens\AnalyticsDashboardScreen.tsx`
  - Moved InputDetailsPanel inside ScrollView
  - Added console.log for detailedInputs

- `c:\Users\cn108578\CascadeProjects\health\mobile\src\components\InputDetailsPanel.tsx`
  - Changed default state from collapsed to expanded (useState(true))

## Troubleshooting

### If panels still don't show:
1. Check browser console for the console.log messages
2. If logs don't appear, mobile cache wasn't cleared - try deleting `.expo` folder
3. If logs appear but panels don't, check for JavaScript errors in console

### If SSL errors persist:
1. Verify `.env` file has `NODE_ENV=development`
2. Check server console for SSL-related errors
3. Restart server after verifying environment variable

### If metabolic V2 still 404s:
1. Check server console for route registration
2. Verify server started without errors
3. Check if `metabolicEngineRoutes.ts` is being imported in `index.ts`
