# PHASE 3: AI-ASSISTED RECOMMENDATION ENRICHMENT ARCHITECTURE

**Date:** April 3, 2026  
**Status:** Design Complete  
**Approach:** Deterministic Intelligence + AI Enrichment + Normalization

---

## ARCHITECTURE OVERVIEW

### Core Principle

**Engines produce deterministic health intelligence. AI enriches it into user-facing recommendations.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RECOMMENDATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

1. ENGINES (Deterministic)
   ↓
   Produce health intelligence only
   - Recovery score: 35/100
   - Status: poor_recovery
   - Metrics: HRV 30ms, Sleep 5h, Stress 4/5
   
2. DAILY HEALTH SNAPSHOT (Aggregation)
   ↓
   Aggregates all engine outputs
   - recovery: { score: 35, status: 'poor_recovery', ... }
   - stress: { score: 75, level: 'high', ... }
   - cardiovascular: { riskScore: 65, ... }
   
3. RECOMMENDATION ANALYSIS (Interpretation)
   ↓
   Interprets snapshot + engine outputs
   - Identifies recommendation opportunities
   - Builds structured evidence
   - Determines recommendation type
   
4. AI ENRICHMENT (Natural Language)
   ↓
   AI generates user-facing content
   - Title: "Take a recovery day"
   - Description: "Your body needs rest..."
   - Rationale: "Based on low HRV, poor sleep..."
   
5. NORMALIZATION (Constraint)
   ↓
   Constrains AI output to schema
   - Validates required fields
   - Enforces field types
   - Applies business rules
   
6. RECOMMENDATION ENGINE (Persistence)
   ↓
   Persists and lifecycle-manages
   - Stores recommendation
   - Detects conflicts
   - Manages state transitions
