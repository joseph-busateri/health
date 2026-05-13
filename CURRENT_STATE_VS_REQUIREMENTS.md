# Current State vs User Requirements - Comprehensive Analysis

## Executive Summary

**GOOD NEWS**: Most backend work is already complete from previous session.
**REMAINING WORK**: Primarily frontend UI positioning + Sexual Health Score implementation.

---

## Requirement-by-Requirement Analysis

### 1. RECOVERY SCORE ✅ Backend Complete, 🔧 Frontend Positioning Needed

#### User Requirements:
- Display all 8 inputs used in calculation ✅ DONE
- Add risk labels (90/70/50/30) ✅ DONE
- Move inputs to TOP of screen, before recommendations 🔧 TODO

#### Current State:
- ✅ Backend: `calculateRecoveryInputScore()` implemented
- ✅ All 8 inputs have score field with 90/70/50/30 mapping
- ✅ InputDetailsPanel displays color-coded badges
- 🔧 Frontend: Need to verify/adjust UI positioning

#### Files Already Modified:
- `server/src/services/recoveryEngineService.ts` ✅

#### Files Still Need Changes:
- `mobile/src/screens/RecoveryStatusScreen.tsx` - Verify inputs are at top

---

### 2. CARDIOVASCULAR SCORE ✅ Backend Complete, 🔧 Frontend Positioning Needed

#### User Requirements:
- Calculate Total Cholesterol from LDL + HDL ✅ ALREADY DONE (lines 1203-1213)
- Calculate Total Cholesterol/HDL Ratio ✅ ALREADY DONE (lines 1216-1218)
- Display all 18 inputs ✅ DONE
- Add risk labels (90/70/50/30) ✅ DONE
- Move inputs ABOVE Recommendations section 🔧 TODO

#### Current State:
- ✅ Backend: Total Cholesterol calculated from LDL + HDL when missing
- ✅ Backend: Total Cholesterol/HDL Ratio calculated
- ✅ Backend: `calculateCardiovascularInputScore()` implemented
- ✅ All 18 inputs have score field with 90/70/50/30 mapping
- 🔧 Frontend: Need to verify/adjust UI positioning

#### Files Already Modified:
- `server/src/services/cardiovascularEngineService.ts` ✅

#### Files Still Need Changes:
- `mobile/src/screens/CardiovascularDashboardScreenV2.tsx` - Move inputs above Recommendations

---

### 3. METABOLIC SCORE ✅ Complete - No Changes Needed

#### User Requirements:
- Get weight from body_composition_scan table ✅ ALREADY DONE
- Display all 17 inputs ✅ DONE
- Add risk labels (90/70/50/30) ✅ DONE

#### Current State:
- ✅ Weight sourced from `body_composition_scans` table (line 345: `table: 'body_composition_scans', field: 'weight_lb'`)
- ✅ Backend: `calculateMetabolicInputScore()` implemented
- ✅ All 17 inputs have score field with 90/70/50/30 mapping
- ✅ Frontend: InputDetailsPanel displays all inputs with scores

#### Files Already Modified:
- `server/src/services/metabolicEngineServiceV2.ts` ✅
- `mobile/src/screens/MetabolicHealthDashboardScreen.tsx` ✅

#### No Further Changes Needed ✅

---

### 4. PERFORMANCE/JOINT HEALTH SCORE ⚠️ Needs Clarification

#### User Requirements:
- Display 10 inputs: painLevel, tightnessLevel, sorenessLevel, affectedArea, workoutLoad, recoveryScore, verbalNotes, **age**, **trainingExperience**, **weight**
- Add risk labels (90/70/50/30) ✅ DONE for 7 inputs
- Move inputs to TOP of screen 🔧 TODO

#### Current State:
- ✅ Backend: `calculateJointHealthInputScore()` implemented for 7 inputs
- ✅ All 7 inputs have score field with 90/70/50/30 mapping
- ⚠️ **ISSUE**: age, trainingExperience, weight are NOT in JointHealthInputs type
- ⚠️ **ISSUE**: These 3 fields are NOT used in joint health calculation
- 🔧 Frontend: Need to verify/adjust UI positioning

#### Analysis:
The JointHealthInputs type only includes 7 fields:
```typescript
export interface JointHealthInputs {
  painLevel?: number;
  tightnessLevel?: number;
  sorenessLevel?: number;
  affectedArea?: JointArea;
  workoutLoad?: number;
  recoveryScore?: number;
  verbalNotes?: string;
}
```

Age, trainingExperience, and weight are loaded from baseline profile (lines 497-503) but are NOT used in the joint health score calculation.

#### Decision Options:
1. **Option A**: Add these 3 fields to JointHealthInputs and display with "Not used in calculation" label
2. **Option B**: Document that only 7 inputs are used in calculation and do not add the 3 fields
3. **Option C**: Ask user for clarification

#### Files Already Modified:
- `server/src/services/jointHealthEngineService.ts` ✅

#### Files May Need Changes:
- `server/src/types/jointHealthEngine.ts` - Add 3 fields to JointHealthInputs?
- `server/src/services/jointHealthEngineService.ts` - Add 3 fields to metadata?
- `mobile/src/screens/JointHealthStatusScreen.tsx` - Move inputs to top

---

