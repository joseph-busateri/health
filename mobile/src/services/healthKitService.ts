import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const USER_ID = 'default-user';

// Define all health data permissions we want to access
const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      // Sleep
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      
      // Activity
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
      
      // Workouts
      AppleHealthKit.Constants.Permissions.Workout,
      
      // Heart
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      
      // Body Measurements
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.Height,
      AppleHealthKit.Constants.Permissions.BodyMassIndex,
      AppleHealthKit.Constants.Permissions.BodyFatPercentage,
      AppleHealthKit.Constants.Permissions.LeanBodyMass,
      
      // Vitals
      AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
      AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
      AppleHealthKit.Constants.Permissions.RespiratoryRate,
      AppleHealthKit.Constants.Permissions.BodyTemperature,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
      
      // Nutrition
      AppleHealthKit.Constants.Permissions.DietaryEnergy,
      AppleHealthKit.Constants.Permissions.Protein,
      AppleHealthKit.Constants.Permissions.Carbohydrates,
      AppleHealthKit.Constants.Permissions.Fiber,
      AppleHealthKit.Constants.Permissions.Sugar,
      AppleHealthKit.Constants.Permissions.TotalFat,
      AppleHealthKit.Constants.Permissions.Water,
      
      // Blood Glucose
      AppleHealthKit.Constants.Permissions.BloodGlucose,
      
      // Mindfulness
      AppleHealthKit.Constants.Permissions.MindfulSession,
    ],
    write: [],
  },
};

export interface HealthKitSyncResult {
  success: boolean;
  dataTypes: string[];
  recordCount: number;
  error?: string;
}

/**
 * Initialize HealthKit and request permissions
 */
export const initializeHealthKit = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'ios') {
      reject(new Error('HealthKit is only available on iOS'));
      return;
    }

    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        console.error('HealthKit initialization error:', error);
        reject(new Error(error));
      } else {
        console.log('HealthKit initialized successfully');
        resolve(true);
      }
    });
  });
};

/**
 * Check if HealthKit is available on this device
 */
export const isHealthKitAvailable = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(false);
      return;
    }

    AppleHealthKit.isAvailable((err: Object, available: boolean) => {
      resolve(available);
    });
  });
};

/**
 * Sync all health data from the last N days
 * @param days Number of days to sync (default: 7)
 * @param dataTypes Optional array of specific data types to sync. If not provided, syncs all types.
 *                  Valid types: 'sleep', 'heart_rate', 'steps', 'workouts', 'body_measurements', 
 *                  'nutrition', 'blood_glucose', 'hrv', 'blood_pressure', 'active_energy'
 */
