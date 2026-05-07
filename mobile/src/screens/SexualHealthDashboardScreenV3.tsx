import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import { getSexualHealthTodayV3 } from '../services/sexualHealthEngineService';
import { InputDetailsPanel } from '../components/InputDetailsPanel';

import type { InsightsStackParamList } from '../types/navigation';
import type { SexualHealthRecordV3 } from '../types/sexualHealthEngine';

const statusBadgeStyle = (status: string) => {
  switch (status) {
    case 'optimal':
      return [styles.statusBadge, styles.statusOptimal];
    case 'moderate':
      return [styles.statusBadge, styles.statusModerate];
    case 'reduced':
      return [styles.statusBadge, styles.statusReduced];
    case 'high_risk':
      return [styles.statusBadge, styles.statusHighRisk];
    default:
      return styles.statusBadge;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'optimal':
      return 'Optimal';
    case 'moderate':
      return 'Moderate';
    case 'reduced':
      return 'Needs Review';
    case 'high_risk':
      return 'Urgent';
    default:
      return 'Unknown';
  }
};

const statusToScore = (status: string): number => {
  switch (status) {
    case 'optimal': return 90;
    case 'moderate': return 75;
    case 'reduced': return 55;
    case 'high_risk': return 35;
    default: return 70;
  }
};

const getTrendIcon = (direction?: string) => {
  switch (direction) {
    case 'improving':
      return 'trending-up';
    case 'worsening':
      return 'trending-down';
    case 'stable':
      return 'trending-neutral';
    default:
      return 'help-circle-outline';
  }
};

const getTrendColor = (direction?: string) => {
  switch (direction) {
    case 'improving':
      return '#22C55E';
    case 'worsening':
      return '#EF4444';
    case 'stable':
      return '#F59E0B';
    default:
      return '#94A3B8';
  }
};

const getClinicalCategoryColor = (category?: string) => {
  switch (category) {
    case 'optimal':
      return '#22C55E';
    case 'borderline':
      return '#F59E0B';
    case 'low':
      return '#EF4444';
    case 'high':
      return '#EF4444';
    default:
      return '#94A3B8';
  }
};

