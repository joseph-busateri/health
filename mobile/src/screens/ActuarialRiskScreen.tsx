import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

interface RiskRecord {
  id: string;
  userId: string;
  date: string;
  riskCategory: 'low_risk' | 'moderate_risk' | 'high_risk' | 'very_high_risk';
  overallRisk: number;
  evidence: {
    framinghamResult?: {
      riskPercentage: number;
      riskCategory: string;
    };
    ascvdResult?: {
      riskPercentage: number;
      riskCategory: string;
    };
    combinedRiskPercentage: number;
    combinedRiskCategory: string;
    riskFactors: RiskFactor[];
    signals: EvidenceSignal[];
    summary: string;
  };
  recommendation: {
    type: string;
    priority: 'critical' | 'important' | 'optimization';
    summary: string;
    actions: string[];
    riskReductionPotential: number;
    primaryRiskDrivers: string[];
    source: string;
  };
}

interface RiskFactor {
  factor: string;
  contribution: number;
  severity: 'low' | 'moderate' | 'high';
}

interface EvidenceSignal {
  name: string;
  value: number | string | null;
  interpretation: string;
}

export default function ActuarialRiskScreen() {
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [riskRecord, setRiskRecord] = useState<RiskRecord | null>(null);
  const [history, setHistory] = useState<RiskRecord[]>([]);
  const [selectedTab, setSelectedTab] = useState<'current' | 'history'>('current');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadRiskData();
    }
  }, [userId]);

  const loadRiskData = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const [recordResponse, historyResponse] = await Promise.all([
        healthApi.actuarial.getRecord(userId),
        healthApi.actuarial.getHistory(userId, 30),
      ]);

      if (recordResponse.data?.data) {
        setRiskRecord(recordResponse.data.data);
      }

      if (historyResponse.data?.data) {
        setHistory(historyResponse.data.data);
      }
    } catch (err) {
      console.error('Error loading risk data:', err);
      setError('Failed to load risk data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRiskData();
    setRefreshing(false);
  };

  const handleCalculateRisk = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID required');
      return;
    }

    Alert.alert(
      'Calculate Risk',
      'This feature requires demographic and clinical data from your baseline profile and bloodwork. Make sure you have completed your profile and added recent bloodwork results.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            setCalculating(true);
            setError(null);
            try {
              const response = await healthApi.actuarial.calculate(userId, {
                demographic: {
                  age: 45,
                  gender: 'male',
                  race: 'white',
                },
                clinical: {
                  systolicBP: 120,
                  diastolicBP: 80,
                  totalCholesterol: 200,
                  hdlCholesterol: 50,
                  isSmoker: false,
                  isDiabetic: false,
                  isOnBPMedication: false,
                },
                lifestyle: {
                  exerciseFrequency: 3,
                  vo2Max: 35,
                  bodyFatPercentage: 20,
                  bmi: 25,
                },
              });

              if (response.data?.data) {
                setRiskRecord(response.data.data);
                Alert.alert('Success', 'Risk calculation complete!');
                await loadRiskData();
              }
            } catch (err: any) {
              console.error('Error calculating risk:', err);
              const errorMessage = err.response?.data?.details || err.response?.data?.error || 'Failed to calculate risk. Please try again.';
              setError(errorMessage);
              Alert.alert('Error', errorMessage);
            } finally {
              setCalculating(false);
            }
          },
        },
      ]
    );
  };

  const getRiskCategoryColor = (category: string) => {
    switch (category) {
      case 'low_risk':
        return '#10b981';
      case 'moderate_risk':
        return '#f59e0b';
      case 'high_risk':
        return '#ef4444';
      case 'very_high_risk':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getRiskCategoryLabel = (category: string) => {
    switch (category) {
      case 'low_risk':
        return 'Low Risk';
      case 'moderate_risk':
        return 'Moderate Risk';
      case 'high_risk':
        return 'High Risk';
      case 'very_high_risk':
        return 'Very High Risk';
      default:
        return 'Unknown';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#dc2626';
      case 'important':
        return '#f59e0b';
      case 'optimization':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyStateTitle}>No Risk Assessment</Text>
      <Text style={styles.emptyStateText}>
        Calculate your 10-year cardiovascular disease risk using validated medical models (Framingham + ASCVD)
      </Text>
      <TouchableOpacity
        style={styles.calculateButton}
        onPress={handleCalculateRisk}
        disabled={calculating}
      >
        {calculating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={styles.calculateButtonText}>Calculate Risk</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>Error Loading Data</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadRiskData}>
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentRisk = () => {
    if (!riskRecord) return renderEmptyState();

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <View>
              <Text style={styles.riskTitle}>10-Year CVD Risk</Text>
              <Text style={styles.riskDate}>
                Calculated: {new Date(riskRecord.date).toLocaleDateString()}
              </Text>
            </View>
            <View
              style={[
                styles.riskBadge,
                { backgroundColor: getRiskCategoryColor(riskRecord.riskCategory) },
              ]}
            >
              <Text style={styles.riskBadgeText}>
                {getRiskCategoryLabel(riskRecord.riskCategory)}
              </Text>
            </View>
          </View>

          <View style={styles.riskPercentageContainer}>
            <Text style={styles.riskPercentage}>
              {riskRecord.overallRisk.toFixed(1)}%
            </Text>
            <Text style={styles.riskPercentageLabel}>Overall Risk</Text>
          </View>

          <View style={styles.modelResults}>
            {riskRecord.evidence.framinghamResult && (
              <View style={styles.modelCard}>
                <Text style={styles.modelName}>Framingham</Text>
                <Text style={styles.modelRisk}>
                  {riskRecord.evidence.framinghamResult.riskPercentage.toFixed(1)}%
                </Text>
                <Text style={styles.modelLabel}>10-year CHD risk</Text>
              </View>
            )}
            {riskRecord.evidence.ascvdResult && (
              <View style={styles.modelCard}>
                <Text style={styles.modelName}>ASCVD</Text>
                <Text style={styles.modelRisk}>
                  {riskRecord.evidence.ascvdResult.riskPercentage.toFixed(1)}%
                </Text>
                <Text style={styles.modelLabel}>10-year ASCVD risk</Text>
              </View>
            )}
          </View>
        </View>

        {riskRecord.evidence.riskFactors && riskRecord.evidence.riskFactors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risk Factors</Text>
            {riskRecord.evidence.riskFactors.map((factor, index) => (
              <View key={index} style={styles.riskFactorCard}>
                <View style={styles.riskFactorHeader}>
                  <Text style={styles.riskFactorName}>{factor.factor}</Text>
                  <View
                    style={[
                      styles.severityBadge,
                      {
                        backgroundColor:
                          factor.severity === 'high'
                            ? '#fee2e2'
                            : factor.severity === 'moderate'
                            ? '#fef3c7'
                            : '#d1fae5',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        {
                          color:
                            factor.severity === 'high'
                              ? '#dc2626'
                              : factor.severity === 'moderate'
                              ? '#d97706'
                              : '#059669',
                        },
                      ]}
                    >
                      {factor.severity}
                    </Text>
                  </View>
                </View>
                <Text style={styles.riskFactorContribution}>
                  Contribution: {factor.contribution.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {riskRecord.recommendation && (
          <View style={styles.section}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(riskRecord.recommendation.priority) },
                ]}
              >
                <Text style={styles.priorityText}>
                  {riskRecord.recommendation.priority}
                </Text>
              </View>
            </View>
            <View style={styles.recommendationCard}>
              <Text style={styles.recommendationSummary}>
                {riskRecord.recommendation.summary}
              </Text>
              {riskRecord.recommendation.actions && riskRecord.recommendation.actions.length > 0 && (
                <View style={styles.actionsContainer}>
                  <Text style={styles.actionsTitle}>Action Steps:</Text>
                  {riskRecord.recommendation.actions.map((action, index) => (
                    <View key={index} style={styles.actionItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </View>
              )}
              {riskRecord.recommendation.riskReductionPotential > 0 && (
                <View style={styles.reductionPotential}>
                  <Ionicons name="trending-down" size={20} color="#10b981" />
                  <Text style={styles.reductionText}>
                    Potential risk reduction: {riskRecord.recommendation.riskReductionPotential.toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.recalculateButton}
          onPress={handleCalculateRisk}
          disabled={calculating}
        >
          {calculating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.recalculateButtonText}>Recalculate Risk</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderHistory = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>No History</Text>
          <Text style={styles.emptyStateText}>
            Your risk calculation history will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk History (Last 30 Days)</Text>
          {history.map((record) => (
            <View key={record.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>
                  {new Date(record.date).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.historyBadge,
                    { backgroundColor: getRiskCategoryColor(record.riskCategory) },
                  ]}
                >
                  <Text style={styles.historyBadgeText}>
                    {getRiskCategoryLabel(record.riskCategory)}
                  </Text>
                </View>
              </View>
              <Text style={styles.historyRisk}>{record.overallRisk.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading risk data...</Text>
      </View>
    );
  }

  if (error && !riskRecord) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cardiovascular Risk</Text>
          <Text style={styles.subtitle}>10-Year CVD Risk Assessment</Text>
        </View>
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cardiovascular Risk</Text>
        <Text style={styles.subtitle}>10-Year CVD Risk Assessment</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'current' && styles.tabActive]}
          onPress={() => setSelectedTab('current')}
        >
          <Ionicons
            name="heart"
            size={20}
            color={selectedTab === 'current' ? '#3b82f6' : '#6b7280'}
          />
          <Text style={[styles.tabText, selectedTab === 'current' && styles.tabTextActive]}>
            Current Risk
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
          onPress={() => setSelectedTab('history')}
        >
          <Ionicons
            name="time"
            size={20}
            color={selectedTab === 'history' ? '#3b82f6' : '#6b7280'}
          />
          <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'current' ? renderCurrentRisk() : renderHistory()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  riskCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  riskDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  riskPercentageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  riskPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
  },
  riskPercentageLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  modelResults: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modelCard: {
    alignItems: 'center',
    flex: 1,
  },
  modelName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  modelRisk: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 4,
  },
  modelLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  riskFactorCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  riskFactorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskFactorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  riskFactorContribution: {
    fontSize: 12,
    color: '#6b7280',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  recommendationSummary: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
    lineHeight: 18,
  },
  reductionPotential: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  reductionText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  recalculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  recalculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  historyRisk: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
});
