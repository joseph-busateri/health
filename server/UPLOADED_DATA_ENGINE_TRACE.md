# Uploaded Data Engine Trace — Field-to-Engine Mapping

**Date**: April 6, 2026  
**Purpose**: Explicit field-level trace showing which uploaded data fields are consumed by which engines

---

## BLOODWORK FIELD-TO-ENGINE TRACE

### Lipid Panel Fields

| Field | Source Table | Normalized Name | Consuming Engine | Usage Location | Status |
|-------|--------------|-----------------|------------------|----------------|--------|
| Total Cholesterol | `bloodwork_results` | `total_cholesterol` | Cardiovascular (legacy) | `calculateCardiovascular():612` | ✅ Legacy only |
| LDL Cholesterol | `bloodwork_results` | `ldl` | Cardiovascular (legacy) | `calculateCardiovascular():614` | ✅ Legacy only |
| HDL Cholesterol | `bloodwork_results` | `hdl` | Cardiovascular (legacy) | `calculateCardiovascular():615` | ✅ Legacy only |
| Triglycerides | `bloodwork_results` | `triglycerides` | Cardiovascular (legacy) | `calculateCardiovascular():616` | ✅ Legacy only |
| Cholesterol Ratio | Calculated | `cholesterol_ratio` | Cardiovascular (legacy) | `calculateCardiovascular():617-619` | ✅ Legacy only |
| ApoB | `bloodwork_results` | `apob` | ❌ NONE | N/A | **NOT USED** |
| Lp(a) | `bloodwork_results` | `lpa` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: Lipid panel fields are ONLY used by legacy `calculateCardiovascular()` function. The new baseline-aware `getCardiovascularRecommendation()` does NOT consume bloodwork.

---

### Hormonal Panel Fields

| Field | Source Table | Normalized Name | Consuming Engine | Usage Location | Status |
|-------|--------------|-----------------|------------------|----------------|--------|
| Total Testosterone | `bloodwork_results` | `total_testosterone` | Sexual Health (legacy) | `calculateSexualHealth():627` | ✅ Legacy only |
| Free Testosterone | `bloodwork_results` | `free_testosterone` | Sexual Health (legacy) | `calculateSexualHealth():628` | ✅ Legacy only |
| Estradiol | `bloodwork_results` | `estradiol` | ❌ NONE | N/A | **NOT USED** |
| SHBG | `bloodwork_results` | `shbg` | ❌ NONE | N/A | **NOT USED** |
| PSA | `bloodwork_results` | `psa` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: Testosterone fields are ONLY used by legacy `calculateSexualHealth()` function. The new baseline-aware `getSexualHealthRecommendation()` does NOT consume bloodwork.

---

### Metabolic Panel Fields

| Field | Source Table | Normalized Name | Consuming Engine | Usage Location | Status |
|-------|--------------|-----------------|------------------|----------------|--------|
| Glucose | `bloodwork_results` | `glucose` | ❌ NONE | N/A | **NOT USED** |
| A1C | `bloodwork_results` | `a1c` | ❌ NONE | N/A | **NOT USED** |
| Insulin | `bloodwork_results` | `insulin` | ❌ NONE | N/A | **NOT USED** |
| Fasting Glucose | `bloodwork_results` | `fasting_glucose` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: NO metabolic markers are consumed by Metabolic Engine despite being available.

---

### Hematology Fields

| Field | Source Table | Normalized Name | Consuming Engine | Usage Location | Status |
|-------|--------------|-----------------|------------------|----------------|--------|
| Hematocrit | `bloodwork_results` | `hematocrit` | ❌ NONE | N/A | **NOT USED** |
| Hemoglobin | `bloodwork_results` | `hemoglobin` | ❌ NONE | N/A | **NOT USED** |
| RBC | `bloodwork_results` | `rbc` | ❌ NONE | N/A | **NOT USED** |
| WBC | `bloodwork_results` | `wbc` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: NO hematology markers are consumed by any engine.

---

### Inflammation Fields

| Field | Source Table | Normalized Name | Consuming Engine | Usage Location | Status |
|-------|--------------|-----------------|------------------|----------------|--------|
| hsCRP | `bloodwork_results` | `hscrp` | ❌ NONE | N/A | **NOT USED** |
| ESR | `bloodwork_results` | `esr` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: NO inflammation markers are consumed by any engine.

---

### Vitamin/Mineral Fields

