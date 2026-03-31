import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useNotificationDeepLinking } from '../hooks/useNotificationDeepLinking';
import DailyCheckInScreen from '../screens/DailyCheckInScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DashboardV13Screen from '../screens/DashboardV13Screen';
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
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
      component={DashboardV13Screen}
      options={{ title: 'Health Dashboard V13' }}
    />
    <Stack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ title: 'Health Dashboard (Legacy)' }}
    />
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
  </Stack.Navigator>
  );
};

export default AppNavigator;
