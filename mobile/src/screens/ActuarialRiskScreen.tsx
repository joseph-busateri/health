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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

interface RiskRecord {
  id: string;
  userId: string;
  date: string;
  inputs: any;
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
    combinedRiskCategory: 'low_risk' | 'moderate_risk' | 'high_risk' | 'very_high_risk';
    riskFactors: RiskFactor[];
    signals: EvidenceSignal[];
    summary: string;
    lifestyleAdjustment: number;
    fitnessAdjustment: number;
  };
  recommendation: {
    type: string;
    priority: 'critical' | 'important' | 'optimization';
    summary: string;
    actions: string[];
    riskReductionPotential: number;
    primaryRiskDrivers: string[];
    preventionStrategies: string[];
    source: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface RiskFactor {
  factor: string;
  contribution: number;
  status: 'positive' | 'negative' | 'neutral';
  value: string;
  interpretation: string;
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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDataSourcesModal, setShowDataSourcesModal] = useState(false);

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
    } catch (err: any) {
      console.error('Error loading risk data:', err);
      // 404 means no data exists yet - this is not an error, just show empty state
      if (err.response?.status === 404) {
        setRiskRecord(null);
        setHistory([]);
        setError(null);
      } else {
        const isNetworkError = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message?.includes('Network Error');
        const errorMessage = isNetworkError 
          ? 'Backend server not accessible. Please ensure the server is running at the configured API URL.'
          : err.response?.data?.error || 'Failed to load risk data. Please try again.';
        setError(errorMessage);
      }
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

    setCalculating(true);
    setError(null);
    try {
      const response = await healthApi.actuarial.calculateAuto(userId);

      if (response.data?.data) {
        setRiskRecord(response.data.data);
        Alert.alert('Success', 'Risk calculation complete!');
        await loadRiskData();
      }
    } catch (err: any) {
      console.error('Error calculating risk:', err);
      const errorMessage = err.response?.data?.details || err.response?.data?.error || 'Failed to calculate risk. Please ensure your baseline profile and health data are up to date.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setCalculating(false);
    }
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
                { backgroundColor: getRiskCategoryColor(riskRecord.evidence.combinedRiskCategory) },
              ]}
            >
              <Text style={styles.riskBadgeText}>
                {getRiskCategoryLabel(riskRecord.evidence.combinedRiskCategory)}
              </Text>
            </View>
          </View>

          <View style={styles.riskPercentageContainer}>
            <Text style={styles.riskPercentage}>
              {riskRecord.evidence.combinedRiskPercentage?.toFixed(1) || '0.0'}%
            </Text>
            <Text style={styles.riskPercentageLabel}>Overall Risk</Text>
          </View>

          <View style={styles.modelResults}>
            {riskRecord.evidence.framinghamResult && (
              <View style={styles.modelCard}>
                <Text style={styles.modelName}>Framingham</Text>
                <Text style={styles.modelRisk}>
                  {riskRecord.evidence.framinghamResult.riskPercentage?.toFixed(1) || '0.0'}%
                </Text>
                <Text style={styles.modelLabel}>10-year CHD risk</Text>
              </View>
            )}
            {riskRecord.evidence.ascvdResult && (
              <View style={styles.modelCard}>
                <Text style={styles.modelName}>ASCVD</Text>
                <Text style={styles.modelRisk}>
                  {riskRecord.evidence.ascvdResult.riskPercentage?.toFixed(1) || '0.0'}%
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
                          factor.status === 'negative'
                            ? '#fee2e2'
                            : factor.status === 'neutral'
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
                            factor.status === 'negative'
                              ? '#dc2626'
                              : factor.status === 'neutral'
                              ? '#d97706'
                              : '#059669',
                        },
                      ]}
                    >
                      {factor.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.riskFactorContribution}>
                  Contribution: {factor.contribution?.toFixed(1) || '0.0'}%
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
              {riskRecord.recommendation.riskReductionPotential && riskRecord.recommendation.riskReductionPotential > 0 && (
                <View style={styles.reductionPotential}>
                  <Ionicons name="trending-down" size={20} color="#10b981" />
                  <Text style={styles.reductionText}>
                    Potential risk reduction: {riskRecord.recommendation.riskReductionPotential?.toFixed(1) || '0.0'}%
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
                    { backgroundColor: getRiskCategoryColor(record.evidence.combinedRiskCategory) },
                  ]}
                >
                  <Text style={styles.historyBadgeText}>
                    {getRiskCategoryLabel(record.evidence.combinedRiskCategory)}
                  </Text>
                </View>
              </View>
              <Text style={styles.historyRisk}>{record.evidence.combinedRiskPercentage?.toFixed(1) || '0.0'}%</Text>
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

  const renderInfoModal = () => (
    <Modal
      visible={showInfoModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowInfoModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Understanding Your Risk</Text>
            <TouchableOpacity onPress={() => setShowInfoModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Actuarial Cardiovascular Risk</Text>
              <Text style={styles.infoText}>
                This is a <Text style={styles.infoBold}>10-year prediction</Text> of your risk of developing cardiovascular disease (heart attack, stroke, or cardiovascular death).
              </Text>
              <Text style={styles.infoText}>
                It uses validated medical models (Framingham Risk Score and ASCVD Calculator) based on decades of research.
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>What it tells you:</Text> Your statistical probability of having a cardiovascular event in the next 10 years.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Cardiovascular Score</Text>
              <Text style={styles.infoText}>
                This is a <Text style={styles.infoBold}>current health status</Text> metric that tracks your cardiovascular health in real-time.
              </Text>
              <Text style={styles.infoText}>
                It uses data from wearables (heart rate, HRV) and clinical measurements (blood pressure, lipid panel).
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>What it tells you:</Text> How healthy your cardiovascular system is right now.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Key Differences</Text>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonHeader}>Actuarial Risk</Text>
                  <Text style={styles.comparisonItem}>• 10-year prediction</Text>
                  <Text style={styles.comparisonItem}>• Medical models</Text>
                  <Text style={styles.comparisonItem}>• Clinical use</Text>
                  <Text style={styles.comparisonItem}>• Percentage risk</Text>
                </View>
                <View style={styles.comparisonColumn}>
                  <Text style={styles.comparisonHeader}>CV Score</Text>
                  <Text style={styles.comparisonItem}>• Current status</Text>
                  <Text style={styles.comparisonItem}>• Real-time data</Text>
                  <Text style={styles.comparisonItem}>• Daily tracking</Text>
                  <Text style={styles.comparisonItem}>• 0-100 score</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>When to Use Each</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Actuarial Risk:</Text> For medical assessment, long-term risk management, and clinical decision-making.
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Cardiovascular Score:</Text> For daily health monitoring, lifestyle feedback, and tracking improvements.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowInfoModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderDataSourcesModal = () => (
    <Modal
      visible={showDataSourcesModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDataSourcesModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Data Sources</Text>
            <TouchableOpacity onPress={() => setShowDataSourcesModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Real Data (From Database)</Text>
              <View style={styles.dataSourceItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <View style={styles.dataSourceText}>
                  <Text style={styles.dataSourceLabel}>Baseline Profile</Text>
                  <Text style={styles.dataSourceDetail}>Age: 59, Male, White, Pre-diabetes</Text>
                </View>
              </View>
              <View style={styles.dataSourceItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <View style={styles.dataSourceText}>
                  <Text style={styles.dataSourceLabel}>Bloodwork</Text>
                  <Text style={styles.dataSourceDetail}>Latest: Oct 11, 2023 (498 results)</Text>
                </View>
              </View>
              <View style={styles.dataSourceItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <View style={styles.dataSourceText}>
                  <Text style={styles.dataSourceLabel}>Body Composition</Text>
                  <Text style={styles.dataSourceDetail}>Latest: Apr 18, 2026 (body fat %)</Text>
                </View>
              </View>
              <View style={styles.dataSourceItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <View style={styles.dataSourceText}>
                  <Text style={styles.dataSourceLabel}>Workout Data</Text>
                  <Text style={styles.dataSourceDetail}>Exercise frequency: 6 days/week (from baseline profile)</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Mock/Default Data</Text>
              <View style={styles.dataSourceItem}>
                <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                <View style={styles.dataSourceText}>
                  <Text style={styles.dataSourceLabel}>Blood Pressure</Text>
                  <Text style={styles.dataSourceDetail}>No BP data, using default (120/80)</Text>
                </View>
              </View>
              <View style={styles.dataSourceItem}>
                <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                <View style={styles.dataSourceText}>
                  <Text style={styles.dataSourceLabel}>Cholesterol</Text>
                  <Text style={styles.dataSourceDetail}>No cholesterol data, using defaults</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>How to Improve Accuracy</Text>
              <Text style={styles.infoText}>
                • Log regular blood pressure measurements
              </Text>
              <Text style={styles.infoText}>
                • Update bloodwork with recent lipid panel (current: Oct 2023)
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowDataSourcesModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Cardiovascular Risk</Text>
            <Text style={styles.subtitle}>10-Year CVD Risk Assessment</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowDataSourcesModal(true)}
            >
              <Ionicons name="list-outline" size={28} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowInfoModal(true)}
            >
              <Ionicons name="information-circle-outline" size={28} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderInfoModal()}
      {renderDataSourcesModal()}

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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  infoButton: {
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    maxHeight: 400,
  },
  infoSection: {
    padding: 20,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoBold: {
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  comparisonColumn: {
    flex: 1,
  },
  comparisonHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  comparisonItem: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  dataSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  dataSourceText: {
    flex: 1,
  },
  dataSourceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dataSourceDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalCloseButton: {
    backgroundColor: '#3b82f6',
    margin: 20,
    marginTop: 0,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
