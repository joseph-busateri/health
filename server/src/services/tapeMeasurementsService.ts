// Tape Measurements Service
// Comprehensive body measurement tracking

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface TapeMeasurement {
  id?: string;
  userId: string;
  measurementDate: string;
  measurementTypeId: string;
  measurementName: string;
  valueInches: number;
  notes?: string;
}

export interface MeasurementType {
  id: string;
  measurementName: string;
  bodyPart: string;
  description?: string;
  displayOrder: number;
}

export interface MeasurementProgress {
  measurementDate: string;
  valueInches: number;
  changeFromPrevious?: number;
}

export interface MeasurementTrend {
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  totalChange: number;
  percentChange: number;
  avgValue: number;
}

export interface MeasurementGoal {
  id?: string;
  userId: string;
  measurementTypeId: string;
  measurementName: string;
  goalType: 'increase' | 'decrease' | 'maintain';
  startingValue: number;
  targetValue: number;
  targetDate?: string;
  status?: string;
}

export class TapeMeasurementsService {
  
  /**
   * Log a tape measurement
   */
  async logMeasurement(measurement: TapeMeasurement): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('tape_measurements')
        .insert({
          user_id: measurement.userId,
          measurement_date: measurement.measurementDate,
          measurement_type_id: measurement.measurementTypeId,
          measurement_name: measurement.measurementName,
          value_inches: measurement.valueInches,
          notes: measurement.notes,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Tape measurement logged', {
        userId: measurement.userId,
        measurement: measurement.measurementName,
        measurementId: data.id,
      });

