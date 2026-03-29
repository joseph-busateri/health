import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import { setupNotificationResponseListener, updateNotificationStatus } from '../services/notificationManager';

export const useNotificationDeepLinking = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const subscription = setupNotificationResponseListener((data) => {
      const screen = data.screen as keyof RootStackParamList;
      const notificationId = data.notificationId as string | undefined;

      if (screen === 'Agent') {
        navigation.navigate('Agent');
        
        if (notificationId) {
          updateNotificationStatus(notificationId, 'opened').catch(err => {
            console.error('Failed to update notification status:', err);
          });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);
};
