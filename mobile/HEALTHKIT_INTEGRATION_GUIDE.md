# HealthKit Integration Guide for Apple Watch

## Overview
This guide covers the complete implementation of HealthKit integration for the Apple Watch health data sync system. HealthKit provides access to health and fitness data from Apple Watch and iPhone.

---

## Prerequisites
- iOS app project in Xcode
- Apple Developer Account
- Physical iOS device with paired Apple Watch
- React Native or Expo app with HealthKit library

---

## Part 1: Xcode Project Configuration

### Step 1.1: Enable HealthKit Capability

1. **Open Xcode Project**
   - Open your iOS app project in Xcode
   - Select the project in the navigator

2. **Add HealthKit Capability**
   - Select your app target
   - Go to **Signing & Capabilities** tab
   - Click **+ Capability**
   - Add **HealthKit**

3. **Configure HealthKit Settings**
   - Check **Clinical Health Records** (if needed)
   - Check **Background Delivery** (for automatic updates)

### Step 1.2: Update Info.plist

Add HealthKit usage descriptions to `Info.plist`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your health data to provide personalized health insights and track your fitness progress.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>We need permission to save your health data to HealthKit.</string>

<key>NSHealthClinicalHealthRecordsShareUsageDescription</key>
<string>We need access to your health records to provide comprehensive health analysis.</string>
```

### Step 1.3: Configure Entitlements

Xcode should automatically create `YourApp.entitlements` with:

```xml
<key>com.apple.developer.healthkit</key>
<true/>
<key>com.apple.developer.healthkit.access</key>
<array>
    <string>health-records</string>
</array>
```

---

## Part 2: Install HealthKit Library

### For React Native / Expo

Install the HealthKit library:

```bash
npm install @kingstinct/react-native-healthkit
# or
yarn add @kingstinct/react-native-healthkit
```

### Configure iOS Podfile

Add to `ios/Podfile`:

```ruby
pod 'react-native-healthkit', :path => '../node_modules/@kingstinct/react-native-healthkit'
```

Install pods:

```bash
cd ios
pod install
cd ..
```

---

## Part 3: HealthKit Authorization

### Step 3.1: Request Permissions

Implement authorization in your React Native component:

```typescript
import HealthKit from '@kingstinct/react-native-healthkit';

