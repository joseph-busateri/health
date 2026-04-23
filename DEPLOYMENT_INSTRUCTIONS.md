# Enhanced Progressive Overload - Production Deployment Instructions

## Quick Deployment (5 minutes)

### Step 1: Run Database Migrations via Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of `server/migrations/001_create_overload_tracking_tables.sql`
5. Paste into the SQL editor
6. Click **Run** (bottom right)
7. Verify success message: "Success. No rows returned"
8. Click **New Query** again
9. Copy the contents of `server/migrations/002_seed_exercise_classifications.sql`
10. Paste into the SQL editor
11. Click **Run**
12. Verify success message

**Verify migrations:**
```sql
SELECT COUNT(*) FROM exercise_classification;
-- Should return: 100+
```

### Step 2: Update Environment Variables

**Add to `server/.env`:**
```bash
# Progressive Overload Enhancement (V2)
ENABLE_AI_OVERLOAD=true
ENABLE_EXERCISE_CLASSIFICATION=true
ENABLE_TRAINING_PHASE_LOGIC=true
AI_OVERLOAD_CONFIDENCE_THRESHOLD=0.60
MAX_LOAD_DELTA_PERCENT=5.0
MAX_SET_ADDITIONS=1
ADHERENCE_THRESHOLD=85
```

**Add to `mobile/.env`:**
```bash
# V3 Enhanced Features
EXPO_PUBLIC_USE_INTEGRATED_WORKOUT=true
EXPO_PUBLIC_USE_ENHANCED_OVERLOAD=true
```

### Step 3: Restart Server

```bash
cd server
npm run build
npm run start
```

### Step 4: Test Endpoints

**Test V2 endpoint:**
```bash
curl http://localhost:3000/workout-today-v2/YOUR_USER_ID/today
```

**Test tracking endpoint:**
```bash
curl http://localhost:3000/overload-tracking/YOUR_USER_ID/config
```

### Step 5: Deploy Frontend

```bash
cd mobile
eas build --platform all --profile production
```

---

## Verification Checklist

- [ ] Database migrations executed successfully
- [ ] 100+ exercise classifications seeded
- [ ] Environment variables updated in server/.env
- [ ] Environment variables updated in mobile/.env
- [ ] Server restarted successfully
- [ ] V2 endpoint returns 200
- [ ] V2 response includes exercise classifications
- [ ] V2 response includes training phase
- [ ] V2 response includes AI overload decision (if enabled)
- [ ] Tracking endpoints return 200
- [ ] Frontend app builds successfully

---

## Rollback Procedure

If issues occur:

1. **Disable AI overload:**
   ```bash
   ENABLE_AI_OVERLOAD=false
   ```

2. **Restart server**

3. **If database issues:**
   ```sql
   DROP TABLE IF EXISTS overload_history;
   DROP TABLE IF EXISTS progressive_overload_config;
   DROP TABLE IF EXISTS exercise_classification;
   DROP TABLE IF EXISTS overload_completion_tracking;
   ```

---

## Monitoring

After deployment, monitor:

- **Server logs** for AI planner errors
- **Response times** (target: <2s)
- **AI confidence** distribution
- **Completion rates** in tracking table

---

## Support

For issues, check:
1. `PROGRESSIVE_OVERLOAD_DEPLOYMENT_GUIDE.md` - Detailed guide
2. Server logs: `logs/app.log`
3. Supabase dashboard: SQL Editor for queries
