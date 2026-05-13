# Progressive Overload Enhancement - Deployment Guide

## Overview

This guide covers the deployment of the enhanced progressive overload system with AI integration, exercise classification, training phase logic, and overload completion tracking.

## Architecture Summary

### Backend Components
- **Exercise Classification Service** - Classifies exercises as compound/isolation with movement patterns
- **Training Phase Service** - Determines training phase from baseline profile
- **AI Overload Planner Integration** - Uses GPT-4o-mini for intelligent overload decisions
- **Overload Tracking Service** - Tracks recommendations and completion status
- **V2 Integrated Service** - Orchestrates all components with feature flags

### Frontend Components
- **V3 Service** - Enhanced adapter for V2 backend response
- **V3 Types** - Extended type definitions for new features
- **Feature Flags** - Gradual rollout controls

### Database Components
- **overload_completion_tracking** - Tracks recommendations and completion
- **exercise_classification** - Stores exercise metadata (optional)
- **progressive_overload_config** - Per-user configurable thresholds
- **overload_history** - Historical decision log

## Pre-Deployment Checklist

### 1. Environment Variables

**Backend (.env):**
```bash
# AI Overload Planner
ENABLE_AI_OVERLOAD=false                    # Start with false
AI_OVERLOAD_CONFIDENCE_THRESHOLD=0.60       # Minimum confidence
AI_OVERLOAD_MODEL=gpt-4o-mini              # OpenAI model

# Exercise Classification
ENABLE_EXERCISE_CLASSIFICATION=false        # Start with false

# Training Phase Logic
ENABLE_TRAINING_PHASE_LOGIC=false          # Start with false

# OpenAI (required for AI overload)
OPENAI_API_KEY=your-key-here
```

**Frontend (mobile/.env):**
```bash
# V2 Integrated Service
EXPO_PUBLIC_USE_INTEGRATED_WORKOUT=false   # Start with false

# V3 Enhanced Features
EXPO_PUBLIC_USE_ENHANCED_OVERLOAD=false    # Start with false
```

### 2. Database Migrations

**Execute in order:**
```bash
# 1. Create tables
psql -d your_database -f server/migrations/001_create_overload_tracking_tables.sql

# 2. Seed exercise classifications
psql -d your_database -f server/migrations/002_seed_exercise_classifications.sql

# 3. Verify
psql -d your_database -c "SELECT COUNT(*) FROM exercise_classification;"
# Should return 100+
```

### 3. Code Deployment

**Backend:**
```bash
cd server
npm install
npm run build
npm run start
```

**Frontend:**
```bash
cd mobile
npm install
# For development
npm start
# For production build
eas build --platform all --profile production
```

## Deployment Phases

### Phase 1: Database Only (Day 1)
**Goal:** Deploy database schema without enabling features

**Steps:**
1. Run database migrations in production
2. Verify tables created successfully
3. Verify exercise classifications seeded
4. No code changes needed yet

**Validation:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('overload_completion_tracking', 'exercise_classification', 'progressive_overload_config', 'overload_history');

-- Check exercise count
SELECT classification, COUNT(*) FROM exercise_classification GROUP BY classification;
```

### Phase 2: Backend Code Deployment (Day 2-3)
**Goal:** Deploy backend code with all flags OFF

**Steps:**
1. Deploy backend code to production
2. Verify all feature flags are FALSE
3. Test V1 service still works (no regression)
4. Monitor logs for any errors

**Environment Variables:**
```bash
ENABLE_AI_OVERLOAD=false
ENABLE_EXERCISE_CLASSIFICATION=false
ENABLE_TRAINING_PHASE_LOGIC=false
```

**Validation:**
```bash
# Test V1 endpoint still works
curl https://your-api.com/workout-today/USER_ID/today

