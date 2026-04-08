# UI/UX FIX EXECUTION PLAN
**Based on Comprehensive UI/UX Screen Audit**

Date: 2026-04-07  
Source: COMPREHENSIVE_UI_UX_SCREEN_AUDIT.md

---

## EXECUTION STRATEGY

**Approach**: Surgical navigation wiring + minimal service connections  
**Risk**: MINIMAL - No backend changes, mostly UI navigation fixes  
**Estimated Timeline**: 2-3 weeks for critical + high priority items

---

## PHASE 1: CRITICAL FIXES (Week 1)
**Priority**: CRITICAL - Blocks core Phase 14-20 functionality

### 1.1 Wire ControlTowerScreen (Phase 14 Flagship)
**File**: `mobile/src/screens/ControlTowerScreen.tsx`  
**Status**: ORPHANED - Fully implemented, not in navigation  
**Action**: Add to AppNavigator.tsx

**Steps**:
1. Add import to AppNavigator.tsx
2. Add route definition in RootStackParamList
3. Add Stack.Screen component
4. Test navigation from DashboardV13Screen

**Expected Impact**: Exposes primary Phase 14 Control Tower surface

### 1.2 Wire BaselineProfileScreen (Baseline Editing)
**File**: `mobile/src/screens/BaselineProfileScreen.tsx`  
**Status**: ORPHANED - Critical for profile editing  
**Action**: Add to AppNavigator.tsx

**Steps**:
1. Add import to AppNavigator.tsx
2. Add route definition in RootStackParamList
3. Add Stack.Screen component
4. Add navigation button from UserSettingsScreen

**Expected Impact**: Enables baseline profile editing after initial upload

### 1.3 Wire GoalManagementScreen (Goal Management)
**File**: `mobile/src/screens/GoalManagementScreen.tsx`  
**Status**: ORPHANED - No accessible goal management  
**Action**: Add to AppNavigator.tsx

**Steps**:
1. Add import to AppNavigator.tsx
2. Add route definition in RootStackParamList
3. Add Stack.Screen component
4. Add navigation button from DashboardV13Screen or UserSettingsScreen

**Expected Impact**: Enables dynamic goal management

### 1.4 Wire HealthDataHubScreen (Phase 18-20 Hub)
**File**: `mobile/src/screens/HealthDataHubScreen.tsx`  
**Status**: ORPHANED - Phase 18-20 unified hub  
**Action**: Add to AppNavigator.tsx

**Steps**:
1. Add import to AppNavigator.tsx
2. Add route definition in RootStackParamList
3. Add Stack.Screen component
4. Add navigation button from UserSettingsScreen

**Expected Impact**: Exposes Phase 18-20 data hub capabilities

### 1.5 Wire Device Connection Screens
**Files**: 
- `mobile/src/screens/AppleWatchConnectScreen.tsx`
- `mobile/src/screens/OuraConnectScreen.tsx`

**Status**: ORPHANED - Major device connections  
**Action**: Add to AppNavigator.tsx

**Steps**:
1. Add imports to AppNavigator.tsx
2. Add route definitions in RootStackParamList
3. Add Stack.Screen components
4. Add navigation buttons from DevicesScreen

**Expected Impact**: Enables Apple Watch and Oura Ring connections

### 1.6 Wire Interview Variant Screens
**Files**:
- `mobile/src/screens/AgentInterviewScreen.tsx`
- `mobile/src/screens/DynamicInterviewScreen.tsx`
- `mobile/src/screens/HybridInterviewScreen.tsx`

**Status**: ORPHANED - 3 of 4 interview variants not accessible  
**Action**: Add to AppNavigator.tsx

**Steps**:
1. Add imports to AppNavigator.tsx
2. Add route definitions in RootStackParamList
3. Add Stack.Screen components
4. Create interview mode selector screen (optional)
5. Add navigation from VoiceInterviewScreen or dashboard

**Expected Impact**: Exposes all interview UX patterns

### 1.7 Wire BodyCompositionUploadScreen
**File**: `mobile/src/screens/BodyCompositionUploadScreen.tsx`  
**Status**: ORPHANED - Critical upload capability  
**Action**: Add to AppNavigator.tsx

**Steps**:
1. Add import to AppNavigator.tsx
2. Add route definition in RootStackParamList
3. Add Stack.Screen component
4. Add navigation from upload flows or settings

**Expected Impact**: Enables body composition data upload

---

## PHASE 2: HIGH PRIORITY FIXES (Week 1-2)
**Priority**: HIGH - Improves core user experience

### 2.1 Wire Intelligence Surfaces
**Files**:
- `mobile/src/screens/InjuryPreventionScreen.tsx`
- `mobile/src/screens/StrengthTrackingScreen.tsx`
- `mobile/src/screens/RecoveryDashboardScreen.tsx`
- `mobile/src/screens/AnalyticsDashboardScreen.tsx`

**Status**: ORPHANED - Advanced intelligence surfaces  
**Action**: Add to AppNavigator.tsx

**Steps**:
1. Add imports to AppNavigator.tsx
2. Add route definitions in RootStackParamList
3. Add Stack.Screen components
4. Add navigation buttons from relevant status screens or dashboard

