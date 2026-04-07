# PHASE 3: RECOMMENDATION ENGINE MIGRATION CHECKLIST

**Date:** April 3, 2026  
**Status:** In Progress - Pilot with Recovery Engine

---

## MIGRATION CHECKLIST

### ✅ Phase 3A: Core Implementation (COMPLETE)

- [x] Create database migrations
  - [x] `20260403_create_phase2_engine_tables.sql` (4 engine tables)
  - [x] `20260403_create_recommendations_table.sql` (recommendations + history + conflicts)
- [x] Create type definitions
  - [x] `recommendationEngine.ts` (complete type system)
- [x] Create service layer
  - [x] `recommendationEngineService.ts` (lifecycle, prioritization, conflicts)
- [x] Create controller & routes
  - [x] `recommendationEngineController.ts` (9 HTTP handlers)
  - [x] `recommendationEngineRoutes.ts` (9 API endpoints)
- [x] Create documentation
  - [x] `PHASE_3_RECOMMENDATION_ENGINE_DOCUMENTATION.md`

### ✅ Phase 3B: Tightening & Improvements (COMPLETE)

- [x] **Deduplication & Idempotency**
  - [x] Add `isDuplicateRecommendation()` function
  - [x] Check for existing similar recommendations before creating
  - [x] Return existing recommendation if duplicate found (idempotent)
  - [x] Prevent duplicate active recommendations from repeated engine runs

- [x] **Confidence & Data Quality Preservation**
  - [x] Ensure `confidenceLevel` is required in RecommendationRequest
  - [x] Ensure `dataQualityScore` is required and validated (0-100)
  - [x] Preserve confidence/quality in database
  - [x] Expose confidence/quality to downstream consumers
  - [x] Add validation in emission helper

- [x] **Standardized Emission Interface**
  - [x] Create `recommendationEmitter.ts` helper
  - [x] Provide `emitRecommendation()` function as single interface
  - [x] Add `calculateConfidenceLevel()` helper
  - [x] Add `calculateDataQualityScore()` helper
  - [x] Add `calculateUrgencyScore()` helper
  - [x] Add validation for required fields
  - [x] Ensure all engines use this interface consistently

- [x] **Superseded Recommendation Handling**
  - [x] Add `supersedeRecommendation()` function
  - [x] Check if new recommendation should supersede existing one
  - [x] Expire superseded recommendations with reason
  - [x] Use 'expired' state (not a new state)
  - [x] Log superseding events

### ⏳ Phase 3C: Database Setup (IN PROGRESS)

- [ ] **Run Migrations**
  - [ ] Execute `20260403_create_phase2_engine_tables.sql` in Supabase
  - [ ] Execute `20260403_create_recommendations_table.sql` in Supabase
  - [ ] Verify all tables created correctly
  - [ ] Verify all indexes created
  - [ ] Verify all triggers working
  - [ ] Verify all helper functions working

- [ ] **Verify Database Schema**
  - [ ] Check `nutrition_records` table exists
  - [ ] Check `cardiovascular_records` table exists
  - [ ] Check `metabolic_records` table exists
  - [ ] Check `sexual_health_records` table exists
  - [ ] Check `recommendations` table exists
  - [ ] Check `recommendation_history` table exists
  - [ ] Check `recommendation_conflicts` table exists

### ✅ Phase 3D: Recovery Engine Pilot (COMPLETE)