const SexualHealthDashboardScreenV3: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<InsightsStackParamList>>();
  const { userId } = useUser();
  const [data, setData] = useState<SexualHealthRecordV3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!userId) return;
    
    try {
      setError(null);
      const response = await getSexualHealthTodayV3(userId);
      
      if (response) {
        setData(response);
        console.log('Sexual health V3 data loaded:', response);
      } else {
        setError('No sexual health data available');
      }
    } catch (err: any) {
      console.error('Failed to load sexual health V3 data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
          <Text style={styles.loadingText}>Loading sexual health data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Sexual Health Focus</Text>
            <Text style={styles.subtitle}>Hormones, vitality markers, and action plan</Text>
          </View>

          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Unable to Load Data</Text>
            <Text style={styles.errorMessage}>{error || 'No data available'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { evidence, recommendation, trendMetadata } = data;
  
  // Define expected hormone markers for Current Values section
  const expectedMarkers = [
    { key: 'Total Testosterone', unit: 'ng/dL', icon: 'test-tube' as const },
    { key: 'Free Testosterone', unit: 'ng/dL', icon: 'test-tube' as const },
    { key: 'Estradiol', unit: 'pg/mL', icon: 'test-tube' as const },
    { key: 'SHBG', unit: 'nmol/L', icon: 'test-tube' as const },
  ];
  
  // Split signals into current values (absolute) and trends
  const currentValueSignals = evidence?.signals?.filter(s => 
    !s.name.toLowerCase().includes('trend') &&
    (s.name.toLowerCase().includes('testosterone') || 
     s.name.toLowerCase().includes('estradiol') ||
     s.name.toLowerCase().includes('shbg'))
  ) || [];
  
  // Merge expected markers with actual signals to show all fields
  const currentValuesDisplay = expectedMarkers.map(marker => {
    const signal = currentValueSignals.find(s => 
      s.name.toLowerCase() === marker.key.toLowerCase()
    );
    return {
      ...marker,
      signal: signal || null,
      hasData: !!signal,
    };
  });
  
  const trendSignals = evidence?.signals?.filter(s => 
    s.name.toLowerCase().includes('trend')
  ) || [];

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
          <Text style={styles.title}>Sexual Health</Text>
          <Text style={styles.subtitle}>Track your sexual health markers</Text>
        </View>

        {/* Main Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreMainSection}>
            <View style={styles.scoreIconContainer}>
              <MaterialCommunityIcons name="heart-pulse" size={48} color="#A855F7" />
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreLabel}>Sexual Health Score</Text>
              {data.scoreBreakdown && (
                <View style={styles.scoreValueContainer}>
                  <Text style={styles.scoreValue}>{Math.round(data.scoreBreakdown.total)}</Text>
                  <Text style={styles.scoreMaxValue}>/100</Text>
                </View>
              )}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${data.scoreBreakdown?.percentage || statusToScore(data.sexualHealthStatus)}%` }]} />
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
                name={data.sexualHealthStatus === 'optimal' ? 'check-circle' : 
                      data.sexualHealthStatus === 'moderate' ? 'information' :
                      data.sexualHealthStatus === 'reduced' ? 'alert' : 'alert-circle'} 
                size={16} 
                color="#0F172A" 
              />
              <Text style={styles.statusText}>{statusLabel(data.sexualHealthStatus)}</Text>
            </View>
          </View>
        </View>

        {/* Score Breakdown */}
        {data.scoreBreakdown && data.detailedInputs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score Breakdown</Text>
            
            {/* Testosterone Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="test-tube" size={20} color="#A855F7" />
                  <Text style={styles.categoryTitle}>Testosterone</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.testosterone.percentage}%`, backgroundColor: data.scoreBreakdown.testosterone.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.testosterone.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.testosterone.score}/{data.scoreBreakdown.testosterone.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.testosterone.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.testosterone.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.testosterone.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel 
                inputs={data.detailedInputs.filter(i => 
                  ['Total Testosterone', 'Free Testosterone'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Libido Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="heart" size={20} color="#EC4899" />
                  <Text style={styles.categoryTitle}>Libido</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.libido.percentage}%`, backgroundColor: data.scoreBreakdown.libido.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.libido.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.libido.score}/{data.scoreBreakdown.libido.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.libido.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.libido.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.libido.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel 
                inputs={data.detailedInputs.filter(i => 
                  ['Libido Self-Rating', 'Stress Level', 'Sleep Quality'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Erectile Function Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="human-male" size={20} color="#3B82F6" />
                  <Text style={styles.categoryTitle}>Erectile Function</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${data.scoreBreakdown.erectileFunction.percentage}%`, backgroundColor: data.scoreBreakdown.erectileFunction.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.erectileFunction.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {data.scoreBreakdown.erectileFunction.score}/{data.scoreBreakdown.erectileFunction.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: data.scoreBreakdown.erectileFunction.percentage >= 70 ? '#22C55E' : data.scoreBreakdown.erectileFunction.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {data.scoreBreakdown.erectileFunction.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel 
                inputs={data.detailedInputs.filter(i => 
                  ['Erectile Function Rating', 'Morning Erections Frequency'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Total Score Summary */}
            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Sexual Health Score</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trend Analysis</Text>
          <View style={styles.card}>
            {trendSignals.length === 0 ? (
              <Text style={styles.emptyText}>No trend data available</Text>
            ) : (
              trendSignals.map((signal, idx) => (
                <View key={`trend-${idx}`} style={styles.signalRow}>
                  <View style={styles.signalHeader}>
                    <MaterialCommunityIcons name="chart-line" size={18} color="#A855F7" />
                    <Text style={styles.signalName}>{signal.name}</Text>
                  </View>
                  <View style={styles.signalMeta}>
                    <Text style={styles.signalValue}>
                      {signal.rawValue ? `${signal.rawValue} ${signal.rawUnit || ''}` : String(signal.value)}
                    </Text>
                    {signal.trendDirection && (
                      <View style={styles.trendBadge}>
                        <MaterialCommunityIcons 
                          name={getTrendIcon(signal.trendDirection)} 
                          size={14} 
                          color={getTrendColor(signal.trendDirection)} 
                        />
                        <Text style={styles.trendBadgeText}>{signal.trendDirection}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.signalInterpretation}>{signal.interpretation}</Text>
                  {signal.history && signal.history.length > 0 && (
                    <View style={styles.historyContainer}>
                      <Text style={styles.historyTitle}>Historical Values ({signal.history.length} tests)</Text>
                      {signal.history.map((point, histIdx) => (
                        <View key={`hist-${idx}-${histIdx}`} style={styles.historyRow}>
                          <Text style={styles.historyDate}>
                            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                          <Text style={styles.historyValue}>
                            {point.value} {signal.rawUnit || ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.card}>
            {recommendation.actions.map((action, idx) => (
              <View key={`rec-${idx}`} style={styles.actionRow}>
                <MaterialCommunityIcons name="clipboard-pulse" size={18} color="#F97316" />
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
            {recommendation.rationale && (
              <View style={styles.rationaleBox}>
                <Text style={styles.rationaleLabel}>Rationale</Text>
                <Text style={styles.rationaleText}>{recommendation.rationale}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence Summary</Text>
          <View style={styles.card}>
            <Text style={styles.summaryText}>{evidence?.summary || 'No summary available'}</Text>
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
    backgroundColor: '#FAF5FF',
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
    backgroundColor: '#A855F7',
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
  statusLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
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
  statusOptimal: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusModerate: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusReduced: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
  },
  statusHighRisk: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  lastLab: {
    color: '#64748B',
    fontSize: 12,
  },
  statusWrapper: {
    alignItems: 'flex-end',
  },
  focusLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trendText: {
    color: '#64748B',
    fontSize: 14,
    marginLeft: 8,
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
  signalRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  signalName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  signalValue: {
    color: '#A855F7',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  noDataText: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendBadgeText: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  referenceRange: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  signalInterpretation: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  historyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  historyTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    marginBottom: 4,
  },
  historyDate: {
    color: '#64748B',
    fontSize: 12,
  },
  historyValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: '#475569',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  rationaleBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  rationaleLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  rationaleText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  summaryText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
    borderColor: '#A855F7',
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
});

export default SexualHealthDashboardScreenV3;
