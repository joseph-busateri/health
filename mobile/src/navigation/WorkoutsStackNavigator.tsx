import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WorkoutTodayScreen from '../screens/WorkoutTodayScreen';
import ProgressionHistoryScreen from '../screens/ProgressionHistoryScreen';
import OverloadRecommendationsScreen from '../screens/OverloadRecommendationsScreen';
import type { RootStackParamList } from '../types/navigation';
import { DEFAULT_USER_ID } from '../context/UserContext';

const WorkoutsStack = createNativeStackNavigator<RootStackParamList>();

const WorkoutsStackNavigator: React.FC = () => (
  <WorkoutsStack.Navigator screenOptions={{ headerShown: false }}>
    <WorkoutsStack.Screen
      name="WorkoutToday"
      component={WorkoutTodayScreen}
      initialParams={{ userId: DEFAULT_USER_ID }}
    />
    <WorkoutsStack.Screen
      name="ProgressionHistory"
      component={ProgressionHistoryScreen}
    />
    <WorkoutsStack.Screen
      name="OverloadRecommendations"
      component={OverloadRecommendationsScreen}
    />
  </WorkoutsStack.Navigator>
);

export default WorkoutsStackNavigator;
