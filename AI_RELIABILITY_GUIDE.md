# AI RELIABILITY GUIDE

**Phases 4 & 5: AI Fallback Patterns + Error Handling**  
**Date**: April 16, 2026  
**Status**: Production-Ready Implementation

---

## Overview

This guide provides production-ready patterns for implementing AI fallback logic and error handling across all AI services in the application.

**Key Principle**: AI should enhance the user experience, not break it. Every AI call must have a graceful fallback.

---

## Architecture

### Core Infrastructure

**File**: `server/src/services/aiServiceWrapper.ts`

**Provides**:
- ✅ Retry logic with exponential backoff (2s, 4s, 8s)
- ✅ Timeout protection (30s default)
- ✅ Fallback pattern support
- ✅ Comprehensive error handling
- ✅ Metrics tracking per service
- ✅ Health monitoring

**Does NOT Provide** (single-user context):
- ❌ Circuit breaker (overkill for 1 user)
- ❌ Rate limiting (no abuse risk)
- ❌ Cost monitoring (already negligible at $10/month)

---

## Usage Patterns

### Pattern 1: AI with Fallback (Recommended)

**Use Case**: Critical features where AI failure should not break functionality

**Example**: Bloodwork parsing - if AI fails, return raw text for manual entry

```typescript
import { withAIFallback } from './aiServiceWrapper';

export async function parseBloodwork(text: string): Promise<ParseResult> {
  const fallback: ParseResult = {
    rawText: text,
    markers: [],
    requiresManualReview: true,
    source: 'fallback',
  };
  
  return withAIFallback(
    async () => {
      // AI parsing logic
      const aiResult = await callOpenAI(text);
      return {
        rawText: text,
        markers: aiResult.markers,
        requiresManualReview: false,
        source: 'ai',
      };
    },
    fallback,
    {
      serviceName: 'bloodwork-parser',
      maxRetries: 3,
      timeoutMs: 30000,
    }
  );
}
```

**Behavior**:
- ✅ Tries AI parsing with 3 retries
- ✅ Returns AI result if successful
- ✅ Returns fallback if AI fails (user can manually enter data)
- ✅ Logs failure for monitoring
- ✅ Tracks metrics

---

### Pattern 2: Optional AI Enhancement

**Use Case**: Non-critical AI enhancements where failure is acceptable

**Example**: AI-generated insights - if AI fails, just skip the enhancement

```typescript
import { withOptionalAI } from './aiServiceWrapper';

export async function enrichRecommendation(
  baseRecommendation: Recommendation
): Promise<Recommendation> {
  const aiEnrichment = await withOptionalAI(
    async () => {
      const enriched = await callOpenAI(baseRecommendation);
      return enriched;
    },
    {
      serviceName: 'recommendation-enrichment',
      maxRetries: 2,
    }
  );
  
  if (aiEnrichment) {
    return { ...baseRecommendation, ...aiEnrichment, source: 'ai_enriched' };
  }
  
  return { ...baseRecommendation, source: 'deterministic' };
}
```

**Behavior**:
- ✅ Tries AI enrichment with 2 retries
- ✅ Returns enriched recommendation if successful
- ✅ Returns base recommendation if AI fails (no enhancement)
- ✅ User still gets recommendation (just not AI-enhanced)

---

### Pattern 3: Actuarial-Style Fallback (Best Practice)

**Use Case**: AI enrichment where deterministic fallback is pre-computed

**Example**: Risk assessment - always compute deterministic result first, then try AI enhancement

```typescript
export async function calculateRisk(data: RiskData): Promise<RiskResult> {
  // ALWAYS compute deterministic result first
  const deterministicResult = computeDeterministicRisk(data);
  
  // Try AI enrichment (optional)
  const enrichedResult = await withAIFallback(
    async () => {
      const aiEnrichment = await callOpenAI(data);
      return {
        ...deterministicResult,
        aiInsights: aiEnrichment.insights,
        aiRecommendations: aiEnrichment.recommendations,
        source: 'ai_enriched',
      };
    },
    { ...deterministicResult, source: 'deterministic' },
    {
      serviceName: 'risk-enrichment',
      maxRetries: 3,
    }
  );
  
  return enrichedResult;
}
```

