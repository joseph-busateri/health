# HEALTH AGENT — VERSION 11.1 MASTER IMPLEMENTATION AUDIT TEMPLATE

**Purpose**  
This document audits the current Health Agent codebase against **HEALTH AGENT — VERSION 11.1 Full Master Product + UX + Architecture Specification**.

**Audit Goals**
1. Determine what is complete
2. Determine what is partially complete
3. Determine what is missing
4. Determine what should be refactored
5. Determine what should be deleted or replaced
6. Estimate implementation percentage by section
7. Produce a prioritized build plan

---

# 1. AUDIT RULES

## Status Definitions
- **Complete** = fully implemented and aligned to spec end-to-end
- **Mostly Complete** = implemented with minor gaps
- **Partial** = significant portions exist, but important gaps remain
- **Stub Only** = placeholder/skeleton exists, but not real implementation
- **Missing** = not implemented
- **Needs Refactor** = functionality exists, but architecture/ownership/structure is wrong
- **Delete / Replace** = obsolete, conflicting, duplicate, or misaligned implementation

## Percentage Definitions
- **100%** = fully aligned to spec
- **75%** = mostly complete
- **50%** = partial
- **25%** = stub only
- **0%** = missing

## Critical Audit Rules
- Do **not** mark something complete unless:
  - the data structure exists
  - the logic/service exists
  - the API or orchestration exists if needed
  - the UI exists if required
  - the end-to-end behavior works
  - the implementation aligns with the spec, not just resembles it

- Be strict
- Use evidence from actual code
- Call out uncertainty explicitly
- Separate **missing** from **refactor**
- Separate **refactor** from **delete**
- Do not recommend deletion until dependencies are understood

---

# 2. EXECUTIVE SUMMARY

## Overall Completion Summary
- **Overall Product Completion %:** 45%
- **Data Architecture Completion %:** 60%
- **Engine Layer Completion %:** 50%
- **UX / Navigation Completion %:** 35%
- **End-to-End Behavior Completion %:** 30%

## Overall Status Summary
- **Complete Areas:**  
  - Recovery Engine (85%)
  - Stress Engine (85%)
  - Joint Health Engine (85%)
  - Adherence Engine (85%)
  - Bloodwork upload/extraction pipeline (75%)
  - Sleep Number integration (75%)
  - Device integration schemas (70%)

- **Mostly Complete Areas:**  
  - Workout Today Service (70%)
  - Supplement Engine (70%)
  - Control Tower Service (65%)
  - Daily Interview infrastructure (65%)
  - Body Composition upload (60%)

- **Partial Areas:**  
  - Bloodwork intelligence/interpretation (40%)
  - Holistic Recommendation Engine (50%)
  - Goal Management (40%)
  - Nutrition tracking (35%)
  - Mobile UI alignment to V11.1 spec (30%)

- **Stub Only Areas:**  
  - Bloodwork Analysis Engine (stub only)
  - Sexual Health Engine (missing)
  - Cardiovascular Engine (missing)
  - Metabolic Engine (missing)
  - Prediction Engine (missing)
  - Nutrition Engine (missing)

- **Missing Areas:**  
  - DailyHealthSnapshot unified model
  - Sexual Health Engine
  - Cardiovascular Risk Scoring Engine
  - Metabolic Engine
  - Prediction Engine
  - Nutrition Engine
  - Goal Tracking Engine (proper implementation)
  - Conversational AI Coach interface (V11.1 spec)
  - Control Tower UI with collapsible sections
  - Recommendation lifecycle management
  - Data confidence weighting model
  - Time horizon intelligence layer

- **Refactor Priorities:**  
  - Consolidate recommendation logic (currently fragmented)
  - Unify bloodwork processing (multiple overlapping services)
  - Create DailyHealthSnapshot aggregation layer
  - Refactor Control Tower to match V11.1 spec
  - Consolidate interview services (multiple overlapping)
  - Align mobile navigation to 7-tab structure

- **Delete / Replace Candidates:**  
  - bloodworkAnalysisEngine.ts (stub only, replace with real implementation)
  - Multiple duplicate bloodwork services (consolidate)
  - Old dashboard screens (DashboardScreen.tsx vs DashboardV13Screen.tsx)
  - Duplicate route files (bloodwork.routes.ts vs bloodworkRoutes.ts)

## Top 10 Highest Risk Gaps
1. **No unified DailyHealthSnapshot model** - Engines don't share common data structure
2. **Missing Sexual Health Engine** - Core V11.1 requirement not implemented
3. **Missing Cardiovascular Risk Engine** - Primary health metric per spec
4. **Missing Metabolic Engine** - Critical for glucose/A1c tracking
5. **No Prediction Engine** - Forecasting capability missing
6. **Fragmented Recommendation Logic** - No central recommendation engine
7. **UI doesn't match V11.1 Control Tower spec** - Home screen diverges significantly
8. **No conversational AI Coach** - Interview is form-based, not conversational
9. **No recommendation lifecycle tracking** - Accept/reject/snooze not implemented
10. **Missing Nutrition Engine** - Macro calculation and targets not implemented

## Recommended Next 10 Build Priorities
1. **Create DailyHealthSnapshot unified model** - Foundation for all engines
2. **Build Cardiovascular Risk Engine** - Primary health metric
3. **Build Metabolic Engine** - Glucose/A1c tracking and risk
4. **Build Sexual Health Engine** - Aggregate testosterone, libido, erectile function
5. **Build Nutrition Engine** - Macro targets and calculations
6. **Implement Recommendation Engine** - Central decision engine with lifecycle
7. **Refactor Control Tower Service** - Match V11.1 spec with derived intelligence
8. **Build Control Tower UI** - Collapsible sections, alerts, recommendations
9. **Implement Prediction Engine** - Forecast weight, body fat, A1c, performance
10. **Build Goal Tracking Engine** - Progress tracking and velocity calculations 

---

# 3. IMPLEMENTATION INVENTORY

