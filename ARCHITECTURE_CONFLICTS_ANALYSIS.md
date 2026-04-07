# ARCHITECTURE CONFLICTS ANALYSIS

**Date:** April 3, 2026  
**Purpose:** Identify conflicts with proposed architecture decisions before implementation

---

# PROPOSED ARCHITECTURE DECISIONS

## Decision 1: DailyHealthSnapshot as Shared Aggregation Model
**Principle:** DailyHealthSnapshot will be the single, unified data structure that all engines read from and write to.

## Decision 2: RecommendationEngine as Central Owner
**Principle:** RecommendationEngine will be the sole owner of recommendation generation, prioritization, lifecycle management, and conflict resolution.

## Decision 3: ControlTowerService as Aggregator Only
**Principle:** ControlTowerService will only aggregate and present intelligence, not contain scattered business rules or calculations.

---

# CONFLICT ANALYSIS

## ⚠️ CONFLICT 1: Multiple Aggregation Models Exist

### Current State
The codebase has **THREE different aggregation patterns** competing with the proposed DailyHealthSnapshot:

#### 1.1 EngineSnapshot (engineStateService.ts)
**File:** `server/src/services/engineStateService.ts`

**Current Structure:**
```typescript
export interface EngineSnapshot {
  workout?: WorkoutEngineState;
  supplement?: SupplementEngineState;
  recoveryCluster?: RecoveryClusterEngineState;
}
```

**Usage:**
- Used by `supplementEngineService.ts` (line 26): `const engineState = await getEngineSnapshot(userId);`
- Used by `workoutTodayService.ts` (line 137): `const snapshot = await getEngineSnapshot(userId);`
- Used by `interviewContextAggregator.ts` (line 119): `const engineSnapshot = await getEngineSnapshot(userId);`

**Problem:** This is a **partial snapshot** that only covers 3 areas (workout, supplement, recovery cluster). It's stored in **in-memory Maps**, not the database, and doesn't include cardiovascular, metabolic, sexual health, nutrition, or prediction data.

**Conflict Severity:** 🔴 **HIGH** - Directly conflicts with DailyHealthSnapshot as the unified model

---

#### 1.2 InterviewContext (interviewContextAggregator.ts)
**File:** `server/src/services/interviewContextAggregator.ts`

**Current Structure:**
```typescript
export interface InterviewContext {
  userId: string;
  recovery?: { score, sleepHours, sleepQuality, recoveryFeeling };
  stress?: { level, sources, trend };
  jointPain?: { hasActivePain, location, severity };
  workoutAdherence?: number;
  supplementAdherence?: number;
  nutrition?: { adherence };
  bloodwork?: { hasRecentResults, criticalFlags, flags, recommendations };
  controlTower?: { overallHealthScore, status, dailyRecommendation };
  sexualHealth?: { libido, performance, concerns };
}
```

**Usage:**
- Used by interview services to aggregate context for AI
- Calls multiple engines directly (lines 15-145)
- **Contains business logic** for calculating `controlTower.overallHealthScore` (lines 122-132):
  ```typescript
  overallHealthScore: Math.round(
    (engineSnapshot.recoveryCluster.recoveryScore * 0.3) +
    (engineSnapshot.recoveryCluster.stressScore * 0.25) +
    (engineSnapshot.recoveryCluster.jointScore * 0.2) +
    (engineSnapshot.recoveryCluster.adherenceScore * 0.25)
  )
  ```

**Problem:** This is **interview-specific aggregation** with **embedded business rules** for calculating overall health score. This violates Decision 3 (ControlTowerService should not contain business rules).

**Conflict Severity:** 🟡 **MEDIUM** - Overlaps with DailyHealthSnapshot and contains misplaced business logic

---

#### 1.3 UnifiedHealthProfile (healthProfileAggregation.ts - referenced but not shown)
**File:** Referenced in `holisticRecommendationEngine.ts` line 35

**Usage:**
```typescript
const profile = await generateUnifiedHealthProfile(userId);
```

**Problem:** Another aggregation model used specifically for holistic recommendations. Creates a **third competing pattern**.

**Conflict Severity:** 🟡 **MEDIUM** - Yet another aggregation pattern

---

### Resolution Strategy for Conflict 1

**Action Plan:**

