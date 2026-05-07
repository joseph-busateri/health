import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { InputMetadata, InputSource } from '../types/inputMetadata';

interface InputDetailsPanelProps {
  inputs: InputMetadata[];
  title?: string;
}

export const InputDetailsPanel: React.FC<InputDetailsPanelProps> = ({ 
  inputs, 
  title = 'Underlying Inputs' 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getSourceColor = (source: InputSource): string => {
    switch (source) {
      case 'ACTUAL':
        return '#10B981'; // Green
      case 'DERIVED':
        return '#3B82F6'; // Blue
      case 'MOCK':
        return '#F59E0B'; // Yellow
      case 'HARDCODED':
        return '#F97316'; // Orange
      case 'NOT_AVAILABLE':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getSourceLabel = (source: InputSource): string => {
    switch (source) {
      case 'ACTUAL':
        return 'Real Data';
      case 'DERIVED':
        return 'Calculated';
      case 'MOCK':
        return 'Mock Data';
      case 'HARDCODED':
        return 'Default';
      case 'NOT_AVAILABLE':
        return 'No Data';
      default:
        return source;
    }
  };

  const formatValue = (input: InputMetadata): string => {
    if (input.value === null || input.value === undefined) {
      return 'N/A';
    }
    if (input.unit) {
      return `${input.value} ${input.unit}`;
    }
    return String(input.value);
  };

  const formatLastUpdated = (timestamp?: string): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return 'N/A';
    }
  };

  // Group inputs by category
  const groupedInputs = inputs.reduce((acc, input) => {
    const category = input.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(input);
    return acc;
  }, {} as Record<string, InputMetadata[]>);

  const categoryOrder = ['vitals', 'bloodwork', 'fitness', 'body_composition', 'demographics', 'derived_metrics', 'other'];
  const sortedCategories = Object.keys(groupedInputs).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      vitals: 'Vital Signs',
      bloodwork: 'Lab Results',
      fitness: 'Fitness Metrics',
      body_composition: 'Body Composition',
      demographics: 'Demographics',
      derived_metrics: 'Calculated Metrics',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const getScoreColor = (score: number | undefined): string => {
    if (score === undefined) return '#9CA3AF'; // Gray for no score
    if (score >= 90) return '#10B981'; // Green for optimal
    if (score >= 70) return '#3B82F6'; // Blue for moderate
    if (score >= 50) return '#F59E0B'; // Orange for elevated_risk
    return '#EF4444'; // Red for high_risk
  };

  const getScoreLabel = (score: number | undefined): string => {
    if (score === undefined) return '';
    if (score >= 90) return '90';
    if (score >= 70) return '70';
    if (score >= 50) return '50';
    return '30';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons 
            name="database-outline" 
            size={20} 
            color="#6B7280" 
          />
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{inputs.length}</Text>
          </View>
        </View>
        <MaterialCommunityIcons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color="#6B7280" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.content} nestedScrollEnabled>
          {sortedCategories.map((category) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{getCategoryLabel(category)}</Text>
              
              {groupedInputs[category].map((input, index) => (
                <View key={`${category}-${index}`} style={styles.inputRow}>
                  <View style={styles.inputInfo}>
                    <Text style={styles.inputName}>{input.name}</Text>
                    <View style={styles.inputMeta}>
                      <View 
                        style={[
                          styles.sourceBadge, 
                          { backgroundColor: getSourceColor(input.source) }
                        ]}
                      >
                        <Text style={styles.sourceBadgeText}>
                          {getSourceLabel(input.source)}
                        </Text>
                      </View>
                      {input.lastUpdated && (
                        <Text style={styles.lastUpdated}>
                          {formatLastUpdated(input.lastUpdated)}
                        </Text>
                      )}
                    </View>
                    {input.sourceDetails?.integration && (
                      <Text style={styles.integration}>
                        via {input.sourceDetails.integration}
                      </Text>
                    )}
                  </View>
                  <View style={styles.inputValueContainer}>
                    <Text style={styles.inputValue}>{formatValue(input)}</Text>
                    {input.score !== undefined && (
                      <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(input.score) }]}>
                        <Text style={styles.scoreBadgeText}>{getScoreLabel(input.score)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Data Source Legend</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Real Data</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Calculated</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>No Data</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  content: {
    maxHeight: 400,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  categorySection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  inputInfo: {
    flex: 1,
    marginRight: 12,
  },
  inputName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  inputMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  integration: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  inputValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  inputValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legend: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
