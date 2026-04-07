# PHASE 20 - ARCHITECTURE AUDIT
## Vertical Slice Orchestration & Source Provenance

**Date**: 2026-04-07  
**Objective**: Audit existing architecture to identify orchestration points, trigger points, and reusable services  
**Goal**: Transform system from 95% to full end-to-end operational completeness

---

## EXECUTIVE SUMMARY

### Current State (Post Phase 19)
- **Services**: 180+ backend services, 7 new Phase 19 services
- **UI**: 100% complete (49 screens, 19 components)
- **Phase 14-19**: All implemented and operational
- **Completeness**: ~95%

### Remaining Gaps
1. **Backend vertical slice orchestration** - Services exist but not coordinated
2. **Source provenance/metadata** - No formal tracking across ingestion points
3. **Conflict resolution** - No strategy for conflicting data sources
4. **End-to-end propagation** - Fragmented propagation paths
5. **Validation coverage** - Limited orchestration validation

---

## PART 1: EXISTING SERVICES TO REUSE

### ✅ Bloodwork Services (COMPLETE - DO NOT REBUILD)
**Location**: `server/src/services/`

1. **bloodworkDocumentService.ts** - Document CRUD operations
2. **bloodworkExtractionService.ts** - PDF/OCR extraction
3. **bloodworkProcessingService.ts** - Data processing pipeline
4. **bloodworkNormalizationService.ts** - Biomarker normalization
5. **bloodworkTrendService.ts** - Trend analysis
6. **bloodworkRecommendationService.ts** - Recommendation generation
7. **bloodworkContextService.ts** - Context enrichment

**Trigger Points**:
- `bloodworkController.ts` - Upload completion
- OCR completion webhook (if exists)
- Manual processing trigger

**Reuse Strategy**: Coordinate existing services, don't replace

---

### ✅ Body Composition Services (COMPLETE - DO NOT REBUILD)
**Location**: `server/src/services/`

1. **bodyCompositionService.ts** - Upload and processing
2. **bodyCompositionEngine.ts** - Analysis engine
3. **bodyCompositionContextService.ts** - Context enrichment

**Trigger Points**:
- `bodyCompositionController.ts` - Upload completion
- Device sync (if integrated)
- Manual entry

**Reuse Strategy**: Coordinate existing services

---

### ✅ Workout Services (COMPLETE - DO NOT REBUILD)
**Location**: `server/src/services/`

1. **workoutEngineService.ts** - Workout intelligence
2. **workoutPlanService.ts** - Plan management
3. **workoutRecommendationService.ts** - Recommendations
4. **strengthTrackingService.ts** - Strength tracking

**Trigger Points**:
- `workoutBaselineController.ts` - Program upload
- `workoutDocumentController.ts` - Document upload
- Execution task updates

**Reuse Strategy**: Coordinate existing services

---

### ✅ Nutrition Services (COMPLETE - DO NOT REBUILD)
**Location**: `server/src/services/`

**Existing**:
1. **nutritionEngineService.ts** - Nutrition intelligence
2. **nutritionTodayIntegratedService.ts** - Today's nutrition
3. **nutritionExtractionService.ts** - Meal extraction

**Phase 19 Created**:
4. **nutritionPlanNormalizer.ts** - Plan normalization
5. **nutritionExecutionLinkage.ts** - Execution integration

**Trigger Points**:
- `nutritionExtractionController.ts` - Meal logging
- `nutritionTodayIntegratedController.ts` - Today's updates
- Plan upload/update

**Reuse Strategy**: Coordinate all services

---

### ✅ Hydration Services (PHASE 19 - DO NOT REBUILD)
**Location**: `server/src/services/`

1. **hydrationSubsystem.ts** - Complete hydration tracking

**Trigger Points**:
- Daily interview hydration input
- Quick hydration logging
- Device hydration inference

**Reuse Strategy**: Integrate with orchestration

---

### ✅ Cardiovascular Services (COMPLETE - DO NOT REBUILD)
**Location**: `server/src/services/`

**Existing**:
1. **cardiovascularEngineService.ts** - CV intelligence

**Phase 19 Created**:
2. **cardiovascularDataUnifier.ts** - Multi-source unification

**Trigger Points**:
- Bloodwork upload (lipids, glucose)
- BP device sync
- Wearable sync (HR, HRV)
- Baseline profile updates

**Reuse Strategy**: Coordinate all CV sources

---

### ✅ Clinical Document Services (PHASE 19 - DO NOT REBUILD)
**Location**: `server/src/services/`

1. **clinicalDocumentFormalizer.ts** - Document formalization
2. **baselineDocumentService.ts** - Document storage