**Behavior**:
- ✅ Deterministic result ALWAYS computed (never fails)
- ✅ AI enhancement attempted (optional)
- ✅ Returns AI-enriched result if successful
- ✅ Returns deterministic result if AI fails
- ✅ User always gets a result

**Why This is Best**:
- Deterministic logic is reliable and testable
- AI adds value but doesn't create dependency
- Graceful degradation is automatic
- Production-safe by design

---

## Implementation Guide

### Step 1: Identify AI Service Type

**Question**: What happens if AI fails?

**Type A - Critical Parser** (user provides data):
- Example: Bloodwork parsing, nutrition extraction
- Fallback: Return raw text for manual entry
- Pattern: Use `withAIFallback` with manual entry fallback

**Type B - Enrichment Service** (background enhancement):
- Example: Recommendation enrichment, risk insights
- Fallback: Return deterministic result
- Pattern: Use `withAIFallback` with deterministic fallback

**Type C - Optional Enhancement** (nice-to-have):
- Example: AI-generated summaries, insights
- Fallback: Skip enhancement
- Pattern: Use `withOptionalAI` (returns null on failure)

### Step 2: Implement Fallback

**For Type A (Parser)**:
```typescript
const fallback = {
  rawText: inputText,
  parsed: null,
  requiresManualReview: true,
  source: 'fallback',
};

return withAIFallback(
  () => parseWithAI(inputText),
  fallback,
  { serviceName: 'my-parser' }
);
```

**For Type B (Enrichment)**:
```typescript
const deterministicResult = computeDeterministic(data);

return withAIFallback(
  () => enrichWithAI(deterministicResult),
  deterministicResult,
  { serviceName: 'my-enrichment' }
);
```

**For Type C (Optional)**:
```typescript
const enhancement = await withOptionalAI(
  () => generateInsights(data),
  { serviceName: 'my-insights' }
);

if (enhancement) {
  // Use enhancement
} else {
  // Continue without enhancement
}
```

### Step 3: Test Fallback

**Disable AI temporarily**:
```bash
# In .env file
OPENAI_API_KEY=""  # Empty to simulate failure
```

**Verify**:
1. Feature still works (uses fallback)
2. User sees graceful degradation
3. Logs show fallback usage
4. Metrics track fallback rate

**Re-enable AI**:
```bash
OPENAI_API_KEY="sk-..."  # Restore key
```

**Verify**:
1. AI works normally
2. Metrics show success rate
3. Fallback not used

---

## Monitoring

### Check AI Service Health

```typescript
import { getAIServicesHealth, getAIServiceMetrics } from './aiServiceWrapper';

// Get overall health
const health = getAIServicesHealth();
console.log('Healthy services:', health.healthy);
console.log('Degraded services:', health.degraded);
console.log('Failing services:', health.failing);

// Get specific service metrics
const metrics = getAIServiceMetrics('bloodwork-parser');
console.log('Success rate:', metrics.successes / metrics.attempts);
console.log('Fallback rate:', metrics.fallbacks / metrics.attempts);
console.log('Avg latency:', metrics.avgLatencyMs);
```

### Metrics Tracked

Per service:
- `attempts` - Total AI calls attempted
- `successes` - Successful AI calls
- `failures` - Failed AI calls
- `fallbacks` - Times fallback was used
- `retries` - Total retry attempts
- `timeouts` - Timeout occurrences
- `avgLatencyMs` - Average response time
- `lastError` - Most recent error message
- `lastErrorTime` - When last error occurred

### Health Status

**Healthy**: Success rate ≥ 95%
**Degraded**: Success rate 70-95% OR fallback rate < 50%
**Failing**: Success rate < 70% AND fallback rate ≥ 50%

---

## Error Handling Best Practices

### 1. Always Log Context

```typescript
logger.error('AI parsing failed', {
  serviceName: 'bloodwork-parser',
  inputLength: text.length,
  error: error.message,
  userId: userId,
  timestamp: new Date().toISOString(),
});
```

### 2. Provide User-Friendly Messages

**Bad**:
```typescript
throw new Error('OpenAI API call failed');
```

