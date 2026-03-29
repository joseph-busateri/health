import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RecoveryScore {
  overallScore: number;
  status: string;
  hrvScore: number;
  sleepScore: number;
  sorenessScore: number;
  stressScore: number;
  fatigueScore: number;
  hrvDeviation: number;
  acwr: number;
  readinessScore: number;
  recommendedIntensity: string;
  summary: string;
  keyFactors: string[];
}

interface WorkoutReadiness {
  readinessScore: number;
  readinessLevel: string;
  recommendedWorkoutType: string;
  recommendedIntensity: number;
  recommendedVolume: number;
  injuryRisk: string;
  overtrainingRisk: string;
  deloadRecommended: boolean;
  guidance: string;
  modifications: string[];
}

interface DeloadRecommendation {
  urgency: string;
  type: string;
  triggerReasons: string[];
  startDate: string;
  durationDays: number;
  activities: string[];
  volumeReduction: number;
  intensityReduction: number;
  expectedImprovement: number;
}

export default function RecoveryDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'readiness' | 'deload' | 'strategies'>('overview');
  
  // Mock data - replace with API calls
  const [recoveryScore, setRecoveryScore] = useState<RecoveryScore>({
    overallScore: 78,
    status: 'good',
    hrvScore: 82,
    sleepScore: 75,
    sorenessScore: 70,
    stressScore: 80,
    fatigueScore: 76,
    hrvDeviation: 5.2,
    acwr: 1.15,
    readinessScore: 80,
    recommendedIntensity: 'moderate',
    summary: 'Recovery is good (78/100). HRV is elevated. Training load is manageable.',
    keyFactors: ['Good HRV', 'Adequate sleep', 'Manageable training load'],
  });

  const [workoutReadiness, setWorkoutReadiness] = useState<WorkoutReadiness>({
    readinessScore: 80,
    readinessLevel: 'high',
    recommendedWorkoutType: 'strength',
    recommendedIntensity: 90,
    recommendedVolume: 90,
    injuryRisk: 'low',
    overtrainingRisk: 'low',
    deloadRecommended: false,
    guidance: 'Good readiness. Proceed with planned training at normal intensity.',
    modifications: ['No modifications needed'],
  });

  const [deloadRecommendation, setDeloadRecommendation] = useState<DeloadRecommendation | null>(null);

  const [recoveryStrategies, setRecoveryStrategies] = useState([
    {
      type: 'sleep',
      name: 'Sleep Optimization Protocol',
      description: 'Improve sleep quality and duration',
      frequency: 'daily',
      priority: 'high',
      expectedBoost: 25,
    },
    {
      type: 'active_recovery',
      name: 'Active Recovery Sessions',
      description: 'Light movement and mobility work',
      frequency: 'twice_weekly',
      priority: 'medium',
      expectedBoost: 15,
    },
  ]);

  useEffect(() => {
    loadRecoveryData();
  }, []);

  const loadRecoveryData = async () => {
    setLoading(true);
    try {
      // TODO: Implement API calls when server is running
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error loading recovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'moderate': return '#f59e0b';
      case 'poor': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getReadinessColor = (level: string) => {
    switch (level) {
      case 'peak': return '#10b981';
      case 'high': return '#3b82f6';
      case 'moderate': return '#f59e0b';
      case 'low': return '#ef4444';
      case 'rest_needed': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'very_high': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const renderOverview = () => (
    <View style={styles.section}>
      {/* Overall Recovery Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.cardTitle}>Overall Recovery</Text>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: getStatusColor(recoveryScore.status) }]}>
            {recoveryScore.overallScore}
          </Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(recoveryScore.status) }]}>
          <Text style={styles.statusText}>{recoveryScore.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.scoreSummary}>{recoveryScore.summary}</Text>
      </View>

      {/* Component Scores */}
      <View style={styles.componentScores}>
        <Text style={styles.sectionTitle}>Recovery Components</Text>
        
        <View style={styles.componentGrid}>
          <View style={styles.componentCard}>
            <Ionicons name="pulse" size={24} color="#ef4444" />
            <Text style={styles.componentLabel}>HRV</Text>
            <Text style={styles.componentValue}>{recoveryScore.hrvScore}</Text>
            <Text style={[styles.componentChange, { color: recoveryScore.hrvDeviation > 0 ? '#10b981' : '#ef4444' }]}>
              {recoveryScore.hrvDeviation > 0 ? '+' : ''}{recoveryScore.hrvDeviation.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.componentCard}>
            <Ionicons name="moon" size={24} color="#8b5cf6" />
            <Text style={styles.componentLabel}>Sleep</Text>
            <Text style={styles.componentValue}>{recoveryScore.sleepScore}</Text>
          </View>

          <View style={styles.componentCard}>
            <Ionicons name="fitness" size={24} color="#f59e0b" />
            <Text style={styles.componentLabel}>Soreness</Text>
            <Text style={styles.componentValue}>{recoveryScore.sorenessScore}</Text>
          </View>

          <View style={styles.componentCard}>
            <Ionicons name="alert-circle" size={24} color="#3b82f6" />
            <Text style={styles.componentLabel}>Stress</Text>
            <Text style={styles.componentValue}>{recoveryScore.stressScore}</Text>
          </View>

          <View style={styles.componentCard}>
            <Ionicons name="battery-charging" size={24} color="#10b981" />
            <Text style={styles.componentLabel}>Energy</Text>
            <Text style={styles.componentValue}>{recoveryScore.fatigueScore}</Text>
          </View>

          <View style={styles.componentCard}>
            <Ionicons name="barbell" size={24} color="#6b7280" />
            <Text style={styles.componentLabel}>ACWR</Text>
            <Text style={styles.componentValue}>{recoveryScore.acwr.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Key Factors */}
      <View style={styles.factorsCard}>
        <Text style={styles.cardTitle}>Key Factors</Text>
        {recoveryScore.keyFactors.map((factor, index) => (
          <View key={index} style={styles.factorItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.factorText}>{factor}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReadiness = () => (
    <View style={styles.section}>
      {/* Readiness Score */}
      <View style={styles.readinessCard}>
        <Text style={styles.cardTitle}>Workout Readiness</Text>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: getReadinessColor(workoutReadiness.readinessLevel) }]}>
            {workoutReadiness.readinessScore}
          </Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getReadinessColor(workoutReadiness.readinessLevel) }]}>
          <Text style={styles.statusText}>{workoutReadiness.readinessLevel.toUpperCase()}</Text>
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Today's Recommendations</Text>
        
        <View style={styles.recommendationRow}>
          <Text style={styles.recommendationLabel}>Workout Type</Text>
          <Text style={styles.recommendationValue}>{workoutReadiness.recommendedWorkoutType}</Text>
        </View>

        <View style={styles.recommendationRow}>
          <Text style={styles.recommendationLabel}>Intensity</Text>
          <Text style={styles.recommendationValue}>{workoutReadiness.recommendedIntensity}%</Text>
        </View>

        <View style={styles.recommendationRow}>
          <Text style={styles.recommendationLabel}>Volume</Text>
          <Text style={styles.recommendationValue}>{workoutReadiness.recommendedVolume}%</Text>
        </View>

        <View style={styles.guidanceBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.guidanceText}>{workoutReadiness.guidance}</Text>
        </View>
      </View>

      {/* Risk Assessment */}
      <View style={styles.riskCard}>
        <Text style={styles.cardTitle}>Risk Assessment</Text>
        
        <View style={styles.riskRow}>
          <Text style={styles.riskLabel}>Injury Risk</Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(workoutReadiness.injuryRisk) }]}>
            <Text style={styles.riskText}>{workoutReadiness.injuryRisk.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.riskRow}>
          <Text style={styles.riskLabel}>Overtraining Risk</Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(workoutReadiness.overtrainingRisk) }]}>
            <Text style={styles.riskText}>{workoutReadiness.overtrainingRisk.toUpperCase()}</Text>
          </View>
        </View>

        {workoutReadiness.deloadRecommended && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>Deload week recommended</Text>
          </View>
        )}
      </View>

      {/* Modifications */}
      <View style={styles.modificationsCard}>
        <Text style={styles.cardTitle}>Workout Modifications</Text>
        {workoutReadiness.modifications.map((mod, index) => (
          <View key={index} style={styles.modificationItem}>
            <Ionicons name="arrow-forward" size={14} color="#6b7280" />
            <Text style={styles.modificationText}>{mod}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDeload = () => (
    <View style={styles.section}>
      {deloadRecommendation ? (
        <>
          {/* Deload Alert */}
          <View style={[styles.deloadAlert, { 
            backgroundColor: deloadRecommendation.urgency === 'immediate' ? '#fef2f2' : '#fffbeb' 
          }]}>
            <Ionicons 
              name="warning" 
              size={32} 
              color={deloadRecommendation.urgency === 'immediate' ? '#dc2626' : '#f59e0b'} 
            />
            <Text style={styles.deloadAlertTitle}>Deload Week Recommended</Text>
            <Text style={styles.deloadUrgency}>
              Urgency: {deloadRecommendation.urgency.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          {/* Trigger Reasons */}
          <View style={styles.triggersCard}>
            <Text style={styles.cardTitle}>Why Deload is Needed</Text>
            {deloadRecommendation.triggerReasons.map((reason, index) => (
              <View key={index} style={styles.triggerItem}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.triggerText}>{reason}</Text>
              </View>
            ))}
          </View>

          {/* Deload Plan */}
          <View style={styles.deloadPlanCard}>
            <Text style={styles.cardTitle}>Deload Plan</Text>
            
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Type</Text>
              <Text style={styles.planValue}>{deloadRecommendation.type.replace('_', ' ')}</Text>
            </View>

            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Start Date</Text>
              <Text style={styles.planValue}>{deloadRecommendation.startDate}</Text>
            </View>

            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Duration</Text>
              <Text style={styles.planValue}>{deloadRecommendation.durationDays} days</Text>
            </View>

            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Volume Reduction</Text>
              <Text style={styles.planValue}>{deloadRecommendation.volumeReduction}%</Text>
            </View>

            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Intensity Reduction</Text>
              <Text style={styles.planValue}>{deloadRecommendation.intensityReduction}%</Text>
            </View>

            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Expected Improvement</Text>
              <Text style={[styles.planValue, { color: '#10b981' }]}>
                +{deloadRecommendation.expectedImprovement}%
              </Text>
            </View>
          </View>

          {/* Recommended Activities */}
          <View style={styles.activitiesCard}>
            <Text style={styles.cardTitle}>Recommended Activities</Text>
            {deloadRecommendation.activities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#3b82f6" />
                <Text style={styles.activityText}>{activity}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => Alert.alert('Deload Accepted', 'Deload week has been scheduled')}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.buttonText}>Accept Deload</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.postponeButton}
              onPress={() => Alert.alert('Postponed', 'Deload postponed by 3 days')}
            >
              <Ionicons name="time" size={20} color="#3b82f6" />
              <Text style={[styles.buttonText, { color: '#3b82f6' }]}>Postpone</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.noDeloadCard}>
          <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          <Text style={styles.noDeloadTitle}>No Deload Needed</Text>
          <Text style={styles.noDeloadText}>
            Your recovery metrics are good. Continue with your current training plan.
          </Text>
        </View>
      )}
    </View>
  );

  const renderStrategies = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recovery Strategies</Text>
      
      {recoveryStrategies.map((strategy, index) => (
        <View key={index} style={styles.strategyCard}>
          <View style={styles.strategyHeader}>
            <View style={styles.strategyIcon}>
              <Ionicons 
                name={strategy.type === 'sleep' ? 'moon' : 'fitness'} 
                size={24} 
                color="#3b82f6" 
              />
            </View>
            <View style={styles.strategyInfo}>
              <Text style={styles.strategyName}>{strategy.name}</Text>
              <Text style={styles.strategyDescription}>{strategy.description}</Text>
            </View>
          </View>

          <View style={styles.strategyDetails}>
            <View style={styles.strategyDetail}>
              <Text style={styles.detailLabel}>Frequency</Text>
              <Text style={styles.detailValue}>{strategy.frequency}</Text>
            </View>

            <View style={styles.strategyDetail}>
              <Text style={styles.detailLabel}>Priority</Text>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: strategy.priority === 'high' ? '#f59e0b' : '#3b82f6' }
              ]}>
                <Text style={styles.priorityText}>{strategy.priority}</Text>
              </View>
            </View>

            <View style={styles.strategyDetail}>
              <Text style={styles.detailLabel}>Expected Boost</Text>
              <Text style={[styles.detailValue, { color: '#10b981' }]}>
                +{strategy.expectedBoost}%
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Strategy</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading recovery data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recovery Dashboard</Text>
        <Text style={styles.subtitle}>Optimize your recovery and performance</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Ionicons 
            name="analytics" 
            size={20} 
            color={selectedTab === 'overview' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'readiness' && styles.tabActive]}
          onPress={() => setSelectedTab('readiness')}
        >
          <Ionicons 
            name="fitness" 
            size={20} 
            color={selectedTab === 'readiness' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'readiness' && styles.tabTextActive]}>
            Readiness
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'deload' && styles.tabActive]}
          onPress={() => setSelectedTab('deload')}
        >
          <Ionicons 
            name="pause-circle" 
            size={20} 
            color={selectedTab === 'deload' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'deload' && styles.tabTextActive]}>
            Deload
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'strategies' && styles.tabActive]}
          onPress={() => setSelectedTab('strategies')}
        >
          <Ionicons 
            name="bulb" 
            size={20} 
            color={selectedTab === 'strategies' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'strategies' && styles.tabTextActive]}>
            Strategies
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'readiness' && renderReadiness()}
        {selectedTab === 'deload' && renderDeload()}
        {selectedTab === 'strategies' && renderStrategies()}
      </ScrollView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreSummary: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  componentScores: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  componentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  componentCard: {
    width: '31%',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    alignItems: 'center',
  },
  componentLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 4,
  },
  componentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  componentChange: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  factorsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  factorText: {
    fontSize: 14,
    color: '#374151',
  },
  readinessCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recommendationLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  recommendationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  guidanceText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  modificationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  modificationText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  deloadAlert: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  deloadAlertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  deloadUrgency: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  triggersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  triggerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  deloadPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  planLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  planValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activitiesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  postponeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  noDeloadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDeloadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  noDeloadText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  strategyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  strategyIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  strategyDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  strategyDetail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
