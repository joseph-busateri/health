# Data Integration Matrix — Spec vs Implementation

**Purpose**: Map spec requirements to actual implementation status

---

## BASELINE PROFILE

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| age | Yes | Yes | baselineConfigService | In-memory Map | getBaselineConfig | All engines | **SEEDED/MANUAL** | Partial |
| sex | Yes | Yes | baselineConfigService | In-memory Map | getBaselineConfig | All engines | **SEEDED/MANUAL** | Partial |
| height | Yes | Yes | baselineConfigService | In-memory Map | getBaselineConfig | Body comp, Goals | **SEEDED/MANUAL** | Partial |
| weight | Yes | Yes | baselineConfigService | In-memory Map | getBaselineConfig | Body comp, Nutrition | **SEEDED/MANUAL** | Partial |
| medicalConditions | Yes | Yes | baselineConfigService | In-memory Map | getBaselineConfig | Risk engines | **SEEDED/MANUAL** | Partial |
| medications | Yes | Yes | baselineConfigService | In-memory Map | getBaselineConfig | Interaction checks | **SEEDED/MANUAL** | Partial |
| trtUsage | Yes | Yes | baselineConfigService | In-memory Map | getBaselineConfig | Sexual Health | **SEEDED/MANUAL** | Partial |
| workoutBaseline | Yes | Yes | workoutDocumentService | In-memory Map | getWorkoutBaseline | Workout Today | **UPLOADED/REAL** | Complete |
| supplementBaseline | Yes | Yes | supplementDocumentService | In-memory Map | getSupplementBaseline | Supplement Engine | **UPLOADED/REAL** | Complete |

**Status**: **Partial** - Baseline config exists but relies on manual seeding, not full profile UI

---

## STRUCTURED GOALS

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| targetBodyFatPercent | Yes | Yes | goalService | In-memory Map | getGoals | Goal scoring | **MANUAL/REAL** | Complete |
| targetWeight | Yes | Yes | goalService | In-memory Map | getGoals | Goal scoring | **MANUAL/REAL** | Complete |
| targetA1c | Yes | Yes | goalService | In-memory Map | getGoals | Metabolic Engine | **MANUAL/REAL** | Complete |
| targetRestingHeartRate | Yes | Yes | goalService | In-memory Map | getGoals | Cardiovascular | **MANUAL/REAL** | Complete |
| targetSystolicBP | Yes | Yes | goalService | In-memory Map | getGoals | Cardiovascular | **MANUAL/REAL** | Complete |
| targetDiastolicBP | Yes | Yes | goalService | In-memory Map | getGoals | Cardiovascular | **MANUAL/REAL** | Complete |
| targetErectileFunctionScore | Yes | Yes | goalService | In-memory Map | getGoals | Sexual Health | **MANUAL/REAL** | Complete |
| targetLibidoScore | Yes | Yes | goalService | In-memory Map | getGoals | Sexual Health | **MANUAL/REAL** | Complete |
| Circumference goals | Yes | Yes | goalService | In-memory Map | getGoals | Body comp tracking | **MANUAL/REAL** | Complete |
| Strength goals | Yes | Yes | goalService | In-memory Map | getGoals | Workout Engine | **MANUAL/REAL** | Complete |

**Status**: **Complete** - Goals service fully implemented with manual entry

---

## DAILY INTERVIEW

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| energy | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Recovery Engine | **REAL/DAILY** | Complete |
| fatigue | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Recovery Engine | **REAL/DAILY** | Complete |
| sleepQuality | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Recovery Engine | **REAL/DAILY** | Complete |
| muscleSoreness | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Recovery Engine | **REAL/DAILY** | Complete |
| mentalStress | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Stress Engine | **REAL/DAILY** | Complete |
| workload | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Stress Engine | **REAL/DAILY** | Complete |
| shoulderPain | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Joint Engine | **REAL/DAILY** | Complete |
| kneePain | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Joint Engine | **REAL/DAILY** | Complete |
| backPain | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Joint Engine | **REAL/DAILY** | Complete |
| libido | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Sexual Health | **REAL/DAILY** | Complete |
| erectileFunction | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Sexual Health | **REAL/DAILY** | Complete |
| morningErections | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Sexual Health | **REAL/DAILY** | Complete |
| workoutAdherence | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Adherence Engine | **REAL/DAILY** | Complete |
| supplementAdherence | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Adherence Engine | **REAL/DAILY** | Complete |
| nutritionAdherence | Yes | Yes | hybridInterviewService | In-memory Map | getDailyLog | Adherence Engine | **REAL/DAILY** | Complete |

**Status**: **Complete** - Daily interview fully implemented with AI agent + structured extraction

---

