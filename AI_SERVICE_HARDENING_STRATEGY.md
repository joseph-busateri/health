# AI SERVICE HARDENING STRATEGY

**Comprehensive Production Hardening for 30+ AI Services**  
**Date**: April 16, 2026  
**Status**: Strategic Plan - Ready for Implementation

---

## Executive Summary

**Problem**: 30 AI services with inconsistent production hardening, critical safety gaps, and potential cost explosion ($81K-$810K/year).

**Solution**: Phased, risk-based hardening approach prioritizing safety, reliability, and cost optimization.

**Timeline**: 6 weeks for critical items, 12 weeks for complete hardening

**Cost Impact**: Potential savings of $300K-$500K/year at 10K users through optimization

---

## Table of Contents

1. [Critical Risk Assessment](#1-critical-risk-assessment)
2. [Phased Implementation Strategy](#2-phased-implementation-strategy)
3. [Production Hardening Framework](#3-production-hardening-framework)
4. [Service-by-Service Migration Plan](#4-service-by-service-migration-plan)
5. [Medical Safety Validation](#5-medical-safety-validation)
6. [Cost Monitoring & Optimization](#6-cost-monitoring--optimization)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. CRITICAL RISK ASSESSMENT

### 1A. Production Blockers (Must Fix Before Scale)

| Risk | Severity | Services Affected | Impact | Timeline |
|------|----------|-------------------|--------|----------|
| **No Medical Safety Validation** | 🔴 CRITICAL | 5 recommendation services | Unsafe medical advice, liability | Week 1 |
| **No Conversation Guardrails** | 🔴 CRITICAL | 3 interview services | Inappropriate responses, medical advice | Week 1 |
| **No PII Protection** | 🔴 CRITICAL | 3 interview services | Privacy violations, HIPAA risk | Week 1 |
| **No Fallback Patterns** | 🔴 CRITICAL | 29 of 30 services | Feature failures when AI fails | Week 2-3 |
| **No Output Validation** | 🔴 CRITICAL | 25 of 30 services | Invalid/malformed outputs | Week 2-3 |

**Estimated Risk Reduction**: 95% of critical production risks eliminated in 3 weeks

### 1B. High-Priority Improvements (Should Fix Soon)

| Issue | Severity | Impact | Timeline |
|-------|----------|--------|----------|
| No cost monitoring | 🟡 HIGH | Uncontrolled spend | Week 4 |
| No rate limiting | 🟡 HIGH | API abuse, cost spikes | Week 4 |
| No error tracking | 🟡 HIGH | Failures not monitored | Week 4 |
| No retry logic | 🟡 HIGH | Transient failures | Week 5 |
| No circuit breaker | 🟡 HIGH | Cascading failures | Week 5 |

### 1C. Optimization Opportunities (Nice to Have)

| Opportunity | Potential Savings | Complexity | Timeline |
|-------------|-------------------|------------|----------|
| Response caching | 30-50% cost reduction | Medium | Week 6-8 |
| Model downgrade (GPT-3.5) | 70% cost reduction | Low | Week 6-8 |
| A/B testing & elimination | 20-40% cost reduction | High | Week 9-12 |
| Effectiveness tracking | Data-driven optimization | Medium | Week 9-12 |

---

## 2. PHASED IMPLEMENTATION STRATEGY

### Phase 1: Critical Safety (Week 1) 🔴 MUST DO

**Objective**: Eliminate critical safety risks

**Deliverables**:
1. Medical Safety Validation Framework
2. Conversation Guardrails System
3. PII Protection & Redaction
4. Emergency kill switch for AI services

**Services**:
- 5 recommendation services (medical safety)
- 3 interview services (guardrails + PII)

**Success Criteria**:
- ✅ No unsafe medical recommendations generated
- ✅ No medical advice given in conversations
- ✅ No PII leaked to OpenAI
- ✅ All services can be disabled instantly

**Estimated Effort**: 40 hours (1 week, 1 developer)

---

### Phase 2: Reliability Foundation (Week 2-3) 🔴 MUST DO

**Objective**: Implement fallback patterns and output validation

**Deliverables**:
1. Migrate all 30 services to `aiServiceWrapper.ts`
2. Implement output validation for each service
3. Add confidence scoring for parsers
4. Implement human-in-the-loop for low confidence

**Services**: All 30 services

**Success Criteria**:
- ✅ 100% of services have fallback patterns
- ✅ 100% of services validate outputs
- ✅ Parser services have confidence scores
- ✅ Low confidence triggers manual review

**Estimated Effort**: 80 hours (2 weeks, 1 developer)

---

### Phase 3: Observability & Control (Week 4) 🟡 SHOULD DO

**Objective**: Monitor costs, errors, and performance

**Deliverables**:
1. Cost monitoring dashboard
2. Error tracking and alerting
3. Rate limiting per service
4. Performance metrics dashboard

**Services**: All 30 services

**Success Criteria**:
- ✅ Real-time cost visibility per service
- ✅ Error alerts for failures
- ✅ Rate limits prevent abuse
- ✅ Performance baselines established

**Estimated Effort**: 40 hours (1 week, 1 developer)

---

### Phase 4: Advanced Reliability (Week 5) 🟡 SHOULD DO

**Objective**: Handle transient failures and cascading issues

**Deliverables**:
1. Retry logic with exponential backoff (already in wrapper)
2. Circuit breaker pattern
3. Graceful degradation strategies
4. Service health monitoring

**Services**: All 30 services

**Success Criteria**:
- ✅ Transient failures auto-retry
- ✅ Failing services auto-disable
- ✅ Graceful degradation documented
- ✅ Health dashboard shows service status

**Estimated Effort**: 40 hours (1 week, 1 developer)

---

### Phase 5: Cost Optimization (Week 6-8) 🟢 NICE TO HAVE

**Objective**: Reduce AI costs by 50-70%

**Deliverables**:
1. Response caching system
2. Model downgrade for simple tasks
3. Prompt optimization
4. Batch processing where applicable

**Services**: High-volume services first

**Success Criteria**:
- ✅ 30-50% cost reduction from caching
- ✅ 70% cost reduction on downgraded services
- ✅ Prompt token usage reduced 20%
- ✅ Monthly cost < $3,000 at 1K users

**Estimated Effort**: 60 hours (1.5 weeks, 1 developer)

---

### Phase 6: Value Validation (Week 9-12) 🟢 NICE TO HAVE

**Objective**: Measure and optimize AI service value

**Deliverables**:
1. A/B testing framework
2. Effectiveness tracking per service
3. User satisfaction metrics
4. ROI analysis per service

**Services**: All 30 services

**Success Criteria**:
- ✅ A/B tests running for all enrichment services
- ✅ Effectiveness data collected
- ✅ Low-value services identified
- ✅ ROI-based prioritization

**Estimated Effort**: 80 hours (2 weeks, 1 developer)

---

## 3. PRODUCTION HARDENING FRAMEWORK

### 3A. Medical Safety Validation Framework

**File**: `server/src/services/medicalSafetyValidator.ts`

**Purpose**: Prevent unsafe medical recommendations

**Features**:
- Contraindication checking
- Medication interaction detection
- Red flag symptom detection
- Medical advice prevention
- Clinical guideline validation

**Pattern**:
```typescript
import { validateMedicalSafety } from './medicalSafetyValidator';

export async function generateRecommendation(data: Data): Promise<Rec> {
  const aiRecommendation = await callAI(data);
  
  // CRITICAL: Validate medical safety
  const safetyCheck = await validateMedicalSafety(aiRecommendation, {
    userMedications: data.medications,
    userConditions: data.conditions,
    userAllergies: data.allergies,
  });
  
  if (!safetyCheck.safe) {
    logger.error('UNSAFE RECOMMENDATION BLOCKED', {
      reasons: safetyCheck.reasons,
      recommendation: aiRecommendation,
    });
    
    // Return safe fallback
    return {
      ...deterministicRecommendation,
      flagged: true,
      requiresClinicalReview: true,
      safetyIssues: safetyCheck.reasons,
    };
  }
  
  return aiRecommendation;
}
```

**Safety Rules**:
1. ❌ NEVER recommend medication changes
2. ❌ NEVER diagnose medical conditions
3. ❌ NEVER contradict physician orders
4. ❌ NEVER recommend stopping medications
5. ✅ ALWAYS flag for clinical review if uncertain
6. ✅ ALWAYS defer to medical professionals
7. ✅ ALWAYS include disclaimers

**Implementation**: Week 1, Priority 1

---

### 3B. Conversation Guardrails System

**File**: `server/src/services/conversationGuardrails.ts`

**Purpose**: Prevent inappropriate AI responses in interviews

**Features**:
- Medical advice detection and blocking
- Inappropriate content filtering
- Scope enforcement (health data only)
- Response safety validation
- Conversation quality scoring

**Pattern**:
```typescript
import { validateConversationResponse } from './conversationGuardrails';

export async function generateAIResponse(
  userMessage: string,
  context: Context
): Promise<Response> {
  const aiResponse = await callAI(userMessage, context);
  
  // CRITICAL: Validate response safety
  const guardrailCheck = await validateConversationResponse(aiResponse, {
    userMessage,
    conversationHistory: context.history,
  });
  
  if (!guardrailCheck.safe) {
    logger.warn('UNSAFE RESPONSE BLOCKED', {
      reasons: guardrailCheck.reasons,
      userMessage: userMessage.substring(0, 100),
    });
    
    // Return safe fallback
    return {
      message: "I'm here to help you track your health data. For medical advice, please consult with your healthcare provider.",
      flagged: true,
      requiresHumanReview: true,
    };
  }
  
  return aiResponse;
}
```

**Guardrail Rules**:
1. ❌ NEVER provide medical diagnoses
2. ❌ NEVER provide medical advice
3. ❌ NEVER discuss medications
4. ❌ NEVER interpret symptoms
5. ✅ ONLY collect health data
6. ✅ ONLY provide general health information
7. ✅ ALWAYS defer medical questions to professionals

**Implementation**: Week 1, Priority 1

---

### 3C. PII Protection & Redaction

**File**: `server/src/services/piiProtection.ts`

**Purpose**: Prevent PII from being sent to OpenAI

**Features**:
- PII detection (names, SSN, addresses, etc.)
- Automatic redaction before AI calls
- De-identification for AI processing
- Re-identification after AI response
- Audit logging of PII handling

**Pattern**:
```typescript
import { redactPII, restorePII } from './piiProtection';

export async function processWithAI(text: string): Promise<Result> {
  // CRITICAL: Redact PII before sending to OpenAI
  const { redactedText, piiMap } = await redactPII(text);
  
  logger.info('PII redacted before AI call', {
    originalLength: text.length,
    redactedLength: redactedText.length,
    piiCount: Object.keys(piiMap).length,
  });
  
  // Send redacted text to AI
  const aiResult = await callAI(redactedText);
  
  // Restore PII in response if needed
  const restoredResult = await restorePII(aiResult, piiMap);
  
  return restoredResult;
}
```

**PII Categories**:
- Names (full names, first/last)
- Social Security Numbers
- Addresses (street, city, state, zip)
- Phone numbers
- Email addresses
- Medical record numbers
- Insurance IDs
- Dates of birth
- Account numbers

**Implementation**: Week 1, Priority 1

---

### 3D. Output Validation Framework

**File**: `server/src/services/aiOutputValidator.ts`

**Purpose**: Validate AI outputs match expected schema

**Features**:
- JSON schema validation
- Type checking
- Range validation
- Required field validation
- Confidence scoring
- Malformed output detection

**Pattern**:
```typescript
import { validateAIOutput } from './aiOutputValidator';

export async function parseWithAI(text: string): Promise<ParseResult> {
  const aiOutput = await callAI(text);
  
  // CRITICAL: Validate output structure
  const validation = validateAIOutput(aiOutput, {
    schema: ParseResultSchema,
    required: ['markers', 'confidence'],
    ranges: {
      confidence: { min: 0, max: 1 },
    },
  });
  
  if (!validation.valid) {
    logger.error('INVALID AI OUTPUT', {
      errors: validation.errors,
      output: aiOutput,
    });
    
    // Return fallback with manual review flag
    return {
      rawText: text,
      markers: [],
      confidence: 0,
      requiresManualReview: true,
      validationErrors: validation.errors,
    };
  }
  
  return aiOutput;
}
```

**Validation Rules**:
1. ✅ All required fields present
2. ✅ All fields have correct types
3. ✅ All values within valid ranges
4. ✅ No unexpected fields (strict mode)
5. ✅ Confidence score included
6. ✅ Source attribution included

**Implementation**: Week 2, Priority 2

---

### 3E. Cost Monitoring System

**File**: `server/src/services/aiCostMonitor.ts`

**Purpose**: Track and alert on AI costs

**Features**:
- Real-time cost tracking per service
- Daily/weekly/monthly cost reports
- Cost alerts and budgets
- Token usage analytics
- Cost per user metrics
- Cost optimization recommendations

**Pattern**:
```typescript
import { trackAICost } from './aiCostMonitor';

export async function callAIWithCostTracking(
  serviceName: string,
  prompt: string
): Promise<Result> {
  const startTime = Date.now();
  
  const result = await callAI(prompt);
  
  // Track cost
  await trackAICost({
    serviceName,
    model: 'gpt-4-turbo-preview',
    inputTokens: result.usage.prompt_tokens,
    outputTokens: result.usage.completion_tokens,
    latencyMs: Date.now() - startTime,
    timestamp: new Date(),
  });
  
  return result;
}
```

**Cost Metrics**:
- Cost per service per day
- Cost per user per day
- Token usage per service
- Average cost per call
- Cost trends over time
- Budget vs actual

**Alerts**:
- Daily cost > $100
- Service cost spike (2x normal)
- Monthly budget exceeded
- Unusual token usage patterns

**Implementation**: Week 4, Priority 3

---

## 4. SERVICE-BY-SERVICE MIGRATION PLAN

### 4A. Category 1: Parsing & Extraction AI (Week 2)

**Priority**: 🔴 CRITICAL (user-facing data entry)

| Service | File | Migration Complexity | Estimated Time |
|---------|------|---------------------|----------------|
| Bloodwork Parser | `bloodworkAIParser.ts` | Medium | 4 hours |
| Body Comp Parser | `bodyCompositionAIParser.ts` | Medium | 4 hours |
| Nutrition Extraction | `nutritionExtractionService.ts` | Low | 2 hours |
| Interview Parser | `interviewAnswerParserService.ts` | Medium | 4 hours |

**Total**: 14 hours

**Migration Pattern**:
```typescript
// Before
export async function parseBloodwork(text: string): Promise<Result> {
  const aiResult = await callOpenAI(text);
  return aiResult; // FAILS if AI fails
}

// After
import { withAIFallback } from './aiServiceWrapper';
import { validateAIOutput } from './aiOutputValidator';
import { redactPII } from './piiProtection';

export async function parseBloodwork(text: string): Promise<Result> {
  // Step 1: Redact PII
  const { redactedText, piiMap } = await redactPII(text);
  
  // Step 2: Call AI with fallback
  const result = await withAIFallback(
    async () => {
      const aiOutput = await callOpenAI(redactedText);
      
      // Step 3: Validate output
      const validation = validateAIOutput(aiOutput, BloodworkSchema);
      if (!validation.valid) {
        throw new Error('Invalid AI output');
      }
      
      return {
        markers: aiOutput.markers,
        confidence: aiOutput.confidence,
        requiresManualReview: aiOutput.confidence < 0.8,
        source: 'ai',
      };
    },
    // Fallback: Return raw text for manual entry
    {
      rawText: text,
      markers: [],
      confidence: 0,
      requiresManualReview: true,
      source: 'fallback',
    },
    { serviceName: 'bloodwork-parser', maxRetries: 3 }
  );
  
  // Step 4: Restore PII if needed
  return await restorePII(result, piiMap);
}
```

**Success Criteria**:
- ✅ Fallback to manual entry if AI fails
- ✅ Confidence score included
- ✅ Low confidence triggers manual review
- ✅ PII redacted before AI call
- ✅ Output validated

---

### 4B. Category 2: Health Engine Enrichment AI (Week 3)

**Priority**: 🟡 HIGH (background enhancement)

**Approach**: Use actuarial pattern (deterministic first, AI enhancement optional)

**Services**: 15 enrichment services

**Estimated Time**: 30 hours (2 hours per service)

**Migration Pattern**:
```typescript
// Before
export async function enrichRecommendation(data: Data): Promise<Rec> {
  const aiEnrichment = await callOpenAI(data);
  return aiEnrichment; // FAILS if AI fails
}

// After
import { withAIFallback } from './aiServiceWrapper';

export async function enrichRecommendation(data: Data): Promise<Rec> {
  // Step 1: ALWAYS compute deterministic recommendation
  const deterministicRec = computeDeterministicRecommendation(data);
  
  // Step 2: Try AI enrichment (optional)
  return await withAIFallback(
    async () => {
      const aiEnrichment = await callOpenAI(deterministicRec);
      
      // Step 3: Validate medical safety
      const safetyCheck = await validateMedicalSafety(aiEnrichment);
      if (!safetyCheck.safe) {
        throw new Error('Unsafe recommendation');
      }
      
      return {
        ...deterministicRec,
        aiInsights: aiEnrichment.insights,
        aiRecommendations: aiEnrichment.recommendations,
        source: 'ai_enriched',
      };
    },
    // Fallback: Return deterministic recommendation
    { ...deterministicRec, source: 'deterministic' },
    { serviceName: 'cardiovascular-enrichment', maxRetries: 2 }
  );
}
```

**Success Criteria**:
- ✅ Deterministic result ALWAYS computed
- ✅ AI enhancement optional
- ✅ Medical safety validated
- ✅ Fallback to deterministic if AI fails

---

### 4C. Category 3: Recommendation & Prioritization AI (Week 1)

**Priority**: 🔴 CRITICAL (medical safety)

**Services**: 5 recommendation services

**Estimated Time**: 20 hours (4 hours per service)

**Migration Pattern**:
```typescript
import { withAIFallback } from './aiServiceWrapper';
import { validateMedicalSafety } from './medicalSafetyValidator';

export async function generateRecommendations(data: Data): Promise<Recs> {
  // Step 1: Compute deterministic recommendations
  const deterministicRecs = computeDeterministicRecommendations(data);
  
  // Step 2: Try AI enhancement
  return await withAIFallback(
    async () => {
      const aiRecs = await callOpenAI(deterministicRecs);
      
      // Step 3: CRITICAL - Validate medical safety
      const safetyCheck = await validateMedicalSafety(aiRecs, {
        userMedications: data.medications,
        userConditions: data.conditions,
        userAllergies: data.allergies,
      });
      
      if (!safetyCheck.safe) {
        logger.error('UNSAFE RECOMMENDATIONS BLOCKED', {
          reasons: safetyCheck.reasons,
        });
        throw new Error('Unsafe recommendations');
      }
      
      return {
        ...aiRecs,
        source: 'ai_enriched',
        safetyValidated: true,
      };
    },
    // Fallback: Return safe deterministic recommendations
    {
      ...deterministicRecs,
      source: 'deterministic',
      safetyValidated: true,
    },
    { serviceName: 'bloodwork-recommendations', maxRetries: 2 }
  );
}
```

**Success Criteria**:
- ✅ Medical safety validation ALWAYS runs
- ✅ Unsafe recommendations NEVER returned
- ✅ Fallback to safe deterministic recommendations
- ✅ All recommendations flagged for clinical review if uncertain

---

### 4D. Category 4: Interview & Interaction AI (Week 1)

**Priority**: 🔴 CRITICAL (conversation safety)

**Services**: 3 interview services

**Estimated Time**: 15 hours (5 hours per service)

**Migration Pattern**:
```typescript
import { withAIFallback } from './aiServiceWrapper';
import { validateConversationResponse } from './conversationGuardrails';
import { redactPII } from './piiProtection';

export async function generateAIResponse(
  userMessage: string,
  context: Context
): Promise<Response> {
  // Step 1: Redact PII from user message
  const { redactedMessage, piiMap } = await redactPII(userMessage);
  
  // Step 2: Generate AI response with guardrails
  return await withAIFallback(
    async () => {
      const aiResponse = await callOpenAI(redactedMessage, context);
      
      // Step 3: CRITICAL - Validate conversation safety
      const guardrailCheck = await validateConversationResponse(aiResponse, {
        userMessage: redactedMessage,
        conversationHistory: context.history,
      });
      
      if (!guardrailCheck.safe) {
        logger.warn('UNSAFE RESPONSE BLOCKED', {
          reasons: guardrailCheck.reasons,
        });
        throw new Error('Unsafe response');
      }
      
      return aiResponse;
    },
    // Fallback: Safe scripted response
    {
      message: "I'm here to help you track your health data. For medical questions, please consult your healthcare provider.",
      flagged: true,
      requiresHumanReview: true,
    },
    { serviceName: 'ai-agent-conversation', maxRetries: 2 }
  );
}
```

**Success Criteria**:
- ✅ Conversation guardrails ALWAYS enforced
- ✅ No medical advice given
- ✅ PII redacted before AI call
- ✅ Unsafe responses blocked
- ✅ Fallback to safe scripted responses

---

### 4E. Category 5: Supporting AI Services (Week 2)

**Priority**: 🟡 HIGH (infrastructure)

**Services**: 3 supporting services

**Estimated Time**: 10 hours

**Focus**:
- `openAIService.ts`: Add retry logic, rate limiting, cost tracking
- `dailyLogVectorService.ts`: Add fallback, validation
- `overloadPlannerService.ts`: Add fallback to deterministic planning

---

## 5. MEDICAL SAFETY VALIDATION

### 5A. Safety Validation Rules

**File**: `server/src/services/medicalSafetyValidator.ts`

**Core Rules**:

```typescript
export interface MedicalSafetyCheck {
  safe: boolean;
  reasons: string[];
  requiresClinicalReview: boolean;
  blockedContent?: string[];
}

export async function validateMedicalSafety(
  recommendation: Recommendation,
  userContext: UserMedicalContext
): Promise<MedicalSafetyCheck> {
  const issues: string[] = [];
  
  // Rule 1: No medication recommendations
  if (containsMedicationRecommendation(recommendation)) {
    issues.push('Contains medication recommendation');
  }
  
  // Rule 2: No diagnosis language
  if (containsDiagnosisLanguage(recommendation)) {
    issues.push('Contains diagnosis language');
  }
  
  // Rule 3: No contraindications
  const contraindications = checkContraindications(
    recommendation,
    userContext.medications,
    userContext.conditions
  );
  if (contraindications.length > 0) {
    issues.push(...contraindications);
  }
  
  // Rule 4: No red flag symptoms ignored
  if (containsRedFlagSymptoms(recommendation)) {
    issues.push('Contains red flag symptoms without medical referral');
  }
  
  // Rule 5: No contradicting physician orders
  if (contradictsPhysicianOrders(recommendation, userContext)) {
    issues.push('Contradicts physician orders');
  }
  
  return {
    safe: issues.length === 0,
    reasons: issues,
    requiresClinicalReview: issues.length > 0 || recommendation.priority === 'critical',
  };
}
```

**Red Flag Symptoms** (Always require medical referral):
- Chest pain
- Severe headache
- Sudden vision changes
- Difficulty breathing
- Severe abdominal pain
- Unexplained bleeding
- Loss of consciousness
- Severe allergic reactions

**Contraindication Checking**:
- Medication interactions
- Condition-specific restrictions
- Allergy conflicts
- Age/gender restrictions

---

### 5B. Conversation Guardrails

**File**: `server/src/services/conversationGuardrails.ts`

**Core Rules**:

```typescript
export interface GuardrailCheck {
  safe: boolean;
  reasons: string[];
  suggestedResponse?: string;
}

export async function validateConversationResponse(
  response: string,
  context: ConversationContext
): Promise<GuardrailCheck> {
  const issues: string[] = [];
  
  // Rule 1: No medical advice
  if (containsMedicalAdvice(response)) {
    issues.push('Contains medical advice');
  }
  
  // Rule 2: No diagnoses
  if (containsDiagnosis(response)) {
    issues.push('Contains diagnosis');
  }
  
  // Rule 3: No medication discussion
  if (discussesMedications(response)) {
    issues.push('Discusses medications');
  }
  
  // Rule 4: No symptom interpretation
  if (interpretsSymptoms(response)) {
    issues.push('Interprets symptoms');
  }
  
  // Rule 5: Stays in scope (health data collection)
  if (!isInScope(response)) {
    issues.push('Out of scope');
  }
  
  return {
    safe: issues.length === 0,
    reasons: issues,
    suggestedResponse: issues.length > 0
      ? "I'm here to help you track your health data. For medical questions, please consult your healthcare provider."
      : undefined,
  };
}
```

**Blocked Phrases**:
- "You should take..."
- "This means you have..."
- "You are diagnosed with..."
- "Stop taking..."
- "Increase/decrease your medication..."
- "This is a sign of..."

**Allowed Scope**:
- Health data collection
- General health information
- Data tracking assistance
- Clarification questions
- Encouragement and motivation

---

## 6. COST MONITORING & OPTIMIZATION

### 6A. Cost Tracking Implementation

**File**: `server/src/services/aiCostMonitor.ts`

```typescript
export interface AICostMetrics {
  serviceName: string;
  date: Date;
  callCount: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  avgLatencyMs: number;
}

const costStore = new Map<string, AICostMetrics[]>();

export async function trackAICost(params: {
  serviceName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  timestamp: Date;
}): Promise<void> {
  // Calculate cost based on model
  const inputCost = calculateInputCost(params.model, params.inputTokens);
  const outputCost = calculateOutputCost(params.model, params.outputTokens);
  const totalCost = inputCost + outputCost;
  
  // Store metrics
  const key = `${params.serviceName}:${params.timestamp.toISOString().split('T')[0]}`;
  const existing = costStore.get(key) || [];
  
  existing.push({
    serviceName: params.serviceName,
    date: params.timestamp,
    callCount: 1,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    totalCost,
    avgLatencyMs: params.latencyMs,
  });
  
  costStore.set(key, existing);
  
  // Check alerts
  await checkCostAlerts(params.serviceName, totalCost);
}

export function getDailyCostReport(): CostReport {
  const today = new Date().toISOString().split('T')[0];
  const todayMetrics = Array.from(costStore.entries())
    .filter(([key]) => key.endsWith(today))
    .flatMap(([_, metrics]) => metrics);
  
  return {
    date: today,
    totalCost: todayMetrics.reduce((sum, m) => sum + m.totalCost, 0),
    totalCalls: todayMetrics.reduce((sum, m) => sum + m.callCount, 0),
    totalTokens: todayMetrics.reduce((sum, m) => sum + m.inputTokens + m.outputTokens, 0),
    byService: groupByService(todayMetrics),
  };
}
```

**Cost Alerts**:
- Daily cost > $100
- Service cost spike (2x normal)
- Monthly budget exceeded
- Unusual token usage

---

### 6B. Cost Optimization Strategies

**Strategy 1: Response Caching** (30-50% savings)

```typescript
// Cache AI responses for identical inputs
const responseCache = new Map<string, CachedResponse>();

export async function callAIWithCache(
  prompt: string,
  options: AIOptions
): Promise<Result> {
  const cacheKey = hashPrompt(prompt);
  
  // Check cache
  const cached = responseCache.get(cacheKey);
  if (cached && !isCacheExpired(cached)) {
    logger.info('Cache hit', { cacheKey });
    return cached.response;
  }
  
  // Call AI
  const response = await callAI(prompt, options);
  
  // Store in cache
  responseCache.set(cacheKey, {
    response,
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });
  
  return response;
}
```

**Cache Strategy**:
- Cache duration: 24 hours
- Cache identical prompts only
- Invalidate on user data changes
- Max cache size: 10,000 entries

**Expected Savings**: 30-50% cost reduction

---

**Strategy 2: Model Downgrade** (70% savings)

```typescript
// Use GPT-3.5-turbo for simple tasks
export function selectModel(task: AITask): string {
  // Complex tasks: GPT-4
  if (task.complexity === 'high' || task.requiresMedicalSafety) {
    return 'gpt-4-turbo-preview';
  }
  
  // Simple tasks: GPT-3.5
  if (task.complexity === 'low') {
    return 'gpt-3.5-turbo';
  }
  
  // Default: GPT-4
  return 'gpt-4-turbo-preview';
}
```

**Downgrade Candidates**:
- Simple data extraction
- Basic categorization
- Sentiment analysis
- Simple summarization

**Keep GPT-4 For**:
- Medical recommendations
- Complex analysis
- Safety-critical tasks
- Multi-step reasoning

**Expected Savings**: 70% on downgraded services

---

**Strategy 3: Prompt Optimization** (20% savings)

```typescript
// Optimize prompts to reduce token usage
export function optimizePrompt(prompt: string): string {
  // Remove unnecessary whitespace
  let optimized = prompt.replace(/\s+/g, ' ').trim();
  
  // Remove redundant instructions
  optimized = removeRedundantInstructions(optimized);
  
  // Use concise language
  optimized = useConciseLanguage(optimized);
  
  // Remove examples if not needed
  if (!requiresExamples(optimized)) {
    optimized = removeExamples(optimized);
  }
  
  return optimized;
}
```

**Optimization Techniques**:
- Remove unnecessary whitespace
- Use concise language
- Remove redundant instructions
- Minimize examples
- Use structured output format

**Expected Savings**: 20% token reduction

---

## 7. IMPLEMENTATION ROADMAP

### Week 1: Critical Safety 🔴

**Days 1-2**: Medical Safety Validation
- [ ] Create `medicalSafetyValidator.ts`
- [ ] Implement contraindication checking
- [ ] Implement red flag detection
- [ ] Test with 100 sample recommendations

**Days 3-4**: Conversation Guardrails
- [ ] Create `conversationGuardrails.ts`
- [ ] Implement medical advice detection
- [ ] Implement scope enforcement
- [ ] Test with 100 sample conversations

**Day 5**: PII Protection
- [ ] Create `piiProtection.ts`
- [ ] Implement PII detection and redaction
- [ ] Test with 50 sample texts

**Deliverable**: Safety framework complete, tested, documented

---

### Week 2: Parser Services 🔴

**Day 1**: Bloodwork Parser
- [ ] Migrate to `aiServiceWrapper`
- [ ] Add output validation
- [ ] Add confidence scoring
- [ ] Add PII redaction
- [ ] Test with 20 sample PDFs

**Day 2**: Body Composition Parser
- [ ] Migrate to `aiServiceWrapper`
- [ ] Add output validation
- [ ] Add confidence scoring
- [ ] Test with 20 samples

**Day 3**: Nutrition Extraction
- [ ] Migrate to `aiServiceWrapper`
- [ ] Add output validation
- [ ] Add confidence scoring
- [ ] Test with 20 samples

**Day 4**: Interview Parser
- [ ] Migrate to `aiServiceWrapper`
- [ ] Add output validation
- [ ] Add guardrails
- [ ] Test with 20 samples

**Day 5**: Testing & Documentation
- [ ] Integration testing
- [ ] Update documentation
- [ ] Create migration guide

**Deliverable**: All 4 parser services hardened

---

### Week 3: Enrichment Services 🟡

**Days 1-3**: Migrate 15 enrichment services
- [ ] 5 services per day
- [ ] Use actuarial pattern
- [ ] Add medical safety validation
- [ ] Test each service

**Days 4-5**: Recommendation Services
- [ ] Migrate 5 recommendation services
- [ ] Add medical safety validation
- [ ] Add output validation
- [ ] Test thoroughly

**Deliverable**: All 20 enrichment/recommendation services hardened

---

### Week 4: Observability 🟡

**Days 1-2**: Cost Monitoring
- [ ] Create `aiCostMonitor.ts`
- [ ] Integrate with all services
- [ ] Create cost dashboard
- [ ] Set up alerts

**Days 3-4**: Error Tracking
- [ ] Enhance error logging
- [ ] Create error dashboard
- [ ] Set up error alerts
- [ ] Create runbooks

**Day 5**: Rate Limiting
- [ ] Implement rate limiting per service
- [ ] Test rate limits
- [ ] Document limits

**Deliverable**: Full observability stack

---

### Week 5: Advanced Reliability 🟡

**Days 1-2**: Circuit Breaker
- [ ] Implement circuit breaker pattern
- [ ] Integrate with all services
- [ ] Test failure scenarios

**Days 3-4**: Graceful Degradation
- [ ] Document degradation strategies
- [ ] Implement degradation logic
- [ ] Test degradation paths

**Day 5**: Health Monitoring
- [ ] Create health dashboard
- [ ] Set up health checks
- [ ] Document health metrics

**Deliverable**: Advanced reliability features

---

### Week 6-8: Cost Optimization 🟢

**Week 6**: Response Caching
- [ ] Implement caching system
- [ ] Integrate with high-volume services
- [ ] Measure cache hit rate
- [ ] Optimize cache strategy

**Week 7**: Model Downgrade
- [ ] Identify downgrade candidates
- [ ] Implement model selection logic
- [ ] A/B test quality impact
- [ ] Roll out to production

**Week 8**: Prompt Optimization
- [ ] Audit all prompts
- [ ] Optimize for token usage
- [ ] Test quality impact
- [ ] Deploy optimizations

**Deliverable**: 50-70% cost reduction

---

### Week 9-12: Value Validation 🟢

**Week 9-10**: A/B Testing Framework
- [ ] Create A/B testing infrastructure
- [ ] Set up experiments for all enrichment services
- [ ] Collect effectiveness data

**Week 11**: Analysis
- [ ] Analyze A/B test results
- [ ] Calculate ROI per service
- [ ] Identify low-value services

**Week 12**: Optimization
- [ ] Disable low-value services
- [ ] Optimize high-value services
- [ ] Document findings

**Deliverable**: Data-driven AI service portfolio

---

## Summary

**Timeline**: 12 weeks total
- Weeks 1-3: Critical safety and reliability (MUST DO)
- Weeks 4-5: Observability and advanced reliability (SHOULD DO)
- Weeks 6-8: Cost optimization (NICE TO HAVE)
- Weeks 9-12: Value validation (NICE TO HAVE)

**Effort**: ~340 hours (8.5 weeks of 1 developer)

**Cost Impact**:
- Current: $81K-$810K/year (1K-10K users)
- After optimization: $40K-$400K/year (50% reduction)
- Potential savings: $40K-$410K/year

**Risk Reduction**: 95% of critical production risks eliminated in 3 weeks

**Production Ready**: After Week 3 (critical items complete)

**Full Optimization**: After Week 12 (all items complete)
