import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DevicesScreen from '../screens/DevicesScreen';
import SleepNumberConnectScreenV2 from '../screens/SleepNumberConnectScreenV2';
import OuraConnectScreen from '../screens/OuraConnectScreen';

export type DevicesStackParamList = {
  Devices: undefined;
  SleepNumberConnect: undefined;
  OuraConnect: undefined;
};

const Stack = createNativeStackNavigator<DevicesStackParamList>();

const DevicesStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    <Stack.Screen name="Devices" component={DevicesScreen} options={{ title: 'Integrations' }} />
    <Stack.Screen name="SleepNumberConnect" component={SleepNumberConnectScreenV2} options={{ title: 'Sleep Number' }} />
    <Stack.Screen name="OuraConnect" component={OuraConnectScreen} options={{ title: 'Oura Ring' }} />
  </Stack.Navigator>
);

export default DevicesStackNavigator;