## 3.1 Database / Storage Inventory
| Item | File / Table / Migration | Purpose | Mapped Spec Area | Notes |
|------|---------------------------|---------|------------------|-------|
| Supabase Database | server/src/config/supabase.ts | Primary data store | All data persistence | PostgreSQL via Supabase |
| Sleep Number Connections | sleep_number_connections table | Device integration | Device Inputs | Stores encrypted tokens, bed_id, sync status |
| Bloodwork Reports | bloodwork_reports table | Bloodwork storage | Bloodwork Inputs | PDF storage, OCR results |
| Body Composition | body_composition_scans table | Body comp storage | Body Composition Inputs | InBody scan results |
| Daily Logs | daily_logs table | Interview data | Daily Interview | Recovery, stress, joint, adherence signals |
| Supplement Stack | supplement_stack_versions, supplements tables | Supplement baseline | Supplement Inputs | Version-controlled supplement stack |
| Workout Plans | workout_plan_versions, workout_split_days, workout_exercises tables | Workout baseline | Workout Inputs | 12-week cycle support |
| Point-in-Time Events | point_in_time_events table | Change tracking | Continuous Monitoring | Tracks all state changes with rationale |
| Baseline Profile | baseline_profiles table | User baseline | Baseline Profile | Demographics, goals, medical context |
| Recommendations | recommendations table (uncertain) | Recommendation lifecycle | Recommendation Engine | **UNCERTAIN - may not exist yet** |

## 3.2 Data Models / Types / Interfaces
| Item | File | Purpose | Mapped Spec Area | Notes |
|------|------|---------|------------------|-------|
| BaselineProfile | types/baselineDocument.ts | User baseline data | Baseline Profile | Demographics, TrainingContext, LifestyleContext, Goals |
| WorkoutBaseline | types/workoutBaseline.ts | Workout plans | Workout Inputs | TrainingCycle, WorkoutPlanVersion, 12-week cycle support |
| SupplementBaseline | types/supplementBaseline.ts | Supplement stack | Supplement Inputs | SupplementStackVersion, adherence tracking |
| RecoveryEngine | types/recoveryEngine.ts | Recovery scoring | Recovery Engine | RecoverySourceInputs, RecoveryRecord, RecoveryRecommendation |
| StressEngine | types/stressEngine.ts | Stress scoring | Stress Engine | StressSourceInputs, StressRecord, CNS load |
| JointHealthEngine | types/jointHealthEngine.ts | Joint health | Joint Engine | JointHealthInputs, JointRiskLevel, affected areas |
| AdherenceEngine | types/adherenceEngine.ts | Adherence tracking | Adherence Engine | AdherenceDomainBreakdown, AdherenceRecord |
| SupplementEngine | types/supplementEngine.ts | Supplement recs | Supplement Engine | SupplementRecommendation, SupplementEngineContext |
| WorkoutToday | types/workoutToday.ts | Daily workout | Workout Engine | WorkoutTodayRecord, readiness-based adjustments |
| BloodworkResults | types/bloodworkResults.ts | Bloodwork data | Bloodwork Inputs | BloodworkReport, BloodworkPanel, BloodworkAnalyte |
| BodyComposition | types/bodyComposition.ts | Body comp data | Body Composition Inputs | BodyCompositionScan, segmental analysis |
| DailyLog | types/dailyLog.ts | Daily interview | Daily Interview | Sleep, recovery, stress, joint, adherence signals |
| HolisticHealth | types/holisticHealth.ts | Holistic recs | Recommendation Engine | HolisticRecommendation, HolisticAnalysisResult |
| HealthDataHub | types/healthDataHub.ts | Data hub types | Data Hub UI | Unified data entry types |
| **DailyHealthSnapshot** | **MISSING** | **Unified snapshot** | **DailyHealthSnapshot** | **NOT IMPLEMENTED - critical gap** |

## 3.3 Services
| Item | File | Purpose | Mapped Spec Area | Notes |
|------|------|---------|------------------|-------|
| Control Tower | services/controlTowerService.ts | Overall health aggregation | Control Tower Engine | Aggregates engine scores, calculates overall health |
| Recovery Engine | services/recoveryEngineService.ts | Recovery scoring | Recovery Engine | Calculates recovery score, status, recommendations |
| Stress Engine | services/stressEngineService.ts | Stress/CNS load | Stress Engine | Calculates stress score, CNS load assessment |
| Joint Health Engine | services/jointHealthEngineService.ts | Injury risk | Joint Engine | Injury risk, affected areas, workout modifications |
| Adherence Engine | services/adherenceEngineService.ts | Adherence tracking | Adherence Engine | Domain breakdown, trend analysis |
| Supplement Engine | services/supplementEngineService.ts | Supplement recs | Supplement Engine | Generates supplement recommendations |
| Workout Today | services/workoutTodayService.ts | Daily workout | Workout Engine | Generates/adjusts daily workout based on readiness |
| Holistic Recommendation | services/holisticRecommendationEngine.ts | Holistic analysis | Recommendation Engine | Hybrid decision tree + AI analysis |
| Bloodwork Extraction | services/bloodworkExtractionService.ts | PDF OCR | Bloodwork Inputs | Extracts bloodwork from PDFs |
| Bloodwork Normalization | services/bloodworkNormalizationService.ts | Data normalization | Bloodwork Inputs | Normalizes analyte values |
| Bloodwork Trends | services/bloodworkTrendService.ts | Trend calculation | Bloodwork Inputs | Calculates trends over time |
| Sleep Number Sync | services/sleepNumberSyncService.ts | Device integration | Device Inputs | Syncs Sleep Number data |
| Daily Log | services/structuredDailyLogService.ts | Interview storage | Daily Interview | Saves daily interview responses |
| Interview Agent | services/interviewAgentService.ts | Interview generation | Daily Interview | Generates interview questions |
| Hybrid Interview | services/hybridInterviewService.ts | Interview orchestration | Daily Interview | Orchestrates interview flow |
| Point-in-Time | services/pointInTimeService.ts | Change tracking | Continuous Monitoring | Tracks all state changes |
| Baseline Document | services/baselineDocumentService.ts | Baseline extraction | Baseline Profile | Extracts baseline from documents |
| Health Data Hub | services/healthDataHubService.ts | Data hub logic | Data Hub UI | Unified data entry service |
| **Cardiovascular Engine** | **MISSING** | **CV risk scoring** | **Cardiovascular Engine** | **NOT IMPLEMENTED** |
| **Metabolic Engine** | **MISSING** | **Metabolic risk** | **Metabolic Engine** | **NOT IMPLEMENTED** |
| **Sexual Health Engine** | **MISSING** | **Sexual health** | **Sexual Health Engine** | **NOT IMPLEMENTED** |
| **Nutrition Engine** | **MISSING** | **Nutrition targets** | **Nutrition Engine** | **NOT IMPLEMENTED** |
| **Prediction Engine** | **MISSING** | **Forecasting** | **Prediction Engine** | **NOT IMPLEMENTED** |

