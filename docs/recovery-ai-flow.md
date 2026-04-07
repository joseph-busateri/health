# Recovery AI Flow Documentation

## Overview

This document maps the complete Recovery Engine AI enrichment flow from entry point through persistence and retrieval.

## Architecture Flow

```
Recovery Engine Entry
  → AI Enrichment Layer
  → Normalizer
  → Validator
  → RecommendationEngine
  → Persistence
  → Retrieval
```

## Component Mapping

### 1. Recovery Engine Entry Point

**File**: `server/src/services/recoveryEngineService.ts`

**Entry Function**: `getRecoveryToday(userId, options)`

**Responsibilities**:
- Calculate recovery score from source inputs
- Evaluate recovery status (poor/moderate/fully_recovered)
- Generate deterministic recovery recommendation
- Trigger AI enrichment flow when recovery is poor or moderate

**Key Logic** (lines 176-336):
```typescript
export const getRecoveryToday = async (userId, options) => {
  // 1. Calculate recovery score
  const recoveryScore = calculateRecoveryScore(sourceInputs);
  
  // 2. Evaluate recovery status
  const { recoveryStatus, readinessClassification } = evaluateRecoveryStatus(recoveryScore);
  
  // 3. Generate deterministic recommendation
  const recommendation = generateRecoveryRecommendation(recoveryStatus, sourceInputs);
  
  // 4. Check feature flag and trigger AI enrichment
  if (recoveryStatus === 'poor_recovery' || recoveryStatus === 'moderate_recovery') {
    const useAIEnrichment = process.env.USE_AI_ENRICHMENT === 'true';
    if (useAIEnrichment) {
      // AI ENRICHMENT FLOW
    } else {
      // FALLBACK: Direct emission
    }
  }
}
```

### 2. Evidence Builder

**File**: `server/src/services/recommendationAnalysisService.ts`

**Function**: `analyzeRecoveryRecord(record, userId)`

**Responsibilities**:
- Convert recovery record to structured evidence
- Identify contributing factors (HRV, sleep, stress, workout load)
- Calculate deterministic fields (priority, urgency, confidence, data quality)
- Does NOT generate user-facing text

**Key Logic** (lines 58-166):
```typescript
export function analyzeRecoveryRecord(record, userId): RecommendationEvidence {
  // 1. Identify contributing factors
  const contributingFactors = [];
  if (sourceInputs.hrv < THRESHOLDS.hrv.low) {
    contributingFactors.push({ metric: 'hrv', value, threshold, status: 'low', importance: 'primary' });
  }
  
  // 2. Calculate deterministic fields
  const priority = recoveryScore < THRESHOLDS.recovery.poor ? 'important' : 'optimization';
  const urgencyScore = Math.round(100 - recoveryScore);
  const confidenceLevel = dataAvailability >= 0.8 ? 'high' : 'medium';
  
  // 3. Build evidence structure
  return {
    sourceEngine: 'recovery',
    sourceRecordId: record.id,
    userId,
    trigger: recoveryStatus,
    primaryMetric: { name: 'recovery_score', value: recoveryScore, status: recoveryStatus },
    contributingFactors,
    priority,
    urgencyScore,
    category: 'workout_modification',
    confidenceLevel,
    dataQualityScore
  };
}
```

### 3. AI Enrichment Service

**File**: `server/src/services/recommendationPromptBuilder.ts`

**Function**: `enrichRecommendationWithAI(evidence)`

**Responsibilities**:
- Call OpenAI service with structured evidence
- Fallback to mock if OpenAI fails
- Return AI-enriched fields (title, description, rationale, reasonCodes, etc.)

**Key Logic** (lines 257-269):
```typescript
export async function enrichRecommendationWithAI(evidence): Promise<AIEnrichedFields> {
  try {
    const { enrichRecommendationWithOpenAI } = await import('./openAIService');
    return await enrichRecommendationWithOpenAI(evidence);
  } catch (error) {
    console.warn('OpenAI enrichment failed, using mock fallback:', error.message);
    return enrichRecommendationWithAIMock(evidence);
  }
}
```

**OpenAI Integration File**: `server/src/services/openAIService.ts`

**Function**: `enrichRecommendationWithOpenAI(evidence)`

