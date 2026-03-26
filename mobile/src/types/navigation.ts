import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Dashboard: undefined;
  Details: { id: string };
  DailyCheckIn: undefined;
  MealPhoto: undefined;
  PhysiqueScan: undefined;
  // Future routes: set to undefined for now to keep extension lightweight.
  Reminders?: undefined;
  Nutrition?: undefined;
  Physique?: undefined;
  Settings?: undefined;
};

export type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
export type DetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Details'>;
export type DailyCheckInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DailyCheckIn'>;
export type MealPhotoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MealPhoto'>;
export type PhysiqueScanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhysiqueScan'>;

export type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;
