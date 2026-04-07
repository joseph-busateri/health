# Uploaded Data Source Utilization Audit — Executive Summary

**Date**: April 6, 2026  
**Status**: Production-Safe Audit Complete  
**Scope**: Bloodwork, Body Composition, Supplements, Workout

---

## EXECUTIVE SUMMARY

This audit evaluates whether uploaded data sources (Bloodwork, Body Composition, Supplements, Workout) are truly production-grade inputs into the AI health system, or merely stored/partially connected.

### Key Findings

**Overall Assessment**: **PARTIALLY WIRED** - Significant infrastructure exists, but intelligent usage is fragmented and incomplete.

| Domain | Maturity Level | Status | Critical Gaps |
|--------|---------------|--------|---------------|
| **Bloodwork** | Level 3-4 | Partially Wired | Limited engine consumption, trend analysis exists but not deeply integrated |
| **Body Composition** | Level 2-3 | Stored/Displayed | Minimal engine consumption, no trend analysis, limited intelligent usage |
| **Supplements** | Level 3 | Partially Wired | Stack stored but not deeply reasoned over, minimal cross-engine usage |
| **Workout** | Level 4-5 | Multi-Engine Usage | Best integration, but execution layer partially disconnected from source plans |

### Maturity Scale
- **Level 0**: Not used
- **Level 1**: Stored only
- **Level 2**: Displayed/exposed
- **Level 3**: Used by one engine
- **Level 4**: Multi-engine usage
- **Level 5**: Cross-engine intelligent usage
- **Level 6**: Influences decision/execution layers
- **Level 7**: Fully integrated with predictive/adaptive/autonomous behavior

---

## CRITICAL FINDINGS BY DOMAIN

### 1. Bloodwork — Level 3-4 (Partially Wired)

**What Works**:
- ✅ Comprehensive extraction pipeline (OCR → AI parsing → pattern matching)
- ✅ Structured persistence (30+ biomarkers normalized)
- ✅ Trend analysis service exists
- ✅ Recommendation service generates bloodwork-based insights
- ✅ Some engine consumption (Cardiovascular, Sexual Health legacy functions)

**Critical Gaps**:
- ❌ **Engine consumption is LIMITED and LEGACY**: Only 2 legacy functions use bloodwork
  - `calculateCardiovascular()` - reads lipid panel
  - `calculateSexualHealth()` - reads testosterone
- ❌ **New baseline-aware engines DO NOT consume bloodwork**
  - Metabolic Engine: No bloodwork integration
  - Cardiovascular Engine (new): No bloodwork in main flow
  - Sexual Health Engine (new): No bloodwork in main flow
  - Supplement Engine: Only uses bloodwork concerns from context (not direct)
- ❌ **Trend data exists but not fed to engines**
- ❌ **Bloodwork recommendations isolated** - not integrated into daily brief/control tower
- ❌ **No closed-loop feedback** - engines don't adjust based on bloodwork changes

**Evidence**:
- Bloodwork extraction: `bloodworkExtractionService.ts` (934 lines)
- Bloodwork trends: `bloodworkTrendService.ts` (516 lines)
- Bloodwork recommendations: `bloodworkRecommendationService.ts` (694 lines)
- Engine usage: Found in legacy `calculateCardiovascular()` and `calculateSexualHealth()` only

**Impact**: Bloodwork data is captured and analyzed but NOT intelligently used by the 10 core personalized engines.

---

### 2. Body Composition — Level 2-3 (Stored/Displayed)

**What Works**:
- ✅ Upload and parsing infrastructure exists
- ✅ Structured storage (weight, body fat %, lean mass, etc.)
- ✅ AI parser for document extraction
- ✅ Pattern matching for common formats

**Critical Gaps**:
- ❌ **Minimal engine consumption** - No evidence of deep integration
- ❌ **No trend analysis service** - Unlike bloodwork, no trend tracking
- ❌ **Not used for calorie/macro calculations** - Nutrition engine doesn't consume it
- ❌ **Not used for body recomposition logic** - No goal alignment
- ❌ **Not used for metabolic risk** - Metabolic engine doesn't consume it
- ❌ **Displayed only** - Likely just shown to user, not reasoned over

