import type { StackNavigationProp } from '@react-navigation/stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { BaselineProfile } from './baselineDocument';
import type { WorkoutBaseline } from './workoutDocument';
import type { SupplementBaseline, SupplementItem } from './supplementDocument';

export type RootStackParamList = {
  Dashboard: undefined;
  Details: { id: string };
  DailyCheckIn: undefined;
  MealPhoto: undefined;
  PhysiqueScan: undefined;
  BaselineUpload: undefined;
  BaselineSummary: { profile: BaselineProfile };
  WorkoutUpload: undefined;
  WorkoutSummary: { baseline: WorkoutBaseline };
  WorkoutToday: { userId: string };
  RecoveryStatus: { userId: string };
  StressStatus: { userId: string };
  JointHealthStatus: { userId: string };
  AdherenceStatus: { userId: string };
  NotificationSettings: undefined;
  SupplementUpload: undefined;
  SupplementSummary: { baseline: SupplementBaseline; items: SupplementItem[] };
  SupplementRecommendations: { userId: string };
  PointInTimeState: undefined;
  BloodworkUpload: undefined;
  BloodworkResults: { userId: string };
  BloodworkRecommendations: { userId: string };
  BloodworkTimeline: { userId: string };
  BloodworkTrends: { userId: string };
  DashboardV13: undefined;
  VoiceInterview: undefined;
  SleepNumberConnect: undefined;
  SleepNumberUpload: undefined;
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
