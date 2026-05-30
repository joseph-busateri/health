import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { RootStackParamList } from '../types/navigation';
import type { WorkoutTodayRecord } from '../types/workoutToday';
import { getWorkoutTodayV2 } from '../services/workoutTodayServiceV2';
import { DEFAULT_USER_ID } from '../context/UserContext';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutToday'>;

const WorkoutTodayScreen: React.FC<Props> = ({ route }) => {
  const { userId } = route.params;
  const normalizedUserId = userId?.trim() || DEFAULT_USER_ID;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<WorkoutTodayRecord | null>(null);

  const readinessMeta = useMemo(() => {
    if (!record) {
      return DEFAULT_READINESS_META;
    }

    return READINESS_LOOKUP[record.readinessStatus] ?? DEFAULT_READINESS_META;
  }, [record]);

  const formattedDate = useMemo(() => {
    if (!record) {
      return '';
    }

    try {
      const date = new Date(record.date);
      if (Number.isNaN(date.getTime())) {
        return record.date;
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch (err) {
      return record.date;
    }
  }, [record]);

  const load = useCallback(async (regenerate = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWorkoutTodayV2(normalizedUserId, { regenerate });
      setRecord(response);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load workout today');
    } finally {
      setLoading(false);
    }
  }, [normalizedUserId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error || !record) {
    const isBaselineError = error?.toLowerCase().includes('baseline') || error?.toLowerCase().includes('not found');
    
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          {isBaselineError ? 'No Workout Plan' : 'Error'}
        </Text>
        <Text style={styles.errorText}>
          {isBaselineError 
            ? 'Please upload a workout plan first to generate today\'s workout.'
            : error ?? 'No workout record available'
          }
        </Text>
        {isBaselineError && (
          <Text style={styles.errorSubtext}>
            Go to the Upload screen to add your workout document.
          </Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={readinessMeta.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroLabel}>Today&apos;s Focus</Text>
            <Text style={styles.heroTitle}>{formattedDate}</Text>
          </View>
          <View style={styles.heroBadges}>
            <View style={[styles.readinessBadge, { backgroundColor: readinessMeta.badgeBackground }]}>
              <Text style={[styles.readinessBadgeText, { color: readinessMeta.badgeText }]}>{readinessMeta.label}</Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={() => load(true)}
              disabled={loading}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.heroSummary}>{readinessMeta.summary}</Text>
      </LinearGradient>

      <View style={styles.sectionContainer}>
        <View style={[styles.card, styles.rationaleCard]}>
          <Text style={styles.overline}>Why it matters</Text>
          <Text style={styles.cardTitle}>Coach Perspective</Text>
          <Text style={styles.bodyText}>{record.rationale}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Baseline Blueprint</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>What was scheduled</Text>
            </View>
          </View>
          {renderWorkoutPlan(record.baselineWorkout, 'baseline')}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Personalized Plan</Text>
            <View style={[styles.cardBadge, styles.highlightBadge]}>
              <Text style={[styles.cardBadgeText, styles.highlightBadgeText]}>Adjusted for today</Text>
            </View>
          </View>
          {renderWorkoutPlan(record.adjustedWorkout, 'adjusted')}
          {record.adjustedWorkout.notes.length > 0 ? (
            <View style={styles.noteBlock}>
              {record.adjustedWorkout.notes.map((note, index) => (
                <Text key={`note-${index}`} style={styles.noteText}>{note}</Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Adjustments</Text>
          {record.adjustments.length === 0 ? (
            <Text style={styles.bodyText}>Sticking with the baseline plan—no changes needed today.</Text>
          ) : (
            <View style={styles.adjustmentList}>
              {record.adjustments.map((adjustment, index) => (
                <View key={`adj-item-${index}`} style={styles.adjustmentChip}>
                  <Text style={styles.adjustmentChipText}>{adjustment.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

type ReadinessMeta = {
  label: string;
  summary: string;
  gradient: string[];
  badgeBackground: string;
  badgeText: string;
};

const READINESS_LOOKUP: Record<WorkoutTodayRecord['readinessStatus'], ReadinessMeta> = {
  ready: {
    label: 'High Readiness',
    summary: 'Energy and recovery look strong—lean into progressive loads and crisp tempo.',
    gradient: ['#0F766E', '#14B8A6'],
    badgeBackground: 'rgba(20, 184, 166, 0.18)',
    badgeText: '#0B1120',
  },
  moderate: {
    label: 'Measured Readiness',
    summary: 'Stay intentional. Focus on quality movement and dial intensity based on feel.',
    gradient: ['#1E3A8A', '#4338CA'],
    badgeBackground: 'rgba(99, 102, 241, 0.24)',
    badgeText: '#111827',
  },
  low: {
    label: 'Recovery First',
    summary: 'Your system is asking for a lighter touch—prioritize form, breathing, and recovery work.',
    gradient: ['#9F1239', '#F97316'],
    badgeBackground: 'rgba(244, 114, 182, 0.28)',
    badgeText: '#111827',
  },
};

const DEFAULT_READINESS_META = READINESS_LOOKUP.moderate;

const renderWorkoutPlan = (plan: WorkoutTodayRecord['baselineWorkout'], keyPrefix: string) => {
  return (
    <View style={styles.planContainer}>
      <View style={styles.planHeader}>
        <Text style={styles.planDay}>{plan.day}</Text>
        {plan.dayPlan ? <Text style={styles.planSummary}>{plan.dayPlan}</Text> : null}
      </View>
      <View style={styles.exerciseList}>
        {plan.exercises.map((exercise, index) => (
          <View key={`${keyPrefix}-exercise-${index}`} style={styles.exerciseRow}>
            <View style={styles.exerciseMarker} />
            <View style={styles.exerciseContent}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              {exercise.setRepLoadNotes ? (
                <Text style={styles.exerciseDetail}>{exercise.setRepLoadNotes}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  hero: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(241, 245, 249, 0.85)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Platform.select({ ios: 'AvenirNext-Medium', android: 'sans-serif-medium', default: 'System' }),
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 28,
    lineHeight: 34,
    color: '#F8FAFC',
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium', default: 'System' }),
  },
  readinessBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  readinessBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSummary: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(241, 245, 249, 0.92)',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 18,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  rationaleCard: {
    backgroundColor: '#0B1120',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  overline: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: Platform.select({ ios: 'AvenirNext-Medium', android: 'sans-serif-medium', default: 'System' }),
  },
  cardTitle: {
    fontSize: 20,
    color: '#E2E8F0',
    marginBottom: 12,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium', default: 'System' }),
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#CBD5F5',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
  },
  highlightBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
  },
  highlightBadgeText: {
    color: '#BFDBFE',
  },
  cardBadgeText: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  planContainer: {
    gap: 12,
  },
  planHeader: {
    gap: 4,
  },
  planDay: {
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#60A5FA',
    fontWeight: '600',
  },
  planSummary: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 21,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 64, 175, 0.18)',
  },
  exerciseMarker: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
    marginTop: 6,
  },
  exerciseContent: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 15,
    color: '#F1F5F9',
    fontWeight: '600',
  },
  exerciseDetail: {
    fontSize: 13,
    color: '#CBD5F5',
    lineHeight: 18,
  },
  noteBlock: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 58, 138, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.28)',
    gap: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#DBEAFE',
    lineHeight: 20,
  },
  adjustmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  adjustmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
  },
  adjustmentChipText: {
    fontSize: 13,
    color: '#BFDBFE',
    fontWeight: '600',
  },
});

export default WorkoutTodayScreen;
