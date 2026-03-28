import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DailyCheckInScreen from '../screens/DailyCheckInScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DetailsScreen from '../screens/DetailsScreen';
import MealPhotoScreen from '../screens/MealPhotoScreen';
import PhysiqueScanScreen from '../screens/PhysiqueScanScreen';
import { BaselineUploadScreen } from '../screens/BaselineUploadScreen';
import { BaselineSummaryScreen } from '../screens/BaselineSummaryScreen';
import WorkoutUploadScreen from '../screens/WorkoutUploadScreen';
import WorkoutSummaryScreen from '../screens/WorkoutSummaryScreen';
import SupplementUploadScreen from '../screens/SupplementUploadScreen';
import SupplementSummaryScreen from '../screens/SupplementSummaryScreen';
import PointInTimeStateScreen from '../screens/PointInTimeStateScreen';
import BloodworkUploadScreen from '../screens/BloodworkUploadScreen';
import BloodworkResultsScreen from '../screens/BloodworkResultsScreen';
import BloodworkRecommendationsScreen from '../screens/BloodworkRecommendationsScreen';
import BloodworkTimelineScreen from '../screens/BloodworkTimelineScreen';
import BloodworkTrendsScreen from '../screens/BloodworkTrendsScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Dashboard"
    screenOptions={{
      headerTitleAlign: 'center',
    }}
  >
    <Stack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ title: 'Health Dashboard' }}
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
  </Stack.Navigator>
);

export default AppNavigator;