## BLOODWORK

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| glucose | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Metabolic Engine | **UPLOADED/REAL** | Complete |
| hba1c | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Metabolic Engine | **UPLOADED/REAL** | Complete |
| insulin | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Metabolic Engine | **UPLOADED/REAL** | Complete |
| totalCholesterol | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Cardiovascular | **UPLOADED/REAL** | Complete |
| ldl | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Cardiovascular | **UPLOADED/REAL** | Complete |
| hdl | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Cardiovascular | **UPLOADED/REAL** | Complete |
| triglycerides | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Cardiovascular | **UPLOADED/REAL** | Complete |
| testosterone | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Sexual Health | **UPLOADED/REAL** | Complete |
| freeTestosterone | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Sexual Health | **UPLOADED/REAL** | Complete |
| estradiol | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Sexual Health | **UPLOADED/REAL** | Complete |
| vitaminD | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Supplement Engine | **UPLOADED/REAL** | Complete |
| ferritin | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Supplement Engine | **UPLOADED/REAL** | Complete |
| crp | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Inflammation tracking | **UPLOADED/REAL** | Complete |
| All CBC markers | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Health monitoring | **UPLOADED/REAL** | Complete |
| All CMP markers | Yes | Yes | bloodworkProcessingService | In-memory Map | getBloodwork | Health monitoring | **UPLOADED/REAL** | Complete |

**Status**: **Complete** - Bloodwork upload, OCR extraction, normalization, and consumption fully implemented

---

## BODY COMPOSITION

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| weight | Yes | Yes | bodyCompositionService | In-memory Map | getBodyComposition | Metabolic, Nutrition | **MANUAL/REAL** | Complete |
| bodyFatPercent | Yes | Yes | bodyCompositionService | In-memory Map | getBodyComposition | Metabolic, Goals | **MANUAL/REAL** | Complete |
| leanMass | Yes | Derived | bodyCompositionService | In-memory Map | getBodyComposition | Goals | **CALCULATED** | Complete |
| fatMass | Yes | Derived | bodyCompositionService | In-memory Map | getBodyComposition | Goals | **CALCULATED** | Complete |
| Circumferences | Yes | Yes | tapeMeasurementService | In-memory Map | getTapeMeasurements | Goals, Progress | **MANUAL/REAL** | Complete |
| chest | Yes | Yes | tapeMeasurementService | In-memory Map | getTapeMeasurements | Goals | **MANUAL/REAL** | Complete |
| biceps | Yes | Yes | tapeMeasurementService | In-memory Map | getTapeMeasurements | Goals | **MANUAL/REAL** | Complete |
| waist | Yes | Yes | tapeMeasurementService | In-memory Map | getTapeMeasurements | Goals | **MANUAL/REAL** | Complete |

**Status**: **Complete** - Body composition and tape measurements fully implemented

---

## DEVICE DATA

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| restingHeartRate | Yes | Partial | appleWatchSyncService | In-memory Map | getHealthData | Recovery, Cardiovascular | **MOCK/PLACEHOLDER** | **Missing** |
| hrv | Yes | Partial | appleWatchSyncService | In-memory Map | getHealthData | Recovery Engine | **MOCK/PLACEHOLDER** | **Missing** |
| sleepDuration | Yes | Partial | appleWatchSyncService | In-memory Map | getHealthData | Recovery Engine | **MOCK/PLACEHOLDER** | **Missing** |
| activeCalories | Yes | Partial | appleWatchSyncService | In-memory Map | getHealthData | Nutrition Engine | **MOCK/PLACEHOLDER** | **Missing** |
| steps | Yes | Partial | appleWatchSyncService | In-memory Map | getHealthData | Activity tracking | **MOCK/PLACEHOLDER** | **Missing** |
| vo2Max | Yes | Partial | appleWatchSyncService | In-memory Map | getHealthData | Cardiovascular | **MOCK/PLACEHOLDER** | **Missing** |
| Blood pressure | Yes | No | **NOT IMPLEMENTED** | None | None | Cardiovascular | **MISSING** | **Missing** |
| CGM data | Optional | No | **NOT IMPLEMENTED** | None | None | Metabolic | **MISSING** | **Missing** |
| Sleep Number data | Optional | No | **NOT IMPLEMENTED** | None | None | Recovery | **MISSING** | **Missing** |

**Status**: **Missing** - Device sync services exist but not fully connected; engines use fallback/query data

---

## SUPPLEMENTS

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| supplementStack | Yes | Yes | supplementDocumentService | In-memory Map | getSupplementBaseline | Supplement Engine | **UPLOADED/REAL** | Complete |
| supplementName | Yes | Yes | supplementDocumentService | In-memory Map | getSupplementBaseline | Supplement Engine | **UPLOADED/REAL** | Complete |
| dosage | Yes | Yes | supplementDocumentService | In-memory Map | getSupplementBaseline | Supplement Engine | **UPLOADED/REAL** | Complete |
| timing | Yes | Yes | supplementDocumentService | In-memory Map | getSupplementBaseline | Supplement Engine | **UPLOADED/REAL** | Complete |
| adherenceTracking | Yes | Partial | dailyLog (interview) | In-memory Map | getDailyLog | Adherence Engine | **INTERVIEW/REAL** | Partial |

