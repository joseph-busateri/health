import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bloodworkRecommendationsService } from '../services/bloodworkRecommendationsService';
import type {
  BloodworkRecommendationsScreenProps,
  BloodworkRecommendation,
  GroupedBloodworkRecommendations,
  RecommendationType,
  RecommendationSeverity,
  RecommendationStatus
} from '../types/bloodworkRecommendations';

const screenWidth = Dimensions.get('window').width;

const BloodworkRecommendationsScreen: React.FC<BloodworkRecommendationsScreenProps> = ({ userId }) => {
  const [recommendations, setRecommendations] = useState<BloodworkRecommendation[]>([]);
  const [groupedRecommendations, setGroupedRecommendations] = useState<GroupedBloodworkRecommendations>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<RecommendationStatus | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = showActiveOnly 
        ? await bloodworkRecommendationsService.getActiveRecommendations(userId)
        : await bloodworkRecommendationsService.getRecommendations(userId);

      if (response.success && response.data) {
        setRecommendations(response.data.recommendations);
        setGroupedRecommendations(bloodworkRecommendationsService.groupRecommendationsByCategory(response.data.recommendations));
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch bloodwork recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      Alert.alert('Error', 'Failed to fetch bloodwork recommendations');
    }
  }, [userId, showActiveOnly]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecommendations();
    setRefreshing(false);
  }, [fetchRecommendations]);

  const generateRecommendations = useCallback(async () => {
    setGenerating(true);
    try {
      const response = await bloodworkRecommendationsService.generateRecommendations(userId, true);
      
      if (response.success && response.data) {
        Alert.alert(
          'Success',
          `Generated ${response.data.generated_count} new recommendations${response.data.superseded_count > 0 ? ` and superseded ${response.data.superseded_count} old ones` : ''}`
        );
        await fetchRecommendations();
      } else {
        Alert.alert('Error', response.error || 'Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Alert.alert('Error', 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  }, [userId, fetchRecommendations]);

  const updateRecommendationStatus = useCallback(async (recommendationId: string, status: RecommendationStatus) => {
    try {
      const response = await bloodworkRecommendationsService.updateRecommendationStatus(recommendationId, status);
      
      if (response.success) {
        await fetchRecommendations();
      } else {
        Alert.alert('Error', response.error || 'Failed to update recommendation status');
      }
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      Alert.alert('Error', 'Failed to update recommendation status');
    }
  }, [fetchRecommendations]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRecommendations().finally(() => setLoading(false));
    }, [fetchRecommendations])
  );

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filterRecommendationsByCategory = (category: string | null) => {
    if (category === selectedCategory) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const filterRecommendationsByStatus = (status: RecommendationStatus | null) => {
    setSelectedStatus(status);
  };

  const getFilteredRecommendations = () => {
    let filtered = recommendations;

    if (selectedCategory) {
      filtered = filtered.filter(rec => rec.recommendation_type === selectedCategory);
    }

    if (selectedStatus) {
      filtered = filtered.filter(rec => rec.status === selectedStatus);
    }

    return filtered;
  };

  const getFilteredGroupedRecommendations = () => {
    if (!selectedCategory && !selectedStatus) {
      return groupedRecommendations;
    }

    const filtered = getFilteredRecommendations();
    return bloodworkRecommendationsService.groupRecommendationsByCategory(filtered);
  };

  const renderRecommendationItem = (recommendation: BloodworkRecommendation) => {
    const severityColor = bloodworkRecommendationsService.getRecommendationColor(recommendation.severity);
    const typeIcon = bloodworkRecommendationsService.getRecommendationIcon(recommendation.recommendation_type);
    const statusColor = bloodworkRecommendationsService.getStatusColor(recommendation.status);
    const isRecent = bloodworkRecommendationsService.isRecommendationRecent(recommendation);

    return (
      <View key={recommendation.id} style={[styles.recommendationItem, { borderLeftColor: severityColor }]}>
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationTitleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.typeIcon}>{typeIcon}</Text>
              <Text style={styles.recommendationTitle}>{recommendation.recommendation_title}</Text>
              {isRecent && (
                <View style={styles.recentBadge}>
                  <Text style={styles.recentText}>New</Text>
                </View>
              )}
            </View>
            <View style={styles.recommendationMeta}>
              <View style={styles.severityContainer}>
                <Text style={[styles.severityText, { color: severityColor }]}>
                  {bloodworkRecommendationsService.formatSeverity(recommendation.severity)}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {bloodworkRecommendationsService.formatStatus(recommendation.status)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>
              {bloodworkRecommendationsService.formatConfidence(recommendation.confidence)}
            </Text>
          </View>
        </View>

        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationText}>{recommendation.recommendation_text}</Text>
          
          <View style={styles.rationaleSection}>
            <Text style={styles.rationaleLabel}>Rationale:</Text>
            <Text style={styles.rationaleText}>{recommendation.rationale}</Text>
          </View>

          <View style={styles.sourceInfo}>
            <Text style={styles.sourceText}>
              Based on: {recommendation.test_name}
            </Text>
            <Text style={styles.sourceText}>
              {bloodworkRecommendationsService.getTrendWindowText(recommendation)}
            </Text>
          </View>
        </View>

        {recommendation.status === 'active' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => updateRecommendationStatus(recommendation.id, 'resolved')}
            >
              <Text style={styles.resolveButtonText}>Resolve</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.recommendationFooter}>
          <Text style={styles.dateText}>
            Created: {new Date(recommendation.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  const renderCategorySection = ([category, categoryRecommendations]: [string, BloodworkRecommendation[]]) => {
    const isExpanded = expandedCategories.has(category);
    const categoryIcon = bloodworkRecommendationsService.getRecommendationIcon(category as RecommendationType);
    const categoryStats = bloodworkRecommendationsService.getRecommendationStatistics(categoryRecommendations);
    
    return (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategoryExpansion(category)}
        >
          <View style={styles.categoryInfo}>
            <View style={styles.categoryTitleRow}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
              <Text style={styles.categoryName}>{bloodworkRecommendationsService.formatRecommendationType(category as RecommendationType)}</Text>
            </View>
            <Text style={styles.categoryCount}>
              {categoryRecommendations.length} recommendations
            </Text>
          </View>
          <View style={styles.categoryStats}>
            {categoryStats.by_severity.high > 0 && (
              <Text style={[styles.statText, { color: '#DC2626' }]}>
                H{categoryStats.by_severity.high}
              </Text>
            )}
            {categoryStats.by_severity.medium > 0 && (
              <Text style={[styles.statText, { color: '#F59E0B' }]}>
                M{categoryStats.by_severity.medium}
              </Text>
            )}
            {categoryStats.by_severity.low > 0 && (
              <Text style={[styles.statText, { color: '#10B981' }]}>
                L{categoryStats.by_severity.low}
              </Text>
            )}
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryContent}>
            {categoryRecommendations.map(recommendation => renderRecommendationItem(recommendation))}
          </View>
        )}
      </View>
    );
  };

  const renderStatisticsSection = () => {
    const stats = bloodworkRecommendationsService.getRecommendationStatistics(recommendations);
    const priorityRecs = bloodworkRecommendationsService.getRecommendationsNeedingAttention(recommendations);

    return (
      <View style={styles.statisticsSection}>
        <Text style={styles.sectionTitle}>Recommendations Overview</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.by_severity.high}</Text>
            <Text style={styles.statLabel}>High Priority</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{priorityRecs.length}</Text>
            <Text style={styles.statLabel}>Need Attention</Text>
          </View>
        </View>

        {priorityRecs.length > 0 && (
          <View style={styles.prioritySection}>
            <Text style={styles.priorityTitle}>Priority Recommendations</Text>
            {priorityRecs.slice(0, 3).map(rec => (
              <View key={rec.id} style={styles.priorityItem}>
                <Text style={styles.priorityMarker}>{rec.test_name}</Text>
                <Text style={[
                  styles.prioritySeverity,
                  { color: bloodworkRecommendationsService.getRecommendationColor(rec.severity) }
                ]}>
                  {bloodworkRecommendationsService.formatSeverity(rec.severity)}
                </Text>
              </View>
            ))}
            {priorityRecs.length > 3 && (
              <Text style={styles.priorityMore}>
                +{priorityRecs.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderFilterSection = () => {
    const categories = [...new Set(recommendations.map(rec => rec.recommendation_type))];
    const statuses = [...new Set(recommendations.map(rec => rec.status))];
    
    return (
      <View style={styles.filterSection}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              showActiveOnly && styles.filterChipActive
            ]}
            onPress={() => setShowActiveOnly(!showActiveOnly)}
          >
            <Text style={[
              styles.filterChipText,
              showActiveOnly && styles.filterChipTextActive
            ]}>
              {showActiveOnly ? 'Active Only' : 'All'}
            </Text>
          </TouchableOpacity>
        </View>

        {categories.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === null && styles.filterChipActive
              ]}
              onPress={() => filterRecommendationsByCategory(null)}
            >
              <Text style={[
                styles.filterChipText,
                selectedCategory === null && styles.filterChipTextActive
              ]}>
                All Types
              </Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  selectedCategory === category && styles.filterChipActive
                ]}
                onPress={() => filterRecommendationsByCategory(category)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive
                ]}>
                  {bloodworkRecommendationsService.formatRecommendationType(category as RecommendationType)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading bloodwork recommendations...</Text>
      </View>
    );
  }

  const filteredGroupedRecommendations = getFilteredGroupedRecommendations();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStatisticsSection()}
        {renderFilterSection()}

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={generateRecommendations}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Recommendations</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>
            Bloodwork Recommendations
            {selectedCategory && ` - ${bloodworkRecommendationsService.formatRecommendationType(selectedCategory as RecommendationType)}`}
            {selectedStatus && ` - ${bloodworkRecommendationsService.formatStatus(selectedStatus)}`}
          </Text>
          
          {Object.entries(filteredGroupedRecommendations).length > 0 ? (
            Object.entries(filteredGroupedRecommendations).map(renderCategorySection)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedCategory || selectedStatus
                  ? 'No recommendations found for selected filters'
                  : showActiveOnly
                  ? 'No active recommendations'
                  : 'No bloodwork recommendations available'
                }
              </Text>
              <Text style={styles.emptySubtext}>
                Generate recommendations from your bloodwork trends
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  statisticsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  prioritySection: {
    marginBottom: 16,
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  priorityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priorityMarker: {
    fontSize: 14,
    color: '#374151',
  },
  prioritySeverity: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityMore: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryFilters: {
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  actionSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationsSection: {
    padding: 16,
  },
  categorySection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryStats: {
    flexDirection: 'row',
    marginRight: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  recommendationItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationTitleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  recentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  recentText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityContainer: {
    marginRight: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  confidenceContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  recommendationContent: {
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  rationaleSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  rationaleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  rationaleText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  sourceInfo: {
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resolveButton: {
    backgroundColor: '#10B981',
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  recommendationFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default BloodworkRecommendationsScreen;