1. **Create DailyHealthSnapshot as the single source of truth**
   - Implement `server/src/services/dailyHealthSnapshotService.ts`
   - Implement `server/src/types/dailyHealthSnapshot.ts`

2. **Migrate EngineSnapshot consumers to DailyHealthSnapshot**
   - Update `supplementEngineService.ts` to use DailyHealthSnapshot
   - Update `workoutTodayService.ts` to use DailyHealthSnapshot
   - Update `interviewContextAggregator.ts` to use DailyHealthSnapshot

3. **Delete EngineSnapshot after migration**
   - Delete `engineStateService.ts` (entire file)
   - Remove in-memory Map stores (workoutEngineStore, supplementEngineStore, recoveryClusterEngineStore)

4. **Refactor InterviewContext to be a view of DailyHealthSnapshot**
   - Make `aggregateInterviewContext()` call `getDailyHealthSnapshot(userId)` and transform it
   - Remove all direct engine calls from interviewContextAggregator.ts
   - Remove business logic (overall health score calculation) - move to ControlTowerService

5. **Consolidate UnifiedHealthProfile into DailyHealthSnapshot**
   - Merge any unique fields from UnifiedHealthProfile into DailyHealthSnapshot
   - Update `holisticRecommendationEngine.ts` to use DailyHealthSnapshot

**Migration Order:**
1. Week 1: Create DailyHealthSnapshot model and service
2. Week 1-2: Update all engines to write to DailyHealthSnapshot
3. Week 2: Migrate EngineSnapshot consumers to DailyHealthSnapshot
4. Week 2: Delete EngineSnapshot and engineStateService.ts
5. Week 3: Refactor InterviewContext to be a view of DailyHealthSnapshot

---

## ⚠️ CONFLICT 2: Fragmented Recommendation Generation

### Current State
Recommendations are generated in **10+ different places** across the codebase:

#### 2.1 Individual Engine Recommendations
Each engine generates its own recommendations independently:

1. **recoveryEngineService.ts** (line 167)
   ```typescript
   const recommendation = generateRecoveryRecommendation(recoveryStatus, sourceInputs);
   ```

2. **stressEngineService.ts** (line 141)
   ```typescript
   const recommendation = generateStressRecommendation(stressStatus, cnsLoadStatus);
   ```

3. **jointHealthEngineService.ts** (line 170)
   ```typescript
   const recommendation = generateJointRecommendations(affectedArea, jointHealthStatus);
   ```

4. **supplementEngineService.ts** (lines 21-220)
   - Generates supplement recommendations directly
   - Returns `SupplementRecommendationResult` with array of recommendations

5. **workoutTodayService.ts** (lines 164-174)
   - Generates workout adjustments (deload, modifications)
   - Not explicitly called "recommendations" but serves same purpose

6. **goalManagementEngine.ts** (line 592)
   ```typescript
   logger.info('Goal recommendations generated', { userId, count: recommendations.length });
   ```

7. **injuryPreventionEngine.ts** (line 397)
   ```typescript
   logger.info('Preventive recommendations generated', { userId, count: recommendations.length });
   ```

8. **recoveryOptimizationEngine.ts** (line 377)
   ```typescript
   logger.info('Deload recommendation generated', { userId, urgency: check.urgency });
   ```

9. **analyticsEngine.ts** (lines 92, 164, 324)
   - Generates correlation recommendations
   - Generates trend recommendations
   - Generates goal recommendations

#### 2.2 Specialized Recommendation Services

10. **bloodworkRecommendationService.ts** (line 385)
    ```typescript
    export async function generateBloodworkRecommendationsForUser(
      request: GenerateRecommendationsRequest
    ): Promise<GenerateRecommendationsResponse>
    ```
    - Generates bloodwork-specific recommendations
    - Has its own lifecycle management
    - Stores in separate `bloodwork_recommendations` table

11. **holisticRecommendationEngine.ts** (line 25)
    ```typescript
    export async function generateHolisticRecommendations(
      request: GenerateHolisticRecommendationsRequest
    ): Promise<HolisticAnalysisResult>
    ```
    - Hybrid decision tree + AI recommendations
    - Returns `HolisticRecommendation[]`

