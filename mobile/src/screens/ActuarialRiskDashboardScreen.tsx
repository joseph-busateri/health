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

import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useActuarialRisk } from '../hooks/useActuarialRisk';
import { InputDetailsPanel } from '../components/InputDetailsPanel';
import type { InputMetadata } from '../types/inputMetadata';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InsightsStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get risk category color
 */
const getRiskCategoryColor = (category: string): string => {
  switch (category) {
    case 'low':
    case 'low_risk':
      return '#22C55E';
    case 'moderate':
    case 'moderate_risk':
      return '#F59E0B';
    case 'high':
    case 'high_risk':
      return '#EF4444';
    case 'very_high':
    case 'very_high_risk':
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
    case 'low_risk':
      return '#DCFCE7';
    case 'moderate':
    case 'moderate_risk':
      return '#FEF3C7';
    case 'high':
    case 'high_risk':
      return '#FEE2E2';
    case 'very_high':
    case 'very_high_risk':
      return '#FECACA';
    default:
      return '#F1F5F9';
  }
};

/**
 * Determine risk category from percentage (same logic as backend)
 */
const determineRiskCategory = (riskPercentage: number): string => {
  if (riskPercentage < 5) return 'low_risk';
  if (riskPercentage < 7.5) return 'moderate_risk';
  if (riskPercentage < 20) return 'high_risk';
  return 'very_high_risk';
};

/**
 * Get risk category label
 */