| Field | Source Table | Normalized Name | Consuming Engine | Usage Location | Status |
|-------|--------------|-----------------|------------------|----------------|--------|
| Vitamin D | `bloodwork_results` | `vitamin_d` | ❌ NONE | N/A | **NOT USED** |
| B12 | `bloodwork_results` | `b12` | ❌ NONE | N/A | **NOT USED** |
| Folate | `bloodwork_results` | `folate` | ❌ NONE | N/A | **NOT USED** |
| Magnesium | `bloodwork_results` | `magnesium` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: NO vitamin/mineral markers are consumed by Supplement Engine despite being available.

---

### Liver/Kidney Fields

| Field | Source Table | Normalized Name | Consuming Engine | Usage Location | Status |
|-------|--------------|-----------------|------------------|----------------|--------|
| ALT | `bloodwork_results` | `alt` | ❌ NONE | N/A | **NOT USED** |
| AST | `bloodwork_results` | `ast` | ❌ NONE | N/A | **NOT USED** |
| Creatinine | `bloodwork_results` | `creatinine` | ❌ NONE | N/A | **NOT USED** |
| eGFR | `bloodwork_results` | `egfr` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: NO liver/kidney markers are consumed by any engine.

---

### Bloodwork Trend Data

| Field | Source Service | Consuming Engine | Usage Location | Status |
|-------|---------------|------------------|----------------|--------|
| Trend Direction | `bloodworkTrendService` | ❌ NONE | N/A | **NOT USED** |
| Percent Change | `bloodworkTrendService` | ❌ NONE | N/A | **NOT USED** |
| Absolute Change | `bloodworkTrendService` | ❌ NONE | N/A | **NOT USED** |
| Data Points | `bloodworkTrendService` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: Comprehensive trend service exists but NO engine consumes trend data.

---

### Bloodwork Recommendations

| Field | Source Service | Consuming Engine | Usage Location | Status |
|-------|---------------|------------------|----------------|--------|
| Recommendation Title | `bloodworkRecommendationService` | ❌ NONE | N/A | **NOT USED** |
| Recommendation Text | `bloodworkRecommendationService` | ❌ NONE | N/A | **NOT USED** |
| Action Items | `bloodworkRecommendationService` | ❌ NONE | N/A | **NOT USED** |
| Severity | `bloodworkRecommendationService` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: Comprehensive recommendation service exists but NOT surfaced in daily brief or control tower.

---

### Bloodwork Summary

**Total Fields Extracted**: 30+  
**Total Fields Used by Engines**: 5 (lipid panel + testosterone, legacy only)  
**Utilization Rate**: ~17%  
**Critical Gap**: 83% of bloodwork data is NOT used by engines

---

## BODY COMPOSITION FIELD-TO-ENGINE TRACE

### Core Composition Fields

| Field | Source Table | Consuming Engine | Usage Location | Status |
|-------|--------------|------------------|----------------|--------|
| Weight | `body_composition` | ❌ NONE | N/A | **NOT USED** |
| Body Fat % | `body_composition` | ❌ NONE | N/A | **NOT USED** |
| Lean Mass | `body_composition` | ❌ NONE | N/A | **NOT USED** |
| Skeletal Muscle Mass | `body_composition` | ❌ NONE | N/A | **NOT USED** |
| Water % | `body_composition` | ❌ NONE | N/A | **NOT USED** |
| Visceral Fat | `body_composition` | ❌ NONE | N/A | **NOT USED** |
| BMI | `body_composition` | ❌ NONE | N/A | **NOT USED** |
| BMR | `body_composition` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: ZERO body composition fields are consumed by any engine.

---

### Segmental Composition Fields

| Field | Source Table | Consuming Engine | Usage Location | Status |
|-------|--------------|------------------|----------------|--------|
| Arm Muscle Mass | `body_composition.segmental_composition` | ❌ NONE | N/A | **NOT USED** |
| Leg Muscle Mass | `body_composition.segmental_composition` | ❌ NONE | N/A | **NOT USED** |
| Trunk Muscle Mass | `body_composition.segmental_composition` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: Segmental data captured but NOT used.

---

### Expected Usage (NOT Implemented)

| Field | Expected Consumer | Expected Usage | Status |
|-------|------------------|----------------|--------|
| Body Fat % | Nutrition Service | Calorie/macro calculation | **NOT IMPLEMENTED** |
| Lean Mass | Nutrition Service | Protein target calculation | **NOT IMPLEMENTED** |
| BMR | Nutrition Service | TDEE calculation | **NOT IMPLEMENTED** |
| Weight | Metabolic Engine | Metabolic risk assessment | **NOT IMPLEMENTED** |
| Visceral Fat | Metabolic Engine | Metabolic risk assessment | **NOT IMPLEMENTED** |
| Lean Mass | Workout Engine | Strength target calculation | **NOT IMPLEMENTED** |
| Body Fat % | Goal Engine | Body recomposition tracking | **NOT IMPLEMENTED** |

