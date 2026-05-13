import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ModernHomeScreen from '../screens/ModernHomeScreen';
import ModernHomeScreenV2 from '../screens/ModernHomeScreenV2';
import RecoveryStatusScreen from '../screens/RecoveryStatusScreen';
import StressStatusScreen from '../screens/StressStatusScreen';
import JointHealthStatusScreen from '../screens/JointHealthStatusScreen';
import WorkoutUploadScreen from '../screens/WorkoutUploadScreen';
import WorkoutTodayScreen from '../screens/WorkoutTodayScreen';
import BloodworkUploadScreen from '../screens/BloodworkUploadScreen';
import SupplementUploadScreen from '../screens/SupplementUploadScreen';
import BodyCompositionUploadScreenV2 from '../screens/BodyCompositionUploadScreenV2';
import VoiceInterviewScreen from '../screens/VoiceInterviewScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import SupplementRecommendationsScreen from '../screens/SupplementRecommendationsScreen';
import DailyLogsScreen from '../screens/DailyLogsScreen';
import CardiovascularDashboardScreen from '../screens/CardiovascularDashboardScreen';
import CardiovascularDashboardScreenV2 from '../screens/CardiovascularDashboardScreenV2';
import MetabolicHealthDashboardScreen from '../screens/MetabolicHealthDashboardScreen';
import SexualHealthDashboardScreen from '../screens/SexualHealthDashboardScreen';
import SexualHealthDashboardScreenV2 from '../screens/SexualHealthDashboardScreenV2';
import SexualHealthDashboardScreenV3 from '../screens/SexualHealthDashboardScreenV3';
import ActuarialRiskDashboardScreen from '../screens/ActuarialRiskDashboardScreen';
import ActuarialRiskScreen from '../screens/ActuarialRiskScreen';
import MealLogScreen from '../screens/MealLogScreen';
import NutritionDashboardScreen from '../screens/NutritionDashboardScreen';
import NutritionExtractionScreen from '../screens/NutritionExtractionScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import AIChatScreen from '../screens/AIChatScreen';
import AnalyticsDashboardScreen from '../screens/AnalyticsDashboardScreen';
import PerformanceDashboardScreen from '../screens/PerformanceDashboardScreen';
import type { HomeStackParamList } from '../types/navigation';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="ModernHome" component={ModernHomeScreenV2} />
    <HomeStack.Screen name="RecoveryStatus" component={RecoveryStatusScreen} />
    <HomeStack.Screen name="StressStatus" component={StressStatusScreen} />
    <HomeStack.Screen name="JointHealthStatus" component={JointHealthStatusScreen} />
    <HomeStack.Screen name="WorkoutUpload" component={WorkoutUploadScreen} />
    <HomeStack.Screen name="WorkoutToday" component={WorkoutTodayScreen} />
    <HomeStack.Screen name="BloodworkUpload" component={BloodworkUploadScreen} />
    <HomeStack.Screen name="BodyCompositionUpload" component={BodyCompositionUploadScreenV2} />
    <HomeStack.Screen name="SupplementUpload" component={SupplementUploadScreen} />
    <HomeStack.Screen name="SupplementRecommendations" component={SupplementRecommendationsScreen} />
    <HomeStack.Screen name="VoiceInterview" component={VoiceInterviewScreen} />
    <HomeStack.Screen name="Recommendations" component={RecommendationsScreen} />
    <HomeStack.Screen name="DailyLogs" component={DailyLogsScreen} />
    <HomeStack.Screen name="CardiovascularDashboard" component={CardiovascularDashboardScreen} />
    <HomeStack.Screen name="CardiovascularDashboardV2" component={CardiovascularDashboardScreenV2} />
    <HomeStack.Screen name="MetabolicHealthDashboard" component={MetabolicHealthDashboardScreen} />
    <HomeStack.Screen name="SexualHealthDashboard" component={SexualHealthDashboardScreen} />
    <HomeStack.Screen name="SexualHealthDashboardV2" component={SexualHealthDashboardScreenV2} />
    <HomeStack.Screen name="SexualHealthDashboardV3" component={SexualHealthDashboardScreenV3} />
    <HomeStack.Screen name="ActuarialRiskDashboard" component={ActuarialRiskDashboardScreen} />
    <HomeStack.Screen name="ActuarialRisk" component={ActuarialRiskScreen} />
    <HomeStack.Screen name="NutritionDashboard" component={NutritionDashboardScreen} />
    <HomeStack.Screen name="MealLog" component={MealLogScreen} />
    <HomeStack.Screen name="NutritionExtraction" component={NutritionExtractionScreen} />
    <HomeStack.Screen name="AIAssistant" component={AIAssistantScreen} />
    <HomeStack.Screen name="AIChat" component={AIChatScreen} />
    <HomeStack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
    <HomeStack.Screen name="PerformanceDashboard" component={PerformanceDashboardScreen} />
  </HomeStack.Navigator>
);

export default HomeStackNavigator;
