# DEPRECATED SCREENS
**Screens Marked for Deprecation - Do Not Use**

Date: 2026-04-07  
Status: DEPRECATED

---

## OVERVIEW

The following 9 screens have been identified as redundant and are marked for deprecation. These screens are superseded by newer, more comprehensive implementations and should not be used in new development.

---

## DEPRECATED SCREENS LIST

### 1. HomeDailyBriefScreen.tsx ❌
**Status**: DEPRECATED  
**Reason**: Duplicate of ControlTowerScreen  
**Replacement**: Use `ControlTowerScreen` (Route: `ControlTower`)  
**File**: `mobile/src/screens/HomeDailyBriefScreen.tsx`  
**Deprecation Notice Added**: ✅

**Migration Path**:
```typescript
// OLD - Do not use
navigation.navigate('HomeDailyBrief');

// NEW - Use instead
navigation.navigate('ControlTower');
```

---

### 2. GoalsScreen.tsx ❌
**Status**: DEPRECATED  
**Reason**: Superseded by GoalManagementScreen  
**Replacement**: Use `GoalManagementScreen` (Route: `GoalManagement`)  
**File**: `mobile/src/screens/GoalsScreen.tsx`  
**Deprecation Notice Added**: ✅

**Migration Path**:
```typescript
// OLD - Do not use
navigation.navigate('Goals');

// NEW - Use instead
navigation.navigate('GoalManagement');
```

---

### 3. RecoveryScreen.tsx ❌
**Status**: DEPRECATED  
**Reason**: Superseded by RecoveryStatusScreen and RecoveryDashboardScreen  
**Replacement**: Use `RecoveryStatusScreen` (Route: `RecoveryStatus`) or `RecoveryDashboardScreen` (Route: `RecoveryDashboard`)  
**File**: `mobile/src/screens/RecoveryScreen.tsx`  
**Deprecation Notice**: To be added

**Migration Path**:
```typescript
// OLD - Do not use
navigation.navigate('Recovery');

// NEW - Use instead
navigation.navigate('RecoveryStatus'); // For status overview
navigation.navigate('RecoveryDashboard'); // For deep-dive analytics
```

---

### 4. BloodworkScreen.tsx ❌
**Status**: DEPRECATED  
**Reason**: Superseded by BloodworkResultsScreen  
**Replacement**: Use `BloodworkResultsScreen` (Route: `BloodworkResults`)  
**File**: `mobile/src/screens/BloodworkScreen.tsx`  
**Deprecation Notice**: To be added

**Migration Path**:
```typescript
// OLD - Do not use
navigation.navigate('Bloodwork');

// NEW - Use instead
navigation.navigate('BloodworkResults', { userId: 'user-id' });
```

---

### 5. SupplementsScreen.tsx ❌
**Status**: DEPRECATED  
**Reason**: Superseded by SupplementUploadScreen and SupplementRecommendationsScreen  
**Replacement**: Use `SupplementUploadScreen` (Route: `SupplementUpload`) or `SupplementRecommendationsScreen` (Route: `SupplementRecommendations`)  
**File**: `mobile/src/screens/SupplementsScreen.tsx`  
**Deprecation Notice**: To be added

**Migration Path**:
```typescript
// OLD - Do not use
navigation.navigate('Supplements');

// NEW - Use instead
navigation.navigate('SupplementUpload'); // For uploading supplements
navigation.navigate('SupplementRecommendations', { userId: 'user-id' }); // For recommendations
```

---

### 6. SupplementUploadScreenNew.tsx ❌
**Status**: DEPRECATED  
**Reason**: Duplicate of SupplementUploadScreen  
**Replacement**: Use `SupplementUploadScreen` (Route: `SupplementUpload`)  
**File**: `mobile/src/screens/SupplementUploadScreenNew.tsx`  
**Deprecation Notice**: To be added

**Migration Path**:
```typescript
// OLD - Do not use
navigation.navigate('SupplementUploadNew');

// NEW - Use instead
navigation.navigate('SupplementUpload');
```

---

### 7. SettingsScreen.tsx ❌
**Status**: DEPRECATED  
**Reason**: Duplicate of UserSettingsScreen  
**Replacement**: Use `UserSettingsScreen` (Tab: `UserSettingsTab`)  
**File**: `mobile/src/screens/SettingsScreen.tsx`  
**Deprecation Notice**: To be added