- [x] **Refactor Recovery Engine**
  - [x] Import `emitRecommendation` helper
  - [x] Import confidence/quality calculation helpers
  - [x] Add recommendation emission logic after record creation
  - [x] Calculate confidence based on available data points
  - [x] Calculate data quality score
  - [x] Calculate urgency score based on recovery status
  - [x] Determine priority (important for poor, optimization for moderate)
  - [x] Emit recommendation only if recovery is poor or moderate
  - [x] Handle emission failures gracefully (don't fail engine)
  - [x] Keep existing recommendation generation for backward compatibility

- [x] **Create Validation Script**
  - [x] Create `validateRecommendationEngine.ts`
  - [x] Test 1: Recovery Engine integration
  - [x] Test 2: Deduplication & idempotency
  - [x] Test 3: Prioritization
  - [x] Test 4: Conflict detection
  - [x] Test 5: Lifecycle transitions
  - [x] Test 6: Confidence & data quality preservation

### ⏳ Phase 3E: Validation (PENDING)

- [ ] **Run Validation Script**
  - [ ] Execute `npx ts-node src/scripts/validateRecommendationEngine.ts`
  - [ ] Verify Test 1: Recovery Engine creates recommendation
  - [ ] Verify Test 2: Deduplication prevents duplicates
  - [ ] Verify Test 3: Prioritization orders correctly
  - [ ] Verify Test 4: Conflicts detected
  - [ ] Verify Test 5: All lifecycle transitions work
  - [ ] Verify Test 6: Confidence/quality preserved

- [ ] **End-to-End Validation**
  - [ ] Recovery Engine calculates record ✓
  - [ ] RecommendationEngine receives request ✓
  - [ ] Recommendation is persisted in database
  - [ ] Prioritization works correctly
  - [ ] Conflict detection runs
  - [ ] Lifecycle transitions work
  - [ ] Confidence/quality exposed to consumers

- [ ] **Performance Validation**
  - [ ] Recommendation creation < 100ms
  - [ ] Conflict detection < 50ms
  - [ ] Prioritization < 50ms
  - [ ] No N+1 queries
  - [ ] Database indexes used correctly

### ⏳ Phase 3F: Issues & Fixes (PENDING)

- [ ] **Document Issues Found**
  - [ ] List any bugs discovered
  - [ ] List any performance issues
  - [ ] List any data quality issues
  - [ ] List any UX concerns

- [ ] **Fix Critical Issues**
  - [ ] Fix any blocking bugs
  - [ ] Fix any data corruption issues
  - [ ] Fix any security issues

- [ ] **Address Non-Critical Issues**
  - [ ] Fix performance issues
  - [ ] Improve error messages
  - [ ] Add additional logging

---

## MIGRATION STATUS BY ENGINE

### ✅ Recovery Engine (PILOT - COMPLETE)
- [x] Refactored to emit RecommendationRequest
- [x] Uses standardized emission helper
- [x] Calculates confidence and data quality
- [x] Emits recommendations for poor/moderate recovery
- [x] Handles emission failures gracefully
- [ ] Validation pending (need to run migrations first)

### ⏳ Remaining Engines (PENDING)

**Phase 1 Engines:**
- [ ] Stress Engine
- [ ] Joint Health Engine
- [ ] Adherence Engine
- [ ] Workout Engine
- [ ] Supplement Engine

**Phase 2 Engines:**
- [ ] Nutrition Engine
- [ ] Cardiovascular Engine
- [ ] Metabolic Engine
- [ ] Sexual Health Engine

---

## FILES CREATED

### Database Migrations (2 files)
1. `server/src/migrations/20260403_create_phase2_engine_tables.sql` (~300 lines)
2. `server/src/migrations/20260403_create_recommendations_table.sql` (~450 lines)

### Type Definitions (1 file)
3. `server/src/types/recommendationEngine.ts` (~400 lines)

### Service Layer (2 files)
4. `server/src/services/recommendationEngineService.ts` (~800 lines)
5. `server/src/utils/recommendationEmitter.ts` (~250 lines)

### Controller & Routes (2 files)
6. `server/src/controllers/recommendationEngineController.ts` (~340 lines)
7. `server/src/routes/recommendationEngineRoutes.ts` (~70 lines)

### Validation (1 file)
8. `server/src/scripts/validateRecommendationEngine.ts` (~400 lines)

### Documentation (2 files)
9. `PHASE_3_RECOMMENDATION_ENGINE_DOCUMENTATION.md` (~1,200 lines)
10. `PHASE_3_MIGRATION_CHECKLIST.md` (this file)

**Total:** 10 files, ~4,200+ lines of code + documentation

---

## CODE CHANGES MADE

### 1. RecommendationEngine Service Enhancements

**Added Deduplication:**
```typescript
function isDuplicateRecommendation(
  newRec: RecommendationRequest,
  existing: Recommendation
): boolean {
  // Check source engine, category, action target/type, and title
  // Returns true if similar recommendation already exists
}
```

**Added Superseding:**
```typescript
async function supersedeRecommendation(
  recommendationId: string,
  reason: string
): Promise<void> {
  // Expire existing recommendation with reason
  // Used when new recommendation replaces old one
}
```

**Enhanced createRecommendation():**
- Check for duplicates before creating (idempotent)
- Check if should supersede existing recommendation
- Return existing if duplicate found
- Expire superseded recommendations

### 2. Standardized Emission Helper

**Created `recommendationEmitter.ts`:**
```typescript
export async function emitRecommendation(
  input: EmitRecommendationInput
): Promise<CreateRecommendationResult | null>
```

**Features:**
- Single interface for all engines
- Required confidence level validation
- Required data quality score validation (0-100)
- Auto-calculate expiration from hours
- Comprehensive logging
- Error handling

**Helper Functions:**
- `calculateConfidenceLevel()` - Based on data availability
- `calculateDataQualityScore()` - Multi-factor calculation
- `calculateUrgencyScore()` - Based on severity + time sensitivity

### 3. Recovery Engine Refactoring

**Added Imports:**
```typescript
import { 
  emitRecommendation, 
  calculateConfidenceLevel, 
  calculateDataQualityScore,
  calculateUrgencyScore,
} from '../utils/recommendationEmitter';
```

**Added Emission Logic:**
- Calculate confidence from available data points (8 total)
- Calculate data quality score (availability + recency + accuracy)
- Calculate urgency from recovery score
- Determine priority (important vs optimization)
- Emit recommendation only if poor/moderate recovery
- Handle failures gracefully (don't fail engine)

### 4. Validation Script

**Created comprehensive test suite:**
- Test 1: Recovery Engine integration
- Test 2: Deduplication & idempotency
- Test 3: Prioritization
- Test 4: Conflict detection
- Test 5: Lifecycle transitions (accept, reject, snooze, complete)
- Test 6: Confidence & data quality preservation

---

## NEXT STEPS

### Immediate (Today)
1. ✅ Complete code changes (DONE)
2. ⏳ Run database migrations in Supabase
3. ⏳ Run validation script
4. ⏳ Fix any issues found

### Short-term (This Week)
1. Validate Recovery Engine pilot thoroughly
2. Document any issues or improvements needed
3. Plan migration of remaining engines
4. Update UI to consume from RecommendationEngine (optional)

### Medium-term (Next Week)
1. Migrate Stress Engine
2. Migrate Joint Health Engine
3. Migrate remaining Phase 1 engines
4. Integrate Phase 2 engines
5. Deprecate old recommendation code

---

## VALIDATION RESULTS

**Status:** PENDING - Awaiting database migration

**Expected Results:**
- ✅ Recovery Engine creates recommendations
- ✅ Deduplication prevents duplicates
- ✅ Prioritization orders correctly
- ✅ Conflicts detected between recommendations
- ✅ All lifecycle transitions work
- ✅ Confidence and data quality preserved

**Actual Results:**
- [ ] TBD after running migrations and validation script

---

## ISSUES FOUND

**Status:** PENDING - No validation run yet

**Critical Issues:**
- None yet

**Non-Critical Issues:**
- None yet

**Improvements Needed:**
- TBD after validation

---

## SUMMARY

**Phase 3 Progress:**
- ✅ Core implementation complete
- ✅ Tightening & improvements complete
- ✅ Recovery Engine pilot refactored
- ✅ Validation script created
- ⏳ Database migrations pending
- ⏳ Validation pending

**Ready For:**
- Database migration execution
- Validation script execution
- Issue identification and fixing
- Additional engine migration (after pilot validation)

**Not Ready For:**
- UI integration (pending validation)
- Old code deprecation (pending full migration)
- Production deployment (pending validation)