**Expected Impact**: Exposes advanced analytics and intelligence

### 2.2 Wire TapeMeasurementsScreen
**File**: `mobile/src/screens/TapeMeasurementsScreen.tsx`  
**Status**: ORPHANED - Body measurements  
**Action**: Add to AppNavigator.tsx

**Steps**:
1. Add import to AppNavigator.tsx
2. Add route definition in RootStackParamList
3. Add Stack.Screen component
4. Add navigation from body composition flows

**Expected Impact**: Enables body measurement tracking

---

## PHASE 3: SERVICE CONNECTIONS (Week 2)
**Priority**: HIGH - Connect orphaned screens to real backend services

### 3.1 Connect InjuryPreventionScreen to Backend
**Current**: Mock data  
**Target**: `injuryPreventionEngine` service

**Steps**:
1. Create mobile API client: `mobile/src/services/injuryPrevention.ts`
2. Update InjuryPreventionScreen to use real service
3. Test with backend endpoints

### 3.2 Connect StrengthTrackingScreen to Backend
**Current**: Mock data  
**Target**: `strengthTrackingService` service

**Steps**:
1. Create mobile API client: `mobile/src/services/strengthTracking.ts`
2. Update StrengthTrackingScreen to use real service
3. Test with backend endpoints

### 3.3 Enhance ConnectedDashboardScreen
**Current**: Legacy `healthApi`  
**Target**: `controlTowerDeviceIntelligenceService`

**Steps**:
1. Create mobile API client: `mobile/src/services/controlTowerDeviceIntelligence.ts`
2. Update ConnectedDashboardScreen to use device intelligence service
3. Test device intelligence aggregation

---

## PHASE 4: PHASE 17 AUTONOMOUS ADJUSTMENT UI (Week 2-3)
**Priority**: CRITICAL - Missing Phase 17 surface

### 4.1 Create Autonomous Adjustment Screen
**New File**: `mobile/src/screens/AutonomousAdjustmentsScreen.tsx`

**Features**:
- Display autonomous adjustments made by system
- Show adjustment history and rationale
- User override/feedback mechanism
- Confidence indicators
- Source provenance for adjustments

**Steps**:
1. Design and implement AutonomousAdjustmentsScreen
2. Add to AppNavigator.tsx
3. Add navigation from ControlTowerScreen
4. Connect to backend autonomous adjustment service

---

## PHASE 5: CLEANUP & DEPRECATION (Week 3)
**Priority**: MEDIUM - Remove redundancy

### 5.1 Deprecate Redundant Screens
**Screens to Deprecate**:
1. `HomeDailyBriefScreen.tsx` - Duplicate of ControlTowerScreen
2. `GoalsScreen.tsx` - Superseded by GoalManagementScreen
3. `RecoveryScreen.tsx` - Superseded by RecoveryStatusScreen
4. `BloodworkScreen.tsx` - Superseded by BloodworkResultsScreen
5. `SupplementsScreen.tsx` - Superseded by SupplementUploadScreen
6. `SupplementUploadScreenNew.tsx` - Duplicate
7. `SettingsScreen.tsx` - Duplicate of UserSettingsScreen
8. `TrendsScreen.tsx` - Superseded by AnalyticsDashboardScreen

**Steps**:
1. Add deprecation comments to files
2. Remove from navigation if registered
3. Create migration guide if needed

---

## PHASE 6: VALIDATION & TESTING (Week 3)
**Priority**: HIGH - Ensure all changes work correctly

### 6.1 Navigation Testing
- Test all newly wired screens are reachable
- Test navigation flows work correctly
- Test back navigation works
- Test deep linking if applicable

### 6.2 Service Integration Testing
- Test InjuryPreventionScreen with real backend
- Test StrengthTrackingScreen with real backend
- Test ConnectedDashboardScreen with device intelligence
- Test AutonomousAdjustmentsScreen with backend

### 6.3 User Journey Testing
- Test complete onboarding flow
- Test daily check-in with all interview variants
- Test device connection flows
- Test goal management flow
- Test Control Tower access

---

## DETAILED IMPLEMENTATION STEPS

### Step 1: Update AppNavigator.tsx

```typescript
// Add these imports
import ControlTowerScreen from '../screens/ControlTowerScreen';
import BaselineProfileScreen from '../screens/BaselineProfileScreen';
import GoalManagementScreen from '../screens/GoalManagementScreen';
import HealthDataHubScreen from '../screens/HealthDataHubScreen';
import AppleWatchConnectScreen from '../screens/AppleWatchConnectScreen';
import OuraConnectScreen from '../screens/OuraConnectScreen';
import AgentInterviewScreen from '../screens/AgentInterviewScreen';
import DynamicInterviewScreen from '../screens/DynamicInterviewScreen';
import HybridInterviewScreen from '../screens/HybridInterviewScreen';
import BodyCompositionUploadScreen from '../screens/BodyCompositionUploadScreen';
import InjuryPreventionScreen from '../screens/InjuryPreventionScreen';
import StrengthTrackingScreen from '../screens/StrengthTrackingScreen';
import RecoveryDashboardScreen from '../screens/RecoveryDashboardScreen';
import AnalyticsDashboardScreen from '../screens/AnalyticsDashboardScreen';
import TapeMeasurementsScreen from '../screens/TapeMeasurementsScreen';
import AutonomousAdjustmentsScreen from '../screens/AutonomousAdjustmentsScreen';
```

