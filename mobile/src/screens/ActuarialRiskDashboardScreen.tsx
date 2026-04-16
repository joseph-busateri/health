/**
 * Actuarial Risk Dashboard Screen
 * Displays 10-year cardiovascular risk assessment with detailed breakdown
 * 
 * Features:
 * - Risk percentage display (overall 10-year risk)
 * - Risk category visualization (low/moderate/high/very high)
 * - Risk model breakdown (Framingham, ASCVD, Lifestyle Modified)
 * - Risk factor contributions
 * - Lifestyle adjustments view
 * - Personalized recommendations
 * - Loading, error, and empty states
 */

import React from 'react';
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

import type { InsightsStackParamList } from '../types/navigation';
import { useActuarialRisk } from '../hooks/useActuarialRisk';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get risk category color
 */
const getRiskCategoryColor = (category: string): string => {
  switch (category) {
    case 'low':
      return '#22C55E';
    case 'moderate':
      return '#F59E0B';
    case 'high':
      return '#EF4444';
    case 'very_high':
      return '#DC2626';
    default:
      return '#64748B';
  }
};

/**
 * Get risk category background color
 */
const getRiskCategoryBgColor = (category: string): string => {
  switch (category) {
    case 'low':
      return '#DCFCE7';
    case 'moderate':
      return '#FEF9C3';
    case 'high':
      return '#FEE2E2';
    case 'very_high':
      return '#FEE2E2';
    default:
      return '#F1F5F9';
  }
};

/**
 * Get risk category label
 */
const getRiskCategoryLabel = (category: string): string => {
  switch (category) {
    case 'low':
      return 'Low Risk';
    case 'moderate':
      return 'Moderate Risk';
    case 'high':
      return 'High Risk';
    case 'very_high':
      return 'Very High Risk';
    default:
      return 'Unknown';
  }
};

/**
 * Get priority badge style
 */