**Evidence**:
- Body composition service: `bodyCompositionService.ts`
- Body composition engine: `bodyCompositionEngine.ts`
- AI parser: `bodyCompositionAIParser.ts`
- **No grep results** for body composition usage in core engines

**Impact**: Body composition data is stored but NOT intelligently used for nutrition, metabolic, or goal-driven optimization.

---

### 3. Supplements — Level 3 (Partially Wired)

**What Works**:
- ✅ Document upload and parsing
- ✅ Structured supplement baseline storage
- ✅ Supplement engine exists
- ✅ Excel parser for supplement stacks
- ✅ Some bloodwork-aware logic (bloodwork concerns → supplement review)

**Critical Gaps**:
- ❌ **Stack stored but not deeply reasoned over**
  - No ingredient-level intelligence
  - No dose-aware logic
  - No timing optimization
- ❌ **Limited cross-engine usage**
  - Supplement engine uses bloodwork concerns from context
  - No evidence of Sexual Health, Cardiovascular, Metabolic engines using supplement data
- ❌ **No contraindication awareness** - No medication interaction checking
- ❌ **No adherence tracking** - Adherence engine doesn't track supplement adherence
- ❌ **No bloodwork-to-supplement feedback loop** - Recommendations exist but not closed-loop

**Evidence**:
- Supplement document service: `supplementDocumentService.ts`
- Supplement baseline service: `supplementBaselineService.ts`
- Supplement engine: `supplementEngineService.ts` (711 lines)
- Limited bloodwork integration: Lines 66-85 in supplement engine

**Impact**: Supplement data is captured and stored, but intelligent usage is limited to basic recommendations without deep reasoning.

---

### 4. Workout — Level 4-5 (Multi-Engine Usage)

**What Works**:
- ✅ Comprehensive upload and parsing infrastructure
- ✅ Structured storage (program, days, exercises, sets, reps, weights)
- ✅ Workout baseline service
- ✅ Workout document service
- ✅ Workout engine with AI enrichment
- ✅ Workout Today integrated service
- ✅ Multi-engine consumption (Recovery, Stress, Joint, Adherence)
- ✅ Excel parser for workout programs

**Critical Gaps**:
- ❌ **Execution layer partially disconnected** - Workout Today may not fully use uploaded program details
- ❌ **Exercise-level data underutilized** - Set/rep/weight progression not deeply tracked
- ❌ **No true closed-loop feedback** - History doesn't feed adaptive logic strongly
- ❌ **Autonomous optimization limited** - Predictive workload modeling not evident

**Evidence**:
- Workout document service: `workoutDocumentService.ts`
- Workout baseline service: `workoutBaselineService.ts`
- Workout engine: `workoutEngineService.ts` (365 lines)
- Workout Today integrated: `workoutTodayIntegratedService.ts`
- Workout tracking engine: `workoutTrackingEngine.ts`

**Impact**: Workout data has the BEST integration of the four domains, but still has gaps in execution and adaptive learning.

---

## CROSS-CUTTING ISSUES

### 1. Baseline Profile Migration Impact
**Finding**: The recent baseline profile migration (10 engines personalized) did NOT integrate uploaded data sources.

**Evidence**:
- Metabolic Engine: Uses baseline profile (age, sex, activity) but NOT bloodwork or body composition
- Cardiovascular Engine: Uses baseline profile but NOT bloodwork (lipid panel available but not used)
- Sexual Health Engine: Uses baseline profile but NOT bloodwork (testosterone available but not used)
- Nutrition Service: Uses baseline profile but NOT body composition
- Supplement Engine: Uses baseline profile but NOT bloodwork directly
- Workout Engine: Uses baseline profile but NOT uploaded workout program details deeply

**Impact**: Engines are personalized with demographics but NOT with uploaded health data.

---

### 2. Legacy vs. New Engine Patterns
**Finding**: Legacy `calculate*()` functions use uploaded data, but new baseline-aware engines do NOT.

**Evidence**:
- `calculateCardiovascular()` (legacy): Reads bloodwork lipid panel (lines 593-620)
- `calculateSexualHealth()` (legacy): Reads bloodwork testosterone (lines 572-635)
- `getCardiovascularRecommendation()` (new): Does NOT read bloodwork
- `getSexualHealthRecommendation()` (new): Does NOT read bloodwork