**Responsibilities**:
- Build prompt from evidence
- Call OpenAI API with timeout protection
- Parse JSON response
- Track metrics (success, failure, timeout, latency)

**Key Logic**:
```typescript
export async function enrichRecommendationWithOpenAI(evidence): Promise<AIEnrichedFields> {
  // 1. Build prompt
  const prompt = buildRecommendationPrompt(evidence);
  
  // 2. Call OpenAI with timeout
  const response = await Promise.race([
    openai.chat.completions.create({ messages: [...] }),
    timeoutPromise
  ]);
  
  // 3. Parse JSON response
  const aiFields = JSON.parse(response.choices[0].message.content);
  
  // 4. Track metrics
  trackAIEnrichmentSucceeded(latencyMs);
  
  return aiFields;
}
```

### 4. Normalizer

**File**: `server/src/services/recommendationNormalizer.ts`

**Function**: `normalizeRecommendation(aiResponse, evidence, userId)`

**Responsibilities**:
- Merge deterministic fields from evidence with AI-enriched fields
- Sanitize and constrain AI output to schema
- Enforce max/min lengths
- Normalize reason codes and supporting metrics
- Does NOT generate new content

**Key Logic** (lines 33-71):
```typescript
export function normalizeRecommendation(aiResponse, evidence, userId): EnrichedRecommendationRequest {
  return {
    // Deterministic fields (from evidence)
    userId,
    sourceEngine: evidence.sourceEngine,
    sourceRecordId: evidence.sourceRecordId,
    priority: evidence.priority,
    urgencyScore: evidence.urgencyScore,
    category: evidence.category,
    confidenceLevel: evidence.confidenceLevel,
    dataQualityScore: evidence.dataQualityScore,
    
    // AI-enriched fields (normalized)
    title: normalizeTitle(aiResponse.title),
    description: normalizeDescription(aiResponse.description),
    rationale: normalizeRationale(aiResponse.rationale),
    reasonCodes: normalizeReasonCodes(aiResponse.reasonCodes),
    recommendationGroup: aiResponse.recommendationGroup,
    supportingMetrics: normalizeSupportingMetrics(aiResponse.supportingMetrics),
    isInsightOnly: aiResponse.isInsightOnly,
    requiresUserDecision: aiResponse.requiresUserDecision
  };
}
```

### 5. Validator

**File**: `server/src/services/recommendationNormalizer.ts`

**Function**: `validateRecommendation(recommendation)`

**Responsibilities**:
- Validate required fields
- Enforce field types and constraints
- Apply business rules
- Return validation result with errors and warnings

**Key Logic** (lines 236-388):
```typescript
export function validateRecommendation(recommendation): ValidationResult {
  const errors = [];
  const warnings = [];
  
  // 1. Validate against schema
  Object.entries(RECOMMENDATION_SCHEMA).forEach(([field, rule]) => {
    // Check required, type, min/max length, enum values
  });
  
  // 2. Business rule validations
  if (recommendation.priority === 'critical' && recommendation.urgencyScore < 70) {
    warnings.push({ field: 'urgencyScore', message: '...' });
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
```

### 6. RecommendationEngine

**File**: `server/src/services/recommendationEngineService.ts`

**Function**: `createRecommendation({ userId, request })`

**Responsibilities**:
- Receive normalized and validated recommendation request
- Detect conflicts with existing recommendations
- Persist to database
- Return created recommendation with conflict information

**Key Logic**:
```typescript
export async function createRecommendation({ userId, request }): Promise<CreateRecommendationResult> {
  // 1. Create recommendation object
  const recommendation: Recommendation = {
    id: uuidv4(),
    userId,
    state: 'pending',
    createdAt: new Date(),
    ...request
  };
  
  // 2. Detect conflicts
  const conflicts = await detectAllConflicts(recommendation, userId);
  
  // 3. Persist to database
  await persistRecommendation(recommendation);
  
  return { recommendation, conflicts };
}
```

### 7. Persistence Layer

**File**: `server/src/services/recommendationEngineService.ts`

**Function**: `mapRecommendationToDatabase(recommendation)` (lines 718-761)

**Responsibilities**:
- Map TypeScript recommendation object to database schema
- Convert camelCase to snake_case
- Serialize JSON fields (reasonCodes, supportingMetrics, actionDetails)
- Insert into `recommendations` table