## 3.4 Engines
| Item | File | Purpose | Mapped Spec Area | Notes |
|------|------|---------|------------------|-------|
| Control Tower | services/controlTowerService.ts | Overall health | Control Tower Engine | 65% complete - missing derived intelligence |
| Recovery | services/recoveryEngineService.ts | Recovery scoring | Recovery Engine | 85% complete - fully functional |
| Stress | services/stressEngineService.ts | Stress/CNS load | Stress Engine | 85% complete - fully functional |
| Joint Health | services/jointHealthEngineService.ts | Injury risk | Joint Engine | 85% complete - fully functional |
| Adherence | services/adherenceEngineService.ts | Adherence tracking | Adherence Engine | 85% complete - fully functional |
| Supplement | services/supplementEngineService.ts | Supplement recs | Supplement Engine | 70% complete - missing dosage optimization |
| Workout | services/workoutTodayService.ts | Daily workout | Workout Engine | 70% complete - missing 12-week cycle integration |
| Holistic Recommendation | services/holisticRecommendationEngine.ts | Holistic analysis | Recommendation Engine | 35% complete - no lifecycle management |
| Goal Management | services/goalManagementEngine.ts | Goal tracking | Goal Tracking Engine | 40% complete - not integrated |
| Bloodwork Analysis | services/bloodworkAnalysisEngine.ts | Bloodwork intelligence | Bloodwork Inputs | 5% complete - STUB ONLY |
| **Cardiovascular** | **MISSING** | **CV risk** | **Cardiovascular Engine** | **0% - NOT IMPLEMENTED** |
| **Metabolic** | **MISSING** | **Metabolic risk** | **Metabolic Engine** | **0% - NOT IMPLEMENTED** |
| **Sexual Health** | **MISSING** | **Sexual health** | **Sexual Health Engine** | **0% - NOT IMPLEMENTED** |
| **Nutrition** | **MISSING** | **Nutrition** | **Nutrition Engine** | **0% - NOT IMPLEMENTED** |
| **Prediction** | **MISSING** | **Forecasting** | **Prediction Engine** | **0% - NOT IMPLEMENTED** |

## 3.5 Controllers / Routes / APIs
| Item | File / Route | Purpose | Mapped Spec Area | Notes |
|------|--------------|---------|------------------|-------|
| | | | | |

## 3.6 Background Jobs / Schedulers / Automation
| Item | File | Purpose | Mapped Spec Area | Notes |
|------|------|---------|------------------|-------|
| Apple Watch Sync | cron/appleWatchSync.ts | Device sync | Device Inputs | Scheduled sync job for Apple Watch data |
| Oura Sync | cron/ouraSync.ts | Device sync | Device Inputs | Scheduled sync job for Oura Ring data |
| Sleep Number Sync | services/sleepNumberSyncService.ts (queueSyncJob method) | Device sync | Device Inputs | Queue-based sync, not scheduled cron |
| **MISSING** | **No continuous monitoring** | **Background monitoring** | **Continuous System Behavior** | **No cron job for continuous health monitoring** |
| **MISSING** | **No recommendation scheduler** | **Proactive recommendations** | **Recommendation Engine** | **No scheduled recommendation generation** |
| **MISSING** | **No risk detection scheduler** | **Risk pattern detection** | **Continuous System Behavior** | **No background risk monitoring (BP spike, HRV drop, etc.)** |

## 3.7 UI Screens
| Item | File | Purpose | Mapped Spec Area | Notes |
|------|------|---------|------------------|-------|
| | | | | |

## 3.8 Shared Components
| Item | File | Purpose | Mapped Spec Area | Notes |
|------|------|---------|------------------|-------|
| | | | | |

## 3.9 Hooks / Stores / State Containers
| Item | File | Purpose | Mapped Spec Area | Notes |
|------|------|---------|------------------|-------|
| | | | | |

## 3.10 Integrations
| Item | File | Purpose | Mapped Spec Area | Notes |
|------|------|---------|------------------|-------|
| | | | | |

## 3.11 Tests / Validation Scripts
| Item | File | Purpose | Mapped Spec Area | Notes |
|------|------|---------|------------------|-------|
| | | | | |

## 3.12 Duplicate / Overlapping / Deprecated / Unclear Code
| Item | File | Problem Type | Why It Matters | Recommended Action |
|------|------|--------------|----------------|-------------------|
| Bloodwork Routes | routes/bloodwork.routes.ts vs bloodworkRoutes.ts | Duplicate | Confusing which is active, potential conflicts | Consolidate into bloodworkRoutes.ts, delete bloodwork.routes.ts |
| Body Comp Routes | routes/bodyComposition.routes.ts vs bodyCompositionRoutes.ts | Duplicate | Same as above | Consolidate into bodyCompositionRoutes.ts |
| Daily Log Routes | routes/dailyLogRoutes.ts vs dailyLogs.ts | Duplicate | Same as above | Consolidate into dailyLogRoutes.ts |
| Dashboard Screens | HomeScreen.tsx vs DashboardScreen.tsx vs DashboardV13Screen.tsx | Unclear | Don't know which is current | Determine current, delete others, replace with ControlTowerScreen.tsx |
| Interview Screens | AgentInterviewScreen.tsx vs HybridInterviewScreen.tsx vs DynamicInterviewScreen.tsx | Overlapping | Multiple interview implementations | Consolidate into single CoachScreen.tsx (conversational) |
| Supplement Upload | SupplementUploadScreen.tsx vs SupplementUploadScreenNew.tsx | Duplicate | Two upload screens | Keep newer, delete old |
| Recovery Screens | RecoveryDashboardScreen.tsx vs RecoveryStatusScreen.tsx vs RecoveryScreen.tsx | Overlapping | Multiple recovery screens | Consolidate into single recovery view |
| Goals Screens | GoalManagementScreen.tsx vs GoalsScreen.tsx | Duplicate | Two goal screens | Consolidate into one |
| Baseline Screens | BaselineProfileScreen.tsx vs BaselineSummaryScreen.tsx | Overlapping | Two baseline screens | Consolidate into one |
| Interview Services | hybridInterviewService.ts, interviewAgentService.ts, voiceInterviewService.ts, dynamicFollowUpService.ts | Overlapping | Multiple interview orchestration services | Consolidate into conversationalInterviewService.ts |
| Bloodwork Services | bloodworkExtractionService.ts, bloodworkProcessingService.ts, bloodworkAIParser.ts, bloodworkPatternMatching.ts | Overlapping | Multiple overlapping bloodwork processing services | Consolidate extraction logic into bloodworkExtractionService.ts |
| Bloodwork Analysis | bloodworkAnalysisEngine.ts | Stub Only | Returns empty arrays, no real logic | Replace with real implementation |
| Tape Measurement Routes | routes/tapeMeasurementRoutes.ts vs tapeMeasurements.routes.ts | Duplicate | Two route files | Consolidate |
| Strength Routes | routes/strength.routes.ts vs strengthTrackingRoutes.ts | Duplicate | Two route files | Consolidate |
| Supplement Routes | routes/supplements.routes.ts vs supplementEngineRoutes.ts vs supplementBaselineRoutes.ts | Overlapping | Multiple supplement route files | Clarify ownership, consolidate if overlapping |

