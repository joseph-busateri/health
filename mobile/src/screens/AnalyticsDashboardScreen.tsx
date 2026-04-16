import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

interface Correlation {
  metricA: string;
  metricB: string;
  coefficient: number;
  strength: string;
  direction: string;
  insight: string;
  recommendation: string;
}

interface TrendPrediction {
  metricName: string;
  currentValue: number;
  currentTrend: string;
  trendPercentage: number;
  predicted30Day: number;
  confidence: number;
  summary: string;
}

interface Insight {
  id: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  summary: string;
  primaryRecommendation: string;
  potentialImpact: string;
}

interface GoalProgress {
  goalType: string;
  targetMetric: string;
  progressPercentage: number;
  progressStatus: string;
  daysRemaining: number;
  likelihoodOfSuccess: number;
  recommendations: string[];
}

export default function AnalyticsDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'insights' | 'correlations' | 'trends' | 'goals'>('insights');
  
  // Mock data - replace with API calls
  const [insights, setInsights] = useState<Insight[]>([
    {
      id: '1',
      type: 'correlation',
      category: 'recovery',
      priority: 'high',
      title: 'Sleep Quality Impacts Recovery',
      summary: 'There is a strong positive correlation (78%) between sleep quality and recovery score.',
      primaryRecommendation: 'Prioritize 7-8 hours of quality sleep to maximize recovery.',
      potentialImpact: 'high',
    },
    {
      id: '2',
      type: 'warning',
      category: 'performance',
      priority: 'high',
      title: 'High Training Volume Affecting Recovery',
      summary: 'Your workout volume is negatively impacting recovery. Consider reducing volume or adding rest days.',
      primaryRecommendation: 'Reduce training volume by 20% for the next week and monitor recovery scores.',
      potentialImpact: 'high',
    },
    {
      id: '3',
      type: 'trend',
      category: 'overall',
      priority: 'medium',
      title: 'Body Weight Decreasing',
      summary: 'Body weight is decreasing (-2.3% over 30 days). On track with weight loss goal.',
      primaryRecommendation: 'Continue current nutrition and training approach.',
      potentialImpact: 'medium',
    },
  ]);

  const [correlations, setCorrelations] = useState<Correlation[]>([
    {
      metricA: 'Sleep Quality',
      metricB: 'Recovery Score',
      coefficient: 0.78,
      strength: 'strong',
      direction: 'positive',
      insight: 'Better sleep leads to better recovery',
      recommendation: 'Prioritize sleep for optimal recovery',
    },
    {
      metricA: 'Workout Volume',
      metricB: 'Recovery Score',
      coefficient: -0.62,
      strength: 'moderate',
      direction: 'negative',
      insight: 'Higher volume reduces recovery',
      recommendation: 'Balance training volume with recovery capacity',
    },
  ]);

  const [trends, setTrends] = useState<TrendPrediction[]>([
    {
      metricName: 'Body Weight',
      currentValue: 185.2,
      currentTrend: 'decreasing',
      trendPercentage: -2.3,
      predicted30Day: 182.5,
      confidence: 87,
      summary: 'Steady weight loss trend',
    },
    {
      metricName: 'Bench Press 1RM',
      currentValue: 225,
      currentTrend: 'increasing',
      trendPercentage: 5.2,
      predicted30Day: 235,
      confidence: 92,
      summary: 'Strength gains on track',
    },
  ]);

  const [goals, setGoals] = useState<GoalProgress[]>([
    {
      goalType: 'Weight Loss',
      targetMetric: 'Body Weight',
      progressPercentage: 65,
      progressStatus: 'on_track',
      daysRemaining: 45,
      likelihoodOfSuccess: 85,
      recommendations: ['On track. Keep up the good work', 'Maintain current nutrition plan'],
    },
    {
      goalType: 'Strength Gain',
      targetMetric: 'Bench Press 1RM',
      progressPercentage: 42,
      progressStatus: 'ahead',
      daysRemaining: 60,
      likelihoodOfSuccess: 95,
      recommendations: ['Great progress! Maintain current approach', 'Consider progressive overload'],
    },
  ]);

  const [healthScore, setHealthScore] = useState({
    overall: 78,
    cardiovascular: 82,
    recovery: 75,
    sleep: 80,
    performance: 76,
    nutrition: 72,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // TODO: Implement API calls when server is running
      // const response = await fetch('http://localhost:3000/analytics/insights');
      // const data = await response.json();
      // setInsights(data.insights);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'ahead': return '#10b981';
      case 'on_track': return '#3b82f6';
      case 'behind': return '#f59e0b';
      case 'stalled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      case 'stable': return 'remove';
      case 'volatile': return 'pulse';
      default: return 'remove';
    }
  };

  const renderInsights = () => (
    <View style={styles.section}>
      {insights.map((insight) => (
        <View key={insight.id} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) }]}>
              <Text style={styles.priorityText}>{insight.priority.toUpperCase()}</Text>
            </View>
            <View style={styles.impactBadge}>
              <Ionicons name="flash" size={12} color="#f59e0b" />
              <Text style={styles.impactText}>{insight.potentialImpact} impact</Text>
            </View>
          </View>
          
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightSummary}>{insight.summary}</Text>
          
          <View style={styles.recommendationBox}>
            <Ionicons name="bulb" size={16} color="#3b82f6" />
            <Text style={styles.recommendationText}>{insight.primaryRecommendation}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCorrelations = () => (
    <View style={styles.section}>
      {correlations.map((corr, index) => (
        <View key={index} style={styles.correlationCard}>
          <View style={styles.correlationHeader}>
            <Text style={styles.correlationTitle}>
              {corr.metricA} ↔ {corr.metricB}
            </Text>
            <View style={[
              styles.strengthBadge,
              { backgroundColor: corr.strength === 'strong' ? '#10b981' : '#3b82f6' }
            ]}>
              <Text style={styles.strengthText}>{corr.strength}</Text>
            </View>
          </View>
          
          <View style={styles.correlationBar}>
            <View style={styles.correlationBarBackground}>
              <View 
                style={[
                  styles.correlationBarFill,
                  { 
                    width: `${Math.abs(corr.coefficient) * 100}%`,
                    backgroundColor: corr.direction === 'positive' ? '#10b981' : '#ef4444'
                  }
                ]} 
              />
            </View>
            <Text style={styles.correlationValue}>
              {(corr.coefficient * 100).toFixed(0)}%
            </Text>
          </View>
          
          <Text style={styles.correlationInsight}>{corr.insight}</Text>
          <Text style={styles.correlationRecommendation}>💡 {corr.recommendation}</Text>
        </View>
      ))}
    </View>
  );

  const renderTrends = () => (
    <View style={styles.section}>
      {trends.map((trend, index) => (
        <View key={index} style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendMetric}>{trend.metricName}</Text>
            <Ionicons 
              name={getTrendIcon(trend.currentTrend) as any} 
              size={24} 
              color={trend.currentTrend === 'increasing' ? '#10b981' : '#ef4444'} 
            />
          </View>
          
          <View style={styles.trendValues}>
            <View style={styles.trendValue}>
              <Text style={styles.trendLabel}>Current</Text>
              <Text style={styles.trendNumber}>{trend.currentValue}</Text>
            </View>
            <View style={styles.trendArrow}>
              <Ionicons name="arrow-forward" size={20} color="#6b7280" />
            </View>
            <View style={styles.trendValue}>
              <Text style={styles.trendLabel}>30-Day Prediction</Text>
              <Text style={styles.trendNumber}>{trend.predicted30Day}</Text>
            </View>
          </View>
          
          <View style={styles.trendStats}>
            <View style={styles.trendStat}>
              <Text style={styles.trendStatLabel}>Change</Text>
              <Text style={[
                styles.trendStatValue,
                { color: trend.trendPercentage > 0 ? '#10b981' : '#ef4444' }
              ]}>
                {trend.trendPercentage > 0 ? '+' : ''}{trend.trendPercentage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.trendStat}>
              <Text style={styles.trendStatLabel}>Confidence</Text>
              <Text style={styles.trendStatValue}>{trend.confidence}%</Text>
            </View>
          </View>
          
          <Text style={styles.trendSummary}>{trend.summary}</Text>
        </View>
      ))}
    </View>
  );

  const renderGoals = () => (
    <View style={styles.section}>
      {goals.map((goal, index) => (
        <View key={index} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalType}>{goal.goalType}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getProgressColor(goal.progressStatus) }
            ]}>
              <Text style={styles.statusText}>{goal.progressStatus.replace('_', ' ')}</Text>
            </View>
          </View>
          
          <Text style={styles.goalMetric}>{goal.targetMetric}</Text>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${Math.min(100, goal.progressPercentage)}%`,
                    backgroundColor: getProgressColor(goal.progressStatus)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{goal.progressPercentage.toFixed(0)}%</Text>
          </View>
          
          <View style={styles.goalStats}>
            <View style={styles.goalStat}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.goalStatText}>{goal.daysRemaining} days left</Text>
            </View>
            <View style={styles.goalStat}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.goalStatText}>{goal.likelihoodOfSuccess}% likely</Text>
            </View>
          </View>
          
          <View style={styles.recommendationsList}>
            {goal.recommendations.map((rec, i) => (
              <Text key={i} style={styles.goalRecommendation}>• {rec}</Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Analyzing your health data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>AI-powered insights and predictions</Text>
      </View>

      {/* Health Domains */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.domainsScroll}
        contentContainerStyle={styles.domainsContent}
      >
        <TouchableOpacity 
          style={styles.domainCard}
          onPress={() => navigation.navigate('SexualHealthDashboard')}
        >
          <Text style={styles.domainIcon}>🌡️</Text>
          <Text style={styles.domainName}>Sexual Health</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.domainCard, styles.domainCardDisabled]}>
          <Text style={styles.domainIcon}>❤️</Text>
          <Text style={styles.domainName}>Cardiovascular</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.domainCard, styles.domainCardDisabled]}>
          <Text style={styles.domainIcon}>💪</Text>
          <Text style={styles.domainName}>Recovery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.domainCard, styles.domainCardDisabled]}>
          <Text style={styles.domainIcon}>🍽️</Text>
          <Text style={styles.domainName}>Nutrition</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Health Score Summary */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Overall Health Score</Text>
          <TouchableOpacity>
            <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{healthScore.overall}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
        
        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Cardio</Text>
            <Text style={styles.scoreItemValue}>{healthScore.cardiovascular}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Recovery</Text>
            <Text style={styles.scoreItemValue}>{healthScore.recovery}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Sleep</Text>
            <Text style={styles.scoreItemValue}>{healthScore.sleep}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Performance</Text>
            <Text style={styles.scoreItemValue}>{healthScore.performance}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'insights' && styles.tabActive]}
          onPress={() => setSelectedTab('insights')}
        >
          <Ionicons 
            name="bulb" 
            size={20} 
            color={selectedTab === 'insights' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'insights' && styles.tabTextActive]}>
            Insights
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'correlations' && styles.tabActive]}
          onPress={() => setSelectedTab('correlations')}
        >
          <Ionicons 
            name="git-compare" 
            size={20} 
            color={selectedTab === 'correlations' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'correlations' && styles.tabTextActive]}>
            Correlations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'trends' && styles.tabActive]}
          onPress={() => setSelectedTab('trends')}
        >
          <Ionicons 
            name="trending-up" 
            size={20} 
            color={selectedTab === 'trends' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'trends' && styles.tabTextActive]}>
            Trends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'goals' && styles.tabActive]}
          onPress={() => setSelectedTab('goals')}
        >
          <Ionicons 
            name="flag" 
            size={20} 
            color={selectedTab === 'goals' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, selectedTab === 'goals' && styles.tabTextActive]}>
            Goals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'insights' && renderInsights()}
        {selectedTab === 'correlations' && renderCorrelations()}
        {selectedTab === 'trends' && renderTrends()}
        {selectedTab === 'goals' && renderGoals()}
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
  scoreCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scoreCircle: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreItemLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreItemValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
    fontSize: 12,
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
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#92400e',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  insightSummary: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  correlationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  correlationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  correlationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  correlationBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  correlationBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  correlationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
    textAlign: 'right',
  },
  correlationInsight: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  correlationRecommendation: {
    fontSize: 13,
    color: '#3b82f6',
    fontStyle: 'italic',
  },
  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendMetric: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  trendValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trendValue: {
    flex: 1,
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  trendNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  trendArrow: {
    paddingHorizontal: 16,
  },
  trendStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  trendStat: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    alignItems: 'center',
  },
  trendStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  trendStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  trendSummary: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  goalMetric: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
    textAlign: 'right',
  },
  goalStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  goalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  recommendationsList: {
    gap: 6,
  },
  goalRecommendation: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  domainsScroll: {
    marginVertical: 16,
  },
  domainsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  domainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  domainCardDisabled: {
    opacity: 0.5,
  },
  domainIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  domainName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
});
