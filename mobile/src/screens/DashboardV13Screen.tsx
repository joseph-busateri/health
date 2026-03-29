import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getAllDashboardData } from '../services/dashboardService';
import type {
  RecoveryEngineData,
  StressEngineData,
  JointHealthEngineData,
  AdherenceEngineData,
  SupplementEngineData,
  WorkoutEngineData,
  ControlTowerData,
  BloodworkLatest,
  TodayRecommendation,
} from '../types/engines';

const USER_ID = 'default-user';

interface DashboardData {
  controlTower: ControlTowerData | null;
  recovery: RecoveryEngineData | null;
  stress: StressEngineData | null;
  jointHealth: JointHealthEngineData | null;
  adherence: AdherenceEngineData | null;
  supplements: SupplementEngineData | null;
  workout: WorkoutEngineData | null;
  bloodwork: BloodworkLatest | null;
  recommendations: TodayRecommendation[];
}

const DashboardV13Screen = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const dashboardData = await getAllDashboardData(USER_ID);
      setData(dashboardData);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your health dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 1. Overall Health (Control Tower) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Health</Text>
        <Text style={styles.sectionSubtitle}>Control Tower</Text>
        
        {data?.controlTower ? (
          <View style={styles.card}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text style={styles.scoreValue}>
                {data.controlTower.overallScore ?? '—'}
              </Text>
              <View style={[styles.statusBadge, getStatusColor(data.controlTower.overallStatus)]}>
                <Text style={styles.statusText}>{data.controlTower.overallStatus}</Text>
              </View>
            </View>
            
            <View style={styles.componentsGrid}>
              <ComponentScore label="CV" data={data.controlTower.components.cv} />
              <ComponentScore label="REC" data={data.controlTower.components.rec} />
              <ComponentScore label="MET" data={data.controlTower.components.met} />
              <ComponentScore label="PERF" data={data.controlTower.components.perf} />
              <ComponentScore label="SH" data={data.controlTower.components.sh} />
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>No control tower data available</Text>
        )}
      </View>

      {/* 2. Recovery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recovery</Text>
        <Text style={styles.sectionSubtitle}>Sleep, HRV, and readiness</Text>
        
        {data?.recovery ? (
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Recovery Score</Text>
                <Text style={styles.metricValue}>{data.recovery.recoveryScore}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Status</Text>
                <Text style={[styles.metricValue, styles.statusValue]}>
                  {data.recovery.recoveryStatus}
                </Text>
              </View>
            </View>
            
            {data.recovery.hrv && (
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>HRV</Text>
                  <Text style={styles.metricValue}>{data.recovery.hrv}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Sleep Quality</Text>
                  <Text style={styles.metricValue}>{data.recovery.sleepQuality ?? '—'}</Text>
                </View>
              </View>
            )}
            
            {data.recovery.recommendations.length > 0 && (
              <View style={styles.recommendations}>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {data.recovery.recommendations.map((rec, idx) => (
                  <Text key={idx} style={styles.recommendationText}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noData}>No recovery data available</Text>
        )}
      </View>

      {/* 3. Stress / CNS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stress / CNS</Text>
        <Text style={styles.sectionSubtitle}>Nervous system load</Text>
        
        {data?.stress ? (
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Stress Score</Text>
                <Text style={styles.metricValue}>{data.stress.stressScore}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Level</Text>
                <Text style={[styles.metricValue, getStressColor(data.stress.stressLevel)]}>
                  {data.stress.stressLevel}
                </Text>
              </View>
            </View>
            
            {data.stress.recommendations.length > 0 && (
              <View style={styles.recommendations}>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {data.stress.recommendations.map((rec, idx) => (
                  <Text key={idx} style={styles.recommendationText}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noData}>No stress data available</Text>
        )}
      </View>

      {/* 4. Workout */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout</Text>
        <Text style={styles.sectionSubtitle}>Today's training and adjustments</Text>
        
        {data?.workout ? (
          <View style={styles.card}>
            {data.workout.todayWorkout ? (
              <>
                <Text style={styles.workoutName}>{data.workout.todayWorkout.name}</Text>
                {data.workout.todayWorkout.exercises.map((exercise, idx) => (
                  <View key={idx} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetails}>
                      {exercise.sets} × {exercise.reps}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.noData}>No workout scheduled for today</Text>
            )}
            
            {data.workout.adjustments.length > 0 && (
              <View style={styles.adjustments}>
                <Text style={styles.adjustmentsTitle}>Agent Adjustments:</Text>
                {data.workout.adjustments.map((adj, idx) => (
                  <View key={idx} style={styles.adjustmentItem}>
                    <Text style={styles.adjustmentExercise}>{adj.exercise}</Text>
                    <Text style={styles.adjustmentMod}>{adj.modification}</Text>
                    <Text style={styles.adjustmentRationale}>{adj.rationale}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noData}>No workout data available</Text>
        )}
      </View>

      {/* 5. Supplements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supplements</Text>
        <Text style={styles.sectionSubtitle}>Recommendations and current stack</Text>
        
        {data?.supplements ? (
          <View style={styles.card}>
            {data.supplements.recommendations.length > 0 ? (
              <>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {data.supplements.recommendations.map((rec, idx) => (
                  <View key={idx} style={[styles.supplementRec, getSeverityColor(rec.severity)]}>
                    <View style={styles.supplementHeader}>
                      <Text style={styles.supplementAction}>{rec.action.toUpperCase()}</Text>
                      <Text style={styles.supplementSeverity}>{rec.severity}</Text>
                    </View>
                    <Text style={styles.supplementName}>{rec.supplement}</Text>
                    {rec.dosage && <Text style={styles.supplementDosage}>{rec.dosage}</Text>}
                    <Text style={styles.supplementRationale}>{rec.rationale}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.noData}>No supplement recommendations</Text>
            )}
          </View>
        ) : (
          <Text style={styles.noData}>No supplement data available</Text>
        )}
      </View>

      {/* 6. Joint Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Joint / Injury</Text>
        <Text style={styles.sectionSubtitle}>Injury risk and modifications</Text>
        
        {data?.jointHealth ? (
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Joint Health Score</Text>
                <Text style={styles.metricValue}>{data.jointHealth.jointHealthScore}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Injury Risk</Text>
                <Text style={[styles.metricValue, getRiskColor(data.jointHealth.injuryRisk)]}>
                  {data.jointHealth.injuryRisk}
                </Text>
              </View>
            </View>
            
            {data.jointHealth.workoutModifications.length > 0 && (
              <View style={styles.modifications}>
                <Text style={styles.modificationsTitle}>Workout Modifications:</Text>
                {data.jointHealth.workoutModifications.map((mod, idx) => (
                  <Text key={idx} style={styles.modificationText}>• {mod}</Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noData}>No joint health data available</Text>
        )}
      </View>

      {/* 7. Adherence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adherence</Text>
        <Text style={styles.sectionSubtitle}>Tracking across domains</Text>
        
        {data?.adherence ? (
          <View style={styles.card}>
            <View style={styles.adherenceGrid}>
              <View style={styles.adherenceItem}>
                <Text style={styles.adherenceLabel}>Workout</Text>
                <Text style={styles.adherenceValue}>{data.adherence.domains.workout}%</Text>
                <Text style={styles.adherenceTrend}>{data.adherence.trends.workout}</Text>
              </View>
              <View style={styles.adherenceItem}>
                <Text style={styles.adherenceLabel}>Nutrition</Text>
                <Text style={styles.adherenceValue}>{data.adherence.domains.nutrition}%</Text>
                <Text style={styles.adherenceTrend}>{data.adherence.trends.nutrition}</Text>
              </View>
              <View style={styles.adherenceItem}>
                <Text style={styles.adherenceLabel}>Supplement</Text>
                <Text style={styles.adherenceValue}>{data.adherence.domains.supplement}%</Text>
                <Text style={styles.adherenceTrend}>{data.adherence.trends.supplement}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>No adherence data available</Text>
        )}
      </View>

      {/* 8. Bloodwork */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bloodwork</Text>
        <Text style={styles.sectionSubtitle}>Latest lab results</Text>
        
        {data?.bloodwork ? (
          <View style={styles.card}>
            <Text style={styles.bloodworkDate}>
              Uploaded: {new Date(data.bloodwork.uploadDate).toLocaleDateString()}
            </Text>
            {data.bloodwork.keyMarkers.map((marker, idx) => (
              <View key={idx} style={styles.markerRow}>
                <Text style={styles.markerName}>{marker.name}</Text>
                <Text style={styles.markerValue}>
                  {marker.value} {marker.unit}
                </Text>
                <View style={[styles.markerStatus, getMarkerStatusColor(marker.status)]}>
                  <Text style={styles.markerStatusText}>{marker.status}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noData}>No bloodwork uploaded yet</Text>
        )}
      </View>

      {/* 9. Cardiovascular */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cardiovascular</Text>
        <Text style={styles.sectionSubtitle}>Heart health and risk factors</Text>
        
        {data?.controlTower ? (
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>CV Score</Text>
                <Text style={styles.metricValue}>
                  {data.controlTower.components.cv.score ?? '—'}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Status</Text>
                <Text style={[styles.metricValue, styles.statusValue]}>
                  {data.controlTower.components.cv.status}
                </Text>
              </View>
            </View>
            <View style={styles.cvMetrics}>
              <Text style={styles.placeholderText}>
                Detailed metrics (LDL, BP, Resting HR) will be available when bloodwork and device data are connected.
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>No cardiovascular data available</Text>
        )}
      </View>

      {/* 10. Sexual Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sexual Health</Text>
        <Text style={styles.sectionSubtitle}>Hormones and function</Text>
        
        {data?.controlTower ? (
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>SH Score</Text>
                <Text style={styles.metricValue}>
                  {data.controlTower.components.sh.score ?? '—'}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Status</Text>
                <Text style={[styles.metricValue, styles.statusValue]}>
                  {data.controlTower.components.sh.status}
                </Text>
              </View>
            </View>
            <View style={styles.shMetrics}>
              <Text style={styles.placeholderText}>
                Detailed metrics (Testosterone trends, Libido, Function) will be available when bloodwork and interview data are connected.
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>No sexual health data available</Text>
        )}
      </View>

      {/* 11. Nutrition */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition</Text>
        <Text style={styles.sectionSubtitle}>Macros and meal tracking</Text>
        
        {data?.controlTower ? (
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Metabolic Score</Text>
                <Text style={styles.metricValue}>
                  {data.controlTower.components.met.score ?? '—'}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Status</Text>
                <Text style={[styles.metricValue, styles.statusValue]}>
                  {data.controlTower.components.met.status}
                </Text>
              </View>
            </View>
            <View style={styles.nutritionMetrics}>
              <Text style={styles.placeholderText}>
                Detailed nutrition tracking (Calories, Protein, Macros) will be available when meal photo analysis is implemented.
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>No nutrition data available</Text>
        )}
      </View>

      {/* 12. Body Composition */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Body Composition</Text>
        <Text style={styles.sectionSubtitle}>Weight and body metrics</Text>
        
        {data?.controlTower ? (
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Performance Score</Text>
                <Text style={styles.metricValue}>
                  {data.controlTower.components.perf.score ?? '—'}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Status</Text>
                <Text style={[styles.metricValue, styles.statusValue]}>
                  {data.controlTower.components.perf.status}
                </Text>
              </View>
            </View>
            <View style={styles.bodyCompMetrics}>
              <Text style={styles.placeholderText}>
                Detailed body composition (3D Scan, Weight, Body Fat %, Lean Mass) will be available when scan data is uploaded.
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>No body composition data available</Text>
        )}
      </View>

      {/* 13. Trends & Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trends & Insights</Text>
        <Text style={styles.sectionSubtitle}>Cross-correlations and patterns</Text>
        
        <View style={styles.card}>
          <Text style={styles.trendsTitle}>Recent Patterns</Text>
          {data?.recovery && data?.stress && (
            <View style={styles.trendInsight}>
              <Text style={styles.trendLabel}>Recovery-Stress Correlation</Text>
              <Text style={styles.trendText}>
                Recovery at {data.recovery.recoveryScore}% with {data.stress.stressLevel} stress. 
                {data.stress.stressLevel === 'high' && data.recovery.recoveryScore < 70 
                  ? ' Consider reducing training load.' 
                  : ' Training load appears manageable.'}
              </Text>
            </View>
          )}
          {data?.adherence && (
            <View style={styles.trendInsight}>
              <Text style={styles.trendLabel}>Adherence Trend</Text>
              <Text style={styles.trendText}>
                Overall adherence at {data.adherence.overallAdherence}% and {data.adherence.trends.workout}.
                {data.adherence.overallAdherence < 70 
                  ? ' Focus on consistency to improve outcomes.' 
                  : ' Strong adherence supporting progress.'}
              </Text>
            </View>
          )}
          <Text style={styles.placeholderText}>
            Advanced cross-correlation analysis and predictive insights will be available in future updates.
          </Text>
        </View>
      </View>

      {/* Today's Recommendations */}
      {data?.recommendations && data.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Recommendations</Text>
          <View style={styles.card}>
            {data.recommendations.map((rec, idx) => (
              <View key={idx} style={[styles.recommendationCard, getPriorityColor(rec.priority)]}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationSource}>{rec.source}</Text>
                  <Text style={styles.recommendationPriority}>{rec.priority}</Text>
                </View>
                <Text style={styles.recommendationText}>{rec.text}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// Helper Components
const ComponentScore = ({ label, data }: { label: string; data: { score: number | null; status: string } }) => (
  <View style={styles.componentScore}>
    <Text style={styles.componentLabel}>{label}</Text>
    <Text style={styles.componentValue}>{data.score ?? '—'}</Text>
    <Text style={styles.componentStatus}>{data.status}</Text>
  </View>
);

const PlaceholderSection = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    <View style={[styles.card, styles.placeholderCard]}>
      <Text style={styles.placeholderText}>This section will be available in a future update</Text>
    </View>
  </View>
);

// Helper Functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Optimal': return { backgroundColor: '#DCFCE7' };
    case 'Stable': return { backgroundColor: '#FEF9C3' };
    case 'At Risk': return { backgroundColor: '#FEE2E2' };
    default: return { backgroundColor: '#E2E8F0' };
  }
};

const getStressColor = (level: string) => {
  switch (level) {
    case 'low': return { color: '#22C55E' };
    case 'moderate': return { color: '#EAB308' };
    case 'high': return { color: '#EF4444' };
    default: return { color: '#64748B' };
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low': return { color: '#22C55E' };
    case 'moderate': return { color: '#EAB308' };
    case 'high': return { color: '#EF4444' };
    default: return { color: '#64748B' };
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return { borderLeftColor: '#EF4444', borderLeftWidth: 4 };
    case 'medium': return { borderLeftColor: '#EAB308', borderLeftWidth: 4 };
    case 'low': return { borderLeftColor: '#22C55E', borderLeftWidth: 4 };
    default: return { borderLeftColor: '#E2E8F0', borderLeftWidth: 4 };
  }
};

const getMarkerStatusColor = (status: string) => {
  switch (status) {
    case 'normal': return { backgroundColor: '#DCFCE7' };
    case 'borderline': return { backgroundColor: '#FEF9C3' };
    case 'abnormal': return { backgroundColor: '#FEE2E2' };
    default: return { backgroundColor: '#E2E8F0' };
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return { borderLeftColor: '#EF4444', borderLeftWidth: 4 };
    case 'medium': return { borderLeftColor: '#EAB308', borderLeftWidth: 4 };
    case 'low': return { borderLeftColor: '#22C55E', borderLeftWidth: 4 };
    default: return { borderLeftColor: '#E2E8F0', borderLeftWidth: 4 };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noData: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  componentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  componentScore: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  componentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  componentValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  componentStatus: {
    fontSize: 10,
    color: '#64748B',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statusValue: {
    textTransform: 'capitalize',
  },
  recommendations: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 20,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  exerciseName: {
    fontSize: 14,
    color: '#111827',
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#64748B',
  },
  adjustments: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  adjustmentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  adjustmentItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
  },
  adjustmentExercise: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  adjustmentMod: {
    fontSize: 14,
    color: '#92400E',
    marginTop: 4,
  },
  adjustmentRationale: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  supplementRec: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  supplementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  supplementAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  supplementSeverity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  supplementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  supplementDosage: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  supplementRationale: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  modifications: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modificationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modificationText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 20,
  },
  adherenceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  adherenceItem: {
    flex: 1,
    alignItems: 'center',
  },
  adherenceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  adherenceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  adherenceTrend: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  bloodworkDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  markerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  markerName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  markerValue: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 12,
  },
  markerStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  markerStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  placeholderCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  placeholderText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  cvMetrics: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  shMetrics: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  nutritionMetrics: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bodyCompMetrics: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  trendsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  trendInsight: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  trendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  trendText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  recommendationCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recommendationSource: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  recommendationPriority: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
});

export default DashboardV13Screen;
