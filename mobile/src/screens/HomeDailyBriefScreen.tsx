/**
 * Home Daily Brief Screen - Autonomous AI Health Operating System Control Tower
 * 
 * Production-Safe Refactor: Decision-First Architecture
 * Preserves existing service contracts while implementing 7-section hierarchy
 */

import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Control Tower Components (Phase 14)
import { TodayDecisionCard } from '../components/controlTower/TodayDecisionCard';
import { PriorityAlertsSection } from '../components/controlTower/PriorityAlertsSection';
import { TodayPlanSection } from '../components/controlTower/TodayPlanSection';
import { PredictiveIntelligenceSection } from '../components/controlTower/PredictiveIntelligenceSection';
import { DeviceIntelligenceSection } from '../components/controlTower/DeviceIntelligenceSection';
import { GoalProgressSection } from '../components/controlTower/GoalProgressSection';
import { AdvancedIntelligenceSection } from '../components/controlTower/AdvancedIntelligenceSection';

// Execution Intelligence Components (Phase 15)
import { ExecutionIntelligenceSection } from '../components/execution/ExecutionIntelligenceSection';

// Predictive Behavior Components (Phase 16)
import { PredictiveBehaviorSection } from '../components/predictiveBehavior/PredictiveBehaviorSection';

// Autonomous Adjustment Components (Phase 17)
import { AutonomousAdjustmentSection } from '../components/autonomousAdjustment/AutonomousAdjustmentSection';

// Existing services (preserved)
import controlTowerDailyService, {
  type ControlTowerDailyResponse,
} from '../services/controlTowerDailyService';

// Adapter layer for safe normalization
import { normalizeControlTowerPayload } from '../adapters/controlTowerAdapter';
import { generateExecutionIntelligence } from '../adapters/executionAdapter';
import { generatePredictiveBehaviorIntelligence } from '../adapters/predictiveBehaviorAdapter';
import { generateAutonomousAdjustments } from '../adapters/autonomousAdjustmentAdapter';
import type { ControlTowerPayload } from '../types/controlTower';
import type { ExecutionIntelligence } from '../types/execution';
import type { PredictiveBehaviorIntelligence } from '../types/predictiveBehavior';
import type { AutonomousAdjustmentIntelligence } from '../types/autonomousAdjustment';
import type { DashboardScreenNavigationProp } from '../types/navigation';

// Services
import executionService from '../services/executionService';
import autonomousAdjustmentService from '../services/autonomousAdjustmentService';

type Props = {
  navigation: DashboardScreenNavigationProp;
};

const USER_ID = process.env.EXPO_PUBLIC_SAMPLE_USER_ID || 'mobile-demo-user';

