import api from './api';
import type {
  BloodworkTrend,
  BloodworkTrendSummary,
  BloodworkTrendsResponse,
  BloodworkTrendSummaryResponse,
  SupportedMarker,
  SupportedMarkersResponse,
  MarkerCategoriesResponse,
  TrendFilterOptions,
  GroupedBloodworkTrends,
  TrendDirection
} from '../types/bloodworkTrends';

class BloodworkTrendsService {
  // Get bloodwork trends for a user
  async getBloodworkTrends(
    userId: string,
    options?: TrendFilterOptions
  ): Promise<BloodworkTrendsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options?.category) {
        params.append('category', options.category);
      }
      
      if (options?.min_data_points) {
        params.append('min_data_points', options.min_data_points.toString());
      }

      const response = await api.get(
        `/bloodwork/trends/${userId}${params.toString() ? `?${params.toString()}` : ''}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching bloodwork trends:', error);
      return {
        success: false,
        error: 'Failed to fetch bloodwork trends'
      };
    }
  }

  // Get bloodwork trend summary for a user
  async getBloodworkTrendSummary(
    userId: string,
    category?: string
  ): Promise<BloodworkTrendSummaryResponse> {
    try {
      const params = category ? `?category=${category}` : '';
      
      const response = await api.get(
        `/bloodwork/trends/${userId}/summary${params}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching bloodwork trend summary:', error);
      return {
        success: false,
        error: 'Failed to fetch bloodwork trend summary'
      };
    }
  }

  // Get all supported trend markers
  async getSupportedMarkers(category?: string): Promise<SupportedMarkersResponse> {
    try {
      const params = category ? `?category=${category}` : '';
      
      const response = await api.get(
        `/bloodwork/trends/supported-markers${params}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching supported markers:', error);
      return {
        success: false,
        error: 'Failed to fetch supported markers'
      };
    }
  }

  // Get available marker categories
  async getMarkerCategories(): Promise<MarkerCategoriesResponse> {
    try {
      const response = await api.get('/bloodwork/trends/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching marker categories:', error);
      return {
        success: false,
        error: 'Failed to fetch marker categories'
      };
    }
  }

  // Group trends by category
  groupTrendsByCategory(trends: BloodworkTrend[]): GroupedBloodworkTrends {
    return trends.reduce((groups: GroupedBloodworkTrends, trend) => {
      const category = trend.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(trend);
      return groups;
    }, {});
  }

  // Filter trends by direction
  filterTrendsByDirection(
    trends: BloodworkTrend[],
    direction: TrendDirection
  ): BloodworkTrend[] {
    return trends.filter(trend => trend.trend_direction === direction);
  }

  // Get trend color based on direction
  getTrendColor(direction: TrendDirection): string {
    switch (direction) {
      case 'improving':
        return '#10B981'; // green
      case 'worsening':
        return '#EF4444'; // red
      case 'stable':
        return '#6B7280'; // gray
      case 'insufficient_data':
        return '#F59E0B'; // amber
      default:
        return '#6B7280';
    }
  }

  // Get trend icon based on direction
  getTrendIcon(direction: TrendDirection): string {
    switch (direction) {
      case 'improving':
        return '📈';
      case 'worsening':
        return '📉';
      case 'stable':
        return '➡️';
      case 'insufficient_data':
        return '❓';
      default:
        return '➡️';
    }
  }

  // Format trend direction for display
  formatTrendDirection(direction: TrendDirection): string {
    switch (direction) {
      case 'improving':
        return 'Improving';
      case 'worsening':
        return 'Worsening';
      case 'stable':
        return 'Stable';
      case 'insufficient_data':
        return 'Insufficient Data';
      default:
        return 'Unknown';
    }
  }

  // Format value with unit
  formatValue(value: number | string, unit?: string): string {
    if (typeof value === 'number') {
      return unit ? `${value.toFixed(1)} ${unit}` : value.toFixed(1);
    }
    return unit ? `${value} ${unit}` : value.toString();
  }

  // Format change for display
  formatChange(
    absoluteChange?: number,
    percentChange?: number,
    unit?: string
  ): string {
    if (absoluteChange !== undefined && absoluteChange !== 0) {
      const sign = absoluteChange > 0 ? '+' : '';
      const absText = `${sign}${absoluteChange.toFixed(1)}${unit || ''}`;
      
      if (percentChange !== undefined && percentChange !== 0) {
        return `${absText} (${percentChange.toFixed(1)}%)`;
      }
      
      return absText;
    }
    
    if (percentChange !== undefined && percentChange !== 0) {
      const sign = percentChange > 0 ? '+' : '';
      return `${sign}${percentChange.toFixed(1)}%`;
    }
    
    return 'No change';
  }

  // Format date range
  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    
    if (start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  }

  // Get trend summary statistics
  getTrendStatistics(trends: BloodworkTrend[]): {
    improving: number;
    worsening: number;
    stable: number;
    insufficient_data: number;
    total: number;
  } {
    const stats = {
      improving: 0,
      worsening: 0,
      stable: 0,
      insufficient_data: 0,
      total: trends.length
    };

    trends.forEach(trend => {
      stats[trend.trend_direction]++;
    });

    return stats;
  }

  // Check if trend is significant
  isTrendSignificant(trend: BloodworkTrend): boolean {
    if (trend.trend_direction === 'insufficient_data') {
      return false;
    }
    
    // Consider trends with at least 3 data points as significant
    if (trend.data_points >= 3) {
      return true;
    }
    
    // For 2 data points, check if change is significant
    if (trend.data_points === 2) {
      const threshold = 10; // 10% default threshold
      return Math.abs(trend.percent_change || 0) >= threshold;
    }
    
    return false;
  }

  // Get priority markers (those with significant changes or concerning directions)
  getPriorityMarkers(trends: BloodworkTrend[]): BloodworkTrend[] {
    return trends.filter(trend => {
      // Include worsening trends
      if (trend.trend_direction === 'worsening') {
        return true;
      }
      
      // Include significant improving trends
      if (trend.trend_direction === 'improving' && this.isTrendSignificant(trend)) {
        return true;
      }
      
      return false;
    });
  }

  // Sort trends by significance
  sortTrendsBySignificance(trends: BloodworkTrend[]): BloodworkTrend[] {
    return [...trends].sort((a, b) => {
      // Prioritize worsening trends
      if (a.trend_direction === 'worsening' && b.trend_direction !== 'worsening') {
        return -1;
      }
      if (a.trend_direction !== 'worsening' && b.trend_direction === 'worsening') {
        return 1;
      }
      
      // Then by data points (more data = more reliable)
      if (a.data_points !== b.data_points) {
        return b.data_points - a.data_points;
      }
      
      // Finally by percent change magnitude
      const aChange = Math.abs(a.percent_change || 0);
      const bChange = Math.abs(b.percent_change || 0);
      
      return bChange - aChange;
    });
  }
}

export const bloodworkTrendsService = new BloodworkTrendsService();
