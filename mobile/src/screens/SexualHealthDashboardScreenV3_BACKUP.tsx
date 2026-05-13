import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../types/navigation';
import { InputDetailsPanel } from '../components/InputDetailsPanel';
import type { InputMetadata } from '../types/inputMetadata';
import { getMetabolicTodayV2 } from '../services/metabolicEngineService';

const { width } = Dimensions.get('window');

interface MetabolicMetric {
  name: string;
  value: number;
  unit: string;
  status: 'optimal' | 'good' | 'fair' | 'poor';
  trend: 'up' | 'down' | 'stable';
  referenceRange: string;
}

interface ScoreComponent {
  score: number;
  max: number;
  percentage: number;
  hasData: boolean;
}

interface MetabolicScoreBreakdown {
  glucoseControl: ScoreComponent;
  lipidProfile: ScoreComponent;
  bodyComposition: ScoreComponent;
  vitals: ScoreComponent;
  total: number;
  maxTotal: number;
  percentage: number;
}

interface MetabolicData {
  overallScore: number;
  metabolicScore?: number;
  scoreBreakdown?: MetabolicScoreBreakdown;
  metabolicStatus: string;
  lastUpdated: string;
  metrics: {
    glucose: MetabolicMetric;
    insulin: MetabolicMetric;
    hba1c: MetabolicMetric;
    triglycerides: MetabolicMetric;
    hdl: MetabolicMetric;
    ldl: MetabolicMetric;
    totalCholesterol: MetabolicMetric;
    waistCircumference: MetabolicMetric;
  };
  riskFactors: string[];
  recommendations: string[];
  detailedInputs?: InputMetadata[];
}

