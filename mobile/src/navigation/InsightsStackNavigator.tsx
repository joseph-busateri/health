import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InsightsHomeScreen from '../screens/InsightsHomeScreen';
import CardiovascularDashboardScreen from '../screens/CardiovascularDashboardScreen';
import SexualHealthDashboardScreen from '../screens/SexualHealthDashboardScreen';
import ActuarialRiskDashboardScreen from '../screens/ActuarialRiskDashboardScreen';
import VoiceInterviewScreen from '../screens/VoiceInterviewScreen';
import GoalManagementScreen from '../screens/GoalManagementScreen';
import BaselineProfileScreen from '../screens/BaselineProfileScreen';
import HealthDataHubScreen from '../screens/HealthDataHubScreen';
import AppleWatchConnectScreenV2 from '../screens/AppleWatchConnectScreenV2';
import OuraConnectScreenV2 from '../screens/OuraConnectScreenV2';
import ControlTowerScreen from '../screens/ControlTowerScreen';
import CorrelationInsightsScreen from '../screens/CorrelationInsightsScreen';
import AnalyticsDashboardScreen from '../screens/AnalyticsDashboardScreen';
import MetabolicHealthDashboardScreen from '../screens/MetabolicHealthDashboardScreen';
import type { InsightsStackParamList } from '../types/navigation';

const InsightsStack = createNativeStackNavigator<InsightsStackParamList>();

const InsightsStackNavigator: React.FC = () => (
  <InsightsStack.Navigator screenOptions={{ headerShown: false }}>
    <InsightsStack.Screen name="InsightsHome" component={InsightsHomeScreen} />
    <InsightsStack.Screen name="CardiovascularDashboard" component={CardiovascularDashboardScreen} />
    <InsightsStack.Screen name="SexualHealthDashboard" component={SexualHealthDashboardScreen} />
    <InsightsStack.Screen name="ActuarialRiskDashboard" component={ActuarialRiskDashboardScreen} />
    <InsightsStack.Screen name="VoiceInterview" component={VoiceInterviewScreen} />
    <InsightsStack.Screen name="GoalManagement" component={GoalManagementScreen} />
    <InsightsStack.Screen name="BaselineProfile" component={BaselineProfileScreen} />
    <InsightsStack.Screen name="HealthDataHub" component={HealthDataHubScreen} />
    <InsightsStack.Screen name="AppleWatchConnect" component={AppleWatchConnectScreenV2} />
    <InsightsStack.Screen name="OuraConnect" component={OuraConnectScreenV2} />
    <InsightsStack.Screen name="ControlTower" component={ControlTowerScreen} />
    <InsightsStack.Screen name="CorrelationInsights" component={CorrelationInsightsScreen} />
    <InsightsStack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
    <InsightsStack.Screen name="MetabolicHealthDashboard" component={MetabolicHealthDashboardScreen} />
  </InsightsStack.Navigator>
);

export default InsightsStackNavigator;