---

### Body Composition Summary

**Total Fields Extracted**: 8+ core fields + segmental data  
**Total Fields Used by Engines**: 0  
**Utilization Rate**: 0%  
**Critical Gap**: 100% of body composition data is NOT used by engines

---

## SUPPLEMENT FIELD-TO-ENGINE TRACE

### Supplement Stack Fields

| Field | Source Table | Consuming Engine | Usage Location | Status |
|-------|--------------|------------------|----------------|--------|
| Supplement Name | `supplement_baseline` | Supplement Engine | `supplementEngineService:88-90` | ✅ Basic usage |
| Ingredient | `supplement_baseline` | ❌ NONE | N/A | **NOT USED** |
| Dose | `supplement_baseline` | ❌ NONE | N/A | **NOT USED** |
| Frequency | `supplement_baseline` | ❌ NONE | N/A | **NOT USED** |
| Timing | `supplement_baseline` | ❌ NONE | N/A | **NOT USED** |
| Purpose | `supplement_baseline` | ❌ NONE | N/A | **NOT USED** |
| Category | `supplement_baseline` | ❌ NONE | N/A | **NOT USED** |

**Critical Finding**: Only supplement NAME is used (basic presence check). Ingredient, dose, frequency, timing NOT used.

---

### Supplement Engine Usage Pattern

**Evidence**:
```typescript
// supplementEngineService.ts:88-90
const magnesiumPresent = currentStack?.items.some(item =>
  item.supplementName.toLowerCase().includes('magnesium')
);
```

**Analysis**: Engine only checks if supplement NAME contains a keyword. Does NOT check:
- Ingredient composition
- Dosage adequacy
- Frequency appropriateness
- Timing optimization
- Contraindications

---

### Bloodwork-to-Supplement Integration

| Field | Source | Consuming Engine | Usage Location | Status |
|-------|--------|------------------|----------------|--------|
| Bloodwork Concerns | Context (indirect) | Supplement Engine | `supplementEngineService:66-85` | ⚠️ Indirect only |

**Evidence**:
```typescript
// supplementEngineService.ts:66-85
const bloodworkConcerns = context?.bloodworkConcerns ?? [];
if (bloodworkConcerns.length > 0) {
  for (const concern of bloodworkConcerns) {
    if (concern.severity === 'high' || concern.severity === 'critical') {
      recommendations.push({
        supplementName: concern.marker,
        action: 'review',
        rationale: `Bloodwork shows ${concern.severity} concern...`
      });
    }
  }
}
```

**Analysis**: Bloodwork concerns passed via context, not directly queried. Limited to high/critical severity only.

---

### Supplement Summary

**Total Fields Extracted**: 7+ per supplement  
**Total Fields Used by Engines**: 1 (supplement name, basic check only)  
**Utilization Rate**: ~14%  
**Critical Gap**: 86% of supplement data is NOT used intelligently

---

## WORKOUT FIELD-TO-ENGINE TRACE

### Program Structure Fields

| Field | Source Table | Consuming Engine | Usage Location | Status |
|-------|--------------|------------------|----------------|--------|
| Program Name | `workout_baseline` | Workout Engine | `workoutEngineService` | ✅ Used |
| Split Type | `workout_baseline` | Workout Engine | `workoutEngineService` | ✅ Used |
| Days Per Week | `workout_baseline` | Workout Engine, Adherence | Multiple | ✅ Used |
| Program Structure | `workout_baseline.program_structure` | Workout Today | `workoutTodayIntegratedService` | ✅ Used |

**Finding**: Program-level fields are well-used.

---

### Exercise-Level Fields

| Field | Source | Consuming Engine | Usage Location | Status |
|-------|--------|------------------|----------------|--------|
| Exercise Name | `workout_baseline.exercises` | Workout Today | `workoutTodayIntegratedService` | ✅ Used |
| Sets | `workout_baseline.exercises` | Workout Today | `workoutTodayIntegratedService` | ⚠️ Partial |
| Reps | `workout_baseline.exercises` | Workout Today | `workoutTodayIntegratedService` | ⚠️ Partial |
| Weight | `workout_baseline.exercises` | ❌ NONE | N/A | **NOT TRACKED** |
| Rest Periods | `workout_baseline.exercises` | ❌ NONE | N/A | **NOT USED** |
| Progression Notes | `workout_baseline.exercises` | ❌ NONE | N/A | **NOT USED** |
| Target Muscles | `workout_baseline.exercises` | Joint Engine | Indirect | ⚠️ Partial |