**Trigger Points**:
- `healthDataHubController.ts` - Document upload
- `baselineDocumentController.ts` - Document upload
- OCR completion

**Reuse Strategy**: Integrate with orchestration

---

### ✅ Medical Context Services (PHASE 19 - DO NOT REBUILD)
**Location**: `server/src/services/`

1. **medicalContextNormalizer.ts** - Context normalization
2. **baselineProfileService.ts** - Baseline profile
3. **baselineContextService.ts** - Context enrichment

**Trigger Points**:
- Baseline profile updates
- Clinical document processing
- Daily interview submission

**Reuse Strategy**: Coordinate all context sources

---

### ✅ Goal Services (COMPLETE - DO NOT REBUILD)
**Location**: `server/src/services/`

**Existing**:
1. **goalManagementEngine.ts** - Goal CRUD and tracking
2. **goalWeightedIntelligenceService.ts** - Goal-weighted intelligence
3. **goalOptimizationService.ts** - Goal optimization
4. **goalScoringService.ts** - Goal scoring

**Phase 19 Created**:
5. **goalProgressAggregator.ts** - Multi-slice aggregation

**Trigger Points**:
- `goalController.ts` - Goal CRUD operations
- Data updates from any slice

**Reuse Strategy**: Coordinate all goal-related services

---

### ✅ Device Integration Services (COMPLETE - DO NOT REBUILD)
**Location**: `server/src/services/`

1. **deviceNormalizationService.ts** - Device data normalization
2. **deviceIntelligenceIntegrationService.ts** - Intelligence integration
3. **appleWatchSyncService.ts** - Apple Watch sync
4. **whoopIntegrationService.ts** (if exists) - Whoop sync
5. **ouraIntegrationService.ts** (if exists) - Oura sync

**Trigger Points**:
- Device sync webhooks
- Scheduled sync jobs
- Manual sync requests

**Reuse Strategy**: Coordinate device data with slices

---

### ✅ Daily Interview Services (COMPLETE - DO NOT REBUILD)
**Location**: `server/src/services/`

1. **interviewAgentService.ts** - AI interview agent
2. **hybridInterviewService.ts** - Hybrid interview
3. **dynamicFollowUpService.ts** - Dynamic follow-ups
4. **voiceInterviewService.ts** - Voice interview

**Trigger Points**:
- `interviewAgentController.ts` - Interview submission
- `hybridInterviewController.ts` - Hybrid submission
- `voiceInterviewController.ts` - Voice submission

**Reuse Strategy**: Extract metrics and propagate to slices

---

### ✅ Execution Services (PHASE 15 - DO NOT REBUILD)
**Location**: Mobile adapters and services

1. **executionAdapter.ts** (mobile) - Execution intelligence
2. **executionService.ts** (mobile) - Execution API calls

**Trigger Points**:
- Task completion/partial/skip
- Adherence updates
- Intervention dismissal

**Reuse Strategy**: Receive tasks from orchestrators

---

### ✅ Predictive Services (PHASE 16 - DO NOT REBUILD)
**Location**: Mobile adapters and services

1. **predictiveBehaviorAdapter.ts** (mobile) - Predictive intelligence
2. **predictiveBehaviorService.ts** (mobile) - Predictive API calls

**Trigger Points**:
- Execution data updates
- Adherence changes
- Pattern detection

**Reuse Strategy**: Receive signals from orchestrators

---

### ✅ Autonomous Adjustment Services (PHASE 17 - DO NOT REBUILD)
**Location**: Mobile adapters and services

1. **autonomousAdjustmentAdapter.ts** (mobile) - Adjustment intelligence
2. **autonomousAdjustmentService.ts** (mobile) - Adjustment API calls

**Trigger Points**:
- Predictive signals
- Execution intelligence
- Risk detection

**Reuse Strategy**: Receive triggers from orchestrators

---

### ✅ Control Tower Services (PHASE 14 - DO NOT REBUILD)
**Location**: `server/src/services/`

1. **controlTowerService.ts** - Main Control Tower
2. **controlTowerDailyService.ts** - Daily brief
3. **controlTowerDeviceIntelligenceService.ts** - Device intelligence

**Trigger Points**:
- Daily regeneration
- On-demand refresh
- Data updates

**Reuse Strategy**: Receive aggregated data from orchestrators

---

## PART 2: EXISTING TRIGGER POINTS

### Upload Completion Triggers ✅
**Controllers with upload endpoints**:

1. **bloodworkController.ts**
   - `uploadBloodworkDocumentController`
   - Triggers: File upload → Storage → Processing

2. **bodyCompositionController.ts**
   - `uploadBodyCompositionController`
   - Triggers: File upload → Storage → Processing

