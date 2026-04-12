import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';

import { useNotificationDeepLinking } from '../hooks/useNotificationDeepLinking';
import DailyCheckInScreen from '../screens/DailyCheckInScreen';
// import DashboardScreen from '../screens/DashboardScreen'; // DEPRECATED - use ModernHomeScreen
import DetailsScreen from '../screens/DetailsScreen';
import MealPhotoScreen from '../screens/MealPhotoScreen';
import PhysiqueScanScreen from '../screens/PhysiqueScanScreen';
import { BaselineUploadScreen } from '../screens/BaselineUploadScreen';
import { BaselineSummaryScreen } from '../screens/BaselineSummaryScreen';
import WorkoutUploadScreen from '../screens/WorkoutUploadScreen';
import WorkoutSummaryScreen from '../screens/WorkoutSummaryScreen';
import WorkoutTodayScreen from '../screens/WorkoutTodayScreen';
import RecoveryStatusScreen from '../screens/RecoveryStatusScreen';
import StressStatusScreen from '../screens/StressStatusScreen';
import JointHealthStatusScreen from '../screens/JointHealthStatusScreen';
import AdherenceStatusScreen from '../screens/AdherenceStatusScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import SupplementUploadScreen from '../screens/SupplementUploadScreen';
import SupplementSummaryScreen from '../screens/SupplementSummaryScreen';
import SupplementRecommendationsScreen from '../screens/SupplementRecommendationsScreen';
import PointInTimeStateScreen from '../screens/PointInTimeStateScreen';
import BloodworkUploadScreen from '../screens/BloodworkUploadScreen';
import BloodworkResultsScreen from '../screens/BloodworkResultsScreen';
import BloodworkRecommendationsScreen from '../screens/BloodworkRecommendationsScreen';
import BloodworkTimelineScreen from '../screens/BloodworkTimelineScreen';
import BloodworkTrendsScreen from '../screens/BloodworkTrendsScreen';
import VoiceInterviewScreen from '../screens/VoiceInterviewScreen';
import SleepNumberConnectScreen from '../screens/SleepNumberConnectScreen';
import SleepNumberUploadScreen from '../screens/SleepNumberUploadScreen';
import ControlTowerScreen from '../screens/ControlTowerScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
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
import InterviewSelectorScreen from '../screens/InterviewSelectorScreen';
import SourceProvenanceScreen from '../screens/SourceProvenanceScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const QuarantinedDashboardScreen: React.FC = () => (
  <View style={styles.quarantineContainer}>
    <Text style={styles.quarantineHeading}>Legacy dashboard archived</Text>
    <Text style={styles.quarantineBody}>
      The control tower dashboard (DashboardV13) has been quarantined. Please navigate via the Home tab
      to explore the modern, human-centered experience.
    </Text>
  </View>
);