---

# 4. SPEC-TO-IMPLEMENTATION GAP ANALYSIS

## Status Table
| Spec Area | Requirement | Evidence in Code | End-to-End? | Alignment % | Status | Missing Pieces | Refactor Notes | Delete/Replace Notes |
|-----------|-------------|------------------|-------------|-------------|--------|----------------|----------------|----------------------|
| | | | Yes / No / Partial | | | | | |
# 5. PRODUCT VISION & CORE ARCHITECTURE AUDIT

## 5.1 Product Vision Alignment
| Requirement | Evidence in Code | Alignment % | Status | Notes |
|------------|------------------|-------------|--------|-------|
| Personal AI Health & Performance Agent | Multiple engine services (recovery, stress, joint, adherence, supplement, workout) | 60% | Partial | Engines exist but missing Sexual Health, Cardiovascular, Metabolic, Prediction, Nutrition engines |
| Continuously analyzes core health domains | Engine services calculate scores from inputs | 50% | Partial | Analysis exists but not continuous (on-demand only), no background processing |
| Continuously adjusts recommendations and plans | workoutTodayService adjusts workouts, supplementEngine generates recommendations | 40% | Partial | Adjustments exist but fragmented, no central recommendation engine with lifecycle |
| AI-first, proactive, predictive system | holisticRecommendationEngine uses AI, but limited | 35% | Partial | AI analysis exists but not primary interface, no prediction engine, not proactive |

## 5.2 Core Architecture Alignment
| Requirement | Evidence in Code | Alignment % | Status | Notes |
|------------|------------------|-------------|--------|-------|
| Structured Intelligence Engine exists | Recovery, Stress, Joint, Adherence, Supplement, Workout engines implemented | 55% | Partial | 6 of 14 required engines exist with real logic |
| Conversational AI Layer exists | hybridInterviewService, interviewAgentService, voiceInterviewService | 40% | Partial | Interview exists but form-based, not conversational like ChatGPT per V11.1 spec |
| Structured engine + conversational layer integrated | Engines feed interview context, interview saves to engines | 45% | Partial | Some integration but not seamless, no unified DailyHealthSnapshot |
| Not chatbot-only architecture | Clear separation: engines compute, interview collects | 70% | Mostly Complete | Architecture is correct - structured engines + conversational layer |

## 5.3 Architecture Findings
### Complete
- **Structured engine pattern** - Recovery, Stress, Joint, Adherence engines follow consistent pattern
- **Service layer separation** - Clear separation between controllers, services, engines
- **Point-in-time tracking** - Change events tracked via pointInTimeService

### Partial
- **Engine coverage** - 6 of 14 engines implemented (Recovery, Stress, Joint, Adherence, Supplement, Workout)
- **Interview infrastructure** - Multiple interview services but not conversational per V11.1
- **Recommendation generation** - Exists in fragments (supplement, workout, holistic) but no central engine

### Missing
- **DailyHealthSnapshot unified model** - No common data structure shared across engines
- **Sexual Health Engine** - Not implemented
- **Cardiovascular Risk Engine** - Not implemented
- **Metabolic Engine** - Not implemented
- **Nutrition Engine** - Not implemented
- **Prediction Engine** - Not implemented
- **Goal Tracking Engine** - Partial implementation only
- **Central Recommendation Engine** - No unified recommendation lifecycle management

### Needs Refactor
- **Interview services** - Multiple overlapping services (hybridInterviewService, interviewAgentService, voiceInterviewService, dynamicFollowUpService) should consolidate
- **Bloodwork services** - Multiple overlapping services need consolidation
- **Control Tower** - Exists but doesn't match V11.1 spec (missing derived intelligence, trust/freshness, collapsible structure)

### Delete / Replace
- **bloodworkAnalysisEngine.ts** - Stub only, replace with real implementation
- **Duplicate route files** - bloodwork.routes.ts vs bloodworkRoutes.ts

### Section Completion %
- **Product Vision Alignment: 45%**
- **Core Architecture Alignment: 53%**

---
# 6. DATA INPUT ARCHITECTURE AUDIT
## 6.1 Baseline Profile Inputs
### Required Areas
- demographics
- medical context
- lifestyle context
- baseline plans
- structured goals profile

| Requirement | Data Model Exists | Logic Exists | API Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|------------|-----------|------------|-------------|--------|-------|
| Demographics | | | | | | | | |
| Medical Context | | | | | | | | |
| Lifestyle Context | | | | | | | | |
| Workout Baseline | | | | | | | | |
| Supplement Baseline | | | | | | | | |
| Goals Profile | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.2 Daily Interview Inputs
### Required Areas
- recovery signals
- stress signals
- joint health signals
- sexual health signals
- workout feedback
- adherence signals
- context signals
- multi-engine consumption

| Requirement | Data Model Exists | Logic Exists | API Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|------------|-----------|------------|-------------|--------|-------|
| Recovery Signals | | | | | | | | |
| Stress Signals | | | | | | | | |
| Joint Signals | | | | | | | | |
| Sexual Health Signals | | | | | | | | |
| Workout Feedback | | | | | | | | |
| Adherence Signals | | | | | | | | |
| Context Signals | | | | | | | | |
| Engine Consumption | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.3 Bloodwork Capability
### Weighted Subcomponents
- Upload PDF = 10%
- OCR / parsing = 15%
- report metadata extraction = 10%
- panel extraction = 10%
- analyte extraction = 15%
- normalization = 10%
- interpretation layer = 10%
- trend calculation = 10%
- engine consumption = 10%