12. **unifiedRecommendationEngine.ts** (line 704)
    ```typescript
    export async function generateUnifiedRecommendations(
      request: GenerateRecommendationsRequest
    ): Promise<GenerateRecommendationsResponse>
    ```
    - Attempts to unify recommendations
    - Uses AI to generate recommendations
    - Has lifecycle management (supersede, accept, dismiss)
    - Stores in `unified_recommendations` table

**Problem:** There are **at least 12 different places** generating recommendations with:
- No central coordination
- No conflict detection
- No unified prioritization
- No consistent lifecycle management
- Multiple database tables (bloodwork_recommendations, unified_recommendations, plus in-memory stores)

**Conflict Severity:** 🔴 **CRITICAL** - Directly violates Decision 2 (RecommendationEngine as central owner)

---

### Resolution Strategy for Conflict 2

**Action Plan:**

1. **Create Central RecommendationEngine**
   - Implement `server/src/services/recommendationEngineService.ts`
   - Single database table: `recommendations`
   - Unified lifecycle: generated → presented → accepted → rejected → snoozed → completed → expired

2. **Refactor Individual Engines**
   - Engines should **emit recommendation requests**, not create recommendations directly
   - Example:
     ```typescript
     // OLD (current):
     const recommendation = generateRecoveryRecommendation(recoveryStatus, sourceInputs);
     
     // NEW (proposed):
     await recommendationEngine.requestRecommendation({
       source: 'recovery_engine',
       type: 'deload',
       priority: 'important',
       rationale: 'Recovery score is low',
       suggestedActions: ['Reduce workout intensity by 20%']
     });
     ```

3. **Consolidate Recommendation Tables**
   - Migrate `bloodwork_recommendations` → `recommendations` table
   - Migrate `unified_recommendations` → `recommendations` table
   - Add `source` field to track which engine generated it

4. **Implement Central Conflict Detection**
   - RecommendationEngine checks for conflicts before presenting to user
   - Example conflicts:
     - "Increase workout intensity" vs "Reduce workout load"
     - "Add supplement X" vs "Remove supplement X"
   - Resolution: Higher priority wins, or present both with warning

5. **Implement Central Prioritization**
   - RecommendationEngine sorts by:
     1. Severity (critical > important > optimization)
     2. Impact on goals
     3. Confidence level
   - Limit to top 5-7 active recommendations

6. **Delete Fragmented Recommendation Logic**
   - Remove recommendation generation from individual engines
   - Keep only recommendation **request** logic
   - Delete standalone recommendation services (bloodworkRecommendationService, holisticRecommendationEngine)
   - Consolidate into central RecommendationEngine

**Migration Order:**
1. Week 4: Create central RecommendationEngine with lifecycle management
2. Week 4: Migrate bloodwork_recommendations and unified_recommendations to central table
3. Week 5: Refactor Recovery, Stress, Joint engines to emit recommendation requests
4. Week 5: Refactor Supplement, Workout engines to emit recommendation requests
5. Week 6: Refactor Goal, Injury Prevention, Analytics engines to emit recommendation requests
6. Week 6: Delete bloodworkRecommendationService.ts, holisticRecommendationEngine.ts
7. Week 6: Implement conflict detection and prioritization

---

## ⚠️ CONFLICT 3: ControlTowerService Contains Business Logic

### Current State
ControlTowerService currently contains **embedded business rules and calculations**:

#### 3.1 Hardcoded Score Derivations
**File:** `server/src/services/controlTowerService.ts`

**Lines 79-105:**
```typescript
// Cardiovascular (CV) - Placeholder (would come from bloodwork/devices)
// For now, use adherence cardiovascular if available, otherwise default
const cvScore = adherence ? Math.round((adherence.adherenceScore + 10) * 0.9) : 72;

// Metabolic (MET) - Based on adherence nutrition
const metScore = adherence?.breakdown?.nutrition ?? 75;

// Performance (PERF) - Based on joint health and adherence workout
let perfScore: number | null = null;
if (jointHealth && adherence) {
  // Derive joint score from status: stable=85, caution=65, aggravated=40
  const jointScoreMap = { stable: 85, caution: 65, aggravated: 40 };
  const jointScore = jointScoreMap[jointHealth.jointHealthStatus] || 70;
  const workoutScore = adherence.breakdown?.workout ?? 70;
  perfScore = Math.round((jointScore + workoutScore) / 2);
} else if (jointHealth) {
  const jointScoreMap = { stable: 85, caution: 65, aggravated: 40 };
  perfScore = jointScoreMap[jointHealth.jointHealthStatus] || 70;
} else if (adherence?.breakdown?.workout) {
  perfScore = adherence.breakdown.workout;
} else {
  perfScore = 70;
}

// Sexual Health (SH) - Placeholder (would come from bloodwork/interviews)
// For now, use recovery as proxy (good recovery correlates with hormones)
const shScore = recovery ? Math.round(recovery.recoveryScore * 1.1) : 70;
```