export default function MetabolicHealthDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metabolicData, setMetabolicData] = useState<MetabolicData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetabolicData = useCallback(async (isRefresh = false) => {
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
      const data = await getMetabolicTodayV2(userId);
      console.log('Metabolic API Response:', JSON.stringify(data, null, 2));
      console.log('Metabolic inputs:', data.inputs);
      
      // Transform API response to UI format
      const inputs = data.inputs || {};
      const glucoseMetrics = data.evidence?.signals?.find((s: any) => s.name === 'Fasting Glucose');
      const a1cMetrics = data.evidence?.signals?.find((s: any) => s.name === 'A1C');
      const triglyceridesMetrics = data.evidence?.signals?.find((s: any) => s.name === 'Triglycerides');
      const hdlMetrics = data.evidence?.signals?.find((s: any) => s.name === 'HDL');

      const transformedData: MetabolicData = {
        overallScore: data.metabolicStatus === 'optimal' ? 90 : 
                     data.metabolicStatus === 'moderate' ? 70 : 
                     data.metabolicStatus === 'elevated_risk' ? 50 : 30,
        metabolicScore: data.metabolicScore,
        scoreBreakdown: data.scoreBreakdown,
        metabolicStatus: data.metabolicStatus,
        lastUpdated: data.createdAt || new Date().toISOString(),
        metrics: {
          glucose: {
            name: 'Fasting Glucose',
            value: inputs.fastingGlucose || glucoseMetrics?.value || null,
            unit: 'mg/dL',
            status: inputs.fastingGlucose ? (inputs.fastingGlucose < 100 ? 'optimal' : inputs.fastingGlucose < 126 ? 'good' : 'poor') : 'good',
            trend: 'stable',
            referenceRange: '70-100',
          },
          insulin: {
            name: 'Fasting Insulin',
            value: inputs.fastingInsulin || null,
            unit: 'μIU/mL',
            status: inputs.fastingInsulin ? (inputs.fastingInsulin < 10 ? 'good' : 'fair') : 'good',
            trend: 'stable',
            referenceRange: '2-20',
          },
          hba1c: {
            name: 'HbA1c',
            value: inputs.a1c || a1cMetrics?.value || null,
            unit: '%',
            status: inputs.a1c ? (inputs.a1c < 5.7 ? 'optimal' : inputs.a1c < 6.5 ? 'good' : 'poor') : 'good',
            trend: 'stable',
            referenceRange: '<5.7',
          },
          triglycerides: {
            name: 'Triglycerides',
            value: inputs.triglycerides || triglyceridesMetrics?.value || null,
            unit: 'mg/dL',
            status: inputs.triglycerides ? (inputs.triglycerides < 150 ? 'good' : 'fair') : 'good',
            trend: 'stable',
            referenceRange: '<150',
          },
          hdl: {
            name: 'HDL Cholesterol',
            value: inputs.hdl || hdlMetrics?.value || null,
            unit: 'mg/dL',
            status: inputs.hdl ? (inputs.hdl >= 60 ? 'optimal' : inputs.hdl >= 40 ? 'good' : 'poor') : 'good',
            trend: 'stable',
            referenceRange: '>40',
          },
          ldl: {
            name: 'LDL Cholesterol',
            value: inputs.ldl || null,
            unit: 'mg/dL',
            status: inputs.ldl ? (inputs.ldl < 100 ? 'optimal' : inputs.ldl < 130 ? 'good' : 'fair') : 'good',
            trend: 'stable',
            referenceRange: '<100',
          },
          totalCholesterol: {
            name: 'Total Cholesterol',
            value: inputs.totalCholesterol || null,
            unit: 'mg/dL',
            status: inputs.totalCholesterol ? (inputs.totalCholesterol < 200 ? 'optimal' : inputs.totalCholesterol < 240 ? 'good' : 'fair') : 'good',
            trend: 'stable',
            referenceRange: '<200',
          },
          waistCircumference: {
            name: 'Waist Circumference',
            value: inputs.waistCircumference || null,
            unit: 'inches',
            status: inputs.waistCircumference ? (inputs.waistCircumference < 40 ? 'optimal' : inputs.waistCircumference < 45 ? 'good' : 'fair') : 'good',
            trend: 'stable',
            referenceRange: '<40',
          },
        },
        riskFactors: data.evidence?.signals
          ?.filter((s: any) => s.interpretation?.includes('High') || s.interpretation?.includes('Elevated'))
          ?.map((s: any) => s.interpretation) || [],
        recommendations: data.recommendation?.actions || [
          data.recommendation?.summary || 'Continue monitoring metabolic health',
        ],
        detailedInputs: data.detailedInputs,
      };

      setMetabolicData(transformedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load metabolic data';
      setError(errorMessage);
      console.error('Failed to fetch metabolic data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMetabolicData(false);
  }, [fetchMetabolicData]);

  const onRefresh = () => {
    fetchMetabolicData(true);
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Set your user ID in Settings to view metabolic health</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading metabolic data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchMetabolicData(false)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!metabolicData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="fitness-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>No metabolic data available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Metabolic Health</Text>
        <Text style={styles.subtitle}>Track your metabolic markers</Text>
      </View>

      {/* Main Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreMainSection}>
          <View style={styles.scoreIconContainer}>
            <MaterialCommunityIcons name="heart-pulse" size={48} color="#3B82F6" />
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.scoreLabel}>Metabolic Health Score</Text>
            {metabolicData.metabolicScore !== undefined && (
              <View style={styles.scoreValueContainer}>
                <Text style={styles.scoreValue}>{metabolicData.metabolicScore}</Text>
                <Text style={styles.scoreMaxValue}>/100</Text>
              </View>
            )}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${metabolicData.metabolicScore || metabolicData.overallScore}%` }]} />
              </View>
            </View>
            <Text style={styles.lastUpdated}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#94A3B8" />
              {' '}Updated {new Date(metabolicData.lastUpdated).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.statusBadgeContainer}>
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons 
              name={metabolicData.metabolicStatus === 'optimal' ? 'check-circle' : 
                    metabolicData.metabolicStatus === 'moderate' ? 'information' :
                    metabolicData.metabolicStatus === 'elevated_risk' ? 'alert' : 'alert-circle'} 
              size={16} 
              color="#0F172A" 
            />
            <Text style={styles.statusText}>
              {metabolicData.metabolicStatus === 'optimal' ? 'Optimal' :
               metabolicData.metabolicStatus === 'moderate' ? 'Moderate' :
               metabolicData.metabolicStatus === 'elevated_risk' ? 'Elevated Risk' : 'High Risk'}
            </Text>
          </View>
        </View>
      </View>

      {/* Score Breakdown */}
      {metabolicData.scoreBreakdown && metabolicData.detailedInputs && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          
          {/* Glucose Control Section */}
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleContainer}>
                <MaterialCommunityIcons name="water" size={20} color="#EF4444" />
                <Text style={styles.categoryTitle}>Glucose Control</Text>
              </View>
              <View style={styles.categoryScoreContainer}>
                <View style={[styles.categoryProgressBar, { width: 60 }]}>
                  <View style={[styles.categoryProgressFill, { width: `${metabolicData.scoreBreakdown.glucoseControl.percentage}%`, backgroundColor: metabolicData.scoreBreakdown.glucoseControl.percentage >= 70 ? '#22C55E' : metabolicData.scoreBreakdown.glucoseControl.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                </View>
                <Text style={styles.categoryScore}>
                  {metabolicData.scoreBreakdown.glucoseControl.score}/{metabolicData.scoreBreakdown.glucoseControl.max}
                </Text>
                <Text style={[styles.categoryPercentage, { color: metabolicData.scoreBreakdown.glucoseControl.percentage >= 70 ? '#22C55E' : metabolicData.scoreBreakdown.glucoseControl.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                  {metabolicData.scoreBreakdown.glucoseControl.percentage}%
                </Text>
              </View>
            </View>
            <InputDetailsPanel 
              inputs={metabolicData.detailedInputs.filter(i => 
                ['Fasting Glucose', 'A1C', 'Fasting Insulin', 'Insulin Resistance'].includes(i.name)
              )}
              title=""
            />
          </View>

          {/* Lipid Profile Section */}
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleContainer}>
                <MaterialCommunityIcons name="water-outline" size={20} color="#3B82F6" />
                <Text style={styles.categoryTitle}>Lipid Profile</Text>
              </View>
              <View style={styles.categoryScoreContainer}>
                <View style={[styles.categoryProgressBar, { width: 60 }]}>
                  <View style={[styles.categoryProgressFill, { width: `${metabolicData.scoreBreakdown.lipidProfile.percentage}%`, backgroundColor: metabolicData.scoreBreakdown.lipidProfile.percentage >= 70 ? '#22C55E' : metabolicData.scoreBreakdown.lipidProfile.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                </View>
                <Text style={styles.categoryScore}>
                  {metabolicData.scoreBreakdown.lipidProfile.score}/{metabolicData.scoreBreakdown.lipidProfile.max}
                </Text>
                <Text style={[styles.categoryPercentage, { color: metabolicData.scoreBreakdown.lipidProfile.percentage >= 70 ? '#22C55E' : metabolicData.scoreBreakdown.lipidProfile.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                  {metabolicData.scoreBreakdown.lipidProfile.percentage}%
                </Text>
              </View>
            </View>
            <InputDetailsPanel 
              inputs={metabolicData.detailedInputs.filter(i => 
                ['Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol', 'Total Cholesterol/HDL Ratio'].includes(i.name)
              )}
              title=""
            />
          </View>

          {/* Body Composition Section */}
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleContainer}>
                <MaterialCommunityIcons name="human" size={20} color="#8B5CF6" />
                <Text style={styles.categoryTitle}>Body Composition</Text>
              </View>
              <View style={styles.categoryScoreContainer}>
                <View style={[styles.categoryProgressBar, { width: 60 }]}>
                  <View style={[styles.categoryProgressFill, { width: `${metabolicData.scoreBreakdown.bodyComposition.percentage}%`, backgroundColor: metabolicData.scoreBreakdown.bodyComposition.percentage >= 70 ? '#22C55E' : metabolicData.scoreBreakdown.bodyComposition.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                </View>
                <Text style={styles.categoryScore}>
                  {metabolicData.scoreBreakdown.bodyComposition.score}/{metabolicData.scoreBreakdown.bodyComposition.max}
                </Text>
                <Text style={[styles.categoryPercentage, { color: metabolicData.scoreBreakdown.bodyComposition.percentage >= 70 ? '#22C55E' : metabolicData.scoreBreakdown.bodyComposition.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                  {metabolicData.scoreBreakdown.bodyComposition.percentage}%
                </Text>
              </View>
            </View>
            <InputDetailsPanel 
              inputs={metabolicData.detailedInputs.filter(i => 
                ['Body Fat Percentage', 'BMI', 'Waist Circumference', 'Weight Trend'].includes(i.name)
              )}
              title=""
            />
          </View>

          {/* Vitals Section */}
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleContainer}>
                <MaterialCommunityIcons name="heart-pulse" size={20} color="#EC4899" />
                <Text style={styles.categoryTitle}>Vitals</Text>
              </View>
              <View style={styles.categoryScoreContainer}>
                <View style={[styles.categoryProgressBar, { width: 60 }]}>
                  {metabolicData.scoreBreakdown.vitals.hasData ? (
                    <View style={[styles.categoryProgressFill, { width: `${metabolicData.scoreBreakdown.vitals.percentage}%`, backgroundColor: metabolicData.scoreBreakdown.vitals.percentage >= 70 ? '#22C55E' : metabolicData.scoreBreakdown.vitals.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                  ) : null}
                </View>
                <Text style={styles.categoryScore}>
                  {metabolicData.scoreBreakdown.vitals.hasData 
                    ? `${metabolicData.scoreBreakdown.vitals.score}/${metabolicData.scoreBreakdown.vitals.max}`
                    : 'N/A'}
                </Text>
                {metabolicData.scoreBreakdown.vitals.hasData && (
                  <Text style={[styles.categoryPercentage, { color: metabolicData.scoreBreakdown.vitals.percentage >= 70 ? '#22C55E' : metabolicData.scoreBreakdown.vitals.percentage >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    {metabolicData.scoreBreakdown.vitals.percentage}%
                  </Text>
                )}
              </View>
            </View>
            <InputDetailsPanel 
              inputs={metabolicData.detailedInputs.filter(i => 
                ['Resting Heart Rate'].includes(i.name)
              )}
              title=""
            />
          </View>

          {/* Total Score */}
          <View style={styles.card}>
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <Text style={styles.breakdownLabelTotal}>Total Score</Text>
              <Text style={styles.breakdownScoreTotal}>
                {metabolicData.scoreBreakdown.total}/{metabolicData.scoreBreakdown.maxTotal}
              </Text>
              <Text style={styles.breakdownPercentageTotal}>
                {metabolicData.scoreBreakdown.percentage}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Recommendations */}
      {metabolicData.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationsCard}>
            {metabolicData.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationBullet}>
                  <Text style={styles.recommendationBulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>View History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
          <Ionicons name="add-circle" size={20} color="#3b82f6" />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Add Data</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
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
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
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
    fontWeight: '500',
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
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
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  categoryScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownTotal: {
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 4,
  },
  breakdownLabelTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  breakdownScoreTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 12,
  },
  breakdownPercentageTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    minWidth: 50,
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: (width - 44) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metricName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginRight: 4,
  },
  metricUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referenceRange: {
    fontSize: 11,
    color: '#9ca3af',
  },
  trendContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  riskText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recommendationBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationBulletText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
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
  bottomSpacer: {
    height: 40,
  },
});
