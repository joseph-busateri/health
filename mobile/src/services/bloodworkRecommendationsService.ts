import api from './api';
import type {
  BloodworkRecommendation,
  BloodworkRecommendationsResponse,
  GenerateRecommendationsRequest,
  GenerateRecommendationsResponse,
  UpdateRecommendationStatusRequest,
  UpdateRecommendationStatusResponse,
  RecommendationFilterOptions,
  GroupedBloodworkRecommendations,
  RecommendationStatistics,
  RecommendationType,
  RecommendationSeverity,
  RecommendationStatus
} from '../types/bloodworkRecommendations';

class BloodworkRecommendationsService {
  // Generate recommendations for a user
  async generateRecommendations(
    userId: string,
    forceRegenerate = false
  ): Promise<GenerateRecommendationsResponse> {
    try {
      const response = await api.post(
        `/bloodwork/recommendations/generate/${userId}`,
        { force_regenerate: forceRegenerate }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        success: false,
        error: 'Failed to generate recommendations'
      };
    }
  }

  // Get all recommendations for a user
  async getRecommendations(
    userId: string,
    options?: RecommendationFilterOptions
  ): Promise<BloodworkRecommendationsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options?.status) {
        params.append('status', options.status);
      }
      
      if (options?.recommendation_type) {
        params.append('recommendation_type', options.recommendation_type);
      }
      
      if (options?.severity) {
        params.append('severity', options.severity);
      }
      
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      
      if (options?.offset) {
        params.append('offset', options.offset.toString());
      }

      const response = await api.get(
        `/bloodwork/recommendations/${userId}${params.toString() ? `?${params.toString()}` : ''}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return {
        success: false,
        error: 'Failed to fetch recommendations'
      };
    }
  }

  // Get active recommendations for a user
  async getActiveRecommendations(userId: string): Promise<BloodworkRecommendationsResponse> {
    try {
      const response = await api.get(`/bloodwork/recommendations/${userId}/active`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active recommendations:', error);
      return {
        success: false,
        error: 'Failed to fetch active recommendations'
      };
    }
  }

  // Update recommendation status
  async updateRecommendationStatus(
    recommendationId: string,
    status: RecommendationStatus
  ): Promise<UpdateRecommendationStatusResponse> {
    try {
      const response = await api.put(
        `/bloodwork/recommendations/${recommendationId}/status`,
        { status }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      return {
        success: false,
        error: 'Failed to update recommendation status'
      };
    }
  }

  // Group recommendations by category
  groupRecommendationsByCategory(recommendations: BloodworkRecommendation[]): GroupedBloodworkRecommendations {
    return recommendations.reduce((groups: GroupedBloodworkRecommendations, recommendation) => {
      const category = recommendation.recommendation_type || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(recommendation);
      return groups;
    }, {});
  }

  // Filter recommendations by status
  filterRecommendationsByStatus(
    recommendations: BloodworkRecommendation[],
    status: RecommendationStatus
  ): BloodworkRecommendation[] {
    return recommendations.filter(rec => rec.status === status);
  }

  // Filter recommendations by severity
  filterRecommendationsBySeverity(
    recommendations: BloodworkRecommendation[],
    severity: RecommendationSeverity
  ): BloodworkRecommendation[] {
    return recommendations.filter(rec => rec.severity === severity);
  }

  // Get recommendation color based on severity
  getRecommendationColor(severity: RecommendationSeverity): string {
    switch (severity) {
      case 'high':
        return '#DC2626'; // red
      case 'medium':
        return '#F59E0B'; // amber
      case 'low':
        return '#10B981'; // green
      default:
        return '#6B7280'; // gray
    }
  }

  // Get recommendation icon based on type
  getRecommendationIcon(type: RecommendationType): string {
    switch (type) {
      case 'cardiovascular':
        return '❤️';
      case 'metabolic':
        return '🍬';
      case 'hormonal':
        return '🧬';
      case 'inflammation':
        return '🔥';
      case 'follow_up':
        return '📅';
      case 'monitoring':
        return '👁️';
      case 'lifestyle':
        return '🏃';
      case 'supplement_review':
        return '💊';
      case 'workout_review':
        return '💪';
      default:
        return '📋';
    }
  }

  // Format recommendation type for display
  formatRecommendationType(type: RecommendationType): string {
    switch (type) {
      case 'cardiovascular':
        return 'Cardiovascular';
      case 'metabolic':
        return 'Metabolic';
      case 'hormonal':
        return 'Hormonal';
      case 'inflammation':
        return 'Inflammation';
      case 'follow_up':
        return 'Follow Up';
      case 'monitoring':
        return 'Monitoring';
      case 'lifestyle':
        return 'Lifestyle';
      case 'supplement_review':
        return 'Supplement Review';
      case 'workout_review':
        return 'Workout Review';
      default:
        return 'Other';
    }
  }

  // Format severity for display
  formatSeverity(severity: RecommendationSeverity): string {
    switch (severity) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  }

  // Format status for display
  formatStatus(status: RecommendationStatus): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'superseded':
        return 'Superseded';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Unknown';
    }
  }

  // Get status color
  getStatusColor(status: RecommendationStatus): string {
    switch (status) {
      case 'active':
        return '#10B981'; // green
      case 'superseded':
        return '#6B7280'; // gray
      case 'resolved':
        return '#3B82F6'; // blue
      default:
        return '#6B7280'; // gray
    }
  }

  // Format confidence as percentage
  formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
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

  // Get recommendation statistics
  getRecommendationStatistics(recommendations: BloodworkRecommendation[]): RecommendationStatistics {
    const stats: RecommendationStatistics = {
      total: recommendations.length,
      active: 0,
      by_type: {} as Record<RecommendationType, number>,
      by_severity: {} as Record<RecommendationSeverity, number>,
      by_status: {} as Record<RecommendationStatus, number>
    };

    recommendations.forEach(rec => {
      // Count by status
      stats.active = rec.status === 'active' ? stats.active + 1 : stats.active;
      stats.by_status[rec.status] = (stats.by_status[rec.status] || 0) + 1;

      // Count by type
      stats.by_type[rec.recommendation_type] = (stats.by_type[rec.recommendation_type] || 0) + 1;

      // Count by severity
      stats.by_severity[rec.severity] = (stats.by_severity[rec.severity] || 0) + 1;
    });

    return stats;
  }

  // Sort recommendations by priority (severity high to low, then by date)
  sortRecommendationsByPriority(recommendations: BloodworkRecommendation[]): BloodworkRecommendation[] {
    return [...recommendations].sort((a, b) => {
      // First sort by severity (high > medium > low)
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const aSeverity = severityOrder[a.severity] || 0;
      const bSeverity = severityOrder[b.severity] || 0;
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }

      // Then sort by confidence (higher first)
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }

      // Finally sort by created date (newer first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  // Get priority recommendations (high severity active recommendations)
  getPriorityRecommendations(recommendations: BloodworkRecommendation[]): BloodworkRecommendation[] {
    return recommendations
      .filter(rec => rec.status === 'active' && rec.severity === 'high')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Check if recommendation is recent (created within last 7 days)
  isRecommendationRecent(recommendation: BloodworkRecommendation): boolean {
    const createdDate = new Date(recommendation.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return createdDate > sevenDaysAgo;
  }

  // Get recommendations that need attention (active high/medium severity)
  getRecommendationsNeedingAttention(recommendations: BloodworkRecommendation[]): BloodworkRecommendation[] {
    return recommendations.filter(rec => 
      rec.status === 'active' && 
      (rec.severity === 'high' || rec.severity === 'medium')
    );
  }

  // Calculate recommendation trend window text
  getTrendWindowText(recommendation: BloodworkRecommendation): string {
    const { source_trend_window } = recommendation;
    const dataPoints = source_trend_window.data_points;
    const dateRange = this.formatDateRange(
      source_trend_window.start_date,
      source_trend_window.end_date
    );
    
    return `Based on ${dataPoints} data points from ${dateRange}`;
  }
}

export const bloodworkRecommendationsService = new BloodworkRecommendationsService();