**Finding**: Exercise names used, but set/rep/weight progression NOT systematically tracked.

---

### Cross-Engine Workout Usage

| Engine | Fields Used | Usage Pattern | Status |
|--------|-------------|---------------|--------|
| Workout Engine | Program structure, split type | Recommendation generation | ✅ Good |
| Workout Today | Full program details | Daily execution | ✅ Good |
| Recovery Engine | Training load (indirect) | Recovery scoring | ✅ Good |
| Stress Engine | CNS load (indirect) | Stress scoring | ✅ Good |
| Joint Engine | Exercise selection (indirect) | Joint risk assessment | ✅ Good |
| Adherence Engine | Training frequency | Adherence tracking | ✅ Good |

**Finding**: BEST cross-engine integration of all 4 domains.

---

### Workout Tracking vs. Baseline

| Field | Baseline Source | Tracking Source | Integration | Status |
|-------|----------------|-----------------|-------------|--------|
| Exercise | `workout_baseline` | `workout_tracking` | ⚠️ Partial | **DISCONNECTED** |
| Sets Completed | N/A | `workout_tracking` | ⚠️ Partial | **DISCONNECTED** |
| Reps Completed | N/A | `workout_tracking` | ⚠️ Partial | **DISCONNECTED** |
| Weight Used | N/A | `workout_tracking` | ⚠️ Partial | **DISCONNECTED** |

**Finding**: Workout tracking exists but NOT strongly connected to baseline program for progression analysis.

---

### Workout Summary

**Total Fields Extracted**: 10+ per exercise  
**Total Fields Used by Engines**: 6-7 (program-level well-used, exercise-level partial)  
**Utilization Rate**: ~60-70%  
**Gap**: Exercise-level progression tracking incomplete

---

## CROSS-DOMAIN ENGINE CONSUMPTION SUMMARY

### Engine-by-Engine Uploaded Data Consumption

| Engine | Bloodwork | Body Composition | Supplements | Workout | Total Domains |
|--------|-----------|------------------|-------------|---------|---------------|
| **Metabolic** | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | **0/4** |
| **Cardiovascular (new)** | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | **0/4** |
| **Cardiovascular (legacy)** | ✅ 17% | ❌ 0% | ❌ 0% | ❌ 0% | **1/4** |
| **Sexual Health (new)** | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | **0/4** |
| **Sexual Health (legacy)** | ✅ 7% | ❌ 0% | ❌ 0% | ❌ 0% | **1/4** |
| **Supplement** | ⚠️ Indirect | ❌ 0% | ⚠️ 14% | ❌ 0% | **1/4** |
| **Nutrition** | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | **0/4** |
| **Recovery** | ❌ 0% | ❌ 0% | ❌ 0% | ✅ Indirect | **1/4** |
| **Stress** | ❌ 0% | ❌ 0% | ❌ 0% | ✅ Indirect | **1/4** |
| **Joint** | ❌ 0% | ❌ 0% | ❌ 0% | ✅ Indirect | **1/4** |
| **Workout** | ❌ 0% | ❌ 0% | ❌ 0% | ✅ 70% | **1/4** |
| **Adherence** | ❌ 0% | ❌ 0% | ❌ 0% | ✅ Indirect | **1/4** |

**Critical Finding**: 
- **New baseline-aware engines**: 0/4 domains consumed
- **Legacy engines**: 1/4 domains consumed (bloodwork only, partial)
- **Workout domain**: Best integration (1/4 domains, but deeply used)
- **Overall**: Massive underutilization across all engines

---

## DATA FLOW PATHS

### Bloodwork: Upload → Storage → ❌ DEAD END

```
User Upload
  ↓
POST /bloodwork/upload
  ↓
bloodworkDocumentService
  ↓
OCR Service (extractTextFromBuffer)
  ↓
Pattern Matching (tryPatternMatching) OR AI Parsing (parseWithAI)
  ↓
Normalization (normalizeBloodworkMarker)
  ↓
bloodwork_results table (INSERT)
  ↓
bloodworkTrendService (calculateBloodworkTrend) → ❌ NOT consumed by engines
  ↓
bloodworkRecommendationService (generateBloodworkRecommendations) → ❌ NOT in daily brief
  ↓
❌ DEAD END - Not consumed by 10 core engines
```

