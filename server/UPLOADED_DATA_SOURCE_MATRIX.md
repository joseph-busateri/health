# Uploaded Data Source Utilization Matrix

**Date**: April 6, 2026  
**Purpose**: Domain-by-domain detailed analysis of capture, persistence, engine usage, and intelligent usage

---

## BLOODWORK DOMAIN

### Data Capture ✅ PRODUCTION-GRADE
**Status**: Comprehensive extraction pipeline

| Component | Implementation | Status |
|-----------|---------------|--------|
| Upload Endpoint | `POST /bloodwork/upload` | ✅ Exists |
| OCR Service | `ocrService.ts` | ✅ Exists |
| AI Parser | `bloodworkAIParser.ts` | ✅ Exists |
| Pattern Matching | `bloodworkPatternMatching.ts` | ✅ Exists |
| Normalization | `bloodworkNormalizationService.ts` | ✅ Exists |
| Extraction Service | `bloodworkExtractionService.ts` (934 lines) | ✅ Exists |

**Biomarkers Extracted** (30+ markers):
- **Lipid Panel**: Total cholesterol, LDL, HDL, triglycerides, cholesterol ratio, ApoB, Lp(a)
- **Metabolic**: Glucose, A1C, insulin, fasting glucose
- **Hormonal**: Total testosterone, free testosterone, estradiol, SHBG, PSA
- **Hematology**: CBC markers, hematocrit, hemoglobin, RBC, WBC
- **Inflammation**: hsCRP, ESR
- **Liver**: ALT, AST, GGT, bilirubin
- **Kidney**: Creatinine, BUN, eGFR
- **Vitamins**: Vitamin D, B12, folate
- **Thyroid**: TSH, T3, T4
- **Electrolytes**: Sodium, potassium, calcium, magnesium

**Extraction Methods**:
1. Pattern matching (fastest, high confidence for standard formats)
2. AI parsing (fallback, handles non-standard formats)
3. Fallback defaults (lowest confidence)

**Confidence Scoring**: ✅ Implemented (0.0-1.0 scale)

---

### Structured Persistence ✅ PRODUCTION-GRADE
**Status**: Comprehensive normalized storage

| Table | Fields | Status |
|-------|--------|--------|
| `bloodwork_documents` | Document metadata, upload info | ✅ Exists |
| `bloodwork_results` | Individual biomarker results | ✅ Exists |
| `bloodwork_panels` | Panel groupings | ✅ Exists |
| `bloodwork_recommendations` | Generated recommendations | ✅ Exists |

**bloodwork_results Schema**:
- `id`, `document_id`, `panel_id`, `user_id`
- `raw_test_name`, `normalized_test_name`
- `category`, `sub_category`
- `value_text`, `value_numeric`, `unit`
- `reference_range_low`, `reference_range_high`, `reference_range_text`
- `abnormal_flag`, `abnormal_flag_source`
- `confidence`, `test_date`, `lab_timestamp`
- `source`, `source_lab`, `notes`
- `created_at`, `updated_at`

**Normalization**: ✅ Comprehensive
- 30+ normalized marker names
- Category classification (cardiovascular, metabolic, hormonal, hematology, etc.)
- Sub-category classification
- Panel grouping

**Queryability**: ✅ Excellent
- By user_id
- By normalized_test_name
- By category
- By date range
- By document_id

---

### Engine Consumption ⚠️ LIMITED (CRITICAL GAP)
**Status**: Only legacy functions consume bloodwork, new engines do NOT

| Engine | Consumption | Method | Status |
|--------|-------------|--------|--------|
| Metabolic Engine | ❌ NONE | N/A | **CRITICAL GAP** |
| Cardiovascular Engine (new) | ❌ NONE | N/A | **CRITICAL GAP** |
| Cardiovascular (legacy) | ✅ Lipid Panel | `calculateCardiovascular()` | Legacy only |
| Sexual Health Engine (new) | ❌ NONE | N/A | **CRITICAL GAP** |
| Sexual Health (legacy) | ✅ Testosterone | `calculateSexualHealth()` | Legacy only |
| Supplement Engine | ⚠️ Minimal | Bloodwork concerns from context | Indirect only |
| Nutrition Engine | ❌ NONE | N/A | **CRITICAL GAP** |
| Recovery Engine | ❌ NONE | N/A | Gap |
| Stress Engine | ❌ NONE | N/A | Gap |
| Joint Engine | ❌ NONE | N/A | Gap |
| Workout Engine | ❌ NONE | N/A | Gap |
| Adherence Engine | ❌ NONE | N/A | Gap |