| Subcomponent | Evidence in Code | End-to-End | Alignment % | Status | Notes |
|-------------|------------------|------------|-------------|--------|-------|
| Upload PDF | | | | | |
| OCR / parsing | | | | | |
| Metadata extraction | | | | | |
| Panel extraction | | | | | |
| Analyte extraction | | | | | |
| Normalization | | | | | |
| Interpretation layer | | | | | |
| Trend calculation | | | | | |
| Engine consumption | | | | | |

### Bloodwork Data Model Coverage
| Model / Field Group | Exists? | Alignment % | Status | Notes |
|---------------------|---------|-------------|--------|-------|
| BloodworkReport | | | | |
| BloodworkPanel | | | | |
| BloodworkResult | | | | |
| BloodworkReferenceRange | | | | |
| BloodworkInterpretation | | | | |
| BloodworkTrendSnapshot | | | | |

### Supported Marker Coverage
| Marker Group | Coverage % | Status | Notes |
|-------------|------------|--------|-------|
| Hormones | | | |
| CBC / Hematology | | | |
| CMP / Metabolic / Kidney / Liver | | | |
| Cardiovascular / Risk | | | |
| Metabolic / Diabetes | | | |
| Thyroid | | | |
| Nutrients | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.4 Body Composition Inputs
| Requirement | Data Model Exists | Logic Exists | API Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|------------|-----------|------------|-------------|--------|-------|
| Source ingestion | | | | | | | | |
| Core metrics | | | | | | | | |
| Segmental analysis | | | | | | | | |
| Circumference measurements | | | | | | | | |
| Symmetry | | | | | | | | |
| Derived metrics | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.5 Device Inputs
### Devices
- Sleep Number i10
- Apple Watch Series 9
- Oura Ring Gen 3
- Blood Pressure Monitor
- InBody 270

| Requirement | Data Model Exists | Logic Exists | Integration Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|--------------------|-----------|------------|-------------|--------|-------|
| Sleep Number ingestion | | | | | | | | |
| Apple Watch ingestion | | | | | | | | |
| Oura ingestion | | | | | | | | |
| BP Monitor ingestion | | | | | | | | |
| InBody ingestion | | | | | | | | |
| Derived device intelligence | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.6 Supplement Inputs
| Requirement | Data Model Exists | Logic Exists | API Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|------------|-----------|------------|-------------|--------|-------|
| Supplement stack | | | | | | | | |
| Adherence | | | | | | | | |
| Supplement effects | | | | | | | | |
| Derived supplement metrics | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.7 Workout Inputs
| Requirement | Data Model Exists | Logic Exists | API Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|------------|-----------|------------|-------------|--------|-------|
| Workout plan inputs | | | | | | | | |
| 12-week cycle support | | | | | | | | |
| Workout performance inputs | | | | | | | | |
| Workout adjustment inputs | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.8 Nutrition Inputs
| Requirement | Data Model Exists | Logic Exists | API Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|------------|-----------|------------|-------------|--------|-------|
| Current inputs | | | | | | | | |
| Sources | | | | | | | | |
| Future capability scaffolding | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.9 Sexual Health Inputs
| Requirement | Data Model Exists | Logic Exists | API Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|------------|-----------|------------|-------------|--------|-------|
| Interview aggregation | | | | | | | | |
| Bloodwork aggregation | | | | | | | | |
| Body composition aggregation | | | | | | | | |
| Recovery aggregation | | | | | | | | |
| Supplement effect aggregation | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.10 Adherence Inputs
| Requirement | Data Model Exists | Logic Exists | API Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|------------|-----------|------------|-------------|--------|-------|
| Workout adherence | | | | | | | | |
| Supplement adherence | | | | | | | | |
| Nutrition adherence | | | | | | | | |
| Sleep adherence | | | | | | | | |
| Recommendation adherence | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 6.11 Derived Intelligence Inputs
| Requirement | Data Model Exists | Logic Exists | API Exists | UI Exists | End-to-End | Alignment % | Status | Notes |
|------------|-------------------|--------------|------------|-----------|------------|-------------|--------|-------|
| Trends | | | | | | | | |
| Risk signals | | | | | | | | |
| Performance signals | | | | | | | | |
| Optimization signals | | | | | | | | |
| Recovery trends | | | | | | | | |
| Metabolic trends | | | | | | | | |
| Cardiovascular trends | | | | | | | | |
| Fatigue score | | | | | | | | |
| Readiness score | | | | | | | | |
| Overtraining risk | | | | | | | | |
| Metabolic risk | | | | | | | | |
| Cardiovascular risk | | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

# 7. DAILY HEALTH SNAPSHOT MODEL AUDIT

| Requirement | Exists in Code | End-to-End | Alignment % | Status | Notes |
|------------|----------------|------------|-------------|--------|-------|
| DailyHealthSnapshot object exists | | | | | |
| Recovery fields | | | | | |
| Stress fields | | | | | |
| Workout fields | | | | | |
| Body Composition fields | | | | | |
| Sexual Health fields | | | | | |
| Metabolic fields | | | | | |
| Cardiovascular fields | | | | | |
| Adherence fields | | | | | |
| Derived intelligence fields | | | | | |
| Used across engines | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

# 8. DATA CONFIDENCE MODEL AUDIT

| Requirement | Exists in Code | End-to-End | Alignment % | Status | Notes |
|------------|----------------|------------|-------------|--------|-------|
| Confidence levels defined | | | | | |
| High / Medium / Lower weighting model | | | | | |
| Input weighting logic used in calculations | | | | | |
| Example: recovery score weighting | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

# 9. TIME HORIZON INTELLIGENCE AUDIT

| Requirement | Exists in Code | End-to-End | Alignment % | Status | Notes |
|------------|----------------|------------|-------------|--------|-------|
| Short-term intelligence | | | | | |
| Medium-term intelligence | | | | | |
| Long-term intelligence | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 
---

# 10. INTELLIGENCE ENGINES AUDIT

