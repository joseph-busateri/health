# Troubleshooting Input Transparency Feature

## What I've Fixed

### 1. ✅ Notification Error (App.tsx)
**Problem**: `Notifications.removeNotificationSubscription is not a function`
**Fix**: Changed to use `.remove()` method on subscription objects
**File**: `mobile/App.tsx` lines 32, 35

### 2. ✅ Backend Implementation
- Created `InputMetadata` type system
- Implemented `buildCardiovascularInputMetadata()` function
- Extended `getCardiovascularRecommendation()` to accept contextData
- Added `detailedInputs` field to `CardiovascularRecord`
- Added comprehensive logging throughout the flow

### 3. ✅ Frontend Implementation
- Created `InputDetailsPanel` component
- Added `detailedInputs` field to mobile `CardiovascularRecord` type
- Integrated panel into `CardiovascularDashboardScreenV2`
- Added warning message when detailedInputs not available

### 4. ✅ Logging Added
- Feature flag initialization log
- DetailedInputs generation check
- Record creation verification
- Controller response verification
- Frontend console logs

## How to Test

### Step 1: Verify Feature Flag in .env
Open `server/.env` and ensure it contains:
```
SHOW_DETAIL_SCREEN_INPUTS=true
```

### Step 2: Run Test Script
```bash
cd server
npx ts-node src/test-input-transparency.ts
```

**Expected Output**:
```
✅ Cardiovascular data retrieved
Has detailedInputs: true
DetailedInputs count: 16
✅ INPUT TRANSPARENCY WORKING!
```

### Step 3: Check Server Logs
When you start the server, look for:
```
🔧 [CARDIOVASCULAR ENGINE] Feature flags initialized { SHOW_DETAIL_SCREEN_INPUTS: true }
```

When you load cardiovascular data, look for:
```
🔍 [CARDIOVASCULAR ENGINE] Checking detailedInputs generation
✅ [CARDIOVASCULAR ENGINE] Built detailed input metadata
📦 [CARDIOVASCULAR ENGINE] Record created { hasDetailedInputs: true, detailedInputsCount: 16 }
🚀 [CARDIOVASCULAR CONTROLLER] Sending response to frontend { hasDetailedInputs: true }
```

### Step 4: Check Browser Console
When you load the cardiovascular screen, look for:
```
Cardiovascular detailedInputs: [Array(16)]
DetailedInputs count: 16
```

### Step 5: Check the Screen
You should see either:
- ✅ A collapsible "Cardiovascular Inputs" panel with color-coded badges
- ⚠️ A yellow warning box saying "Input transparency not available"

## Common Issues

### Issue 1: Feature Flag Not Working
**Symptoms**: Server logs show `SHOW_DETAIL_SCREEN_INPUTS: false`
**Solution**: 
1. Verify `SHOW_DETAIL_SCREEN_INPUTS=true` is in `server/.env` (not just `.env.example`)
2. Restart the server
3. Check for typos in the flag name

### Issue 2: No Context Data
**Symptoms**: Server logs show "NOT building detailed inputs - No context data"
**Solution**: This is a bug in the code - contextData should always be built when feature flag is enabled

### Issue 3: detailedInputs Not in API Response
**Symptoms**: Controller logs show `hasDetailedInputs: false`
**Solution**: Check earlier logs to see if metadata was built in the service

### Issue 4: Frontend Not Receiving detailedInputs
**Symptoms**: Browser console shows `DetailedInputs count: 0`
**Solution**: Check network tab to see actual API response

## Debug Checklist

- [ ] `SHOW_DETAIL_SCREEN_INPUTS=true` in `server/.env`
- [ ] Server restarted after adding flag
- [ ] Server logs show feature flag initialized as `true`
- [ ] Server logs show "Built detailed input metadata"
- [ ] Server logs show "Record created" with `hasDetailedInputs: true`
- [ ] Controller logs show "Sending response" with `hasDetailedInputs: true`
- [ ] Browser console shows `detailedInputs` array
- [ ] Browser console shows `DetailedInputs count: 16`
- [ ] Screen shows either panel or warning message

## Next Steps After It Works

Once you see the InputDetailsPanel working on the cardiovascular screen:

1. **Extend Recovery Engine** - Add same pattern to recovery service
2. **Extend Metabolic Engine** - Add same pattern to metabolic service  
3. **Extend Performance Engine** - Add same pattern to performance service
4. **Extend Sexual Health Engine** - Add same pattern to sexual health service

Each follows the same pattern:
- Create `build[Engine]InputMetadata()` function
- Pass contextData to recommendation function
- Add `detailedInputs` to record when feature flag enabled
- Integrate `InputDetailsPanel` into detail screen
