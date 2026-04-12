import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ModernHomeScreen from '../screens/ModernHomeScreen';
import RecoveryStatusScreen from '../screens/RecoveryStatusScreen';
import StressStatusScreen from '../screens/StressStatusScreen';
import JointHealthStatusScreen from '../screens/JointHealthStatusScreen';
import WorkoutUploadScreen from '../screens/WorkoutUploadScreen';
import WorkoutTodayScreen from '../screens/WorkoutTodayScreen';
import BloodworkUploadScreen from '../screens/BloodworkUploadScreen';
import SupplementUploadScreen from '../screens/SupplementUploadScreen';
import BodyCompositionUploadScreen from '../screens/BodyCompositionUploadScreen';
import VoiceInterviewScreen from '../screens/VoiceInterviewScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import type { HomeStackParamList } from '../types/navigation';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="ModernHome" component={ModernHomeScreen} />
    <HomeStack.Screen name="RecoveryStatus" component={RecoveryStatusScreen} />
    <HomeStack.Screen name="StressStatus" component={StressStatusScreen} />
    <HomeStack.Screen name="JointHealthStatus" component={JointHealthStatusScreen} />
    <HomeStack.Screen name="WorkoutUpload" component={WorkoutUploadScreen} />
    <HomeStack.Screen name="WorkoutToday" component={WorkoutTodayScreen} />
    <HomeStack.Screen name="BloodworkUpload" component={BloodworkUploadScreen} />
    <HomeStack.Screen name="BodyCompositionUpload" component={BodyCompositionUploadScreen} />
    <HomeStack.Screen name="SupplementUpload" component={SupplementUploadScreen} />
    <HomeStack.Screen name="VoiceInterview" component={VoiceInterviewScreen} />
    <HomeStack.Screen name="Recommendations" component={RecommendationsScreen} />
  </HomeStack.Navigator>
);

export default HomeStackNavigator;