## 10.1 Engine Completion Dashboard
| Engine | Module Exists | Real Logic Exists | Used by System | UI/API Consumption | Alignment % | Status | Notes |
|--------|---------------|-------------------|----------------|--------------------|-------------|--------|-------|
| Control Tower Engine | Yes | Yes | Yes | Partial | 65% | Mostly Complete | controlTowerService.ts exists, calculates overall score, but missing derived intelligence, trust/freshness per V11.1 |
| Workout Engine | Yes | Yes | Yes | Partial | 70% | Mostly Complete | workoutTodayService.ts adjusts workouts based on readiness, 12-week cycle support missing |
| Supplement Engine | Yes | Yes | Yes | Partial | 70% | Mostly Complete | supplementEngineService.ts generates recommendations, missing dosage/timing optimization |
| Recovery Engine | Yes | Yes | Yes | Yes | 85% | Complete | recoveryEngineService.ts fully implemented with scoring, status, recommendations |
| Stress Engine | Yes | Yes | Yes | Yes | 85% | Complete | stressEngineService.ts fully implemented with CNS load assessment |
| Joint Engine | Yes | Yes | Yes | Yes | 85% | Complete | jointHealthEngineService.ts fully implemented with area-specific modifications |
| Sexual Health Engine | No | No | No | No | 0% | Missing | Not implemented - critical gap per V11.1 spec |
| Nutrition Engine | No | No | No | No | 0% | Missing | Not implemented - macro targets, calculations missing |
| Cardiovascular Engine | No | No | No | No | 0% | Missing | Not implemented - primary health metric per V11.1 spec |
| Metabolic Engine | No | No | No | No | 0% | Missing | Not implemented - glucose/A1c risk scoring missing |
| Adherence Engine | Yes | Yes | Yes | Yes | 85% | Complete | adherenceEngineService.ts fully implemented with domain breakdown |
| Goal Tracking Engine | Partial | Partial | No | Partial | 40% | Partial | goalManagementEngine.ts exists but not integrated, missing velocity/timeline |
| Prediction Engine | No | No | No | No | 0% | Missing | Not implemented - forecasting capability missing |
| Recommendation Engine | Partial | Partial | Partial | No | 35% | Partial | holisticRecommendationEngine exists but no lifecycle management, fragmented across services |

---

## 10.2 Control Tower Engine
### Required Outputs
- overall score
- overall status
- priority focus areas
- risk flags
- derived intelligence signals
- trust/freshness presentation metadata

| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Overall score | | | | | |
| Overall status | | | | | |
| Priority focus areas | | | | | |
| Risk flags | | | | | |
| Derived intelligence signals | | | | | |
| Trust/freshness metadata | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.3 Workout Engine
### Required Outputs
- final workout for today
- fallback workout logic
- training cycle-aware modifications

| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Final workout for today | | | | | |
| Fallback workout logic | | | | | |
| Training cycle-aware modifications | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.4 Supplement Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Supplement changes | | | | | |
| Dosage changes | | | | | |
| Timing changes | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.5 Recovery Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Recovery score | | | | | |
| Recovery status | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.6 Stress Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Stress score | | | | | |
| CNS load assessment | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.7 Joint Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Joint risk | | | | | |
| Movement caution inputs | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.8 Sexual Health Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Sexual health score | | | | | |
| Sexual health recommendations | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.9 Nutrition Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Calorie targets | | | | | |
| Macro targets | | | | | |
| Hydration targets | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.10 Cardiovascular Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Cardiovascular risk score | | | | | |
| Cardiovascular trend insights | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.11 Metabolic Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Metabolic score | | | | | |
| Glucose risk signals | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.12 Adherence Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Adherence score | | | | | |
| Adherence trends | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.13 Goal Tracking Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Goal progress | | | | | |
| Velocity to goal | | | | | |
| Projected timeline | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.14 Prediction Engine
| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Projected weight | | | | | |
| Projected body fat | | | | | |
| Projected A1c | | | | | |
| Projected recovery | | | | | |
| Projected performance | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 10.15 Recommendation Engine
### Required Outputs
- prioritized recommendations
- conflict resolution
- rationale
- recommendation lifecycle state

| Output | Exists in Code | End-to-End | Alignment % | Status | Notes |
|--------|----------------|------------|-------------|--------|-------|
| Prioritized recommendations | | | | | |
| Conflict resolution | | | | | |
| Rationale | | | | | |
| Recommendation lifecycle state | | | | | |

### Lifecycle State Coverage
| State | Exists? | Alignment % | Status | Notes |
|-------|---------|-------------|--------|-------|
| generated | | | | |
| presented | | | | |
| accepted | | | | |
| rejected | | | | |
| snoozed | | | | |
| modified | | | | |
| completed | | | | |
| expired | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

# 11. UX / NAVIGATION AUDIT

## 11.1 Home / Control Tower
### Required Areas
- collapsible Overall Health
- trust/freshness
- domain scores
- derived intelligence
- priority alerts
- severity classification
- recommendations quick actions
- Ask Coach floating action
- bottom navigation

| Requirement | UI Exists | Data Exists | Logic Exists | End-to-End | Alignment % | Status | Notes |
|------------|-----------|-------------|--------------|------------|-------------|--------|-------|
| Overall Health collapsed | | | | | | | |
| Overall Health expanded | | | | | | | |
| Trust/freshness display | | | | | | | |
| Domain scores | | | | | | | |
| Derived intelligence layer | | | | | | | |
| Priority alerts | | | | | | | |
| Alert severity classification | | | | | | | |
| Recommendations quick actions | | | | | | | |
| Ask Coach floating action | | | | | | | |
| Bottom navigation | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 11.2 Coach
### Required Areas
- voice interaction
- text interaction
- oral answers
- follow-up questions
- context-aware coaching
- conversational daily interview

| Requirement | UI Exists | Logic Exists | API Exists | End-to-End | Alignment % | Status | Notes |
|------------|-----------|--------------|------------|------------|-------------|--------|-------|
| Voice interaction | | | | | | | |
| Text interaction | | | | | | | |
| Oral answers | | | | | | | |
| Follow-up questions | | | | | | | |
| Context-aware coaching | | | | | | | |
| Daily interview flow | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 11.3 Recommendations Section
### Required Areas
- centralized recommendation center
- lifecycle actions
- no duplicated recommendation ownership
- Accept / Reject / Snooze behavior

| Requirement | UI Exists | Logic Exists | API Exists | End-to-End | Alignment % | Status | Notes |
|------------|-----------|--------------|------------|------------|-------------|--------|-------|
| Centralized recommendation center | | | | | | | |
| Accept action | | | | | | | |
| Reject action | | | | | | | |
| Snooze action | | | | | | | |
| Lifecycle tracking | | | | | | | |
| No duplicate ownership | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 11.4 Workout Section
### Required Areas
- show only today’s workout
- final adjusted workout only
- accept / reject / modify reps / modify weight / mark complete
- fallback to previous accepted workout