```

---

## LAYER RESPONSIBILITIES

### Layer 1: Engines (Deterministic)

**Responsibility:** Calculate health intelligence ONLY

**What They Do:**
- ✅ Calculate scores, metrics, status
- ✅ Identify health signals
- ✅ Return structured data

**What They DON'T Do:**
- ❌ Generate recommendation text
- ❌ Decide what to recommend
- ❌ Create user-facing content

**Example Output:**
```typescript
{
  id: 'rec-123',
  userId: 'user-456',
  recoveryScore: 35,
  recoveryStatus: 'poor_recovery',
  readinessClassification: 'recovery_focus',
  sourceInputs: {
    hrv: 30,
    sleepDurationHours: 5,
    sleepQuality: 2,
    restingHr: 75,
    stressLevel: 4,
    workoutLoad: 9,
  },
  // NO recommendation field
}
```

### Layer 2: DailyHealthSnapshot (Aggregation)

**Responsibility:** Aggregate all engine outputs

**What It Does:**
- ✅ Calls all engines in parallel
- ✅ Aggregates outputs into unified snapshot
- ✅ Calculates derived intelligence

**What It Doesn't Do:**
- ❌ Generate recommendations
- ❌ Interpret health signals

**Example Output:**
```typescript
{
  userId: 'user-456',
  date: '2026-04-03',
  recovery: { score: 35, status: 'poor_recovery', ... },
  stress: { score: 75, level: 'high', ... },
  cardiovascular: { riskScore: 65, ... },
  derivedIntelligence: {
    overallScore: 42,
    fatigueRisk: 'high',
    readinessScore: 35,
  },
}
```

### Layer 3: Recommendation Analysis (Interpretation)

**Responsibility:** Interpret snapshot and identify recommendation opportunities

**What It Does:**
- ✅ Analyzes DailyHealthSnapshot
- ✅ Identifies recommendation triggers
- ✅ Builds structured evidence
- ✅ Determines recommendation type/category
- ✅ Calculates confidence and data quality

**What It Doesn't Do:**
- ❌ Generate user-facing text
- ❌ Hard-code recommendation outcomes

**Example Output:**
```typescript
{
  recommendationType: 'workout_modification',
  trigger: 'poor_recovery',
  evidence: {
    recoveryScore: 35,
    recoveryStatus: 'poor_recovery',
    contributingFactors: [
      { metric: 'hrv', value: 30, threshold: 50, status: 'low' },
      { metric: 'sleep', value: 5, threshold: 7, status: 'insufficient' },
      { metric: 'stress', value: 4, threshold: 3, status: 'high' },
    ],
  },
  priority: 'important',
  urgencyScore: 75,
  confidenceLevel: 'high',
  dataQualityScore: 85,
}
```

### Layer 4: AI Enrichment (Natural Language)

**Responsibility:** Generate user-facing recommendation content

**What It Does:**
- ✅ Receives structured evidence
- ✅ Generates title, description, rationale
- ✅ Provides reason codes
- ✅ Suggests supporting metrics
- ✅ Determines if insight-only or actionable

**What It Doesn't Do:**
- ❌ Calculate health metrics
- ❌ Determine priority/urgency (uses analysis layer values)

**Example Input (Prompt):**
```typescript
{
  context: {
    userName: 'John',
    currentGoal: 'Build strength',
    recentActivity: 'Heavy training week',
  },
  evidence: {
    recoveryScore: 35,
    recoveryStatus: 'poor_recovery',
    contributingFactors: [...],
  },
  recommendationType: 'workout_modification',
  priority: 'important',
}
```

**Example Output (AI Response):**
```typescript
{
  title: 'Take a recovery day',
  description: 'Your body is showing clear signs of fatigue. Taking a full rest day will help you recover and prevent overtraining.',
  rationale: 'Your HRV is 40% below your baseline, you only got 5 hours of sleep, and your stress levels are elevated. These signals indicate your body needs rest.',
  reasonCodes: ['low_hrv', 'insufficient_sleep', 'high_stress', 'accumulated_fatigue'],
  recommendationGroup: 'recovery_optimization',
  supportingMetrics: [
    { name: 'HRV', value: '30ms', status: 'low', change: '-40%' },
    { name: 'Sleep Duration', value: '5h', status: 'insufficient', target: '7-9h' },
    { name: 'Stress Level', value: '4/5', status: 'high' },
  ],
  isInsightOnly: false,
  requiresUserDecision: true,
}
```

### Layer 5: Normalization (Constraint)

**Responsibility:** Constrain AI output to strict schema

**What It Does:**
- ✅ Validates required fields
- ✅ Enforces field types
- ✅ Applies business rules
- ✅ Sanitizes content
- ✅ Ensures consistency

**What It Doesn't Do:**
- ❌ Generate new content
- ❌ Modify AI intent

**Example Normalization:**
```typescript
// AI Output (potentially invalid)
{
  title: 'You should really consider taking a rest day because...',
  description: null, // Missing
  reasonCodes: 'low_hrv', // Wrong type (should be array)
}