**Broken Links**:
1. Trend service → Engines (NO CONNECTION)
2. Recommendation service → Daily brief (NO CONNECTION)
3. bloodwork_results → New engines (NO CONNECTION)

---

### Body Composition: Upload → Storage → ❌ DEAD END

```
User Upload
  ↓
POST /body-composition/upload
  ↓
bodyCompositionService
  ↓
AI Parsing (bodyCompositionAIParser) OR Pattern Matching
  ↓
body_composition table (INSERT)
  ↓
❌ DEAD END - Not consumed by any engine
```

**Broken Links**:
1. body_composition table → Nutrition Engine (NO CONNECTION)
2. body_composition table → Metabolic Engine (NO CONNECTION)
3. body_composition table → Goal Engine (NO CONNECTION)
4. No trend service exists

---

### Supplements: Upload → Storage → ⚠️ PARTIAL USAGE

```
User Upload
  ↓
POST /supplements/upload
  ↓
supplementDocumentService
  ↓
Excel Parsing (supplementExcelParser)
  ↓
supplement_baseline table (INSERT)
  ↓
Supplement Engine (basic name check only) → ⚠️ PARTIAL
  ↓
❌ NOT consumed by other engines
```

**Broken Links**:
1. Ingredient/dose/timing fields → Supplement Engine (NOT USED)
2. supplement_baseline → Sexual Health Engine (NO CONNECTION)
3. supplement_baseline → Cardiovascular Engine (NO CONNECTION)
4. supplement_baseline → Adherence Engine (NO CONNECTION)

---

### Workout: Upload → Storage → ✅ MULTI-ENGINE USAGE

```
User Upload
  ↓
POST /workouts/upload
  ↓
workoutDocumentService
  ↓
Excel Parsing (workoutExcelParser)
  ↓
workout_baseline table (INSERT)
  ↓
Workout Engine → ✅ GOOD
  ↓
Workout Today → ✅ GOOD
  ↓
Recovery/Stress/Joint/Adherence Engines → ✅ GOOD (indirect)
  ↓
⚠️ Execution layer partially disconnected from source program
```

**Partial Links**:
1. Exercise-level progression → Adaptive logic (WEAK CONNECTION)
2. Set/rep/weight tracking → Progression analysis (WEAK CONNECTION)

---

## CRITICAL INSIGHTS

### 1. Baseline Profile Migration Lost Uploaded Data Integration
**Evidence**: New baseline-aware engines consume 0/4 uploaded data domains.

**Before Migration** (Legacy):
- `calculateCardiovascular()`: Used bloodwork lipid panel
- `calculateSexualHealth()`: Used bloodwork testosterone

**After Migration** (New):
- `getCardiovascularRecommendation()`: Does NOT use bloodwork
- `getSexualHealthRecommendation()`: Does NOT use bloodwork

**Impact**: Migration improved demographic personalization but LOST health data personalization.

---

### 2. Trend and Recommendation Services Are Isolated
**Evidence**: Comprehensive services exist but NOT consumed.

**Bloodwork Trend Service**: 516 lines, calculates trends for all markers → NOT consumed by engines  
**Bloodwork Recommendation Service**: 694 lines, generates recommendations → NOT in daily brief

**Impact**: Intelligence exists but isolated from user experience.

---

### 3. Body Composition Is Completely Unused
**Evidence**: 0% utilization despite structured storage.

**Expected**: Nutrition uses body fat % for calorie/macro calculations  
**Actual**: Nutrition uses baseline profile defaults only

**Impact**: Users upload body composition but see no personalization.

---

### 4. Workout Domain Is Best Integrated
**Evidence**: Multi-engine consumption, cross-engine intelligence.

**Success Pattern**: 
- Structured storage (program, days, exercises)
- Workout Engine consumes baseline
- Workout Today generates daily execution
- Recovery/Stress/Joint engines use workout context
- Adherence tracks workout adherence

**Lesson**: This pattern should be replicated for other domains.

---

## RECOMMENDATIONS

### Immediate Actions (Critical)
1. **Integrate bloodwork into 4 engines**: Metabolic, Cardiovascular, Sexual Health, Supplement
2. **Integrate body composition into Nutrition**: Use actual body fat % for calculations
3. **Surface bloodwork recommendations**: Add to daily brief/control tower

### Pattern to Follow
Use Workout domain integration as the model:
1. Structured storage ✅
2. Service layer ✅
3. Engine consumption ✅
4. Cross-engine intelligence ✅
5. Daily execution ✅

Apply this pattern to Bloodwork and Body Composition.
