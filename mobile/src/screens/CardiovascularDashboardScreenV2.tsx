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
import { useUser, DEFAULT_USER_ID } from '../context/UserContext';
import { healthApi } from '../services/api';

import type { InsightsStackParamList } from '../types/navigation';

interface CardiovascularRecord {
  id: string;
  userId: string;
  date: string;
  cardiovascularStatus: 'optimal' | 'moderate' | 'elevated_risk' | 'high_risk';
  evidence?: {
    cardiovascularStatus: string;
    signals: Array<{
      name: string;
      value: number | string | null;
      interpretation: string;
    }>;
    summary: string;
  };
  recommendation: {
    type: string;
    priority: 'critical' | 'important' | 'optimization';
    summary: string;
    actions: string[];
    rationale?: string;
    source?: string;
  };
  createdAt: string;
}

const CardiovascularDashboardScreenV2: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<InsightsStackParamList>>();
  const { userId } = useUser();
  const resolvedUserId = userId ?? DEFAULT_USER_ID;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardioData, setCardioData] = useState<CardiovascularRecord | null>(null);

  const loadData = async () => {
    if (!resolvedUserId) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Loading cardiovascular data for userId:', resolvedUserId);
      const response = await healthApi.cardiovascular.getToday(resolvedUserId);
      console.log('Cardiovascular response:', response.data);
      
      if (response.data?.data) {
        setCardioData(response.data.data);
      } else {
        setError('No cardiovascular data available');
      }
    } catch (err: any) {
      console.error('Error loading cardiovascular data:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load cardiovascular data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedUserId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCardioScore = (status: string): number => {
    switch (status) {
      case 'optimal': return 85;
      case 'moderate': return 72;
      case 'elevated_risk': return 55;
      case 'high_risk': return 35;
      default: return 50;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'optimal': return 'Optimal';
      case 'moderate': return 'Stable';
      case 'elevated_risk': return 'At Risk';
      case 'high_risk': return 'High Risk';
      default: return 'Unknown';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'optimal':
        return [styles.statusBadge, styles.statusOptimal];
      case 'moderate':
        return [styles.statusBadge, styles.statusStable];
      case 'elevated_risk':
        return [styles.statusBadge, styles.statusRisk];
      case 'high_risk':
        return [styles.statusBadge, styles.statusCritical];
      default:
        return styles.statusBadge;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'important': return '#F59E0B';
      case 'optimization': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.centerText}>Loading cardiovascular data...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>Error Loading Data</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadData}>
        <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <MaterialCommunityIcons name="heart-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Cardiovascular Data</Text>
      <Text style={styles.emptyText}>
        Cardiovascular health data is not available. Please ensure your baseline profile and health data are up to date.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadData}>
        <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  if (error && !cardioData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cardiovascular Status</Text>
          <Text style={styles.subtitle}>Heart health signals, labs, and daily actions</Text>
        </View>
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  if (!cardioData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cardiovascular Status</Text>
          <Text style={styles.subtitle}>Heart health signals, labs, and daily actions</Text>
        </View>
        {renderEmptyState()}
      </SafeAreaView>
    );
  }

  const score = getCardioScore(cardioData.cardiovascularStatus);
  const statusLabel = getStatusLabel(cardioData.cardiovascularStatus);

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
          <Text style={styles.title}>Cardiovascular Status</Text>
          <Text style={styles.subtitle}>Heart health signals, labs, and daily actions</Text>
        </View>

        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>Current Score</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.lastUpdated}>
              Last updated {new Date(cardioData.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.statusWrapper}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={getStatusBadgeStyle(cardioData.cardiovascularStatus)}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
            <Text style={styles.riskLevel}>
              {cardioData.cardiovascularStatus.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {cardioData.evidence?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.card}>
              <Text style={styles.summaryText}>{cardioData.evidence.summary}</Text>
            </View>
          </View>
        )}

        {cardioData.evidence?.signals && cardioData.evidence.signals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Signals</Text>
            <View style={styles.card}>
              {cardioData.evidence.signals.map((signal, index) => (
                <View key={index} style={styles.signalRow}>
                  <View style={styles.signalHeader}>
                    <MaterialCommunityIcons name="heart-pulse" size={18} color="#EF4444" />
                    <Text style={styles.signalLabel}>{signal.name}</Text>
                  </View>
                  <Text style={styles.signalValue}>
                    {signal.value !== null ? String(signal.value) : 'N/A'}
                  </Text>
                  <Text style={styles.signalNote}>{signal.interpretation}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {cardioData.recommendation && (
          <View style={styles.section}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(cardioData.recommendation.priority) },
                ]}
              >
                <Text style={styles.priorityText}>
                  {cardioData.recommendation.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.recommendationSummary}>
                {cardioData.recommendation.summary}
              </Text>
              {cardioData.recommendation.rationale && (
                <Text style={styles.recommendationRationale}>
                  Rationale: {cardioData.recommendation.rationale}
                </Text>
              )}
              {cardioData.recommendation.actions && cardioData.recommendation.actions.length > 0 && (
                <View style={styles.actionsContainer}>
                  <Text style={styles.actionsTitle}>Action Steps:</Text>
                  {cardioData.recommendation.actions.map((action, index) => (
                    <View key={index} style={styles.actionRow}>
                      <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={18} color="#22C55E" />
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('VoiceInterview')}
        >
          <Text style={styles.ctaText}>Discuss with AI Coach</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
  },
  scoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0F172A',
  },
  lastUpdated: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
  },
  statusWrapper: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusOptimal: {
    backgroundColor: '#DCFCE7',
  },
  statusStable: {
    backgroundColor: '#FEF9C3',
  },
  statusRisk: {
    backgroundColor: '#FEE2E2',
  },
  statusCritical: {
    backgroundColor: '#FECACA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  riskLevel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  signalRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  signalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  signalNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationSummary: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  recommendationRationale: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  centerText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CardiovascularDashboardScreenV2;
