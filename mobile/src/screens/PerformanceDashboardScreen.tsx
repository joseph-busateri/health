import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { InputDetailsPanel } from '../components/InputDetailsPanel';
import type { PerformanceRecord } from '../types/performanceEngine';
import { API_BASE_URL } from '../config';

const getPerformanceToday = async (userId: string, options?: { regenerate?: boolean }): Promise<PerformanceRecord> => {
  const regenerate = options?.regenerate ? '?regenerate=true' : '';
  const response = await fetch(`${API_BASE_URL}/api/performance/${userId}/today${regenerate}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch performance data: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.data;
};

const PerformanceDashboardScreen: React.FC = () => {
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PerformanceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    if (!userId) {
      setError('No user ID available');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const performanceData = await getPerformanceToday(userId, { regenerate: isRefresh });
      setData(performanceData);
      setError(null);
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleRefresh = () => {
    loadData(true);
  };

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'optimal':
        return 'Optimal';
      case 'good':
        return 'Good';
      case 'moderate':
        return 'Moderate';
      case 'limited':
        return 'Limited';
      default:
        return status;
    }
  };

  const statusToScore = (status: string): number => {
    switch (status) {
      case 'optimal':
        return 85;
      case 'good':
        return 70;
      case 'moderate':
        return 55;
      case 'limited':
        return 35;
      default:
        return 50;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading performance data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Data</Text>
          <Text style={styles.errorMessage}>{error || 'No data available'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10B981" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Performance</Text>
          <Text style={styles.subtitle}>Track your training capacity and readiness</Text>
        </View>

        {/* Main Score Card */}
        <View style={styles.mainCard}>
          <View style={styles.scoreMainSection}>
            <View style={styles.scoreIconContainer}>
              <MaterialCommunityIcons name="run-fast" size={48} color="#10B981" />
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreLabel}>Performance Score</Text>
              {data.scoreBreakdown && (
                <View style={styles.scoreValueContainer}>
                  <Text style={styles.scoreValue}>{Math.round(data.scoreBreakdown.total)}</Text>
                  <Text style={styles.scoreMaxValue}>/100</Text>
                </View>
              )}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${data.scoreBreakdown?.percentage || statusToScore(data.performanceStatus)}%` }]} />
                </View>
              </View>
              <Text style={styles.lastUpdated}>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#94A3B8" />
                {' '}Updated {new Date(data.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.statusBadgeContainer}>
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons
                name={data.performanceStatus === 'optimal' ? 'check-circle' :
                      data.performanceStatus === 'good' ? 'information' : 
                      data.performanceStatus === 'moderate' ? 'alert' : 'alert-circle'}
                size={16}
                color="#0F172A"
              />
              <Text style={styles.statusText}>{statusLabel(data.performanceStatus)}</Text>
            </View>
          </View>
        </View>

        {/* Score Breakdown */}
        {data.scoreBreakdown && data.detailedInputs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score Breakdown</Text>

            {/* Joint Health Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="bone" size={20} color="#8B5CF6" />
                  <Text style={styles.categoryTitle}>Joint Health</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.jointHealth.percentage}%`, backgroundColor: data.scoreBreakdown.jointHealth.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.jointHealth.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.jointHealth.score}/{data.scoreBreakdown.jointHealth.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.jointHealth.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.jointHealth.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.jointHealth.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel
                inputs={data.detailedInputs.filter(i =>
                  ['Pain Level', 'Tightness Level', 'Soreness Level'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Training Execution Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="dumbbell" size={20} color="#EF4444" />
                  <Text style={styles.categoryTitle}>Training Execution</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.trainingExecution.percentage}%`, backgroundColor: data.scoreBreakdown.trainingExecution.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.trainingExecution.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.trainingExecution.score}/{data.scoreBreakdown.trainingExecution.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.trainingExecution.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.trainingExecution.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.trainingExecution.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel
                inputs={data.detailedInputs.filter(i =>
                  ['Workout Adherence', 'Workout Load', 'Session Completion Rate'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Physical Capacity Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="#F59E0B" />
                  <Text style={styles.categoryTitle}>Physical Capacity</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.physicalCapacity.percentage}%`, backgroundColor: data.scoreBreakdown.physicalCapacity.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.physicalCapacity.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.physicalCapacity.score}/{data.scoreBreakdown.physicalCapacity.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.physicalCapacity.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.physicalCapacity.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.physicalCapacity.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel
                inputs={data.detailedInputs.filter(i =>
                  ['VO2 Max', 'Resting Heart Rate', 'Lean Mass'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Recovery Readiness Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="sleep" size={20} color="#3B82F6" />
                  <Text style={styles.categoryTitle}>Recovery Readiness</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.recoveryReadiness.percentage}%`, backgroundColor: data.scoreBreakdown.recoveryReadiness.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.recoveryReadiness.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.recoveryReadiness.score}/{data.scoreBreakdown.recoveryReadiness.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.recoveryReadiness.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.recoveryReadiness.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.recoveryReadiness.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel
                inputs={data.detailedInputs.filter(i =>
                  ['Recovery Score', 'Sleep Quality', 'Stress Score'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Total Score Summary */}
            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Performance Score</Text>
                <View style={styles.totalScoreContainer}>
                  <Text style={styles.totalScore}>{data.scoreBreakdown.total}</Text>
                  <Text style={styles.totalMax}>/{data.scoreBreakdown.maxTotal}</Text>
                  <Text style={[styles.totalPercentage, { 
                    color: data.scoreBreakdown.percentage >= 70 ? '#22C55E' : 
                           data.scoreBreakdown.percentage >= 50 ? '#F59E0B' : '#EF4444' 
                  }]}>
                    ({data.scoreBreakdown.percentage}%)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.card}>
            <Text style={styles.summaryText}>{data.recommendation.summary}</Text>
            {data.recommendation.actions.map((action, idx) => (
              <View key={idx} style={styles.actionRow}>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#10B981" />
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  scoreMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0F172A',
  },
  scoreMaxValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 4,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 999,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  categoryScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryProgressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  categoryScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalScore: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalMax: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  totalPercentage: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#475569',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
});

export default PerformanceDashboardScreen;
