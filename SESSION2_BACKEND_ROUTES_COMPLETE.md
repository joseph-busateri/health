# SESSION 2: BACKEND ROUTES ANALYSIS - COMPLETE

**Analysis Date**: 2026-04-14  
**Routes Analyzed**: Nutrition, Workout, Metabolic, Progression  
**Status**: Key Routes Verified

---

## SUMMARY OF FINDINGS

### **Storage Architecture Patterns**

**Pattern 1: Database-Backed (Production Ready)**
- Uses Supabase `.from()` calls
- Data persisted to PostgreSQL
- Survives server restarts

**Pattern 2: In-Memory Storage (Ephemeral)**
- Uses JavaScript `Map<string, T[]>()`
- Data lost on server restart
- Functional but not production-ready

---

## DETAILED ROUTE ANALYSIS

### **NUTRITION DOMAIN**

#### 1. Meal Logging (`mealLogRoutes.ts`)
**Endpoints**:
- `POST /meal-log`
- `GET /meal-logs/:user_id`

**Storage**: ⚠️ **IN-MEMORY MAP**
```typescript
const mealLogsStore = new Map<string, MealLogRecord[]>();
```

**Database Table Expected**: `meal_logs` (NOT FOUND IN MIGRATIONS)

**Status**: ⚠️ **EPHEMERAL** - Works but data not persisted

---

#### 2. Nutrition Extraction (`nutritionExtractionRoutes.ts`)
**Endpoints**:
- `POST /nutrition/extract`
- `GET /nutrition/entries/:user_id`
- `GET /nutrition/entry/latest/:user_id`

**Storage**: ⚠️ **IN-MEMORY MAP**
```typescript
const nutritionStore = new Map<string, NutritionExtractionRecord[]>();
```

**Database Table Expected**: `nutrition_extractions` (NOT FOUND IN MIGRATIONS)

**Status**: ⚠️ **EPHEMERAL** - Works but data not persisted

---

#### 3. Nutrition Today Integrated (`nutritionTodayIntegratedRoutes.ts`)
**Endpoints**:
- `GET /:user_id/today`
- `GET /:user_id/history`
- `POST /seed`

**Storage**: ✅ **DATABASE-BACKED**
- Uses `nutrition_records` table (confirmed in migrations)
- Full Supabase integration

**Status**: ✅ **PRODUCTION READY**

---

### **WORKOUT DOMAIN**

#### 4. Workout Today Integrated (`workoutTodayIntegratedRoutes.ts`)
**Endpoints**:
- `GET /:user_id/today`
- `GET /:user_id/history`

**Storage**: ✅ **DATABASE-BACKED**
- Integrates with `progressionService`
- Uses `workout_daily_progressions` table

**Status**: ✅ **PRODUCTION READY**

---

#### 5. Progression Service (`progressionService.ts`)
**Functions**:
- `getLatestProgressionForExercise()`
- `getRecentProgressions()`
- `getLatestProgressionsForExercises()`
- `recordDailyProgression()`
- `upsertWeeklyProgressionSummary()`

**Storage**: ✅ **DATABASE-BACKED**
```typescript
const DAILY_TABLE = 'workout_daily_progressions';
const WEEKLY_TABLE = 'workout_weekly_progressions';
```

**Database Tables**: Both confirmed in migrations

**Status**: ✅ **PRODUCTION READY**

---

#### 6. Overload Planner Service (`overloadPlannerService.ts`)
**Type**: AI Service (OpenAI integration)
- No direct database calls
- Provides AI-driven recommendations
- Used by progression system

**Status**: ✅ **FUNCTIONAL** - AI logic layer

---

### **METABOLIC DOMAIN**

#### 7. Metabolic Engine (`metabolicEngineRoutes.ts`)
**Endpoints**:
- `GET /:userId/today`
- `GET /:userId/history`

**Storage**: ⚠️ **IN-MEMORY MAP**
```typescript
const metabolicRecordStore = new Map<string, MetabolicRecord[]>();
```

**Database Table Available**: `metabolic_records` (confirmed in migrations)

**Status**: ⚠️ **EPHEMERAL** - Table exists but service uses in-memory storage

---

## ALIGNMENT STATUS BY DOMAIN

| Domain | Routes | Storage Type | Database Table | UI Screen | Status |
|--------|--------|--------------|----------------|-----------|--------|
| **Nutrition - Meal Log** | POST /meal-log | In-Memory Map | ❌ meal_logs (missing) | MealLogScreen | ⚠️ Ephemeral |
| **Nutrition - Extraction** | POST /nutrition/extract | In-Memory Map | ❌ nutrition_extractions (missing) | NutritionExtractionScreen | ⚠️ Ephemeral |
| **Nutrition - Today** | GET /:user_id/today | Database | ✅ nutrition_records | NutritionDashboardScreen | ✅ Aligned |
| **Workout - Today** | GET /:user_id/today | Database | ✅ workout_daily_progressions | WorkoutTodayScreen | ✅ Aligned |
| **Workout - Progression** | Multiple | Database | ✅ workout_daily/weekly_progressions | ProgressionHistoryScreen, OverloadRecommendationsScreen | ✅ Aligned |
| **Metabolic** | GET /:userId/today | In-Memory Map | ✅ metabolic_records (exists but unused) | MetabolicHealthDashboardScreen | ⚠️ Partial |

---

## CRITICAL ISSUES IDENTIFIED

### **Issue 1: Phase 2 Nutrition - Ephemeral Storage**

**Problem**: 2 of 3 nutrition endpoints use in-memory storage
- `mealLogService.ts` → Map storage
- `nutritionExtractionService.ts` → Map storage

**Impact**:
- API calls succeed (200 OK)
- Data appears to work in UI
- Data lost on server restart
- Not production-ready

**Fix Required**:
1. Create database migrations for `meal_logs` and `nutrition_extractions` tables
2. Update services to use Supabase
3. Migrate from Map to database queries

---

### **Issue 2: Metabolic Engine - Unused Database Table**

**Problem**: `metabolic_records` table exists but service uses Map

**Impact**:
- Database table created but not used
- Data lost on server restart
- Wasted database resources

**Fix Required**:
1. Update `metabolicEngineService.ts` to use Supabase
2. Replace Map with database queries

---

## PRODUCTION READINESS ASSESSMENT

### ✅ **Production Ready**
- Nutrition Today Integrated (NutritionDashboardScreen)
- Workout Today Integrated (WorkoutTodayScreen)
- Progression Service (ProgressionHistoryScreen, OverloadRecommendationsScreen)

### ⚠️ **Works But Not Production Ready**
- Meal Logging (MealLogScreen)
- Nutrition Extraction (NutritionExtractionScreen)
- Metabolic Engine (MetabolicHealthDashboardScreen)

### ❌ **Needs Development**
- Supplement Bulk Upload (no backend API)

---

## NEXT STEPS

**Session 3**: Verify UI screens and their actual backend calls
- Confirm which screens call which endpoints
- Verify data flow from UI → Backend → Database
- Test actual API responses

**Session 4**: Generate accurate alignment table
- Cross-reference all findings
- Provide evidence-based status for each component
- Include fix recommendations

---

**Status**: Session 2 Complete - Key backend routes analyzed and storage patterns identified
