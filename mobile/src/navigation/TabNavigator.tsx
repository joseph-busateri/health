import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// import DashboardV13Screen from '../screens/DashboardV13Screen'; // Not used in tabs
import ConnectedDashboardScreen from '../screens/ConnectedDashboardScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import DevicesScreen from '../screens/DevicesScreen';
import UserSettingsScreen from '../screens/UserSettingsScreen';
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
        component={ConnectedDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="WorkoutsTab"
        component={WorkoutsScreen}
        options={{
          tabBarLabel: 'Workouts',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💪</Text>,
        }}
      />
      <Tab.Screen
        name="DevicesTab"
        component={DevicesScreen}
        options={{
          tabBarLabel: 'Devices',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>�</Text>,
        }}
      />
      <Tab.Screen
        name="UserSettingsTab"
        component={UserSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
