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
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

import type { InsightsStackParamList } from '../types/navigation';

interface SexualHealthData {
  id: string;
  userId: string;
  date: string;
  sexualHealthStatus: 'optimal' | 'moderate' | 'reduced' | 'high_risk';
  evidence?: {
    sexualHealthStatus: string;
    signals: Array<{
      name: string;
      value: number | string | null;
      interpretation: string;
      trendDirection?: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
      trendPercentChange?: number;
      trendDataPoints?: number;
    }>;
    summary: string;
    trendMetadata?: {
      testosterone?: {
        direction: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
        percentChange?: number;
        dataPoints: number;
        timespanDays: number;
      };
      freeTestosterone?: {
        direction: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
        percentChange?: number;
        dataPoints: number;
        timespanDays: number;
      };
    };
  };
  recommendation: {
    type: string;
    priority: 'critical' | 'important' | 'optimization';
    summary: string;
    actions: string[];
    rationale?: string;
    source: string;
  };
  trendMetadata?: {
    testosterone?: {
      direction: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
      percentChange?: number;
      dataPoints: number;
      timespanDays: number;
    };
    freeTestosterone?: {
      direction: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
      percentChange?: number;
      dataPoints: number;
      timespanDays: number;
    };
  };
  createdAt: string;
}

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

const SexualHealthDashboardScreenV2: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<InsightsStackParamList>>();
  const { userId } = useUser();
  const [data, setData] = useState<SexualHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!userId) return;
    
    try {
      setError(null);
      const response = await healthApi.sexualHealthV2.getToday(userId);
      
      if (response.data?.success && response.data.data) {
        setData(response.data.data);
        console.log('Sexual health V2 data loaded:', response.data.data);
      } else {
        setError('No sexual health data available');
      }
    } catch (err: any) {
      console.error('Failed to load sexual health V2 data:', err);
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
  const hormoneSignals = evidence?.signals?.filter(s => 
    s.name.toLowerCase().includes('testosterone') || 
    s.name.toLowerCase().includes('estradiol') ||
    s.name.toLowerCase().includes('shbg')
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
          <Text style={styles.subtitle}>Hormones, vitality markers, and action plan (V2 with Trend Analysis)</Text>
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
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hormone Signals</Text>
          <View style={styles.card}>
            {hormoneSignals.length === 0 ? (
              <Text style={styles.emptyText}>No hormone signals available</Text>
            ) : (
              hormoneSignals.map((signal, idx) => (
                <View key={`signal-${idx}`} style={styles.signalRow}>
                  <View style={styles.signalHeader}>
                    <MaterialCommunityIcons name="test-tube" size={18} color="#A855F7" />
                    <Text style={styles.signalName}>{signal.name}</Text>
                  </View>
                  <View style={styles.signalMeta}>
                    <Text style={styles.signalValue}>{String(signal.value)}</Text>
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
  signalInterpretation: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
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

export default SexualHealthDashboardScreenV2;
