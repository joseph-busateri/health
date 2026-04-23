# Hardcoded UUIDs Analysis

**Date**: April 20, 2026
**Scope**: Entire codebase (server, mobile, scripts, documentation)

---

## Executive Summary

This analysis identified **60+ instances** of hardcoded UUIDs across the codebase. These fall into three categories:

1. **Production Critical** (3 instances) - UUIDs used in production API calls
2. **Test/Development** (50+ instances) - UUIDs used for testing and validation
3. **Data Seeding** (7 instances) - UUIDs used in database migrations

---

## 🔴 PRODUCTION CRITICAL (Requires Immediate Attention)

### 1. App ID in API Client
**File**: `mobile/src/services/api.ts`
**Line**: 20
**UUID**: `12345678-1234-1234-1234-123456789abc`
**Usage**: Hardcoded in `X-App-ID` header for all API calls
**Risk**: HIGH - This is sent with every API request from the mobile app
**Recommendation**: Move to environment variable (`EXPO_PUBLIC_APP_ID`)

```typescript
headers: {
  'Content-Type': 'application/json',
  'X-App-ID': '12345678-1234-1234-1234-123456789abc', // ⚠️ HARDCODED
},
```

### 2. App ID in AutonomousAdjustmentsScreen
**File**: `mobile/src/screens/AutonomousAdjustmentsScreen.tsx`
**Lines**: 57, 88, 106
**UUID**: `12345678-1234-1234-1234-123456789abc`
**Usage**: Hardcoded in `X-App-ID` header for fetch calls
**Risk**: HIGH - Same as above, duplicate of API client issue
**Recommendation**: Use the same environment variable as API client

### 3. App ID in SourceProvenanceScreen
**File**: `mobile/src/screens/SourceProvenanceScreen.tsx`
**Line**: 63
**UUID**: `12345678-1234-1234-1234-123456789abc`
**Usage**: Hardcoded in `X-App-ID` header for fetch calls
**Risk**: HIGH - Same as above, duplicate of API client issue
**Recommendation**: Use the same environment variable as API client

---

## 🟡 DEFAULT USER IDs (Acceptable for Development)

### 4. Mobile Default User ID
**File**: `mobile/.env.example`
**Line**: 16
**UUID**: `00000000-0000-0000-0000-000000000001`
**Usage**: Default user ID for mobile development
**Risk**: LOW - This is in .env.example, meant to be overridden
**Status**: ✅ ACCEPTABLE - Environment variable pattern

### 5. Server Default User ID
**File**: `server/.env.example`
**Line**: 39
**UUID**: `00000000-0000-0000-0000-000000000001`
**Usage**: Default user ID for server development
**Risk**: LOW - This is in .env.example, meant to be overridden
**Status**: ✅ ACCEPTABLE - Environment variable pattern

### 6. Mobile UserContext Default
**File**: `mobile/src/context/UserContext.tsx`
**Line**: 14
**UUID**: `00000000-0000-0000-0000-000000000001`
**Usage**: Fallback when environment variable not set
**Risk**: LOW - Only used as fallback
**Status**: ✅ ACCEPTABLE - Has environment variable override

### 7. Server userId Utility Default
**File**: `server/src/utils/userId.ts`
**Line**: 1
**UUID**: `00000000-0000-0000-0000-000000000001`
**Usage**: Fallback when environment variable not set
**Risk**: LOW - Only used as fallback
**Status**: ✅ ACCEPTABLE - Has environment variable override

---

## 🟢 TEST/DEVELOPMENT UUIDs (Acceptable)

### Test User IDs in Scripts (00000000-0000-0000-0000-00000000000X series)

These are sequential test UUIDs used in validation scripts:

- `00000000-0000-0000-0000-000000000001` - Used in 15+ test scripts
- `00000000-0000-0000-0000-000000000003` - debugValidation.ts
- `00000000-0000-0000-0000-000000000004` - findValidParseStatus.ts
- `00000000-0000-0000-0000-000000000005` - findValidParseStatus.ts
- `00000000-0000-0000-0000-000000000006` - checkTableConstraints.ts
- `00000000-0000-0000-0000-000000000007` - findValidSource.ts
- `00000000-0000-0000-0000-000000000008` - findValidSource.ts
- `00000000-0000-0000-0000-000000000009` - findValidSource.ts
- `00000000-0000-0000-0000-000000000010` - fixedValidation.ts
- `00000000-0000-0000-0000-000000000011` - fixedValidation.ts, testResultsTable.ts
- `00000000-0000-0000-0000-000000000012` - testResultsTable.ts
- `00000000-0000-0000-0000-000000000013` - checkExistingTables.ts
- `00000000-0000-0000-0000-000000000014` - workingValidation.ts
- `00000000-0000-0000-0000-000000000015` - validateIntelligenceE2E.ts
- `00000000-0000-0000-0000-000000000016` - validateBloodworkIntelligence.ts

