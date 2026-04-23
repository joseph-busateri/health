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
          <Text style={styles.title}>Sexual Health Focus</Text>
          <Text style={styles.subtitle}>Hormones, vitality markers, and action plan (V3 with Raw Values)</Text>
        </View>

        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{statusToScore(data.sexualHealthStatus)}</Text>
            <Text style={styles.lastLab}>Last updated {new Date(data.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.statusWrapper}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={statusBadgeStyle(data.sexualHealthStatus)}>
              <Text style={styles.statusText}>{statusLabel(data.sexualHealthStatus)}</Text>
            </View>
            <Text style={styles.focusLabel}>Trend Analysis</Text>
            {trendMetadata?.testosterone ? (
              <View style={styles.trendRow}>
                <MaterialCommunityIcons
                  name={getTrendIcon(trendMetadata.testosterone.direction)}
                  size={20}
                  color={getTrendColor(trendMetadata.testosterone.direction)}
                />
                <Text style={styles.trendText}>
                  Testosterone {trendMetadata.testosterone.direction}
                  {trendMetadata.testosterone.percentChange && ` (${trendMetadata.testosterone.percentChange.toFixed(1)}%)`}
                </Text>
              </View>
            ) : (
              <Text style={styles.trendText}>Insufficient trend data</Text>
            )}
            {trendMetadata?.freeTestosterone && (
              <View style={styles.trendRow}>
                <MaterialCommunityIcons
                  name={getTrendIcon(trendMetadata.freeTestosterone.direction)}
                  size={20}
                  color={getTrendColor(trendMetadata.freeTestosterone.direction)}
                />
                <Text style={styles.trendText}>
                  Free Testosterone {trendMetadata.freeTestosterone.direction}
                  {trendMetadata.freeTestosterone.percentChange && ` (${trendMetadata.freeTestosterone.percentChange.toFixed(1)}%)`}
                </Text>
              </View>
            )}
            {trendMetadata?.estradiol && (
              <View style={styles.trendRow}>
                <MaterialCommunityIcons
                  name={getTrendIcon(trendMetadata.estradiol.direction)}
                  size={20}
                  color={getTrendColor(trendMetadata.estradiol.direction)}
                />
                <Text style={styles.trendText}>
                  Estradiol {trendMetadata.estradiol.direction}
                  {trendMetadata.estradiol.percentChange && ` (${trendMetadata.estradiol.percentChange.toFixed(1)}%)`}
                </Text>
              </View>
            )}
            {trendMetadata?.shbg && (
              <View style={styles.trendRow}>
                <MaterialCommunityIcons
                  name={getTrendIcon(trendMetadata.shbg.direction)}
                  size={20}
                  color={getTrendColor(trendMetadata.shbg.direction)}
                />
                <Text style={styles.trendText}>
                  SHBG {trendMetadata.shbg.direction}
                  {trendMetadata.shbg.percentChange && ` (${trendMetadata.shbg.percentChange.toFixed(1)}%)`}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Values</Text>
          <View style={styles.card}>
            {currentValuesDisplay.map((item, idx) => (
              <View key={`current-${idx}`} style={styles.signalRow}>
                <View style={styles.signalHeader}>
                  <MaterialCommunityIcons name={item.icon} size={18} color="#A855F7" />
                  <Text style={styles.signalName}>{item.key}</Text>
                </View>
                <View style={styles.signalMeta}>
                  {item.hasData && item.signal ? (
                    <>
                      <Text style={styles.signalValue}>
                        {item.signal.rawValue ? `${item.signal.rawValue} ${item.signal.rawUnit || ''}` : String(item.signal.value)}
                      </Text>
                      {item.signal.clinicalCategory && (
                        <View style={[styles.categoryBadge, { backgroundColor: getClinicalCategoryColor(item.signal.clinicalCategory) + '20' }]}>
                          <Text style={[styles.categoryText, { color: getClinicalCategoryColor(item.signal.clinicalCategory) }]}>
                            {item.signal.clinicalCategory.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={styles.noDataText}>No data</Text>
                  )}
                </View>
                {item.hasData && item.signal && item.signal.referenceRange && (
                  <Text style={styles.referenceRange}>
                    Reference: {item.signal.referenceRange.min}-{item.signal.referenceRange.max} {item.signal.rawUnit}
                  </Text>
                )}
                <Text style={styles.signalInterpretation}>
                  {item.hasData && item.signal ? item.signal.interpretation : 'Awaiting bloodwork results'}
                </Text>
              </View>
            ))}
          </View>
        </View>

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
    backgroundColor: '#0F172A',
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  scoreCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  signalRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  signalName: {
    color: '#fff',
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
    color: '#fff',
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
    borderTopColor: '#334155',
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
    backgroundColor: '#1E293B',
    borderRadius: 4,
    marginBottom: 4,
  },
  historyDate: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  historyValue: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  rationaleBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  rationaleLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },
  rationaleText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  summaryText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A855F7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SexualHealthDashboardScreenV3;
