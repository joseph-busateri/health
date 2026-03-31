# Voice Interview Mobile Setup Guide

## 📦 **Required Packages**

Install these packages in your mobile app:

```bash
cd mobile

# Voice recording and audio playback
npx expo install expo-av

# Push notifications
npx expo install expo-notifications

# Device detection
npx expo install expo-device

# File system (for audio file handling)
npx expo install expo-file-system
```

---

## 🔧 **App Configuration**

### **1. Update app.json**

Add notification configuration:

```json
{
  "expo": {
    "name": "Health App",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#007AFF",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#007AFF"
    },
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app needs access to your microphone for voice interviews.",
        "NSSpeechRecognitionUsageDescription": "This app needs access to speech recognition for voice interviews."
      }
    },
    "android": {
      "permissions": [
        "RECORD_AUDIO",
        "NOTIFICATIONS"
      ]
    }
  }
}
```

---

## 🚀 **Navigation Setup**

### **Add VoiceInterviewScreen to your navigator**

```typescript
// In your navigation file (e.g., App.tsx or navigation/index.tsx)

import VoiceInterviewScreen from './src/screens/VoiceInterviewScreen';

// Add to your stack navigator
<Stack.Screen 
  name="VoiceInterview" 
  component={VoiceInterviewScreen}
  options={{
    title: 'Daily Check-In',
    headerShown: false, // Screen has its own header
  }}
/>
```

---

## 🔔 **Notification Deep Linking Setup**

### **Add to your App.tsx or root component:**

```typescript
import { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  addNotificationResponseListener,
} from './src/services/notificationService';

function App() {
  const navigationRef = useRef<any>();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync();

    // Listen for notification responses (when user taps notification)
    responseListener.current = addNotificationResponseListener(response => {
      const screen = response.notification.request.content.data.screen;
      const action = response.notification.request.content.data.action;

      if (screen === 'VoiceInterview' && action === 'start') {
        // Navigate to voice interview screen
        navigationRef.current?.navigate('VoiceInterview');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your navigation setup */}
    </NavigationContainer>
  );
}
```

---

## ⚙️ **Schedule Daily Notification**

### **Add to user settings or onboarding:**

```typescript
import { scheduleDailyVoiceInterviewNotification } from './src/services/notificationService';

// In your settings screen or onboarding
const handleScheduleNotification = async () => {
  const userId = 'your-user-id';
  const preferredTime = '08:00'; // 8:00 AM
  
  const success = await scheduleDailyVoiceInterviewNotification(userId, preferredTime);
  
  if (success) {
    Alert.alert('Success', 'Daily check-in reminder scheduled for 8:00 AM');
  } else {
    Alert.alert('Error', 'Failed to schedule notification');
  }
};
```

---

## 🧪 **Testing the Voice Interview**

### **Option 1: Test from Navigation**

Add a button to navigate to voice interview:

```typescript
<TouchableOpacity onPress={() => navigation.navigate('VoiceInterview')}>
  <Text>Start Voice Interview</Text>
</TouchableOpacity>
```

### **Option 2: Test Notification Flow**

Send a test notification:

```typescript
import * as Notifications from 'expo-notifications';

const sendTestNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time for your daily check-in! 🎙️',
      body: 'Tap to start your 5-minute health conversation',
      data: {
        screen: 'VoiceInterview',
        action: 'start',
      },
    },
    trigger: { seconds: 2 }, // Send in 2 seconds
  });
};
```

---

## 🎯 **Environment Variables**

Make sure your `.env` or `app.config.js` has:

```bash
EXPO_PUBLIC_API_URL=http://your-backend-url:3000
```

For local testing:
- iOS Simulator: `http://localhost:3000`
- Android Emulator: `http://10.0.2.2:3000`
- Physical Device: `http://YOUR_COMPUTER_IP:3000`

---

## 📱 **Platform-Specific Notes**

### **iOS:**
- Requires physical device for push notifications
- Microphone permission will be requested on first use
- Test on simulator for basic functionality (no notifications)

### **Android:**
- Works on emulator and physical device
- Notification channel is automatically created
- Microphone permission requested on first use

---

## 🔍 **Troubleshooting**

### **Audio not playing:**
- Check API_BASE_URL is correct
- Verify backend is running
- Check network connectivity

### **Recording not working:**
- Grant microphone permissions
- Check Audio.requestPermissionsAsync() is called
- Verify device has microphone

### **Notifications not appearing:**
- Use physical device (not simulator for iOS)
- Check notification permissions granted
- Verify notification channel created (Android)

### **Deep linking not working:**
- Check navigation ref is set
- Verify screen name matches ('VoiceInterview')
- Check notification data structure

---

## ✅ **Verification Checklist**

Before deploying:

- [ ] Packages installed (`expo-av`, `expo-notifications`, `expo-device`, `expo-file-system`)
- [ ] app.json configured with permissions
- [ ] VoiceInterviewScreen added to navigator
- [ ] Notification deep linking set up in App.tsx
- [ ] Environment variables configured
- [ ] Tested on physical device
- [ ] Microphone permissions working
- [ ] Audio playback working
- [ ] Recording working
- [ ] Notification scheduling working
- [ ] Deep linking from notification working

---

## 🚀 **Next Steps**

1. Install packages: `npx expo install expo-av expo-notifications expo-device expo-file-system`
2. Update app.json with permissions
3. Add VoiceInterviewScreen to navigation
4. Set up notification deep linking
5. Test on physical device
6. Schedule daily notification

**Your voice interview system is ready to go!** 🎉
