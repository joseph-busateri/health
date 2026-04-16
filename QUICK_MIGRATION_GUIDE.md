# ⚡ QUICK MIGRATION GUIDE - 10 MINUTES

**Total Time**: 10 minutes  
**Tasks**: 2 SQL migrations

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### **STEP 1: Open Supabase Dashboard**

1. Go to: https://app.supabase.com
2. Login with your credentials
3. Select your health project
4. Click **SQL Editor** in the left sidebar
5. Click **New Query**

---

### **STEP 2: Execute Phase 24 Migration (5 minutes)**

#### **A. Copy the SQL**

Open this file in your IDE:
```
server/src/migrations/20260415_phase24_correlation_engine_schema.sql
```

Select all (Ctrl+A) and copy (Ctrl+C)

#### **B. Paste and Run**

1. Paste into Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait for "Success" message

#### **C. Verify**

Run this verification query:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('correlation_history', 'correlation_alerts');
```

**Expected**: 2 rows returned
- `correlation_history`
- `correlation_alerts`

✅ **Phase 24 Complete!**

---

### **STEP 3: Execute Phase 25 Migration (5 minutes)**

#### **A. Copy the SQL**

Open this file in your IDE:
```
server/src/migrations/20260415_phase25_adaptive_interview_schema.sql
```

Select all (Ctrl+A) and copy (Ctrl+C)

#### **B. Paste and Run**

1. Click **New Query** in Supabase SQL Editor
2. Paste the SQL
3. Click **Run** (or press Ctrl+Enter)
4. Wait for "Success" message

#### **C. Verify**

Run this verification query:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('user_interview_profiles', 'interview_question_effectiveness', 'adaptive_interview_sessions');
```

**Expected**: 3 rows returned
- `user_interview_profiles`
- `interview_question_effectiveness`
- `adaptive_interview_sessions`

✅ **Phase 25 Complete!**

---

## 🎉 YOU'RE DONE!

Both Phase 3 and Phase 5 are now **100% deployed**.

### **What's Now Active**:

**Phase 3 - Correlation Engine**:
- ✅ Historical correlation tracking
- ✅ Trend analysis (improving/worsening/stable)
- ✅ Alert system (4 alert types)
- ✅ Recurring pattern detection
- ✅ 12 API endpoints at `/api/correlations`

**Phase 5 - Voice Interview Adaptation**:
- ✅ User interview profiling
- ✅ Data gap analysis (8 categories)
- ✅ Adaptive question generation (5 strategies)
- ✅ Question effectiveness tracking
- ✅ 8 API endpoints at `/api/adaptive-interview`

---

## 🧪 OPTIONAL: Test Endpoints

### **Test Phase 3**:
```bash
curl http://localhost:3000/api/correlations/YOUR_USER_ID/history?days=30
```

### **Test Phase 5**:
```bash
curl http://localhost:3000/api/adaptive-interview/profile/YOUR_USER_ID
```

---

## 📝 CHECKLIST

- [ ] Open Supabase Dashboard
- [ ] Execute Phase 24 migration (correlation_history, correlation_alerts)
- [ ] Verify 2 tables created
- [ ] Execute Phase 25 migration (user_interview_profiles, interview_question_effectiveness, adaptive_interview_sessions)
- [ ] Verify 3 tables created
- [ ] Test endpoints (optional)

---

**That's it! Server is already running with all the code. Just need these 2 SQL migrations.** ✅
