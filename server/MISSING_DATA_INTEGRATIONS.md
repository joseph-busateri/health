# Missing Data Integrations

**Purpose**: Identify incomplete or missing data integrations that affect spec completion

---

## CRITICAL MISSING INTEGRATIONS

### 1. Baseline Profile UI
**Priority**: **CRITICAL**  
**Current State**: Manual seeding with hardcoded defaults  
**Spec Requirement**: User-entered demographic and medical profile  
**Impact**: All engines use generic defaults instead of user-specific context

**Missing Fields**:
- Age (currently: hardcoded 35)
- Sex (currently: hardcoded 'male')
- Height (currently: hardcoded 70 inches)
- Weight (currently: hardcoded 180 lbs)
- Medical conditions
- Medications
- Injury history
- TRT usage
- Diabetes status
- Lifestyle context

**Affected Engines**:
- All 10 engines rely on baseline for context
- Metabolic Engine (age, sex critical for calculations)
- Cardiovascular Engine (age, sex for risk scoring)
- Sexual Health Engine (age, TRT usage critical)
- Joint Health Engine (age, injury history)

**Implementation Required**:
- Profile UI screen
- Profile API endpoint
- Profile validation
- Profile persistence
- Integration into `baselineConfigService.ts`

**Effort**: Medium (2-3 days)

---

### 2. Nutrition Baseline UI
**Priority**: **CRITICAL**  
**Current State**: Hardcoded defaults (2800 cal, 200g protein, etc.)  
**Spec Requirement**: User-defined nutrition targets  
**Impact**: Nutrition recommendations based on generic values, not personalized

**Missing Fields**:
- Daily calorie target (currently: 2800)
- Daily protein target (currently: 200g)
- Daily carbs target (currently: 280g)
- Daily fats target (currently: 80g)
- Daily hydration target (currently: 100oz)
- Meal timing preferences
- Dietary restrictions

**Affected Services**:
- Nutrition Today Integrated Service
- Nutrition Engine
- Daily AI Plan nutrition section
- Control Tower nutrition card

**Implementation Required**:
- Nutrition baseline UI screen
- Nutrition baseline API endpoint
- Validation logic
- Persistence in `nutritionTodayIntegratedService.ts`
- Replace seeded defaults with user data

**Effort**: Medium (2-3 days)

---

### 3. Device Data Integration (Apple Watch)
**Priority**: **HIGH**  
**Current State**: Service exists but not connected, engines use interview proxies  
**Spec Requirement**: Real-time device sync for HRV, sleep, heart rate, activity  
**Impact**: Recovery and Cardiovascular engines less accurate without objective metrics

**Missing Data**:
- HRV (currently: mock/placeholder)
- Resting heart rate (currently: mock/placeholder)
- Sleep duration (currently: mock/placeholder)
- Deep sleep / REM sleep (currently: mock/placeholder)
- Active calories (currently: mock/placeholder)
- Steps (currently: mock/placeholder)
- VO2 max (currently: mock/placeholder)

**Affected Engines**:
- Recovery Engine (relies on interview instead of HRV)
- Stress Engine (would benefit from HRV trends)
- Cardiovascular Engine (missing RHR, VO2 max)
- Nutrition Engine (missing activity level)

**Implementation Required**:
- Complete Apple Watch sync integration
- Wire `appleWatchSyncService.ts` to real HealthKit data
- Update engines to consume device data
- Fallback logic when device data unavailable

**Effort**: High (5-7 days)

---

### 4. Blood Pressure Monitoring
**Priority**: **HIGH**  
**Current State**: Not implemented  
**Spec Requirement**: Blood pressure tracking for cardiovascular assessment  
**Impact**: Cardiovascular Engine incomplete without BP data

**Missing Data**:
- Systolic BP
- Diastolic BP
- Heart rate during measurement
- Measurement timestamp
- Trend tracking

**Affected Engines**:
- Cardiovascular Engine (critical input missing)
- Metabolic Engine (BP relevant for metabolic syndrome)

**Implementation Required**:
- Blood pressure entry UI
- Blood pressure API endpoint
- Blood pressure service (`bloodPressureService.ts`)
- Persistence layer
- Integration into Cardiovascular Engine
- Trend analysis

