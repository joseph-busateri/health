import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';
import type {
  PrioritizedRecommendationResponse,
  RecommendationItem,
  RecommendationPriority,
} from '../types/recommendations';

const priorityMeta: Record<RecommendationPriority, { label: string; color: string; icon: string }> = {
  critical: {
    label: 'Critical',
    color: '#DC2626',
    icon: 'alert-octagon',
  },
  important: {
    label: 'Important',
    color: '#FB923C',
    icon: 'alert-circle',
  },
  optimization: {
    label: 'Optimization',
    color: '#2563EB',
    icon: 'lightbulb-on',
  },
};

const RecommendationsScreen: React.FC = () => {
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prioritized, setPrioritized] = useState<PrioritizedRecommendationResponse['data'] | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    if (!userId) {
      setPrioritized(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await healthApi.recommendations.getPrioritized(userId);
      setPrioritized(response.data.data);
    } catch (error) {
      console.error('Failed to load recommendations', error);
      Alert.alert('Error', 'Unable to load recommendations right now.');
      setPrioritized(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    try {
      setRefreshing(true);
      const response = await healthApi.recommendations.getPrioritized(userId);
      setPrioritized(response.data.data);
    } catch (error) {
      console.error('Failed to refresh recommendations', error);
      Alert.alert('Error', 'Unable to refresh recommendations.');
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const removeRecommendation = useCallback((id: string) => {
    setPrioritized(current => {
      if (!current) return current;
      return {
        critical: current.critical.filter(item => item.id !== id),
        important: current.important.filter(item => item.id !== id),
        optimization: current.optimization.filter(item => item.id !== id),
        conflicts: current.conflicts.filter(conflict => conflict.recommendationAId !== id && conflict.recommendationBId !== id),
      };
    });
  }, []);

  const handleDecision = useCallback(
    async (item: RecommendationItem, decision: 'accept' | 'reject') => {
      if (!userId) return;

      setProcessingId(item.id);
      try {
        if (decision === 'accept') {
          await healthApi.recommendations.accept(item.id);
        } else {
          await healthApi.recommendations.reject(item.id);
        }

        removeRecommendation(item.id);
      } catch (error: any) {
        console.error(`Failed to ${decision} recommendation`, error);
        Alert.alert('Error', `Failed to ${decision} recommendation. Please try again.`);
      } finally {
        setProcessingId(current => (current === item.id ? null : current));
      }
    },
    [removeRecommendation, userId]
  );

  const sections = useMemo(() => {
    if (!prioritized) return [];
    return (
      Object.entries(priorityMeta) as Array<[RecommendationPriority, { label: string; color: string; icon: string }]>
    ).map(([priority, meta]) => ({
      priority,
      meta,
      items: prioritized[priority],
    }));
  }, [prioritized]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="check-circle" size={48} color="#22C55E" />
      <Text style={styles.emptyTitle}>You’re all set!</Text>
      <Text style={styles.emptySubtitle}>
        No outstanding recommendations right now. As new AI-driven actions become available, they’ll appear here for
        your review.
      </Text>
    </View>
  );

  if (!userId) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-circle" size={48} color="#64748B" />
          <Text style={styles.emptyTitle}>Set up your profile</Text>
          <Text style={styles.emptySubtitle}>
            Add your user ID in Settings to start receiving personalized recommendations.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Gathering your recommendations…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Recommendations</Text>
            <Text style={styles.subtitle}>
              Approve or reject the actions generated by the intelligence engines. Decisions feed back into the system
              to improve future guidance.
            </Text>
          </View>

          {sections.every(section => section.items.length === 0) && renderEmptyState()}

          {sections.map(({ priority, meta, items }) => {
            if (items.length === 0) {
              return null;
            }

            return (
              <View key={priority} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.priorityPill, { backgroundColor: `${meta.color}1A` }]}> 
                    <MaterialCommunityIcons name={meta.icon as any} size={18} color={meta.color} />
                    <Text style={[styles.priorityLabel, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  <Text style={styles.sectionCount}>{items.length} open</Text>
                </View>

                {items.map(item => (
                  <RecommendationCard
                    key={item.id}
                    item={item}
                    disabled={processingId === item.id}
                    onDecision={handleDecision}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

interface RecommendationCardProps {
  item: RecommendationItem;
  disabled: boolean;
  onDecision: (item: RecommendationItem, decision: 'accept' | 'reject') => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ item, disabled, onDecision }) => {
  const meta = priorityMeta[item.priority];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: `${meta.color}1A` }]}> 
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.categoryText}>{item.category.replace('_', ' ')}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>

      {item.supportingMetrics && item.supportingMetrics.length > 0 && (
        <View style={styles.metricsContainer}>
          {item.supportingMetrics.map(metric => (
            <View key={metric.name} style={styles.metricChip}>
              <Text style={styles.metricName}>{metric.name}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              {metric.target ? <Text style={styles.metricTarget}>Target: {metric.target}</Text> : null}
            </View>
          ))}
        </View>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="robot" size={16} color="#475569" />
          <Text style={styles.metaLabel}>{item.sourceEngine.replace('_', ' ')}</Text>
        </View>
        {item.confidenceLevel ? (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#475569" />
            <Text style={styles.metaLabel}>Confidence: {item.confidenceLevel}</Text>
          </View>
        ) : null}
        {typeof item.dataQualityScore === 'number' ? (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="database" size={16} color="#475569" />
            <Text style={styles.metaLabel}>Data quality: {item.dataQualityScore}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.rejectButton, disabled && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={disabled}
          onPress={() => onDecision(item, 'reject')}
        >
          <MaterialCommunityIcons name="close" size={16} color="#991B1B" />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptButton, disabled && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={disabled}
          onPress={() => onDecision(item, 'accept')}
        >
          <MaterialCommunityIcons name="check" size={16} color="#F8FAFC" />
          <Text style={styles.acceptText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 24,
  },
  header: {
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  metricsContainer: {
    gap: 8,
  },
  metricChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  metricName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  metricTarget: {
    fontSize: 12,
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: '#475569',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  rejectText: {
    color: '#991B1B',
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#16A34A',
  },
  acceptText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RecommendationsScreen;
