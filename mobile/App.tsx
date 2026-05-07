import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

import TabNavigator from './src/navigation/TabNavigator';
import { UserProvider } from './src/context/UserContext';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

export default function App() {
  const navigationRef = useRef<any>();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync();

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data.screen;
      const action = response.notification.request.content.data.action;

      if (screen === 'VoiceInterview' && action === 'start') {
        // Navigate to voice interview screen
        navigationRef.current?.navigate('VoiceInterview');
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <UserProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <TabNavigator />
      </NavigationContainer>
    </UserProvider>
  );
}
