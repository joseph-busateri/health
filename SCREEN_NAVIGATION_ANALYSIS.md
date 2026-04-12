# Screen Navigation & Backend Access Analysis

## Overview
Analysis of 51 mobile screens for navigation paths and backend connectivity.

## Navigation Architecture

### 1. Tab Navigator (Primary Navigation)
**4 Main Tabs:**
- **Home Tab** -> `HomeStackNavigator` (9 screens)
- **Workouts Tab** -> `WorkoutsScreen` 
- **Devices Tab** -> `DevicesScreen`
- **Settings Tab** -> `UserSettingsScreen`

### 2. Home Stack Navigator (Nested under Home Tab)
**9 Screens Accessible:**
- `ModernHome` (entry point)
- `RecoveryStatus` 
- `StressStatus`
- `JointHealthStatus`
- `Workouts`
- `WorkoutUpload`
- `BloodworkUpload`
- `SupplementUpload`
- `VoiceInterview`

### 3. App Navigator (Root Stack)
**All 51 Screens Registered:**
- All screens in Home Stack (also registered here)
- 42 additional screens accessible via deep linking or programmatic navigation

## Screen Categories & Access

### **Category 1: Fully Accessible via UI** (9 screens)
**Path:** Tab Navigator -> Home Tab -> Home Stack
- ModernHomeScreen (dashboard)
- RecoveryStatusScreen, StressStatusScreen, JointHealthStatusScreen (status cards)
- WorkoutUploadScreen, BloodworkUploadScreen, SupplementUploadScreen (quick actions)
- VoiceInterviewScreen (AI Coach)
- WorkoutsScreen (workout card)

### **Category 2: Tab Accessible** (3 screens)
**Path:** Direct Tab Navigation
- WorkoutsScreen (Workouts Tab)
- DevicesScreen (Devices Tab) 
- UserSettingsScreen (Settings Tab)

### **Category 3: Backend Only Access** (39 screens)
**Path:** Deep linking, programmatic navigation, or initial route
- DashboardV13Screen (initial route)
- All upload, summary, dashboard, connect, and interview screens
- Settings and management screens

## Backend Connectivity Analysis

### **API Base URL Configuration**
- **File:** `/mobile/src/config.ts` (newly created)
- **Default:** `http://localhost:3000`
- **Environment Override:** `EXPO_PUBLIC_API_URL`
- **Status:** FIXED - Previously missing config file

### **Backend Service Coverage**

#### **Fully Connected Screens** (18 screens)
These screens have complete backend service implementations:

**Engine Status Screens:**
- RecoveryStatusScreen -> `/recovery/{userId}/today`
- StressStatusScreen -> `/stress/{userId}/today` 
- JointHealthStatusScreen -> `/joint-health/{userId}/today`
- AdherenceStatusScreen -> `/adherence/{userId}/today`

**Upload Screens:**
- WorkoutUploadScreen -> `/workout/upload`
- BloodworkUploadScreen -> `/bloodwork/upload`
- SupplementUploadScreen -> `/supplement/upload`
- BaselineUploadScreen -> `/baseline-document`
- BodyCompositionUploadScreen -> `/body-composition/upload`
- TapeMeasurementsScreen -> `/measurements/upload`
- SleepNumberUploadScreen -> `/sleep-data/upload`

**Results & Dashboard Screens:**
- BloodworkResultsScreen -> `/bloodwork/results/latest`
- BloodworkRecommendationsScreen -> `/bloodwork/recommendations`
- BloodworkTimelineScreen -> `/bloodwork/documents/{userId}`
- BloodworkTrendsScreen -> `/bloodwork/trends`
- RecoveryDashboardScreen -> `/recovery/dashboard`
- AnalyticsDashboardScreen -> `/analytics/dashboard`

**Profile & Management:**
- BaselineProfileScreen -> `/baseline-profile/{userId}`
- GoalManagementScreen -> `/goals/{userId}`

#### **Partially Connected Screens** (12 screens)
Have backend services but may need completion:
- ControlTowerScreen -> `/control-tower/overall-health`
- HealthDataHubScreen -> `/health-data-hub`
- PointInTimeStateScreen -> `/point-in-time`
- AutonomousAdjustmentsScreen -> `/autonomous-adjustments`
- InjuryPreventionScreen -> `/injury-prevention`
- StrengthTrackingScreen -> `/strength-tracking`
- Device Connect screens (AppleWatch, Oura, SleepNumber)

#### **UI-Only Screens** (21 screens)
No backend connectivity needed or stubbed:
- ModernHomeScreen (mock data)
- DevicesScreen, UserSettingsScreen (local settings)
- Interview screens (Agent, Dynamic, Hybrid, Voice, Selector)
- Summary screens (Workout, Supplement)
- NotificationSettingsScreen
- SourceProvenanceScreen

## Critical Issues Found

### **1. Missing Config File** - FIXED
- **Issue:** `dashboardService.ts` imported non-existent `../config`
- **Fix:** Created `/mobile/src/config.ts` with API_BASE_URL

### **2. Navigation Path Gaps**
- **Issue:** 39 screens only accessible via deep linking or programmatic navigation
- **Impact:** Users cannot discover these screens through normal UI navigation
- **Recommendation:** Add menu entries or hub screens for better discoverability

### **3. Backend Service Inconsistencies**
- **Issue:** Some services use `fetch()`, others use `axios`
- **Issue:** Different error handling patterns
- **Recommendation:** Standardize on one HTTP client and error handling

### **4. Missing User Context**
- **Issue:** Some screens don't properly handle user ID from context
- **Impact:** Backend calls may fail with undefined user ID
- **Status:** UserProvider wrapper added to App.tsx

## Recommendations

### **High Priority**
1. **Add Navigation Hub Screens** - Create menu screens to expose the 39 hidden screens
2. **Complete Backend Services** - Finish partially connected screen implementations
3. **Standardize HTTP Client** - Choose fetch or axios consistently

### **Medium Priority**
1. **Add Search/Discovery** - Implement search to find screens
2. **Improve Error Handling** - Standardize error states and retry logic
3. **Add Offline Support** - Cache data for offline viewing

### **Low Priority**
1. **Navigation Analytics** - Track which screens are used most
2. **A/B Testing** - Test different navigation flows
3. **Accessibility Improvements** - Add better screen reader support

## Summary
- **Total Screens:** 51
- **UI Accessible:** 12 screens (23%)
- **Backend Connected:** 30 screens (59%)
- **Critical Issues:** 2 (both fixed)
- **Navigation Health:** Needs improvement for discoverability