# Test V2 endpoint exists but behaves like V1
curl https://your-api.com/workout-today-v2/USER_ID/today
```

### Phase 3: Enable Exercise Classification (Day 4-5)
**Goal:** Enable exercise classification (safe, informational only)

**Steps:**
1. Set `ENABLE_EXERCISE_CLASSIFICATION=true`
2. Restart backend
3. Monitor logs for classification accuracy
4. Verify no errors

**Validation:**
```bash
# Check response includes exercise classifications
curl https://your-api.com/workout-today-v2/USER_ID/today | jq '.data.exerciseClassifications'
```

**Expected Behavior:**
- Exercises classified as compound/isolation
- Movement patterns identified
- No behavior change (just metadata)

### Phase 4: Enable Training Phase Logic (Day 6-7)
**Goal:** Enable training phase determination

**Steps:**
1. Set `ENABLE_TRAINING_PHASE_LOGIC=true`
2. Restart backend
3. Monitor logs for phase determination
4. Verify accuracy against user baselines

**Validation:**
```bash
# Check response includes training phase
curl https://your-api.com/workout-today-v2/USER_ID/today | jq '.data.trainingPhase'
```

**Expected Behavior:**
- Training phase determined from baseline.trainingStyle
- Defaults to 'maintenance' if unclear
- No behavior change (just metadata)

### Phase 5: Enable AI Overload (Conservative) (Day 8-10)
**Goal:** Enable AI overload with high confidence threshold

**Steps:**
1. Set `ENABLE_AI_OVERLOAD=true`
2. Set `AI_OVERLOAD_CONFIDENCE_THRESHOLD=0.80` (high threshold)
3. Restart backend
4. Monitor AI success rate
5. Monitor fallback rate

**Validation:**
```bash
# Check AI overload decisions
curl https://your-api.com/workout-today-v2/USER_ID/today | jq '.data.aiOverloadDecision'

# Check overload history
curl https://your-api.com/overload-tracking/USER_ID/decision-history
```

**Monitoring:**
- AI success rate (target: >95%)
- AI confidence distribution
- Fallback to simple overload rate (target: <10%)
- Response time p95 (target: <2s)

### Phase 6: Lower AI Confidence Threshold (Day 11-14)
**Goal:** Accept more AI recommendations

**Steps:**
1. If Phase 5 stable, lower threshold to 0.70
2. Monitor for 2-3 days
3. If stable, lower to 0.60 (default)
4. Continue monitoring

**Rollback Trigger:**
- AI success rate <90%
- Error rate >2%
- Response time p95 >3s
- User complaints

### Phase 7: Enable Frontend V3 (Day 15+)
**Goal:** Enable enhanced UI features

**Steps:**
1. Deploy mobile app with V3 service
2. Set `EXPO_PUBLIC_USE_ENHANCED_OVERLOAD=true` for beta users
3. Monitor user feedback
4. Gradually roll out to all users

**Validation:**
- Exercise classifications display correctly
- Training phase displays correctly
- Load progression displays correctly
- Overload completion tracking works

## Monitoring and Alerts

### Key Metrics

**Backend Metrics:**
- AI planner success rate (target: >95%)
- AI planner response time (target: <1s)
- Classification cache hit rate (target: >90%)
- Overload completion rate (target: >80%)
- Simple overload fallback rate (target: <10%)

**Database Metrics:**
- Overload tracking records created per day
- Completion rate percentage
- Average load delta
- Average set addition
- AI vs simple recommendation ratio

**Frontend Metrics:**
- V3 service success rate
- Adapter transformation errors
- User engagement with completion tracking

### Alerts to Set Up

**Critical Alerts:**
- AI planner failure rate >5%
- Database write failure rate >1%
- Response time p95 >3s
- Error rate >2%

**Warning Alerts:**
- AI confidence below threshold >20% of time
- Classification cache miss rate >20%
- Overload completion rate <50%
- Simple overload fallback rate >20%

## Rollback Procedures

### Immediate Rollback (Emergency)
**Trigger:** Critical errors, data corruption, severe performance degradation

**Steps:**
1. Set all feature flags to FALSE
2. Restart backend
3. Verify V1 service works
4. Investigate root cause

```bash
# Emergency rollback
ENABLE_AI_OVERLOAD=false
ENABLE_EXERCISE_CLASSIFICATION=false
ENABLE_TRAINING_PHASE_LOGIC=false
```

### Gradual Rollback (Issues Detected)
**Trigger:** High error rates, poor AI performance, user complaints

**Steps:**
1. Lower AI confidence threshold to 0.90 (very conservative)
2. If still issues, disable AI overload
3. Keep classification and training phase enabled (safe)
4. Investigate and fix issues
5. Re-enable gradually

### Database Rollback (If Needed)
**Only if database issues detected**

```sql
-- Drop new tables (CAUTION: loses all tracking data)
DROP TABLE IF EXISTS overload_history;
DROP TABLE IF EXISTS progressive_overload_config;
DROP TABLE IF EXISTS exercise_classification;
DROP TABLE IF EXISTS overload_completion_tracking;
```

## API Endpoints Reference

### V2 Workout Service

**GET /workout-today-v2/:user_id/today**
- Get today's workout with enhanced overload
- Query params: `?regenerate=true` to force regeneration
- Response: WorkoutTodayIntegratedV3

### Overload Tracking

**GET /overload-tracking/:user_id/:date**
- Get overload tracking for a specific date
- Response: OverloadCompletionRecord[]

**GET /overload-tracking/:user_id/history**
- Get overload tracking history
- Query params: `?limit=30` (default 30)
- Response: OverloadCompletionRecord[]

**GET /overload-tracking/:user_id/exercise/:exercise_key**
- Get overload tracking for a specific exercise
- Query params: `?limit=10` (default 10)
- Response: OverloadCompletionRecord[]

**POST /overload-tracking/:user_id/:date/:exercise_key/complete**
- Mark overload as completed
- Body: `{ completionNotes?: string }`
- Response: OverloadCompletionRecord

**GET /overload-tracking/:user_id/stats**
- Get overload completion statistics
- Query params: `?days=30` (default 30)
- Response: OverloadCompletionStats

**GET /overload-tracking/:user_id/decision-history**
- Get overload decision history
- Query params: `?limit=30` (default 30)
- Response: OverloadHistoryRecord[]

**GET /overload-tracking/:user_id/config**
- Get user's overload config
- Response: ProgressiveOverloadConfigRecord

**PUT /overload-tracking/:user_id/config**
- Update user's overload config
- Body: ProgressiveOverloadConfigInput
- Response: ProgressiveOverloadConfigRecord

## Troubleshooting

### Issue: AI Planner Returns Null
**Symptoms:** All recommendations fall back to simple overload

**Diagnosis:**
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Check AI planner logs
grep "AI overload planner" logs/app.log
```

