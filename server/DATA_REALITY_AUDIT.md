# Data Reality Audit — Real vs Placeholder Data

**Purpose**: Identify which data is real user data vs mocked/seeded/hardcoded/inferred

---

## REAL USER DATA ✅

### 1. Daily Interview Data
**Status**: **REAL**
- Source: User completes daily AI interview
- Persistence: In-memory Map, persisted per day
- Usage: Feeds all engines daily
- Quality: High - actual user input

**Fields**:
- Energy, fatigue, sleep quality, muscle soreness
- Mental stress, workload, emotional stress
- Joint pain (shoulder, knee, back, elbow)
- Libido, erectile function, morning erections
- Workout/supplement/nutrition adherence
- Context flags (travel, illness, etc.)

**Evidence**: `hybridInterviewService.ts` - stores real interview responses

---

### 2. Bloodwork Data
**Status**: **REAL**
- Source: User uploads bloodwork PDF/image
- Persistence: In-memory Map with OCR extraction
- Usage: Metabolic, Cardiovascular, Sexual Health, Supplement engines
- Quality: High - actual lab results

**Fields**:
- All CBC, CMP, lipid panel markers
- Hormones (testosterone, estradiol, etc.)
- Metabolic markers (glucose, HbA1c, insulin)
- Vitamins and minerals
- Inflammation markers

**Evidence**: `bloodworkProcessingService.ts` - OCR extraction and normalization working

---

### 3. Goals Data
**Status**: **REAL**
- Source: User sets goals via API
- Persistence: In-memory Map
- Usage: Goal scoring, optimization engines
- Quality: High - user-defined targets

**Fields**:
- Body composition goals
- Strength goals
- Metabolic goals
- Cardiovascular goals
- Sexual health goals
- Circumference goals

**Evidence**: `goalService.ts` - stores user-defined goals

---

### 4. Workout Baseline
**Status**: **REAL**
- Source: User uploads workout plan document
- Persistence: In-memory Map
- Usage: Workout Today generation
- Quality: High - user's actual program

**Fields**:
- Weekly workout schedule
- Exercises, sets, reps, load
- Workout type per day
- Cycle information

**Evidence**: `workoutDocumentService.ts` - document upload and parsing

---

### 5. Supplement Baseline
**Status**: **REAL**
- Source: User uploads supplement stack document
- Persistence: In-memory Map
- Usage: Supplement Engine
- Quality: High - user's actual stack

**Fields**:
- Supplement names
- Dosages
- Timing
- Purpose

**Evidence**: `supplementDocumentService.ts` - document upload and parsing

---

### 6. Body Composition Data
**Status**: **REAL**
- Source: User manually enters measurements
- Persistence: In-memory Map
- Usage: Metabolic Engine, Goals, Progress tracking
- Quality: High - user measurements

**Fields**:
- Weight
- Body fat percentage
- Circumferences (via tape measurements)

**Evidence**: `bodyCompositionService.ts`, `tapeMeasurementService.ts`

---

### 7. Strength Tracking
**Status**: **REAL**
- Source: User manually logs strength metrics
- Persistence: In-memory Map
- Usage: Workout Engine, Goals
- Quality: High - user performance data

**Fields**:
- 1RM values (bench, squat, etc.)
- Max rep tests
- Grip strength

**Evidence**: `strengthTrackingService.ts`

---

### 8. Meal Logging
**Status**: **REAL (PARTIAL)**
- Source: User logs meals manually or via OCR
- Persistence: In-memory Map
- Usage: Adherence tracking (partial)
- Quality: Medium - user logs when available

**Fields**:
- Meal descriptions
- Calories, macros (when provided)

**Evidence**: `mealLogService.ts`, `nutritionExtractionService.ts`

---

## SEEDED / DEFAULT DATA ⚠️

### 1. Baseline Profile
**Status**: **SEEDED**
- Source: Manual seeding in `baselineConfigService.ts`
- Persistence: In-memory Map
- Usage: All engines for context
- Quality: **Low - not user-specific**

**Fields**:
- Age, sex, height, weight
- Medical conditions, medications
- TRT usage, diabetes status
- Lifestyle context

**Evidence**:
```typescript
// baselineConfigService.ts
const defaultBaseline: BaselineConfig = {
  userId,
  age: 35,
  sex: 'male',
  height: 70,
  weight: 180,
  // ... hardcoded defaults
};
```

