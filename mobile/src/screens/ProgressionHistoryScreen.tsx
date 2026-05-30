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

interface ProgressionEntry {
  id: string;
  exerciseKey: string;
  exerciseName: string;
  planDate: string;
  baselinePayload: any;
  appliedPayload: any;
  progressionStep?: number;
  adjustmentSource: 'baseline' | 'ai_adjusted' | 'manual_override';
  aiConfidence?: number;
  rationale?: string;
}

export default function ProgressionHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressions, setProgressions] = useState<ProgressionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<30 | 60 | 90>(30);

  const fetchProgressions = useCallback(async (isRefresh = false) => {
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
        `http://localhost:3000/api/progression/history/${userId}?days=${selectedDays}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch progression history: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedProgressions: ProgressionEntry[] = data.progressions.map((p: any) => ({
        id: p.id,
        exerciseKey: p.exerciseKey,
        exerciseName: p.exerciseName,
        planDate: p.planDate,
        baselinePayload: p.baselinePayload,
        appliedPayload: p.appliedPayload,
        progressionStep: p.progressionStep,
        adjustmentSource: p.adjustmentSource,
        aiConfidence: p.aiConfidence,
        rationale: p.rationale,
      }));

      setProgressions(fetchedProgressions);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load progression history';
      setError(errorMessage);
      console.error('Failed to fetch progressions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, selectedDays]);

  useEffect(() => {
    fetchProgressions(false);
  }, [fetchProgressions]);

  const onRefresh = () => {
    fetchProgressions(true);
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'ai_adjusted': return '#10b981';
      case 'manual_override': return '#f59e0b';
      case 'baseline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'ai_adjusted': return 'AI Adjusted';
      case 'manual_override': return 'Manual';
      case 'baseline': return 'Baseline';
      default: return source;
    }
  };

  const formatPayload = (payload: any) => {
    if (!payload) return 'N/A';
    const parts = [];
    if (payload.sets) parts.push(`${payload.sets} sets`);
    if (payload.reps) parts.push(`${payload.reps} reps`);
    if (payload.weight) parts.push(`${payload.weight} lbs`);
    return parts.join(' × ');
  };

  const getProgressionChange = (baseline: any, applied: any) => {
    if (!baseline || !applied) return null;
    
    const changes = [];
    if (baseline.weight !== applied.weight) {
      const diff = applied.weight - baseline.weight;
      changes.push(`${diff > 0 ? '+' : ''}${diff} lbs`);
    }
    if (baseline.reps !== applied.reps) {
      const diff = applied.reps - baseline.reps;
      changes.push(`${diff > 0 ? '+' : ''}${diff} reps`);
    }
    if (baseline.sets !== applied.sets) {
      const diff = applied.sets - baseline.sets;
      changes.push(`${diff > 0 ? '+' : ''}${diff} sets`);
    }
    
    return changes.length > 0 ? changes.join(', ') : null;
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Set your user ID in Settings to view progression history</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading progression history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchProgressions(false)}>
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
        <Text style={styles.title}>Progression History</Text>
        <Text style={styles.subtitle}>Track your strength gains over time</Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <TouchableOpacity
          style={[styles.timeRangeButton, selectedDays === 30 && styles.timeRangeButtonActive]}
          onPress={() => setSelectedDays(30)}
        >
          <Text style={[styles.timeRangeText, selectedDays === 30 && styles.timeRangeTextActive]}>
            30 Days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, selectedDays === 60 && styles.timeRangeButtonActive]}
          onPress={() => setSelectedDays(60)}
        >
          <Text style={[styles.timeRangeText, selectedDays === 60 && styles.timeRangeTextActive]}>
            60 Days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, selectedDays === 90 && styles.timeRangeButtonActive]}
          onPress={() => setSelectedDays(90)}
        >
          <Text style={[styles.timeRangeText, selectedDays === 90 && styles.timeRangeTextActive]}>
            90 Days
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{progressions.length}</Text>
          <Text style={styles.statLabel}>Total Progressions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {progressions.filter(p => p.adjustmentSource === 'ai_adjusted').length}
          </Text>
          <Text style={styles.statLabel}>AI Adjusted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {progressions.filter(p => (p.progressionStep ?? 0) > 0).length}
          </Text>
          <Text style={styles.statLabel}>Improvements</Text>
        </View>
      </View>

      {/* Progression List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Progressions</Text>
        {progressions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No progression data yet</Text>
            <Text style={styles.emptyStateSubtext}>Start tracking your workouts to see progression</Text>
          </View>
        ) : (
          progressions.map((progression) => {
            const change = getProgressionChange(progression.baselinePayload, progression.appliedPayload);
            
            return (
              <View key={progression.id} style={styles.progressionCard}>
                {/* Exercise Header */}
                <View style={styles.progressionHeader}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{progression.exerciseName}</Text>
                    <Text style={styles.progressionDate}>
                      {new Date(progression.planDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(progression.adjustmentSource) }]}>
                    <Text style={styles.sourceBadgeText}>{getSourceLabel(progression.adjustmentSource)}</Text>
                  </View>
                </View>

                {/* Progression Details */}
                <View style={styles.progressionDetails}>
                  <View style={styles.payloadRow}>
                    <Text style={styles.payloadLabel}>Baseline:</Text>
                    <Text style={styles.payloadValue}>{formatPayload(progression.baselinePayload)}</Text>
                  </View>
                  <View style={styles.payloadRow}>
                    <Text style={styles.payloadLabel}>Applied:</Text>
                    <Text style={styles.payloadValue}>{formatPayload(progression.appliedPayload)}</Text>
                  </View>
                  {change && (
                    <View style={styles.changeRow}>
                      <Ionicons name="trending-up" size={16} color="#10b981" />
                      <Text style={styles.changeText}>{change}</Text>
                    </View>
                  )}
                </View>

                {/* AI Confidence */}
                {progression.aiConfidence !== undefined && (
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceLabel}>AI Confidence:</Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceFill, 
                          { width: `${progression.aiConfidence * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.confidenceValue}>{Math.round(progression.aiConfidence * 100)}%</Text>
                  </View>
                )}

                {/* Rationale */}
                {progression.rationale && (
                  <View style={styles.rationaleContainer}>
                    <Ionicons name="information-circle" size={16} color="#6b7280" />
                    <Text style={styles.rationaleText}>{progression.rationale}</Text>
                  </View>
                )}
              </View>
            );
          })
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
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  timeRangeTextActive: {
    color: '#fff',
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
    fontSize: 28,
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
  progressionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  progressionDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressionDetails: {
    gap: 8,
    marginBottom: 12,
  },
  payloadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payloadLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  payloadValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6b7280',
    width: 90,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    width: 40,
    textAlign: 'right',
  },
  rationaleContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  rationaleText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
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
