# PHASE 22 & 23 DEPLOYMENT STEPS

**Date**: April 15, 2026  
**Status**: Ready to Deploy

---

## 🚀 STEP 1: Deploy Phase 22 Database Migration

### **Option A: Via Supabase Dashboard (Recommended)**

1. **Login to Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Navigate to: SQL Editor (left sidebar)
   - Click: "New Query"

3. **Copy Migration SQL**
   - Open: `server/src/migrations/20260415_phase22_interview_signals_schema.sql`
   - Copy entire file contents (192 lines)

4. **Execute Migration**
   - Paste SQL into Supabase SQL Editor
   - Click: "Run" or press `Ctrl+Enter`
   - Wait for success confirmation

5. **Verify Migration**
   - Run verification query:
   ```sql
   -- Check table exists
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'interview_signals';
   
   -- Check indexes
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'interview_signals';
   
   -- Check functions
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name IN (
     'get_latest_signal_value',
     'get_signal_trend',
     'get_recurring_patterns'
   );
   ```

   **Expected Results**:
   - Table: `interview_signals` exists
   - Indexes: 6 indexes created
   - Functions: 3 helper functions created

### **Option B: Via npm Script (Alternative)**

```bash
cd server
npm run migrate 20260415_phase22_interview_signals_schema
```

**Note**: This requires the migration script to be properly configured.

---

## 🔄 STEP 2: Restart Backend Server

### **Stop Current Server**
```bash
# If running in terminal, press Ctrl+C
# Or find and kill the process
```

### **Start Server**
```bash
cd server
npm run dev
```

### **Verify Server Started**
Look for logs:
```
✅ Server running on port 3000
✅ Database connected
✅ Routes registered: /api/unified-health
```

---

## 🧪 STEP 3: Test Unified Health Endpoints

### **Test 1: Health Check**
```bash
curl http://localhost:3000/api/health
```

**Expected**: `{"success": true, "message": "Health API is running"}`

### **Test 2: Get Unified Snapshot**
```bash
# Replace USER_ID with actual user ID
curl http://localhost:3000/api/unified-health/USER_ID
```

**Expected**: JSON response with all 10 data sources

### **Test 3: Get Correlations**
```bash
curl http://localhost:3000/api/unified-health/USER_ID/correlations
```

**Expected**: JSON response with correlation analysis

### **Test 4: Get Data Quality**
```bash
curl http://localhost:3000/api/unified-health/USER_ID/data-quality
```

**Expected**: JSON response with data quality metrics

### **Test 5: Get Complete Snapshot**
```bash
curl http://localhost:3000/api/unified-health/USER_ID/complete
```

**Expected**: Combined snapshot + correlations

### **Test 6: Get Source Summary**
```bash
curl http://localhost:3000/api/unified-health/USER_ID/summary
```

**Expected**: Summary of all data sources

### **Test 7: With Date Parameter**
```bash
curl "http://localhost:3000/api/unified-health/USER_ID?date=2026-04-15"
```

**Expected**: Snapshot for specific date

---

## 📊 STEP 4: Monitor Correlation Detection

### **Check Logs for Correlation Detection**
Watch server logs for:
```
🔍 [CORRELATION] Analyzing cross-source patterns
✅ [CORRELATION] Analysis complete
```

### **Monitor Correlation Metrics**
Track in logs:
- Total correlations detected
- Critical count
- Warning count
- Info count

### **Example Log Output**
```
📊 [UNIFIED] Fetching unified health snapshot { userId: 'user123', date: 'today' }
✅ [UNIFIED] Snapshot generated { sourcesAvailable: 8, completeness: 0.8 }
🔍 [CORRELATION] Analyzing cross-source patterns { userId: 'user123', sourcesAvailable: 8 }
✅ [CORRELATION] Analysis complete { userId: 'user123', totalCorrelations: 3, critical: 1, warnings: 2 }
```

---

## ✅ VERIFICATION CHECKLIST

### **Database Migration**
- [ ] `interview_signals` table created
- [ ] 6 indexes created
- [ ] 3 helper functions created
- [ ] No migration errors

### **Server Restart**
- [ ] Server starts without errors
- [ ] All routes registered
- [ ] Database connection successful
- [ ] No TypeScript compilation errors

### **API Endpoints**
- [ ] `/api/unified-health/:userId` returns snapshot
- [ ] `/api/unified-health/:userId/correlations` returns correlations
- [ ] `/api/unified-health/:userId/data-quality` returns metrics
- [ ] `/api/unified-health/:userId/complete` returns combined data
- [ ] `/api/unified-health/:userId/summary` returns summary
- [ ] Date parameter works correctly

### **Correlation Detection**
- [ ] Correlations detected in logs
- [ ] Confidence scores calculated
- [ ] Severity levels assigned
- [ ] Recommendations generated

---

## 🐛 TROUBLESHOOTING

### **Migration Fails**
- Check if `voice_interview_transcripts` table exists (required for foreign key)
- Verify Supabase connection
- Check for syntax errors in SQL

### **Server Won't Start**
- Check for port conflicts (port 3000)
- Verify environment variables
- Check TypeScript compilation errors
- Ensure all dependencies installed (`npm install`)

### **Endpoints Return Errors**
- Verify user ID exists in database
- Check data source availability
- Review server logs for specific errors
- Ensure database connection active

### **No Correlations Detected**
- Verify data sources have data
- Check data quality (need multiple sources)
- Review correlation detection logic
- Ensure interview signals exist

---

## 📈 POST-DEPLOYMENT MONITORING

### **Metrics to Track (First 24 Hours)**
1. **API Performance**
   - Response times for unified endpoints
   - Error rates
   - Request volume

2. **Data Aggregation**
   - Average sources available per user
   - Data completeness scores
   - Aggregation latency

3. **Correlation Detection**
   - Correlations per user per day
   - Average confidence scores
   - Severity distribution

4. **Database Performance**
   - Query execution times
   - Index usage
   - Connection pool status

### **Expected Baseline Metrics**
- Aggregation latency: <2 seconds
- Data completeness: 70-90%
- Correlations per user: 2-5 per day
- Average confidence: >0.7
- API error rate: <1%

---

## 🎯 SUCCESS CRITERIA

**Phase 22 Deployed Successfully When**:
- ✅ Database migration executed without errors
- ✅ Interview signals can be stored and retrieved
- ✅ Helper functions work correctly

**Phase 23 Deployed Successfully When**:
- ✅ All 5 unified health endpoints respond
- ✅ Data from all 10 sources aggregated
- ✅ Correlations detected and returned
- ✅ No critical errors in logs

---

## 📞 SUPPORT

**If Issues Arise**:
1. Check server logs for detailed error messages
2. Review `PHASE_22_DEPLOYMENT_GUIDE.md` for detailed troubleshooting
3. Verify all environment variables set correctly
4. Ensure database migrations ran successfully

**Rollback Plan** (if needed):
```sql
-- Drop Phase 22 tables and functions
DROP TABLE IF EXISTS interview_signals CASCADE;
DROP FUNCTION IF EXISTS get_latest_signal_value;
DROP FUNCTION IF EXISTS get_signal_trend;
DROP FUNCTION IF EXISTS get_recurring_patterns;
```

---

**Ready to Deploy!** 🚀
