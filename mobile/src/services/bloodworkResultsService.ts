import api from './api';
import type {
  BloodworkResult,
  BloodworkResultsResponse,
  BloodworkTimelineResponse,
  ParseBloodworkResponse,
  GroupedBloodworkResult
} from '../types/bloodworkResults';

class BloodworkResultsService {
  private baseUrl = '/bloodwork';

  /**
   * Parse a bloodwork document and extract results
   */
  async parseBloodworkDocument(documentId: string, userId?: string): Promise<ParseBloodworkResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/parse/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error parsing bloodwork document:', error);
      return {
        success: false,
        error: 'Failed to parse bloodwork document',
        message: 'Network error occurred'
      };
    }
  }

  /**
   * Get bloodwork results for a user
   */
  async getBloodworkResults(
    userId: string,
    options?: {
      document_id?: string;
      normalized_test_name?: string;
      category?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<BloodworkResultsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options?.document_id) params.append('document_id', options.document_id);
      if (options?.normalized_test_name) params.append('normalized_test_name', options.normalized_test_name);
      if (options?.category) params.append('category', options.category);
      if (options?.start_date) params.append('start_date', options.start_date);
      if (options?.end_date) params.append('end_date', options.end_date);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`${this.baseUrl}/results/${userId}?${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting bloodwork results:', error);
      return {
        success: false,
        error: 'Failed to retrieve bloodwork results',
        message: 'Network error occurred'
      };
    }
  }

  /**
   * Get bloodwork results for a specific document
   */
  async getBloodworkResultsByDocument(documentId: string, userId?: string): Promise<BloodworkResultsResponse> {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await fetch(`${this.baseUrl}/results/document/${documentId}${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting bloodwork results by document:', error);
      return {
        success: false,
        error: 'Failed to retrieve bloodwork results for document',
        message: 'Network error occurred'
      };
    }
  }

  /**
   * Get bloodwork timeline for a user
   */
  async getBloodworkTimeline(userId: string, limit?: number): Promise<BloodworkTimelineResponse> {
    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await fetch(`${this.baseUrl}/results/${userId}/timeline${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting bloodwork timeline:', error);
      return {
        success: false,
        error: 'Failed to retrieve bloodwork timeline',
        message: 'Network error occurred'
      };
    }
  }

  /**
   * Group bloodwork results by normalized test name for timeline view
   */
  groupResultsForTimeline(results: BloodworkResult[]): GroupedBloodworkResult[] {
    const grouped: Record<string, GroupedBloodworkResult> = {};

    results.forEach(result => {
      const key = result.normalized_test_name || result.raw_test_name;
      
      if (!grouped[key]) {
        grouped[key] = {
          normalized_test_name: result.normalized_test_name,
          raw_test_name: result.raw_test_name,
          category: result.category,
          results: []
        };
      }

      grouped[key].results.push({
        test_date: result.test_date || '',
        value: result.value_text || '',
        value_numeric: result.value_numeric,
        unit: result.unit,
        abnormal_flag: result.abnormal_flag,
        confidence: result.confidence,
        document_id: result.document_id
      });
    });

    // Sort results within each group by date
    Object.values(grouped).forEach(group => {
      group.results.sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());
    });

    // Return sorted groups by test name
    return Object.values(grouped).sort((a, b) => 
      (a.normalized_test_name || a.raw_test_name).localeCompare(b.normalized_test_name || b.raw_test_name)
    );
  }

  /**
   * Format value for display
   */
  formatValue(result: BloodworkResult): string {
    if (result.value_text) {
      return result.value_text;
    }
    if (result.value_numeric !== undefined) {
      const value = result.value_numeric.toString();
      return result.unit ? `${value} ${result.unit}` : value;
    }
    return 'N/A';
  }

  /**
   * Get reference range display text
   */
  getReferenceRangeDisplay(result: BloodworkResult): string {
    if (result.reference_range_text) {
      return result.reference_range_text;
    }
    if (result.reference_range_low !== undefined && result.reference_range_high !== undefined) {
      return `${result.reference_range_low} - ${result.reference_range_high}${result.unit || ''}`;
    }
    if (result.reference_range_low !== undefined) {
      return `≥ ${result.reference_range_low}${result.unit || ''}`;
    }
    if (result.reference_range_high !== undefined) {
      return `≤ ${result.reference_range_high}${result.unit || ''}`;
    }
    return '';
  }

  /**
   * Check if result is abnormal
   */
  isAbnormal(result: BloodworkResult): boolean {
    if (result.abnormal_flag !== undefined) {
      return result.abnormal_flag;
    }
    
    // Check against reference ranges
    if (result.value_numeric !== undefined) {
      if (result.reference_range_low !== undefined && result.value_numeric < result.reference_range_low) {
        return true;
      }
      if (result.reference_range_high !== undefined && result.value_numeric > result.reference_range_high) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get confidence display color
   */
  getConfidenceColor(confidence?: number): string {
    if (!confidence) return '#9CA3AF'; // gray-400
    if (confidence >= 0.9) return '#10B981'; // green-500
    if (confidence >= 0.7) return '#F59E0B'; // amber-500
    return '#EF4444'; // red-500
  }

  /**
   * Get confidence display text
   */
  getConfidenceText(confidence?: number): string {
    if (!confidence) return 'Unknown';
    return `${Math.round(confidence * 100)}%`;
  }

  /**
   * Sort results by category and test name
   */
  sortResults(results: BloodworkResult[]): BloodworkResult[] {
    return [...results].sort((a, b) => {
      // First sort by category
      const categoryA = a.category || 'Other';
      const categoryB = b.category || 'Other';
      const categoryComparison = categoryA.localeCompare(categoryB);
      
      if (categoryComparison !== 0) {
        return categoryComparison;
      }
      
      // Then sort by normalized name, falling back to raw name
      const nameA = a.normalized_test_name || a.raw_test_name;
      const nameB = b.normalized_test_name || b.raw_test_name;
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Filter results by category
   */
  filterByCategory(results: BloodworkResult[], category?: string): BloodworkResult[] {
    if (!category) return results;
    return results.filter(result => result.category === category);
  }

  /**
   * Get available categories from results
   */
  getAvailableCategories(results: BloodworkResult[]): string[] {
    const categories = results
      .map(result => result.category)
      .filter((category): category is string => category !== undefined);
    return [...new Set(categories)].sort();
  }
}

export const bloodworkResultsService = new BloodworkResultsService();