      return data.id;
    } catch (error) {
      logger.error('Error logging tape measurement', { error, measurement });
      throw error;
    }
  }

  /**
   * Log multiple measurements in a session
   */
  async logMeasurementSession(
    userId: string,
    measurementDate: string,
    measurements: Array<{ measurementTypeId: string; measurementName: string; valueInches: number }>,
    notes?: string
  ): Promise<string[]> {
    try {
      const measurementIds: string[] = [];

      for (const m of measurements) {
        const id = await this.logMeasurement({
          userId,
          measurementDate,
          measurementTypeId: m.measurementTypeId,
          measurementName: m.measurementName,
          valueInches: m.valueInches,
        });
        measurementIds.push(id);
      }

      logger.info('Measurement session logged', {
        userId,
        measurementCount: measurements.length,
      });

      return measurementIds;
    } catch (error) {
      logger.error('Error logging measurement session', { error, userId });
      throw error;
    }
  }

  /**
   * Get all measurement types
   */
  async getMeasurementTypes(): Promise<MeasurementType[]> {
    try {
      const { data, error } = await supabase
        .from('measurement_types')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting measurement types', { error });
      throw error;
    }
  }

  /**
   * Get measurement types by body part
   */
  async getMeasurementTypesByBodyPart(bodyPart: string): Promise<MeasurementType[]> {
    try {
      const { data, error } = await supabase
        .from('measurement_types')
        .select('*')
        .eq('body_part', bodyPart)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting measurement types by body part', { error, bodyPart });
      throw error;
    }
  }

  /**
   * Get measurement progress over time
   */
  async getMeasurementProgress(
    userId: string,
    measurementTypeId: string,
    days: number = 90
  ): Promise<MeasurementProgress[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_measurement_progress', {
          p_user_id: userId,
          p_measurement_type_id: measurementTypeId,
          p_days: days,
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting measurement progress', { error, userId, measurementTypeId });
      throw error;
    }
  }

  /**
   * Get all measurements for a specific date
   */
  async getMeasurementsByDate(userId: string, measurementDate: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_measurements_by_date', {
          p_user_id: userId,
          p_measurement_date: measurementDate,
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting measurements by date', { error, userId, measurementDate });
      throw error;
    }
  }

  /**
   * Get latest measurements for all types
   */
  async getLatestMeasurements(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tape_measurements')
        .select(`
          *,
          measurement_types (
            measurement_name,
            body_part
          )
        `)
        .eq('user_id', userId)
        .order('measurement_date', { ascending: false });

      if (error) throw error;

      // Get unique latest measurements
      const latestMap = new Map();
      data?.forEach(m => {
        if (!latestMap.has(m.measurement_type_id)) {
          latestMap.set(m.measurement_type_id, m);
        }
      });

      return Array.from(latestMap.values());
    } catch (error) {
      logger.error('Error getting latest measurements', { error, userId });
      throw error;
    }
  }

  /**
   * Calculate measurement trend
   */
  async calculateTrend(
    userId: string,
    measurementTypeId: string,
    days: number = 90
  ): Promise<MeasurementTrend> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_measurement_trend', {
          p_user_id: userId,
          p_measurement_type_id: measurementTypeId,
          p_days: days,
        });

      if (error) throw error;

      return data[0] || {
        trendDirection: 'stable',
        totalChange: 0,
        percentChange: 0,
        avgValue: 0,
      };
    } catch (error) {
      logger.error('Error calculating measurement trend', { error, userId, measurementTypeId });
      throw error;
    }
  }

  /**
   * Create a measurement goal
   */
  async createGoal(goal: MeasurementGoal): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('measurement_goals')
        .insert({
          user_id: goal.userId,
          measurement_type_id: goal.measurementTypeId,
          measurement_name: goal.measurementName,
          goal_type: goal.goalType,
          starting_value: goal.startingValue,
          target_value: goal.targetValue,
          target_date: goal.targetDate,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Measurement goal created', {
        userId: goal.userId,
        goalId: data.id,
      });

      return data.id;
    } catch (error) {
      logger.error('Error creating measurement goal', { error, goal });
      throw error;
    }
  }

  /**
   * Get active goals for user
   */
  async getActiveGoals(userId: string): Promise<MeasurementGoal[]> {
    try {
      const { data, error } = await supabase
        .from('measurement_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting active goals', { error, userId });
      throw error;
    }
  }

  /**
   * Check goal progress
   */
  async checkGoalProgress(goalId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('check_measurement_goal_progress', {
          p_goal_id: goalId,
        });

      if (error) throw error;

      return data[0] || null;
    } catch (error) {
      logger.error('Error checking goal progress', { error, goalId });
      throw error;
    }
  }

  /**
   * Get measurement summary for user
   */
  async getMeasurementSummary(userId: string): Promise<{
    totalMeasurements: number;
    latestSessionDate: string | null;
    activeGoals: number;
    achievedGoals: number;
    mostImprovedMeasurement: { name: string; change: number } | null;
  }> {
    try {
      // Get total measurements
      const { data: allMeasurements } = await supabase
        .from('tape_measurements')
        .select('id')
        .eq('user_id', userId);

      // Get latest session
      const { data: latestSession } = await supabase
        .from('measurement_sessions')
        .select('session_date')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .limit(1);

      // Get goals
      const { data: activeGoals } = await supabase
        .from('measurement_goals')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      const { data: achievedGoals } = await supabase
        .from('measurement_goals')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'achieved');

      // Get most improved measurement (simplified)
      const { data: measurements } = await supabase
        .from('tape_measurements')
        .select('measurement_name, value_inches, measurement_date')
        .eq('user_id', userId)
        .order('measurement_date', { ascending: false })
        .limit(100);

      let mostImprovedMeasurement = null;
      if (measurements && measurements.length > 0) {
        // Calculate changes for each measurement type
        const changeMap = new Map();
        measurements.forEach(m => {
          if (!changeMap.has(m.measurement_name)) {
            changeMap.set(m.measurement_name, []);
          }
          changeMap.get(m.measurement_name).push(m.value_inches);
        });

        let maxChange = 0;
        let maxChangeName = '';
        changeMap.forEach((values, name) => {
          if (values.length >= 2) {
            const change = Math.abs(values[0] - values[values.length - 1]);
            if (change > maxChange) {
              maxChange = change;
              maxChangeName = name;
            }
          }
        });

        if (maxChangeName) {
          mostImprovedMeasurement = {
            name: maxChangeName,
            change: Math.round(maxChange * 100) / 100,
          };
        }
      }

      return {
        totalMeasurements: allMeasurements?.length || 0,
        latestSessionDate: latestSession?.[0]?.session_date || null,
        activeGoals: activeGoals?.length || 0,
        achievedGoals: achievedGoals?.length || 0,
        mostImprovedMeasurement,
      };
    } catch (error) {
      logger.error('Error getting measurement summary', { error, userId });
      throw error;
    }
  }
}

export const tapeMeasurementsService = new TapeMeasurementsService();
