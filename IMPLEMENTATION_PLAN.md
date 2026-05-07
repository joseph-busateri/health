# Production-Safe Implementation Plan - Health Score Detail Screens

## Pre-Implementation Analysis

### What's Already Complete ✅
1. **Risk Label Scoring (90/70/50/30)** - Implemented for:
   - Metabolic Score (17 inputs)
   - Recovery Score (8 inputs)
   - Cardiovascular Score (18 inputs)
   - Performance/Joint Health Score (7 inputs)

2. **Backend Scoring Functions** - All created:
   - `calculateMetabolicInputScore()`
   - `calculateRecoveryInputScore()`
   - `calculateCardiovascularInputScore()`
   - `calculateJointHealthInputScore()`

3. **Data Sources Verified**:
   - Metabolic weight: Already from `body_composition_scans` table ✅
   - Cardiovascular Total Cholesterol: Already calculated from LDL + HDL when missing ✅
   - Cardiovascular Total Cholesterol/HDL Ratio: Already calculated ✅

### What Needs to Be Fixed 🔧

#### 1. RECOVERY SCORE
**Issue**: Inputs may not be positioned at top of screen
**Fix**: Frontend UI positioning change
**Files**: `mobile/src/screens/RecoveryStatusScreen.tsx`

#### 2. CARDIOVASCULAR SCORE
**Issue**: Inputs may not be positioned above Recommendations
**Fix**: Frontend UI positioning change
**Files**: `mobile/src/screens/CardiovascularDashboardScreenV2.tsx`

#### 3. METABOLIC SCORE
**Status**: ✅ Weight already from body_composition_scans
**Action**: Verify only - no changes needed

#### 4. PERFORMANCE/JOINT HEALTH SCORE
**Issue**: User requests age, trainingExperience, weight to be added
**Analysis**: These fields are NOT in JointHealthInputs type and NOT used in calculation
**Decision**: Document that these are not calculation inputs; only display if user insists
**Files**: `server/src/types/jointHealthEngine.ts`, `server/src/services/jointHealthEngineService.ts`

#### 5. SEXUAL HEALTH SCORE
**Issue**: Not yet implemented, needs full investigation
**Action**: Identify active version, add all 25 inputs with risk labels
**Files**: Multiple - needs investigation

## Implementation Strategy

### Phase 1: Frontend UI Positioning (Low Risk)
1. Move Recovery inputs to top of screen
2. Move Cardiovascular inputs above Recommendations
3. Move Performance inputs to top of screen

### Phase 2: Performance Score Analysis
1. Verify if age/trainingExperience/weight are actually used in calculation
2. If NOT used, document as "informational only" or exclude
3. If user insists, add with "Not used in calculation" label

### Phase 3: Sexual Health Score Investigation
1. Find active screen version (V1/V2/V3)
2. Identify all 25 available inputs
3. Determine which are used in calculation
4. Add risk labels to all used inputs
5. Remove duplicative "Current Values" section

### Phase 4: Validation
1. Test all screens
2. Create validation summary table
3. Document all changes

## Files Likely to Change

### Frontend (UI Positioning)
1. `mobile/src/screens/RecoveryStatusScreen.tsx` - Move inputs to top
2. `mobile/src/screens/CardiovascularDashboardScreenV2.tsx` - Move inputs above Recommendations
3. `mobile/src/screens/JointHealthStatusScreen.tsx` - Move inputs to top
4. `mobile/src/screens/SexualHealthDashboardScreen*.tsx` - Remove Current Values, add all inputs

### Backend (Sexual Health Only)
5. `server/src/services/sexualHealthEngineService*.ts` - Add scoring function
6. `server/src/types/sexualHealthEngine.ts` - Verify input types

## Risk Assessment

### LOW RISK ✅
- Frontend UI positioning changes (Recovery, Cardiovascular, Performance)
- Verification of existing data sources (Metabolic weight, Cardiovascular calculations)

### MEDIUM RISK ⚠️
- Performance Score: Adding inputs not used in calculation (if user insists)
- Sexual Health Score: Full implementation needed

### HIGH RISK 🔴
- None - all changes are UI/display only, no calculation logic changes

## Validation Approach

### Automated Checks
- TypeScript compilation
- No breaking changes to API contracts
- All existing tests pass

### Manual Verification
- Recovery inputs appear at top
- Cardiovascular inputs appear above Recommendations
- Performance inputs appear at top
- Sexual Health "Current Values" removed
- All risk labels display correctly (90/70/50/30)
- Color coding correct (green/blue/orange/red)

## Expected Outcomes

### Recovery Score
- ✅ 8 inputs with risk labels (already complete)
- 🔧 Inputs positioned at top of screen

### Cardiovascular Score
- ✅ 18 inputs with risk labels (already complete)
- ✅ Total Cholesterol calculated from LDL + HDL (already complete)
- ✅ Total Cholesterol/HDL Ratio calculated (already complete)
- 🔧 Inputs positioned above Recommendations

### Metabolic Score
- ✅ 17 inputs with risk labels (already complete)
- ✅ Weight from body_composition_scans (already complete)

### Performance/Joint Health Score
- ✅ 7 inputs with risk labels (already complete)
- 🔧 Inputs positioned at top of screen
- ⚠️ User requests age/trainingExperience/weight (NOT in calculation)

### Sexual Health Score
- ⏳ Full implementation needed
- ⏳ 25 inputs to evaluate
- ⏳ Risk labels to add
- ⏳ Remove duplicative section

## Next Steps

1. Start with low-risk frontend UI positioning changes
2. Investigate Sexual Health score implementation
3. Create validation summary table
4. Update README.md with all changes