**Status**: ✅ ACCEPTABLE - These are test scripts, not production code

### Supplement Test User ID

**UUID**: `550e8400-e29b-41d4-a716-446655440000`
**Files**:
- `server/check_table_structure.js`
- `server/comprehensive_validation.js`
- `server/final_validation.js`
- `server/fix_baseline_table.js`
- `server/src/migrations/insert_comprehensive_stack.sql`

**Status**: ✅ ACCEPTABLE - Test data for supplement system

### AI Validation Test User ID

**UUID**: `09e208b8-ff5c-4397-b289-4b019b149b2f`
**Files**:
- `server/src/scripts/validate-joint-ai-success.ts`
- `server/src/scripts/validate-joint-fallback.ts`
- `server/src/scripts/validate-recovery-ai-success.ts`
- `server/src/scripts/validate-stress-ai-success.ts`
- `server/src/scripts/validate-stress-fallback.ts`

**Status**: ✅ ACCEPTABLE - Test user for AI validation scripts

### String-based Test User IDs

These are non-UUID test identifiers:

- `test-user-123` - Used in 10+ test scripts
- `test-user-string` - test_table_structure.js
- `test-user-validation` - test-stress-direct.js
- `test-user-voice` - test-voice-interview-backend.ts
- `test-user-e2e` - test-voice-interview-backend.ts
- `test-user-sexual-health` - test-sexual-health-interview.ts
- `test-user-hybrid-interview` - test-hybrid-interview.ts
- `test-user-1`, `test-user-2`, `test-user-3` - test-hybrid-interview-local.ts
- `test-recovery-ai-pilot` - validateRecoveryEngineAIPilot.ts
- `execution-transparency-test` - validate-execution-transparency-e2e.ts
- `default-user` - testDashboardAPIs.ts
- `test-health-hub-user` - testHealthDataHub.ts

**Status**: ✅ ACCEPTABLE - These are test scripts, not production code

---

## 🔵 DATA SEEDING UUIDs (Acceptable for Migrations)

### Stack Version ID

**File**: `server/src/migrations/insert_comprehensive_stack.sql`
**UUID**: `a24592ae-a595-44da-a1c8-2eb92123547a`
**Usage**: Stack version ID for comprehensive supplement stack
**Status**: ✅ ACCEPTABLE - This is a database migration/seeding script

```sql
DECLARE
  v_stack_id uuid := 'a24592ae-a595-44da-a1c8-2eb92123547a';
```

### Supplement Test User in Migration

**File**: `server/src/migrations/insert_comprehensive_stack.sql`
**UUID**: `550e8400-e29b-41d4-a716-446655440000`
**Usage**: User ID for supplement stack seeding
**Status**: ✅ ACCEPTABLE - This is a database migration/seeding script

---

## 📝 DOCUMENTATION UUIDs (Acceptable)

### Example UUIDs in Documentation

**Files**:
- `SEXUAL_HEALTH_V2_DEPLOYMENT.md` - Example curl commands
- `RECOMMENDATION_V2_DEPLOYMENT.md` - Example SQL queries

**Status**: ✅ ACCEPTABLE - Documentation examples

---

## 🎯 RECOMMENDATIONS

### Immediate Actions (Priority 1)

1. **Replace hardcoded App ID with environment variable**
   - Create `EXPO_PUBLIC_APP_ID` in mobile `.env`
   - Update `mobile/src/services/api.ts` to use environment variable
   - Update `mobile/src/screens/AutonomousAdjustmentsScreen.tsx` to use environment variable
   - Update `mobile/src/screens/SourceProvenanceScreen.tsx` to use environment variable

### Optional Improvements (Priority 2)

2. **Centralize test user ID generation**
   - Consider creating a utility function to generate test UUIDs
   - This would make test scripts more maintainable

