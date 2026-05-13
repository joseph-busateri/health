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
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bloodworkResultsService } from '../services/bloodworkResultsService';
import type { BloodworkResult, BloodworkResultsScreenProps } from '../types/bloodworkResults';

const BloodworkResultsScreen: React.FC<BloodworkResultsScreenProps> = ({ userId }) => {
  const [results, setResults] = useState<BloodworkResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<BloodworkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bloodworkResultsService.getBloodworkResults(userId, {
        limit: 100
      });

      if (response.success && response.data) {
        const sortedResults = bloodworkResultsService.sortResults(response.data.results);
        setResults(sortedResults);
        setFilteredResults(sortedResults);
      } else {
        Alert.alert('Error', response.error || 'Failed to load bloodwork results');
      }
    } catch (error) {
      console.error('Error loading bloodwork results:', error);
      Alert.alert('Error', 'Failed to load bloodwork results');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  }, [loadResults]);

  useFocusEffect(
    useCallback(() => {
      loadResults();
    }, [loadResults])
  );

  useEffect(() => {
    if (selectedCategory) {
      const filtered = bloodworkResultsService.filterByCategory(results, selectedCategory);
      setFilteredResults(filtered);
    } else {
      setFilteredResults(results);
    }
  }, [selectedCategory, results]);

  const toggleResultExpansion = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const getAvailableCategories = () => {
    return bloodworkResultsService.getAvailableCategories(results);
  };

  const renderResultItem = ({ item }: { item: BloodworkResult }) => {
    const isExpanded = expandedResults.has(item.id);
    const isAbnormal = bloodworkResultsService.isAbnormal(item);
    const confidenceColor = bloodworkResultsService.getConfidenceColor(item.confidence);
    const confidenceText = bloodworkResultsService.getConfidenceText(item.confidence);

    return (
      <View style={styles.resultItem}>
        <TouchableOpacity
          style={styles.resultHeader}
          onPress={() => toggleResultExpansion(item.id)}
        >
          <View style={styles.resultInfo}>
            <Text style={styles.testName}>
              {item.normalized_test_name || item.raw_test_name}
            </Text>
            <Text style={styles.testValue}>
              {bloodworkResultsService.formatValue(item)}
            </Text>
          </View>
          <View style={styles.resultStatus}>
            {isAbnormal && <View style={styles.abnormalIndicator} />}
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {confidenceText}
            </Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>
                {item.category || 'Uncategorized'}
              </Text>
            </View>
            
            {item.reference_range_low !== undefined || 
             item.reference_range_high !== undefined || 
             item.reference_range_text ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference Range:</Text>
                <Text style={styles.detailValue}>
                  {bloodworkResultsService.getReferenceRangeDisplay(item)}
                </Text>
              </View>
            ) : null}

            {item.test_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Test Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(item.test_date).toLocaleDateString()}
                </Text>
              </View>
            )}

            {item.source && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Source:</Text>
                <Text style={styles.detailValue}>{item.source}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Raw Name:</Text>
              <Text style={styles.detailValue}>{item.raw_test_name}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryFilter = () => {
    const categories = getAvailableCategories();
    
    if (categories.length === 0) return null;

    return (
      <ScrollView horizontal style={styles.categoryFilter} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === null && styles.categoryButtonActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === null && styles.categoryButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading bloodwork results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bloodwork Results</Text>
        <Text style={styles.subtitle}>
          {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={filteredResults}
        renderItem={renderResultItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bloodwork results found</Text>
            <Text style={styles.emptySubtext}>
              Upload and parse bloodwork documents to see results here
            </Text>
          </View>
        }
      />
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
  categoryFilter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  resultsList: {
    padding: 20,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  resultInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  testValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  resultStatus: {
    alignItems: 'flex-end',
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
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
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
    flex: 1,
    justifyContent: 'center',
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

export default BloodworkResultsScreen;
