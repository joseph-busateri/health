import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DailyCheckInScreen from '../screens/DailyCheckInScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DetailsScreen from '../screens/DetailsScreen';
import MealPhotoScreen from '../screens/MealPhotoScreen';
import PhysiqueScanScreen from '../screens/PhysiqueScanScreen';
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
  </Stack.Navigator>
);

export default AppNavigator;