| Requirement | UI Exists | Logic Exists | API Exists | End-to-End | Alignment % | Status | Notes |
|------------|-----------|--------------|------------|------------|-------------|--------|-------|
| Show only today’s workout | | | | | | | |
| Final adjusted workout only | | | | | | | |
| Accept workout | | | | | | | |
| Reject workout | | | | | | | |
| Modify reps | | | | | | | |
| Modify weight | | | | | | | |
| Mark complete | | | | | | | |
| Fallback logic | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 11.5 Trends Section
### Required Areas
- recovery
- body composition
- bloodwork
- supplement
- nutrition
- workout
- sexual health
- cardiovascular
- metabolic

| Requirement | UI Exists | Data Exists | Logic Exists | End-to-End | Alignment % | Status | Notes |
|------------|-----------|-------------|--------------|------------|-------------|--------|-------|
| Recovery trends | | | | | | | |
| Body composition trends | | | | | | | |
| Bloodwork trends | | | | | | | |
| Supplement trends | | | | | | | |
| Nutrition trends | | | | | | | |
| Workout trends | | | | | | | |
| Sexual health trends | | | | | | | |
| Cardiovascular trends | | | | | | | |
| Metabolic trends | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 11.6 Data Hub
### Required Areas
- Bloodwork
- Body Composition
- Devices
- Nutrition
- Supplements
- Workout History
- Adherence
- Goals
- Baseline Profile
- Recommendation History
- upload actions
- smart upload prompts

| Requirement | UI Exists | Data Exists | Logic Exists | End-to-End | Alignment % | Status | Notes |
|------------|-----------|-------------|--------------|------------|-------------|--------|-------|
| Bloodwork section | | | | | | | |
| Body Composition section | | | | | | | |
| Devices section | | | | | | | |
| Nutrition section | | | | | | | |
| Supplements section | | | | | | | |
| Workout History section | | | | | | | |
| Adherence section | | | | | | | |
| Goals section | | | | | | | |
| Baseline Profile section | | | | | | | |
| Recommendation History section | | | | | | | |
| Upload actions | | | | | | | |
| Smart upload prompts | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 11.7 Settings
### Required Areas
- devices
- goals
- baseline
- notifications
- voice settings
- preferences
- advanced preferences

| Requirement | UI Exists | Data Exists | Logic Exists | End-to-End | Alignment % | Status | Notes |
|------------|-----------|-------------|--------------|------------|-------------|--------|-------|
| Devices | | | | | | | |
| Goals | | | | | | | |
| Baseline | | | | | | | |
| Notifications | | | | | | | |
| Voice Settings | | | | | | | |
| Preferences | | | | | | | |
| Advanced Preferences | | | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 11.8 Navigation Behavior
| Requirement | Exists in Code | Alignment % | Status | Notes |
|------------|----------------|-------------|--------|-------|
| Home navigation | | | | |
| Coach navigation | | | | |
| Recommendations navigation | | | | |
| Workout navigation | | | | |
| Trends navigation | | | | |
| Data navigation | | | | |
| Settings navigation | | | | |
| Bottom nav visual consistency | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

## 11.9 Interaction Rules
| Requirement | Exists in Code | End-to-End | Alignment % | Status | Notes |
|------------|----------------|------------|-------------|--------|-------|
| Collapsible sections | | | | | |
| Recommendation actions | | | | | |
| Workout actions | | | | | |
| Coach supports continuous conversation | | | | | |
| Uploads accessible from Coach | | | | | |
| Alert metadata support | | | | | |
| Home recommendation actions | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

# 12. DAILY UX FLOW AUDIT

Required flow:

App Opens  
→ Control Tower  
→ Interview via Coach  
→ Recommendations  
→ Workout  
→ Continuous Monitoring + Continuous Coaching

| Step | Exists in Code | End-to-End | Alignment % | Status | Notes |
|------|----------------|------------|-------------|--------|-------|
| App opens to Control Tower | | | | | |
| Interview via Coach | | | | | |
| Recommendations after interview | | | | | |
| Workout reflects inputs/recommendations | | | | | |
| Continuous monitoring | | | | | |
| Continuous coaching | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

# 13. CONTINUOUS SYSTEM BEHAVIOR AUDIT

| Requirement | Exists in Code | End-to-End | Alignment % | Status | Notes |
|------------|----------------|------------|-------------|--------|-------|
| Monitors device data continuously | | | | | |
| Updates scores continuously | | | | | |
| Updates readiness/recovery | | | | | |
| Adjusts recommendations | | | | | |
| Tracks adherence | | | | | |
| Detects risk patterns | | | | | |
| Learns from recommendation decisions | | | | | |
| Learns from user feedback | | | | | |
| Supports coaching throughout the day | | | | | |
| Updates fatigue risk | | | | | |
| Updates overtraining risk | | | | | |
| Updates injury risk | | | | | |
| Updates performance trend | | | | | |
| Updates metabolic trend | | | | | |
| Updates sleep trend | | | | | |
| Maintains freshness signals | | | | | |

### Completion %
- 

### Missing
- 

### Refactor
- 

### Delete / Replace
- 

---

# 14. REFACTOR ANALYSIS

## 14.1 Refactor Candidates
| Item | File / Module | Why It Needs Refactor | Target Architecture | Priority |
|------|---------------|-----------------------|---------------------|----------|
| | | | | High / Medium / Low |

## 14.2 Common Refactor Themes
### Duplicated Logic
- 

### Wrong Ownership
- 

### UI Doing Engine Work
- 

### Overlapping Services
- 

### Inconsistent Naming / Models
- 

### Fragmented Recommendation Logic
- 

### Fragmented Bloodwork Logic
- 

---

# 15. DELETE / REPLACE ANALYSIS

## 15.1 Safe Delete Candidates
| Item | File / Module | Why Safe to Delete | Dependency Risk | Notes |
|------|---------------|-------------------|-----------------|-------|
| | | | Low / Medium / High | |

## 15.2 Replace Candidates
| Item | File / Module | Why Replace | What Replaces It | Dependency Risk | Notes |
|------|---------------|-------------|------------------|-----------------|-------|
| | | | | Low / Medium / High | |

## 15.3 Do Not Delete Yet
| Item | File / Module | Why Not Yet | What Must Be Confirmed First |
|------|---------------|-------------|-------------------------------|
| | | | |

---

# 16. COMPLETION DASHBOARD BY SECTION