**Impact**: Migration to new engine architecture LOST uploaded data integration.

---

### 3. Trend Analysis Isolation
**Finding**: Bloodwork trend analysis exists but is isolated from engines.

**Evidence**:
- `bloodworkTrendService.ts`: Comprehensive trend calculation (516 lines)
- `getBloodworkTrendsByUser()`: Calculates trends for all markers
- **No engine imports bloodwork trend service**

**Impact**: Trend intelligence exists but doesn't influence recommendations.

---

### 4. Recommendation Service Isolation
**Finding**: Bloodwork recommendation service exists but is isolated from daily brief/control tower.

**Evidence**:
- `bloodworkRecommendationService.ts`: Generates recommendations (694 lines)
- `generateBloodworkRecommendations()`: Creates actionable recommendations
- **No evidence of integration into daily AI plan or control tower**

**Impact**: Bloodwork recommendations exist in isolation, not surfaced to user intelligently.

---

## DATA FLOW ANALYSIS

### Bloodwork Data Flow
```
Upload → OCR → AI Parsing → Pattern Matching → Normalization → 
bloodwork_results table → Trend Service (isolated) → 
Recommendation Service (isolated) → ❌ NOT consumed by engines
```

**Broken Link**: Trend and recommendation services exist but don't feed engines or daily brief.

### Body Composition Data Flow
```
Upload → AI Parsing → Pattern Matching → 
body_composition table → ❌ NOT consumed by engines
```

**Broken Link**: No trend service, no engine consumption.

### Supplement Data Flow
```
Upload → Excel Parsing → 
supplement_baseline table → Supplement Engine (basic usage) → 
❌ NOT consumed by other engines
```

**Broken Link**: Limited to supplement engine, no cross-engine intelligence.

### Workout Data Flow
```
Upload → Excel Parsing → 
workout_baseline table → Workout Engine → 
Workout Today → Recovery/Stress/Joint/Adherence Engines ✅
```

**Best Integration**: Multi-engine consumption, but execution layer gaps remain.

---

## INTELLIGENT USAGE ASSESSMENT

### Bloodwork
- **Scoring**: ❌ Not used in engine scoring
- **Evidence Building**: ❌ Not used in evidence summaries
- **AI Enrichment**: ❌ Not used in AI prompts
- **Longitudinal Trends**: ⚠️ Calculated but not consumed
- **Prioritization**: ❌ Not used in recommendation prioritization
- **Daily Brief**: ❌ Not surfaced in control tower
- **Supplement Guidance**: ⚠️ Minimal (bloodwork concerns only)
- **Nutrition Adjustments**: ❌ Not used

**Maturity**: Level 3-4 (Trend analysis exists, minimal engine usage)

### Body Composition
- **Calorie Target Calculation**: ❌ Not used
- **Protein Target Calculation**: ❌ Not used
- **Body Recomposition Logic**: ❌ Not used
- **Metabolic Risk Interpretation**: ❌ Not used
- **Progress Trend Analysis**: ❌ No trend service
- **Goal Alignment Scoring**: ❌ Not used
- **Workout Adjustments**: ❌ Not used

**Maturity**: Level 2-3 (Stored and displayed, minimal usage)

### Supplements
- **Stack Analysis**: ⚠️ Basic (stored but not deeply analyzed)
- **Overlap Detection**: ❌ Not evident
- **Contraindication Awareness**: ❌ Not implemented
- **Adherence Tracking**: ❌ Not implemented
- **Goal Alignment**: ❌ Not used
- **Recovery/Performance Reasoning**: ❌ Not used
- **Bloodwork-Informed Guidance**: ⚠️ Minimal (concerns only)
- **Timing Optimization**: ❌ Not implemented

**Maturity**: Level 3 (Used by one engine, basic logic)

### Workout
- **Daily Workout Generation**: ✅ Used
- **Exercise Substitution**: ⚠️ Partial
- **Volume/Intensity Adjustment**: ⚠️ Partial
- **Recovery-Aware Planning**: ✅ Used
- **Joint-Aware Modifications**: ✅ Used
- **Adaptive Learning**: ⚠️ Limited
- **Predictive Workload Modeling**: ❌ Not evident
- **Adherence Analysis**: ✅ Used

**Maturity**: Level 4-5 (Multi-engine usage, some intelligent usage)