const getPriorityBadgeStyle = (priority: string) => {
  switch (priority) {
    case 'critical':
      return [styles.priorityBadge, styles.priorityCritical];
    case 'important':
      return [styles.priorityBadge, styles.priorityImportant];
    case 'optimization':
      return [styles.priorityBadge, styles.priorityOptimization];
    default:
      return styles.priorityBadge;
  }
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ActuarialRiskDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<InsightsStackParamList>>();
  
  // TODO: Get actual userId from auth context
  const userId = 'user-123';
  
  const { record, loading, error, refetch } = useActuarialRisk(userId);

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  
  if (loading && !record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading risk assessment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================
  
  if (error && !record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to Load Data</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // EMPTY STATE
  // ============================================================================
  
  if (!record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="heart-pulse" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Risk Assessment Available</Text>
          <Text style={styles.emptyMessage}>
            Complete your health profile to generate your personalized cardiovascular risk assessment.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('BaselineProfile')}
          >
            <Text style={styles.ctaButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // MAIN CONTENT
  // ============================================================================

  const riskColor = getRiskCategoryColor(record.riskCategory);
  const riskBgColor = getRiskCategoryBgColor(record.riskCategory);
  const riskLabel = getRiskCategoryLabel(record.riskCategory);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#6366F1" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Actuarial Risk Assessment</Text>
          <Text style={styles.subtitle}>10-year cardiovascular risk prediction</Text>
        </View>

        {/* Risk Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreLabel}>10-Year Risk</Text>
            <Text style={styles.scoreValue}>{record.overallRisk.toFixed(1)}%</Text>
            <Text style={styles.lastUpdated}>Updated {formatDate(record.date)}</Text>
          </View>
          <View style={styles.scoreRight}>
            <Text style={styles.categoryLabel}>Category</Text>
            <View style={[styles.categoryBadge, { backgroundColor: riskBgColor }]}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={16}
                color={riskColor}
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryText, { color: riskColor }]}>{riskLabel}</Text>
            </View>
          </View>
        </View>

        {/* Risk Models Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Model Breakdown</Text>
          <View style={styles.card}>
            {/* Framingham */}
            <View style={styles.modelRow}>
              <View style={styles.modelHeader}>
                <MaterialCommunityIcons name="chart-line" size={18} color="#6366F1" />
                <Text style={styles.modelLabel}>Framingham Score</Text>
              </View>
              <Text style={styles.modelValue}>{record.riskModels.framingham.tenYearRisk.toFixed(1)}%</Text>
              <Text style={styles.modelNote}>
                Traditional 10-year CHD risk (2008 model)
              </Text>
            </View>

            {/* ASCVD */}
            <View style={styles.modelRow}>
              <View style={styles.modelHeader}>
                <MaterialCommunityIcons name="chart-line" size={18} color="#8B5CF6" />
                <Text style={styles.modelLabel}>ASCVD Score</Text>
              </View>
              <Text style={styles.modelValue}>{record.riskModels.ascvd.tenYearRisk.toFixed(1)}%</Text>
              <Text style={styles.modelNote}>
                ACC/AHA Pooled Cohort Equations (2013)
              </Text>
            </View>

            {/* Lifestyle Modified */}
            <View style={[styles.modelRow, styles.modelRowLast]}>
              <View style={styles.modelHeader}>
                <MaterialCommunityIcons name="run" size={18} color="#22C55E" />
                <Text style={styles.modelLabel}>Lifestyle Adjusted</Text>
              </View>
              <Text style={styles.modelValue}>
                {record.riskModels.lifestyleModified.tenYearRisk.toFixed(1)}%
              </Text>
              <Text style={styles.modelNote}>
                Modified by exercise, diet, and fitness factors
              </Text>
              <View style={styles.modificationBadge}>
                <Text style={styles.modificationText}>
                  {(record.riskModels.lifestyleModified.modificationFactor * 100).toFixed(0)}% adjustment
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Risk Factors */}
        {record.riskFactorContributions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Risk Factors</Text>
            <View style={styles.card}>
              {record.riskFactorContributions.slice(0, 5).map((factor, index) => (
                <View
                  key={`factor-${index}`}
                  style={[
                    styles.factorRow,
                    index === Math.min(4, record.riskFactorContributions.length - 1) &&
                      styles.factorRowLast,
                  ]}
                >
                  <View style={styles.factorHeader}>
                    <MaterialCommunityIcons
                      name={factor.modifiable ? 'pencil' : 'lock'}
                      size={16}
                      color={factor.modifiable ? '#22C55E' : '#94A3B8'}
                    />
                    <Text style={styles.factorLabel}>{factor.factor}</Text>
                  </View>
                  <View style={styles.factorMeta}>
                    <View style={styles.contributionBar}>
                      <View
                        style={[
                          styles.contributionFill,
                          { width: `${Math.min(100, factor.contribution)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.contributionText}>{factor.contribution.toFixed(1)}%</Text>
                  </View>
                  {factor.modifiable && (
                    <Text style={styles.factorNote}>Modifiable through lifestyle changes</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
            <View style={getPriorityBadgeStyle(record.recommendation.priority)}>
              <Text style={styles.priorityText}>{record.recommendation.priority.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationSummary}>{record.recommendation.summary}</Text>

            {record.recommendation.rationale && (
              <View style={styles.rationaleBox}>
                <MaterialCommunityIcons name="information" size={16} color="#6366F1" />
                <Text style={styles.rationaleText}>{record.recommendation.rationale}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsSection}>
              <Text style={styles.actionsTitle}>Recommended Actions</Text>
              {record.recommendation.actions.map((action, index) => (
                <View key={`action-${index}`} style={styles.actionRow}>
                  <MaterialCommunityIcons
                    name="checkbox-marked-circle-outline"
                    size={18}
                    color="#22C55E"
                  />
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>

            {/* Risk Reduction Potential */}
            <View style={styles.potentialBox}>
              <MaterialCommunityIcons name="trending-down" size={20} color="#22C55E" />
              <Text style={styles.potentialText}>
                Potential risk reduction: {record.recommendation.riskReductionPotential}%
              </Text>
            </View>

            {/* Prevention Strategies */}
            {record.recommendation.preventionStrategies.length > 0 && (
              <View style={styles.strategiesSection}>
                <Text style={styles.strategiesTitle}>Prevention Strategies</Text>
                {record.recommendation.preventionStrategies.map((strategy, index) => (
                  <View key={`strategy-${index}`} style={styles.strategyChip}>
                    <Text style={styles.strategyText}>{strategy}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('VoiceInterview')}
            >
              <MaterialCommunityIcons name="chat" size={18} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>Discuss with AI Coach</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Source Attribution */}
        <View style={styles.attribution}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#94A3B8" />
          <Text style={styles.attributionText}>
            Based on validated actuarial models (Framingham 2008, ACC/AHA 2013)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  scoreLeft: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 64,
  },
  lastUpdated: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
  },
  scoreRight: {
    alignItems: 'flex-end',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  categoryIcon: {
    marginRight: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    gap: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  modelRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 16,
  },
  modelRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  modelValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modelNote: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  modificationBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modificationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22C55E',
  },
  factorRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  factorRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  factorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  factorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  contributionFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 999,
  },
  contributionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    minWidth: 50,
    textAlign: 'right',
  },
  factorNote: {
    fontSize: 11,
    color: '#22C55E',
    marginTop: 6,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priorityCritical: {
    backgroundColor: '#FEE2E2',
  },
  priorityImportant: {
    backgroundColor: '#FEF9C3',
  },
  priorityOptimization: {
    backgroundColor: '#DBEAFE',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  recommendationSummary: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E293B',
  },
  rationaleBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
  },
  rationaleText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },
  actionsSection: {
    gap: 10,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  potentialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 12,
  },
  potentialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  strategiesSection: {
    gap: 8,
  },
  strategiesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  strategyChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  strategyText: {
    fontSize: 12,
    color: '#475569',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  attributionText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default ActuarialRiskDashboardScreen;
