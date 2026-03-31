import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface HealthDataSyncRequest {
  userId: string;
  dataType: string;
  data: any[];
  source: string;
  syncedAt: string;
}

export interface HealthDataSyncResult {
  recordsProcessed: number;
  recordsSaved: number;
  recordsSkipped: number;
}

export class HealthDataService {
  
  /**
   * Sync health data from Apple Health
   */
  async syncHealthData(request: HealthDataSyncRequest): Promise<HealthDataSyncResult> {
    const { userId, dataType, data, source, syncedAt } = request;
    
    let recordsSaved = 0;
    let recordsSkipped = 0;

    try {
      logger.info('Syncing health data', {
        userId,
        dataType,
        recordCount: data.length,
        source,
      });

      // Route to appropriate handler based on data type
      switch (dataType) {
        case 'sleep':
          recordsSaved = await this.saveSleepData(userId, data, source);
          break;
        case 'heart_rate':
          recordsSaved = await this.saveHeartRateData(userId, data, source);
          break;
        case 'steps':
          recordsSaved = await this.saveStepsData(userId, data, source);
          break;
        case 'workouts':
          recordsSaved = await this.saveWorkoutData(userId, data, source);
          break;
        case 'body_measurements':
          recordsSaved = await this.saveBodyMeasurements(userId, data, source);
          break;
        case 'nutrition':
          recordsSaved = await this.saveNutritionData(userId, data, source);
          break;
        case 'blood_glucose':
          recordsSaved = await this.saveBloodGlucoseData(userId, data, source);
          break;
        case 'hrv':
          recordsSaved = await this.saveHRVData(userId, data, source);
          break;
        default:
          logger.warn('Unknown data type', { dataType });
          recordsSkipped = data.length;
      }

      // Update last sync time
      await this.updateLastSyncTime(userId, dataType, syncedAt);

      logger.info('Health data sync complete', {
        userId,
        dataType,
        recordsSaved,
        recordsSkipped,
      });

      return {
        recordsProcessed: data.length,
        recordsSaved,
        recordsSkipped,
      };
    } catch (error) {
      logger.error('Error syncing health data', { error, userId, dataType });
      throw error;
    }
  }

  /**
   * Save sleep data
   */
  private async saveSleepData(userId: string, data: any[], source: string): Promise<number> {
    let saved = 0;

    for (const record of data) {
      try {
        const { error } = await supabase
          .from('apple_health_sleep')
          .upsert({
            user_id: userId,
            source_name: record.sourceName || source,
            value: record.value,
            start_date: record.startDate,
            end_date: record.endDate,
            data_source: source,
          }, {
            onConflict: 'user_id,start_date,end_date',
          });

        if (!error) saved++;
      } catch (error) {
        logger.error('Error saving sleep record', { error, record });
      }
    }

    return saved;
  }

  /**
   * Save heart rate data
   */
  private async saveHeartRateData(userId: string, data: any[], source: string): Promise<number> {
    let saved = 0;

    for (const record of data) {
      try {
        const { error } = await supabase
          .from('apple_health_heart_rate')
          .upsert({
            user_id: userId,
            source_name: record.sourceName || source,
            value: record.value,
            start_date: record.startDate,
            end_date: record.endDate,
            data_source: source,
          }, {
            onConflict: 'user_id,start_date',
          });

        if (!error) saved++;
      } catch (error) {
        logger.error('Error saving heart rate record', { error, record });
      }
    }

    return saved;
  }

  /**
   * Save steps data
   */
  private async saveStepsData(userId: string, data: any[], source: string): Promise<number> {
    let saved = 0;

    for (const record of data) {
      try {
        const { error } = await supabase
          .from('apple_health_steps')
          .upsert({
            user_id: userId,
            source_name: record.sourceName || source,
            value: record.value,
            start_date: record.startDate,
            end_date: record.endDate,
            data_source: source,
          }, {
            onConflict: 'user_id,start_date',
          });

        if (!error) saved++;
      } catch (error) {
        logger.error('Error saving steps record', { error, record });
      }
    }

    return saved;
  }

  /**
   * Save workout data
   */
  private async saveWorkoutData(userId: string, data: any[], source: string): Promise<number> {
    let saved = 0;

    for (const record of data) {
      try {
        const { error } = await supabase
          .from('apple_health_workouts')
          .upsert({
            user_id: userId,
            source_name: record.sourceName || source,
            workout_type: record.activityName || record.workoutActivityType,
            duration: record.duration,
            calories: record.totalEnergyBurned,
            distance: record.totalDistance,
            start_date: record.startDate,
            end_date: record.endDate,
            data_source: source,
          }, {
            onConflict: 'user_id,start_date,end_date',
          });

        if (!error) saved++;
      } catch (error) {
        logger.error('Error saving workout record', { error, record });
      }
    }

    return saved;
  }

