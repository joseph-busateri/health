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
import { getRecoveryToday } from '../services/recoveryEngineService';
import { InputDetailsPanel } from '../components/InputDetailsPanel';

import type { InsightsStackParamList } from '../types/navigation';
import type { RecoveryRecord } from '../types/recoveryEngine';
import type { BodyCompositionScan } from '../types/bodyComposition';
import type { InputMetadata } from '../types/inputMetadata';

// Error boundary component to catch notification errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <View />;
    }
    return this.props.children;
  }
}

interface ScoreComponent {
  score: number;
  max: number;
  percentage: number;
  hasData: boolean;
}

interface CardiovascularScoreBreakdown {
  bloodPressure: ScoreComponent;
  lipidProfile: ScoreComponent;
  cardiacFunction: ScoreComponent;
  fitnessMetabolism: ScoreComponent;
  advancedMarkers: ScoreComponent;
  lifestyle: ScoreComponent;
  baselineAdjustment: ScoreComponent;
  total: number;
  maxTotal: number;
  percentage: number;
}

interface CardiovascularRecord {
  id: string;
  userId: string;
  date: string;
  cardiovascularStatus: 'optimal' | 'moderate' | 'elevated_risk' | 'high_risk';
  cardiovascularScore?: number;
  scoreBreakdown?: CardiovascularScoreBreakdown;
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
  inputs?: {
    restingHR?: number;
    hrv?: number;
    systolicBP?: number;
    diastolicBP?: number;
    lipidPanel?: {
      totalCholesterol?: number;
      ldl?: number;
      hdl?: number;
      triglycerides?: number;
      cholesterolRatio?: number;
      ldlHdlRatio?: number;
    };
    age?: number;
    smokingStatus?: 'never' | 'former' | 'current' | boolean;
    vo2Max?: number;
    apoB?: number;
    lipoproteinA?: number;
    hsCRP?: number;
    bodyFat?: number;
    stressScore?: number;
    recoveryScore?: number;
    metabolicStatus?: string;
  };
  detailedInputs?: InputMetadata[];
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
  const [recoveryData, setRecoveryData] = useState<RecoveryRecord | null>(null);
  const [bodyComposition, setBodyComposition] = useState<BodyCompositionScan | null>(null);

