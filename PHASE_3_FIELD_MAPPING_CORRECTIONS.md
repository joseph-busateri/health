# PHASE 3: FIELD MAPPING CORRECTIONS

**Date:** April 3, 2026  
**Status:** TypeScript Errors Fixed  
**Files Updated:** recommendationAnalysisService.ts, recommendationNormalizer.ts

---

## CORRECTED FIELD MAPPINGS

### Recovery Snapshot

**Incorrect (Old):**
```typescript
recovery.recoveryScore  // ❌ Does not exist
recovery.hrvScore       // ❌ Does not exist
recovery.recoveryStatus // ❌ Does not exist
snapshot.sleep          // ❌ Does not exist
```

**Correct (Fixed):**
```typescript
recovery.score          // ✅ number | null (0-100)
recovery.hrv            // ✅ number | undefined (ms)
recovery.status         // ✅ HealthStatus ('optimal' | 'stable' | 'moderate' | 'at_risk' | 'critical')
recovery.sleepHours     // ✅ number | undefined
recovery.sleepQuality   // ✅ number | undefined (1-5)
recovery.restingHr      // ✅ number | undefined (bpm)
recovery.confidence     // ✅ ConfidenceLevel ('high' | 'medium' | 'low')
```

### Cardiovascular Snapshot

**Incorrect (Old):**
```typescript
cv.riskLevel || 'elevated'  // ❌ Wrong fallback logic
```

**Correct (Fixed):**
```typescript
cv.riskScore            // ✅ number | null (0-100)
cv.riskLevel            // ✅ RiskLevel ('low' | 'moderate' | 'high' | 'critical')
cv.cardiovascularRisk   // ✅ RiskLevel (derived risk)
cv.bloodPressure        // ✅ { systolic?, diastolic?, status }
cv.confidence           // ✅ ConfidenceLevel
```

### Metabolic Snapshot

**Incorrect (Old):**
```typescript
metabolic.status || 'at_risk'  // ❌ Wrong fallback logic
```

**Correct (Fixed):**
```typescript
metabolic.score         // ✅ number | null (0-100)
metabolic.status        // ✅ HealthStatus
metabolic.glucose       // ✅ { fasting?, status }
metabolic.a1c           // ✅ { value?, status, trend }
metabolic.metabolicRisk // ✅ RiskLevel
metabolic.confidence    // ✅ ConfidenceLevel
```

### Stress Snapshot

**Incorrect (Old):**
```typescript
stress.stressScore > 70  // ❌ Wrong interpretation (higher = more stress)
```

**Correct (Fixed):**
```typescript
stress.score            // ✅ number | null (0-100, higher = LESS stress)
stress.status           // ✅ HealthStatus
stress.cnsLoad          // ✅ CNSLoadLevel ('low' | 'moderate' | 'high' | 'overreached')
stress.confidence       // ✅ ConfidenceLevel
```

**Important Note:** Stress score is inverted - higher score means LESS stress, so for high stress detection use `stress.score < 30`.

---

## CHANGES MADE

### 1. recommendationAnalysisService.ts

**Lines 219-280: analyzeRecoveryFromSnapshot()**

**Changed:**
- `recovery.recoveryScore` → `recovery.score`
- `recovery.hrvScore` → `recovery.hrv`
- `recovery.recoveryStatus` → `recovery.status`
- `snapshot.sleep?.sleepDuration` → `recovery.sleepHours`
- Added `recovery.sleepQuality` check
- Changed status check from string comparison to HealthStatus enum
- Use `recovery.confidence` instead of hardcoded 'high'

**Lines 285-339: analyzeCardiovascularFromSnapshot()**

**Changed:**
- `!cv.riskScore` → `cv.riskScore === null`
- `cv.riskLevel || 'elevated'` → `cv.riskLevel` (no fallback needed)
- Use `cv.confidence` instead of hardcoded 'high'

**Lines 344-396: analyzeMetabolicFromSnapshot()**

**Changed:**
- `!metabolic.score` → `metabolic.score === null`
- `metabolic.status || 'at_risk'` → `metabolic.status` (no fallback needed)
- Added `metabolic.a1c?.value` check for A1C levels
- Use `metabolic.confidence` instead of hardcoded 'medium'

