// Oura Ring API Client
// OAuth-based API client with automatic token refresh

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface OuraTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface OuraSleepSession {
  id: string;
  day: string;
  bedtime_start: string;
  bedtime_end: string;
  total_sleep_duration: number;
  awake_time: number;
  rem_sleep_duration: number;
  light_sleep_duration: number;
  deep_sleep_duration: number;
  sleep_score_total: number;
  sleep_score_disturbances: number;
  sleep_score_efficiency: number;
  sleep_score_latency: number;
  sleep_score_rem: number;
  sleep_score_deep: number;
  sleep_score_alignment: number;
  efficiency: number;
  latency: number;
  timing: number;
  midpoint_time: number;
  restless_periods: number;
  lowest_heart_rate: number;
  average_heart_rate: number;
  average_hrv: number;
  average_breath: number;
  temperature_delta: number;
  temperature_trend_deviation: number;
  type: string;
}

export interface OuraReadiness {
  id: string;
  day: string;
  score: number;
  temperature_deviation: number;
  temperature_trend_deviation: number;
  activity_balance: number;
  previous_day_activity: number;
  sleep_balance: number;
  previous_night: number;
  sleep_regularity: number;
  recovery_index: number;
  resting_heart_rate: number;
  hrv_balance: number;
}

export interface OuraActivity {
  id: string;
  day: string;
  score: number;
  inactive_time: number;
  low_activity_time: number;
  medium_activity_time: number;
  high_activity_time: number;
  steps: number;
  daily_movement: number;
  total_calories: number;
  active_calories: number;
  training_frequency: string;
  training_volume: number;
  target_calories: number;
  target_meters: number;
  met_daily_targets: number;
  inactivity_alerts: number;
  equivalent_walking_distance: number;
}

export interface OuraWorkout {
  id: string;
  day: string;
  start_datetime: string;
  end_datetime: string;
  activity: string;
  intensity: string;
  calories: number;
  distance: number;
  source: string;
}

export class OuraApiClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://api.ouraring.com/v2',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Check if token needs refresh
        if (this.tokenExpiresAt && new Date() >= this.tokenExpiresAt) {
          await this.refreshAccessToken();
        }

        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle 401 errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication tokens
   */
  setTokens(tokens: OuraTokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken || null;
    this.tokenExpiresAt = tokens.expiresAt;
  }

  /**
   * Authenticate with Oura API using OAuth code
   */
  async login(code: string, redirectUri: string): Promise<OuraTokens> {
    try {
      const response = await axios.post('https://api.ouraring.com/oauth/token', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.OURA_CLIENT_ID,
        client_secret: process.env.OURA_CLIENT_SECRET,
      });

      const tokens: OuraTokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      };

      this.setTokens(tokens);

      logger.info('Oura OAuth login successful');

      return tokens;
    } catch (error) {
      logger.error('Oura OAuth login failed', { error });
      throw new Error('Failed to authenticate with Oura API');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<OuraTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('https://api.ouraring.com/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: process.env.OURA_CLIENT_ID,
        client_secret: process.env.OURA_CLIENT_SECRET,
      });

      const tokens: OuraTokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || this.refreshToken,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      };

      this.setTokens(tokens);

      logger.info('Oura access token refreshed');

      return tokens;
    } catch (error) {
      logger.error('Failed to refresh Oura access token', { error });
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get personal info
   */
  async getPersonalInfo(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/usercollection/personal_info');
      return response.data;
    } catch (error) {
      logger.error('Error getting personal info', { error });
      throw error;
    }
  }

  /**
   * Get sleep sessions for date range
   */
  async getSleepSessions(startDate: string, endDate: string): Promise<OuraSleepSession[]> {
    try {
      const response = await this.axiosInstance.get('/usercollection/daily_sleep', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      logger.info('Oura sleep sessions retrieved', { 
        count: response.data.data?.length || 0,
        startDate,
        endDate,
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Error getting sleep sessions', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Get readiness data for date range
   */
  async getReadinessData(startDate: string, endDate: string): Promise<OuraReadiness[]> {
    try {
      const response = await this.axiosInstance.get('/usercollection/daily_readiness', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      logger.info('Oura readiness data retrieved', { 
        count: response.data.data?.length || 0,
        startDate,
        endDate,
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Error getting readiness data', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Get activity data for date range
   */
  async getActivityData(startDate: string, endDate: string): Promise<OuraActivity[]> {
    try {
      const response = await this.axiosInstance.get('/usercollection/daily_activity', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      logger.info('Oura activity data retrieved', { 
        count: response.data.data?.length || 0,
        startDate,
        endDate,
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Error getting activity data', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Get workouts for date range
   */
  async getWorkouts(startDate: string, endDate: string): Promise<OuraWorkout[]> {
    try {
      const response = await this.axiosInstance.get('/usercollection/workout', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      logger.info('Oura workouts retrieved', { 
        count: response.data.data?.length || 0,
        startDate,
        endDate,
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Error getting workouts', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getPersonalInfo();
      return true;
    } catch (error) {
      logger.error('Oura API connection test failed', { error });
      return false;
    }
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    logger.info('Oura API client logged out');
  }
}

export const ouraApiClient = new OuraApiClient();