**Solutions:**
- Verify OpenAI API key is valid
- Check OpenAI API quota
- Verify model name is correct (gpt-4o-mini)
- Check network connectivity to OpenAI

### Issue: Low AI Confidence
**Symptoms:** AI confidence consistently below threshold

**Diagnosis:**
```bash
# Check AI confidence distribution
curl https://your-api.com/overload-tracking/USER_ID/decision-history | jq '.data[].aiConfidence'
```

**Solutions:**
- Lower confidence threshold temporarily
- Review AI prompt in overloadPlannerService.ts
- Check if readiness scores are available
- Verify exercise history is being passed

### Issue: Classification Cache Misses
**Symptoms:** High cache miss rate, slow performance

**Diagnosis:**
```bash
# Check classification logs
grep "Exercise classified" logs/app.log
```

**Solutions:**
- Verify exercise names match seeded data
- Add missing exercises to database
- Check normalization logic (lowercase, trim, underscore)

### Issue: Database Write Failures
**Symptoms:** Tracking records not created

**Diagnosis:**
```sql
-- Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='overload_completion_tracking';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename='overload_completion_tracking';
```

**Solutions:**
- Verify RLS policies are correct
- Check user authentication
- Verify user_id matches auth.uid()

## Performance Optimization

### Caching Strategy
- Exercise classifications cached in-memory
- Training phase cached in-memory
- Overload config cached per request
- Clear caches on baseline updates

### Database Optimization
- Indexes on user_id, date, exercise_key
- Limit history queries to 30 days
- Archive old tracking records (>90 days)

### AI Optimization
- Cache AI decisions for 24 hours
- Batch multiple exercise requests
- Use streaming for faster responses
- Monitor token usage

## Success Criteria

### Technical Success
- ✅ AI planner success rate >95%
- ✅ Response time p95 <2s
- ✅ Error rate <1%
- ✅ Classification accuracy >90%
- ✅ Zero data loss
- ✅ Zero downtime

### Business Success
- ✅ Overload completion rate >80%
- ✅ User engagement with tracking
- ✅ Positive user feedback
- ✅ Progressive overload applied when optimal
- ✅ Safe fallbacks working

## Post-Deployment Tasks

### Week 1
- Monitor all metrics daily
- Review AI recommendations manually
- Collect user feedback
- Fix any critical issues

### Week 2-4
- Analyze completion rates
- Review AI confidence distribution
- Optimize thresholds based on data
- Add missing exercise classifications

### Month 2+
- Implement per-user config UI
- Add historical progression analysis
- Enhance AI prompt based on learnings
- Add more sophisticated overload logic

## Support and Maintenance

### Regular Maintenance
- Weekly: Review AI performance metrics
- Monthly: Update exercise classifications
- Quarterly: Review and optimize thresholds
- Annually: Major feature enhancements

### User Support
- Document feature in user guide
- Create video tutorials
- Provide FAQ
- Monitor support tickets

## Conclusion

This deployment guide ensures a safe, gradual rollout of the enhanced progressive overload system. Follow the phases in order, monitor metrics closely, and be prepared to rollback if issues arise. The system is designed with multiple fallback layers to ensure user safety and data integrity.
