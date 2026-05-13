import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../types/navigation';

interface OverloadRecommendation {
  exerciseKey: string;
  exerciseName: string;
  currentLoad: {
    sets: number;
    reps: number;
    weight: number;
  };
  recommendedLoad: {
    sets: number;
    reps: number;
    weight: number;
  };
  progressionType: 'weight' | 'reps' | 'sets' | 'volume';
  rationale: string;
  aiConfidence: number;
  safetyScore: number;
  readinessFactors: {
    recovery: number;
    jointHealth: number;
    adherence: number;
  };
}

export default function OverloadRecommendationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<OverloadRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setError('Please set your user ID in Settings');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/progression/overload-recommendations/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.decision) {
        setRecommendations([]);
        setError('No recommendations available at this time');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Transform AI decision into UI-friendly recommendations
      const aiRecommendations: OverloadRecommendation[] = data.decision.adjustments.map((adj: any) => ({
        exerciseKey: adj.exerciseKey,
        exerciseName: adj.exerciseKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        currentLoad: { sets: 0, reps: 0, weight: 0 }, // Would need baseline data
        recommendedLoad: { 
          sets: adj.addSet ? 1 : (adj.removeSet ? -1 : 0), 
          reps: 0, 
          weight: adj.loadDeltaPercent ? Math.round(adj.loadDeltaPercent * 100) : 0 
        },
        progressionType: adj.loadDeltaPercent ? 'weight' : (adj.addSet ? 'sets' : 'volume'),
        rationale: adj.justification || adj.cue || 'AI-recommended adjustment',
        aiConfidence: data.decision.confidence,
        safetyScore: data.decision.confidence,
        readinessFactors: {
          recovery: 0.85,
          jointHealth: 0.85,
          adherence: 0.85,
        },
      }));

      setRecommendations(aiRecommendations);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
      setError(errorMessage);
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRecommendations(false);
  }, [fetchRecommendations]);

  const onRefresh = () => {
    fetchRecommendations(true);
  };

  const getProgressionTypeColor = (type: string) => {
    switch (type) {
      case 'weight': return '#10b981';
      case 'reps': return '#3b82f6';
      case 'sets': return '#f59e0b';
      case 'volume': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getProgressionTypeIcon = (type: string) => {
    switch (type) {
      case 'weight': return 'barbell';
      case 'reps': return 'repeat';
      case 'sets': return 'layers';
      case 'volume': return 'trending-up';
      default: return 'fitness';
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 0.9) return '#10b981';
    if (score >= 0.75) return '#f59e0b';
    return '#ef4444';
  };

  const formatLoad = (load: any) => {
    return `${load.sets}×${load.reps} @ ${load.weight}lbs`;
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Set your user ID in Settings to view AI recommendations</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Generating AI recommendations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchRecommendations(false)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Overload Planner</Text>
        <Text style={styles.subtitle}>Intelligent progressive overload recommendations</Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoBannerText}>
          AI analyzes your recovery, joint health, and adherence to recommend safe progressive overload
        </Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{recommendations.length}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {recommendations.filter(r => r.progressionType === 'weight').length}
          </Text>
          <Text style={styles.statLabel}>Weight ↑</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {Math.round(recommendations.reduce((sum, r) => sum + r.aiConfidence, 0) / recommendations.length * 100)}%
          </Text>
          <Text style={styles.statLabel}>Avg Confidence</Text>
        </View>
      </View>

      {/* Recommendations List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {recommendations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No recommendations available</Text>
            <Text style={styles.emptyStateSubtext}>Complete baseline workouts to get AI recommendations</Text>
          </View>
        ) : (
          recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationCard}>
              {/* Exercise Header */}
              <View style={styles.recHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{rec.exerciseName}</Text>
                  <View style={[styles.progressionTypeBadge, { backgroundColor: getProgressionTypeColor(rec.progressionType) }]}>
                    <Ionicons name={getProgressionTypeIcon(rec.progressionType) as any} size={12} color="#fff" />
                    <Text style={styles.progressionTypeText}>{rec.progressionType.toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              {/* Load Comparison */}
              <View style={styles.loadComparison}>
                <View style={styles.loadColumn}>
                  <Text style={styles.loadLabel}>Current</Text>
                  <Text style={styles.loadValue}>{formatLoad(rec.currentLoad)}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Ionicons name="arrow-forward" size={24} color="#10b981" />
                </View>
                <View style={styles.loadColumn}>
                  <Text style={styles.loadLabel}>Recommended</Text>
                  <Text style={[styles.loadValue, styles.recommendedValue]}>{formatLoad(rec.recommendedLoad)}</Text>
                </View>
              </View>

              {/* Rationale */}
              <View style={styles.rationaleContainer}>
                <Ionicons name="bulb" size={16} color="#3b82f6" />
                <Text style={styles.rationaleText}>{rec.rationale}</Text>
              </View>

              {/* AI Confidence & Safety */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>AI Confidence</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${rec.aiConfidence * 100}%`, backgroundColor: '#3b82f6' }]} />
                  </View>
                  <Text style={styles.metricValue}>{Math.round(rec.aiConfidence * 100)}%</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Safety Score</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${rec.safetyScore * 100}%`, backgroundColor: getSafetyColor(rec.safetyScore) }]} />
                  </View>
                  <Text style={[styles.metricValue, { color: getSafetyColor(rec.safetyScore) }]}>
                    {Math.round(rec.safetyScore * 100)}%
                  </Text>
                </View>
              </View>

              {/* Readiness Factors */}
              <View style={styles.readinessContainer}>
                <Text style={styles.readinessTitle}>Readiness Factors</Text>
                <View style={styles.readinessGrid}>
                  <View style={styles.readinessItem}>
                    <Ionicons name="heart" size={16} color="#ef4444" />
                    <Text style={styles.readinessLabel}>Recovery</Text>
                    <Text style={styles.readinessValue}>{Math.round(rec.readinessFactors.recovery * 100)}%</Text>
                  </View>
                  <View style={styles.readinessItem}>
                    <Ionicons name="body" size={16} color="#f59e0b" />
                    <Text style={styles.readinessLabel}>Joint Health</Text>
                    <Text style={styles.readinessValue}>{Math.round(rec.readinessFactors.jointHealth * 100)}%</Text>
                  </View>
                  <View style={styles.readinessItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.readinessLabel}>Adherence</Text>
                    <Text style={styles.readinessValue}>{Math.round(rec.readinessFactors.adherence * 100)}%</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.acceptButton}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modifyButton}>
                  <Ionicons name="create" size={18} color="#3b82f6" />
                  <Text style={styles.modifyButtonText}>Modify</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  infoBanner: {
    backgroundColor: '#eff6ff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recHeader: {
    marginBottom: 16,
  },
  exerciseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  progressionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressionTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  loadComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  loadColumn: {
    flex: 1,
  },
  loadLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  loadValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  recommendedValue: {
    color: '#10b981',
  },
  arrowContainer: {
    paddingHorizontal: 12,
  },
  rationaleContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rationaleText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  readinessContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  readinessTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  readinessGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  readinessItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  readinessLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  readinessValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modifyButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modifyButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
