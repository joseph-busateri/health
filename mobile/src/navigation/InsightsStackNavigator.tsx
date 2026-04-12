import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InsightsHomeScreen from '../screens/InsightsHomeScreen';
import CardiovascularDashboardScreen from '../screens/CardiovascularDashboardScreen';
import SexualHealthDashboardScreen from '../screens/SexualHealthDashboardScreen';
import VoiceInterviewScreen from '../screens/VoiceInterviewScreen';
import type { InsightsStackParamList } from '../types/navigation';

const InsightsStack = createNativeStackNavigator<InsightsStackParamList>();

const InsightsStackNavigator: React.FC = () => (
  <InsightsStack.Navigator screenOptions={{ headerShown: false }}>
    <InsightsStack.Screen name="InsightsHome" component={InsightsHomeScreen} />
    <InsightsStack.Screen name="CardiovascularDashboard" component={CardiovascularDashboardScreen} />
    <InsightsStack.Screen name="SexualHealthDashboard" component={SexualHealthDashboardScreen} />
    <InsightsStack.Screen name="VoiceInterview" component={VoiceInterviewScreen} />
  </InsightsStack.Navigator>
);

export default InsightsStackNavigator;