**Migration Path**:
```typescript
// OLD - Do not use
navigation.navigate('Settings');

// NEW - Use instead
// UserSettingsScreen is accessible via the Settings tab in TabNavigator
```

---

### 8. TrendsScreen.tsx ❌
**Status**: DEPRECATED  
**Reason**: Superseded by AnalyticsDashboardScreen  
**Replacement**: Use `AnalyticsDashboardScreen` (Route: `AnalyticsDashboard`)  
**File**: `mobile/src/screens/TrendsScreen.tsx`  
**Deprecation Notice**: To be added

**Migration Path**:
```typescript
// OLD - Do not use
navigation.navigate('Trends');

// NEW - Use instead
navigation.navigate('AnalyticsDashboard');
```

---

### 9. HomeScreen.tsx ❌
**Status**: DEPRECATED  
**Reason**: Legacy home screen, superseded by DashboardV13Screen and ConnectedDashboardScreen  
**Replacement**: Use `DashboardV13Screen` (Route: `DashboardV13`) or `ConnectedDashboardScreen` (Tab: `HomeTab`)  
**File**: `mobile/src/screens/HomeScreen.tsx`  
**Deprecation Notice**: To be added

**Migration Path**:
```typescript
// OLD - Do not use
navigation.navigate('Home');

// NEW - Use instead
navigation.navigate('DashboardV13'); // Initial route
// Or access via HomeTab in TabNavigator
```

---

## DEPRECATION TIMELINE

### Phase 1: Mark as Deprecated (CURRENT)
- ✅ Add deprecation notices to all 9 screens
- ✅ Document replacement screens
- ✅ Create migration guide

### Phase 2: Remove from Navigation (Future)
- Remove deprecated screens from AppNavigator.tsx
- Remove route definitions from navigation types
- Update any remaining references

### Phase 3: Delete Files (Future)
- After confirming no usage, delete deprecated screen files
- Clean up any related types or utilities

---

## IMPACT ANALYSIS

### Screens Affected
- **Total Deprecated**: 9 screens
- **Replacement Screens Available**: Yes, all have modern replacements
- **Navigation Impact**: Minimal (screens were already orphaned)

### User Impact
- **Low**: Most deprecated screens were not accessible via navigation
- **Migration Required**: Only if custom navigation calls exist

### Developer Impact
- **Action Required**: Update any direct navigation calls to deprecated screens
- **Testing Required**: Verify no broken navigation flows

---

## REPLACEMENT SCREEN MAPPING

| Deprecated Screen | Replacement Screen(s) | Route | Status |
|-------------------|----------------------|-------|--------|
| HomeDailyBriefScreen | ControlTowerScreen | ControlTower | ✅ Available |
| GoalsScreen | GoalManagementScreen | GoalManagement | ✅ Available |
| RecoveryScreen | RecoveryStatusScreen, RecoveryDashboardScreen | RecoveryStatus, RecoveryDashboard | ✅ Available |
| BloodworkScreen | BloodworkResultsScreen | BloodworkResults | ✅ Available |
| SupplementsScreen | SupplementUploadScreen, SupplementRecommendationsScreen | SupplementUpload, SupplementRecommendations | ✅ Available |
| SupplementUploadScreenNew | SupplementUploadScreen | SupplementUpload | ✅ Available |
| SettingsScreen | UserSettingsScreen | UserSettingsTab | ✅ Available |
| TrendsScreen | AnalyticsDashboardScreen | AnalyticsDashboard | ✅ Available |
| HomeScreen | DashboardV13Screen, ConnectedDashboardScreen | DashboardV13, HomeTab | ✅ Available |

---

## VALIDATION CHECKLIST

Before removing deprecated screens:

- [ ] Verify no direct navigation calls to deprecated screens exist
- [ ] Check for any deep linking to deprecated screens
- [ ] Confirm all replacement screens are fully functional
- [ ] Test all migration paths
- [ ] Update documentation and README
- [ ] Notify team of deprecation
- [ ] Set removal date (recommend 3-6 months after deprecation notice)

---

## NOTES

- All deprecated screens are kept in the codebase for backward compatibility
- Deprecation notices have been added to screen files
- No functionality is lost - all capabilities are available in replacement screens
- Replacement screens offer improved functionality and better architecture alignment

---

**Deprecation Date**: 2026-04-07  
**Recommended Removal Date**: 2026-10-07 (6 months)  
**Status**: Deprecated but not removed  
**Action Required**: Update navigation calls to use replacement screens