### Step 2: Update RootStackParamList

```typescript
export type RootStackParamList = {
  // Existing routes...
  ControlTower: undefined;
  BaselineProfile: undefined;
  GoalManagement: undefined;
  HealthDataHub: undefined;
  AppleWatchConnect: undefined;
  OuraConnect: undefined;
  AgentInterview: undefined;
  DynamicInterview: undefined;
  HybridInterview: undefined;
  BodyCompositionUpload: undefined;
  InjuryPrevention: undefined;
  StrengthTracking: undefined;
  RecoveryDashboard: undefined;
  AnalyticsDashboard: undefined;
  TapeMeasurements: undefined;
  AutonomousAdjustments: undefined;
};
```

### Step 3: Add Stack.Screen Components

```typescript
// Add to Stack.Navigator in AppNavigator.tsx
<Stack.Screen
  name="ControlTower"
  component={ControlTowerScreen}
  options={{ title: 'Control Tower' }}
/>
<Stack.Screen
  name="BaselineProfile"
  component={BaselineProfileScreen}
  options={{ title: 'Edit Baseline Profile' }}
/>
// ... continue for all screens
```

### Step 4: Add Navigation Buttons

**In UserSettingsScreen.tsx**:
```typescript
<TouchableOpacity onPress={() => navigation.navigate('BaselineProfile')}>
  <Text>Edit Baseline Profile</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => navigation.navigate('GoalManagement')}>
  <Text>Manage Goals</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => navigation.navigate('HealthDataHub')}>
  <Text>Health Data Hub</Text>
</TouchableOpacity>
```

**In DevicesScreen.tsx**:
```typescript
<TouchableOpacity onPress={() => navigation.navigate('AppleWatchConnect')}>
  <Text>Connect Apple Watch</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => navigation.navigate('OuraConnect')}>
  <Text>Connect Oura Ring</Text>
</TouchableOpacity>
```

---

## RISK MITIGATION

### Low Risk Changes
- Navigation wiring (no backend impact)
- Adding Stack.Screen components
- Adding navigation buttons

### Medium Risk Changes
- Service connections (need backend testing)
- New AutonomousAdjustmentsScreen (needs backend integration)

### High Risk Changes
- None identified (all changes are surgical)

### Rollback Plan
- All changes are additive (no deletions in Phase 1-3)
- Can easily rollback by removing added navigation entries
- Backend connections can be disabled with feature flags

---

## SUCCESS METRICS

### Phase 1 Success
- [ ] ControlTowerScreen accessible from navigation
- [ ] BaselineProfileScreen accessible from settings
- [ ] GoalManagementScreen accessible from navigation
- [ ] HealthDataHubScreen accessible from settings
- [ ] Apple Watch and Oura connection screens accessible
- [ ] All 4 interview variants accessible
- [ ] Body composition upload accessible

### Phase 2 Success
- [ ] All intelligence surfaces accessible
- [ ] Tape measurements accessible

### Phase 3 Success
- [ ] InjuryPreventionScreen uses real backend data
- [ ] StrengthTrackingScreen uses real backend data
- [ ] ConnectedDashboardScreen uses device intelligence service

### Phase 4 Success
- [ ] AutonomousAdjustmentsScreen created and functional
- [ ] Phase 17 capabilities visible to users

### Phase 5 Success
- [ ] Redundant screens marked as deprecated
- [ ] Navigation cleaned up

### Phase 6 Success
- [ ] All user journeys tested and working
- [ ] No navigation errors
- [ ] All service integrations tested

---

## TIMELINE SUMMARY

| Week | Phase | Tasks | Expected Outcome |
|------|-------|-------|------------------|
| 1 | Phase 1 | Wire 7 critical orphaned screens | Core Phase 14-20 functionality accessible |
| 1-2 | Phase 2 | Wire 5 high priority screens | Advanced intelligence surfaces accessible |
| 2 | Phase 3 | Connect 3 screens to backend services | Real data instead of mock data |
| 2-3 | Phase 4 | Create AutonomousAdjustmentsScreen | Phase 17 capabilities visible |
| 3 | Phase 5 | Deprecate 9 redundant screens | Cleaner codebase |
| 3 | Phase 6 | Validation & testing | All changes working correctly |

**Total Estimated Time**: 2-3 weeks  
**Resources Needed**: 1 developer  
**Risk Level**: LOW (mostly navigation wiring)

---

## NEXT STEPS

1. **Review and approve this execution plan**
2. **Start with Phase 1** (critical navigation wiring)
3. **Test each screen** as it's wired to navigation
4. **Proceed to subsequent phases** based on testing results
5. **Monitor for any regressions** in existing functionality

This plan will bring your UI coverage from 65% to ~95% and make all Phase 0-20 capabilities accessible to users.