const requestHealthKitAuthorization = async () => {
  try {
    // Check if HealthKit is available
    const available = await HealthKit.isHealthDataAvailable();
    if (!available) {
      console.log('HealthKit not available on this device');
      return false;
    }

    // Define permissions
    const permissions = {
      read: [
        // Heart Rate
        HealthKit.HKQuantityTypeIdentifier.heartRate,
        HealthKit.HKQuantityTypeIdentifier.heartRateVariabilitySDNN,
        HealthKit.HKQuantityTypeIdentifier.restingHeartRate,
        HealthKit.HKQuantityTypeIdentifier.walkingHeartRateAverage,
        
        // Fitness
        HealthKit.HKQuantityTypeIdentifier.activeEnergyBurned,
        HealthKit.HKQuantityTypeIdentifier.basalEnergyBurned,
        HealthKit.HKQuantityTypeIdentifier.stepCount,
        HealthKit.HKQuantityTypeIdentifier.distanceWalkingRunning,
        HealthKit.HKQuantityTypeIdentifier.flightsClimbed,
        HealthKit.HKQuantityTypeIdentifier.appleExerciseTime,
        HealthKit.HKQuantityTypeIdentifier.appleStandTime,
        
        // Advanced Metrics
        HealthKit.HKQuantityTypeIdentifier.vo2Max,
        HealthKit.HKQuantityTypeIdentifier.respiratoryRate,
        HealthKit.HKQuantityTypeIdentifier.oxygenSaturation,
        
        // Sleep
        HealthKit.HKCategoryTypeIdentifier.sleepAnalysis,
        
        // Workouts
        HealthKit.HKWorkoutTypeIdentifier.workoutType,
      ],
    };

    // Request authorization
    await HealthKit.requestAuthorization(permissions);
    
    console.log('HealthKit authorization granted');
    return true;
  } catch (error) {
    console.error('HealthKit authorization error:', error);
    return false;
  }
};
```

### Step 3.2: Check Authorization Status

```typescript
const checkAuthorizationStatus = async (dataType: string) => {
  try {
    const status = await HealthKit.getAuthorizationStatusFor(dataType);
    // Returns: 'notDetermined', 'sharingDenied', 'sharingAuthorized'
    return status;
  } catch (error) {
    console.error('Error checking authorization:', error);
    return 'notDetermined';
  }
};
```

---

## Part 4: Reading HealthKit Data

### Step 4.1: Query Samples

Read heart rate data:

```typescript
const readHeartRateData = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const samples = await HealthKit.querySamples(
      HealthKit.HKQuantityTypeIdentifier.heartRate,
      {
        from: startDate,
        to: endDate,
        limit: 1000, // Max samples to return
        ascending: false, // Most recent first
      }
    );

    console.log(`Retrieved ${samples.length} heart rate samples`);
    
    // Sample format:
    // {
    //   uuid: 'string',
    //   startDate: 'ISO date string',
    //   endDate: 'ISO date string',
    //   quantity: number,
    //   unit: 'count/min'
    // }
    
    return samples;
  } catch (error) {
    console.error('Error reading heart rate:', error);
    return [];
  }
};
```

### Step 4.2: Query Statistics

Get aggregated statistics:

```typescript
const getStepCountStatistics = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const statistics = await HealthKit.queryStatisticsForQuantity(
      HealthKit.HKQuantityTypeIdentifier.stepCount,
      {
        from: startDate,
        to: endDate,
      }
    );

    console.log('Step count statistics:', {
      sum: statistics.sumQuantity,
      average: statistics.averageQuantity,
      min: statistics.minimumQuantity,
      max: statistics.maximumQuantity,
    });

    return statistics;
  } catch (error) {
    console.error('Error reading step statistics:', error);
    return null;
  }
};
```

### Step 4.3: Query Workouts

Read workout data:

```typescript
const readWorkouts = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const workouts = await HealthKit.queryWorkouts({
      from: startDate,
      to: endDate,
    });

    console.log(`Retrieved ${workouts.length} workouts`);
    
    // Workout format:
    // {
    //   uuid: 'string',
    //   workoutActivityType: number,
    //   startDate: 'ISO date string',
    //   endDate: 'ISO date string',
    //   duration: number (seconds),
    //   totalDistance: { quantity: number, unit: 'string' },
    //   totalEnergyBurned: { quantity: number, unit: 'string' }
    // }

    return workouts;
  } catch (error) {
    console.error('Error reading workouts:', error);
    return [];
  }
};
```

### Step 4.4: Query Sleep Analysis

Read sleep data:

```typescript
const readSleepData = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sleepSamples = await HealthKit.queryCategorySamples(
      HealthKit.HKCategoryTypeIdentifier.sleepAnalysis,
      {
        from: startDate,
        to: endDate,
      }
    );

    // Sleep analysis values:
    // 0 = In Bed
    // 1 = Asleep (Unspecified)
    // 2 = Awake
    // 3 = Core Sleep
    // 4 = Deep Sleep
    // 5 = REM Sleep

    const sleepByNight = groupSleepByNight(sleepSamples);
    
    return sleepByNight;
  } catch (error) {
    console.error('Error reading sleep data:', error);
    return [];
  }
};

