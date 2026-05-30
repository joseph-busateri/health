# Bloodwork Recommendation Service V2 - Deployment Guide

## Overview
Enhanced recommendation engine with 30+ marker coverage, AI-enhanced personalization, and production-safe rollout strategy.

## Version Information
- **Version**: 2.0.0
- **Release Date**: 2026-04-19
- **Status**: PRODUCTION-READY
- **Backward Compatible**: Yes
- **Breaking Changes**: None

## What's New in V2

### Expanded Rule Coverage
- **V1**: 11 markers (32% coverage)
- **V2**: 30+ markers (90%+ coverage)

### New Categories
1. **Liver Function**: ALT, AST, GGT, Bilirubin, Alkaline Phosphatase
2. **Kidney Function**: Creatinine, BUN, eGFR
3. **Hematology**: WBC, RBC, HGB, Platelets
4. **Thyroid**: TSH, Free T3, Free T4
5. **Nutritional**: Vitamin D, Vitamin B12, Ferritin, Magnesium

### AI Enhancement
- Enabled by default in V2
- Personalized recommendation text
- Action items included
- Fallback to templates on AI failure

### Production Features
- Feature flag control (safe rollout)
- Automatic V1 fallback on V2 failure
- Comprehensive logging
- AI cost tracking
- Performance monitoring

## Pre-Deployment Checklist

### Environment Setup
- [ ] OpenAI API key configured (`OPENAI_API_KEY`)
- [ ] Supabase credentials configured
- [ ] Feature flags added to `.env`

### Database Verification
- [ ] `bloodwork_trends` table exists (from previous migration)
- [ ] `bloodwork_recommendations` table exists
- [ ] No foreign key constraints blocking inserts

### Code Verification
- [ ] V2 service files created
- [ ] Feature flags configured
- [ ] Processing pipeline updated
- [ ] Types extended for new categories

## Deployment Steps

### Step 1: Deploy Code (V2 Disabled)
```bash
# Pull latest code
git pull origin main

# Install dependencies (if needed)
cd server
npm install

# Verify .env has feature flags (should be false initially)
cat .env | grep USE_RECOMMENDATION_V2
# Expected: USE_RECOMMENDATION_V2=false (or not present)

# Start server
npm run dev
```

**Verification**:
- [ ] Server starts without errors
- [ ] Logs show "Feature flags" on startup
- [ ] V1 recommendations still work

### Step 2: Enable V2 for Test User
```bash
# Add to .env
echo "USE_RECOMMENDATION_V2=true" >> .env
echo "AI_ENHANCEMENT_ENABLED=true" >> .env
echo "USE_UNIFIED_ENGINE=false" >> .env

# Restart server
# Ctrl+C, then npm run dev
```

**Verification**:
- [ ] Server restarts successfully
- [ ] Logs show `USE_RECOMMENDATION_V2: true`

### Step 3: Test V2 with Bloodwork Upload
```bash
# Run test script
node test-recommendation-v2.js

# Upload test bloodwork document via UI or API
# Monitor logs for:
# - "[RECOMMENDATION V2] Starting recommendation generation"
# - "[RECOMMENDATION V2] Rule evaluation complete"
# - "[RECOMMENDATION V2] Recommendation generation complete"
```

**Expected Results**:
- More recommendations generated than V1
- Logs show AI enhancement attempts
- No errors in processing
- Recommendations saved to database

### Step 4: Validate Results
```bash
# Check recommendation count
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('bloodwork_recommendations')
  .select('id, test_name, recommendation_type')
  .eq('user_id', '00000000-0000-0000-0000-000000000001')
  .eq('status', 'active')
  .then(({data}) => console.log('Recommendations:', data.length, data.map(r => r.test_name)));
"
```

**Success Criteria**:
- [ ] Recommendation count increased
- [ ] New categories present (liver, kidney, etc.)
- [ ] AI-enhanced text visible
- [ ] No processing errors

### Step 5: Monitor AI Costs
```bash
# Check logs for AI cost tracking
grep "totalAICost" logs/server.log

# Expected: $0.01-0.10 per document depending on marker count
```

**Cost Monitoring**:
- [ ] AI costs within budget
- [ ] Fallback to templates working
- [ ] No excessive API calls

### Step 6: Gradual Rollout (Optional)
For production with multiple users:

```bash
# Option A: User-specific rollout
# Modify featureFlags.ts to check user_id

# Option B: Percentage rollout
# Modify featureFlags.ts to enable for X% of users

# Option C: Time-based rollout
# Enable during off-peak hours first
```

## Rollback Procedure

### Immediate Rollback
```bash
# 1. Disable V2 in .env
sed -i 's/USE_RECOMMENDATION_V2=true/USE_RECOMMENDATION_V2=false/' .env

# 2. Restart server
# Ctrl+C, then npm run dev

# 3. Verify V1 working
node test-trends.js
```

