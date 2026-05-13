import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeStackNavigator from './HomeStackNavigator';
import InsightsStackNavigator from './InsightsStackNavigator';
import WorkoutsStackNavigator from './WorkoutsStackNavigator';
import DevicesStackNavigator from './DevicesStackNavigator';
import UserSettingsScreen from '../screens/UserSettingsScreen';
import GoalManagementScreen from '../screens/GoalManagementScreen';

// import HealthDataHubScreen from '../screens/HealthDataHubScreen'; // Not used in tabs
// import TrendsScreen from '../screens/TrendsScreen'; // DEPRECATED - use AnalyticsDashboardScreen
// import AgentInterviewScreen from '../screens/AgentInterviewScreen'; // Not used in tabs
// import SettingsScreen from '../screens/SettingsScreen'; // DEPRECATED - use UserSettingsScreen

const Tab = createBottomTabNavigator();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="InsightsTab"
        component={InsightsStackNavigator}
        options={{
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkoutsTab"
        component={WorkoutsStackNavigator}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="GoalsTab"
        component={GoalManagementScreen}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="IntegrationsTab"
        component={DevicesStackNavigator}
        options={{
          tabBarLabel: 'Integrations',
          tabBarIcon: ({ color, size }) => <Ionicons name="watch" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="UserSettingsTab"
        component={UserSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
