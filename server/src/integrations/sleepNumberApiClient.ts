// Sleep Number API Client
// Direct integration with Sleep Number API for automatic data sync

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface SleepNumberAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface SleepNumberSleepData {
  date: string;
  sleeperId: string;
  bedId: string;
  sleepIQ: number;
  totalSleepTime: number;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  awakeTime: number;
  restlessTime: number;
  restfulTime: number;
  avgHeartRate: number;
  avgRespiratoryRate: number;
  inBedTime: string;
  outOfBedTime: string;
  sleepNumber: number;
  [key: string]: any;
}

export class SleepNumberApiClient {
  private baseUrl: string = 'https://prod-api.sleepiq.sleepnumber.com';
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      withCredentials: true, // Enable cookie handling
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SleepIQ/1.0 (iPhone; iOS 16.0; Scale/3.00)',
        'Host': 'prod-api.sleepiq.sleepnumber.com',
      },
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth as both header and query parameter
        if (this.accessToken) {
          config.headers['X-Key'] = this.accessToken;
          config.params = {
            ...config.params,
            key: this.accessToken,
          };
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Sleep Number doesn't support token refresh
        // If token expires, user needs to re-authenticate
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with Sleep Number API
   */
  async login(email: string, password: string): Promise<SleepNumberAuthTokens> {
    try {
      // Use the correct SleepIQ REST API v1 endpoint
      const response = await this.client.put('/rest/login', {
        login: email,
        password: password,
      });

      const { key, userId, expires } = response.data;

      logger.info('Sleep Number login response', { key, userId, expires });

      this.accessToken = key;
      this.refreshToken = key; // Sleep Number uses same key

      // Handle expires field - it might be null or in an unexpected format
      if (expires) {
        try {
          this.tokenExpiresAt = new Date(expires);
        } catch (e) {
          // If date parsing fails, set expiry to 24 hours from now
          logger.warn('Failed to parse expires date, using 24h default', { expires, error: e });
          this.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
      } else {
        // No expires field, set to 24 hours from now
        logger.warn('No expires field in response, using 24h default');
        this.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      logger.info('Sleep Number login successful', { userId, tokenExpiresAt: this.tokenExpiresAt });

      return {
        accessToken: key,
        refreshToken: key,
        expiresAt: this.tokenExpiresAt,
      };
    } catch (error: any) {
      logger.error('Sleep Number login failed', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });

      // Return more detailed error message
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(`Failed to authenticate with Sleep Number: ${errorMsg}`);
    }
  }

  /**
   * Set authentication tokens
   */
  setTokens(tokens: SleepNumberAuthTokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiresAt = tokens.expiresAt;
  }

  /**
   * Get user's beds
   */
  async getBeds(): Promise<any[]> {
    try {
      const response = await this.client.get('/rest/bed');
      return response.data.beds || [];
    } catch (error) {
      logger.error('Failed to get beds', { error });
      throw error;
    }
  }

  /**
   * Get sleep data for a date range
   */
  async getSleepData(
    bedId: string,
    startDate: string,
    endDate: string
  ): Promise<SleepNumberSleepData[]> {
    try {
      const response = await this.client.get(`/rest/sleepData`, {
        params: {
          bedId,
          date: startDate,
          interval: this.calculateDaysBetween(startDate, endDate),
        },
      });

      const sleepData = response.data.sleepData || [];
      
      logger.info('Sleep data fetched', {
        bedId,
        startDate,
        endDate,
        sessionCount: sleepData.length,
      });

      return sleepData.map((session: any) => this.normalizeSleepData(session));
    } catch (error: any) {
      logger.error('Failed to get sleep data', { 
        error: error.message,
        bedId,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  /**
   * Get sleep data for a specific date
   */
  async getSleepDataForDate(bedId: string, date: string): Promise<SleepNumberSleepData | null> {
    try {
      const sessions = await this.getSleepData(bedId, date, date);
      return sessions.length > 0 ? sessions[0] : null;
    } catch (error) {
      logger.error('Failed to get sleep data for date', { error, bedId, date });
      throw error;
    }
  }

  /**
   * Get recent sleep data (last N days)
   */
  async getRecentSleepData(bedId: string, days: number = 7): Promise<SleepNumberSleepData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await this.getSleepData(
        bedId,
        this.formatDate(startDate),
        this.formatDate(endDate)
      );
    } catch (error) {
      logger.error('Failed to get recent sleep data', { error, bedId, days });
      throw error;
    }
  }

  /**
   * Get sleeper information
   */
  async getSleeperInfo(bedId: string): Promise<any> {
    try {
      const response = await this.client.get(`/bed/${bedId}/sleeper`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get sleeper info', { error: error.message, bedId });
      throw error;
    }
  }

  /**
   * Normalize sleep data from API response
   */
  private normalizeSleepData(session: any): SleepNumberSleepData {
    return {
      date: session.date || session.sleepDate,
      sleeperId: session.sleeperId,
      bedId: session.bedId,
      sleepIQ: session.sleepIQ || session.sleepScore || 0,
      totalSleepTime: session.totalSleepTime || session.sleepDuration || 0,
      deepSleep: session.deepSleep || 0,
      lightSleep: session.lightSleep || 0,
      remSleep: session.remSleep || session.REM || 0,
      awakeTime: session.awakeTime || 0,
      restlessTime: session.restlessTime || 0,
      restfulTime: session.restfulTime || 0,
      avgHeartRate: session.avgHeartRate || session.heartRate || 0,
      avgRespiratoryRate: session.avgRespiratoryRate || session.respiratoryRate || 0,
      inBedTime: session.inBedTime || session.bedtimeStart || '',
      outOfBedTime: session.outOfBedTime || session.bedtimeEnd || '',
      sleepNumber: session.sleepNumber || session.firmness || 0,
      ...session, // Include all other fields
    };
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getBeds();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await this.client.put('/logout');
      }
    } catch (error) {
      logger.error('Logout failed', { error });
    } finally {
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiresAt = null;
    }
  }
}

export const sleepNumberApiClient = new SleepNumberApiClient();
