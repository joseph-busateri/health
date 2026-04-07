# PHASE 3: RECOMMENDATION ENGINE DOCUMENTATION

**Date:** April 3, 2026  
**Status:** Complete  
**Architecture:** Central recommendation ownership with lifecycle management

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Lifecycle Model](#lifecycle-model)
4. [Prioritization Model](#prioritization-model)
5. [Conflict Detection](#conflict-detection)
6. [Request/Response Model](#requestresponse-model)
7. [Migration Plan](#migration-plan)
8. [API Reference](#api-reference)
9. [Database Schema](#database-schema)
10. [Integration Guide](#integration-guide)

---

## OVERVIEW

The RecommendationEngine is the **central owner** of all health recommendations in the system. It manages the complete lifecycle from generation to completion, handles prioritization, detects conflicts, and persists all recommendation data.

### Key Responsibilities

1. **Collect** recommendation requests from engines
2. **Prioritize** recommendations based on multiple factors
3. **Manage** lifecycle states (generated → presented → accepted → completed)
4. **Detect** conflicts between recommendations
5. **Persist** all recommendations in a unified table

### What It Does NOT Do

- ❌ Generate domain-specific recommendations (that's the engines' job)
- ❌ Make health decisions (that's the user's job)
- ❌ Own engine-specific logic (engines remain independent)

---

## ARCHITECTURE PRINCIPLES

### Principle 1: Central Ownership

**Rule:** Engines do NOT directly own recommendation lifecycle.

**Before (Wrong):**
```typescript
// ❌ Engine owns recommendation lifecycle
class RecoveryEngine {
  generateRecommendation() {
    const rec = { ... };
    this.recommendations.push(rec); // Engine owns it
    return rec;
  }
}
```

**After (Correct):**
```typescript
// ✅ Engine emits request, RecommendationEngine owns lifecycle
class RecoveryEngine {
  async calculate(userId: string) {
    // Calculate recovery metrics
    const recoveryScore = ...;
    
    // Emit recommendation REQUEST if needed
    if (recoveryScore < 50) {
      await recommendationEngine.createRecommendation({
        userId,
        request: {
          sourceEngine: 'recovery',
          title: 'Take a rest day',
          description: '...',
          priority: 'important',
          // ...
        }
      });
    }
    
    // Return domain intelligence only
    return { recoveryScore, ... };
  }
}
```

### Principle 2: Consumes DailyHealthSnapshot

The RecommendationEngine consumes the unified `DailyHealthSnapshot` to make holistic recommendations.

```typescript
// ✅ RecommendationEngine consumes snapshot
const snapshot = await generateDailyHealthSnapshot(userId);

// Use snapshot data to generate holistic recommendations
if (snapshot.derivedIntelligence.fatigueRisk === 'high') {
  await recommendationEngine.createRecommendation({
    userId,
    request: {
      sourceEngine: 'holistic',
      title: 'Address high fatigue risk',
      description: 'Multiple signals indicate high fatigue...',
      priority: 'critical',
      // ...
    }
  });
}
```

### Principle 3: Safe Handling of Missing Data

All recommendation logic must handle missing data and low confidence gracefully.

```typescript
// ✅ Safe handling of missing data
if (snapshot.cardiovascular?.riskScore) {
  const confidence = snapshot.cardiovascular.confidence;
  
  if (confidence === 'high' && snapshot.cardiovascular.riskScore > 70) {
    // High confidence, high risk → critical recommendation
    priority = 'critical';
  } else if (confidence === 'medium') {
    // Medium confidence → important recommendation with caveat
    priority = 'important';
    description += ' (Note: Limited data available, consider bloodwork)';
  } else {
    // Low confidence → skip recommendation or make it low priority
    return; // Don't recommend without sufficient data
  }
}
```

---

## LIFECYCLE MODEL

### State Diagram

```
generated → presented → accepted → completed
                     ↓           ↓
                  rejected    expired
                     ↓
                  snoozed → (back to presented when timer expires)
                     ↓
                  modified → accepted → completed
```

### State Definitions

| State | Description | User Action | System Action |
|-------|-------------|-------------|---------------|
| **generated** | Just created by engine | None yet | Store in database |
| **presented** | Shown to user in UI | View recommendation | Set `presented_at` timestamp |
| **accepted** | User accepted | Click "Accept" | Set `accepted_at` timestamp |
| **rejected** | User rejected | Click "Reject" | Set `rejected_at` timestamp, optionally capture reason |
| **snoozed** | User snoozed for later | Click "Snooze" | Set `snoozed_at` and `snoozed_until` timestamps |
| **modified** | User modified details | Edit recommendation | Set `modified_at`, store `user_modified_details` |
| **completed** | User marked as done | Click "Complete" | Set `completed_at` timestamp |
| **expired** | Recommendation expired | None | Set `expired_at` timestamp, capture reason |

### State Transitions

**Valid Transitions:**

```typescript
const VALID_TRANSITIONS: Record<RecommendationState, RecommendationState[]> = {
  generated: ['presented', 'expired'],
  presented: ['accepted', 'rejected', 'snoozed', 'expired'],
  accepted: ['completed', 'modified', 'expired'],
  rejected: [], // Terminal state
  snoozed: ['presented', 'expired'],
  modified: ['accepted', 'completed', 'expired'],
  completed: [], // Terminal state
  expired: [], // Terminal state
};
```

**Terminal States:**
- `rejected` - User explicitly rejected, cannot transition
- `completed` - User completed, cannot transition
- `expired` - Recommendation expired, cannot transition

### Lifecycle Timestamps

Every state transition sets an appropriate timestamp:

```typescript
interface Recommendation {
  // Lifecycle timestamps
  generatedAt: string;      // Always set
  presentedAt?: string;     // Set when state → presented
  acceptedAt?: string;      // Set when state → accepted
  rejectedAt?: string;      // Set when state → rejected
  snoozedAt?: string;       // Set when state → snoozed
  snoozedUntil?: string;    // Set when state → snoozed (when to re-present)
  modifiedAt?: string;      // Set when state → modified
  completedAt?: string;     // Set when state → completed
  expiredAt?: string;       // Set when state → expired
}
```

### Automatic Expiration

Recommendations can expire automatically based on:

1. **Time-based expiration:**
   ```typescript
   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
   ```

2. **Superseded by newer recommendation:**
   ```typescript
   // New recommendation for same target supersedes old one
   if (existingRec.actionTarget === newRec.actionTarget) {
     await expireRecommendation(existingRec.id, 'Superseded by newer recommendation');
   }
   ```

3. **Condition no longer applies:**
   ```typescript
   // Recovery improved, rest recommendation no longer needed
   if (recoveryScore > 70 && rec.title === 'Take a rest day') {
     await expireRecommendation(rec.id, 'Recovery improved');
   }
   ```

---

## PRIORITIZATION MODEL

### Priority Levels

**3 Priority Levels:**

1. **Critical** - Health risk, immediate attention required
   - Examples: High cardiovascular risk, injury risk, medical consultation needed
   - UI: Red badge, top of list, push notification

2. **Important** - Significant impact on health/performance
   - Examples: Supplement adjustment, workout modification, nutrition change
   - UI: Orange badge, middle of list, in-app notification

3. **Optimization** - Nice to have, incremental improvement
   - Examples: Sleep optimization, performance enhancement
   - UI: Blue badge, bottom of list, no notification

### Prioritization Algorithm

**Final Score Calculation:**

```typescript
function calculatePriorityScore(recommendation: Recommendation): number {
  // Priority weights (0-100)
  const priorityWeights = {
    critical: 100,
    important: 70,
    optimization: 40,
  };
  
  // Confidence multipliers (0-1)
  const confidenceWeights = {
    high: 1.0,
    medium: 0.8,
    low: 0.6,
  };
  
  // Components
  const priorityWeight = priorityWeights[recommendation.priority];
  const urgencyWeight = recommendation.urgencyScore || 50; // 0-100
  const confidenceWeight = confidenceWeights[recommendation.confidenceLevel];
  const dataQualityWeight = (recommendation.dataQualityScore || 50) / 100;
  
  // Recency bonus (decays over time)
  const ageInHours = (Date.now() - new Date(recommendation.generatedAt).getTime()) / (1000 * 60 * 60);
  const recencyWeight = Math.max(0, 100 - ageInHours);
  
  // Final score
  const finalScore = (
    (priorityWeight * 0.4) +      // 40% priority
    (urgencyWeight * 0.3) +       // 30% urgency
    (recencyWeight * 0.1)         // 10% recency
  ) * confidenceWeight            // Confidence multiplier
    * dataQualityWeight;          // Data quality multiplier
  
  return finalScore;
}
```

### Urgency Score Guidelines

**Urgency Score (0-100):**

| Score Range | Urgency Level | Example |
|-------------|---------------|---------|
| 90-100 | Immediate | Injury detected, medical consultation needed |
| 70-89 | High | High cardiovascular risk, severe overtraining |
| 50-69 | Medium | Moderate fatigue, supplement adjustment |
| 30-49 | Low | Minor optimization, performance enhancement |
| 0-29 | Very Low | Long-term goal, educational content |

### Sorting Logic

Recommendations are sorted by:

1. **Priority level** (critical > important > optimization)
2. **Final score** (within same priority level)
3. **Generated date** (newer first, as tiebreaker)

```typescript
function sortRecommendations(recs: Recommendation[]): Recommendation[] {
  return recs.sort((a, b) => {
    // 1. Priority level
    const priorityOrder = { critical: 1, important: 2, optimization: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // 2. Final score
    const scoreA = calculatePriorityScore(a);
    const scoreB = calculatePriorityScore(b);
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Higher score first
    }
    
    // 3. Generated date (newer first)
    return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
  });
}
```

---

## CONFLICT DETECTION

### Conflict Types

**5 Conflict Types:**

1. **Contradictory** - Directly contradicts (e.g., increase vs decrease same thing)
2. **Mutually Exclusive** - Can't do both (e.g., rest day vs heavy workout)
3. **Resource Conflict** - Limited resources (e.g., time, budget)
4. **Timing Conflict** - Same time slot
5. **Dependency** - One depends on the other
6. **Redundant** - Essentially the same recommendation

### Conflict Detection Rules

**Rule 1: Contradictory Actions on Same Target**

```typescript
{
  name: 'contradictory_actions',
  detect: (recA, recB) => {
    if (recA.actionTarget !== recB.actionTarget) return false;
    
    const contradictoryPairs = [
      ['add', 'remove'],
      ['increase', 'decrease'],
      ['start', 'stop'],
    ];
    
    return contradictoryPairs.some(([action1, action2]) =>
      (recA.actionType === action1 && recB.actionType === action2) ||
      (recA.actionType === action2 && recB.actionType === action1)
    );
  },
  conflictType: 'contradictory',
  severity: 'high',
}
```

**Example:**
- Rec A: "Increase Creatine to 10g/day"
- Rec B: "Decrease Creatine to 3g/day"
- **Conflict:** Contradictory actions on same target (Creatine)

**Rule 2: Rest vs Intense Workout**

```typescript
{
  name: 'rest_vs_workout',
  detect: (recA, recB) => {
    const isRest = (rec) => rec.title.toLowerCase().includes('rest');
    const isIntense = (rec) => rec.description.toLowerCase().includes('heavy');
    
    return (isRest(recA) && isIntense(recB)) || (isRest(recB) && isIntense(recA));
  },
  conflictType: 'mutually_exclusive',
  severity: 'critical',
}
```

**Example:**
- Rec A: "Take a rest day"
- Rec B: "Perform heavy deadlifts"
- **Conflict:** Mutually exclusive (can't rest and lift heavy)

**Rule 3: Supplement Interactions**

```typescript
{
  name: 'supplement_interactions',
  detect: (recA, recB) => {
    if (recA.category !== 'supplement_adjustment') return false;
    if (recB.category !== 'supplement_adjustment') return false;
    
    const interactions = {
      'Iron': ['Calcium', 'Zinc'],
      'Calcium': ['Iron', 'Magnesium'],
      'Zinc': ['Iron', 'Copper'],
    };
    
    return interactions[recA.actionTarget]?.includes(recB.actionTarget);
  },
  conflictType: 'contradictory',
  severity: 'medium',
}
```

**Example:**
- Rec A: "Add Iron supplement"
- Rec B: "Add Calcium supplement"
- **Conflict:** Iron and Calcium interfere with absorption

**Rule 4: Redundant Recommendations**

```typescript
{
  name: 'redundant_recommendations',
  detect: (recA, recB) => {
    return (
      recA.category === recB.category &&
      recA.actionType === recB.actionType &&
      recA.actionTarget === recB.actionTarget
    );
  },
  conflictType: 'redundant',
  severity: 'low',
}
```

**Example:**
- Rec A: "Add Creatine 5g/day" (from Recovery Engine)
- Rec B: "Add Creatine 5g/day" (from Supplement Engine)
- **Conflict:** Redundant (same recommendation from different sources)

**Rule 5: Medical Consultation Priority**

```typescript
{
  name: 'medical_consultation_priority',
  detect: (recA, recB) => {
    const isMedical = (rec) => rec.category === 'medical_consultation';
    const isOther = (rec) => rec.category !== 'medical_consultation';
    
    return (isMedical(recA) && isOther(recB)) || (isMedical(recB) && isOther(recA));
  },
  conflictType: 'dependency',
  severity: 'high',
}
```

**Example:**
- Rec A: "Consult doctor about high blood pressure"
- Rec B: "Increase cardio intensity"
- **Conflict:** Medical consultation should be addressed first

### Conflict Severity

| Severity | Description | Action |
|----------|-------------|--------|
| **Critical** | Dangerous if both followed | Block both, require user choice |
| **High** | Significant issue | Warn user, suggest resolution |
| **Medium** | Potential problem | Inform user, allow override |
| **Low** | Minor issue | Auto-resolve, notify user |

### Automatic Conflict Resolution

**Resolution Strategies:**

1. **keep_higher_priority** - Keep the higher priority recommendation, expire the lower
2. **keep_both** - Keep both, warn user about conflict
3. **merge** - Combine into single recommendation
4. **user_choice** - Let user decide which to keep
5. **automatic** - System resolves based on rules

**Auto-Resolution Logic:**

```typescript
function resolveConflictAutomatically(conflict: RecommendationConflict): ResolutionStrategy | null {
  switch (conflict.conflictType) {
    case 'redundant':
      return 'keep_higher_priority'; // Keep higher priority, expire duplicate
    
    case 'dependency':
      return 'keep_higher_priority'; // Medical consultation takes priority
    
    case 'contradictory':
      if (conflict.conflictSeverity === 'critical') {
        return 'user_choice'; // Let user decide on critical conflicts
      }
      return 'keep_higher_priority';
    
    case 'mutually_exclusive':
      return 'user_choice'; // Always let user choose
    
    default:
      return null; // No automatic resolution
  }
}
```

---

## REQUEST/RESPONSE MODEL

### Recommendation Request (Engine → RecommendationEngine)

**Engines emit requests, not full recommendations:**

```typescript
interface RecommendationRequest {
  // Source
  sourceEngine: SourceEngine;
  sourceRecordId?: string; // Link to engine record
  
  // Content
  title: string;
  description: string;
  rationale?: string; // Why this recommendation
  
  // Priority
  priority: RecommendationPriority;
  urgencyScore?: number; // 0-100
  
  // Category
  category: RecommendationCategory;
  
  // Action
  actionType?: ActionType;
  actionTarget?: string;
  actionDetails?: Record<string, any>;
  
  // Confidence
  confidenceLevel: ConfidenceLevel;
  dataQualityScore?: number; // 0-100
  
  // Expiration
  expiresAt?: Date;
  expirationReason?: string;
}
```

**Example Request:**

```typescript
const request: RecommendationRequest = {
  sourceEngine: 'recovery',
  sourceRecordId: 'rec-123',
  title: 'Take a rest day',
  description: 'Your recovery score is 35/100, indicating poor recovery. Consider taking a full rest day to allow your body to recover.',
  rationale: 'Low HRV (42ms), poor sleep quality (2/5), and high workout load (85/100) indicate accumulated fatigue.',
  priority: 'important',
  urgencyScore: 75,
  category: 'workout_modification',
  actionType: 'modify',
  actionTarget: 'Today\'s Workout',
  actionDetails: {
    modification: 'rest_day',
    originalWorkout: 'Heavy Deadlifts',
  },
  confidenceLevel: 'high',
  dataQualityScore: 90,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  expirationReason: 'Recovery status changes daily',
};
```

### Create Recommendation Response

```typescript
interface CreateRecommendationResult {
  recommendation: Recommendation; // Full recommendation with ID, timestamps, etc.
  conflicts: RecommendationConflict[]; // Any detected conflicts
}
```

### Batch Create Request

```typescript
interface BatchCreateRecommendationsInput {
  userId: string;
  requests: RecommendationRequest[];
}

interface BatchCreateRecommendationsResult {
  created: Recommendation[];
  conflicts: RecommendationConflict[];
  errors: Array<{
    request: RecommendationRequest;
    error: string;
  }>;
}
```

---

## MIGRATION PLAN

### Phase 1: Database Setup (Week 1)

**Tasks:**
1. ✅ Create `recommendations` table migration
2. ✅ Create `recommendation_history` table migration
3. ✅ Create `recommendation_conflicts` table migration
4. ✅ Create helper functions (get_active_recommendations, etc.)
5. ⏳ Run migrations in Supabase
6. ⏳ Verify tables created correctly

### Phase 2: Service Layer (Week 1)

**Tasks:**
1. ✅ Create `recommendationEngine.ts` types
2. ✅ Create `recommendationEngineService.ts`
3. ✅ Implement conflict detection rules
4. ✅ Implement prioritization logic
5. ✅ Create controller and routes
6. ⏳ Test service layer with unit tests

### Phase 3: Engine Integration (Week 2)

**Migrate existing engines to emit requests:**

**Recovery Engine:**
```typescript
// OLD (owns recommendations)
async function getRecoveryToday(userId: string) {
  const recovery = calculateRecovery(...);
  
  // ❌ Generates recommendation directly
  const recommendation = {
    type: 'rest_day',
    message: 'Take a rest day',
  };
  
  return { recovery, recommendation };
}

// NEW (emits request)
async function getRecoveryToday(userId: string) {
  const recovery = calculateRecovery(...);
  
  // ✅ Emits recommendation request if needed
  if (recovery.recoveryScore < 50) {
    await recommendationEngine.createRecommendation({
      userId,
      request: {
        sourceEngine: 'recovery',
        sourceRecordId: recovery.id,
        title: 'Take a rest day',
        description: `Recovery score is ${recovery.recoveryScore}/100...`,
        priority: 'important',
        urgencyScore: 100 - recovery.recoveryScore,
        category: 'workout_modification',
        confidenceLevel: 'high',
      },
    });
  }
  
  // Return domain intelligence only
  return recovery;
}
```

**Migration Checklist:**

- [ ] Recovery Engine
- [ ] Stress Engine
- [ ] Joint Health Engine
- [ ] Adherence Engine
- [ ] Workout Engine
- [ ] Supplement Engine
- [ ] Nutrition Engine (new)
- [ ] Cardiovascular Engine (new)
- [ ] Metabolic Engine (new)
- [ ] Sexual Health Engine (new)

### Phase 4: UI Integration (Week 2-3)

**Update UI to consume from RecommendationEngine:**

**OLD:**
```typescript
// ❌ Fetches recommendations from multiple engines
const recoveryRecs = await api.get('/recovery/recommendations');
const stressRecs = await api.get('/stress/recommendations');
const supplementRecs = await api.get('/supplements/recommendations');
// ... merge and sort manually
```

**NEW:**
```typescript
// ✅ Fetches all recommendations from central engine
const { data } = await api.get(`/recommendations/prioritized/${userId}`);

// Already prioritized and sorted
const { critical, important, optimization, conflicts } = data;
```

**UI Components to Update:**

- [ ] Home screen recommendation card
- [ ] Recommendations list screen
- [ ] Recommendation detail screen
- [ ] Recommendation action buttons (accept/reject/snooze)
- [ ] Conflict resolution UI

### Phase 5: Deprecate Old Code (Week 3-4)

**Do NOT delete yet, but mark as deprecated:**

1. Mark old recommendation fields in engine responses as `@deprecated`
2. Add console warnings when old recommendation code is used
3. Document migration path for each deprecated function
4. Plan deletion for Phase 4 (after full migration)

**Files to Deprecate (NOT delete):**

- `holisticRecommendationEngine.ts` - Replace with RecommendationEngine
- `unifiedRecommendationEngine.ts` - Replace with RecommendationEngine
- Individual engine recommendation logic - Move to RecommendationEngine requests

### Phase 6: Validation (Week 4)

**Validation Checklist:**

- [ ] All engines emit requests instead of owning recommendations
- [ ] All recommendations flow through RecommendationEngine
- [ ] Conflict detection working correctly
- [ ] Prioritization accurate
- [ ] Lifecycle transitions working
- [ ] UI displays recommendations correctly
- [ ] No duplicate recommendation logic
- [ ] Performance acceptable (<100ms for prioritization)

---

## API REFERENCE

### Create Recommendation

**POST** `/recommendations`

```typescript
Request:
{
  userId: string;
  request: RecommendationRequest;
}

Response:
{
  success: true;
  data: {
    recommendation: Recommendation;
    conflicts: RecommendationConflict[];
  }
}
```

### Batch Create Recommendations

**POST** `/recommendations/batch`

```typescript
Request:
{
  userId: string;
  requests: RecommendationRequest[];
}

Response:
{
  success: true;
  data: {
    created: Recommendation[];
    conflicts: RecommendationConflict[];
    errors: Array<{ request, error }>;
  }
}
```

### Get Active Recommendations

**GET** `/recommendations/active/:userId`

```typescript
Response:
{
  success: true;
  data: {
    recommendations: Recommendation[];
    conflicts: RecommendationConflict[];
    totalCount: number;
  }
}
```

### Get Prioritized Recommendations

**GET** `/recommendations/prioritized/:userId`

```typescript
Response:
{
  success: true;
  data: {
    critical: Recommendation[];
    important: Recommendation[];
    optimization: Recommendation[];
    conflicts: RecommendationConflict[];
  }
}
```

### Accept Recommendation

**POST** `/recommendations/:recommendationId/accept`

```typescript
Request:
{
  userNotes?: string;
}

Response:
{
  success: true;
  data: Recommendation; // Updated recommendation
}
```

### Reject Recommendation

**POST** `/recommendations/:recommendationId/reject`

```typescript
Request:
{
  rejectionReason?: string;
}

Response:
{
  success: true;
  data: Recommendation;
}
```

### Snooze Recommendation

**POST** `/recommendations/:recommendationId/snooze`

```typescript
Request:
{
  snoozedUntil: string; // ISO date
  snoozeReason?: string;
}

Response:
{
  success: true;
  data: Recommendation;
}
```

### Complete Recommendation

**POST** `/recommendations/:recommendationId/complete`

```typescript
Request:
{
  userNotes?: string;
}

Response:
{
  success: true;
  data: Recommendation;
}
```

### Modify Recommendation

**POST** `/recommendations/:recommendationId/modify`

```typescript
Request:
{
  modifiedDetails: Record<string, any>;
  userNotes?: string;
}

Response:
{
  success: true;
  data: Recommendation;
}
```

---

## DATABASE SCHEMA

### recommendations Table

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  source_engine TEXT NOT NULL,
  source_record_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT,
  priority TEXT NOT NULL, -- 'critical', 'important', 'optimization'
  urgency_score INTEGER,
  category TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'generated',
  -- Lifecycle timestamps
  generated_at TIMESTAMPTZ NOT NULL,
  presented_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  snoozed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  modified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  -- Action details
  action_type TEXT,
  action_target TEXT,
  action_details JSONB,
  -- Confidence
  confidence_level TEXT NOT NULL,
  data_quality_score INTEGER,
  -- Conflicts
  conflicts_with UUID[],
  conflict_reason TEXT,
  conflict_resolved BOOLEAN DEFAULT FALSE,
  -- User interaction
  user_notes TEXT,
  user_modified_details JSONB,
  rejection_reason TEXT,
  snooze_reason TEXT,
  -- Expiration
  expires_at TIMESTAMPTZ,
  expiration_reason TEXT,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

### recommendation_history Table

```sql
CREATE TABLE recommendation_history (
  id UUID PRIMARY KEY,
  recommendation_id UUID NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  transition_reason TEXT,
  user_action BOOLEAN DEFAULT FALSE,
  transitioned_at TIMESTAMPTZ NOT NULL,
  metadata JSONB
);
```

### recommendation_conflicts Table

```sql
CREATE TABLE recommendation_conflicts (
  id UUID PRIMARY KEY,
  recommendation_a_id UUID NOT NULL,
  recommendation_b_id UUID NOT NULL,
  conflict_type TEXT NOT NULL,
  conflict_severity TEXT NOT NULL,
  conflict_description TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolution_strategy TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  detected_at TIMESTAMPTZ NOT NULL
);
```

---

## INTEGRATION GUIDE

### For Engine Developers

**Step 1: Calculate domain intelligence**

```typescript
export async function getMyEngine(userId: string): Promise<MyEngineRecord> {
  // 1. Fetch data
  const data = await fetchUserData(userId);
  
  // 2. Calculate metrics
  const score = calculateScore(data);
  const status = determineStatus(score);
  
  // 3. Create record
  const record: MyEngineRecord = {
    id: uuidv4(),
    userId,
    score,
    status,
    // ... other fields
    createdAt: new Date().toISOString(),
  };
  
  // 4. Store record
  await storeRecord(record);
  
  return record;
}
```

**Step 2: Emit recommendation requests (if needed)**

```typescript
export async function getMyEngine(userId: string): Promise<MyEngineRecord> {
  const record = await calculateAndStore(userId);
  
  // Emit recommendation request if conditions met
  if (record.score < 50) {
    await recommendationEngine.createRecommendation({
      userId,
      request: {
        sourceEngine: 'my_engine',
        sourceRecordId: record.id,
        title: 'Take action',
        description: 'Your score is low...',
        rationale: 'Based on X, Y, Z metrics...',
        priority: 'important',
        urgencyScore: 100 - record.score,
        category: 'lifestyle_change',
        actionType: 'modify',
        actionTarget: 'Daily Routine',
        confidenceLevel: 'high',
        dataQualityScore: 90,
      },
    });
  }
  
  return record;
}
```

**Step 3: Return domain intelligence only**

```typescript
// ✅ Return domain intelligence
return record;

// ❌ Do NOT return recommendations
// return { record, recommendations: [...] };
```

### For UI Developers

**Fetch prioritized recommendations:**

```typescript
const { data } = await api.get(`/recommendations/prioritized/${userId}`);
const { critical, important, optimization, conflicts } = data;
```

**Display by priority:**

```tsx
<RecommendationsList>
  {critical.length > 0 && (
    <PrioritySection title="Critical" badge="red">
      {critical.map(rec => <RecommendationCard key={rec.id} {...rec} />)}
    </PrioritySection>
  )}
  
  {important.length > 0 && (
    <PrioritySection title="Important" badge="orange">
      {important.map(rec => <RecommendationCard key={rec.id} {...rec} />)}
    </PrioritySection>
  )}
  
  {optimization.length > 0 && (
    <PrioritySection title="Optimization" badge="blue">
      {optimization.map(rec => <RecommendationCard key={rec.id} {...rec} />)}
    </PrioritySection>
  )}
</RecommendationsList>
```

**Handle user actions:**

```typescript
// Accept
await api.post(`/recommendations/${rec.id}/accept`, {
  userNotes: 'Will do this today',
});

// Reject
await api.post(`/recommendations/${rec.id}/reject`, {
  rejectionReason: 'Not applicable to me',
});

// Snooze
await api.post(`/recommendations/${rec.id}/snooze`, {
  snoozedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  snoozeReason: 'Remind me next week',
});

// Complete
await api.post(`/recommendations/${rec.id}/complete`, {
  userNotes: 'Done! Feeling better',
});
```

---

## SUMMARY

**Phase 3 Complete:**

✅ Created 2 database migrations (engine tables + recommendations table)  
✅ Created type definitions with full lifecycle model  
✅ Created service with conflict detection and prioritization  
✅ Created controller and routes  
✅ Documented lifecycle, prioritization, and conflict detection  
✅ Provided migration plan from old recommendation logic  

**Ready for:**
- Database migration execution
- Engine integration (Phase 3 Week 2)
- UI integration (Phase 3 Week 2-3)
- Old code deprecation (Phase 3 Week 3-4)

**Architecture Benefits:**
- Single source of truth for all recommendations
- Consistent lifecycle management
- Automatic conflict detection
- Intelligent prioritization
- Clean separation of concerns (engines calculate, RecommendationEngine manages)