// Normalized Output
{
  title: 'Take a rest day', // Truncated to max length, cleaned
  description: 'Your body needs rest.', // Default if missing
  reasonCodes: ['low_hrv'], // Converted to array
}
```

### Layer 6: RecommendationEngine (Persistence)

**Responsibility:** Persist and lifecycle-manage recommendations

**What It Does:**
- ✅ Stores recommendations
- ✅ Detects conflicts
- ✅ Manages state transitions
- ✅ Handles deduplication
- ✅ Tracks lifecycle

**What It Doesn't Do:**
- ❌ Generate recommendations
- ❌ Interpret health signals

---

## FIELD OWNERSHIP

### A. Deterministic Engines

**Fields Calculated by Engines:**
- `sourceEngine` - Which engine produced this
- `sourceRecordId` - Link to engine record
- `priority` - Based on health severity (critical/important/optimization)
- `urgencyScore` - Based on severity + time sensitivity
- `category` - Type of recommendation (workout_modification, etc.)
- `actionType` - What action to take (modify, add, remove, etc.)
- `actionTarget` - What to act on (Today's Workout, Creatine, etc.)
- `confidenceLevel` - Based on data availability
- `dataQualityScore` - Based on data availability + recency + accuracy

**Example:**
```typescript
// From Recovery Engine
{
  sourceEngine: 'recovery',
  sourceRecordId: 'rec-123',
  priority: 'important', // Calculated: recoveryScore < 50
  urgencyScore: 75, // Calculated: 100 - recoveryScore
  category: 'workout_modification',
  actionType: 'modify',
  actionTarget: 'Today\'s Workout',
  confidenceLevel: 'high', // 7/8 data points available
  dataQualityScore: 85, // Based on availability + recency
}
```

### B. AI Analysis

**Fields Generated by AI:**
- `title` - User-facing title
- `description` - User-facing description
- `rationale` - Why this recommendation
- `reasonCodes` - Structured reason codes
- `recommendationGroup` - Logical grouping
- `supportingMetrics` - Metrics to display
- `isInsightOnly` - Just info or actionable?
- `requiresUserDecision` - Needs user choice?

**Example:**
```typescript
// From AI Enrichment
{
  title: 'Take a recovery day',
  description: 'Your body is showing clear signs of fatigue...',
  rationale: 'Your HRV is 40% below baseline, you only got 5 hours of sleep...',
  reasonCodes: ['low_hrv', 'insufficient_sleep', 'high_stress'],
  recommendationGroup: 'recovery_optimization',
  supportingMetrics: [
    { name: 'HRV', value: '30ms', status: 'low', change: '-40%' },
    { name: 'Sleep', value: '5h', status: 'insufficient' },
  ],
  isInsightOnly: false,
  requiresUserDecision: true,
}
```

### C. Normalization

**Fields Enforced by Normalization:**
- All field types validated
- Required fields ensured
- Max lengths enforced
- Enum values validated
- Business rules applied

**Example:**
```typescript
// Normalization Rules
{
  title: {
    required: true,
    maxLength: 100,
    sanitize: true,
  },
  description: {
    required: true,
    maxLength: 500,
    sanitize: true,
  },
  reasonCodes: {
    required: true,
    type: 'array',
    minItems: 1,
    maxItems: 10,
    allowedValues: ['low_hrv', 'insufficient_sleep', ...],
  },
  priority: {
    required: true,
    enum: ['critical', 'important', 'optimization'],
  },
}
```

---

## COMPLETE FIELD MAPPING

| Field | Source | Layer | Required | Type |
|-------|--------|-------|----------|------|
| **Deterministic (Engine)** |
| `sourceEngine` | Engine | Analysis | Yes | SourceEngine |
| `sourceRecordId` | Engine | Analysis | No | string |
| `priority` | Engine | Analysis | Yes | Priority |
| `urgencyScore` | Engine | Analysis | No | number (0-100) |
| `category` | Engine | Analysis | Yes | Category |
| `actionType` | Engine | Analysis | No | ActionType |
| `actionTarget` | Engine | Analysis | No | string |
| `actionDetails` | Engine | Analysis | No | object |
| `confidenceLevel` | Engine | Analysis | Yes | ConfidenceLevel |
| `dataQualityScore` | Engine | Analysis | Yes | number (0-100) |
| **AI-Generated** |
| `title` | AI | Enrichment | Yes | string (max 100) |
| `description` | AI | Enrichment | Yes | string (max 500) |
| `rationale` | AI | Enrichment | No | string (max 1000) |
| `reasonCodes` | AI | Enrichment | Yes | string[] |
| `recommendationGroup` | AI | Enrichment | No | string |
| `supportingMetrics` | AI | Enrichment | No | Metric[] |
| `isInsightOnly` | AI | Enrichment | Yes | boolean |
| `requiresUserDecision` | AI | Enrichment | Yes | boolean |
| **Lifecycle (RecommendationEngine)** |
| `id` | System | Engine | Yes | UUID |
| `userId` | System | Engine | Yes | UUID |
| `state` | System | Engine | Yes | State |
| `generatedAt` | System | Engine | Yes | timestamp |
| `expiresAt` | Engine | Analysis | No | timestamp |
| `expirationReason` | Engine | Analysis | No | string |

---

## DATA FLOW EXAMPLE

### Step 1: Engine Calculates Intelligence

**Recovery Engine:**
```typescript
const record = await calculateRecovery(userId);
// {
//   recoveryScore: 35,
//   recoveryStatus: 'poor_recovery',
//   sourceInputs: { hrv: 30, sleep: 5, stress: 4, ... }
// }
```

### Step 2: DailyHealthSnapshot Aggregates

**Snapshot Service:**
```typescript
const snapshot = await generateDailyHealthSnapshot(userId);
// {
//   recovery: { score: 35, status: 'poor_recovery', ... },
//   stress: { score: 75, ... },
//   derivedIntelligence: { fatigueRisk: 'high', ... }
// }
```

### Step 3: Analysis Layer Interprets

**Recommendation Analysis:**
```typescript
const analysis = analyzeSnapshot(snapshot);
// {
//   recommendationType: 'workout_modification',
//   trigger: 'poor_recovery',
//   evidence: {
//     recoveryScore: 35,
//     contributingFactors: [
//       { metric: 'hrv', value: 30, threshold: 50, status: 'low' },
//       { metric: 'sleep', value: 5, threshold: 7, status: 'insufficient' },
//     ],
//   },
//   priority: 'important',
//   urgencyScore: 75,
//   confidenceLevel: 'high',
//   dataQualityScore: 85,
// }
```

### Step 4: AI Enriches

**Prompt Builder:**
```typescript
const prompt = buildPrompt(analysis, userContext);
// "Based on the following health data, generate a recommendation:
//  - Recovery score: 35/100 (poor)
//  - HRV: 30ms (40% below baseline)
//  - Sleep: 5 hours (insufficient)
//  - Stress: 4/5 (high)
//  User goal: Build strength
//  Recent activity: Heavy training week"
```

**AI Response:**
```typescript
const enriched = await enrichWithAI(prompt);
// {
//   title: 'Take a recovery day',
//   description: 'Your body is showing clear signs of fatigue...',
//   rationale: 'Your HRV is 40% below baseline...',
//   reasonCodes: ['low_hrv', 'insufficient_sleep', 'high_stress'],
//   supportingMetrics: [...],
//   isInsightOnly: false,
//   requiresUserDecision: true,
// }
```

### Step 5: Normalization Constrains

**Normalizer:**
```typescript
const normalized = normalizeRecommendation(enriched, analysis);
// Validates all fields
// Enforces max lengths
// Ensures required fields
// Applies business rules
```

### Step 6: RecommendationEngine Persists

**Final Recommendation:**
```typescript
const recommendation = await createRecommendation({
  userId,
  request: {
    // From Analysis (Deterministic)
    sourceEngine: 'recovery',
    sourceRecordId: record.id,
    priority: 'important',
    urgencyScore: 75,
    category: 'workout_modification',
    actionType: 'modify',
    actionTarget: 'Today\'s Workout',
    confidenceLevel: 'high',
    dataQualityScore: 85,
    
    // From AI (Enriched)
    title: 'Take a recovery day',
    description: 'Your body is showing clear signs of fatigue...',
    rationale: 'Your HRV is 40% below baseline...',
    
    // Additional metadata
    reasonCodes: ['low_hrv', 'insufficient_sleep', 'high_stress'],
    recommendationGroup: 'recovery_optimization',
    supportingMetrics: [...],
    isInsightOnly: false,
    requiresUserDecision: true,
  },
});
```

---

## MIGRATION STRATEGY

### Phase 1: Add New Fields to Schema

**Update `recommendationEngine.ts` types:**
```typescript
export interface RecommendationRequest {
  // Existing fields...
  