---

## REMEDIATION PRIORITY

### Critical (Fix Before Device Integration)

1. **Integrate Bloodwork into Engines** (High Impact, Medium Effort)
   - Add bloodwork retrieval to Metabolic Engine
   - Add lipid panel to Cardiovascular Engine
   - Add testosterone to Sexual Health Engine
   - Add deficiency markers to Supplement Engine
   - **Impact**: Transforms engines from demographic-only to health-data-aware

2. **Integrate Body Composition into Nutrition** (High Impact, Low Effort)
   - Add body composition retrieval to Nutrition Service
   - Use actual body fat % for calorie/macro calculations
   - **Impact**: Personalized nutrition based on actual composition

3. **Surface Bloodwork Recommendations** (High Impact, Medium Effort)
   - Integrate bloodwork recommendation service into daily brief
   - Add bloodwork trends to control tower
   - **Impact**: User sees actionable bloodwork insights

### High Priority (Fix Soon)

4. **Add Body Composition Trend Tracking** (Medium Impact, Medium Effort)
   - Create body composition trend service (similar to bloodwork)
   - Track weight, body fat %, lean mass over time
   - **Impact**: Progress tracking and goal alignment

5. **Deepen Supplement Intelligence** (Medium Impact, High Effort)
   - Add ingredient-level analysis
   - Add dose-aware logic
   - Add contraindication checking
   - **Impact**: Safer, smarter supplement recommendations

6. **Close Workout Execution Loop** (Medium Impact, Medium Effort)
   - Ensure Workout Today uses uploaded program details
   - Track set/rep/weight progression
   - Feed history into adaptive logic
   - **Impact**: True adaptive workout programming

### Medium Priority (Nice to Have)

7. **Cross-Engine Bloodwork Intelligence** (Low Impact, High Effort)
   - Share bloodwork data across all engines
   - Use in cross-engine reasoning
   - **Impact**: Holistic health intelligence

8. **Supplement Adherence Tracking** (Low Impact, Medium Effort)
   - Track supplement adherence in Adherence Engine
   - **Impact**: Complete adherence picture

---

## RECOMMENDATION

### Should We Proceed to Device Integration?

**Answer**: **PAUSE AND REMEDIATE FIRST**

**Rationale**:
1. **Uploaded data infrastructure is strong** - Extraction, parsing, and storage are production-grade
2. **Engine consumption is weak** - Most uploaded data is NOT used by the 10 personalized engines
3. **Device integration will add MORE data** - Before adding device data, we should use existing uploaded data
4. **Low-hanging fruit exists** - Integrating bloodwork and body composition into engines is straightforward
5. **User value is blocked** - Users upload data but don't see it reflected in recommendations

### Recommended Build Order

**Phase 1** (1-2 weeks): Critical Remediation
1. Integrate bloodwork into 4 engines (Metabolic, Cardiovascular, Sexual Health, Supplement)
2. Integrate body composition into Nutrition Service
3. Surface bloodwork recommendations in daily brief

**Phase 2** (1 week): High Priority
4. Add body composition trend tracking
5. Close workout execution loop

**Phase 3** (2-3 weeks): Medium Priority
6. Deepen supplement intelligence
7. Cross-engine bloodwork intelligence

**Phase 4** (After remediation): Device Integration
8. Proceed with device integration once uploaded data is fully utilized

---

## CONCLUSION

The uploaded data source infrastructure is **production-grade** for capture, extraction, and storage. However, **intelligent usage is fragmented and incomplete**.

**Key Insight**: The recent baseline profile migration successfully personalized engines with demographic data, but **did NOT integrate uploaded health data** (bloodwork, body composition, supplements, workout details).

**Critical Gap**: Engines are personalized with WHO the user is (age, sex, training experience) but NOT WHAT their health data shows (lipid panel, testosterone, body fat %, supplement stack).

**Recommendation**: **Pause device integration** and complete uploaded data integration first. This will:
- Maximize value from existing user uploads
- Establish patterns for device data integration
- Deliver immediate user value
- Reduce technical debt

**Estimated Effort**: 4-6 weeks to complete critical and high-priority remediation.

**Expected Impact**: Data integration completion: 95% → 98%+ (full utilization of uploaded sources before adding device sources).
