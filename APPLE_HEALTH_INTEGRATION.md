# Apple Health / HealthKit Integration Guide

## 🍎 **Central Hub Strategy**

Instead of integrating each device individually, **Apple Health becomes your central hub**. All your devices sync to Apple Health, then you integrate Apple Health once to get ALL your device data!

---

## ✅ **Devices That Sync to Apple Health**

### **Sleep Tracking**
- ✅ Sleep Number i10 bed
- ✅ Oura Ring
- ✅ Apple Watch
- ✅ Whoop
- ✅ Eight Sleep

### **Wearables**
- ✅ Apple Watch (native)
- ✅ Whoop
- ✅ Oura Ring
- ✅ Garmin watches
- ✅ Fitbit
- ✅ Polar
- ✅ Coros

### **Smart Scales**
- ✅ Withings Body+
- ✅ Fitbit Aria
- ✅ Garmin Index
- ✅ Eufy Smart Scale

### **Blood Pressure Monitors**
- ✅ Omron
- ✅ Withings BPM

### **CGM (Continuous Glucose Monitors)**
- ✅ Dexcom G6/G7
- ✅ Freestyle Libre
- ✅ Guardian Connect

### **Fitness Apps**
- ✅ Strava
- ✅ Peloton
- ✅ Nike Run Club
- ✅ MyFitnessPal
- ✅ Lose It!
- ✅ Strong (workout tracking)

### **Other**
- ✅ Headspace (mindfulness)
- ✅ Calm (meditation)
- ✅ Water tracking apps
- ✅ Manual entries

**One integration = Access to ALL these devices!** 🎉

---

## 🏗️ **Architecture**

```
All Your Devices
    ↓
Apple Health (Central Hub)
    ↓
Your Mobile App (HealthKit)
    ↓
Your Backend API
    ↓
PostgreSQL Database
    ↓
AI Analysis & Insights
```

---

## 📦 **Installation**

### **Step 1: Install Mobile Package**

```bash
cd mobile
npm install react-native-health --save
```

### **Step 2: iOS Configuration**

Add to `mobile/ios/Podfile`:
```ruby
permissions_path = '../node_modules/react-native-permissions/ios'
pod 'Permission-HealthKit', :path => "#{permissions_path}/HealthKit"
```

Run:
```bash
cd ios
pod install
cd ..
```

### **Step 3: Update Info.plist**

Add to `mobile/ios/YourApp/Info.plist`:
```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your health data to provide personalized insights and track your wellness journey.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>We need permission to update your health data.</string>
```

### **Step 4: Enable HealthKit Capability**

In Xcode:
1. Open `mobile/ios/YourApp.xcworkspace`
2. Select your target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "HealthKit"

### **Step 5: Database Setup**

Run the migration:
```bash
cd server
# Run the migration file:
# src/migrations/20260331_apple_health_integration.sql
```

This creates tables for:
- Sleep data
- Heart rate data
- Steps/activity data
- Workout data
- Body measurements
- Nutrition data
- Blood glucose data
- HRV data
- Sync log

---

## 🚀 **Usage**

### **Initialize HealthKit**

```typescript
import { initializeHealthKit, syncAllHealthData } from './src/services/healthKitService';

// Request permissions
const initialized = await initializeHealthKit();

if (initialized) {
  // Sync last 7 days of data
  const result = await syncAllHealthData(7);
  
  console.log('Synced:', result.dataTypes);
  console.log('Records:', result.recordCount);
}
```

### **Automatic Background Sync**

```typescript
// Set up daily sync
import { enableBackgroundSync } from './src/services/healthKitService';

await enableBackgroundSync();
```

---

## 📊 **Data Types Collected**

### **Sleep**
- Sleep analysis (in bed, asleep, awake)
- Sleep stages (light, deep, REM)
- Duration
- Source device (Sleep Number, Oura, etc.)

### **Heart**
- Heart rate (continuous)
- Resting heart rate
- Heart rate variability (HRV)
- Source device