  /**
   * Save body measurements
   */
  private async saveBodyMeasurements(userId: string, data: any[], source: string): Promise<number> {
    let saved = 0;

    for (const record of data) {
      try {
        const { error } = await supabase
          .from('apple_health_body_measurements')
          .upsert({
            user_id: userId,
            source_name: record.sourceName || source,
            measurement_type: record.type,
            value: record.value,
            unit: record.unit,
            start_date: record.startDate,
            data_source: source,
          }, {
            onConflict: 'user_id,measurement_type,start_date',
          });

        if (!error) saved++;
      } catch (error) {
        logger.error('Error saving body measurement', { error, record });
      }
    }

    return saved;
  }

  /**
   * Save nutrition data
   */
  private async saveNutritionData(userId: string, data: any[], source: string): Promise<number> {
    let saved = 0;

    for (const record of data) {
      try {
        const { error } = await supabase
          .from('apple_health_nutrition')
          .upsert({
            user_id: userId,
            source_name: record.sourceName || source,
            nutrient_type: record.type,
            value: record.value,
            unit: record.unit,
            start_date: record.startDate,
            data_source: source,
          }, {
            onConflict: 'user_id,nutrient_type,start_date',
          });

        if (!error) saved++;
      } catch (error) {
        logger.error('Error saving nutrition record', { error, record });
      }
    }

    return saved;
  }

  /**
   * Save blood glucose data
   */
  private async saveBloodGlucoseData(userId: string, data: any[], source: string): Promise<number> {
    let saved = 0;

    for (const record of data) {
      try {
        const { error } = await supabase
          .from('apple_health_blood_glucose')
          .upsert({
            user_id: userId,
            source_name: record.sourceName || source,
            value: record.value,
            unit: record.unit,
            start_date: record.startDate,
            data_source: source,
          }, {
            onConflict: 'user_id,start_date',
          });

        if (!error) saved++;
      } catch (error) {
        logger.error('Error saving blood glucose record', { error, record });
      }
    }

    return saved;
  }

  /**
   * Save HRV data
   */
  private async saveHRVData(userId: string, data: any[], source: string): Promise<number> {
    let saved = 0;

    for (const record of data) {
      try {
        const { error } = await supabase
          .from('apple_health_hrv')
          .upsert({
            user_id: userId,
            source_name: record.sourceName || source,
            value: record.value,
            start_date: record.startDate,
            data_source: source,
          }, {
            onConflict: 'user_id,start_date',
          });

        if (!error) saved++;
      } catch (error) {
        logger.error('Error saving HRV record', { error, record });
      }
    }

    return saved;
  }

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(userId: string, dataType: string, syncedAt: string): Promise<void> {
    try {
      await supabase
        .from('apple_health_sync_log')
        .upsert({
          user_id: userId,
          data_type: dataType,
          last_sync: syncedAt,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,data_type',
        });
    } catch (error) {
      logger.error('Error updating last sync time', { error, userId, dataType });
    }
  }

  /**
   * Get last sync time for a user
   */
  async getLastSyncTime(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('apple_health_sync_log')
        .select('last_sync')
        .eq('user_id', userId)
        .order('last_sync', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return data.last_sync;
    } catch (error) {
      logger.error('Error getting last sync time', { error, userId });
      return null;
    }
  }

  /**
   * Get health data summary
   */
  async getHealthDataSummary(userId: string, days: number = 7): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_health_data_summary', {
          p_user_id: userId,
          p_days: days,
        });

      if (error) throw error;

      return data[0] || {};
    } catch (error) {
      logger.error('Error getting health data summary', { error, userId });
      throw error;
    }
  }

  /**
   * Get sleep data
   */
  async getSleepData(userId: string, days: number = 7): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('apple_health_sleep')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', startDate.toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting sleep data', { error, userId });
      throw error;
    }
  }

  /**
   * Get heart rate data
   */
  async getHeartRateData(userId: string, days: number = 7): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('apple_health_heart_rate')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', startDate.toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting heart rate data', { error, userId });
      throw error;
    }
  }

  /**
   * Get activity data
   */
  async getActivityData(userId: string, days: number = 7): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('apple_health_steps')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', startDate.toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting activity data', { error, userId });
      throw error;
    }
  }

  /**
   * Get workout data
   */
  async getWorkoutData(userId: string, days: number = 7): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('apple_health_workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', startDate.toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting workout data', { error, userId });
      throw error;
    }
  }

  /**
   * Get body measurements
   */
  async getBodyMeasurements(userId: string, days: number = 30): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('apple_health_body_measurements')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', startDate.toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting body measurements', { error, userId });
      throw error;
    }
  }

  /**
   * Get nutrition data
   */
  async getNutritionData(userId: string, days: number = 7): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('apple_health_nutrition')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', startDate.toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting nutrition data', { error, userId });
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('apple_health_sync_log')
        .select('*')
        .eq('user_id', userId)
        .order('last_sync', { ascending: false });

      if (error) throw error;

      return {
        totalDataTypes: data?.length || 0,
        lastSync: data?.[0]?.last_sync || null,
        syncLog: data || [],
      };
    } catch (error) {
      logger.error('Error getting sync statistics', { error, userId });
      throw error;
    }
  }
}

export const healthDataService = new HealthDataService();
