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
import { bloodworkTrendsService } from '../services/bloodworkTrendsService';
import type {
  BloodworkTrendsScreenProps,
  BloodworkTrend,
  GroupedBloodworkTrends,
  TrendDirection
} from '../types/bloodworkTrends';

const screenWidth = Dimensions.get('window').width;

const BloodworkTrendsScreen: React.FC<BloodworkTrendsScreenProps> = ({ userId }) => {
  const [trends, setTrends] = useState<BloodworkTrend[]>([]);
  const [groupedTrends, setGroupedTrends] = useState<GroupedBloodworkTrends>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<any>(null);

  const fetchTrends = useCallback(async () => {
    try {
      const response = await bloodworkTrendsService.getBloodworkTrends(userId);
      
      if (response.success && response.data) {
        setTrends(response.data.trends);
        setGroupedTrends(bloodworkTrendsService.groupTrendsByCategory(response.data.trends));
        setSummary(response.data.summary);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch bloodwork trends');
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
      Alert.alert('Error', 'Failed to fetch bloodwork trends');
    }
  }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrends();
    setRefreshing(false);
  }, [fetchTrends]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTrends().finally(() => setLoading(false));
    }, [fetchTrends])
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

  const filterTrendsByCategory = (category: string | null) => {
    if (category === selectedCategory) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const getFilteredTrends = () => {
    if (!selectedCategory) return trends;
    return trends.filter(trend => trend.category === selectedCategory);
  };

  const getFilteredGroupedTrends = () => {
    if (!selectedCategory) return groupedTrends;
    const filtered = Object.entries(groupedTrends).reduce((acc, [category, categoryTrends]) => {
      if (category === selectedCategory) {
        acc[category] = categoryTrends;
      }
      return acc;
    }, {} as GroupedBloodworkTrends);
    return filtered;
  };

  const renderTrendItem = (trend: BloodworkTrend) => {
    const trendColor = bloodworkTrendsService.getTrendColor(trend.trend_direction);
    const trendIcon = bloodworkTrendsService.getTrendIcon(trend.trend_direction);
    const isSignificant = bloodworkTrendsService.isTrendSignificant(trend);

    return (
      <View key={trend.marker_name} style={[styles.trendItem, { borderLeftColor: trendColor }]}>
        <View style={styles.trendHeader}>
          <View style={styles.trendNameContainer}>
            <Text style={styles.trendName}>{trend.marker_name}</Text>
            {isSignificant && (
              <View style={styles.significantBadge}>
                <Text style={styles.significantText}>Significant</Text>
              </View>
            )}
          </View>
          <View style={styles.trendDirection}>
            <Text style={styles.trendIcon}>{trendIcon}</Text>
            <Text style={[styles.trendDirectionText, { color: trendColor }]}>
              {bloodworkTrendsService.formatTrendDirection(trend.trend_direction)}
            </Text>
          </View>
        </View>

        <View style={styles.trendValues}>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Latest:</Text>
            <Text style={styles.valueText}>
              {bloodworkTrendsService.formatValue(trend.latest_value, trend.unit)}
            </Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Prior:</Text>
            <Text style={styles.valueText}>
              {bloodworkTrendsService.formatValue(trend.prior_value, trend.unit)}
            </Text>
          </View>
          {(trend.absolute_change !== undefined || trend.percent_change !== undefined) && (
            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Change:</Text>
              <Text style={[styles.changeText, { color: trendColor }]}>
                {bloodworkTrendsService.formatChange(trend.absolute_change, trend.percent_change, trend.unit)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.trendMeta}>
          <Text style={styles.metaText}>
            {trend.data_points} data points
          </Text>
          <Text style={styles.metaText}>
            {bloodworkTrendsService.formatDateRange(trend.first_test_date, trend.latest_test_date)}
          </Text>
        </View>

        {trend.trend_summary && (
          <View style={styles.trendSummary}>
            <Text style={styles.summaryText}>{trend.trend_summary}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategorySection = ([category, categoryTrends]: [string, BloodworkTrend[]]) => {
    const isExpanded = expandedCategories.has(category);
    const categoryStats = bloodworkTrendsService.getTrendStatistics(categoryTrends);
    
    return (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategoryExpansion(category)}
        >
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category}</Text>
            <Text style={styles.categoryCount}>
              {categoryTrends.length} markers
            </Text>
          </View>
          <View style={styles.categoryStats}>
            {categoryStats.improving > 0 && (
              <Text style={[styles.statText, { color: '#10B981' }]}>
                ↑{categoryStats.improving}
              </Text>
            )}
            {categoryStats.worsening > 0 && (
              <Text style={[styles.statText, { color: '#EF4444' }]}>
                ↓{categoryStats.worsening}
              </Text>
            )}
            {categoryStats.stable > 0 && (
              <Text style={[styles.statText, { color: '#6B7280' }]}>
                →{categoryStats.stable}
              </Text>
            )}
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryContent}>
            {categoryTrends.map(trend => renderTrendItem(trend))}
          </View>
        )}
      </View>
    );
  };

  const renderSummarySection = () => {
    if (!summary) return null;

    const stats = bloodworkTrendsService.getTrendStatistics(trends);
    const priorityMarkers = bloodworkTrendsService.getPriorityMarkers(trends);

    return (
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Trend Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {stats.improving}
            </Text>
            <Text style={styles.summaryLabel}>Improving</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {stats.worsening}
            </Text>
            <Text style={styles.summaryLabel}>Worsening</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#6B7280' }]}>
              {stats.stable}
            </Text>
            <Text style={styles.summaryLabel}>Stable</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
              {stats.insufficient_data}
            </Text>
            <Text style={styles.summaryLabel}>Insufficient Data</Text>
          </View>
        </View>

        {priorityMarkers.length > 0 && (
          <View style={styles.prioritySection}>
            <Text style={styles.priorityTitle}>Priority Markers</Text>
            {priorityMarkers.slice(0, 3).map(trend => (
              <View key={trend.marker_name} style={styles.priorityItem}>
                <Text style={styles.priorityMarker}>{trend.marker_name}</Text>
                <Text style={[
                  styles.priorityTrend,
                  { color: bloodworkTrendsService.getTrendColor(trend.trend_direction) }
                ]}>
                  {bloodworkTrendsService.formatTrendDirection(trend.trend_direction)}
                </Text>
              </View>
            ))}
            {priorityMarkers.length > 3 && (
              <Text style={styles.priorityMore}>
                +{priorityMarkers.length - 3} more
              </Text>
            )}
          </View>
        )}

        {summary.date_range && (
          <View style={styles.dateRangeSection}>
            <Text style={styles.dateRangeText}>
              Analysis Period: {bloodworkTrendsService.formatDateRange(summary.date_range.start, summary.date_range.end)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryFilter = () => {
    const categories = Object.keys(groupedTrends);
    
    if (categories.length <= 1) return null;

    return (
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === null && styles.filterChipActive
            ]}
            onPress={() => filterTrendsByCategory(null)}
          >
            <Text style={[
              styles.filterChipText,
              selectedCategory === null && styles.filterChipTextActive
            ]}>
              All ({trends.length})
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive
              ]}
              onPress={() => filterTrendsByCategory(category)}
            >
              <Text style={[
                styles.filterChipText,
                selectedCategory === category && styles.filterChipTextActive
              ]}>
                {category} ({groupedTrends[category]?.length || 0})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading bloodwork trends...</Text>
      </View>
    );
  }

  const filteredGroupedTrends = getFilteredGroupedTrends();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSummarySection()}
        {renderCategoryFilter()}

        <View style={styles.trendsSection}>
          <Text style={styles.sectionTitle}>
            Bloodwork Trends
            {selectedCategory && ` - ${selectedCategory}`}
          </Text>
          
          {Object.entries(filteredGroupedTrends).length > 0 ? (
            Object.entries(filteredGroupedTrends).map(renderCategorySection)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedCategory 
                  ? `No trends found for ${selectedCategory}`
                  : 'No bloodwork trends available'
                }
              </Text>
              <Text style={styles.emptySubtext}>
                Upload and parse bloodwork documents to see trends
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
  summarySection: {
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
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
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
  priorityTrend: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityMore: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  dateRangeSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dateRangeText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
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
  trendsSection: {
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
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
  trendItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  significantBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  significantText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  trendDirection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  trendDirectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendValues: {
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  valueLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  valueText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 10,
    color: '#6B7280',
  },
  trendSummary: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryText: {
    fontSize: 11,
    color: '#374151',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default BloodworkTrendsScreen;