3. **Add comments to test scripts**
   - Document why specific UUIDs are used in test scripts
   - Add warnings that these are for testing only

---

## 🔍 SUMMARY TABLE

| Category | Count | Risk Level | Action Required |
|----------|-------|------------|-----------------|
| Production Critical | 3 | HIGH | ✅ Yes - Move to env vars |
| Default User IDs | 4 | LOW | ✅ No - Already use env vars |
| Test Scripts | 50+ | NONE | ❌ No - Acceptable |
| Data Seeding | 7 | NONE | ❌ No - Acceptable |
| Documentation | 2 | NONE | ❌ No - Acceptable |
| **TOTAL** | **66+** | | **3 actions needed** |

---

## 📋 FILES WITH HARDCODED UUIDs

### Production Files (3)
1. `mobile/src/services/api.ts` - App ID
2. `mobile/src/screens/AutonomousAdjustmentsScreen.tsx` - App ID
3. `mobile/src/screens/SourceProvenanceScreen.tsx` - App ID

### Configuration Files (4)
4. `mobile/.env.example` - Default user ID
5. `server/.env.example` - Default user ID
6. `mobile/src/context/UserContext.tsx` - Fallback user ID
7. `server/src/utils/userId.ts` - Fallback user ID

### Test Scripts (50+)
8. `server/check-actual-columns.js`
9. `server/check-panels-recommendations.js`
10. `server/check-schema.js`
11. `server/check_table_structure.js`
12. `server/comprehensive_validation.js`
13. `server/deep-analysis-trends.js`
14. `server/discover-schema.js`
15. `server/final_validation.js`
16. `server/fix_baseline_table.js`
17. `server/test-full-trend-save.js`
18. `server/test-minimal-trend.js`
19. `server/test-recommendation-generation.js`
20. `server/test-recommendation-insert.js`
21. `server/test-recommendation-v2.js`
22. `server/test-save-trends.js`
23. `server/test-trends.js`
24. `server/src/scripts/checkExistingTables.ts`
25. `server/src/scripts/checkRecommendationsTable.ts`
26. `server/src/scripts/checkTableConstraints.ts`
27. `server/src/scripts/debugValidation.ts`
28. `server/src/scripts/deployRecommendationsSchema.ts`
29. `server/src/scripts/directRecommendationTest.ts`
30. `server/src/scripts/findValidParseStatus.ts`
31. `server/src/scripts/findValidSource.ts`
32. `server/src/scripts/fixedValidation.ts`
33. `server/src/scripts/recreateRecommendationsTable.ts`
34. `server/src/scripts/testResultsTable.ts`
35. `server/src/scripts/validateBloodworkIntelligence.ts`
36. `server/src/scripts/validate-execution-transparency-e2e.ts`
37. `server/src/scripts/validateIntelligenceE2E.ts`
38. `server/src/scripts/validate-joint-ai-success.ts`
39. `server/src/scripts/validate-joint-fallback.ts`
40. `server/src/scripts/validate-recovery-ai-success.ts`
41. `server/src/scripts/validate-stress-ai-success.ts`
42. `server/src/scripts/validate-stress-fallback.ts`
43. `server/src/scripts/validateRecommendationEngine.ts`
44. `server/src/scripts/validateRecoveryEngineAIPilot.ts`
45. `server/src/scripts/verifyWorkoutSchema.ts`
46. `server/src/scripts/workingValidation.ts`
47. `server/test-backend.ps1`
48. `server/test-hybrid-interview.ts`
49. `server/test-hybrid-interview-local.ts`
50. `server/test-recommendation-prioritization.ts`
51. `server/test-sexual-health-interview.ts`
52. `server/test-stress-api.js`
53. `server/test-stress-direct.js`
54. `server/test-voice-interview-backend.ts`
55. `mobile/web-upload-test.html`

### Data Seeding (7)
56. `server/src/migrations/insert_comprehensive_stack.sql`

### Documentation (2)
57. `SEXUAL_HEALTH_V2_DEPLOYMENT.md`
58. `RECOMMENDATION_V2_DEPLOYMENT.md`

---

## ✅ CONCLUSION

The codebase has **3 production-critical hardcoded UUIDs** that should be moved to environment variables. All other hardcoded UUIDs are in test scripts, migrations, or documentation, which is acceptable and standard practice.

**Risk Assessment**: LOW - Only 3 instances need fixing, and they are all the same App ID used in API headers.