export const syncAllHealthData = async (
  days: number = 7, 
  dataTypes?: string[]
): Promise<HealthKitSyncResult> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    let totalRecords = 0;
    const syncedDataTypes: string[] = [];

    // Helper to check if a data type should be synced
    const shouldSync = (type: string) => !dataTypes || dataTypes.includes(type);

    // Sync Sleep Data
    if (shouldSync('sleep')) {
      const sleepData = await getSleepData(options);
      if (sleepData.length > 0) {
        await uploadToBackend('sleep', sleepData);
        totalRecords += sleepData.length;
        syncedDataTypes.push('sleep');
      }
    }

    // Sync Heart Rate Data
    if (shouldSync('heart_rate')) {
      const heartRateData = await getHeartRateData(options);
      if (heartRateData.length > 0) {
        await uploadToBackend('heart_rate', heartRateData);
        totalRecords += heartRateData.length;
        syncedDataTypes.push('heart_rate');
      }
    }

    // Sync Steps Data
    if (shouldSync('steps')) {
      const stepsData = await getStepsData(options);
      if (stepsData.length > 0) {
        await uploadToBackend('steps', stepsData);
        totalRecords += stepsData.length;
        syncedDataTypes.push('steps');
      }
    }

    // Sync Workout Data
    if (shouldSync('workouts')) {
      const workoutData = await getWorkoutData(options);
      if (workoutData.length > 0) {
        await uploadToBackend('workouts', workoutData);
        totalRecords += workoutData.length;
        syncedDataTypes.push('workouts');
      }
    }

    // Sync Body Measurements
    if (shouldSync('body_measurements')) {
      const bodyData = await getBodyMeasurements(options);
      if (bodyData.length > 0) {
        await uploadToBackend('body_measurements', bodyData);
        totalRecords += bodyData.length;
        syncedDataTypes.push('body_measurements');
      }
    }

    // Sync Nutrition Data
    if (shouldSync('nutrition')) {
      const nutritionData = await getNutritionData(options);
      if (nutritionData.length > 0) {
        await uploadToBackend('nutrition', nutritionData);
        totalRecords += nutritionData.length;
        syncedDataTypes.push('nutrition');
      }
    }

    // Sync Blood Glucose
    if (shouldSync('blood_glucose')) {
      const glucoseData = await getBloodGlucoseData(options);
      if (glucoseData.length > 0) {
        await uploadToBackend('blood_glucose', glucoseData);
        totalRecords += glucoseData.length;
        syncedDataTypes.push('blood_glucose');
      }
    }

    // Sync HRV Data
    if (shouldSync('hrv')) {
      const hrvData = await getHRVData(options);
      if (hrvData.length > 0) {
        await uploadToBackend('hrv', hrvData);
        totalRecords += hrvData.length;
        syncedDataTypes.push('hrv');
      }
    }

    // Sync Blood Pressure Data
    if (shouldSync('blood_pressure')) {
      const bpData = await getBloodPressureData(options);
      if (bpData.length > 0) {
        await uploadToBackend('blood_pressure', bpData);
        totalRecords += bpData.length;
        syncedDataTypes.push('blood_pressure');
      }
    }

    // Sync Active Energy
    if (shouldSync('active_energy')) {
      const activeEnergyData = await new Promise<any[]>((resolve, reject) => {
        AppleHealthKit.getActiveEnergyBurned(options, (err: Object, results: any[]) => {
          if (err) reject(err);
          else resolve(results || []);
        });
      });
      if (activeEnergyData.length > 0) {
        await uploadToBackend('active_energy', activeEnergyData);
        totalRecords += activeEnergyData.length;
        syncedDataTypes.push('active_energy');
      }
    }

    console.log('HealthKit sync complete', {
      dataTypes: syncedDataTypes,
      totalRecords,
    });

    return {
      success: true,
      dataTypes: syncedDataTypes,
      recordCount: totalRecords,
    };
  } catch (error: any) {
    console.error('HealthKit sync error:', error);
    return {
      success: false,
      dataTypes: [],
      recordCount: 0,
      error: error.message,
    };
  }
};

/**
 * Get sleep data from HealthKit
 */
const getSleepData = (options: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getSleepSamples(options, (err: Object, results: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(results || []);
      }
    });
  });
};

/**
 * Get heart rate data from HealthKit
 */
const getHeartRateData = (options: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getHeartRateSamples(options, (err: Object, results: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(results || []);
      }
    });
  });
};

/**
 * Get steps data from HealthKit
 */
const getStepsData = (options: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getDailyStepCountSamples(options, (err: Object, results: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(results || []);
      }
    });
  });
};

/**
 * Get workout data from HealthKit
 */
const getWorkoutData = (options: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getSamples(
      {
        ...options,
        type: 'Workout',
      },
      (err: Object, results: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(results || []);
        }
      }
    );
  });
};

/**
 * Get body measurements from HealthKit
 */