**Problem:** ControlTowerService is **deriving scores** and **applying business rules**:
- Calculating CV score from adherence (line 81)
- Calculating metabolic score from nutrition adherence (line 84)
- Calculating performance score from joint health + workout adherence (lines 87-101)
- Calculating sexual health score from recovery (line 105)

These calculations should be in **dedicated engines** (Cardiovascular Engine, Metabolic Engine, Sexual Health Engine), not in ControlTowerService.

#### 3.2 Weighted Score Calculation
**Lines 107-126:**
```typescript
// Calculate overall score (weighted average of available components)
const componentScores = [
  { score: cvScore, weight: 0.25 },
  { score: recScore, weight: 0.25 },
  { score: metScore, weight: 0.20 },
  { score: perfScore, weight: 0.20 },
  { score: shScore, weight: 0.10 },
];

let totalWeight = 0;
let weightedSum = 0;

componentScores.forEach(({ score, weight }) => {
  if (score !== null) {
    weightedSum += score * weight;
    totalWeight += weight;
  }
});

const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
```

**Problem:** This weighted calculation is **business logic** that should be in a dedicated service, not in ControlTowerService. ControlTowerService should only **aggregate and present** data that's already been calculated.

#### 3.3 Status Mapping Functions
**Lines 35-48:**
```typescript
function scoreToStatus(score: number | null): ComponentStatus {
  if (score === null) return 'At Risk';
  if (score >= 80) return 'Optimal';
  if (score >= 60) return 'Stable';
  if (score >= 40) return 'Moderate';
  return 'At Risk';
}

function calculateOverallStatus(score: number | null): OverallStatus {
  if (score === null) return 'No Data';
  if (score >= 80) return 'Optimal';
  if (score >= 60) return 'Stable';
  return 'At Risk';
}
```

**Problem:** These are **business rules** (thresholds for status classification) embedded in ControlTowerService.

**Conflict Severity:** 🔴 **HIGH** - Directly violates Decision 3 (ControlTowerService as aggregator only)

---

### Resolution Strategy for Conflict 3

**Action Plan:**

1. **Move Score Derivations to Dedicated Engines**
   - Create `cardiovascularEngineService.ts` - calculate CV score from bloodwork, BP, HR
   - Create `metabolicEngineService.ts` - calculate metabolic score from glucose, A1c, nutrition
   - Create `sexualHealthEngineService.ts` - calculate SH score from testosterone, libido, erectile function
   - Performance score should come from existing workout/joint engines, not derived in Control Tower

2. **Refactor ControlTowerService to Pure Aggregation**
   - Remove all score derivation logic (lines 79-105)
   - Remove weighted calculation logic (lines 107-126)
   - ControlTowerService should only:
     ```typescript
     export async function getControlTowerOverallHealth(userId: string): Promise<ControlTowerData> {
       // Get DailyHealthSnapshot (already calculated by engines)
       const snapshot = await getDailyHealthSnapshot(userId);
       
       // Simply transform and present the data
       return {
         overallScore: snapshot.derivedIntelligence.overallScore,
         overallStatus: snapshot.derivedIntelligence.overallStatus,
         overallTrend: snapshot.derivedIntelligence.overallTrend,
         components: {
           cv: { score: snapshot.cardiovascular.riskScore, status: snapshot.cardiovascular.riskLevel },
           rec: { score: snapshot.recovery.score, status: snapshot.recovery.status },
           met: { score: snapshot.metabolic.score, status: snapshot.metabolic.status },
           perf: { score: snapshot.workout.readinessScore, status: snapshot.workout.readinessStatus },
           sh: { score: snapshot.sexualHealth.score, status: snapshot.sexualHealth.status },
         },
         timestamp: snapshot.timestamp,
         dataAvailability: snapshot.dataQuality,
       };
     }
     ```