**Status**: **Partial** - Supplement baseline complete, adherence tracking via interview only (not per-supplement)

---

## WORKOUT

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| workoutBaseline | Yes | Yes | workoutDocumentService | In-memory Map | getWorkoutBaseline | Workout Today | **UPLOADED/REAL** | Complete |
| exercises | Yes | Yes | workoutDocumentService | In-memory Map | getWorkoutBaseline | Workout Today | **UPLOADED/REAL** | Complete |
| weeklySchedule | Yes | Yes | workoutDocumentService | In-memory Map | getWorkoutBaseline | Workout Today | **UPLOADED/REAL** | Complete |
| workoutExecution | Yes | Partial | **NOT FULLY IMPLEMENTED** | None | None | Adherence, Progress | **MISSING** | **Missing** |
| strengthTracking | Yes | Yes | strengthTrackingService | In-memory Map | getStrengthTracking | Workout Engine, Goals | **MANUAL/REAL** | Complete |
| 1RM tracking | Yes | Yes | strengthTrackingService | In-memory Map | getStrengthTracking | Goals | **MANUAL/REAL** | Complete |

**Status**: **Partial** - Baseline complete, execution tracking missing, strength tracking complete

---

## NUTRITION

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| nutritionBaseline | Yes | Yes | nutritionTodayIntegratedService | In-memory Map (seeded) | getBaselineNutrition | Nutrition Today | **SEEDED/DEFAULT** | Partial |
| dailyCalories | Yes | Yes | Seeded defaults | In-memory Map | getBaselineNutrition | Nutrition Today | **SEEDED/DEFAULT** | Partial |
| macros | Yes | Yes | Seeded defaults | In-memory Map | getBaselineNutrition | Nutrition Today | **SEEDED/DEFAULT** | Partial |
| mealLogging | Yes | Yes | mealLogService | In-memory Map | getMealLogs | Adherence | **MANUAL/REAL** | Complete |
| nutritionTracking | Yes | Partial | mealLogService + OCR | In-memory Map | getMealLogs | Nutrition Engine | **PARTIAL** | Partial |

**Status**: **Partial** - Baseline is seeded defaults, meal logging exists but not fully integrated into engine

---

## ADHERENCE

| Field | Spec Required | Data Source Exists | Ingestion Path | Persistence | Retrieval | Consumed By | Real/Mock | Status |
|-------|---------------|-------------------|----------------|-------------|-----------|-------------|-----------|--------|
| workoutAdherence | Yes | Yes | dailyLog (interview) | In-memory Map | getDailyLog | Adherence Engine | **INTERVIEW/REAL** | Complete |
| supplementAdherence | Yes | Yes | dailyLog (interview) | In-memory Map | getDailyLog | Adherence Engine | **INTERVIEW/REAL** | Complete |
| nutritionAdherence | Yes | Yes | dailyLog (interview) | In-memory Map | getDailyLog | Adherence Engine | **INTERVIEW/REAL** | Complete |
| adherenceRate | Yes | Yes | adherenceTrackingService | Calculated | getAdherenceMetrics | Adherence Engine | **CALCULATED/REAL** | Complete |

**Status**: **Complete** - Adherence tracked via interview and calculated

---

## SUMMARY BY DOMAIN

| Domain | Spec Complete | Implementation Status | Real Data % | Notes |
|--------|---------------|----------------------|-------------|-------|
| Baseline Profile | 100% | **Partial (60%)** | 60% | Manual seeding, no full profile UI |
| Goals | 100% | **Complete (100%)** | 100% | Fully implemented |
| Daily Interview | 100% | **Complete (100%)** | 100% | AI agent + structured extraction |
| Bloodwork | 100% | **Complete (100%)** | 100% | Upload, OCR, normalization working |
| Body Composition | 100% | **Complete (100%)** | 100% | Manual entry working |
| Device Data | 100% | **Missing (10%)** | 10% | Services exist but not connected |
| Supplements | 100% | **Partial (80%)** | 80% | Baseline complete, per-supplement adherence missing |
| Workout | 100% | **Partial (70%)** | 70% | Baseline complete, execution tracking missing |
| Nutrition | 100% | **Partial (50%)** | 50% | Seeded defaults, meal logging partial |
| Adherence | 100% | **Complete (90%)** | 90% | Interview-based, not granular |

---

## CRITICAL GAPS

### High Priority
1. **Device Data Integration** - Apple Watch sync not fully connected to engines
2. **Nutrition Baseline** - Using seeded defaults instead of user-specific plans
3. **Workout Execution Tracking** - No actual workout completion logging
4. **Blood Pressure Monitoring** - Not integrated despite spec requirement

### Medium Priority
5. **Per-Supplement Adherence** - Only overall adherence tracked
6. **Meal Logging Integration** - Exists but not fully feeding Nutrition Engine
7. **Baseline Profile UI** - Manual seeding required

### Low Priority
8. **CGM Integration** - Optional, not critical
9. **Sleep Number Integration** - Optional, not critical