**Evidence of Legacy Usage**:
```typescript
// cardiovascularEngineService.ts:593-620
const { data: bloodwork } = await supabase
  .from('bloodwork_results')
  .select('biomarkers')
  .eq('user_id', userId)
  .order('test_date', { ascending: false })
  .limit(1);

lipidPanel: bloodwork?.biomarkers ? {
  totalCholesterol: bloodwork.biomarkers.total_cholesterol,
  ldl: bloodwork.biomarkers.ldl,
  hdl: bloodwork.biomarkers.hdl,
  triglycerides: bloodwork.biomarkers.triglycerides,
  cholesterolRatio: bloodwork.biomarkers.total_cholesterol / bloodwork.biomarkers.hdl
} : undefined
```

**Evidence of New Engine Gap**:
```typescript
// metabolicEngineService.ts - NO bloodwork imports or usage
// cardiovascularEngineService.ts:getCardiovascularRecommendation() - NO bloodwork usage
// sexualHealthEngineService.ts:getSexualHealthRecommendation() - NO bloodwork usage
```

---

### Intelligence Usage ⚠️ FRAGMENTED
**Status**: Trend and recommendation services exist but isolated from engines

| Intelligence Layer | Implementation | Engine Integration | Status |
|-------------------|----------------|-------------------|--------|
| **Trend Analysis** | ✅ `bloodworkTrendService.ts` (516 lines) | ❌ NOT consumed by engines | **ISOLATED** |
| **Recommendations** | ✅ `bloodworkRecommendationService.ts` (694 lines) | ❌ NOT in daily brief | **ISOLATED** |
| **Scoring** | ❌ Not used in engine scoring | N/A | **MISSING** |
| **Evidence Building** | ❌ Not used in evidence summaries | N/A | **MISSING** |
| **AI Enrichment** | ❌ Not used in AI prompts | N/A | **MISSING** |
| **Prioritization** | ❌ Not used in recommendation prioritization | N/A | **MISSING** |
| **Daily Brief** | ❌ Not surfaced in control tower | N/A | **MISSING** |
| **Supplement Guidance** | ⚠️ Minimal (concerns only) | Supplement Engine | **PARTIAL** |
| **Nutrition Adjustments** | ❌ Not used | N/A | **MISSING** |

**Trend Analysis Capabilities** (Exists but Unused):
- Calculates trend direction (improving, worsening, stable, insufficient_data)
- Calculates absolute and percent change
- Tracks data points over time
- Generates trend summaries
- Categorizes by marker type

**Recommendation Capabilities** (Exists but Isolated):
- Generates severity-based recommendations (critical, high, moderate, low)
- AI-enhanced recommendation text
- Action items
- Rationale
- Source document tracking

---

### Gaps and Risks 🔴 CRITICAL

**Critical Gaps**:
1. **Baseline-aware engines don't consume bloodwork** - Migration to new architecture lost bloodwork integration
2. **Trend intelligence isolated** - Comprehensive trend service exists but not fed to engines
3. **Recommendations isolated** - Bloodwork recommendations not surfaced in daily brief/control tower
4. **No scoring integration** - Bloodwork doesn't influence engine scores
5. **No AI enrichment** - Bloodwork not used in AI prompts for personalization

**Risks**:
- Users upload bloodwork but don't see it reflected in recommendations
- Valuable health data underutilized
- Engines make recommendations without critical health context (e.g., high cholesterol, low testosterone)
- Technical debt: Legacy functions use bloodwork, new functions don't

**Remediation Priority**: 🔴 **CRITICAL** - Fix before device integration

---

## BODY COMPOSITION DOMAIN

### Data Capture ✅ FUNCTIONAL
**Status**: Upload and parsing infrastructure exists