3. **Move Business Rules to Configuration**
   - Status thresholds (80=Optimal, 60=Stable, etc.) should be in a config file
   - Component weights (CV=0.25, REC=0.25, etc.) should be in a config file
   - This allows easy tuning without code changes

4. **Move Weighted Calculation to DailyHealthSnapshotService**
   - The overall score calculation should happen in `dailyHealthSnapshotService.ts`
   - It should be calculated once when the snapshot is generated
   - ControlTowerService just reads and presents it

**Migration Order:**
1. Week 1-2: Create Cardiovascular, Metabolic, Sexual Health engines
2. Week 5: Refactor ControlTowerService to remove all business logic
3. Week 5: Move weighted calculation to DailyHealthSnapshotService
4. Week 5: Move status thresholds and weights to config file

---

## ⚠️ CONFLICT 4: Duplicate Recommendation Tables

### Current State
Multiple database tables for recommendations:

1. **bloodwork_recommendations** table
   - Used by `bloodworkRecommendationService.ts`
   - Has its own schema and lifecycle

2. **unified_recommendations** table
   - Used by `unifiedRecommendationEngine.ts`
   - Has lifecycle states: active, accepted, dismissed, superseded

3. **In-memory recommendation stores**
   - Individual engines store recommendations in memory
   - Not persisted to database

**Problem:** No single source of truth for recommendations. Data is fragmented across multiple tables and in-memory stores.

**Conflict Severity:** 🟡 **MEDIUM** - Makes central RecommendationEngine implementation harder

---

### Resolution Strategy for Conflict 4

**Action Plan:**

1. **Create Single Recommendations Table**
   - Database migration to create `recommendations` table with unified schema
   - Fields: id, user_id, source, type, priority, status, rationale, actions, created_at, updated_at, expires_at

2. **Migrate Existing Data**
   - Migrate `bloodwork_recommendations` → `recommendations` (add source='bloodwork')
   - Migrate `unified_recommendations` → `recommendations` (preserve lifecycle states)

3. **Delete Old Tables**
   - Drop `bloodwork_recommendations` table
   - Drop `unified_recommendations` table

**Migration Order:**
1. Week 4: Create new `recommendations` table
2. Week 4: Migrate data from old tables
3. Week 4: Update services to use new table
4. Week 4: Drop old tables

---

# SUMMARY OF CONFLICTS

| Conflict | Severity | Files Affected | Resolution Complexity |
|----------|----------|----------------|----------------------|
| Multiple Aggregation Models | 🔴 HIGH | engineStateService.ts, interviewContextAggregator.ts, healthProfileAggregation.ts | Large - requires creating DailyHealthSnapshot and migrating all consumers |
| Fragmented Recommendations | 🔴 CRITICAL | 12+ files across engines and services | Large - requires central RecommendationEngine and refactoring all engines |
| ControlTower Business Logic | 🔴 HIGH | controlTowerService.ts | Medium - requires creating missing engines and refactoring Control Tower |
| Duplicate Recommendation Tables | 🟡 MEDIUM | Database schema | Small - database migration |

---

# RESOLUTION ROADMAP

## Phase 1: Foundation (Weeks 1-2)
**Goal:** Create DailyHealthSnapshot and missing engines

✅ **DO FIRST:**
1. Create `DailyHealthSnapshot` model and service
2. Create Cardiovascular, Metabolic, Sexual Health engines
3. Update existing engines (Recovery, Stress, Joint, Adherence) to write to DailyHealthSnapshot

⚠️ **DO NOT:**
- Delete EngineSnapshot yet (engines still using it)
- Delete InterviewContext yet (interview services still using it)
- Refactor ControlTowerService yet (missing engines not built)

## Phase 2: Migration (Weeks 3-4)
**Goal:** Migrate consumers to DailyHealthSnapshot and create central RecommendationEngine

✅ **DO:**
1. Migrate EngineSnapshot consumers to DailyHealthSnapshot
2. Delete `engineStateService.ts` and in-memory stores
3. Create central `RecommendationEngine` with unified table
4. Migrate bloodwork_recommendations and unified_recommendations to central table

⚠️ **DO NOT:**
- Delete individual engine recommendation logic yet (RecommendationEngine not integrated)
- Refactor ControlTowerService yet (still need to test new engines)

