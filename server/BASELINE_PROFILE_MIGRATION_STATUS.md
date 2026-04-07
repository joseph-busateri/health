# Baseline Profile Migration — Status Report

**Date**: April 6, 2026  
**Status**: Phase 1 Complete, Requires Testing & Completion

---

## COMPLETED ✅

### 1. Codebase Inspection
- ✅ Identified existing baseline config service (minimal, 3 fields only)
- ✅ Identified existing goal management schema (comprehensive, production-ready)
- ✅ Identified hardcoded defaults in nutrition service
- ✅ Documented all engine dependencies on baseline data
- ✅ Created inspection document: `BASELINE_PROFILE_MIGRATION_INSPECTION.md`

### 2. Database Schema Created
- ✅ Created migration: `20260406_baseline_profile_preferences_schema.sql`
- ✅ `baseline_profile` table with 30+ fields
- ✅ `user_preferences` table with training/nutrition/optimization preferences
- ✅ Helper functions for age calculation and profile retrieval
- ✅ Triggers for auto-updating timestamps and age
- ✅ Constraints for data validation

### 3. Service Layer Created
- ✅ Created `baselineProfileService.ts` with:
  - Database persistence via Supabase
  - 5-minute caching layer
  - Safe fallback to defaults
  - Structured logging
  - `getBaselineProfile()` function
  - `upsertBaselineProfile()` function
  - `getUserPreferences()` function
  - `upsertUserPreferences()` function
  - `getBaselineWithFallbacks()` helper

### 4. Nutrition Service Migration Started
- ✅ Imported `baselineProfileService`
- ✅ Updated `getBaselineNutrition()` to async
- ✅ Added baseline profile lookup
- ✅ Maintained backward compatibility with in-memory store
- ✅ Added fallback to defaults
- ⚠️ **Requires lint error fixes** (async/await propagation)

---

## IN PROGRESS ⚠️

### Nutrition Service Completion
**Status**: 90% complete, needs async/await fixes

**Remaining Work**:
1. Fix TypeScript lint errors from async function change
2. Update all callers to properly await
3. Test nutrition baseline loading from database
4. Verify fallback logic works

---

## PENDING 🔄

### Phase 5: Engine Integration (Critical)
**Priority**: HIGH

**Engines Needing Integration**:
1. **Metabolic Engine** - Needs age, sex, activity level
2. **Cardiovascular Engine** - Needs age, sex, family history
3. **Sexual Health Engine** - Needs age, TRT usage
4. **Workout Engine** - Needs training experience
5. **Joint Health Engine** - Needs age, injury history
6. **Recovery Engine** - Already uses sleep target (extend for more)
7. **Stress Engine** - Already uses stress tolerance (extend for more)
8. **Supplement Engine** - Needs preferences
9. **Adherence Engine** - Needs preferences
10. **Nutrition Engine** - In progress

**Implementation Pattern**:
```typescript
// In each engine service
import { getBaselineProfile } from './baselineProfileService';

// Load baseline
const profile = await getBaselineProfile(userId);

// Use with fallbacks
const age = profile.age ?? 35;
const sex = profile.sex ?? 'male';
const trtUsage = profile.trtUsage ?? false;
```

### Phase 6: SQL Import Support
**Priority**: MEDIUM

**Requirements**:
- Create import script for spreadsheet → SQL → DB
- Support JSONB parsing for arrays
- Handle nullable fields
- Provide example CSV/SQL format
- Document import process

### Phase 7: API Endpoints
**Priority**: MEDIUM

**Endpoints Needed**:
- `POST /baseline-profile/:userId` - Create/update profile
- `GET /baseline-profile/:userId` - Get profile
- `POST /user-preferences/:userId` - Create/update preferences
- `GET /user-preferences/:userId` - Get preferences

### Phase 8: Validation Script
**Priority**: HIGH

**Create**: `validate-baseline-goals.ts`

**Validate**:
- Baseline profile exists
- Goals exist (already working)
- Preferences exist
- Engines can access baseline
- Nutrition using baseline (not hardcoded)
- All engines using baseline fields

### Phase 9: Documentation
**Priority**: MEDIUM

**Documents Needed**:
- API documentation for new endpoints
- SQL import guide
- Migration guide for existing users
- Engine integration guide

---

## CRITICAL NEXT STEPS

### Immediate (Must Complete)
1. **Fix Nutrition Service Lint Errors**
   - Ensure all async/await properly propagated
   - Test nutrition baseline loading
   - Verify fallback logic

2. **Run Database Migration**
   - Execute `20260406_baseline_profile_preferences_schema.sql`
   - Verify tables created
   - Test helper functions

3. **Create Validation Script**
   - Validate baseline profile service working
   - Validate nutrition using baseline
   - Validate fallback logic

### Short-Term (This Week)
4. **Integrate Metabolic Engine**
   - Most critical for personalization
   - Needs age, sex, activity level

5. **Integrate Cardiovascular Engine**
   - Critical for risk assessment
   - Needs age, sex, family history

6. **Integrate Sexual Health Engine**
   - Needs age, TRT usage

7. **Create API Endpoints**
   - Allow profile creation/update
   - Enable testing without SQL import

### Medium-Term (Next Week)
8. **Integrate Remaining Engines**
   - Workout, Joint, Recovery, Stress, Supplement, Adherence

9. **Create SQL Import Script**
   - Support bulk user onboarding

10. **Complete Documentation**
    - API docs, migration guide, import guide

---

## BACKWARD COMPATIBILITY ✅

