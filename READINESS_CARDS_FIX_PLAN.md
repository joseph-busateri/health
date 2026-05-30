# Readiness Cards Fix - Implementation Plan

## Issues Identified

### 1. Recovery Card
- ❌ Score hardcoded to '78' instead of pulling from recovery engine
- ✅ Contributing Inputs section exists on detail screen

### 2. Cardiovascular Card
- ❌ Score hardcoded to '72' instead of pulling from cardiovascular engine
- ❌ Body fat not pulled from body composition data
- ❌ Recovery score not pulled from recovery engine

### 3. Metabolic Card
- ❌ Score hardcoded to '75'
- ❌ No dedicated detail screen (navigates to InsightsHome)

### 4. Performance/Joint Card
- ❌ Score hardcoded to '74'
- ✅ Input Signals section exists on detail screen

### 5. Sexual Health Card
- ❌ Score hardcoded to '82' instead of pulling from sexual health engine

## Implementation Strategy

### Phase 1: Home Screen Real Data Integration (CRITICAL)
**File**: `ModernHomeScreenV2.tsx`
- Load recovery score from `/recovery/:userId/today`
- Load cardiovascular status from `/cardiovascular/:userId/today`
- Load metabolic status from `/metabolic/:userId/today`
- Load joint health from `/joint-health/:userId/today`
- Load sexual health score from `/sexual-health/:userId/today`
- Convert status values to numeric scores for display
- Add loading states and error handling

### Phase 2: Metabolic Dashboard Screen (HIGH PRIORITY)
**File**: `MetabolicDashboardScreen.tsx`
- Display metabolic status and score
- Show contributing inputs (A1C, glucose, body fat, etc.)
- Display recommendations
- Add refresh functionality

### Phase 3: Cardiovascular Dashboard Enhancement (MEDIUM PRIORITY)
**File**: Update `CardiovascularDashboardScreenV2.tsx`
- Integrate body composition data from `/body-composition/:userId/latest`
- Integrate recovery score from `/recovery/:userId/today`
- Display in Contributing Inputs section

### Phase 4: Navigation Updates
- Add `MetabolicDashboard` to navigation types
- Update `HomeStackNavigator` to include new screen
- Update `ModernHomeScreenV2` navigation handler

## Score Mapping Logic

### Recovery
- Direct score: `recoveryRecord.recoveryScore` (0-100)

### Cardiovascular
- Status to score mapping:
  - `optimal` → 85-95
  - `moderate` → 70-84
  - `elevated_risk` → 50-69
  - `high_risk` → 30-49

### Metabolic
- Status to score mapping:
  - `optimal` → 85-95
  - `moderate` → 70-84
  - `elevated_risk` → 50-69
  - `high_risk` → 30-49

### Performance/Joint
- Risk level to score mapping:
  - `low` → 80-90
  - `moderate` → 60-79
  - `high` → 30-59

### Sexual Health
- Direct score: `sexualHealthRecord.sexualHealthScore` (0-100)

## Deployment Plan

1. Create `ModernHomeScreenV2.tsx` with real data integration
2. Create `MetabolicDashboardScreen.tsx`
3. Update `CardiovascularDashboardScreenV2.tsx`
4. Update navigation types and routes
5. Test all 5 cards and detail screens
6. Deploy with feature flag if needed
7. Monitor for errors
8. Deprecate `ModernHomeScreen.tsx` after validation

## Rollback Strategy

- Keep `ModernHomeScreen.tsx` unchanged
- Can revert navigation to use V1 if issues arise
- All changes are additive and versioned

## Testing Checklist

- [ ] Recovery card displays real score from engine
- [ ] Cardiovascular card displays real score
- [ ] Metabolic card displays real score
- [ ] Performance card displays real score
- [ ] Sexual Health card displays real score
- [ ] All cards navigate to correct detail screens
- [ ] Metabolic detail screen displays data correctly
- [ ] Cardiovascular detail shows body comp & recovery data
- [ ] Loading states work correctly
- [ ] Error states handled gracefully
- [ ] Empty states handled gracefully

## Production Readiness

**Status**: Ready for implementation

**Must-Fix Before Production**:
- None - all changes are additive

**Should-Fix Soon After Release**:
- Add caching to reduce API calls
- Add pull-to-refresh on home screen
- Add analytics tracking for card interactions

**Optional Future Enhancements**:
- Add trend indicators (↑↓) on cards
- Add historical comparison
- Add personalized insights on cards