**Database Table**: `recommendations`

**Key Columns**:
- `id`, `user_id`, `state`, `created_at`, `updated_at`
- `source_engine`, `source_record_id`
- `title`, `description`, `rationale`
- `priority`, `urgency_score`, `category`
- `action_type`, `action_target`, `action_details`
- `confidence_level`, `data_quality_score`
- `expires_at`, `expiration_reason`
- **AI-enriched fields**:
  - `reason_codes` (JSONB)
  - `recommendation_group` (TEXT)
  - `supporting_metrics` (JSONB)
  - `is_insight_only` (BOOLEAN)
  - `requires_user_decision` (BOOLEAN)

### 8. Retrieval Layer

**File**: `server/src/services/recommendationEngineService.ts`

**Function**: `mapDatabaseToRecommendation(dbRecord)` (lines 763-808)

**Responsibilities**:
- Map database record to TypeScript recommendation object
- Convert snake_case to camelCase
- Parse JSON fields
- Return recommendation for API responses

**Retrieval Functions**:
- `getActiveRecommendations(userId)` - Get all active recommendations
- `getRecommendationById(id)` - Get specific recommendation
- `getRecommendationHistory(userId)` - Get recommendation history

## Flow Execution Sequence

### AI Success Path

1. **Recovery Engine** calculates score → status = 'poor_recovery'
2. **Evidence Builder** analyzes record → structured evidence
3. **AI Enrichment** calls OpenAI → AI-enriched fields
4. **Normalizer** merges evidence + AI fields → normalized request
5. **Validator** validates request → validation passes
6. **RecommendationEngine** creates recommendation → persists to DB
7. **Retrieval** reads from DB → returns to API

### Fallback Path

1. **Recovery Engine** calculates score → status = 'poor_recovery'
2. **Evidence Builder** analyzes record → structured evidence
3. **AI Enrichment** calls OpenAI → **timeout/error**
4. **Fallback** → direct emission via `emitDirectRecommendation()`
5. **Direct Emission** → bypasses RecommendationEngine, uses old flow

## Metrics Tracking

**File**: `server/src/services/recommendationMetricsService.ts`

**Tracked Metrics**:
- `aiEnrichment.attempted` - AI enrichment attempts
- `aiEnrichment.succeeded` - AI enrichment successes
- `aiEnrichment.failed` - AI enrichment failures
- `aiEnrichment.timeouts` - AI timeout count
- `aiEnrichment.parseErrors` - JSON parse errors
- `aiEnrichment.latencyMs` - AI latency tracking
- `fallback.used` - Fallback usage count
- `validation.attempted` - Validation attempts
- `validation.passed` - Validation passes
- `validation.failed` - Validation failures
- `normalization.attempted` - Normalization attempts
- `normalization.succeeded` - Normalization successes

## Feature Flags

**Environment Variables**:
- `USE_AI_ENRICHMENT` - Global AI enrichment flag
- `USE_AI_ENRICHMENT_RECOVERY` - Recovery-specific flag (not currently used)
- `USE_AI_ENRICHMENT_STRESS` - Stress-specific flag (not currently used)

**Current Behavior**:
- Recovery Engine checks `USE_AI_ENRICHMENT === 'true'`
- If true → AI enrichment flow
- If false → direct emission flow (backward compatible)

## Validation Points

1. **Recovery Scoring Complete** - Recovery score calculated
2. **AI Enrichment Attempt** - AI enrichment started
3. **AI Enrichment Result** - AI enrichment completed (success/fallback/timeout/error)
4. **Normalization Applied** - AI output normalized
5. **Validation Result** - Recommendation validated (pass/fail)
6. **Recommendation Persisted** - Saved to database via RecommendationEngine

## Critical Invariants

1. Recovery Engine **MUST NOT** bypass RecommendationEngine when AI enrichment is enabled
2. All AI-enriched recommendations **MUST** go through Normalizer → Validator → RecommendationEngine
3. Fallback **MUST** work correctly when AI fails
4. Retrieval **MUST** return persisted recommendations with all AI-enriched fields
5. AI output **MUST** differ from deterministic fallback (validation requirement)