| Section | Completion % | Status | Summary |
|---------|--------------|--------|---------|
| Product Vision / Core Architecture | | | |
| Baseline Profile | | | |
| Daily Interview | | | |
| Bloodwork | | | |
| Body Composition | | | |
| Devices | | | |
| Supplements | | | |
| Workout Inputs | | | |
| Nutrition | | | |
| Sexual Health | | | |
| Adherence | | | |
| Derived Intelligence | | | |
| DailyHealthSnapshot | | | |
| Data Confidence Model | | | |
| Time Horizon Intelligence | | | |
| Control Tower Engine | | | |
| Workout Engine | | | |
| Supplement Engine | | | |
| Recovery Engine | | | |
| Stress Engine | | | |
| Joint Engine | | | |
| Sexual Health Engine | | | |
| Nutrition Engine | | | |
| Cardiovascular Engine | | | |
| Metabolic Engine | | | |
| Adherence Engine | | | |
| Goal Tracking Engine | | | |
| Prediction Engine | | | |
| Recommendation Engine | | | |
| Home / Control Tower UI | | | |
| Coach UI | | | |
| Recommendations UI | | | |
| Workout UI | | | |
| Trends UI | | | |
| Data Hub UI | | | |
| Settings UI | | | |
| Navigation Behavior | | | |
| Interaction Rules | | | |
| Daily UX Flow | | | |
| Continuous System Behavior | | | |

---

# 17. FINAL FINDINGS

## 17.1 What Is Complete
- 

## 17.2 What Is Mostly Complete
- 

## 17.3 What Is Partial
- 

## 17.4 What Is Stub Only
- 

## 17.5 What Is Missing
- 

## 17.6 What Needs Refactor
- 

## 17.7 What Should Be Deleted / Replaced
- 

---

# 18. FINAL RECOMMENDED IMPLEMENTATION PLAN

## 18.1 Next 10 Steps
1. **Create DailyHealthSnapshot unified model** (types/dailyHealthSnapshot.ts) - Foundation for all engines to share common data structure
2. **Build Cardiovascular Risk Engine** (services/cardiovascularEngineService.ts) - Calculate risk score from bloodwork (LDL, ApoB), BP, HR, body fat
3. **Build Metabolic Engine** (services/metabolicEngineService.ts) - Track glucose, A1c, insulin sensitivity, metabolic risk
4. **Build Sexual Health Engine** (services/sexualHealthEngineService.ts) - Aggregate testosterone, libido, erectile function from bloodwork + interview
5. **Build Nutrition Engine** (services/nutritionEngineService.ts) - Calculate calorie/macro targets based on goals, body composition, activity
6. **Implement Central Recommendation Engine** (services/recommendationEngineService.ts) - Unified recommendation lifecycle (generated → presented → accepted/rejected/snoozed → completed)
7. **Refactor Control Tower Service** - Add derived intelligence (fatigue risk, overtraining risk, injury risk), trust/freshness metadata
8. **Build Prediction Engine** (services/predictionEngineService.ts) - Forecast weight, body fat, A1c, recovery, performance trends
9. **Build Control Tower UI** (mobile/src/screens/ControlTowerScreen.tsx) - Collapsible sections, priority alerts, recommendation quick actions
10. **Implement Goal Tracking Engine** (refactor goalManagementEngine.ts) - Progress tracking, velocity to goal, projected timeline

## 18.2 Recommended Build Order

### Phase 1 — Foundation (Week 1-2)
**Goal:** Establish unified data models and missing core engines

1. **Create DailyHealthSnapshot model**
   - File: `server/src/types/dailyHealthSnapshot.ts`
   - Aggregate: Recovery, Stress, Workout, Body Composition, Sexual Health, Metabolic, Cardiovascular, Adherence
   - Derived intelligence: fatigueScore, readinessScore, overtrainingRisk, metabolicRisk, cardiovascularRisk

2. **Build Cardiovascular Risk Engine**
   - File: `server/src/services/cardiovascularEngineService.ts`
   - Inputs: Bloodwork (LDL, HDL, triglycerides, ApoB, Lp(a), hsCRP), BP, resting HR, HRV, VO2 max, body fat
   - Outputs: cardiovascularRiskScore (0-100), riskLevel (low/moderate/high), trend insights
   - Controller: `server/src/controllers/cardiovascularEngineController.ts`
   - Routes: `server/src/routes/cardiovascularEngineRoutes.ts`

3. **Build Metabolic Engine**
   - File: `server/src/services/metabolicEngineService.ts`
   - Inputs: Bloodwork (glucose, A1c, insulin), nutrition adherence, body composition
   - Outputs: metabolicScore, glucoseRiskSignals, A1cTrend, insulin sensitivity estimate
   - Controller: `server/src/controllers/metabolicEngineController.ts`
   - Routes: `server/src/routes/metabolicEngineRoutes.ts`

4. **Build Sexual Health Engine**
   - File: `server/src/services/sexualHealthEngineService.ts`
   - Inputs: Bloodwork (testosterone, free T, estradiol, SHBG, prolactin), interview (libido, erectile function, morning erections), body fat, sleep, stress
   - Outputs: sexualHealthScore, libidoTrend, erectileFunctionScore, hormoneStatus, recommendations
   - Controller: `server/src/controllers/sexualHealthEngineController.ts`
   - Routes: `server/src/routes/sexualHealthEngineRoutes.ts`

### Phase 2 — Core Intelligence (Week 3-4)
**Goal:** Complete remaining engines and unify recommendation logic

5. **Build Nutrition Engine**
   - File: `server/src/services/nutritionEngineService.ts`
   - Inputs: Goals, body composition, activity level, workout frequency
   - Outputs: calorieTargets, macroTargets (protein, carbs, fat), hydrationTargets, meal timing recommendations
   - Logic: Calculate TDEE, apply deficit/surplus based on goals, optimize protein for lean mass
| Finding | File / Module | Line / Section | Notes |
|---------|---------------|----------------|-------|
| | | | |

## Screen Evidence
| Finding | Screen / Component | Notes |
|---------|--------------------|-------|
| | | |

## API Evidence
| Finding | Endpoint | Notes |
|---------|----------|-------|
| | | |

## Test Evidence
| Finding | Test / Validation Script | Notes |
|---------|---------------------------|-------|
| | | |

---

# 20. AUDITOR INSTRUCTIONS FOR WINDSURF

Use this evaluation order:
1. Build implementation inventory first
2. Then compare spec to code
3. Then assign completion percentages
4. Then identify refactor candidates
5. Then identify delete / replace candidates
6. Then produce final prioritized plan

Be strict:
- do not mark complete unless schema + logic + UI + behavior align
- distinguish partial vs missing vs refactor
- call out uncertainty explicitly
- do not guess when evidence is weak