### 5. SEXUAL HEALTH SCORE ❌ Not Yet Implemented

#### User Requirements:
- Remove duplicative "Current Values" section
- Display all 25 available inputs
- Add risk labels (90/70/50/30) to all inputs
- Verify which inputs are used in calculation

#### Current State:
- ❌ No scoring function implemented
- ❌ No risk labels added
- ❌ Need to identify active screen version (V1/V2/V3)
- ❌ Need to investigate which of 25 inputs are used in calculation

#### 25 Available Inputs to Evaluate:
1. recoveryScore
2. stressScore
3. cardiovascularStatus
4. metabolicStatus
5. sleepHours
6. fatigueScore
7. hrv
8. adherenceScore
9. totalTestosterone
10. freeTestosterone
11. libidoSelfRating
12. erectileFunctionRating
13. morningErectionsFrequency
14. age
15. sex
16. trtUsage
17. weight
18. stressLevel
19. sleepQuality
20. testosterone
21. restingHeartRate
22. testosteroneTrend
23. freeTestosteroneTrend
24. estradiolTrend
25. shbgTrend

#### Files Need Investigation:
- `server/src/services/sexualHealthEngineService*.ts` - Which version is active?
- `server/src/types/sexualHealthEngine.ts` - What inputs are defined?
- `mobile/src/screens/SexualHealthDashboardScreen*.tsx` - Which version is active?

#### Files Will Need Changes:
- Backend service - Add `calculateSexualHealthInputScore()` function
- Backend service - Add score field to all input metadata
- Frontend screen - Remove "Current Values" section
- Frontend screen - Display all inputs with InputDetailsPanel

---

## Summary of Remaining Work

### HIGH PRIORITY (User Explicitly Requested)
1. ✅ Cardiovascular Total Cholesterol calculation - **ALREADY DONE**
2. ✅ Cardiovascular Total Cholesterol/HDL Ratio - **ALREADY DONE**
3. ✅ Metabolic weight from body_composition_scans - **ALREADY DONE**
4. 🔧 Recovery inputs positioning - **FRONTEND CHANGE NEEDED**
5. 🔧 Cardiovascular inputs positioning - **FRONTEND CHANGE NEEDED**
6. 🔧 Performance inputs positioning - **FRONTEND CHANGE NEEDED**
7. ❌ Sexual Health full implementation - **MAJOR WORK NEEDED**

### MEDIUM PRIORITY (Needs Clarification)
8. ⚠️ Performance Score: Add age/trainingExperience/weight? - **USER CLARIFICATION NEEDED**

### LOW PRIORITY (Already Complete)
9. ✅ All risk labels (90/70/50/30) - **DONE FOR 4 OF 5 SCORES**
10. ✅ All backend scoring functions - **DONE FOR 4 OF 5 SCORES**
11. ✅ InputDetailsPanel color-coded badges - **DONE**

---

## Recommended Implementation Order

### Phase 1: Quick Wins (Frontend Positioning)
1. Verify/adjust Recovery inputs positioning
2. Verify/adjust Cardiovascular inputs positioning  
3. Verify/adjust Performance inputs positioning

### Phase 2: Sexual Health Score (Major Work)
1. Identify active service version
2. Identify active screen version
3. Determine which of 25 inputs are used in calculation
4. Add `calculateSexualHealthInputScore()` function
5. Add score field to all input metadata
6. Remove "Current Values" section from screen
7. Display all inputs with InputDetailsPanel

### Phase 3: Performance Score Clarification
1. Determine if age/trainingExperience/weight should be added
2. If yes, add to JointHealthInputs type
3. Add to metadata with "Not used in calculation" label
4. Add scoring (or mark as N/A)

### Phase 4: Validation & Documentation
1. Test all 5 screens
2. Create validation summary table
3. Update README.md
4. Document all changes

---

## Files Modified So Far (Previous Session)

### Backend (4 files)
1. `server/src/services/metabolicEngineServiceV2.ts` ✅
2. `server/src/services/recoveryEngineService.ts` ✅
3. `server/src/services/cardiovascularEngineService.ts` ✅
4. `server/src/services/jointHealthEngineService.ts` ✅

### Types (2 files)
5. `server/src/types/inputMetadata.ts` ✅
6. `mobile/src/types/inputMetadata.ts` ✅

### Frontend (2 files)
7. `mobile/src/components/InputDetailsPanel.tsx` ✅
8. `mobile/src/screens/MetabolicHealthDashboardScreen.tsx` ✅

**Total: 8 files modified**

---

## Files Still Need Changes

### Frontend Positioning (3 files)
1. `mobile/src/screens/RecoveryStatusScreen.tsx`
2. `mobile/src/screens/CardiovascularDashboardScreenV2.tsx`
3. `mobile/src/screens/JointHealthStatusScreen.tsx`

### Sexual Health Implementation (2-3 files)
4. `server/src/services/sexualHealthEngineService*.ts`
5. `mobile/src/screens/SexualHealthDashboardScreen*.tsx`
6. Possibly `server/src/types/sexualHealthEngine.ts`

### Performance Score (if user confirms) (2 files)
7. `server/src/types/jointHealthEngine.ts`
8. `server/src/services/jointHealthEngineService.ts`

**Estimated: 5-8 additional files to modify**

