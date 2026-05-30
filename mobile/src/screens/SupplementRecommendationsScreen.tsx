import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import type {
  SupplementRecommendation,
  SupplementStack,
  SupplementRegimenItem,
} from '../types/supplementEngine';
import type { SupplementBaseline, SupplementItem } from '../types/supplementDocument';
import {
  getCurrentSupplementStack,
  getSupplementRecommendations,
  generateSupplementRecommendations,
} from '../services/supplementEngineService';
import { healthApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'SupplementRecommendations'>;

const SupplementRecommendationsScreen: React.FC<Props> = ({ route }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stack, setStack] = useState<SupplementStack | null>(null);
  const [recommendations, setRecommendations] = useState<SupplementRecommendation[]>([]);
  const [baseline, setBaseline] = useState<SupplementBaseline | null>(null);
  const [baselineItems, setBaselineItems] = useState<SupplementItem[]>([]);

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

      // If no stack data, try to get from baseline endpoint
      if (!stackData) {
        try {
          const baselineResponse = await healthApi.supplements.getBaseline(userId);
          if (baselineResponse.data?.success && baselineResponse.data?.data) {
            setBaseline(baselineResponse.data.data.baseline);
            setBaselineItems(baselineResponse.data.data.items || []);
          }
        } catch (baselineErr) {
          console.log('No baseline data found either');
        }
      }
    } catch (err: any) {
      // If main endpoint fails, try baseline as fallback
      try {
        const baselineResponse = await healthApi.supplements.getBaseline(userId);
        if (baselineResponse.data?.success && baselineResponse.data?.data) {
          setBaseline(baselineResponse.data.data.baseline);
          setBaselineItems(baselineResponse.data.data.items || []);
        } else {
          setError(err?.response?.data?.error || err?.message || 'Failed to load supplement data');
        }
      } catch (fallbackErr) {
        setError(err?.response?.data?.error || err?.message || 'Failed to load supplement data');
      }
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return styles.status_active;
      case 'paused':
        return styles.status_paused;
      case 'discontinued':
      case 'removed':
      default:
        return styles.status_discontinued;
    }
  };

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
          <Text style={styles.cardTitle}>{stack.stackVersion.versionName}</Text>
          <Text style={styles.subtitle}>Version #{stack.stackVersion.versionNumber} • Effective {stack.stackVersion.effectiveFrom}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Total</Text>
              <Text style={styles.metricValue}>{stack.metrics.totalCount}</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Active</Text>
              <Text style={styles.metricValue}>{stack.metrics.activeCount}</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Paused</Text>
              <Text style={styles.metricValue}>{stack.metrics.pausedCount}</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Stopped</Text>
              <Text style={styles.metricValue}>{stack.metrics.discontinuedCount}</Text>
            </View>
          </View>

          <View style={styles.adherenceSummary}>
            <Text style={styles.sectionSubtitle}>30-day Adherence</Text>
            <Text style={styles.adherenceDetail}>
              Scheduled {stack.adherenceSummary.totalScheduled} • Taken {stack.adherenceSummary.totalTaken} • Missed {stack.adherenceSummary.totalMissed}
            </Text>
            <Text style={styles.adherenceDetail}>Side Effects Reported: {stack.adherenceSummary.sideEffects}</Text>
          </View>

          {stack.supplements.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.supplementName}</Text>
                <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>{item.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.itemDetail}>
                {item.dosageAmount} {item.dosageUnit} • {item.frequency} • {item.timing}
              </Text>
              {item.goal && <Text style={styles.itemHint}>Goal: {item.goal}</Text>}
              {item.reasonToTake && <Text style={styles.itemHint}>Why: {item.reasonToTake}</Text>}
              <View style={styles.itemMetaRow}>
                <Text style={styles.itemMeta}>
                  Adherence: {item.adherence.adherencePercentage === null ? 'n/a' : `${item.adherence.adherencePercentage}%`}
                </Text>
                {item.inventory && (
                  <Text style={styles.itemMeta}>
                    Servings left: {item.inventory.current_servings}
                    {item.inventory.needs_reorder ? ' • Reorder soon' : ''}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {baseline && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{baseline.stack_name}</Text>
          <Text style={styles.subtitle}>Created {new Date(baseline.created_at).toLocaleDateString()}</Text>
          {baseline.stack_notes && <Text style={styles.sectionSubtitle}>{baseline.stack_notes}</Text>}

          <View style={styles.metricsRow}>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Total Items</Text>
              <Text style={styles.metricValue}>{baseline.total_active_items || baselineItems.length}</Text>
            </View>
          </View>

          {baselineItems.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.supplement_name}</Text>
                <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>{item.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.itemDetail}>
                {item.dosage} {item.dosage_unit} • {item.frequency} • {item.timing}
              </Text>
              {item.notes && <Text style={styles.itemHint}>{item.notes}</Text>}
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
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338CA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  adherenceSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  adherenceDetail: {
    fontSize: 13,
    color: '#4B5563',
  },
  itemRow: {
    marginBottom: 8,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  status_active: {
    backgroundColor: '#16A34A',
  },
  status_paused: {
    backgroundColor: '#F59E0B',
  },
  status_discontinued: {
    backgroundColor: '#9CA3AF',
  },
  itemDetail: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemHint: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  itemMeta: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
