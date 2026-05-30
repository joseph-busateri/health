# Sexual Health V2 Deployment Guide

## Overview
Sexual Health V2 is production-ready with full hardening including monitoring, circuit breaker, caching, and alerting.

## Pre-Deployment Checklist

### 1. Feature Flags
Ensure environment variables are set in Railway:
- `USE_TREND_ANALYSIS_SEXUAL_HEALTH=false` (default: disabled for gradual rollout)
- `USE_AI_ENRICHMENT_SEXUAL_HEALTH=false` (default: disabled for gradual rollout)

### 2. Database
No database migrations required - V2 uses existing tables with backward compatibility.

### 3. Testing
Run validation tests locally:
```bash
cd server
npm run validate:sexual-health:e2e
```

## Deployment Methods

### Method 1: Railway Git Integration (Recommended)

1. **Commit changes:**
```bash
git add .
git commit -m "feat: deploy sexual health v2 with production hardening"
git push
```

2. **Railway will auto-deploy:**
   - Railway detects the push
   - Builds the server (per railway.json config)
   - Deploys to your Railway project
   - Health check runs at `/health`

3. **Verify deployment:**
   - Check Railway dashboard for deployment status
   - Test V2 endpoint: `GET /api/sexual-health-v2/:userId/today`
   - Test V1 endpoint (should still work): `GET /sexual-health/:userId/today`

### Method 2: Railway CLI

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login:**
```bash
railway login
```

3. **Deploy:**
```bash
railway up
```

### Method 3: Manual Build and Deploy

1. **Build locally:**
```bash
cd server
npm install
npm run build
```

2. **Upload to Railway:**
   - Use Railway dashboard to upload the `server/dist` folder
   - Or use Railway CLI to link and deploy

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-railway-app.railway.app/health
```

### 2. Test V2 Endpoint (Feature Flag Disabled)
```bash
curl https://your-railway-app.railway.app/api/sexual-health-v2/00000000-0000-0000-0000-000000000001/today
```
Expected: Returns data without trend analysis (fallback to V1 logic)

### 3. Test V1 Endpoint (Backward Compatibility)
```bash
curl https://your-railway-app.railway.app/sexual-health/00000000-0000-0000-0000-000000000001/today
```
Expected: Returns V1 data (unchanged)

### 4. Check Metrics
```bash
curl https://your-railway-app.railway.app/monitoring/sexual-health-v2
```
Expected: Returns metrics including request counts, latency, error rates

### 5. Test Circuit Breaker
To verify circuit breaker works, temporarily break the trend service and ensure graceful fallback.

## Gradual Rollout Plan

### Phase 1: Feature Flag Disabled (Current)
- V2 endpoint available but trend analysis disabled
- System uses V1 logic with V2 architecture
- Monitoring collects baseline metrics

### Phase 2: Enable Trend Analysis
- Set `USE_TREND_ANALYSIS_SEXUAL_HEALTH=true` in Railway
- Monitor metrics for increased latency and trend service calls
- Verify circuit breaker functioning

### Phase 3: Enable AI Enrichment
- Set `USE_AI_ENRICHMENT_SEXUAL_HEALTH=true` in Railway
- Monitor AI costs and recommendation quality
- Verify fallback to deterministic logic on AI failures

### Phase 4: Full Rollout
- Both feature flags enabled
- Full V2 functionality active
- Monitor all metrics and alerts

## Monitoring and Alerting

### Metrics Endpoint
- URL: `/monitoring/sexual-health-v2`
- Tracks: requests, errors, latency, trend service calls, availability

### Key Metrics to Monitor
- `sexual_health_v2_requests_total`: Request volume
- `sexual_health_v2_errors_total`: Error rate
- `sexual_health_v2_latency_seconds`: Response time (p50, p95, p99)
- `sexual_health_v2_trend_service_calls_total`: Trend service call rate
- `sexual_health_v2_trend_service_errors_total`: Trend service error rate

### Alerts
- Trend service failures
- Circuit breaker trips
- High latency (>5s)
- Insufficient trend data

## Rollback Plan

If issues occur:

### Immediate Rollback
1. Set feature flags to false in Railway:
   - `USE_TREND_ANALYSIS_SEXUAL_HEALTH=false`
   - `USE_AI_ENRICHMENT_SEXUAL_HEALTH=false`
2. Restart Railway service
3. V2 will fallback to V1 logic immediately

### Full Rollback
If V2 endpoint itself has issues:
1. Deploy previous commit
2. V1 endpoint remains available at `/sexual-health/:userId/today`

## Troubleshooting

### Issue: Circuit Breaker Open
**Symptom:** Trend analysis skipped, warnings in logs
**Solution:** 
- Check trend service health
- Reset circuit breaker via `/monitoring/sexual-health-v2/reset` (test only)
- Wait for automatic reset (1 minute timeout)

### Issue: High Latency
**Symptom:** Requests taking >5s
**Solution:**
- Check trend service performance
- Verify caching is working (check logs for "cache hit")
- Consider increasing cache TTL if appropriate

### Issue: Trend Service Errors
**Symptom:** Trend service failing repeatedly
**Solution:**
- Check database connectivity
- Verify bloodwork data exists (need 2+ data points)
- Check circuit breaker state in metrics

## Mobile App Update

The mobile app already includes V2 screen and API client. To enable V2 in the app:

1. Update mobile API base URL if needed
2. Navigate to Sexual Health Dashboard V2 screen
3. V2 will automatically use trend analysis when backend feature flag is enabled

## Support

For deployment issues:
- Check Railway deployment logs
- Review server logs for errors
- Check metrics endpoint for health indicators
- Verify environment variables in Railway dashboard