## Phase 3: Refactoring (Weeks 5-6)
**Goal:** Refactor ControlTowerService and integrate RecommendationEngine

✅ **DO:**
1. Refactor ControlTowerService to pure aggregation (remove business logic)
2. Refactor all engines to emit recommendation requests (not create recommendations)
3. Refactor InterviewContext to be a view of DailyHealthSnapshot
4. Delete bloodworkRecommendationService.ts, holisticRecommendationEngine.ts

⚠️ **DO NOT:**
- Rush this phase - test thoroughly at each step
- Delete files until replacements are fully tested

## Phase 4: Cleanup (Weeks 7-8)
**Goal:** Remove all deprecated code

✅ **DO:**
1. Delete all deprecated files
2. Drop old database tables
3. Remove in-memory stores
4. Update all documentation

---

# FILES TO DELETE (After Migration)

## Week 2 (After DailyHealthSnapshot Migration)
- ❌ `server/src/services/engineStateService.ts` - Replaced by DailyHealthSnapshot
- ❌ `server/src/services/healthProfileAggregation.ts` - Consolidated into DailyHealthSnapshot

## Week 4 (After RecommendationEngine Creation)
- ❌ Database table: `bloodwork_recommendations` - Migrated to `recommendations`
- ❌ Database table: `unified_recommendations` - Migrated to `recommendations`

## Week 6 (After RecommendationEngine Integration)
- ❌ `server/src/services/bloodworkRecommendationService.ts` - Replaced by central RecommendationEngine
- ❌ `server/src/services/holisticRecommendationEngine.ts` - Replaced by central RecommendationEngine
- ❌ `server/src/services/unifiedRecommendationEngine.ts` - Replaced by central RecommendationEngine

## Week 6 (After InterviewContext Refactor)
- ❌ `server/src/services/interviewContextAggregator.ts` - Refactored to use DailyHealthSnapshot (keep file, gut contents)

---

# CRITICAL SUCCESS FACTORS

## ✅ Must Do Before Coding

1. **Create DailyHealthSnapshot schema first**
   - Get the data model right before building anything else
   - Review with team/stakeholders
   - Plan for extensibility

2. **Create central RecommendationEngine schema**
   - Design unified lifecycle states
   - Plan conflict detection strategy
   - Design prioritization algorithm

3. **Document migration path for each conflict**
   - Clear step-by-step plan
   - Rollback strategy for each step
   - Test plan for each migration

## ⚠️ Must NOT Do

1. **Do NOT delete EngineSnapshot until all consumers migrated**
   - supplementEngineService.ts depends on it
   - workoutTodayService.ts depends on it
   - interviewContextAggregator.ts depends on it

2. **Do NOT delete recommendation services until RecommendationEngine is integrated**
   - bloodworkRecommendationService.ts still in use
   - unifiedRecommendationEngine.ts still in use
   - Individual engines still generating recommendations

3. **Do NOT refactor ControlTowerService until missing engines are built**
   - Cardiovascular Engine must exist first
   - Metabolic Engine must exist first
   - Sexual Health Engine must exist first

---

# VALIDATION CHECKLIST

Before starting implementation, confirm:

- [ ] DailyHealthSnapshot schema reviewed and approved
- [ ] Migration path for EngineSnapshot → DailyHealthSnapshot documented
- [ ] Migration path for fragmented recommendations → RecommendationEngine documented
- [ ] Migration path for ControlTowerService business logic → dedicated engines documented
- [ ] Database migration scripts planned for recommendation tables
- [ ] Rollback strategy documented for each phase
- [ ] Test plan created for each migration step
- [ ] Team alignment on architecture decisions
- [ ] No code will be deleted until replacements are tested and working

---

# CONCLUSION

The current codebase has **significant conflicts** with all three proposed architecture decisions:

1. **DailyHealthSnapshot conflicts:** 3 competing aggregation models (EngineSnapshot, InterviewContext, UnifiedHealthProfile)
2. **RecommendationEngine conflicts:** 12+ places generating recommendations independently
3. **ControlTowerService conflicts:** Embedded business logic and score derivations

**Recommendation:** Follow the phased resolution roadmap strictly. Do NOT skip steps or delete code prematurely. Each phase builds on the previous one, and rushing will break existing functionality.

**Estimated Effort:** 6-8 weeks to fully resolve all conflicts and align with proposed architecture.