| Component | Implementation | Status |
|-----------|---------------|--------|
| Upload Endpoint | `POST /body-composition/upload` | ✅ Exists |
| AI Parser | `bodyCompositionAIParser.ts` | ✅ Exists |
| Pattern Matching | `bodyCompositionPatternMatching.ts` | ✅ Exists |
| Document Service | `bodyCompositionService.ts` | ✅ Exists |

**Fields Extracted**:
- Weight (lbs/kg)
- Body fat percentage
- Lean mass
- Skeletal muscle mass
- Water percentage
- Visceral fat level
- BMI
- Basal metabolic rate
- Segmental composition (arms, legs, trunk)

**Extraction Methods**:
1. Pattern matching (InBody, DEXA, Tanita formats)
2. AI parsing (fallback)

---

### Structured Persistence ✅ FUNCTIONAL
**Status**: Structured storage exists

| Table | Fields | Status |
|-------|--------|--------|
| `body_composition` | All composition fields | ✅ Exists |

**Schema**:
- `id`, `user_id`, `document_id`
- `measurement_date`
- `weight`, `body_fat_percent`, `lean_mass`, `skeletal_muscle_mass`
- `water_percent`, `visceral_fat`, `bmi`, `bmr`
- `segmental_composition` (JSONB)
- `source`, `device_type`
- `created_at`, `updated_at`

**Queryability**: ✅ Good
- By user_id
- By date range
- By source

---

### Engine Consumption ❌ MINIMAL (CRITICAL GAP)
**Status**: No evidence of engine consumption

| Engine | Consumption | Status |
|--------|-------------|--------|
| Nutrition Engine | ❌ NONE | **CRITICAL GAP** |
| Metabolic Engine | ❌ NONE | **CRITICAL GAP** |
| Workout Engine | ❌ NONE | Gap |
| Cardiovascular Engine | ❌ NONE | Gap |
| Goal-Driven Optimization | ❌ NONE | Gap |
| All Other Engines | ❌ NONE | Gap |

**Expected Usage (Not Implemented)**:
- Nutrition: Use body fat % for calorie/macro calculations
- Metabolic: Use body composition for metabolic risk assessment
- Workout: Use lean mass for strength targets
- Goals: Use for body recomposition tracking

---

### Intelligence Usage ❌ MINIMAL (CRITICAL GAP)
**Status**: Stored and displayed only, not intelligently used

| Intelligence Layer | Implementation | Status |
|-------------------|----------------|--------|
| **Trend Analysis** | ❌ NO trend service | **MISSING** |
| **Calorie Calculation** | ❌ Not used | **MISSING** |
| **Macro Calculation** | ❌ Not used | **MISSING** |
| **Body Recomposition** | ❌ Not used | **MISSING** |
| **Metabolic Risk** | ❌ Not used | **MISSING** |
| **Progress Tracking** | ❌ No trend service | **MISSING** |
| **Goal Alignment** | ❌ Not used | **MISSING** |
| **Workout Adjustments** | ❌ Not used | **MISSING** |

---

### Gaps and Risks 🔴 CRITICAL

**Critical Gaps**:
1. **No engine consumption** - Body composition stored but not used
2. **No trend tracking** - Unlike bloodwork, no trend service exists
3. **Not used for nutrition** - Calorie/macro calculations don't use actual body composition
4. **Not used for goals** - Body recomposition goals not tracked against actual data
5. **Displayed only** - Likely just shown to user, not reasoned over

**Risks**:
- Users upload body composition but see no impact on recommendations
- Nutrition recommendations generic instead of body-composition-aware
- Goal tracking disconnected from actual progress

**Remediation Priority**: 🔴 **CRITICAL** - Fix before device integration

---

## SUPPLEMENTS DOMAIN

### Data Capture ✅ FUNCTIONAL
**Status**: Upload and parsing infrastructure exists

| Component | Implementation | Status |
|-----------|---------------|--------|
| Upload Endpoint | `POST /supplements/upload` | ✅ Exists |
| Excel Parser | `supplementExcelParser.ts` | ✅ Exists |
| Document Service | `supplementDocumentService.ts` | ✅ Exists |
| Baseline Service | `supplementBaselineService.ts` | ✅ Exists |

**Fields Extracted**:
- Supplement name
- Ingredient(s)
- Dose
- Frequency
- Timing
- Purpose/category
- Brand
- Notes