const HomeDailyBriefScreen: React.FC<Props> = ({ navigation }) => {
  // State management (preserved from original)
  const [dailyBrief, setDailyBrief] = useState<ControlTowerDailyResponse | null>(null);
  const [controlTower, setControlTower] = useState<ControlTowerPayload | null>(null);
  const [execution, setExecution] = useState<ExecutionIntelligence | null>(null);
  const [predictiveBehavior, setPredictiveBehavior] = useState<PredictiveBehaviorIntelligence | null>(null);
  const [autonomousAdjustments, setAutonomousAdjustments] = useState<AutonomousAdjustmentIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyBrief = useCallback(async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // Fetch from existing service (preserved)
      const data = await controlTowerDailyService.getToday(USER_ID, !initial);
      setDailyBrief(data);
      
      // Normalize into Control Tower ViewModel
      const normalized = normalizeControlTowerPayload(data);
      setControlTower(normalized);
      
      // Generate Execution Intelligence (Phase 15)
      const executionIntel = generateExecutionIntelligence(normalized);
      setExecution(executionIntel);
      
      // Generate Predictive Behavior Intelligence (Phase 16)
      const predictiveBehaviorIntel = generatePredictiveBehaviorIntelligence(executionIntel);
      setPredictiveBehavior(predictiveBehaviorIntel);
      
      // Generate Autonomous Adjustments (Phase 17)
      const autonomousAdjustmentsIntel = generateAutonomousAdjustments(executionIntel, predictiveBehaviorIntel);
      setAutonomousAdjustments(autonomousAdjustmentsIntel);
      
      setError(null);
    } catch (err) {
      setError('Unable to load AI Health Command Center. Please try again.');
      console.error('Failed to fetch Control Tower:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDailyBrief(true);
    }, [fetchDailyBrief]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => navigation.navigate('DailyCheckIn')}
        >
          <Text style={styles.checkInButtonText}>Daily Check-In</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Action handlers for Control Tower
  const handleAcceptPlan = useCallback(() => {
    // TODO: Implement plan acceptance
    console.log('Plan accepted');
  }, []);

  const handleModifyPlan = useCallback(() => {
    // TODO: Implement plan modification
    console.log('Plan modification requested');
  }, []);

  const handleViewDetails = useCallback(() => {
    // TODO: Navigate to detailed analysis
    console.log('View details requested');
  }, []);

  const handleNavigateToAdvanced = useCallback((target: string) => {
    // Safe navigation for advanced intelligence
    console.log('Navigate to:', target);
  }, []);

  // Execution handlers (Phase 15)
  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      await executionService.completeTask(USER_ID, taskId);
      // Optimistic update
      if (execution) {
        const updatedTasks = execution.plan.tasks.map(task =>
          task.id === taskId ? { ...task, status: 'completed' as const, completedAt: new Date().toISOString() } : task
        );
        setExecution({
          ...execution,
          plan: { ...execution.plan, tasks: updatedTasks },
        });
      }
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  }, [execution]);

  const handlePartialTask = useCallback(async (taskId: string) => {
    try {
      await executionService.partialTask(USER_ID, taskId);
      // Optimistic update
      if (execution) {
        const updatedTasks = execution.plan.tasks.map(task =>
          task.id === taskId ? { ...task, status: 'partial' as const } : task
        );
        setExecution({
          ...execution,
          plan: { ...execution.plan, tasks: updatedTasks },
        });
      }
    } catch (err) {
      console.error('Failed to mark task as partial:', err);
    }
  }, [execution]);

  const handleSkipTask = useCallback(async (taskId: string) => {
    try {
      await executionService.skipTask(USER_ID, taskId);
      // Optimistic update
      if (execution) {
        const updatedTasks = execution.plan.tasks.map(task =>
          task.id === taskId ? { ...task, status: 'skipped' as const } : task
        );
        setExecution({
          ...execution,
          plan: { ...execution.plan, tasks: updatedTasks },
        });
      }
    } catch (err) {
      console.error('Failed to skip task:', err);
    }
  }, [execution]);

  const handleDismissIntervention = useCallback(async (interventionId: string) => {
    try {
      await executionService.dismissIntervention(USER_ID, interventionId);
      // Optimistic update
      if (execution) {
        const updatedInterventions = execution.interventions.map(i =>
          i.id === interventionId ? { ...i, dismissed: true } : i
        );
        setExecution({
          ...execution,
          interventions: updatedInterventions,
        });
      }
    } catch (err) {
      console.error('Failed to dismiss intervention:', err);
    }
  }, [execution]);

  // Autonomous adjustment handlers (Phase 17)
  const handleAcceptAdjustment = useCallback(async (adjustmentId: string) => {
    try {
      await autonomousAdjustmentService.applyAdjustment(USER_ID, {
        adjustmentId,
        userId: USER_ID,
        userConfirmed: true,
        timestamp: new Date().toISOString(),
      });
      // Optimistic update
      if (autonomousAdjustments) {
        const adjustment = autonomousAdjustments.pendingAdjustments.find(a => a.id === adjustmentId);
        if (adjustment) {
          setAutonomousAdjustments({
            ...autonomousAdjustments,
            pendingAdjustments: autonomousAdjustments.pendingAdjustments.filter(a => a.id !== adjustmentId),
            appliedAdjustments: [
              ...autonomousAdjustments.appliedAdjustments,
              { ...adjustment, status: 'applied', appliedAt: new Date().toISOString() },
            ],
            userConfirmedCount: autonomousAdjustments.userConfirmedCount + 1,
          });
        }
      }
      // Refresh to get updated plan
      fetchDailyBrief(false);
    } catch (err) {
      console.error('Failed to accept adjustment:', err);
    }
  }, [autonomousAdjustments]);

  const handleDismissAdjustment = useCallback(async (adjustmentId: string) => {
    try {
      await autonomousAdjustmentService.dismissAdjustment(USER_ID, {
        adjustmentId,
        userId: USER_ID,
        timestamp: new Date().toISOString(),
      });
      // Optimistic update
      if (autonomousAdjustments) {
        const adjustment = autonomousAdjustments.pendingAdjustments.find(a => a.id === adjustmentId);
        if (adjustment) {
          setAutonomousAdjustments({
            ...autonomousAdjustments,
            pendingAdjustments: autonomousAdjustments.pendingAdjustments.filter(a => a.id !== adjustmentId),
            dismissedAdjustments: [
              ...autonomousAdjustments.dismissedAdjustments,
              { ...adjustment, status: 'dismissed', dismissedAt: new Date().toISOString() },
            ],
          });
        }
      }
    } catch (err) {
      console.error('Failed to dismiss adjustment:', err);
    }
  }, [autonomousAdjustments]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading AI Health Command Center...</Text>
      </View>
    );
  }

  if (error || !controlTower) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'No data available'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchDailyBrief(true)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchDailyBrief(false)} />
        }
      >
        {/* Data Quality Indicator */}
        <View style={styles.qualityIndicator}>
          <Text style={styles.qualityText}>
            Data Quality: {controlTower.dataQuality.toUpperCase()}
          </Text>
          <Text style={styles.lastUpdatedText}>
            Updated: {new Date(controlTower.lastUpdated).toLocaleTimeString()}
          </Text>
        </View>

        {/* SECTION 1: TODAY'S DECISION (Hero) */}
        <TodayDecisionCard
          decision={controlTower.todayDecision}
          onAccept={handleAcceptPlan}
          onModify={handleModifyPlan}
          onViewDetails={handleViewDetails}
        />

        {/* SECTION 2: PRIORITY ALERTS */}
        <PriorityAlertsSection alerts={controlTower.priorityAlerts} />

        {/* SECTION 3: TODAY'S PLAN */}
        <TodayPlanSection plan={controlTower.todayPlan} />

        {/* SECTION 4: EXECUTION INTELLIGENCE (Phase 15) */}
        {execution && (
          <ExecutionIntelligenceSection
            execution={execution}
            onCompleteTask={handleCompleteTask}
            onPartialTask={handlePartialTask}
            onSkipTask={handleSkipTask}
            onDismissIntervention={handleDismissIntervention}
          />
        )}

        {/* SECTION 5: PREDICTIVE BEHAVIOR INTELLIGENCE (Phase 16 - NEW) */}
        {predictiveBehavior && (
          <PredictiveBehaviorSection predictiveBehavior={predictiveBehavior} />
        )}

        {/* SECTION 6: AUTONOMOUS PLAN ADJUSTMENT (Phase 17 - NEW) */}
        {autonomousAdjustments && (
          <AutonomousAdjustmentSection
            adjustments={autonomousAdjustments}
            onAcceptAdjustment={handleAcceptAdjustment}
            onDismissAdjustment={handleDismissAdjustment}
          />
        )}

        {/* SECTION 7: PREDICTIVE INTELLIGENCE */}
        <PredictiveIntelligenceSection insights={controlTower.predictiveInsights} />

        {/* SECTION 8: DEVICE INTELLIGENCE */}
        <DeviceIntelligenceSection deviceIntelligence={controlTower.deviceIntelligence} />

        {/* SECTION 9: GOAL PROGRESS */}
        <GoalProgressSection goals={controlTower.goalProgress} />

        {/* SECTION 10: ADVANCED INTELLIGENCE */}
        <AdvancedIntelligenceSection
          sections={controlTower.advancedIntelligence}
          onNavigate={handleNavigateToAdvanced}
        />

        {/* Footer Spacer */}
        <View style={styles.footerSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  qualityIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#475569',
  },
  checkInButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSpacer: {
    height: 20,
  },
});

export default HomeDailyBriefScreen;