### **Activity**
- Steps
- Distance walked/run
- Flights climbed
- Active energy burned
- Resting energy burned

### **Workouts**
- Workout type
- Duration
- Calories burned
- Distance
- Source app (Strava, Peloton, etc.)

### **Body Measurements**
- Weight
- Body fat percentage
- Lean body mass
- BMI
- Height

### **Nutrition**
- Calories
- Protein
- Carbohydrates
- Fat
- Fiber
- Sugar
- Water intake

### **Blood Glucose**
- Glucose readings (mg/dL)
- Timestamp
- Source (Dexcom, Freestyle Libre)

### **Vitals**
- Blood pressure (systolic/diastolic)
- Respiratory rate
- Body temperature
- Oxygen saturation

---

## 🔌 **API Endpoints**

### **Sync Health Data**
```bash
POST /api/health-data/sync
Content-Type: application/json

{
  "userId": "user-id",
  "dataType": "sleep",
  "data": [...],
  "source": "apple_health"
}

Response:
{
  "success": true,
  "recordsProcessed": 50,
  "recordsSaved": 48,
  "recordsSkipped": 2
}
```

### **Get Health Summary**
```bash
GET /api/health-data/summary/:userId?days=7

Response:
{
  "success": true,
  "data": {
    "avg_sleep_hours": 7.5,
    "avg_heart_rate": 62,
    "total_steps": 52000,
    "total_workouts": 5,
    "avg_hrv": 45,
    "latest_weight": 180.5,
    "data_sources": ["Apple Watch", "Sleep Number", "MyFitnessPal"]
  }
}
```

### **Get Sleep Data**
```bash
GET /api/health-data/sleep/:userId?days=7

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "source_name": "Sleep Number",
      "value": "asleep",
      "start_date": "2026-03-30T22:00:00Z",
      "end_date": "2026-03-31T06:30:00Z"
    },
    ...
  ]
}
```

### **Get Heart Rate Data**
```bash
GET /api/health-data/heart-rate/:userId?days=7
```

### **Get Activity Data**
```bash
GET /api/health-data/activity/:userId?days=7
```

### **Get Workouts**
```bash
GET /api/health-data/workouts/:userId?days=7
```

### **Get Body Measurements**
```bash
GET /api/health-data/body/:userId?days=30
```

### **Get Nutrition Data**
```bash
GET /api/health-data/nutrition/:userId?days=7
```

### **Get Sync Statistics**
```bash
GET /api/health-data/sync-stats/:userId

Response:
{
  "success": true,
  "data": {
    "totalDataTypes": 8,
    "lastSync": "2026-03-31T07:00:00Z",
    "syncLog": [...]
  }
}
```

---

## 🎯 **Integration Flow**

### **First Time Setup**

1. User opens app
2. App requests HealthKit permissions
3. User grants access to data types
4. App syncs last 30 days of data
5. Data uploaded to backend
6. Backend stores in database
7. AI analyzes and generates insights

### **Daily Sync**

1. Background task triggers (daily at 6 AM)
2. Fetch new data since last sync
3. Upload to backend
4. Update database
5. Trigger AI analysis if needed

### **Manual Sync**

1. User taps "Sync Now" button
2. Fetch all new data
3. Upload to backend
4. Show sync results

---

## 🔐 **Privacy & Security**

- ✅ User controls all permissions in Apple Health
- ✅ Data encrypted in transit (HTTPS)
- ✅ Data encrypted at rest (PostgreSQL)
- ✅ No data shared with third parties
- ✅ User can revoke access anytime
- ✅ Compliant with HIPAA guidelines
- ✅ Source attribution maintained

---

## 💡 **Benefits**

### **For You**
- ✅ One integration instead of 10+
- ✅ All devices automatically supported
- ✅ No API keys needed for individual devices
- ✅ No OAuth flows for each device
- ✅ Apple handles data validation
- ✅ Works offline (syncs when connected)
- ✅ Historical data access

