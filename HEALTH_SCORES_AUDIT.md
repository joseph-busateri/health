# Health Scores Input Transparency Audit
**Date:** May 3, 2026
**Objective:** Ensure all 5 health score detail screens accurately display calculation inputs with standardized risk labels

## Audit Scope
1. Recovery Score
2. Cardiovascular Score
3. Metabolic Score
4. Performance Score (Joint Health)
5. Sexual Health Score

## Standard Risk Label Mapping
- **optimal** = 90
- **moderate** = 70
- **elevated_risk** = 50
- **high_risk** = 30

---

## 1. RECOVERY SCORE

### Frontend Detail Screen
- **File:** `mobile/src/screens/RecoveryStatusScreen.tsx`
- **Component:** Uses `InputDetailsPanel` component
- **API Endpoint:** `/recovery/:userId/today`

### Backend Service
- **File:** `server/src/services/recoveryEngineService.ts`
- **Function:** `getRecoveryToday()`
- **Score Calculation:** `calculateRecoveryScore()`

### Calculation Inputs (from backend)
Need to verify by examining `recoveryEngineService.ts`

### Currently Displayed Inputs
- Uses `InputDetailsPanel` with `detailedInputs` from backend
- Should show 8 inputs based on previous work

### Status
✅ **COMPLETE** - Already has InputDetailsPanel with detailedInputs
- Need to verify risk labels are present

---

## 2. CARDIOVASCULAR SCORE

### Frontend Detail Screen
- **File:** `mobile/src/screens/CardiovascularDashboardScreenV2.tsx`
- **Component:** Uses `InputDetailsPanel` component
- **API Endpoint:** `/cardiovascular/:userId/today`

### Backend Service
- **File:** `server/src/services/cardiovascularEngineService.ts`
- **Function:** `getCardiovascularToday()`
- **Score Calculation:** `calculateCardiovascularRiskScore()`

### Calculation Inputs (from backend)
Need to verify by examining scoring function

### Currently Displayed Inputs
- Uses `InputDetailsPanel` with `detailedInputs` from backend
- Shows 18 inputs based on previous work

### Status
✅ **COMPLETE** - Already has InputDetailsPanel with detailedInputs
- Need to verify risk labels are present

---

## 3. METABOLIC SCORE

### Frontend Detail Screen
- **File:** `mobile/src/screens/MetabolicHealthDashboardScreen.tsx`
- **Component:** Uses `InputDetailsPanel` component
- **API Endpoint:** `/metabolic/v2/:userId/today`

### Backend Service
- **File:** `server/src/services/metabolicEngineServiceV2.ts`
- **Function:** `getMetabolicTodayV2()`
- **Score Calculation:** `determineMetabolicStatus()` - JUST FIXED to use all 17 inputs

### Calculation Inputs (from backend)
All 17 inputs now used in calculation (just fixed)

### Currently Displayed Inputs
- Uses `InputDetailsPanel` with `detailedInputs` from backend
- Shows 17 inputs with individual scores

### Status
✅ **COMPLETE** - Already has InputDetailsPanel with detailedInputs and individual scores
- Risk labels already implemented (90/70/50/30)

---

## 4. PERFORMANCE SCORE (Joint Health)

### Frontend Detail Screen
- **File:** `mobile/src/screens/JointHealthStatusScreen.tsx`
- **Component:** Uses `InputDetailsPanel` component
- **API Endpoint:** `/joint-health/:userId/today`

### Backend Service
- **File:** `server/src/services/jointHealthEngineService.ts`
- **Function:** `getJointHealthToday()`
- **Score Calculation:** Need to examine

### Calculation Inputs (from backend)
Need to verify by examining scoring function

### Currently Displayed Inputs
- Uses `InputDetailsPanel` with `detailedInputs` from backend
- Shows 7 inputs based on previous work

### Status
✅ **COMPLETE** - Already has InputDetailsPanel with detailedInputs
- Need to verify risk labels are present

---

## 5. SEXUAL HEALTH SCORE

### Frontend Detail Screen
- **File:** Need to identify which version is active (V1, V2, or V3)
- **Component:** Need to check if uses `InputDetailsPanel`
- **API Endpoint:** Need to identify

### Backend Service
- **File:** `server/src/services/sexualHealthEngineServiceV3.ts` (likely V3)
- **Function:** Need to identify
- **Score Calculation:** Need to examine

### Calculation Inputs (from backend)
Need to verify by examining scoring function

### Currently Displayed Inputs
Need to examine frontend screen

### Status
⚠️ **NEEDS INVESTIGATION** - Need to determine active version and input display

---

## Next Steps

1. ✅ Metabolic Score - Already complete with all features
2. 🔍 Recovery Score - Verify risk labels present in detailedInputs
3. 🔍 Cardiovascular Score - Verify risk labels present in detailedInputs
4. 🔍 Performance Score - Verify risk labels present in detailedInputs
5. 🔍 Sexual Health Score - Full investigation needed

## Implementation Strategy

### For scores with InputDetailsPanel (Recovery, Cardiovascular, Performance)
- Verify backend generates individual scores for each input
- Add `calculateXXXInputScore()` function if missing
- Add score field to each input in `buildXXXInputMetadata()`
- Ensure scoring engine uses all displayed inputs

### For Sexual Health Score
- Determine active screen version
- Check if InputDetailsPanel is used
- If not, add InputDetailsPanel
- Add detailedInputs generation to backend
- Add individual input scoring