**Effort**: Medium (3-4 days)

---

## HIGH PRIORITY MISSING INTEGRATIONS

### 5. Workout Execution Tracking
**Priority**: **HIGH**  
**Current State**: Not implemented  
**Spec Requirement**: Log actual workout completion, sets, reps, load  
**Impact**: Adherence based on self-report, no objective validation

**Missing Data**:
- Workout completed (boolean)
- Exercises completed (array)
- Sets completed per exercise
- Reps completed per set
- Load used per set
- RPE per exercise
- Workout duration
- Perceived difficulty

**Affected Services**:
- Adherence Engine (uses interview proxy)
- Workout Engine (no actual performance data)
- Strength tracking (manual entry only)
- Progress tracking

**Implementation Required**:
- Workout execution logging UI
- Workout execution API endpoint
- Workout execution service
- Persistence layer
- Integration into Adherence Engine
- Integration into Workout Engine for progressive overload

**Effort**: High (5-7 days)

---

### 6. Meal Logging Integration into Nutrition Engine
**Priority**: **HIGH**  
**Current State**: Meal logging exists but not fully consumed by Nutrition Engine  
**Spec Requirement**: Actual nutrition consumption drives recommendations  
**Impact**: Nutrition Engine uses baseline targets, not actual consumption

**Current Implementation**:
- Meal logging service exists ✅
- OCR extraction working ✅
- Persistence working ✅
- **NOT integrated into Nutrition Engine** ❌

**Missing Integration**:
- Nutrition Engine should consume meal logs
- Calculate actual vs target macros
- Adjust recommendations based on actual consumption
- Trend analysis of nutrition adherence

**Affected Services**:
- Nutrition Engine
- Nutrition Today Integrated Service
- Adherence Engine (nutrition adherence)

**Implementation Required**:
- Wire meal logs into Nutrition Engine
- Calculate actual consumption vs targets
- Adjust nutrition recommendations based on actual data
- Add nutrition adherence scoring

**Effort**: Medium (2-3 days)

---

## MEDIUM PRIORITY MISSING INTEGRATIONS

### 7. Per-Supplement Adherence Tracking
**Priority**: **MEDIUM**  
**Current State**: Overall supplement adherence only (interview)  
**Spec Requirement**: Track adherence per supplement  
**Impact**: Cannot identify which supplements are being skipped

**Missing Data**:
- Per-supplement taken (boolean per day)
- Missed doses per supplement
- Adherence rate per supplement
- Timing adherence

**Affected Services**:
- Supplement Engine
- Adherence Engine

**Implementation Required**:
- Per-supplement adherence UI
- Per-supplement adherence API
- Persistence layer
- Integration into Supplement Engine
- Adherence rate calculation per supplement

**Effort**: Medium (3-4 days)

---

### 8. Baseline Profile Medical History Detail
**Priority**: **MEDIUM**  
**Current State**: Basic fields only  
**Spec Requirement**: Detailed medical history for risk assessment  
**Impact**: Risk engines less accurate without detailed history

**Missing Fields**:
- Family history (cardiovascular, diabetes, cancer)
- Previous injuries (detailed)
- Surgery history (detailed)
- Medication interactions
- Allergy information
- Chronic conditions (detailed)

**Affected Engines**:
- Cardiovascular Engine (family history critical)
- Metabolic Engine (diabetes family history)
- Joint Health Engine (injury history)
- Supplement Engine (medication interactions)

**Implementation Required**:
- Enhanced profile UI
- Medical history questionnaire
- Persistence layer
- Integration into risk engines

**Effort**: Medium (3-4 days)

---

## LOW PRIORITY MISSING INTEGRATIONS

### 9. Continuous Glucose Monitor (CGM)
**Priority**: **LOW** (Optional)  
**Current State**: Not implemented  
**Spec Requirement**: Optional for advanced metabolic tracking  
**Impact**: Metabolic Engine uses bloodwork glucose only

**Missing Data**:
- Real-time glucose readings
- Glucose variability
- Time in range
- Post-meal glucose response

**Affected Engines**:
- Metabolic Engine (enhancement, not critical)