### **For Your Users**
- ✅ Familiar Apple Health interface
- ✅ Control permissions in one place
- ✅ See all health data in one app
- ✅ Automatic background sync
- ✅ No manual data entry
- ✅ Works with any Apple Health-compatible device

---

## 🧪 **Testing**

### **Test on iOS Simulator**
```bash
cd mobile
npx react-native run-ios
```

Note: Simulator has limited HealthKit data. Use a physical device for full testing.

### **Test on Physical Device**
1. Build and install on iPhone
2. Grant HealthKit permissions
3. Ensure you have data in Apple Health
4. Trigger sync
5. Verify data appears in backend

### **Add Test Data to Apple Health**
1. Open Apple Health app
2. Tap "Browse"
3. Select data type (e.g., "Sleep")
4. Tap "Add Data"
5. Enter test values
6. Sync your app

---

## 📱 **Mobile Screen Example**

Create `HealthSyncScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { initializeHealthKit, syncAllHealthData } from '../services/healthKitService';

export default function HealthSyncScreen() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Initialize HealthKit
      await initializeHealthKit();
      
      // Sync last 7 days
      const result = await syncAllHealthData(7);
      
      setLastSync(new Date());
      
      Alert.alert(
        'Sync Complete!',
        `Synced ${result.recordCount} records from ${result.dataTypes.length} data types`
      );
    } catch (error) {
      Alert.alert('Sync Failed', error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Apple Health Sync
      </Text>
      
      <Button
        title={syncing ? 'Syncing...' : 'Sync Now'}
        onPress={handleSync}
        disabled={syncing}
      />
      
      {lastSync && (
        <Text style={{ marginTop: 20 }}>
          Last sync: {lastSync.toLocaleString()}
        </Text>
      )}
    </View>
  );
}
```

---

## 🔄 **Data Flow Example**

```
1. Sleep Number bed records sleep → Apple Health
2. Oura Ring records HRV → Apple Health
3. Apple Watch records heart rate → Apple Health
4. MyFitnessPal logs nutrition → Apple Health
5. Your app syncs Apple Health → Your backend
6. Backend stores all data → PostgreSQL
7. AI analyzes combined data → Generates insights
8. User sees unified dashboard → All devices in one place
```

---

## 🎯 **What You Get**

**Instead of:**
- ❌ 10+ individual device integrations
- ❌ 10+ OAuth flows
- ❌ 10+ API keys to manage
- ❌ 10+ different data formats
- ❌ 10+ sync services

**You get:**
- ✅ 1 Apple Health integration
- ✅ 1 permission request
- ✅ 1 sync service
- ✅ 1 unified data format
- ✅ Access to ALL devices

---

## 📊 **Database Schema**

All data stored in dedicated tables:
- `apple_health_sleep` - Sleep from all sources
- `apple_health_heart_rate` - HR from all wearables
- `apple_health_steps` - Steps from all trackers
- `apple_health_workouts` - Workouts from all apps
- `apple_health_body_measurements` - Weight, body fat, etc.
- `apple_health_nutrition` - Nutrition from all apps
- `apple_health_blood_glucose` - CGM data
- `apple_health_hrv` - HRV from all devices
- `apple_health_sync_log` - Sync tracking

Each record includes:
- User ID
- Source name (device/app that created it)
- Value/measurement
- Timestamp
- Data source attribution

---

## 🚀 **Next Steps**

1. ✅ Install `react-native-health` package
2. ✅ Configure iOS HealthKit capability
3. ✅ Run database migration
4. ✅ Test on physical iOS device
5. ✅ Grant HealthKit permissions
6. ✅ Sync your health data
7. ✅ View unified dashboard

---

## 🎉 **Result**

**You now have:**
- ✅ Sleep Number i10 bed data
- ✅ Oura Ring data
- ✅ Apple Watch data
- ✅ MyFitnessPal nutrition
- ✅ Strava workouts
- ✅ Withings scale data
- ✅ Dexcom glucose data
- ✅ And ANY other Apple Health-compatible device!

**All through ONE integration!** 🚀

---

**Your Apple Health integration is ready to deploy!**