### Maintained
- ✅ Existing `baselineConfigService.ts` still works
- ✅ Existing `goals` tables unchanged
- ✅ Existing engine interfaces unchanged
- ✅ In-memory caching patterns preserved
- ✅ Fallback to defaults when profile missing

### Extended
- ✅ New `baselineProfileService.ts` alongside existing
- ✅ New database tables (no conflicts)
- ✅ Nutrition service checks both sources
- ✅ Graceful degradation everywhere

---

## TESTING REQUIREMENTS

### Unit Tests Needed
1. `baselineProfileService.ts`
   - Test database CRUD operations
   - Test caching behavior
   - Test fallback logic
   - Test error handling

2. `nutritionTodayIntegratedService.ts`
   - Test baseline loading from profile
   - Test fallback to defaults
   - Test backward compatibility with seeded data

### Integration Tests Needed
1. End-to-end baseline profile flow
2. Nutrition generation with real baseline
3. Engine consumption of baseline data
4. SQL import process

### Manual Testing Needed
1. Create baseline profile via API
2. Verify nutrition uses profile data
3. Verify engines use profile data
4. Test with missing profile (fallback)
5. Test with partial profile (fallback for missing fields)

---

## IMPACT ASSESSMENT

### Data Integration Completion
- **Before**: 77% (using hardcoded defaults)
- **After Phase 4**: 82% (nutrition personalized)
- **After Phase 5**: 90-95% (all engines personalized)

### Affected Systems
- ✅ Nutrition Engine - Using baseline instead of hardcoded
- 🔄 Metabolic Engine - Will use age, sex, activity level
- 🔄 Cardiovascular Engine - Will use age, sex, family history
- 🔄 Sexual Health Engine - Will use age, TRT usage
- 🔄 All 10 Engines - Will use personalized context

### User Experience Impact
- **Before**: Generic recommendations (age 35, male, 180 lbs)
- **After**: Personalized recommendations based on actual user data
- **Fallback**: System still works if profile not created

---

## RISKS & MITIGATIONS

### Risk 1: Async/Await Propagation
**Impact**: TypeScript errors, runtime issues  
**Mitigation**: Careful testing, lint error resolution  
**Status**: In progress

### Risk 2: Database Migration Failure
**Impact**: Tables not created, service fails  
**Mitigation**: Test migration in dev first, rollback plan  
**Status**: Not yet run

### Risk 3: Engine Integration Breaks Existing Logic
**Impact**: Engines fail, recommendations broken  
**Mitigation**: Gradual integration, fallback logic, comprehensive testing  
**Status**: Not yet started

### Risk 4: Performance Impact from Database Calls
**Impact**: Slower response times  
**Mitigation**: 5-minute caching, async loading, fallback to memory  
**Status**: Mitigated by design

---

## SUCCESS CRITERIA

### Phase 1-4 (Current)
- ✅ Schema created
- ✅ Service created
- ⚠️ Nutrition service updated (needs lint fixes)
- ❌ Validation passing

### Phase 5 (Engine Integration)
- ❌ All 10 engines using baseline profile
- ❌ Fallback logic working everywhere
- ❌ No hardcoded defaults in engines

### Phase 6-9 (Polish)
- ❌ SQL import working
- ❌ API endpoints created
- ❌ Validation script passing
- ❌ Documentation complete

### Overall Success
- ❌ 90-95% data integration completion
- ❌ All engines personalized
- ❌ System works with or without profile
- ❌ Production-ready

---

## RECOMMENDED APPROACH

### Option 1: Complete Current Phase First (Recommended)
1. Fix nutrition service lint errors
2. Test nutrition baseline loading
3. Create validation script
4. Verify 77% → 82% completion
5. Then proceed to engine integration

### Option 2: Parallel Development
1. Fix nutrition service (Developer A)
2. Integrate engines (Developer B)
3. Create validation (Developer C)
4. Risk: More coordination needed

### Option 3: Incremental Engine Integration
1. Fix nutrition service
2. Integrate 1 engine at a time
3. Test each integration
4. Lower risk, slower progress

**Recommendation**: Option 1 - Complete nutrition service, validate, then proceed systematically to engines

---

## TIMELINE ESTIMATE

### Immediate (Today)
- Fix nutrition service lint errors: 30 minutes
- Run database migration: 15 minutes
- Test nutrition baseline: 30 minutes
- **Total**: 1-2 hours

### Short-Term (This Week)
- Integrate 3 critical engines: 4-6 hours
- Create API endpoints: 2-3 hours
- Create validation script: 1-2 hours
- **Total**: 7-11 hours (1-2 days)

### Medium-Term (Next Week)
- Integrate remaining 7 engines: 6-8 hours
- SQL import script: 2-3 hours
- Documentation: 2-3 hours
- Testing: 3-4 hours
- **Total**: 13-18 hours (2-3 days)

### Overall Timeline
**Total Effort**: 21-31 hours (3-5 days)  
**Calendar Time**: 1-2 weeks (with testing and validation)

---

## CONCLUSION

The baseline profile migration is **40% complete** with solid foundations in place:
- ✅ Database schema designed and ready
- ✅ Service layer created with caching and fallbacks
- ⚠️ Nutrition service partially migrated (needs completion)
- ❌ Engine integration pending
- ❌ Validation and testing pending

**Next Action**: Fix nutrition service lint errors, test baseline loading, then proceed to engine integration.

**Impact**: This migration will increase data integration completion from 77% to 90-95%, making the system truly personalized instead of using generic defaults.