**Lines 401-447: analyzeHolisticPatterns()**

**Changed:**
- `snapshot.recovery?.recoveryScore` → `snapshot.recovery?.score`
- `snapshot.stress?.stressScore` → `snapshot.stress?.score`
- Fixed stress logic: `stress.score > 70` → `stress.score < 30` (inverted scale)
- Added comment explaining stress score inversion

### 2. recommendationNormalizer.ts

**Lines 49-51: normalizeRecommendation()**

**Changed:**
- Added explicit type assertion for `actionType` to match union type
- Set `actionDetails: undefined` (evidence doesn't include this field)

---

## SNAPSHOT STRUCTURE GAPS

### Gaps Identified for Recommendation Analysis

**1. Missing Aggregate Sleep Data**

**Current State:**
- Sleep data is split across `recovery.sleepHours` and `recovery.sleepQuality`
- No dedicated `SleepSnapshot` section

**Impact:**
- Cannot analyze sleep-specific recommendations independently
- Sleep recommendations must be inferred from recovery data

**Recommendation:**
- Consider adding `SleepSnapshot` section in future with:
  - `totalSleep`, `deepSleep`, `remSleep`, `sleepEfficiency`
  - `sleepDebt`, `sleepConsistency`
  - Sleep-specific recommendations

**Workaround:**
- Use `recovery.sleepHours` and `recovery.sleepQuality` for now
- ✅ Already implemented in analysis service

---

**2. Missing Workout Load History**

**Current State:**
- `workout.workoutLoad` is a single value (0-100)
- No historical workout load data in snapshot

**Impact:**
- Cannot detect accumulated fatigue from workout load trends
- Cannot identify overtraining patterns from load history

**Recommendation:**
- Add `workoutLoadHistory` to `WorkoutSnapshot`:
  ```typescript
  workoutLoadHistory?: {
    sevenDayAverage: number;
    fourteenDayAverage: number;
    trend: TrendDirection;
  }
  ```

**Workaround:**
- Use `derivedIntelligence.fatigueRisk` for accumulated fatigue
- ✅ Already implemented in holistic pattern analysis

---

**3. Missing Stress Level Numeric Value**

**Current State:**
- `stress.score` is 0-100 (higher = less stress)
- `stress.interviewStressLevel` is 1-10 (higher = more stress)
- Inverted scales cause confusion

**Impact:**
- Easy to misinterpret stress score direction
- Requires careful documentation and comments

**Recommendation:**
- Standardize stress scoring direction across all fields
- Consider adding `stressLevel` field (0-100, higher = more stress) for consistency

**Workaround:**
- Added clear comments in code about stress score inversion
- Use `stress.score < 30` for high stress detection
- ✅ Already implemented with documentation

---

**4. Missing Nutrition Adherence Data**

**Current State:**
- `nutrition` is optional and may not be populated
- `adherence.breakdown.nutrition` exists but limited detail

**Impact:**
- Cannot generate nutrition-specific recommendations from snapshot alone
- Must rely on separate nutrition engine records

**Recommendation:**
- Populate `NutritionSnapshot` with:
  - Actual vs target macros
  - Meal timing consistency
  - Hydration status
  - Micronutrient gaps

**Workaround:**
- Use `adherence.breakdown.nutrition` for basic adherence
- Nutrition recommendations must come from direct engine records
- ✅ Analysis service supports direct engine record analysis

---

**5. Missing Joint Health Details**

**Current State:**
- `jointHealth.affectedAreas` is string array
- `jointHealth.painLevel`, `tightness`, `soreness` are single values

**Impact:**
- Cannot identify which specific joints have issues
- Cannot track joint-specific pain levels

**Recommendation:**
- Add joint-specific tracking:
  ```typescript
  joints?: {
    [key: string]: {
      painLevel: number;
      tightness: number;
      soreness: number;
      lastAggravated?: string;
    }
  }
  ```

**Workaround:**
- Use `affectedAreas` array for general joint issues
- Use overall `painLevel` for severity
- ✅ Sufficient for current recommendation needs

---

**6. Missing Supplement Interaction Data**

**Current State:**
- No supplement data in snapshot
- Cannot detect supplement interactions or conflicts

**Impact:**
- Cannot generate supplement-related recommendations from snapshot
- Cannot detect supplement conflicts in recommendation analysis

**Recommendation:**
- Add `SupplementSnapshot` section:
  ```typescript
  supplements?: {
    currentStack: Array<{
      name: string;
      dosage: number;
      timing: string;
    }>;
    adherenceScore: number;
    interactions?: string[];
  }
  ```

**Workaround:**
- Supplement recommendations must come from direct engine records
- Conflict detection happens in RecommendationEngine, not analysis layer
- ✅ Architecture supports this separation

---

## TYPESCRIPT VERIFICATION

### Compilation Results

**Command:**
```bash
npx tsc --noEmit src/services/recommendationAnalysisService.ts \
                 src/services/recommendationNormalizer.ts \
                 src/services/recommendationPromptBuilder.ts \
                 src/types/recommendationSchema.ts
```

**Result:** ✅ **NO ERRORS**

All TypeScript errors in recommendation-related files have been fixed.

**Note:** The project has 141 TypeScript errors in other unrelated files (workoutBaselineService, routes, etc.), but these do not affect the recommendation architecture.

---

## FIELD ACCESS PATTERNS

### Safe Field Access

**Always check for null/undefined:**
```typescript
// ✅ Correct
if (recovery.score !== null && recovery.score < 50) {
  // Safe to use recovery.score
}

// ❌ Incorrect
if (recovery.score < 50) {
  // May fail if score is null
}
```

**Use optional chaining for nested fields:**
```typescript
// ✅ Correct
if (metabolic.glucose?.fasting && metabolic.glucose.fasting >= 100) {
  // Safe
}

// ❌ Incorrect
if (metabolic.glucose.fasting >= 100) {
  // May fail if glucose is undefined
}
```

**Use confidence from snapshot:**
```typescript
// ✅ Correct
confidenceLevel: recovery.confidence,

// ❌ Incorrect
confidenceLevel: 'high', // Hardcoded
```

---

## SUMMARY

### Changes Made ✅

1. **Fixed all field references** in `recommendationAnalysisService.ts`
   - Recovery: `score`, `hrv`, `sleepHours`, `sleepQuality`, `status`, `confidence`
   - Cardiovascular: `riskScore`, `riskLevel`, `confidence`
   - Metabolic: `score`, `status`, `glucose`, `a1c`, `confidence`
   - Stress: `score` (with inverted scale documentation)

2. **Fixed type errors** in `recommendationNormalizer.ts`
   - Added explicit type assertion for `actionType`
   - Set `actionDetails` to undefined (not in evidence)

3. **Added documentation** for stress score inversion
   - Clear comments in code
   - Correct threshold logic (`< 30` for high stress)

### TypeScript Status ✅

- ✅ `recommendationAnalysisService.ts` - **NO ERRORS**
- ✅ `recommendationNormalizer.ts` - **NO ERRORS**
- ✅ `recommendationPromptBuilder.ts` - **NO ERRORS**
- ✅ `recommendationSchema.ts` - **NO ERRORS**

### Snapshot Structure Gaps 📝

**Identified 6 gaps:**
1. Missing aggregate sleep data (workaround: use recovery fields)
2. Missing workout load history (workaround: use derived intelligence)
3. Inverted stress scale (workaround: documented with comments)
4. Missing nutrition adherence detail (workaround: use direct engine records)
5. Missing joint-specific tracking (workaround: use affected areas array)
6. Missing supplement data (workaround: use direct engine records)

**All gaps have acceptable workarounds. No blockers for recommendation analysis.**

### Architecture Intact ✅

- ✅ Deterministic evidence building
- ✅ AI enrichment layer
- ✅ Normalization layer
- ✅ RecommendationEngine persistence
- ✅ No loose `any` typing
- ✅ Proper null checks
- ✅ Type-safe field access

### Ready For ✅

- AI service integration
- Recovery Engine migration
- End-to-end testing
- Additional engine migration

**Status:** All TypeScript errors fixed. Architecture intact. Ready to proceed with AI-enriched migration.