**Extraction Methods**:
1. Excel parsing (structured format)
2. Manual entry

---

### Structured Persistence ✅ FUNCTIONAL
**Status**: Structured storage exists

| Table | Fields | Status |
|-------|--------|--------|
| `supplement_baseline` | Supplement stack | ✅ Exists |
| `supplement_documents` | Document metadata | ✅ Exists |

**Schema**:
- `id`, `user_id`, `document_id`
- `supplement_name`, `ingredient`, `dose`, `unit`
- `frequency`, `timing`, `purpose`, `category`
- `brand`, `notes`
- `created_at`, `updated_at`

**Queryability**: ✅ Good
- By user_id
- By category
- By ingredient

---

### Engine Consumption ⚠️ LIMITED
**Status**: Used by Supplement Engine only, minimal cross-engine usage

| Engine | Consumption | Status |
|--------|-------------|--------|
| Supplement Engine | ✅ Stack analysis | **BASIC** |
| Sexual Health Engine | ❌ NONE | Gap |
| Cardiovascular Engine | ❌ NONE | Gap |
| Metabolic Engine | ❌ NONE | Gap |
| Recovery Engine | ❌ NONE | Gap |
| Adherence Engine | ❌ NONE | Gap |

**Supplement Engine Usage**:
- Reads supplement baseline
- Uses bloodwork concerns from context (indirect)
- Generates basic recommendations (add/remove/review)
- Limited to high-level stack awareness

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

---

### Intelligence Usage ⚠️ BASIC
**Status**: Stack stored but not deeply reasoned over

| Intelligence Layer | Implementation | Status |
|-------------------|----------------|--------|
| **Stack Analysis** | ⚠️ Basic (stored) | **PARTIAL** |
| **Overlap Detection** | ❌ Not evident | **MISSING** |
| **Contraindication** | ❌ Not implemented | **MISSING** |
| **Adherence Tracking** | ❌ Not implemented | **MISSING** |
| **Goal Alignment** | ❌ Not used | **MISSING** |
| **Recovery Reasoning** | ❌ Not used | **MISSING** |
| **Bloodwork Feedback** | ⚠️ Minimal (concerns) | **PARTIAL** |
| **Timing Optimization** | ❌ Not implemented | **MISSING** |
| **Dose-Aware Logic** | ❌ Not implemented | **MISSING** |
| **Ingredient-Level** | ❌ Not implemented | **MISSING** |

---

### Gaps and Risks 🟡 HIGH PRIORITY

**Critical Gaps**:
1. **Not deeply reasoned over** - Stack stored but no ingredient-level intelligence
2. **No dose-aware logic** - Recommendations don't consider dosing
3. **No contraindication checking** - No medication interaction awareness
4. **Limited cross-engine usage** - Only Supplement Engine uses stack
5. **No adherence tracking** - Adherence Engine doesn't track supplement adherence
6. **No timing optimization** - Timing field captured but not used

**Risks**:
- Unsafe recommendations (no contraindication checking)
- Missed optimization opportunities (timing, dosing)
- Incomplete adherence picture

**Remediation Priority**: 🟡 **HIGH** - Fix after critical items

---

## WORKOUT DOMAIN

### Data Capture ✅ PRODUCTION-GRADE
**Status**: Comprehensive upload and parsing infrastructure

| Component | Implementation | Status |
|-----------|---------------|--------|
| Upload Endpoint | `POST /workouts/upload` | ✅ Exists |
| Excel Parser | `workoutExcelParser.ts` | ✅ Exists |
| Document Service | `workoutDocumentService.ts` | ✅ Exists |
| Baseline Service | `workoutBaselineService.ts` | ✅ Exists |

**Fields Extracted**:
- Program name
- Workout split (e.g., PPL, Upper/Lower)
- Day labels (e.g., Push, Pull, Legs)
- Exercises
- Sets
- Reps
- Weights
- Rest periods
- Progression notes
- Target muscles
- Schedule cadence

**Extraction Methods**:
1. Excel parsing (structured format)
2. Manual entry

**Granularity**: ✅ Excellent
- Program-level
- Day-level
- Exercise-level
- Set-level

---