const getBodyMeasurements = async (options: any): Promise<any[]> => {
  const measurements: any[] = [];

  try {
    // Weight
    const weight = await new Promise<any[]>((resolve, reject) => {
      AppleHealthKit.getWeightSamples(options, (err: Object, results: any[]) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    measurements.push(...weight.map(w => ({ ...w, type: 'weight' })));

    // Body Fat Percentage
    const bodyFat = await new Promise<any[]>((resolve, reject) => {
      AppleHealthKit.getBodyFatPercentageSamples(options, (err: Object, results: any[]) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    measurements.push(...bodyFat.map(bf => ({ ...bf, type: 'body_fat' })));

    // Lean Body Mass
    const leanMass = await new Promise<any[]>((resolve, reject) => {
      AppleHealthKit.getLeanBodyMassSamples(options, (err: Object, results: any[]) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    measurements.push(...leanMass.map(lm => ({ ...lm, type: 'lean_mass' })));
  } catch (error) {
    console.error('Error fetching body measurements:', error);
  }

  return measurements;
};

/**
 * Get nutrition data from HealthKit
 */
const getNutritionData = async (options: any): Promise<any[]> => {
  const nutrition: any[] = [];

  try {
    // Dietary Energy (Calories)
    const energy = await new Promise<any[]>((resolve, reject) => {
      AppleHealthKit.getDietaryEnergySamples(options, (err: Object, results: any[]) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    nutrition.push(...energy.map(e => ({ ...e, type: 'calories' })));

    // Protein
    const protein = await new Promise<any[]>((resolve, reject) => {
      AppleHealthKit.getProteinSamples(options, (err: Object, results: any[]) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    nutrition.push(...protein.map(p => ({ ...p, type: 'protein' })));

    // Carbs
    const carbs = await new Promise<any[]>((resolve, reject) => {
      AppleHealthKit.getCarbohydratesSamples(options, (err: Object, results: any[]) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    nutrition.push(...carbs.map(c => ({ ...c, type: 'carbs' })));

    // Fat
    const fat = await new Promise<any[]>((resolve, reject) => {
      AppleHealthKit.getTotalFatSamples(options, (err: Object, results: any[]) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
    nutrition.push(...fat.map(f => ({ ...f, type: 'fat' })));
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
  }

  return nutrition;
};

/**
 * Get blood glucose data from HealthKit
 */
const getBloodGlucoseData = (options: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getBloodGlucoseSamples(options, (err: Object, results: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(results || []);
      }
    });
  });
};

/**
 * Get HRV (Heart Rate Variability) data from HealthKit
 */
const getHRVData = (options: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getHeartRateVariabilitySamples(options, (err: Object, results: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(results || []);
      }
    });
  });
};

/**
 * Get blood pressure data from HealthKit
 */
const getBloodPressureData = async (options: any): Promise<any[]> => {
  const bpData: any[] = [];

  try {
    // Get Systolic Pressure
    const systolic = await new Promise<any[]>((resolve, reject) => {
      AppleHealthKit.getBloodPressureSamples(options, (err: Object, results: any[]) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });

    // HealthKit returns both systolic and diastolic in the same sample
    // Map to our expected format
    systolic.forEach(sample => {
      if (sample.bloodPressureSystolicValue && sample.bloodPressureDiastolicValue) {
        bpData.push({
          systolic: sample.bloodPressureSystolicValue,
          diastolic: sample.bloodPressureDiastolicValue,
          startDate: sample.startDate,
          endDate: sample.endDate,
          source: 'apple_health',
        });
      }
    });

  } catch (error) {
    console.error('Error fetching blood pressure data:', error);
  }

  return bpData;
};

/**
 * Upload health data to backend
 */
const uploadToBackend = async (dataType: string, data: any[]): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health-data/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: USER_ID,
        dataType,
        data,
        source: 'apple_health',
        syncedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${dataType} data`);
    }

    console.log(`Uploaded ${data.length} ${dataType} records`);
  } catch (error) {
    console.error(`Error uploading ${dataType} data:`, error);
    throw error;
  }
};

/**
 * Get latest sync timestamp
 */
export const getLastSyncTime = async (): Promise<Date | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health-data/last-sync/${USER_ID}`);
    const data = await response.json();
    return data.lastSync ? new Date(data.lastSync) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

/**
 * Enable background sync
 */
export const enableBackgroundSync = async (): Promise<void> => {
  // TODO: Implement background task for periodic syncing
  console.log('Background sync enabled');
};

/**
 * Sync blood pressure data specifically
 * @deprecated Use syncAllHealthData(days, ['blood_pressure']) instead
 */
export const syncBloodPressure = async (days: number = 30): Promise<HealthKitSyncResult> => {
  return syncAllHealthData(days, ['blood_pressure']);
};
