import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import type { SupplementRecommendation, SupplementStack } from '../types/supplementEngine';
import {
  getCurrentSupplementStack,
  getSupplementRecommendations,
  generateSupplementRecommendations,
} from '../services/supplementEngineService';

type Props = NativeStackScreenProps<RootStackParamList, 'SupplementRecommendations'>;

const SupplementRecommendationsScreen: React.FC<Props> = ({ route }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stack, setStack] = useState<SupplementStack | null>(null);
  const [recommendations, setRecommendations] = useState<SupplementRecommendation[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stackData, recsData] = await Promise.all([
        getCurrentSupplementStack(userId),
        getSupplementRecommendations(userId),
      ]);
      setStack(stackData);
      setRecommendations(recsData);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load supplement data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateSupplementRecommendations(userId);
      setRecommendations(result.recommendations);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={load} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add':
        return '#10B981';
      case 'remove':
        return '#EF4444';
      case 'adjust_dosage':
      case 'adjust_timing':
        return '#F59E0B';
      case 'review':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#DC2626';
      case 'moderate':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Supplement Recommendations</Text>

      {stack && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Stack: {stack.stackName}</Text>
          <Text style={styles.subtitle}>Active Items: {stack.totalActiveItems}</Text>
          {stack.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.supplementName}</Text>
              <Text style={styles.itemDetail}>
                {item.dosage} {item.dosageUnit} • {item.frequency} • {item.timing}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={handleGenerate}
        disabled={generating}
        style={[styles.generateButton, generating && styles.generateButtonDisabled]}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.generateButtonText}>Generate Recommendations</Text>
        )}
      </TouchableOpacity>

      {recommendations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No recommendations yet</Text>
          <Text style={styles.emptySubtext}>Tap Generate to create recommendations</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Recommendations ({recommendations.length})</Text>
          {recommendations.map((rec) => (
            <View key={rec.id} style={styles.recCard}>
              <View style={styles.recHeader}>
                <View style={[styles.actionBadge, { backgroundColor: getActionColor(rec.action) }]}>
                  <Text style={styles.actionText}>{rec.action.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(rec.severity) }]}>
                  <Text style={styles.severityText}>{rec.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.recName}>{rec.supplementName}</Text>
              <Text style={styles.recRationale}>{rec.rationale}</Text>
              {rec.currentDosage && rec.recommendedDosage && (
                <Text style={styles.recDetail}>
                  Dosage: {rec.currentDosage} → {rec.recommendedDosage}
                </Text>
              )}
              {rec.currentTiming && rec.recommendedTiming && (
                <Text style={styles.recDetail}>
                  Timing: {rec.currentTiming} → {rec.recommendedTiming}
                </Text>
              )}
              <Text style={styles.recConfidence}>Confidence: {Math.round(rec.confidence * 100)}%</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  itemRow: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemDetail: {
    fontSize: 13,
    color: '#6B7280',
  },
  generateButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  recHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  recRationale: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  recDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  recConfidence: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SupplementRecommendationsScreen;