const getRiskCategoryLabel = (category: string): string => {
  // Handle both underscore format (backend) and plain format (frontend)
  const normalizedCategory = category.replace(/_/g, ' ');
  
  switch (category) {
    case 'low':
    case 'low_risk':
      return 'Low Risk';
    case 'moderate':
    case 'moderate_risk':
      return 'Moderate Risk';
    case 'high':
    case 'high_risk':
      return 'High Risk';
    case 'very_high':
    case 'very_high_risk':
      return 'Very High Risk';
    default:
      return normalizedCategory || 'Unknown';
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
  const userId = '00000000-0000-0000-0000-000000000001';

  const { record, loading, error, refetch } = useActuarialRisk(userId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
          <Text style={styles.title}>Cardiovascular Risk</Text>
          <Text style={styles.subtitle}>10-year risk assessment</Text>
        </View>

        {/* Main Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreMainSection}>
            <View style={styles.scoreIconContainer}>
              <MaterialCommunityIcons 
                name={record.riskCategory.includes('low') ? 'heart-pulse' : 
                      record.riskCategory.includes('moderate') ? 'heart' :
                      record.riskCategory.includes('high') ? 'alert' : 'alert-circle'} 
                size={48} 
                color={getRiskCategoryColor(record.riskCategory)} 
              />
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreLabel}>10-Year Cardiovascular Risk</Text>
              <View style={styles.scoreValueContainer}>
                <Text style={[styles.scoreValue, { color: getRiskCategoryColor(record.riskCategory) }]}>
                  {record.overallRisk.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(record.overallRisk, 100)}%`, backgroundColor: getRiskCategoryColor(record.riskCategory) }]} />
                </View>
              </View>
              {record.baselineRisk && (
                <Text style={styles.baselineRiskText}>
                  <MaterialCommunityIcons name="trending-down" size={12} color="#22C55E" />
                  {' '}Baseline: {record.baselineRisk.toFixed(1)}% 
                  {record.baselineRisk > record.overallRisk ? `(↓ ${((record.baselineRisk - record.overallRisk) / record.baselineRisk * 100).toFixed(0)}% reduction)` : ''}
                </Text>
              )}
              <Text style={styles.lastUpdated}>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#94A3B8" />
                {' '}Updated {new Date(record.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getRiskCategoryColor(record.riskCategory) }]}>
              <MaterialCommunityIcons 
                name={record.riskCategory.includes('low') ? 'check-circle' : 
                      record.riskCategory.includes('moderate') ? 'information' :
                      'alert'} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusText}>{getRiskCategoryLabel(record.riskCategory)}</Text>
            </View>
          </View>
        </View>

        {/* ASCVD Risk Estimator */}
        {record.ascvdModelData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ASCVD Risk Estimator</Text>
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="#3B82F6" />
                  <Text style={styles.categoryTitle}>ACC/AHA ASCVD Risk</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${Math.min(record.ascvdModelData.riskPercentage, 100)}%`, backgroundColor: getRiskCategoryColor(record.ascvdModelData.riskCategory) }]} />
                  </View>
                  <Text style={styles.categoryScore}>{record.ascvdModelData.riskPercentage.toFixed(1)}%</Text>
                  <Text style={[styles.categoryPercentage, { color: getRiskCategoryColor(record.ascvdModelData.riskCategory) }]}>
                    {getRiskCategoryLabel(record.ascvdModelData.riskCategory)}
                  </Text>
                </View>
              </View>
              <InputDetailsPanel 
                inputs={record.ascvdModelData.inputs.map(input => ({
                  ...input,
                  name: input.label || input.key,
                  contribution: input.contribution
                }))}
                title=""
              />
              {record.ascvdModelData.missingInputs && record.ascvdModelData.missingInputs.length > 0 && (
                <View style={styles.missingInputsBox}>
                  <MaterialCommunityIcons name="alert" size={16} color="#F59E0B" />
                  <Text style={styles.missingInputsText}>
                    Missing: {record.ascvdModelData.missingInputs.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Framingham Risk Calculator */}
        {record.framinghamModelData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Framingham Risk Calculator</Text>
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="heart" size={20} color="#EC4899" />
                  <Text style={styles.categoryTitle}>Framingham Risk Score</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${Math.min(record.framinghamModelData.riskPercentage, 100)}%`, backgroundColor: getRiskCategoryColor(record.framinghamModelData.riskCategory) }]} />
                  </View>
                  <Text style={styles.categoryScore}>{record.framinghamModelData.riskPercentage.toFixed(1)}%</Text>
                  <Text style={[styles.categoryPercentage, { color: getRiskCategoryColor(record.framinghamModelData.riskCategory) }]}>
                    {getRiskCategoryLabel(record.framinghamModelData.riskCategory)}
                  </Text>
                </View>
              </View>
              <InputDetailsPanel 
                inputs={record.framinghamModelData.inputs.map(input => ({
                  ...input,
                  name: input.label || input.key,
                  contribution: input.contribution
                }))}
                title=""
              />
              {record.framinghamModelData.missingInputs && record.framinghamModelData.missingInputs.length > 0 && (
                <View style={styles.missingInputsBox}>
                  <MaterialCommunityIcons name="alert" size={16} color="#F59E0B" />
                  <Text style={styles.missingInputsText}>
                    Missing: {record.framinghamModelData.missingInputs.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Lifestyle Factors Breakdown */}
        {record.lifestyleFactors && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifestyle Risk Reduction</Text>
            <View style={styles.card}>
              <View style={styles.lifestyleGrid}>
                {/* Exercise Frequency */}
                <View style={styles.lifestyleFactorCard}>
                  <View style={styles.lifestyleFactorHeader}>
                    <MaterialCommunityIcons name="run" size={24} color="#6366F1" />
                    <Text style={styles.lifestyleFactorTitle}>Exercise</Text>
                  </View>
                  <Text style={styles.lifestyleFactorValue}>
                    {record.lifestyleFactors.exerciseFrequency.value} {record.lifestyleFactors.exerciseFrequency.unit}
                  </Text>
                  <Text style={[
                    styles.lifestyleFactorAdjustment,
                    { color: record.lifestyleFactors.exerciseFrequency.adjustment < 0 ? '#22C55E' : '#EF4444' }
                  ]}>
                    {record.lifestyleFactors.exerciseFrequency.adjustment < 0 ? '↓' : '↑'} {Math.abs(record.lifestyleFactors.exerciseFrequency.adjustment).toFixed(0)}%
                  </Text>
                </View>

                {/* VO2 Max */}
                {record.lifestyleFactors.vo2Max && (
                  <View style={styles.lifestyleFactorCard}>
                    <View style={styles.lifestyleFactorHeader}>
                      <MaterialCommunityIcons name="heart-pulse" size={24} color="#EC4899" />
                      <Text style={styles.lifestyleFactorTitle}>VO2 Max</Text>
                    </View>
                    <Text style={styles.lifestyleFactorValue}>
                      {record.lifestyleFactors.vo2Max.value} {record.lifestyleFactors.vo2Max.unit}
                    </Text>
                    <Text style={[
                      styles.lifestyleFactorAdjustment,
                      { color: record.lifestyleFactors.vo2Max.adjustment < 0 ? '#22C55E' : '#EF4444' }
                    ]}>
                      {record.lifestyleFactors.vo2Max.adjustment < 0 ? '↓' : '↑'} {Math.abs(record.lifestyleFactors.vo2Max.adjustment).toFixed(0)}%
                    </Text>
                  </View>
                )}

                {/* BMI */}
                <View style={styles.lifestyleFactorCard}>
                  <View style={styles.lifestyleFactorHeader}>
                    <MaterialCommunityIcons name="human" size={24} color="#8B5CF6" />
                    <Text style={styles.lifestyleFactorTitle}>BMI</Text>
                  </View>
                  <Text style={styles.lifestyleFactorValue}>
                    {record.lifestyleFactors.bmi.value.toFixed(1)}
                  </Text>
                  <Text style={[
                    styles.lifestyleFactorAdjustment,
                    { color: record.lifestyleFactors.bmi.adjustment < 0 ? '#22C55E' : '#EF4444' }
                  ]}>
                    {record.lifestyleFactors.bmi.adjustment < 0 ? '↓' : '↑'} {Math.abs(record.lifestyleFactors.bmi.adjustment).toFixed(0)}%
                  </Text>
                </View>

                {/* Diet Quality */}
                <View style={styles.lifestyleFactorCard}>
                  <View style={styles.lifestyleFactorHeader}>
                    <MaterialCommunityIcons name="food-apple" size={24} color="#10B981" />
                    <Text style={styles.lifestyleFactorTitle}>Diet</Text>
                  </View>
                  <Text style={styles.lifestyleFactorValue}>
                    {record.lifestyleFactors.dietQuality.value}
                  </Text>
                  <Text style={[
                    styles.lifestyleFactorAdjustment,
                    { color: record.lifestyleFactors.dietQuality.adjustment < 0 ? '#22C55E' : '#EF4444' }
                  ]}>
                    {record.lifestyleFactors.dietQuality.adjustment < 0 ? '↓' : '↑'} {Math.abs(record.lifestyleFactors.dietQuality.adjustment).toFixed(0)}%
                  </Text>
                </View>

                {/* Sleep Quality */}
                <View style={styles.lifestyleFactorCard}>
                  <View style={styles.lifestyleFactorHeader}>
                    <MaterialCommunityIcons name="sleep" size={24} color="#3B82F6" />
                    <Text style={styles.lifestyleFactorTitle}>Sleep</Text>
                  </View>
                  <Text style={styles.lifestyleFactorValue}>
                    {record.lifestyleFactors.sleepQuality.value}{record.lifestyleFactors.sleepQuality.unit}
                  </Text>
                  <Text style={[
                    styles.lifestyleFactorAdjustment,
                    { color: record.lifestyleFactors.sleepQuality.adjustment < 0 ? '#22C55E' : '#EF4444' }
                  ]}>
                    {record.lifestyleFactors.sleepQuality.adjustment < 0 ? '↓' : '↑'} {Math.abs(record.lifestyleFactors.sleepQuality.adjustment).toFixed(0)}%
                  </Text>
                </View>

                {/* Stress Level */}
                <View style={styles.lifestyleFactorCard}>
                  <View style={styles.lifestyleFactorHeader}>
                    <MaterialCommunityIcons name="brain" size={24} color="#F59E0B" />
                    <Text style={styles.lifestyleFactorTitle}>Stress</Text>
                  </View>
                  <Text style={styles.lifestyleFactorValue}>
                    {record.lifestyleFactors.stressLevel.value}{record.lifestyleFactors.stressLevel.unit}
                  </Text>
                  <Text style={[
                    styles.lifestyleFactorAdjustment,
                    { color: record.lifestyleFactors.stressLevel.adjustment < 0 ? '#22C55E' : '#EF4444' }
                  ]}>
                    {record.lifestyleFactors.stressLevel.adjustment < 0 ? '↓' : '↑'} {Math.abs(record.lifestyleFactors.stressLevel.adjustment).toFixed(0)}%
                  </Text>
                </View>

                {/* Alcohol Consumption */}
                {record.lifestyleFactors.alcoholConsumption && (
                  <View style={styles.lifestyleFactorCard}>
                    <View style={styles.lifestyleFactorHeader}>
                      <MaterialCommunityIcons name="glass-wine" size={24} color="#DC2626" />
                      <Text style={styles.lifestyleFactorTitle}>Alcohol</Text>
                    </View>
                    <Text style={styles.lifestyleFactorValue}>
                      {record.lifestyleFactors.alcoholConsumption.value}
                    </Text>
                    <Text style={[
                      styles.lifestyleFactorAdjustment,
                      { color: record.lifestyleFactors.alcoholConsumption.adjustment < 0 ? '#22C55E' : '#EF4444' }
                    ]}>
                      {record.lifestyleFactors.alcoholConsumption.adjustment < 0 ? '↓' : '↑'} {Math.abs(record.lifestyleFactors.alcoholConsumption.adjustment).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>
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
              {record.recommendation.actions.map((action: any, index: number) => (
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
                {record.recommendation.preventionStrategies.map((strategy: any, index: number) => (
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
  baselineRiskLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  riskAdjustmentLabel: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 16,
  },
  factorRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  factorRowExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 20,
  },
  factorHeaderExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  factorTitleGroup: {
    flex: 1,
  },
  factorContribution: {
    marginLeft: 12,
  },
  factorDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  factorDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  factorDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  factorDetailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
  },
  contributionTextLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
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
  factorValue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  factorInterpretation: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
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
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationSummary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
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
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
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
    borderRadius: 999,
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
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
  emptyMessage: {
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
  // Model-specific styles
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modelScore: {
    flex: 1,
  },
  modelScoreLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  modelScoreValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366F1',
  },
  modelCategory: {
    flex: 1,
    alignItems: 'flex-end',
  },
  modelCategoryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  modelCategoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  inputsSection: {
    gap: 12,
  },
  inputsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  inputRowLast: {
    borderBottomWidth: 0,
  },
  inputLeft: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  inputSource: {
    fontSize: 11,
    color: '#64748B',
  },
  inputRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  inputValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  inputContribution: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  contributionPositive: {
    color: '#EF4444',  // Red for risk-increasing factors
  },
  contributionNegative: {
    color: '#22C55E',  // Green for protective factors
  },
  missingInputsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  missingInputsText: {
    flex: 1,
    fontSize: 12,
    color: '#F59E0B',
  },
  // Human-centered design styles
  scoreMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreDetails: {
    flex: 1,
    marginLeft: 16,
  },
  progressBarContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  baselineRiskText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  statusBadgeContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lifestyleFactorCard: {
    width: (width - 44) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  lifestyleFactorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  lifestyleFactorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  lifestyleFactorValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  lifestyleFactorAdjustment: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ActuarialRiskDashboardScreen;