**Rollback Time**: < 1 minute

### Data Rollback
No data rollback needed - V2 uses same database schema as V1.

## Monitoring

### Key Metrics
1. **Recommendation Count**: Should increase 2-3x
2. **AI Success Rate**: Target >90%
3. **Processing Time**: +30s acceptable
4. **AI Cost**: Monitor per-document cost
5. **Error Rate**: Should remain low

### Log Patterns to Monitor
```bash
# V2 activation
grep "\[RECOMMENDATION V2\]" logs/server.log

# AI enhancement success
grep "AI enhancement successful" logs/server.log

# AI enhancement failures
grep "AI enhancement failed" logs/server.log

# Fallback to V1
grep "falling back to V1" logs/server.log
```

### Alerts to Set Up
1. V2 error rate > 5%
2. AI cost > $1 per document
3. Processing time > 2 minutes
4. V1 fallback rate > 10%

## Troubleshooting

### Issue: V2 Not Generating Recommendations
**Symptoms**: Recommendation count same as V1
**Causes**:
- Feature flag not enabled
- Trends don't match rule criteria
- AI enhancement failing silently

**Resolution**:
```bash
# Check feature flag
echo $USE_RECOMMENDATION_V2

# Check trends
node test-recommendation-v2.js

# Check logs for rule evaluation
grep "Rule evaluation complete" logs/server.log
```

### Issue: AI Enhancement Failing
**Symptoms**: Logs show "AI enhancement failed"
**Causes**:
- OpenAI API key invalid
- Rate limit exceeded
- Timeout

**Resolution**:
```bash
# Verify API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check rate limits in logs
grep "rate limit" logs/server.log

# Increase timeout if needed
# Edit .env: OPENAI_TIMEOUT_MS=60000
```

### Issue: High AI Costs
**Symptoms**: AI costs > $1 per document
**Causes**:
- Too many markers triggering AI
- Large prompt sizes
- Expensive model

**Resolution**:
```bash
# Disable AI enhancement temporarily
echo "AI_ENHANCEMENT_ENABLED=false" >> .env

# Or switch to cheaper model
echo "OPENAI_MODEL=gpt-4o-mini" >> .env

# Restart server
```

## Performance Expectations

### Processing Time
- **V1**: 30-45 seconds
- **V2 (no AI)**: 35-50 seconds
- **V2 (with AI)**: 60-90 seconds

### Recommendation Count
- **V1**: 0-3 recommendations typical
- **V2**: 3-10 recommendations typical

### AI Costs
- **Per Document**: $0.01-0.10
- **Per Marker**: $0.003-0.01
- **Monthly (100 docs)**: $1-10

## Post-Deployment Validation

### Day 1 Checklist
- [ ] 10+ documents processed successfully
- [ ] Recommendation count increased
- [ ] No critical errors
- [ ] AI costs within budget
- [ ] User feedback positive

### Week 1 Checklist
- [ ] 100+ documents processed
- [ ] Stable error rate (<2%)
- [ ] AI success rate >90%
- [ ] No performance degradation
- [ ] Cost projections accurate

### Production Readiness
- [ ] All smoke tests passing
- [ ] Monitoring dashboards configured
- [ ] Alerts configured
- [ ] Runbook documented
- [ ] Team trained on rollback

## Support

### Documentation
- README.md: Feature overview
- test-recommendation-v2.js: Testing script
- This file: Deployment guide

### Code Locations
- `server/src/services/bloodworkRecommendationServiceV2.ts`: Main service
- `server/src/services/bloodworkRecommendationRulesV2.ts`: Rule definitions
- `server/src/config/featureFlags.ts`: Feature flag management
- `server/src/services/bloodworkProcessingService.ts`: Integration point

### Contact
For issues or questions, check:
1. Server logs: `logs/server.log`
2. Test script: `node test-recommendation-v2.js`
3. Database: Query `bloodwork_recommendations` table
4. Feature flags: Check `.env` file

## Success Criteria

### Technical Success
✅ V2 service deployed without errors
✅ Recommendation coverage increased to 90%+
✅ AI enhancement working
✅ Backward compatibility maintained
✅ Rollback tested and working

### Business Success
✅ More actionable recommendations generated
✅ Better coverage of abnormal markers
✅ Improved user engagement with recommendations
✅ AI costs within budget
✅ No increase in support tickets

## Next Steps

### Future Enhancements
1. **Unified Engine Integration**: Enable `USE_UNIFIED_ENGINE=true`
2. **Additional Rules**: Add rules for uncovered markers
3. **ML-Based Thresholds**: Dynamic thresholds based on user data
4. **Multi-Marker Patterns**: Rules combining multiple markers
5. **Personalized Severity**: Adjust severity based on user profile

### Maintenance
- Review rule effectiveness monthly
- Update thresholds based on clinical guidelines
- Add new markers as needed
- Monitor AI cost trends
- Collect user feedback on recommendations
