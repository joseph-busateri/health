import {
  PointInTimeState,
  StateComparison,
  ChangeEvent,
  AvailableDates
} from '../types/pointInTime';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

class PointInTimeService {
  // Get current effective state for a user
  async getCurrentState(userId: string): Promise<PointInTimeState> {
    try {
      const response = await fetch(`${API_BASE_URL}/state/current/${userId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get current state');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting current state:', error);
      throw error;
    }
  }

  // Get historical state as of a specific date
  async getHistoricalState(userId: string, date: string, includeChanges: boolean = false): Promise<PointInTimeState> {
    try {
      const url = new URL(`${API_BASE_URL}/state/as-of/${userId}`);
      url.searchParams.append('date', date);
      if (includeChanges) {
        url.searchParams.append('include_changes', 'true');
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get historical state');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting historical state:', error);
      throw error;
    }
  }

  // Compare current state with historical state
  async compareStates(userId: string, historicalDate: string, currentDate?: string): Promise<StateComparison> {
    try {
      const url = new URL(`${API_BASE_URL}/state/compare/${userId}`);
      url.searchParams.append('historical_date', historicalDate);
      if (currentDate) {
        url.searchParams.append('current_date', currentDate);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to compare states');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error comparing states:', error);
      throw error;
    }
  }

  // Get change events for a user
  async getChangeEvents(
    userId: string,
    options?: {
      entityType?: string;
      entityId?: string;
      limit?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ change_events: ChangeEvent[], total: number }> {
    try {
      const url = new URL(`${API_BASE_URL}/state/changes/${userId}`);
      
      if (options?.entityType) {
        url.searchParams.append('entity_type', options.entityType);
      }
      if (options?.entityId) {
        url.searchParams.append('entity_id', options.entityId);
      }
      if (options?.limit) {
        url.searchParams.append('limit', options.limit.toString());
      }
      if (options?.startDate) {
        url.searchParams.append('start_date', options.startDate);
      }
      if (options?.endDate) {
        url.searchParams.append('end_date', options.endDate);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get change events');
      }
      
      const result = await response.json();
      return {
        change_events: result.data.change_events,
        total: result.data.total
      };
    } catch (error) {
      console.error('Error getting change events:', error);
      throw error;
    }
  }

  // Get available dates for state reconstruction
  async getAvailableDates(userId: string): Promise<AvailableDates> {
    try {
      const response = await fetch(`${API_BASE_URL}/state/dates/${userId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get available dates');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting available dates:', error);
      throw error;
    }
  }

  // Health check for point-in-time service
  async healthCheck(): Promise<{ status: string, services: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/state/health`);
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Helper method to format date for API
  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  // Helper method to format date for display
  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Helper method to check if a date is today
  isToday(dateString: string): boolean {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  }

  // Helper method to get relative date description
  getRelativeDateDescription(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}

export default new PointInTimeService();