const AppNavigator: React.FC = () => {
  useNotificationDeepLinking();

  return (
  <Stack.Navigator
    initialRouteName="DashboardV13"
    screenOptions={{
      headerTitleAlign: 'center',
    }}
  >
    <Stack.Screen
      name="DashboardV13"
      component={QuarantinedDashboardScreen}
      options={{ title: 'Legacy Dashboard (Quarantined)' }}
    />
    {/* DEPRECATED: Legacy Dashboard - use DashboardV13 instead */}
    {/* <Stack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ title: 'Health Dashboard (Legacy)' }}
    /> */}
    <Stack.Screen
      name="Details"
      component={DetailsScreen}
      options={{ title: 'Details' }}
    />
    <Stack.Screen
      name="DailyCheckIn"
      component={DailyCheckInScreen}
      options={{ title: 'Daily Check-In' }}
    />
    <Stack.Screen
      name="MealPhoto"
      component={MealPhotoScreen}
      options={{ title: 'Meal Photo' }}
    />
    <Stack.Screen
      name="PhysiqueScan"
      component={PhysiqueScanScreen}
      options={{ title: 'Physique Scan' }}
    />
    <Stack.Screen
      name="BaselineUpload"
      component={BaselineUploadScreen}
      options={{ title: 'Upload Baseline' }}
    />
    <Stack.Screen
      name="BaselineSummary"
      component={BaselineSummaryScreen}
      options={{ title: 'Baseline Summary' }}
    />
    <Stack.Screen
      name="WorkoutUpload"
      component={WorkoutUploadScreen}
      options={{ title: 'Upload Workout' }}
    />
    <Stack.Screen
      name="WorkoutSummary"
      component={WorkoutSummaryScreen}
      options={{ title: 'Workout Summary' }}
    />
    <Stack.Screen
      name="WorkoutToday"
      component={WorkoutTodayScreen}
      options={{ title: 'Workout Today' }}
    />
    <Stack.Screen
      name="RecoveryStatus"
      component={RecoveryStatusScreen}
      options={{ title: 'Recovery Status' }}
    />
    <Stack.Screen
      name="StressStatus"
      component={StressStatusScreen}
      options={{ title: 'Stress / CNS Status' }}
    />
    <Stack.Screen
      name="JointHealthStatus"
      component={JointHealthStatusScreen}
      options={{ title: 'Joint / Injury Status' }}
    />
    <Stack.Screen
      name="AdherenceStatus"
      component={AdherenceStatusScreen}
      options={{ title: 'Adherence Status' }}
    />
    <Stack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
      options={{ title: 'Notification Settings' }}
    />
    <Stack.Screen
      name="SupplementUpload"
      component={SupplementUploadScreen}
      options={{ title: 'Upload Supplement Stack' }}
    />
    <Stack.Screen
      name="SupplementSummary"
      component={SupplementSummaryScreen}
      options={{ title: 'Supplement Summary' }}
    />
    <Stack.Screen
      name="SupplementRecommendations"
      component={SupplementRecommendationsScreen}
      options={{ title: 'Supplement Recommendations' }}
    />
    <Stack.Screen
      name="PointInTimeState"
      component={PointInTimeStateScreen}
      options={{ title: 'Point-in-Time State' }}
    />
    <Stack.Screen
      name="BloodworkUpload"
      component={BloodworkUploadScreen}
      options={{ title: 'Upload Bloodwork' }}
    />
    <Stack.Screen
      name="BloodworkResults"
      component={BloodworkResultsScreen}
      options={{ title: 'Bloodwork Results' }}
    />
    <Stack.Screen
      name="BloodworkRecommendations"
      component={BloodworkRecommendationsScreen}
      options={{ title: 'Recommendations' }}
    />
    <Stack.Screen
      name="BloodworkTimeline"
      component={BloodworkTimelineScreen}
      options={{ title: 'Bloodwork Timeline' }}
    />
    <Stack.Screen
      name="BloodworkTrends"
      component={BloodworkTrendsScreen}
      options={{ title: 'Bloodwork Trends' }}
    />
    <Stack.Screen
      name="VoiceInterview"
      component={VoiceInterviewScreen}
      options={{ 
        title: 'Daily Check-In',
        headerShown: false
      }}
    />
    <Stack.Screen
      name="SleepNumberConnect"
      component={SleepNumberConnectScreen}
      options={{ title: 'Sleep Number i10' }}
    />
    <Stack.Screen
      name="SleepNumberUpload"
      component={SleepNumberUploadScreen}
      options={{ title: 'Upload Sleep Data' }}
    />
    <Stack.Screen
      name="ControlTower"
      component={ControlTowerScreen}
      options={{ title: 'Control Tower' }}
    />
    <Stack.Screen
      name="Recommendations"
      component={RecommendationsScreen}
      options={{ title: 'Recommendations' }}
    />
    <Stack.Screen
      name="BaselineProfile"
      component={BaselineProfileScreen}
      options={{ title: 'Edit Baseline Profile' }}
    />
    <Stack.Screen
      name="GoalManagement"
      component={GoalManagementScreen}
      options={{ title: 'Goal Management' }}
    />
    <Stack.Screen
      name="HealthDataHub"
      component={HealthDataHubScreen}
      options={{ title: 'Health Data Hub' }}
    />
    <Stack.Screen
      name="AppleWatchConnect"
      component={AppleWatchConnectScreen}
      options={{ title: 'Connect Apple Watch' }}
    />
    <Stack.Screen
      name="OuraConnect"
      component={OuraConnectScreen}
      options={{ title: 'Connect Oura Ring' }}
    />
    <Stack.Screen
      name="AgentInterview"
      component={AgentInterviewScreen}
      options={{ title: 'Agent Interview' }}
    />
    <Stack.Screen
      name="DynamicInterview"
      component={DynamicInterviewScreen}
      options={{ title: 'Dynamic Interview' }}
    />
    <Stack.Screen
      name="HybridInterview"
      component={HybridInterviewScreen}
      options={{ title: 'Hybrid Interview' }}
    />
    <Stack.Screen
      name="BodyCompositionUpload"
      component={BodyCompositionUploadScreen}
      options={{ title: 'Upload Body Composition' }}
    />
    <Stack.Screen
      name="InjuryPrevention"
      component={InjuryPreventionScreen}
      options={{ title: 'Injury Prevention' }}
    />
    <Stack.Screen
      name="StrengthTracking"
      component={StrengthTrackingScreen}
      options={{ title: 'Strength Tracking' }}
    />
    <Stack.Screen
      name="RecoveryDashboard"
      component={RecoveryDashboardScreen}
      options={{ title: 'Recovery Dashboard' }}
    />
    <Stack.Screen
      name="AnalyticsDashboard"
      component={AnalyticsDashboardScreen}
      options={{ title: 'Analytics Dashboard' }}
    />
    <Stack.Screen
      name="TapeMeasurements"
      component={TapeMeasurementsScreen}
      options={{ title: 'Body Measurements' }}
    />
    <Stack.Screen
      name="AutonomousAdjustments"
      component={AutonomousAdjustmentsScreen}
      options={{ title: 'Autonomous Adjustments' }}
    />
    <Stack.Screen
      name="InterviewSelector"
      component={InterviewSelectorScreen}
      options={{ title: 'Choose Interview Mode' }}
    />
    <Stack.Screen
      name="SourceProvenance"
      component={SourceProvenanceScreen}
      options={{ title: 'Source Provenance' }}
    />
  </Stack.Navigator>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  quarantineContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  quarantineHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  quarantineBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'center',
  },
});
