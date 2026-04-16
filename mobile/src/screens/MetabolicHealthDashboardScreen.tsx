import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

interface MetabolicMetric {
  name: string;
  value: number;
  unit: string;
  status: 'optimal' | 'good' | 'fair' | 'poor';
  trend: 'up' | 'down' | 'stable';
  referenceRange: string;
}

interface MetabolicData {
  overallScore: number;
  lastUpdated: string;
  metrics: {
    glucose: MetabolicMetric;
    insulin: MetabolicMetric;
    hba1c: MetabolicMetric;
    triglycerides: MetabolicMetric;
    hdl: MetabolicMetric;
    ldl: MetabolicMetric;
    totalCholesterol: MetabolicMetric;
    waistCircumference: MetabolicMetric;
  };
  riskFactors: string[];
  recommendations: string[];
}

export default function MetabolicHealthDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metabolicData, setMetabolicData] = useState<MetabolicData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetabolicData = useCallback(async (isRefresh = false) => {
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
        `http://localhost:3000/metabolic/today/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch metabolic data: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to UI format
      const inputs = data.inputs || {};
      const glucoseMetrics = data.evidence?.signals?.find((s: any) => s.name === 'Fasting Glucose');
      const a1cMetrics = data.evidence?.signals?.find((s: any) => s.name === 'A1C');
      const triglyceridesMetrics = data.evidence?.signals?.find((s: any) => s.name === 'Triglycerides');
      const hdlMetrics = data.evidence?.signals?.find((s: any) => s.name === 'HDL');

      const transformedData: MetabolicData = {
        overallScore: data.metabolicStatus === 'optimal' ? 90 : 
                     data.metabolicStatus === 'moderate' ? 70 : 
                     data.metabolicStatus === 'elevated_risk' ? 50 : 30,
        lastUpdated: data.createdAt || new Date().toISOString(),
        metrics: {
          glucose: {
            name: 'Fasting Glucose',
            value: inputs.fastingGlucose || glucoseMetrics?.value || 92,
            unit: 'mg/dL',
            status: inputs.fastingGlucose < 100 ? 'optimal' : inputs.fastingGlucose < 126 ? 'good' : 'poor',
            trend: 'stable',
            referenceRange: '70-100',
          },
          insulin: {
            name: 'Fasting Insulin',
            value: 8.5,
            unit: 'μIU/mL',
            status: 'good',
            trend: 'down',
            referenceRange: '2-20',
          },
          hba1c: {
            name: 'HbA1c',
            value: inputs.a1c || a1cMetrics?.value || 5.4,
            unit: '%',
            status: inputs.a1c < 5.7 ? 'optimal' : inputs.a1c < 6.5 ? 'good' : 'poor',
            trend: 'stable',
            referenceRange: '<5.7',
          },
          triglycerides: {
            name: 'Triglycerides',
            value: inputs.triglycerides || triglyceridesMetrics?.value || 105,
            unit: 'mg/dL',
            status: (inputs.triglycerides || 105) < 150 ? 'good' : 'fair',
            trend: 'stable',
            referenceRange: '<150',
          },
          hdl: {
            name: 'HDL Cholesterol',
            value: inputs.hdl || hdlMetrics?.value || 58,
            unit: 'mg/dL',
            status: (inputs.hdl || 58) >= 60 ? 'optimal' : (inputs.hdl || 58) >= 40 ? 'good' : 'poor',
            trend: 'stable',
            referenceRange: '>40',
          },
          ldl: {
            name: 'LDL Cholesterol',
            value: 98,
            unit: 'mg/dL',
            status: 'optimal',
            trend: 'stable',
            referenceRange: '<100',
          },
          totalCholesterol: {
            name: 'Total Cholesterol',
            value: 177,
            unit: 'mg/dL',
            status: 'optimal',
            trend: 'stable',
            referenceRange: '<200',
          },
          waistCircumference: {
            name: 'Waist Circumference',
            value: 34,
            unit: 'inches',
            status: 'optimal',
            trend: 'stable',
            referenceRange: '<40',
          },
        },
        riskFactors: data.evidence?.signals
          ?.filter((s: any) => s.interpretation?.includes('High') || s.interpretation?.includes('Elevated'))
          ?.map((s: any) => s.interpretation) || [],
        recommendations: data.recommendation?.actions || [
          data.recommendation?.summary || 'Continue monitoring metabolic health',
        ],
      };

      setMetabolicData(transformedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load metabolic data';
      setError(errorMessage);
      console.error('Failed to fetch metabolic data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMetabolicData(false);
  }, [fetchMetabolicData]);

  const onRefresh = () => {
    fetchMetabolicData(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string, isGoodDirection: boolean) => {
    if (trend === 'stable') return '#6b7280';
    if (trend === 'up') return isGoodDirection ? '#10b981' : '#ef4444';
    if (trend === 'down') return isGoodDirection ? '#10b981' : '#ef4444';
    return '#6b7280';
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Set your user ID in Settings to view metabolic health</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading metabolic data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchMetabolicData(false)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!metabolicData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="fitness-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>No metabolic data available</Text>
      </View>
    );
  }

  const metrics = Object.values(metabolicData.metrics);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Metabolic Health</Text>
        <Text style={styles.subtitle}>Track your metabolic markers</Text>
      </View>

      {/* Overall Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Overall Metabolic Score</Text>
        <Text style={styles.scoreValue}>{metabolicData.overallScore}</Text>
        <View style={styles.scoreBar}>
          <View style={[styles.scoreBarFill, { width: `${metabolicData.overallScore}%` }]} />
        </View>
        <Text style={styles.scoreDescription}>
          {metabolicData.overallScore >= 80 ? 'Excellent' : metabolicData.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
        </Text>
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(metabolicData.lastUpdated).toLocaleDateString()}
        </Text>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricName}>{metric.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(metric.status) }]}>
                  <Text style={styles.statusText}>{metric.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.metricValue}>
                <Text style={styles.metricNumber}>{metric.value}</Text>
                <Text style={styles.metricUnit}>{metric.unit}</Text>
              </View>
              <View style={styles.metricFooter}>
                <Text style={styles.referenceRange}>Ref: {metric.referenceRange}</Text>
                <View style={styles.trendContainer}>
                  <Ionicons 
                    name={getTrendIcon(metric.trend) as any} 
                    size={16} 
                    color={getTrendColor(metric.trend, metric.trend === 'down' || metric.trend === 'up')} 
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Risk Factors */}
      {metabolicData.riskFactors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Factors</Text>
          <View style={styles.riskCard}>
            {metabolicData.riskFactors.map((risk, index) => (
              <View key={index} style={styles.riskItem}>
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <Text style={styles.riskText}>{risk}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recommendations */}
      {metabolicData.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationsCard}>
            {metabolicData.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationBullet}>
                  <Text style={styles.recommendationBulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>View History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
          <Ionicons name="add-circle" size={20} color="#3b82f6" />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Add Data</Text>
        </TouchableOpacity>
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
  scoreCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 12,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  scoreDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: (width - 44) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metricName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginRight: 4,
  },
  metricUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referenceRange: {
    fontSize: 11,
    color: '#9ca3af',
  },
  trendContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  riskText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recommendationBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationBulletText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#3b82f6',
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