  const loadData = async () => {
    if (!resolvedUserId) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Loading cardiovascular data for userId:', resolvedUserId);
      
      // Load all data in parallel
      const [cardioResponse, recoveryResponse] = await Promise.allSettled([
        healthApi.cardiovascular.getToday(resolvedUserId, { regenerate: true }),
        getRecoveryToday(resolvedUserId, { regenerate: true }),
      ]);
      
      // Handle cardiovascular data
      if (cardioResponse.status === 'fulfilled' && cardioResponse.value.data?.success) {
        const cardioData = cardioResponse.value.data.data;
        setCardioData(cardioData);
        console.log('Cardiovascular data loaded:', cardioData.cardiovascularStatus);
        console.log('Cardiovascular inputs:', cardioData.inputs);
        console.log('Cardiovascular detailedInputs:', cardioData.detailedInputs);
        console.log('DetailedInputs count:', cardioData.detailedInputs?.length || 0);
      } else {
        setError('No cardiovascular data available');
      }
      
      // Handle recovery data
      if (recoveryResponse.status === 'fulfilled') {
        setRecoveryData(recoveryResponse.value);
        console.log('Recovery data loaded - Score:', recoveryResponse.value.recoveryScore, 'Status:', recoveryResponse.value.recoveryStatus);
      } else if (recoveryResponse.status === 'rejected') {
        console.warn('Recovery data not available:', recoveryResponse.reason);
      }
      
      // Try to load body composition data separately
      try {
        const bodyCompResponse = await fetch(`http://localhost:3000/api/body-composition/latest/${resolvedUserId}`);
        if (bodyCompResponse.ok) {
          const bodyCompData = await bodyCompResponse.json();
          if (bodyCompData.data) {
            setBodyComposition(bodyCompData.data);
            console.log('Body composition data loaded - Body Fat %:', bodyCompData.data.bodyFatPercentage, 'Weight:', bodyCompData.data.weightLb);
          }
        }
      } catch (bodyCompError) {
        console.warn('Body composition data not available:', bodyCompError);
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

  // Safety check for inputs field
  const inputs = cardioData?.inputs || {};

  const getCardioScore = (status: string): number => {
    switch (status) {
      case 'optimal': return 90;
      case 'moderate': return 75;
      case 'elevated_risk': return 55;
      case 'high_risk': return 35;
      default: return 70;
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

  const score = cardioData.cardiovascularScore ?? getCardioScore(cardioData.cardiovascularStatus);
  const statusLabel = getStatusLabel(cardioData.cardiovascularStatus);

  return (
    <ErrorBoundary>
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
          <View style={styles.scoreMainSection}>
            <View style={styles.scoreIconContainer}>
              <MaterialCommunityIcons name="heart-pulse" size={48} color="#3B82F6" />
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreLabel}>Cardiovascular Health Score</Text>
              <View style={styles.scoreValueContainer}>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreMaxValue}>/100</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${score}%` }]} />
                </View>
              </View>
              <Text style={styles.lastUpdated}>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#94A3B8" />
                {' '}Updated {new Date(cardioData.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.statusBadgeContainer}>
            <View style={getStatusBadgeStyle(cardioData.cardiovascularStatus)}>
              <MaterialCommunityIcons 
                name={cardioData.cardiovascularStatus === 'optimal' ? 'check-circle' : 
                      cardioData.cardiovascularStatus === 'moderate' ? 'information' :
                      cardioData.cardiovascularStatus === 'elevated_risk' ? 'alert' : 'alert-circle'} 
                size={16} 
                color="#0F172A" 
              />
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {cardioData.scoreBreakdown && cardioData.detailedInputs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score Breakdown</Text>
            
            {/* Blood Pressure Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="#EF4444" />
                  <Text style={styles.categoryTitle}>Blood Pressure</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${cardioData.scoreBreakdown.bloodPressure.percentage}%`, backgroundColor: cardioData.scoreBreakdown.bloodPressure.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.bloodPressure.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {cardioData.scoreBreakdown.bloodPressure.score}/{cardioData.scoreBreakdown.bloodPressure.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: cardioData.scoreBreakdown.bloodPressure.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.bloodPressure.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {cardioData.scoreBreakdown.bloodPressure.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel 
                inputs={cardioData.detailedInputs.filter(i => 
                  ['Systolic Blood Pressure', 'Diastolic Blood Pressure'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Lipid Profile Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="water" size={20} color="#3B82F6" />
                  <Text style={styles.categoryTitle}>Lipid Profile</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${cardioData.scoreBreakdown.lipidProfile.percentage}%`, backgroundColor: cardioData.scoreBreakdown.lipidProfile.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.lipidProfile.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {cardioData.scoreBreakdown.lipidProfile.score}/{cardioData.scoreBreakdown.lipidProfile.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: cardioData.scoreBreakdown.lipidProfile.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.lipidProfile.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {cardioData.scoreBreakdown.lipidProfile.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel 
                inputs={cardioData.detailedInputs.filter(i => 
                  ['Total Cholesterol', 'LDL Cholesterol', 'HDL Cholesterol', 'Triglycerides', 'Total Cholesterol/HDL Ratio'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Cardiac Function Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="heart-outline" size={20} color="#EC4899" />
                  <Text style={styles.categoryTitle}>Cardiac Function</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    {cardioData.scoreBreakdown.cardiacFunction.hasData ? (
                      <View style={[styles.categoryProgressFill, { width: `${cardioData.scoreBreakdown.cardiacFunction.percentage}%`, backgroundColor: cardioData.scoreBreakdown.cardiacFunction.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.cardiacFunction.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                    ) : null}
                  </View>
                  <Text style={styles.categoryScore}>
                    {cardioData.scoreBreakdown.cardiacFunction.hasData 
                      ? `${cardioData.scoreBreakdown.cardiacFunction.score}/${cardioData.scoreBreakdown.cardiacFunction.max}`
                      : 'N/A'}
                  </Text>
                  {cardioData.scoreBreakdown.cardiacFunction.hasData && (
                    <Text style={[styles.categoryPercentage, { color: cardioData.scoreBreakdown.cardiacFunction.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.cardiacFunction.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                      {cardioData.scoreBreakdown.cardiacFunction.percentage}%
                    </Text>
                  )}
                </View>
              </View>
              <InputDetailsPanel 
                inputs={cardioData.detailedInputs.filter(i => 
                  ['Resting Heart Rate', 'Heart Rate Variability'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Fitness & Metabolism Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="run" size={20} color="#8B5CF6" />
                  <Text style={styles.categoryTitle}>Fitness & Metabolism</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${cardioData.scoreBreakdown.fitnessMetabolism.percentage}%`, backgroundColor: cardioData.scoreBreakdown.fitnessMetabolism.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.fitnessMetabolism.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {cardioData.scoreBreakdown.fitnessMetabolism.score}/{cardioData.scoreBreakdown.fitnessMetabolism.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: cardioData.scoreBreakdown.fitnessMetabolism.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.fitnessMetabolism.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {cardioData.scoreBreakdown.fitnessMetabolism.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel 
                inputs={cardioData.detailedInputs.filter(i => 
                  ['VO2 Max', 'Body Fat Percentage'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Advanced Markers Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="flask" size={20} color="#06B6D4" />
                  <Text style={styles.categoryTitle}>Advanced Markers</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    {cardioData.scoreBreakdown.advancedMarkers.hasData ? (
                      <View style={[styles.categoryProgressFill, { width: `${cardioData.scoreBreakdown.advancedMarkers.percentage}%`, backgroundColor: cardioData.scoreBreakdown.advancedMarkers.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.advancedMarkers.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                    ) : null}
                  </View>
                  <Text style={styles.categoryScore}>
                    {cardioData.scoreBreakdown.advancedMarkers.hasData 
                      ? `${cardioData.scoreBreakdown.advancedMarkers.score}/${cardioData.scoreBreakdown.advancedMarkers.max}`
                      : 'N/A'}
                  </Text>
                  {cardioData.scoreBreakdown.advancedMarkers.hasData && (
                    <Text style={[styles.categoryPercentage, { color: cardioData.scoreBreakdown.advancedMarkers.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.advancedMarkers.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                      {cardioData.scoreBreakdown.advancedMarkers.percentage}%
                    </Text>
                  )}
                </View>
              </View>
              <InputDetailsPanel 
                inputs={cardioData.detailedInputs.filter(i => 
                  ['Apolipoprotein B', 'Lipoprotein(a)', 'High-Sensitivity C-Reactive Protein'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Lifestyle Section */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <MaterialCommunityIcons name="human" size={20} color="#F59E0B" />
                  <Text style={styles.categoryTitle}>Lifestyle & Demographics</Text>
                </View>
                <View style={styles.categoryScoreContainer}>
                  <View style={[styles.categoryProgressBar, { width: 60 }]}>
                    <View style={[styles.categoryProgressFill, { width: `${cardioData.scoreBreakdown.lifestyle.percentage}%`, backgroundColor: cardioData.scoreBreakdown.lifestyle.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.lifestyle.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={styles.categoryScore}>
                    {cardioData.scoreBreakdown.lifestyle.score}/{cardioData.scoreBreakdown.lifestyle.max}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: cardioData.scoreBreakdown.lifestyle.percentage >= 70 ? '#22C55E' : cardioData.scoreBreakdown.lifestyle.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {cardioData.scoreBreakdown.lifestyle.percentage}%
                  </Text>
                </View>
              </View>
              <InputDetailsPanel 
                inputs={cardioData.detailedInputs.filter(i => 
                  ['Age', 'Smoking Status', 'Stress Score', 'Recovery Score'].includes(i.name)
                )}
                title=""
              />
            </View>

            {/* Total Score */}
            <View style={styles.card}>
              <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                <Text style={styles.breakdownLabelTotal}>Total Score</Text>
                <Text style={styles.breakdownScoreTotal}>
                  {cardioData.scoreBreakdown.total}/{cardioData.scoreBreakdown.maxTotal}
                </Text>
                <Text style={styles.breakdownPercentageTotal}>
                  {cardioData.scoreBreakdown.percentage}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {cardioData.evidence?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.card}>
              <Text style={styles.summaryText}>{cardioData.evidence.summary}</Text>
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
    </ErrorBoundary>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#3B82F6',
    borderRadius: 999,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#94A3B8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inputLabelContainer: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  inputInterpretation: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 2,
  },
  dataSourceBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  realData: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  mockData: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  noData: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  inputValue: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
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
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
  },
  breakdownScore: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    marginRight: 12,
  },
  breakdownPercentage: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  breakdownTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 16,
  },
  breakdownLabelTotal: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
  },
  breakdownScoreTotal: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
    marginRight: 12,
  },
  breakdownPercentageTotal: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  categoryScore: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryProgressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
    marginRight: 12,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
});

export default CardiovascularDashboardScreenV2;
