import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_PREFERENCES_KEY = 'sync_preferences';

export interface SyncPreferences {
  automaticBPSync: boolean;
  automaticWatchSync: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'error' | 'pending';
  lastSyncError?: string;
}

const DEFAULT_PREFERENCES: SyncPreferences = {
  automaticBPSync: true,
  automaticWatchSync: true,
  lastSyncStatus: 'pending',
};

/**
 * Service for managing sync preferences
 */
export class SyncPreferencesService {
  
  /**
   * Get sync preferences for the current user
   */
  async getPreferences(): Promise<SyncPreferences> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_PREFERENCES_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error getting sync preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Save sync preferences
   */
  async savePreferences(preferences: SyncPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving sync preferences:', error);
      throw error;
    }
  }

  /**
   * Update automatic BP sync preference
   */
  async setAutomaticBPSync(enabled: boolean): Promise<void> {
    const preferences = await this.getPreferences();
    preferences.automaticBPSync = enabled;
    await this.savePreferences(preferences);
  }

  /**
   * Update automatic Watch sync preference
   */
  async setAutomaticWatchSync(enabled: boolean): Promise<void> {
    const preferences = await this.getPreferences();
    preferences.automaticWatchSync = enabled;
    await this.savePreferences(preferences);
  }

  /**
   * Update last sync time and status
   */
  async updateLastSync(
    status: 'success' | 'error' | 'pending',
    error?: string
  ): Promise<void> {
    const preferences = await this.getPreferences();
    preferences.lastSyncTime = new Date().toISOString();
    preferences.lastSyncStatus = status;
    if (error) {
      preferences.lastSyncError = error;
    }
    await this.savePreferences(preferences);
  }

  /**
   * Get automatic BP sync preference
   */
  async isAutomaticBPSyncEnabled(): Promise<boolean> {
    const preferences = await this.getPreferences();
    return preferences.automaticBPSync;
  }

  /**
   * Get automatic Watch sync preference
   */
  async isAutomaticWatchSyncEnabled(): Promise<boolean> {
    const preferences = await this.getPreferences();
    return preferences.automaticWatchSync;
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(): Promise<void> {
    await this.savePreferences(DEFAULT_PREFERENCES);
  }
}

export const syncPreferencesService = new SyncPreferencesService();