const groupSleepByNight = (samples: any[]) => {
  // Group sleep samples by night
  const nights = new Map();
  
  samples.forEach(sample => {
    const night = new Date(sample.startDate).toISOString().split('T')[0];
    if (!nights.has(night)) {
      nights.set(night, []);
    }
    nights.get(night).push(sample);
  });
  
  return Array.from(nights.entries()).map(([night, samples]) => ({
    date: night,
    samples,
    totalMinutes: calculateTotalSleepMinutes(samples),
  }));
};
```

---

## Part 5: Data Aggregation and Formatting

### Step 5.1: Aggregate by Day

```typescript
const aggregateDataByDay = (samples: any[], dataType: string) => {
  const dayMap = new Map();

  samples.forEach(sample => {
    const date = new Date(sample.startDate).toISOString().split('T')[0];
    
    if (!dayMap.has(date)) {
      dayMap.set(date, {
        date,
        values: [],
        sum: 0,
        count: 0,
      });
    }

    const day = dayMap.get(date);
    day.values.push(sample.quantity);
    day.sum += sample.quantity;
    day.count += 1;
  });

  return Array.from(dayMap.values()).map(day => ({
    date: day.date,
    average: day.sum / day.count,
    min: Math.min(...day.values),
    max: Math.max(...day.values),
    sum: day.sum,
    count: day.count,
  }));
};
```

### Step 5.2: Format for Backend API

```typescript
const formatHealthKitDataForAPI = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Read all data types
    const [heartRate, hrv, steps, activeEnergy, workouts] = await Promise.all([
      HealthKit.querySamples(HealthKit.HKQuantityTypeIdentifier.heartRate, { from: startDate, to: endDate }),
      HealthKit.querySamples(HealthKit.HKQuantityTypeIdentifier.heartRateVariabilitySDNN, { from: startDate, to: endDate }),
      HealthKit.querySamples(HealthKit.HKQuantityTypeIdentifier.stepCount, { from: startDate, to: endDate }),
      HealthKit.querySamples(HealthKit.HKQuantityTypeIdentifier.activeEnergyBurned, { from: startDate, to: endDate }),
      HealthKit.queryWorkouts({ from: startDate, to: endDate }),
    ]);

    // Aggregate by day
    const dailyData = aggregateDailyHealthData({
      heartRate,
      hrv,
      steps,
      activeEnergy,
    });

    // Format workouts
    const formattedWorkouts = workouts.map(workout => ({
      healthkitWorkoutId: workout.uuid,
      workoutType: getWorkoutTypeName(workout.workoutActivityType),
      startTime: workout.startDate,
      endTime: workout.endDate,
      durationMinutes: Math.round(workout.duration / 60),
      totalDistance: workout.totalDistance?.quantity,
      totalEnergyBurned: workout.totalEnergyBurned?.quantity,
    }));

    return {
      dailyData,
      workouts: formattedWorkouts,
    };
  } catch (error) {
    console.error('Error formatting HealthKit data:', error);
    throw error;
  }
};
```

---

## Part 6: Background Sync

### Step 6.1: Enable Background Delivery

```typescript
const enableBackgroundDelivery = async () => {
  try {
    // Enable background delivery for specific data types
    await HealthKit.enableBackgroundDelivery(
      HealthKit.HKQuantityTypeIdentifier.heartRate,
      HealthKit.HKUpdateFrequency.immediate
    );

    await HealthKit.enableBackgroundDelivery(
      HealthKit.HKQuantityTypeIdentifier.stepCount,
      HealthKit.HKUpdateFrequency.hourly
    );

    console.log('Background delivery enabled');
  } catch (error) {
    console.error('Error enabling background delivery:', error);
  }
};
```

### Step 6.2: Observe Changes

```typescript
const observeHealthKitChanges = async () => {
  try {
    // Set up observer for heart rate changes
    const observer = await HealthKit.subscribeToChanges(
      HealthKit.HKQuantityTypeIdentifier.heartRate,
      () => {
        console.log('Heart rate data changed');
        // Trigger sync
        syncHealthKitData();
      }
    );

    return observer;
  } catch (error) {
    console.error('Error setting up observer:', error);
  }
};
```

---

## Part 7: Error Handling

### Step 7.1: Handle Authorization Errors

```typescript
const handleAuthorizationError = (error: any) => {
  if (error.message.includes('authorization')) {
    Alert.alert(
      'Authorization Required',
      'Please grant access to HealthKit in Settings > Privacy > Health',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  } else if (error.message.includes('not available')) {
    Alert.alert(
      'HealthKit Not Available',
      'HealthKit is not available on this device.'
    );
  } else {
    Alert.alert('Error', 'Failed to access HealthKit. Please try again.');
  }
};
```

### Step 7.2: Handle Query Errors

```typescript
const safeQuerySamples = async (dataType: string, options: any) => {
  try {
    const samples = await HealthKit.querySamples(dataType, options);
    return { success: true, data: samples };
  } catch (error) {
    console.error(`Error querying ${dataType}:`, error);
    return { success: false, error: error.message };
  }
};
```

---

## Part 8: Testing

### Step 8.1: Test on Physical Device

**Important**: HealthKit only works on physical iOS devices, not simulators.

1. **Build and Run**
   - Connect iPhone to Mac
   - Build and run app on device
   - Ensure Apple Watch is paired

2. **Grant Permissions**
   - Tap "Connect Apple Watch"
   - Grant all HealthKit permissions
   - Verify authorization succeeds

3. **Verify Data Reading**
   - Trigger manual sync
   - Check console logs for data
   - Verify data is formatted correctly

### Step 8.2: Test Data Types

Test each data type individually:

```typescript
const testAllDataTypes = async () => {
  const dataTypes = [
    { name: 'Heart Rate', type: HealthKit.HKQuantityTypeIdentifier.heartRate },
    { name: 'HRV', type: HealthKit.HKQuantityTypeIdentifier.heartRateVariabilitySDNN },
    { name: 'Steps', type: HealthKit.HKQuantityTypeIdentifier.stepCount },
    { name: 'Active Energy', type: HealthKit.HKQuantityTypeIdentifier.activeEnergyBurned },
  ];

  for (const dataType of dataTypes) {
    try {
      const samples = await HealthKit.querySamples(dataType.type, {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: new Date(),
      });
      console.log(`✅ ${dataType.name}: ${samples.length} samples`);
    } catch (error) {
      console.log(`❌ ${dataType.name}: ${error.message}`);
    }
  }
};
```

---

## Part 9: Best Practices

### Performance Optimization

1. **Limit Query Range**
   - Don't query more than 30 days at once
   - Use pagination for large datasets

2. **Batch Requests**
   - Use `Promise.all()` for parallel queries
   - Avoid sequential queries when possible

3. **Cache Results**
   - Cache recent data locally
   - Only query for new data

### Privacy and Security

1. **Request Minimal Permissions**
   - Only request data types you actually use
   - Explain why each permission is needed

2. **Handle Denials Gracefully**
   - App should work without HealthKit
   - Provide alternative data entry methods

3. **Respect User Privacy**
   - Don't share HealthKit data with third parties
   - Encrypt data in transit and at rest

---

## Part 10: Troubleshooting

### Issue: "HealthKit not available"

**Cause**: Running on simulator or device without HealthKit

**Solution**: Test on physical iOS device only

### Issue: Authorization request not showing

**Cause**: Permissions already denied or capability not enabled

**Solution**:
1. Check Xcode capabilities
2. Delete and reinstall app
3. Reset privacy settings on device

### Issue: No data returned from queries

**Cause**: No data in HealthKit or date range too narrow

**Solution**:
1. Open Health app and verify data exists
2. Expand date range
3. Check authorization status

### Issue: Background delivery not working

**Cause**: Background modes not enabled or iOS restrictions

**Solution**:
1. Enable Background Modes in Xcode
2. Check Background App Refresh in iOS Settings
3. Test on device (not simulator)

---

## Resources

- [HealthKit Framework Documentation](https://developer.apple.com/documentation/healthkit)
- [react-native-healthkit Library](https://github.com/kingstinct/react-native-healthkit)
- [HealthKit Data Types Reference](https://developer.apple.com/documentation/healthkit/data_types)
- [WWDC HealthKit Sessions](https://developer.apple.com/videos/health-and-fitness)

---

## Support

For issues with:
- **HealthKit Setup**: Check Apple Developer documentation
- **Library Integration**: Check react-native-healthkit GitHub issues
- **Data Queries**: Review HealthKit framework documentation
- **Authorization**: Check iOS Privacy settings
