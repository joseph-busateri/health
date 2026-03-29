import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3020';
const USER_ID = 'default-user';

type TrendTab = 'bloodwork' | 'recovery' | 'stress' | 'adherence' | 'overall';

interface BloodworkTrend {
  date: string;
  testosterone: number | null;
  ldl: number | null;
  hdl: number | null;
  glucose: number | null;
}

interface RecoveryTrend {
  date: string;
  recoveryScore: number;
  recoveryStatus: string;
}

interface StressTrend {
  date: string;
  stressLevel: number;
  stressStatus: string;
}

interface AdherenceTrend {
  date: string;
  adherenceScore: number;
  breakdown: {
    workout?: number;
    nutrition?: number;
    supplements?: number;
  };
}

interface OverallHealthTrend {
  date: string;
  overallScore: number;
  overallStatus: string;
}

const TrendsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrendTab>('overall');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bloodworkTrends, setBloodworkTrends] = useState<BloodworkTrend[]>([]);
  const [recoveryTrends, setRecoveryTrends] = useState<RecoveryTrend[]>([]);
  const [stressTrends, setStressTrends] = useState<StressTrend[]>([]);
  const [adherenceTrends, setAdherenceTrends] = useState<AdherenceTrend[]>([]);
  const [overallHealthTrends, setOverallHealthTrends] = useState<OverallHealthTrend[]>([]);

  const fetchTrendsData = async () => {
    try {
      setError(null);

      // Fetch bloodwork trends
      const bloodworkResponse = await fetch(`${API_BASE_URL}/bloodwork/trends?user_id=${USER_ID}&days=30`);
      if (bloodworkResponse.ok) {
        const bloodworkData = await bloodworkResponse.json();
        if (bloodworkData.success && bloodworkData.data) {
          setBloodworkTrends(bloodworkData.data.trends || []);
        }
      }

      // Fetch recovery history
      const recoveryResponse = await fetch(`${API_BASE_URL}/recovery/${USER_ID}/history`);
      if (recoveryResponse.ok) {
        const recoveryData = await recoveryResponse.json();
        if (recoveryData.success && recoveryData.data) {
          const trends = recoveryData.data.slice(0, 30).map((item: any) => ({
            date: item.date,
            recoveryScore: item.recoveryScore,
            recoveryStatus: item.recoveryStatus,
          }));
          setRecoveryTrends(trends);
        }
      }

      // Fetch stress history
      const stressResponse = await fetch(`${API_BASE_URL}/stress/${USER_ID}/history`);
      if (stressResponse.ok) {
        const stressData = await stressResponse.json();
        if (stressData.success && stressData.data) {
          const trends = stressData.data.slice(0, 30).map((item: any) => ({
            date: item.date,
            stressLevel: item.stressLevel,
            stressStatus: item.stressStatus,
          }));
          setStressTrends(trends);
        }
      }

      // Fetch adherence history
      const adherenceResponse = await fetch(`${API_BASE_URL}/adherence/${USER_ID}/history`);
      if (adherenceResponse.ok) {
        const adherenceData = await adherenceResponse.json();
        if (adherenceData.success && adherenceData.data) {
          const trends = adherenceData.data.slice(0, 30).map((item: any) => ({
            date: item.date,
            adherenceScore: item.adherenceScore,
            breakdown: item.breakdown,
          }));
          setAdherenceTrends(trends);
        }
      }

      // Generate overall health trends (mock for now - would come from Control Tower history)
      const mockOverallTrends: OverallHealthTrend[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        overallScore: 70 + Math.floor(Math.random() * 20),
        overallStatus: 'Stable',
      }));
      setOverallHealthTrends(mockOverallTrends);

    } catch (err) {
      setError('Failed to load trends data');
      console.error('Trends fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendsData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrendsData();
  };

  const renderTabButton = (tab: TrendTab, label: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderMiniChart = (data: number[], label: string, color: string) => {
    if (data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <View style={styles.miniChart}>
        <Text style={styles.miniChartLabel}>{label}</Text>
        <View style={styles.miniChartBars}>
          {data.slice(0, 14).reverse().map((value, index) => {
            const height = ((value - min) / range) * 60 + 10;
            return (
              <View key={index} style={styles.miniChartBarContainer}>
                <View style={[styles.miniChartBar, { height, backgroundColor: color }]} />
              </View>
            );
          })}
        </View>
        <View style={styles.miniChartStats}>
          <Text style={styles.miniChartStatText}>Min: {min.toFixed(0)}</Text>
          <Text style={styles.miniChartStatText}>Max: {max.toFixed(0)}</Text>
          <Text style={styles.miniChartStatText}>Avg: {(data.reduce((a, b) => a + b, 0) / data.length).toFixed(0)}</Text>
        </View>
      </View>
    );
  };

  const renderBloodworkTrends = () => {
    if (bloodworkTrends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>📊</Text>
          <Text style={styles.emptyStateTitle}>No Bloodwork Data</Text>
          <Text style={styles.emptyStateSubtitle}>Upload bloodwork results to see trends</Text>
        </View>
      );
    }

    const testosteroneData = bloodworkTrends.map(t => t.testosterone).filter(v => v !== null) as number[];
    const ldlData = bloodworkTrends.map(t => t.ldl).filter(v => v !== null) as number[];
    const hdlData = bloodworkTrends.map(t => t.hdl).filter(v => v !== null) as number[];
    const glucoseData = bloodworkTrends.map(t => t.glucose).filter(v => v !== null) as number[];

    return (
      <View style={styles.trendsContent}>
        <Text style={styles.sectionTitle}>Bloodwork Trends (Last 30 Days)</Text>
        {testosteroneData.length > 0 && renderMiniChart(testosteroneData, 'Testosterone (ng/dL)', '#3B82F6')}
        {ldlData.length > 0 && renderMiniChart(ldlData, 'LDL Cholesterol (mg/dL)', '#EF4444')}
        {hdlData.length > 0 && renderMiniChart(hdlData, 'HDL Cholesterol (mg/dL)', '#10B981')}
        {glucoseData.length > 0 && renderMiniChart(glucoseData, 'Glucose (mg/dL)', '#F59E0B')}
      </View>
    );
  };

  const renderRecoveryTrends = () => {
    if (recoveryTrends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>💤</Text>
          <Text style={styles.emptyStateTitle}>No Recovery Data</Text>
          <Text style={styles.emptyStateSubtitle}>Log daily health inputs to track recovery</Text>
        </View>
      );
    }

    const recoveryScores = recoveryTrends.map(t => t.recoveryScore);

    return (
      <View style={styles.trendsContent}>
        <Text style={styles.sectionTitle}>Recovery Trends (Last 30 Days)</Text>
        {renderMiniChart(recoveryScores, 'Recovery Score', '#10B981')}
        
        <View style={styles.dataList}>
          <Text style={styles.dataListTitle}>Recent Recovery Scores</Text>
          {recoveryTrends.slice(0, 10).map((trend, index) => (
            <View key={index} style={styles.dataListItem}>
              <Text style={styles.dataListDate}>{new Date(trend.date).toLocaleDateString()}</Text>
              <View style={styles.dataListRight}>
                <Text style={styles.dataListScore}>{trend.recoveryScore}%</Text>
                <Text style={[styles.dataListStatus, getStatusColor(trend.recoveryStatus)]}>
                  {trend.recoveryStatus}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStressTrends = () => {
    if (stressTrends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>🧠</Text>
          <Text style={styles.emptyStateTitle}>No Stress Data</Text>
          <Text style={styles.emptyStateSubtitle}>Log daily health inputs to track stress</Text>
        </View>
      );
    }

    const stressLevels = stressTrends.map(t => t.stressLevel);

    return (
      <View style={styles.trendsContent}>
        <Text style={styles.sectionTitle}>Stress Trends (Last 30 Days)</Text>
        {renderMiniChart(stressLevels, 'Stress Level (1-5)', '#F59E0B')}
        
        <View style={styles.dataList}>
          <Text style={styles.dataListTitle}>Recent Stress Levels</Text>
          {stressTrends.slice(0, 10).map((trend, index) => (
            <View key={index} style={styles.dataListItem}>
              <Text style={styles.dataListDate}>{new Date(trend.date).toLocaleDateString()}</Text>
              <View style={styles.dataListRight}>
                <Text style={styles.dataListScore}>{trend.stressLevel}/5</Text>
                <Text style={[styles.dataListStatus, getStatusColor(trend.stressStatus)]}>
                  {trend.stressStatus}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAdherenceTrends = () => {
    if (adherenceTrends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>✅</Text>
          <Text style={styles.emptyStateTitle}>No Adherence Data</Text>
          <Text style={styles.emptyStateSubtitle}>Log daily health inputs to track adherence</Text>
        </View>
      );
    }

    const adherenceScores = adherenceTrends.map(t => t.adherenceScore);
    const workoutScores = adherenceTrends.map(t => t.breakdown.workout || 0).filter(v => v > 0);
    const nutritionScores = adherenceTrends.map(t => t.breakdown.nutrition || 0).filter(v => v > 0);

    return (
      <View style={styles.trendsContent}>
        <Text style={styles.sectionTitle}>Adherence Trends (Last 30 Days)</Text>
        {renderMiniChart(adherenceScores, 'Overall Adherence', '#8B5CF6')}
        {workoutScores.length > 0 && renderMiniChart(workoutScores, 'Workout Adherence', '#3B82F6')}
        {nutritionScores.length > 0 && renderMiniChart(nutritionScores, 'Nutrition Adherence', '#10B981')}
      </View>
    );
  };

  const renderOverallHealthTrends = () => {
    if (overallHealthTrends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>📈</Text>
          <Text style={styles.emptyStateTitle}>No Overall Health Data</Text>
          <Text style={styles.emptyStateSubtitle}>Start logging health data to see trends</Text>
        </View>
      );
    }

    const overallScores = overallHealthTrends.map(t => t.overallScore);

    return (
      <View style={styles.trendsContent}>
        <Text style={styles.sectionTitle}>Overall Health Trends (Last 30 Days)</Text>
        {renderMiniChart(overallScores, 'Overall Health Score', '#6366F1')}
        
        <View style={styles.dataList}>
          <Text style={styles.dataListTitle}>Recent Health Scores</Text>
          {overallHealthTrends.slice(0, 10).map((trend, index) => (
            <View key={index} style={styles.dataListItem}>
              <Text style={styles.dataListDate}>{new Date(trend.date).toLocaleDateString()}</Text>
              <View style={styles.dataListRight}>
                <Text style={styles.dataListScore}>{trend.overallScore}%</Text>
                <Text style={[styles.dataListStatus, getStatusColor(trend.overallStatus)]}>
                  {trend.overallStatus}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('optimal') || statusLower.includes('excellent')) {
      return { color: '#10B981' };
    }
    if (statusLower.includes('stable') || statusLower.includes('good') || statusLower.includes('moderate')) {
      return { color: '#3B82F6' };
    }
    if (statusLower.includes('caution') || statusLower.includes('elevated')) {
      return { color: '#F59E0B' };
    }
    return { color: '#EF4444' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading trends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trends & History</Text>
        <Text style={styles.subtitle}>Track your health metrics over time</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {renderTabButton('overall', 'Overall')}
        {renderTabButton('bloodwork', 'Bloodwork')}
        {renderTabButton('recovery', 'Recovery')}
        {renderTabButton('stress', 'Stress')}
        {renderTabButton('adherence', 'Adherence')}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {activeTab === 'overall' && renderOverallHealthTrends()}
        {activeTab === 'bloodwork' && renderBloodworkTrends()}
        {activeTab === 'recovery' && renderRecoveryTrends()}
        {activeTab === 'stress' && renderStressTrends()}
        {activeTab === 'adherence' && renderAdherenceTrends()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  trendsContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  miniChart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  miniChartLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  miniChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 12,
  },
  miniChartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 1,
  },
  miniChartBar: {
    width: '100%',
    borderRadius: 2,
  },
  miniChartStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  miniChartStatText: {
    fontSize: 12,
    color: '#64748B',
  },
  dataList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dataListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dataListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dataListDate: {
    fontSize: 14,
    color: '#64748B',
  },
  dataListRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dataListScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dataListStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
});

export default TrendsScreen;