3. **supplementDocumentController.ts**
   - `uploadSupplementDocumentController`
   - Triggers: File upload → Storage → Processing

4. **workoutDocumentController.ts**
   - `uploadWorkoutDocumentController`
   - Triggers: File upload → Storage → Processing

5. **baselineDocumentController.ts**
   - `uploadBaselineDocumentController`
   - Triggers: File upload → Storage → Processing

6. **healthDataHubController.ts**
   - `uploadHealthDocumentController`
   - Triggers: File upload → Storage → Processing

7. **physiqueScanController.ts**
   - `uploadPhysiqueScanController`
   - Triggers: Photo upload → Storage → Processing

**Orchestration Opportunity**: Add post-upload orchestration hooks

---

### Processing Completion Triggers ✅
**Services with processing pipelines**:

1. **bloodworkProcessingService.ts**
   - `processBloodworkDocument()` completion
   - Current: Updates document status
   - **Missing**: Orchestration trigger

2. **bodyCompositionService.ts**
   - Processing completion
   - Current: Updates records
   - **Missing**: Orchestration trigger

**Orchestration Opportunity**: Add post-processing orchestration hooks

---

### Daily Interview Submission Triggers ✅
**Controllers**:

1. **interviewAgentController.ts**
   - Interview submission
   - Current: Stores interview data
   - **Missing**: Metric extraction → orchestration

2. **hybridInterviewController.ts**
   - Hybrid interview submission
   - Current: Stores data
   - **Missing**: Orchestration trigger

3. **voiceInterviewController.ts**
   - Voice interview submission
   - Current: Stores data
   - **Missing**: Orchestration trigger

**Orchestration Opportunity**: Extract metrics and trigger slice updates

---

### Device Sync Triggers ✅
**Services**:

1. **appleWatchSyncService.ts**
   - Sync completion
   - Current: Stores device data
   - **Missing**: Orchestration trigger

2. **Device webhook handlers** (if exist)
   - Whoop, Oura, Garmin webhooks
   - Current: Store data
   - **Missing**: Orchestration trigger

**Orchestration Opportunity**: Trigger recovery/CV slice updates

---

### Execution Task Update Triggers ✅
**Mobile services** (client-side):

1. **executionService.ts**
   - Task completion/partial/skip
   - Current: Updates task status
   - **Missing**: Backend orchestration trigger

**Orchestration Opportunity**: Propagate to adherence/learning/predictions

---

### Meal Logging Triggers ✅
**Controllers**:

1. **nutritionExtractionController.ts**
   - Meal logging
   - Current: Stores meal data
   - **Missing**: Orchestration trigger

2. **mealLogController.ts**
   - Meal logging
   - Current: Stores meal data
   - **Missing**: Orchestration trigger

**Orchestration Opportunity**: Update nutrition adherence, generate interventions

---

### Goal CRUD Triggers ✅
**Controllers**:

1. **goalController.ts**
   - Goal create/update/delete
   - Current: Updates goal records
   - **Missing**: Orchestration trigger for progress recalculation

**Orchestration Opportunity**: Trigger goal progress aggregation

---

## PART 3: EXISTING PROVENANCE/METADATA

### Current Provenance Tracking ❌ **MINIMAL**

**What Exists**:
- Upload timestamps in document tables
- Source fields (e.g., `source: 'manual_upload'`)
- User ID associations
- Test dates / effective dates

**What's Missing**:
- Formal source metadata model
- Confidence scoring
- Data quality assessment
- Freshness tracking
- Conflict detection
- Source precedence rules
- Provenance lookup service

**Gap**: **NO FORMAL PROVENANCE SYSTEM**

---

## PART 4: PROPAGATION ANALYSIS

### Current Propagation Paths

#### Bloodwork → Downstream ⚠️ **FRAGMENTED**
**Current**:
- Bloodwork processing → Document status update
- Trend service may run independently
- Recommendations may be generated
- **Missing**: Automatic propagation to CV unifier, goal progress, Control Tower

**Gap**: No orchestrated propagation

---

#### Body Composition → Downstream ⚠️ **FRAGMENTED**
**Current**:
- Upload → Processing → Storage
- **Missing**: Automatic propagation to goal progress, predictions

**Gap**: No orchestrated propagation

---

#### Workout → Execution → Predictions ⚠️ **FRAGMENTED**
**Current**:
- Workout plan upload → Storage
- **Missing**: Automatic execution task generation, adherence tracking

**Gap**: No orchestrated propagation

---

#### Nutrition → Execution → Adherence ⚠️ **FRAGMENTED**
**Current**:
- Meal logging → Storage
- **Missing**: Automatic execution task updates, adherence calculation, interventions

**Gap**: Phase 19 services exist but not wired to triggers

---

#### Device Data → Recovery → Predictions ⚠️ **FRAGMENTED**
**Current**:
- Device sync → Storage
- **Missing**: Automatic recovery intelligence update, prediction updates

**Gap**: No orchestrated propagation

---

#### Clinical Docs → Medical Context → Constraints ⚠️ **FRAGMENTED**
**Current**:
- Document upload → Storage
- **Missing**: Automatic extraction, context normalization, constraint propagation

**Gap**: Phase 19 services exist but not wired to triggers

---

### Propagation Summary
**Status**: **HIGHLY FRAGMENTED**
- Services exist but operate independently
- No automatic propagation between layers
- Manual/scheduled updates instead of event-driven
- No guaranteed consistency

---

## PART 5: WHAT SHOULD NOT BE CHANGED

### ✅ DO NOT TOUCH

#### Backend Services
- All 180+ existing services
- All Phase 19 services
- All service APIs and signatures
- All database schemas (additive only)

#### Frontend
- All 49 screens
- All 19 components
- All Phase 14-17 UI
- Navigation structure

#### APIs
- All existing controller endpoints
- All existing route definitions
- All existing request/response formats

#### Data Models
- Existing database tables
- Existing type definitions
- Existing interfaces

---

## PART 6: ORCHESTRATION OPPORTUNITIES

### 1. **Post-Upload Orchestration** 🎯
**Trigger**: Upload completion
**Orchestrate**:
- Storage confirmation
- Processing initiation
- Provenance registration
- Downstream propagation

---

### 2. **Post-Processing Orchestration** 🎯
**Trigger**: Processing completion
**Orchestrate**:
- Normalization
- Trend updates
- Goal progress updates
- Control Tower updates
- Prediction updates

---

### 3. **Daily Interview Orchestration** 🎯
**Trigger**: Interview submission
**Orchestrate**:
- Metric extraction
- Recovery slice update
- Hydration slice update
- Medical context update
- Execution task generation

---

### 4. **Device Sync Orchestration** 🎯
**Trigger**: Sync completion
**Orchestrate**:
- Data normalization
- Recovery intelligence update
- CV data unification
- Execution implications
- Prediction updates

---

### 5. **Meal Logging Orchestration** 🎯
**Trigger**: Meal logged
**Orchestrate**:
- Nutrition adherence calculation
- Execution task updates
- Intervention generation
- Goal progress updates

---

### 6. **Execution Task Orchestration** 🎯
**Trigger**: Task completion/partial/skip
**Orchestrate**:
- Adherence updates
- Learning intelligence
- Prediction updates
- Autonomous adjustment triggers

---

### 7. **Goal Update Orchestration** 🎯
**Trigger**: Goal create/update
**Orchestrate**:
- Progress recalculation
- Multi-slice aggregation
- Prediction updates
- Adjustment triggers

---

## PART 7: RECOMMENDED ARCHITECTURE

### Source Provenance Layer
```
SourceProvenance {
  id, userId, sourceType, sourceSystem, sourceId,
  domain, ingestedAt, effectiveDate,
  freshnessStatus, confidenceScore, dataQuality,
  rawReference, normalizedReference,
  conflictFlags, resolvedBy, resolvedAt
}
```

### Orchestrator Pattern
```
VerticalSliceOrchestrator {
  - Coordinates existing services
  - Registers provenance
  - Handles conflicts
  - Propagates to downstream
  - Generates explainability
}
```

### Trigger Integration
```
Controller → Service → Orchestrator → Propagation
```

---

## PART 8: IMPLEMENTATION PRIORITIES

### Priority 1: Foundation (Week 1)
1. Source provenance model and service
2. Conflict resolution strategy
3. Orchestrator base class/pattern

### Priority 2: Critical Slices (Week 2)
4. Bloodwork orchestrator
5. Nutrition orchestrator
6. Device/Recovery orchestrator

### Priority 3: Remaining Slices (Week 3)
7. Body composition orchestrator
8. Workout orchestrator
9. CV orchestrator
10. Clinical context orchestrator

### Priority 4: Integration (Week 4)
11. Wire all trigger points
12. Validation suite
13. Observability

---

## CONCLUSION

**Current State**: Services exist but operate independently  
**Gap**: Orchestration, provenance, propagation  
**Approach**: Coordinate existing services, don't rebuild  
**Outcome**: Transform 95% → 100% end-to-end operational system

The architecture is solid. We need to add the orchestration layer that coordinates everything into a coherent operating system.
