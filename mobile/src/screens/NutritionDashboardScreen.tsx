import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../types/navigation';

interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  hydrationOz: number;
}

interface NutritionAdjustment {
  type: string;
  change: string;
  reason: string;
  source?: string;
}

interface NutritionTodayData {
  id: string;
  userId: string;
  date: string;
  targets: NutritionTargets;
  baselineTargets?: NutritionTargets;
  mealTiming: {
    preWorkout?: string;
    postWorkout?: string;
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snacks?: string;
  };
  adjustments: NutritionAdjustment[];
  summary: string;
  source: 'baseline' | 'adjusted' | 'ai_optimized';
  sourceSignals: {
    recoveryScore?: number;
    stressScore?: number;
    adherenceScore?: number;
    workoutStatus?: string;
    workoutIntensity?: string;
    goalType?: string;
    predictiveRisk?: string;
  };
  crossEngineInfluence?: {
    applied: boolean;
    overallStatus?: string;
    influencingEngines?: string[];
    patterns?: Array<{
      name: string;
      severity: string;
      summary: string;
    }>;
    summary?: string;
  };
}

export default function NutritionDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionTodayData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNutritionData = useCallback(async (isRefresh = false) => {
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
      const response = await fetch(`http://localhost:3000/api/nutrition-today/${userId}/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setNutritionData(result.data);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load nutrition data';
      setError(errorMessage);
      console.error('Failed to fetch nutrition data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchNutritionData(false);
    }, [fetchNutritionData])
  );

  const onRefresh = () => {
    fetchNutritionData(true);
  };

  const getMacroPercentage = (macro: number, total: number) => {
    return Math.round((macro / total) * 100);
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'ai_optimized': return '#10b981';
      case 'adjusted': return '#f59e0b';
      case 'baseline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'ai_optimized': return 'AI Optimized';
      case 'adjusted': return 'Adjusted';
      case 'baseline': return 'Baseline';
      default: return source;
    }
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Set your user ID in Settings to view nutrition data</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading nutrition plan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchNutritionData(false)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!nutritionData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="nutrition-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>No nutrition data available</Text>
      </View>
    );
  }

  const { targets, baselineTargets, adjustments, summary, source, mealTiming, sourceSignals, crossEngineInfluence } = nutritionData;
  const totalCalories = targets.calories;
  const proteinCals = targets.protein * 4;
  const carbsCals = targets.carbs * 4;
  const fatsCals = targets.fats * 9;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition Plan</Text>
        <Text style={styles.subtitle}>Today's personalized nutrition targets</Text>
        <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(source) }]}>
          <Text style={styles.sourceBadgeText}>{getSourceLabel(source)}</Text>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Ionicons name="bulb" size={20} color="#3b82f6" />
        <Text style={styles.summaryText}>{summary}</Text>
      </View>

      {/* Calorie Target */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Daily Calorie Target</Text>
          {baselineTargets && baselineTargets.calories !== targets.calories && (
            <View style={styles.changeIndicator}>
              <Ionicons 
                name={targets.calories > baselineTargets.calories ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={targets.calories > baselineTargets.calories ? '#10b981' : '#ef4444'} 
              />
              <Text style={styles.changeText}>
                {targets.calories > baselineTargets.calories ? '+' : ''}
                {targets.calories - baselineTargets.calories} cal
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.calorieValue}>{targets.calories}</Text>
        <Text style={styles.calorieLabel}>calories</Text>
      </View>

      {/* Macros Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Macronutrient Breakdown</Text>
        
        {/* Protein */}
        <View style={styles.macroRow}>
          <View style={styles.macroInfo}>
            <View style={[styles.macroIcon, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="fitness" size={20} color="#fff" />
            </View>
            <View style={styles.macroDetails}>
              <Text style={styles.macroName}>Protein</Text>
              <Text style={styles.macroValue}>{targets.protein}g</Text>
            </View>
          </View>
          <View style={styles.macroStats}>
            <Text style={styles.macroCalories}>{proteinCals} cal</Text>
            <Text style={styles.macroPercentage}>{getMacroPercentage(proteinCals, totalCalories)}%</Text>
          </View>
        </View>

        {/* Carbs */}
        <View style={styles.macroRow}>
          <View style={styles.macroInfo}>
            <View style={[styles.macroIcon, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="flame" size={20} color="#fff" />
            </View>
            <View style={styles.macroDetails}>
              <Text style={styles.macroName}>Carbohydrates</Text>
              <Text style={styles.macroValue}>{targets.carbs}g</Text>
            </View>
          </View>
          <View style={styles.macroStats}>
            <Text style={styles.macroCalories}>{carbsCals} cal</Text>
            <Text style={styles.macroPercentage}>{getMacroPercentage(carbsCals, totalCalories)}%</Text>
          </View>
        </View>

        {/* Fats */}
        <View style={styles.macroRow}>
          <View style={styles.macroInfo}>
            <View style={[styles.macroIcon, { backgroundColor: '#8b5cf6' }]}>
              <Ionicons name="water" size={20} color="#fff" />
            </View>
            <View style={styles.macroDetails}>
              <Text style={styles.macroName}>Fats</Text>
              <Text style={styles.macroValue}>{targets.fats}g</Text>
            </View>
          </View>
          <View style={styles.macroStats}>
            <Text style={styles.macroCalories}>{fatsCals} cal</Text>
            <Text style={styles.macroPercentage}>{getMacroPercentage(fatsCals, totalCalories)}%</Text>
          </View>
        </View>
      </View>

      {/* Hydration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Hydration Target</Text>
          <Ionicons name="water-outline" size={24} color="#3b82f6" />
        </View>
        <Text style={styles.hydrationValue}>{targets.hydrationOz} oz</Text>
        <Text style={styles.hydrationLabel}>≈ {Math.round(targets.hydrationOz / 8)} glasses</Text>
      </View>

      {/* Meal Timing */}
      {Object.keys(mealTiming).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meal Timing Recommendations</Text>
          {mealTiming.preWorkout && (
            <View style={styles.mealTimingRow}>
              <Ionicons name="barbell" size={16} color="#6b7280" />
              <Text style={styles.mealTimingLabel}>Pre-Workout:</Text>
              <Text style={styles.mealTimingValue}>{mealTiming.preWorkout}</Text>
            </View>
          )}
          {mealTiming.postWorkout && (
            <View style={styles.mealTimingRow}>
              <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
              <Text style={styles.mealTimingLabel}>Post-Workout:</Text>
              <Text style={styles.mealTimingValue}>{mealTiming.postWorkout}</Text>
            </View>
          )}
          {mealTiming.breakfast && (
            <View style={styles.mealTimingRow}>
              <Ionicons name="sunny" size={16} color="#6b7280" />
              <Text style={styles.mealTimingLabel}>Breakfast:</Text>
              <Text style={styles.mealTimingValue}>{mealTiming.breakfast}</Text>
            </View>
          )}
          {mealTiming.lunch && (
            <View style={styles.mealTimingRow}>
              <Ionicons name="partly-sunny" size={16} color="#6b7280" />
              <Text style={styles.mealTimingLabel}>Lunch:</Text>
              <Text style={styles.mealTimingValue}>{mealTiming.lunch}</Text>
            </View>
          )}
          {mealTiming.dinner && (
            <View style={styles.mealTimingRow}>
              <Ionicons name="moon" size={16} color="#6b7280" />
              <Text style={styles.mealTimingLabel}>Dinner:</Text>
              <Text style={styles.mealTimingValue}>{mealTiming.dinner}</Text>
            </View>
          )}
        </View>
      )}

      {/* Adjustments Applied */}
      {adjustments.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Adjustments Applied</Text>
          {adjustments.map((adjustment, index) => (
            <View key={index} style={styles.adjustmentRow}>
              <View style={styles.adjustmentIcon}>
                <Ionicons name="star" size={16} color="#3b82f6" />
              </View>
              <View style={styles.adjustmentContent}>
                <Text style={styles.adjustmentChange}>{adjustment.change}</Text>
                <Text style={styles.adjustmentReason}>{adjustment.reason}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Cross-Engine Influence */}
      {crossEngineInfluence?.applied && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Cross-Engine Intelligence</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: crossEngineInfluence.overallStatus === 'optimal' ? '#10b981' : '#f59e0b' }
            ]}>
              <Text style={styles.statusBadgeText}>
                {crossEngineInfluence.overallStatus?.toUpperCase()}
              </Text>
            </View>
          </View>
          {crossEngineInfluence.summary && (
            <Text style={styles.crossEngineSummary}>{crossEngineInfluence.summary}</Text>
          )}
          {crossEngineInfluence.influencingEngines && crossEngineInfluence.influencingEngines.length > 0 && (
            <View style={styles.influencingEngines}>
              <Text style={styles.influencingEnginesLabel}>Influencing Engines:</Text>
              {crossEngineInfluence.influencingEngines.map((engine, index) => (
                <View key={index} style={styles.engineBadge}>
                  <Text style={styles.engineBadgeText}>{engine}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Source Signals */}
      {Object.keys(sourceSignals).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Context Signals</Text>
          <View style={styles.signalsGrid}>
            {sourceSignals.recoveryScore !== undefined && (
              <View style={styles.signalItem}>
                <Text style={styles.signalLabel}>Recovery</Text>
                <Text style={styles.signalValue}>{sourceSignals.recoveryScore}</Text>
              </View>
            )}
            {sourceSignals.workoutStatus && (
              <View style={styles.signalItem}>
                <Text style={styles.signalLabel}>Workout</Text>
                <Text style={styles.signalValue}>{sourceSignals.workoutStatus}</Text>
              </View>
            )}
            {sourceSignals.goalType && (
              <View style={styles.signalItem}>
                <Text style={styles.signalLabel}>Goal</Text>
                <Text style={styles.signalValue}>{sourceSignals.goalType}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('MealLog' as never)}
        >
          <Ionicons name="restaurant" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Log Meal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation.navigate('NutritionExtraction' as never)}
        >
          <Ionicons name="camera" size={20} color="#3b82f6" />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Scan Food</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 12,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sourceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryCard: {
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3b82f6',
    textAlign: 'center',
  },
  calorieLabel: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  macroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroDetails: {
    gap: 2,
  },
  macroName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  macroStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  macroCalories: {
    fontSize: 14,
    color: '#6b7280',
  },
  macroPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  hydrationValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3b82f6',
    textAlign: 'center',
  },
  hydrationLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  mealTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  mealTimingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 100,
  },
  mealTimingValue: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  adjustmentRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  adjustmentIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustmentContent: {
    flex: 1,
    gap: 4,
  },
  adjustmentChange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  adjustmentReason: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  crossEngineSummary: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  influencingEngines: {
    gap: 8,
  },
  influencingEnginesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  engineBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  engineBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  signalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  signalItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  signalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  signalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 32,
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
});
