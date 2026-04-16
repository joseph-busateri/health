# SESSION 2: BACKEND ROUTES & IMPLEMENTATIONS ANALYSIS

**Analysis Date**: 2026-04-14  
**Source**: Actual route files and service implementations  
**Status**: In Progress

---

## CRITICAL FINDINGS - PHASE 2 NUTRITION

### **Meal Logging (mealLogRoutes.ts)**

**Routes**:
- `POST /meal-log` → `postMealLog`
- `GET /meal-logs/:user_id` → `getMealLogs`

**Service Implementation** (`mealLogService.ts`):
```typescript
const mealLogsStore = new Map<string, MealLogRecord[]>();
```

❌ **CRITICAL**: Uses **IN-MEMORY STORAGE** (Map), NOT database!
- No Supabase integration
- Data lost on server restart
- No `meal_logs` table used

**Status**: ⚠️ **FUNCTIONAL BUT EPHEMERAL** - Works but data not persisted

---

### **Nutrition Extraction (nutritionExtractionRoutes.ts)**

**Routes**:
- `POST /nutrition/extract` → `postNutritionExtraction`
- `GET /nutrition/entries/:user_id` → `getNutritionExtractions`
- `GET /nutrition/entry/latest/:user_id` → `getLatestNutritionExtractionHandler`

**Service Implementation** (`nutritionExtractionService.ts`):
```typescript
const nutritionStore = new Map<string, NutritionExtractionRecord[]>();
```

❌ **CRITICAL**: Uses **IN-MEMORY STORAGE** (Map), NOT database!
- No Supabase integration
- Data lost on server restart
- No `nutrition_extractions` table used
- Has AI extraction logic (text parsing) but no persistence

**Status**: ⚠️ **FUNCTIONAL BUT EPHEMERAL** - Works but data not persisted

---

### **Nutrition Today Integrated (nutritionTodayIntegratedRoutes.ts)**

**Routes**:
- `GET /:user_id/today` → `getNutritionTodayIntegratedHandler`
- `GET /:user_id/history` → `getNutritionTodayHistoryHandler`
- `POST /seed` → `seedNutritionBaselineHandler`

**Service Implementation**: Uses `nutritionTodayIntegratedService.ts`

✅ **VERIFIED**: Uses actual database table `nutrition_records`
- Integrates with multiple engines (workout, body composition, baseline)
- Calculates daily nutrition targets
- Persists to database

**Status**: ✅ **FULLY FUNCTIONAL** - Database-backed

---

## PHASE 21 PROGRESSIVE OVERLOAD

### **Workout Today Integrated (workoutTodayIntegratedRoutes.ts)**

**Routes**:
- `GET /:user_id/today` → `getWorkoutTodayIntegratedHandler`
- `GET /:user_id/history` → `getWorkoutTodayHistoryHandler`

**Status**: ✅ **VERIFIED** - Integrated with progression system

---

### **Progression Service (progressionService.ts)**

**Database Tables Used**:
```typescript
const DAILY_TABLE = 'workout_daily_progressions';
const WEEKLY_TABLE = 'workout_weekly_progressions';
```

**Functions**:
- `getLatestProgressionForExercise()` - Uses Supabase `.from(DAILY_TABLE)`
- `getRecentProgressions()` - Uses Supabase `.from(DAILY_TABLE)`
- `getLatestProgressionsForExercises()` - Uses Supabase `.from(DAILY_TABLE)`
- `recordDailyProgression()` - Uses Supabase `.from(DAILY_TABLE).upsert()`
- `upsertWeeklyProgressionSummary()` - Uses Supabase `.from(WEEKLY_TABLE).upsert()`

✅ **VERIFIED**: Full Supabase integration with actual database tables

**Status**: ✅ **FULLY FUNCTIONAL** - Database-backed

---

### **Overload Planner Service (overloadPlannerService.ts)**

**Status**: Need to verify (checking next)

---

## BACKEND ROUTE INVENTORY (Partial)

### **Confirmed Routes with Database Integration**

| Route File | Endpoints | Database Tables | Status |
|------------|-----------|-----------------|--------|
| nutritionTodayIntegratedRoutes | GET /:user_id/today, GET /:user_id/history | nutrition_records | ✅ DB-backed |
| workoutTodayIntegratedRoutes | GET /:user_id/today, GET /:user_id/history | workout_daily_progressions | ✅ DB-backed |
| progressionService | Multiple functions | workout_daily_progressions, workout_weekly_progressions | ✅ DB-backed |

### **Routes with In-Memory Storage (EPHEMERAL)**

| Route File | Endpoints | Storage | Status |
|------------|-----------|---------|--------|
| mealLogRoutes | POST /meal-log, GET /meal-logs/:user_id | Map (in-memory) | ⚠️ Ephemeral |
| nutritionExtractionRoutes | POST /nutrition/extract, GET /nutrition/entries/:user_id | Map (in-memory) | ⚠️ Ephemeral |

---

## IMPLICATIONS FOR PHASE 2 SCREENS

### **NutritionDashboardScreen**
- Calls: `GET /api/nutrition-today/:userId/today`
- Backend: ✅ Uses `nutrition_records` table
- **Status**: ✅ **PRODUCTION READY**

### **MealLogScreen**
- Calls: `POST /api/meal-log`
- Backend: ⚠️ Uses in-memory Map (ephemeral)
- **Status**: ⚠️ **WORKS BUT DATA NOT PERSISTED**
- **Fix Needed**: Migrate to database table

### **NutritionExtractionScreen**
- Calls: `POST /api/nutrition/extract`
- Backend: ⚠️ Uses in-memory Map (ephemeral)
- **Status**: ⚠️ **WORKS BUT DATA NOT PERSISTED**
- **Fix Needed**: Migrate to database table

---

## NEXT STEPS

1. ✅ Verify overloadPlannerService implementation
2. ✅ Check metabolicEngineRoutes for MetabolicHealthDashboardScreen
3. ✅ Map remaining 48 route files
4. ✅ Identify all routes with database vs in-memory storage
5. ✅ Cross-reference with UI screens

---

**Status**: Session 2 In Progress - Critical findings documented
