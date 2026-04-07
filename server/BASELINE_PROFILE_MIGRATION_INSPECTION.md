# Baseline Profile Migration — Codebase Inspection

**Date**: April 6, 2026  
**Purpose**: Inspect existing implementations before in-place migration

---

## EXISTING IMPLEMENTATIONS FOUND

### 1. Baseline Config Service ✅
**File**: `src/services/baselineConfigService.ts`

**Current Implementation**:
- In-memory Map storage
- 3 fields only: `defaultSleepTarget`, `stressTolerance`, `recoverySensitivity`
- Uses hardcoded defaults
- No database persistence

**Type**: `src/types/baselineConfig.ts`
```typescript
interface BaselineConfig {
  userId: string;
  defaultSleepTarget: number;
  stressTolerance: number;
  recoverySensitivity: number;
}
```

**Assessment**: **MINIMAL** - Needs major extension

---

### 2. Goal Management Schema ✅
**File**: `src/migrations/20260329_goal_management_schema.sql`

**Existing Tables**:
- `goal_templates` ✅
- `goals` ✅
- `goal_metrics` ✅
- `goal_progress` ✅
- `goal_milestones` ✅
- `goal_recommendations` ✅
- `goal_adjustments` ✅
- `goal_achievements` ✅

**Assessment**: **COMPREHENSIVE** - Already production-ready, no changes needed

---

### 3. Hardcoded Defaults Found

#### Nutrition Baseline (CRITICAL)
**File**: `src/services/nutritionTodayIntegratedService.ts`
```typescript
const defaultBaseline: BaselineNutrition = {
  userId,
  calories: 2800,      // ❌ HARDCODED
  protein: 200,        // ❌ HARDCODED
  carbs: 280,          // ❌ HARDCODED
  fats: 80,            // ❌ HARDCODED
  hydrationOz: 100,    // ❌ HARDCODED
  bodyWeight: 180,     // ❌ HARDCODED
};
```

**Impact**: Nutrition Engine uses generic defaults

#### Baseline Profile Assumptions (CRITICAL)
**Expected in engines but not stored**:
- Age (assumed: 35)
- Sex (assumed: 'male')
- Height (assumed: 70 inches)
- Weight (assumed: 180 lbs)
- Training experience
- Activity level
- Medical conditions
- Medications
- TRT usage

**Impact**: All engines use generic context

---

## MISSING IMPLEMENTATIONS

### 1. Baseline Profile Table ❌
**Status**: Does not exist
**Needed**: User demographic and medical profile storage

### 2. User Preferences Table ❌
**Status**: Does not exist
**Needed**: Training preferences, nutrition preferences, risk tolerance

### 3. Baseline Profile Service ❌
**Status**: Minimal (only 3 fields)
**Needed**: Full profile management with database persistence

### 4. User Preferences Service ❌
**Status**: Does not exist
**Needed**: Preference management

---

## ENGINE CONSUMPTION ANALYSIS

### Engines Using Baseline Data
1. **Recovery Engine** - Uses sleep target from baselineConfig
2. **Stress Engine** - Uses stress tolerance from baselineConfig
3. **Metabolic Engine** - Needs age, sex, activity level (NOT AVAILABLE)
4. **Cardiovascular Engine** - Needs age, sex, family history (NOT AVAILABLE)
5. **Sexual Health Engine** - Needs age, TRT usage (NOT AVAILABLE)
6. **Nutrition Engine** - Uses hardcoded defaults (NOT PERSONALIZED)
7. **Workout Engine** - Needs training experience (NOT AVAILABLE)
8. **Joint Health Engine** - Needs age, injury history (NOT AVAILABLE)

---

## MIGRATION STRATEGY

### Phase 1: Schema Creation
- Create `baseline_profile` table (NEW)
- Create `user_preferences` table (NEW)
- Extend existing `baselineConfig` if needed

### Phase 2: Service Migration
- Extend `baselineConfigService.ts` to use database
- Create `baselineProfileService.ts` (NEW)
- Create `userPreferencesService.ts` (NEW)
- Add caching layer

### Phase 3: Default Migration
- Replace nutrition hardcoded defaults with baseline lookup
- Add fallback logic for missing baseline data

### Phase 4: Engine Integration
- Update all 10 engines to consume baseline profile
- Maintain backward compatibility
- Add structured logging

### Phase 5: SQL Import Support
- Support JSONB fields
- Handle nullable fields
- Provide import script

---

## BACKWARD COMPATIBILITY REQUIREMENTS

### Must Maintain
1. Existing `getBaselineConfig()` API
2. Existing `goals` table structure
3. Existing engine interfaces
4. Existing in-memory caching patterns

### Can Extend
1. Add new fields to BaselineConfig type
2. Add new services alongside existing
3. Add new database tables
4. Add new API endpoints

---

## RECOMMENDATION

**Approach**: **EXTEND, NOT REPLACE**

1. Keep existing `baselineConfigService.ts` for backward compatibility
2. Create new `baselineProfileService.ts` for full profile
3. Create new database tables for persistence
4. Migrate hardcoded defaults to database lookups with fallbacks
5. Integrate into engines gradually with safe defaults

**Timeline**: 1-2 days for complete migration
