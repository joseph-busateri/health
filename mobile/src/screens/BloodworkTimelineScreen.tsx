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
import { bloodworkResultsService } from '../services/bloodworkResultsService';
import type { BloodworkTimelineScreenProps, GroupedBloodworkResult } from '../types/bloodworkResults';

const BloodworkTimelineScreen: React.FC<BloodworkTimelineScreenProps> = ({ userId }) => {
  const [timeline, setTimeline] = useState<GroupedBloodworkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [expandedMarkers, setExpandedMarkers] = useState<Set<string>>(new Set());
  const [chartData, setChartData] = useState<any>(null);

  const screenWidth = Dimensions.get('window').width;

  const loadTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bloodworkResultsService.getBloodworkTimeline(userId, 50);

      if (response.success && response.data) {
        const groupedResults = bloodworkResultsService.groupResultsForTimeline(
          response.data.timeline.flatMap(item => 
            item.results.map(result => ({
              id: `${item.test_date}-${result.raw_test_name}`,
              document_id: '',
              user_id: userId,
              raw_test_name: result.raw_test_name,
              normalized_test_name: result.normalized_test_name,
              category: '',
              value_text: result.value,
              value_numeric: result.value_numeric,
              unit: result.unit,
              reference_range_low: undefined,
              reference_range_high: undefined,
              reference_range_text: '',
              abnormal_flag: result.abnormal_flag,
              confidence: result.confidence,
              test_date: item.test_date,
              source: 'timeline',
              created_at: '',
              updated_at: '',
            }))
          )
        );
        
        setTimeline(groupedResults);
        
        // Prepare chart data for the first few numeric markers
        if (groupedResults.length > 0) {
          prepareChartData(groupedResults);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to load bloodwork timeline');
      }
    } catch (error) {
      console.error('Error loading bloodwork timeline:', error);
      Alert.alert('Error', 'Failed to load bloodwork timeline');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const prepareChartData = (groupedResults: GroupedBloodworkResult[]) => {
    // Find the first few markers with numeric data
    const numericMarkers = groupedResults
      .filter(marker => marker.results.some(result => result.value_numeric !== undefined))
      .slice(0, 3);

    if (numericMarkers.length === 0) return;

    const datasets = numericMarkers.map((marker, index) => {
      const colors = ['#007AFF', '#34C759', '#FF9500'];
      const data = marker.results
        .filter(result => result.value_numeric !== undefined)
        .map(result => result.value_numeric!);

      return {
        data,
        color: (opacity = 1) => colors[index % colors.length] + Math.round(opacity * 255).toString(16).padStart(2, '0'),
        strokeWidth: 2,
      };
    });

    // Get unique dates from all results
    const allDates = numericMarkers
      .flatMap(marker => marker.results)
      .filter(result => result.value_numeric !== undefined)
      .map(result => new Date(result.test_date).toLocaleDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort();

    if (allDates.length > 0) {
      setChartData({
        labels: allDates,
        datasets,
        legend: numericMarkers.map(marker => marker.normalized_test_name || marker.raw_test_name),
      });
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTimeline();
    setRefreshing(false);
  }, [loadTimeline]);

  useFocusEffect(
    useCallback(() => {
      loadTimeline();
    }, [loadTimeline])
  );

  const toggleMarkerExpansion = (markerName: string) => {
    const newExpanded = new Set(expandedMarkers);
    if (newExpanded.has(markerName)) {
      newExpanded.delete(markerName);
    } else {
      newExpanded.add(markerName);
    }
    setExpandedMarkers(newExpanded);
  };

  const renderTimelineItem = (result: GroupedBloodworkResult['results'][0], index: number, marker: GroupedBloodworkResult) => {
    const isAbnormal = result.abnormal_flag || false;
    const confidenceColor = bloodworkResultsService.getConfidenceColor(result.confidence);

    return (
      <View key={`${result.test_date}-${index}`} style={styles.timelineItem}>
        <View style={styles.timelineDate}>
          <Text style={styles.dateText}>
            {new Date(result.test_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.timelineValue}>
          <Text style={styles.valueText}>{result.value}</Text>
          {result.unit && <Text style={styles.unitText}>{result.unit}</Text>}
        </View>
        <View style={styles.timelineStatus}>
          {isAbnormal && <View style={styles.abnormalIndicator} />}
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            {bloodworkResultsService.getConfidenceText(result.confidence)}
          </Text>
        </View>
      </View>
    );
  };

  const renderMarkerGroup = (marker: GroupedBloodworkResult) => {
    const isExpanded = expandedMarkers.has(marker.normalized_test_name || marker.raw_test_name);
    const isSelected = selectedMarker === (marker.normalized_test_name || marker.raw_test_name);

    return (
      <View key={marker.normalized_test_name || marker.raw_test_name} style={styles.markerGroup}>
        <TouchableOpacity
          style={[styles.markerHeader, isSelected && styles.markerHeaderSelected]}
          onPress={() => {
            setSelectedMarker(marker.normalized_test_name || marker.raw_test_name);
            toggleMarkerExpansion(marker.normalized_test_name || marker.raw_test_name);
          }}
        >
          <View style={styles.markerInfo}>
            <Text style={styles.markerName}>
              {marker.normalized_test_name || marker.raw_test_name}
            </Text>
            <Text style={styles.markerCategory}>
              {marker.category || 'Uncategorized'}
            </Text>
          </View>
          <View style={styles.markerStats}>
            <Text style={styles.resultCount}>{marker.results.length} results</Text>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {marker.results.map((result, index) => renderTimelineItem(result, index, marker))}
          </View>
        )}
      </View>
    );
  };

  const renderChart = () => {
    if (!chartData) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Trends Over Time</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            Chart functionality will be available in future updates
          </Text>
          <Text style={styles.chartPlaceholderSubtext}>
            {chartData.legend?.join(', ')} markers tracked
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading bloodwork timeline...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bloodwork Timeline</Text>
        <Text style={styles.subtitle}>
          Track your bloodwork trends over time
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
      >
        {renderChart()}

        <View style={styles.markersContainer}>
          <Text style={styles.sectionTitle}>Markers</Text>
          {timeline.map(renderMarkerGroup)}
        </View>

        {timeline.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No timeline data available</Text>
            <Text style={styles.emptySubtext}>
              Upload and parse bloodwork documents to see timeline trends
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  markersContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  markerGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  markerHeaderSelected: {
    backgroundColor: '#EFF6FF',
  },
  markerInfo: {
    flex: 1,
  },
  markerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  markerCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  markerStats: {
    alignItems: 'flex-end',
  },
  resultCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  expandIcon: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timelineDate: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
  },
  timelineValue: {
    flex: 1,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  unitText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  timelineStatus: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  abnormalIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default BloodworkTimelineScreen;
