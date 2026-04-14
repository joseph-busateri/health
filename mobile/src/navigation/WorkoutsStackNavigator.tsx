import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WorkoutTodayScreen from '../screens/WorkoutTodayScreen';
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
  </WorkoutsStack.Navigator>
);

export default WorkoutsStackNavigator;