  // NEW: AI-enriched fields
  reasonCodes?: string[];
  recommendationGroup?: string;
  supportingMetrics?: SupportingMetric[];
  isInsightOnly?: boolean;
  requiresUserDecision?: boolean;
}

export interface SupportingMetric {
  name: string;
  value: string;
  status: 'low' | 'normal' | 'high' | 'optimal';
  change?: string;
  target?: string;
}
```

### Phase 2: Create Analysis Layer

**Create new services:**
1. `recommendationAnalysisService.ts` - Interprets snapshots
2. `recommendationPromptBuilder.ts` - Builds AI prompts
3. `recommendationNormalizer.ts` - Constrains outputs
4. `recommendationSchema.ts` - Defines schema

### Phase 3: Migrate Engines Incrementally

**Option A: Dual Mode (Recommended)**
```typescript
// Engine can emit both old and new style
if (USE_AI_ENRICHMENT) {
  // New: Emit evidence, let analysis layer handle it
  await emitRecommendationEvidence({
    userId,
    sourceEngine: 'recovery',
    evidence: { recoveryScore, contributingFactors },
  });
} else {
  // Old: Emit full recommendation request
  await emitRecommendation({
    userId,
    sourceEngine: 'recovery',
    title: 'Take a recovery day',
    description: '...',
  });
}
```

**Option B: Gradual Migration**
1. Week 1: Recovery Engine → AI-enriched
2. Week 2: Stress Engine → AI-enriched
3. Week 3: Remaining engines → AI-enriched
4. Week 4: Remove old code

### Phase 4: Update UI

**UI consumes enriched fields:**
```typescript
// Display supporting metrics
{recommendation.supportingMetrics?.map(metric => (
  <MetricCard
    name={metric.name}
    value={metric.value}
    status={metric.status}
    change={metric.change}
  />
))}