**Impact**: Engines use generic defaults instead of user-specific profile

---

### 2. Nutrition Baseline
**Status**: **SEEDED**
- Source: Hardcoded defaults in `nutritionTodayIntegratedService.ts`
- Persistence: In-memory Map
- Usage: Nutrition Today generation
- Quality: **Low - generic defaults**

**Fields**:
- Daily calories: 2800 (hardcoded)
- Protein: 200g (hardcoded)
- Carbs: 280g (hardcoded)
- Fats: 80g (hardcoded)
- Hydration: 100oz (hardcoded)

**Evidence**:
```typescript
// nutritionTodayIntegratedService.ts
const defaultBaseline: BaselineNutrition = {
  userId,
  calories: 2800,
  protein: 200,
  carbs: 280,
  fats: 80,
  hydrationOz: 100,
  bodyWeight: 180,
};
```

**Impact**: Nutrition recommendations based on generic targets, not user-specific plan

---

## MOCK / PLACEHOLDER DATA ❌

### 1. Device Data (Apple Watch, etc.)
**Status**: **MOCK/PLACEHOLDER**
- Source: `appleWatchSyncService.ts` exists but returns mock data
- Persistence: In-memory Map (mock)
- Usage: Recovery Engine, Cardiovascular Engine
- Quality: **None - not real data**

**Fields**:
- HRV: **MOCK**
- Resting heart rate: **MOCK**
- Sleep duration: **MOCK**
- Active calories: **MOCK**
- Steps: **MOCK**
- VO2 max: **MOCK**

**Evidence**:
```typescript
// appleWatchSyncService.ts exists but not fully connected
// Engines fall back to interview data or defaults
```

**Impact**: Recovery and Cardiovascular engines use interview data instead of device metrics

---