### Structured Persistence ✅ PRODUCTION-GRADE
**Status**: Comprehensive structured storage

| Table | Fields | Status |
|-------|--------|--------|
| `workout_baseline` | Program details | ✅ Exists |
| `workout_documents` | Document metadata | ✅ Exists |

**Schema**:
- `id`, `user_id`, `document_id`
- `program_name`, `split_type`, `days_per_week`
- `program_structure` (JSONB - full program details)
- `exercises` (JSONB array)
- `schedule`, `notes`
- `created_at`, `updated_at`

**Queryability**: ✅ Excellent
- By user_id
- By program_name
- By split_type
- JSONB queries for exercises

---

### Engine Consumption ✅ MULTI-ENGINE (BEST OF 4 DOMAINS)
**Status**: Used by multiple engines

| Engine | Consumption | Status |
|--------|-------------|--------|
| Workout Engine | ✅ Program structure | **GOOD** |
| Workout Today | ✅ Daily execution | **GOOD** |
| Recovery Engine | ✅ Training load context | **GOOD** |
| Stress Engine | ✅ CNS load context | **GOOD** |
| Joint Engine | ✅ Exercise selection | **GOOD** |
| Adherence Engine | ✅ Adherence tracking | **GOOD** |
| Autonomous Optimization | ⚠️ Limited | **PARTIAL** |

**Evidence of Multi-Engine Usage**:
- Workout Engine: Reads workout baseline for program structure
- Workout Today: Generates daily workouts from baseline
- Recovery/Stress/Joint: Use workout context for recommendations
- Adherence: Tracks workout adherence

---

### Intelligence Usage ✅ GOOD (BEST OF 4 DOMAINS)
**Status**: Multi-engine usage with some gaps

| Intelligence Layer | Implementation | Status |
|-------------------|----------------|--------|
| **Daily Generation** | ✅ Workout Today | **GOOD** |
| **Exercise Substitution** | ⚠️ Partial | **PARTIAL** |
| **Volume/Intensity Adjustment** | ⚠️ Partial | **PARTIAL** |
| **Recovery-Aware Planning** | ✅ Used | **GOOD** |
| **Joint-Aware Modifications** | ✅ Used | **GOOD** |
| **Adaptive Learning** | ⚠️ Limited | **PARTIAL** |
| **Predictive Workload** | ❌ Not evident | **MISSING** |
| **Adherence Analysis** | ✅ Used | **GOOD** |
| **Progression Tracking** | ⚠️ Limited | **PARTIAL** |

---

### Gaps and Risks 🟡 MEDIUM PRIORITY

**Gaps**:
1. **Execution layer partially disconnected** - Workout Today may not fully use uploaded program details
2. **Exercise-level data underutilized** - Set/rep/weight progression not deeply tracked
3. **No true closed-loop feedback** - History doesn't strongly feed adaptive logic
4. **Autonomous optimization limited** - Predictive workload modeling not evident
5. **Progression tracking limited** - Weight/rep progression not systematically tracked

**Risks**:
- User uploads detailed program but sees generic workouts
- Missed adaptive learning opportunities
- Progression not optimized

**Remediation Priority**: 🟡 **MEDIUM** - Fix after critical and high priority items

---

## SUMMARY MATRIX

| Domain | Capture | Persistence | Engine Usage | Intelligence | Maturity | Priority |
|--------|---------|-------------|--------------|--------------|----------|----------|
| **Bloodwork** | ✅ Excellent | ✅ Excellent | ⚠️ Limited (Legacy only) | ⚠️ Fragmented | Level 3-4 | 🔴 Critical |
| **Body Composition** | ✅ Good | ✅ Good | ❌ Minimal | ❌ Minimal | Level 2-3 | 🔴 Critical |
| **Supplements** | ✅ Good | ✅ Good | ⚠️ Limited (1 engine) | ⚠️ Basic | Level 3 | 🟡 High |
| **Workout** | ✅ Excellent | ✅ Excellent | ✅ Multi-engine | ✅ Good | Level 4-5 | 🟡 Medium |

**Overall Assessment**: Infrastructure is strong, but intelligent usage is fragmented. Workout domain is best integrated, Bloodwork and Body Composition have critical gaps.