// Show reason codes
{recommendation.reasonCodes?.map(code => (
  <ReasonBadge code={code} />
))}

// Handle insight-only vs actionable
{recommendation.isInsightOnly ? (
  <InsightCard {...recommendation} />
) : (
  <ActionableRecommendation {...recommendation} />
)}
```

---

## BENEFITS

### 1. Separation of Concerns
- ✅ Engines focus on health calculations
- ✅ AI focuses on user-facing content
- ✅ Normalization ensures consistency

### 2. Flexibility
- ✅ Easy to improve AI prompts
- ✅ Easy to add new recommendation types
- ✅ Easy to A/B test different approaches

### 3. Maintainability
- ✅ No hard-coded recommendation text in engines
- ✅ Single source of truth for schema
- ✅ Clear layer boundaries

### 4. Quality
- ✅ AI generates contextual, personalized content
- ✅ Normalization prevents bad outputs
- ✅ Confidence/quality always tracked

### 5. Scalability
- ✅ Add new engines without changing recommendation logic
- ✅ Improve AI without touching engines
- ✅ Easy to add new fields

---

## SUMMARY

**Architecture:** 6-Layer Separation

1. **Engines** → Deterministic health intelligence
2. **Snapshot** → Aggregation
3. **Analysis** → Interpretation + evidence building
4. **AI** → Natural language enrichment
5. **Normalization** → Schema constraint
6. **RecommendationEngine** → Persistence + lifecycle

**Field Ownership:**
- **Engines:** priority, urgency, confidence, data quality, category, action
- **AI:** title, description, rationale, reason codes, supporting metrics
- **Normalization:** Validation, sanitization, business rules

**Migration:**
- Dual mode support (old + new)
- Incremental engine migration
- UI updates to consume enriched fields

**Next Steps:**
1. Create schema definitions
2. Create analysis service
3. Create prompt builder
4. Create normalizer
5. Update Recovery Engine to use new flow
6. Validate end-to-end