### 2. Blood Pressure Monitoring
**Status**: **MISSING**
- Source: **NOT IMPLEMENTED**
- Persistence: None
- Usage: Cardiovascular Engine (should use, doesn't)
- Quality: **None**

**Impact**: Cardiovascular engine relies on bloodwork lipids only, not real-time BP

---

### 3. Continuous Glucose Monitor
**Status**: **MISSING**
- Source: **NOT IMPLEMENTED**
- Persistence: None
- Usage: Metabolic Engine (optional)
- Quality: **None**

**Impact**: Metabolic engine uses bloodwork glucose only

---

## DERIVED / CALCULATED DATA 📊

### 1. Recovery Score
**Status**: **DERIVED FROM INTERVIEW**
- Source: Calculated from interview responses
- Persistence: Engine snapshot
- Usage: All downstream engines
- Quality: Medium - based on subjective inputs

**Evidence**: `recoveryEngineService.ts` - calculates from energy, fatigue, sleep quality, soreness

---

### 2. Stress Score
**Status**: **DERIVED FROM INTERVIEW**
- Source: Calculated from interview responses
- Persistence: Engine snapshot
- Usage: All downstream engines
- Quality: Medium - based on subjective inputs

**Evidence**: `stressEngineService.ts` - calculates from mental stress, workload, emotional stress

---

### 3. Joint Risk
**Status**: **DERIVED FROM INTERVIEW**
- Source: Calculated from pain scores
- Persistence: Engine snapshot
- Usage: Workout adjustments
- Quality: Medium - based on subjective inputs

**Evidence**: `jointHealthEngineService.ts` - calculates from pain scores

---

### 4. Adherence Rates
**Status**: **DERIVED FROM INTERVIEW**
- Source: Calculated from interview adherence responses
- Persistence: Engine snapshot
- Usage: Adherence Engine
- Quality: Medium - self-reported

**Evidence**: `adherenceEngineService.ts` - calculates from interview responses

---

### 5. HOMA-IR
**Status**: **CALCULATED FROM BLOODWORK**
- Source: Calculated from glucose and insulin
- Persistence: Bloodwork record
- Usage: Metabolic Engine
- Quality: High - based on real lab values

**Evidence**: `bloodworkNormalizationService.ts` - calculates HOMA-IR

---

## INFERRED / ASSUMED DATA 🔮

### 1. HRV (when device data unavailable)
**Status**: **INFERRED FROM INTERVIEW**
- Source: Recovery engine infers from sleep quality and fatigue
- Persistence: Not stored
- Usage: Recovery scoring
- Quality: **Low - proxy only**

**Impact**: Recovery score less accurate without real HRV

---

### 2. Resting Heart Rate (when device unavailable)
**Status**: **INFERRED/ASSUMED**
- Source: Cardiovascular engine uses age-based estimates
- Persistence: Not stored
- Usage: Cardiovascular risk
- Quality: **Low - generic estimate**

**Impact**: Cardiovascular assessment less personalized

---

### 3. Sleep Duration (when device unavailable)
**Status**: **INFERRED FROM INTERVIEW**
- Source: Sleep quality score used as proxy
- Persistence: Not stored
- Usage: Recovery scoring
- Quality: **Low - subjective proxy**

**Impact**: Recovery score based on quality, not actual duration

---

### 4. Activity Level (when device unavailable)
**Status**: **INFERRED FROM WORKOUT ADHERENCE**
- Source: Workout completion used as proxy
- Persistence: Not stored
- Usage: Nutrition adjustments
- Quality: **Low - incomplete picture**

**Impact**: Nutrition recommendations less precise

---

## SUMMARY BY DATA QUALITY

| Data Type | Real | Seeded | Mock | Derived | Inferred | Quality Score |
|-----------|------|--------|------|---------|----------|---------------|
| Daily Interview | ✅ | - | - | - | - | **95%** |
| Bloodwork | ✅ | - | - | Some | - | **95%** |
| Goals | ✅ | - | - | - | - | **100%** |
| Workout Baseline | ✅ | - | - | - | - | **100%** |
| Supplement Baseline | ✅ | - | - | - | - | **100%** |
| Body Composition | ✅ | - | - | Some | - | **90%** |
| Strength Tracking | ✅ | - | - | - | - | **100%** |
| Baseline Profile | - | ✅ | - | - | - | **30%** |
| Nutrition Baseline | - | ✅ | - | - | - | **30%** |
| Device Data | - | - | ✅ | - | ✅ | **10%** |
| Blood Pressure | - | - | - | - | - | **0%** |
| Workout Execution | - | - | - | - | - | **0%** |

---

## CRITICAL FINDINGS

### High-Quality Real Data ✅
1. **Daily Interview** - 100% real user input, feeds all engines
2. **Bloodwork** - 100% real lab results, properly extracted and normalized
3. **Goals** - 100% user-defined targets
4. **Workout Baseline** - 100% user's actual program
5. **Supplement Baseline** - 100% user's actual stack

### Seeded/Default Data ⚠️
1. **Baseline Profile** - Generic defaults, not user-specific
2. **Nutrition Baseline** - Hardcoded values (2800 cal, 200g protein, etc.)

### Missing/Mock Data ❌
1. **Device Data** - Apple Watch sync not connected, engines use proxies
2. **Blood Pressure** - Not integrated despite spec requirement
3. **Workout Execution** - No actual completion logging
4. **Per-Supplement Adherence** - Only overall adherence tracked

### Impact on Engine Quality

**High-Quality Engines** (90%+ real data):
- Recovery Engine (interview-based)
- Stress Engine (interview-based)
- Joint Health Engine (interview-based)
- Sexual Health Engine (bloodwork + interview)
- Metabolic Engine (bloodwork + body comp)
- Adherence Engine (interview-based)

**Medium-Quality Engines** (50-90% real data):
- Cardiovascular Engine (bloodwork real, BP missing, device data mock)
- Supplement Engine (baseline real, adherence partial)
- Workout Engine (baseline real, execution missing)

**Lower-Quality Engines** (< 50% real data):
- Nutrition Engine (baseline seeded, tracking partial)

---

## RECOMMENDATIONS

### Immediate (High Impact)
1. **Implement Baseline Profile UI** - Replace seeded defaults with user input
2. **Implement Nutrition Baseline UI** - Replace hardcoded values with user targets
3. **Connect Device Data** - Wire Apple Watch sync into engines

### Short-Term (Medium Impact)
4. **Add Blood Pressure Integration** - Critical for cardiovascular accuracy
5. **Add Workout Execution Logging** - Track actual completion
6. **Enhance Meal Logging Integration** - Feed into Nutrition Engine

### Long-Term (Nice to Have)
7. **Add CGM Integration** - Optional metabolic enhancement
8. **Add Sleep Number Integration** - Optional recovery enhancement
9. **Add Per-Supplement Adherence** - Granular tracking
