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
import { getRecoveryToday } from '../services/recoveryEngineService';
import { InputDetailsPanel } from '../components/InputDetailsPanel';
import type { RecoveryRecord } from '../types/recoveryEngine';

const RecoveryDashboardScreenV2: React.FC = () => {
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<RecoveryRecord | null>(null);
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

      const recoveryData = await getRecoveryToday(userId, { regenerate: isRefresh });
      setData(recoveryData);
      setError(null);
    } catch (err) {
      console.error('Error loading recovery data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recovery data');
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
      case 'fully_recovered':
        return 'Fully Recovered';
      case 'moderate_recovery':
        return 'Moderate Recovery';
      case 'poor_recovery':
        return 'Poor Recovery';
      default:
        return status;
    }
  };

  const statusToScore = (status: string): number => {
    switch (status) {
      case 'fully_recovered':
        return 85;
      case 'moderate_recovery':
        return 60;
      case 'poor_recovery':
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
          <Text style={styles.loadingText}>Loading recovery data...</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Recovery</Text>
          <Text style={styles.subtitle}>Track your recovery and readiness</Text>
        </View>

        {/* Main Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreMainSection}>
            <View style={styles.scoreIconContainer}>
              <MaterialCommunityIcons name="heart-pulse" size={48} color="#10B981" />
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreLabel}>Recovery Score</Text>
              {data.scoreBreakdown && (
                <View style={styles.scoreValueContainer}>
                  <Text style={styles.scoreValue}>{Math.round(data.scoreBreakdown.total)}</Text>
                  <Text style={styles.scoreMaxValue}>/100</Text>
                </View>
              )}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${data.scoreBreakdown?.percentage || statusToScore(data.recoveryStatus)}%` }]} />
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
                name={data.recoveryStatus === 'fully_recovered' ? 'check-circle' :
                      data.recoveryStatus === 'moderate_recovery' ? 'information' : 'alert-circle'}
                size={16}
                color="#0F172A"
              />
              <Text style={styles.statusText}>{statusLabel(data.recoveryStatus)}</Text>
            </View>
          </View>
        </View>

        {/* Score Breakdown */}
        {data.scoreBreakdown && data.detailedInputs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score Breakdown</Text>

            {/* Sleep Recovery Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="sleep" size={20} color="#8B5CF6" />
                  <Text style={styles.categoryTitle}>Sleep Recovery</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.sleepRecovery.percentage}%`, backgroundColor: data.scoreBreakdown.sleepRecovery.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.sleepRecovery.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.sleepRecovery.score}/{data.scoreBreakdown.sleepRecovery.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.sleepRecovery.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.sleepRecovery.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.sleepRecovery.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel
                inputs={data.detailedInputs.filter(i =>
                  ['Sleep Duration', 'Sleep Quality'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Cardiovascular Recovery Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="#EF4444" />
                  <Text style={styles.categoryTitle}>Cardiovascular Recovery</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.cardiovascularRecovery.percentage}%`, backgroundColor: data.scoreBreakdown.cardiovascularRecovery.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.cardiovascularRecovery.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.cardiovascularRecovery.score}/{data.scoreBreakdown.cardiovascularRecovery.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.cardiovascularRecovery.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.cardiovascularRecovery.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.cardiovascularRecovery.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel
                inputs={data.detailedInputs.filter(i =>
                  ['Heart Rate Variability', 'Resting Heart Rate'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Training Load Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="dumbbell" size={20} color="#F59E0B" />
                  <Text style={styles.categoryTitle}>Training Load</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.trainingLoad.percentage}%`, backgroundColor: data.scoreBreakdown.trainingLoad.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.trainingLoad.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.trainingLoad.score}/{data.scoreBreakdown.trainingLoad.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.trainingLoad.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.trainingLoad.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.trainingLoad.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel
                inputs={data.detailedInputs.filter(i =>
                  ['Workout Load', 'Adherence Score'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Subjective Recovery Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="head-heart" size={20} color="#3B82F6" />
                  <Text style={styles.categoryTitle}>Subjective Recovery</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.subjectiveRecovery.percentage}%`, backgroundColor: data.scoreBreakdown.subjectiveRecovery.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.subjectiveRecovery.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.subjectiveRecovery.score}/{data.scoreBreakdown.subjectiveRecovery.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.subjectiveRecovery.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.subjectiveRecovery.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.subjectiveRecovery.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel
                inputs={data.detailedInputs.filter(i =>
                  ['Stress Level', 'Verbal Recovery Feeling'].includes(i.name)
                )}
                title=""
              />
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  scoreMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -1,
  },
  scoreMaxValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 2,
  },
  progressBarContainer: {
    marginBottom: 6,
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
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginLeft: 8,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  errorMessage: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RecoveryDashboardScreenV2;