**Good**:
```typescript
return {
  success: false,
  message: 'We couldn\'t automatically parse your bloodwork. Please review and enter values manually.',
  data: { rawText: text, requiresManualReview: true },
};
```

### 3. Track Failure Patterns

```typescript
// Check if service is consistently failing
const metrics = getAIServiceMetrics('my-service');
if (metrics.failures > 10 && metrics.successes === 0) {
  logger.error('AI service completely failing', {
    serviceName: 'my-service',
    failures: metrics.failures,
    lastError: metrics.lastError,
  });
  // Consider alerting or disabling AI for this service
}
```

### 4. Handle Specific Error Types

```typescript
try {
  return await callOpenAI(data);
} catch (error: any) {
  if (error.status === 401) {
    logger.error('OpenAI authentication failed - check API key');
    // Don't retry auth errors
    return fallback;
  }
  
  if (error.status === 429) {
    logger.warn('OpenAI rate limit hit - will retry');
    // Retry with backoff
    throw error;
  }
  
  if (error.message?.includes('timeout')) {
    logger.warn('OpenAI timeout - will retry');
    // Retry timeouts
    throw error;
  }
  
  // Unknown error - log and use fallback
  logger.error('Unknown OpenAI error', { error: error.message });
  return fallback;
}
```

---

## Migration Checklist

### For Each AI Service

- [ ] Identify service type (Parser, Enrichment, Optional)
- [ ] Design appropriate fallback
- [ ] Implement using `withAIFallback` or `withOptionalAI`
- [ ] Test with AI disabled (verify fallback works)
- [ ] Test with AI enabled (verify AI works)
- [ ] Add service name to monitoring
- [ ] Document fallback behavior
- [ ] Update user-facing error messages

### Service Priority Order

**High Priority** (user-facing):
1. [ ] `bloodworkAIParser.ts` - Bloodwork parsing
2. [ ] `nutritionExtractionService.ts` - Nutrition extraction
3. [ ] `bodyCompositionAIParser.ts` - Body composition parsing
4. [ ] `interviewAnswerParserService.ts` - Interview parsing

**Medium Priority** (recommendations):
5. [ ] `bloodworkAIRecommendations.ts` - Bloodwork recommendations
6. [ ] `holisticAIAnalysis.ts` - Holistic analysis
7. [ ] `recommendationPrioritizationAI.ts` - Recommendation prioritization

**Low Priority** (enrichment - already has fallback or optional):
8-23. All enrichment services (use actuarial pattern)

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All critical services have fallbacks
- [ ] Fallbacks tested with AI disabled
- [ ] Metrics tracking enabled
- [ ] Error logging verified
- [ ] User-facing error messages updated
- [ ] Documentation complete

### Post-Deployment Monitoring

**Day 1**:
- [ ] Check AI service health
- [ ] Verify fallback rate < 5%
- [ ] Check for new error patterns
- [ ] Verify user experience unchanged

**Week 1**:
- [ ] Review metrics for all services
- [ ] Identify any degraded services
- [ ] Optimize retry logic if needed
- [ ] Adjust timeouts if needed

**Month 1**:
- [ ] Calculate cost impact (should be ~$10/month)
- [ ] Review fallback usage patterns
- [ ] Identify opportunities for improvement
- [ ] Document lessons learned

---

## Cost Optimization (Single-User Context)

**Current Cost**: ~$10/month for single user

**Optimization Opportunities**:

1. **Response Caching** (not implemented):
   - Cache AI responses for identical inputs
   - Potential savings: 30-50%
   - Complexity: Medium
   - **Recommendation**: Skip for single user (not worth complexity)

2. **Model Downgrade** (not implemented):
   - Use GPT-3.5-turbo for simple tasks
   - Potential savings: 70%
   - Complexity: Low
   - **Recommendation**: Consider if cost becomes issue

3. **Reduce Enrichment Services** (not implemented):
   - Disable low-value AI enrichments
   - Potential savings: 20-40%
   - Complexity: Low
   - **Recommendation**: Monitor usage, disable if not valuable

**For Single User**: Current cost is acceptable, no optimization needed

---

## Troubleshooting

### Issue: High Fallback Rate

