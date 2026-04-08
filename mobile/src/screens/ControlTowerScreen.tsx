/**
 * Control Tower Screen - Autonomous AI Health Operating System
 * 
 * Production-Safe Refactor of HomeDailyBriefScreen.tsx
 * Decision-First Architecture with 7-Section Hierarchy
 * 
 * Hierarchy:
 * 1. Today's Decision (Hero)
 * 2. Priority Alerts
 * 3. Today's Plan
 * 4. Predictive Intelligence
 * 5. Device Intelligence
 * 6. Goal Progress
 * 7. Advanced Intelligence
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

import { TodayDecisionCard } from '../components/controlTower/TodayDecisionCard';
import { PriorityAlertsSection } from '../components/controlTower/PriorityAlertsSection';
import { TodayPlanSection } from '../components/controlTower/TodayPlanSection';
import { PredictiveIntelligenceSection } from '../components/controlTower/PredictiveIntelligenceSection';
import { DeviceIntelligenceSection } from '../components/controlTower/DeviceIntelligenceSection';
import { GoalProgressSection } from '../components/controlTower/GoalProgressSection';
import { AdvancedIntelligenceSection } from '../components/controlTower/AdvancedIntelligenceSection';

import controlTowerDailyService from '../services/controlTowerDailyService';
import { normalizeControlTowerPayload } from '../adapters/controlTowerAdapter';
import { useUser } from '../context/UserContext';
import type { ControlTowerPayload } from '../types/controlTower';
import type { DashboardScreenNavigationProp } from '../types/navigation';

type Props = {
  navigation: DashboardScreenNavigationProp;
};

const ControlTowerScreen: React.FC<Props> = ({ navigation }) => {
  const { userId } = useUser();
  const [controlTower, setControlTower] = useState<ControlTowerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchControlTower = useCallback(async (initial = false) => {
    if (!userId) {
      setError('Please set your user ID in Settings');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // Fetch from existing Control Tower Daily service
      const dailyResponse = await controlTowerDailyService.getToday(userId, !initial);
      
      // Normalize into unified ViewModel
      const normalized = normalizeControlTowerPayload(dailyResponse);
      
      setControlTower(normalized);
      setError(null);
    } catch (err) {
      setError('Unable to load Control Tower. Please try again.');
      console.error('Failed to fetch Control Tower:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchControlTower(true);
    }, [fetchControlTower]),
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

  // Action handlers
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
    // Safe navigation - only navigate if screen exists in navigation type
    // TODO: Add proper navigation types for advanced intelligence screens
    console.log('Navigate to:', target);
  }, []);

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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchControlTower(true)}>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchControlTower(false)} />
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

        {/* SECTION 4: PREDICTIVE INTELLIGENCE */}
        <PredictiveIntelligenceSection insights={controlTower.predictiveInsights} />

        {/* SECTION 5: DEVICE INTELLIGENCE */}
        <DeviceIntelligenceSection deviceIntelligence={controlTower.deviceIntelligence} />

        {/* SECTION 6: GOAL PROGRESS */}
        <GoalProgressSection goals={controlTower.goalProgress} />

        {/* SECTION 7: ADVANCED INTELLIGENCE */}
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

export default ControlTowerScreen;