**Implementation Required**:
- CGM sync service
- Real-time data ingestion
- Trend analysis
- Integration into Metabolic Engine

**Effort**: High (7-10 days)

---

### 10. Sleep Number / Sleep Tracker Integration
**Priority**: **LOW** (Optional)  
**Current State**: Not implemented  
**Spec Requirement**: Optional for enhanced sleep tracking  
**Impact**: Recovery Engine uses interview sleep quality

**Missing Data**:
- Sleep IQ score
- Average heart rate during sleep
- Respiration rate
- Restfulness score
- Sleep stages (detailed)

**Affected Engines**:
- Recovery Engine (enhancement, not critical)

**Implementation Required**:
- Sleep Number API integration
- Data sync service
- Persistence layer
- Integration into Recovery Engine

**Effort**: High (7-10 days)

---

### 11. Physique Scan Integration
**Priority**: **LOW**  
**Current State**: Service exists but not fully integrated  
**Spec Requirement**: Photo-based body composition tracking  
**Impact**: Body composition relies on manual entry

**Current Implementation**:
- Physique scan service exists ✅
- **NOT integrated into body composition tracking** ❌

**Missing Integration**:
- Wire physique scans into body composition service
- Automatic body fat % estimation
- Progress photo tracking
- Visual progress comparison

**Affected Services**:
- Body Composition Service
- Goal tracking
- Progress visualization

**Implementation Required**:
- Complete physique scan integration
- Body fat estimation algorithm
- Progress photo storage
- Visual comparison UI

**Effort**: Medium (4-5 days)

---

## SUMMARY BY PRIORITY

### Critical (Blocks Production Quality)
1. **Baseline Profile UI** - All engines need user-specific context
2. **Nutrition Baseline UI** - Nutrition recommendations need personalization
3. **Device Data Integration** - Recovery/Cardiovascular need objective metrics
4. **Blood Pressure Monitoring** - Cardiovascular Engine incomplete

**Total Critical Effort**: 12-17 days

### High (Significantly Improves Quality)
5. **Workout Execution Tracking** - Adherence needs objective validation
6. **Meal Logging Integration** - Nutrition Engine needs actual consumption data

**Total High Effort**: 7-10 days

### Medium (Enhances Functionality)
7. **Per-Supplement Adherence** - Granular tracking
8. **Medical History Detail** - Risk assessment enhancement

**Total Medium Effort**: 6-8 days

### Low (Nice to Have)
9. **CGM Integration** - Optional metabolic enhancement
10. **Sleep Number Integration** - Optional recovery enhancement
11. **Physique Scan Integration** - Optional progress tracking

**Total Low Effort**: 18-24 days

---

## RECOMMENDED BUILD SEQUENCE

### Phase 1: Critical Foundations (2-3 weeks)
1. Baseline Profile UI (3 days)
2. Nutrition Baseline UI (3 days)
3. Blood Pressure Monitoring (4 days)
4. Device Data Integration (7 days)

**Impact**: System becomes fully personalized with objective health metrics

### Phase 2: Execution Validation (1-2 weeks)
5. Workout Execution Tracking (7 days)
6. Meal Logging Integration (3 days)

**Impact**: Adherence and nutrition become objectively tracked

### Phase 3: Enhancements (1-2 weeks)
7. Per-Supplement Adherence (4 days)
8. Medical History Detail (4 days)

**Impact**: Granular tracking and risk assessment

### Phase 4: Optional Advanced Features (3-4 weeks)
9. CGM Integration (10 days)
10. Sleep Number Integration (10 days)
11. Physique Scan Integration (5 days)

**Impact**: Advanced tracking for power users

---

## IMPACT ANALYSIS

### Without Critical Integrations
- Engines use generic defaults instead of user-specific data
- Nutrition recommendations not personalized
- Recovery/Cardiovascular less accurate
- System feels "demo-like" rather than production

### With Critical Integrations
- All engines use real user context
- Nutrition fully personalized
- Objective health metrics drive recommendations
- System feels production-ready and personalized

### With All Integrations
- Complete spec compliance
- Maximum personalization
- Objective validation of all metrics
- Advanced tracking for optimization
- True AI health operating system