**Symptoms**: Fallback rate > 20%

**Possible Causes**:
1. OpenAI API key invalid/expired
2. Network connectivity issues
3. OpenAI service degradation
4. Timeout too aggressive

**Solutions**:
1. Check API key in environment variables
2. Test network connectivity to OpenAI
3. Check OpenAI status page
4. Increase timeout (default 30s)

### Issue: Slow Response Times

**Symptoms**: avgLatencyMs > 10000 (10 seconds)

**Possible Causes**:
1. Large input text
2. Complex prompts
3. OpenAI service slow
4. Too many retries

**Solutions**:
1. Truncate input text to reasonable length
2. Simplify prompts
3. Check OpenAI status
4. Reduce maxRetries from 3 to 2

### Issue: All Services Failing

**Symptoms**: All services showing 100% fallback rate

**Possible Causes**:
1. OpenAI API key missing/invalid
2. Network completely down
3. OpenAI service outage

**Solutions**:
1. Verify OPENAI_API_KEY environment variable
2. Test network connectivity
3. Check OpenAI status page
4. Verify fallbacks are working (app should still function)

---

## Examples

### Example 1: Bloodwork Parser with Fallback

**Before** (no fallback):
```typescript
export async function parseBloodwork(text: string): Promise<ParseResult> {
  const aiResult = await callOpenAI(text);
  return aiResult; // FAILS if AI fails
}
```

**After** (with fallback):
```typescript
import { withAIFallback } from './aiServiceWrapper';

export async function parseBloodwork(text: string): Promise<ParseResult> {
  return withAIFallback(
    async () => {
      const aiResult = await callOpenAI(text);
      return {
        markers: aiResult.markers,
        requiresManualReview: false,
        source: 'ai',
      };
    },
    {
      rawText: text,
      markers: [],
      requiresManualReview: true,
      source: 'fallback',
    },
    { serviceName: 'bloodwork-parser' }
  );
}
```

**Result**: User can always enter bloodwork data (manually if AI fails)

### Example 2: Recommendation Enrichment

**Before** (no fallback):
```typescript
export async function enrichRecommendation(rec: Rec): Promise<Rec> {
  const enriched = await callOpenAI(rec);
  return enriched; // FAILS if AI fails
}
```

**After** (with fallback):
```typescript
import { withAIFallback } from './aiServiceWrapper';

export async function enrichRecommendation(rec: Rec): Promise<Rec> {
  // Compute deterministic recommendation first
  const deterministic = computeDeterministicRecommendation(rec);
  
  // Try AI enrichment
  return withAIFallback(
    async () => {
      const aiEnrichment = await callOpenAI(deterministic);
      return { ...deterministic, ...aiEnrichment, source: 'ai_enriched' };
    },
    { ...deterministic, source: 'deterministic' },
    { serviceName: 'recommendation-enrichment' }
  );
}
```

**Result**: User always gets recommendation (AI-enhanced if possible, deterministic if not)

---

## Summary

**Key Takeaways**:

1. ✅ **Always have a fallback** - AI should enhance, not break features
2. ✅ **Use aiServiceWrapper** - Handles retry, timeout, fallback automatically
3. ✅ **Compute deterministic first** - For enrichment services, always compute base result
4. ✅ **Test with AI disabled** - Verify fallbacks work before deploying
5. ✅ **Monitor metrics** - Track success/fallback rates per service
6. ✅ **Log errors** - Comprehensive logging for debugging
7. ✅ **User-friendly messages** - Don't expose technical errors to users

**For Single-User Application**:
- Cost is negligible (~$10/month)
- Reliability is more important than cost optimization
- Fallback patterns prevent feature failures
- Monitoring helps identify issues early

**Production-Ready**: ✅ YES - This pattern is safe for production deployment

---

## Support

**Questions?** Check the code:
- `server/src/services/aiServiceWrapper.ts` - Core implementation
- `server/src/services/actuarialAIEnrichment.ts` - Example with fallback
- `server/src/services/openAIService.ts` - Base OpenAI service

**Issues?** Check metrics:
```typescript
import { getAIServiceMetrics, getAIServicesHealth } from './aiServiceWrapper';
```
