/**
 * Phase 24 UI: Correlation Insights Screen
 * 
 * Purpose: Display correlation analysis, trends, and alerts
 * Features: Severity grouping, trend visualization, recurring patterns, alerts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InsightsStackParamList } from '../types/navigation';

// ============================================================================
// TYPES
// ============================================================================

interface Correlation {
  id: string;
  type: string;
  confidence: number;
  severity: 'info' | 'warning' | 'critical';
  pattern: string;
  insight: string;
  recommendation?: string;
  sources: string[];
}

interface CorrelationAnalysis {
  userId: string;
  date: string;
  correlations: Correlation[];
  summary: {
    totalCorrelations: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
  };
}

interface RecurringPattern {
  correlationType: string;
  correlationId: string;
  occurrenceCount: number;
  avgConfidence: number;
  mostRecentDate: string;
  severityTrend: 'info' | 'warning' | 'critical';
}

interface Alert {
  id: string;
  alertType: string;
  message: string;
  actionRequired?: string;
  createdAt: string;
  correlationType?: string;
  correlationPattern?: string;
}

type NavigationProp = NativeStackNavigationProp<InsightsStackParamList, 'CorrelationInsights'>;

// ============================================================================
// COMPONENT
// ============================================================================

const CorrelationInsightsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState<CorrelationAnalysis | null>(null);
  const [recurring, setRecurring] = useState<RecurringPattern[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);

  const userId = 'current-user'; // TODO: Get from auth context

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      
      // Fetch correlation analysis
      const analysisResponse = await fetch(
        `http://localhost:3000/api/correlations/${userId}/analyze`
      );
      const analysisData = await analysisResponse.json();
      
      if (analysisData.success) {
        setAnalysis(analysisData.analysis);
      }

      // Fetch recurring patterns
      const recurringResponse = await fetch(
        `http://localhost:3000/api/correlations/${userId}/recurring?days=30`
      );
      const recurringData = await recurringResponse.json();
      
      if (recurringData.success) {
        setRecurring(recurringData.recurring);
      }

      // Fetch active alerts
      const alertsResponse = await fetch(
        `http://localhost:3000/api/correlations/${userId}/alerts?activeOnly=true`
      );
      const alertsData = await alertsResponse.json();
      
      if (alertsData.success) {
        setAlerts(alertsData.alerts);
      }
    } catch (err) {
      setError('Failed to load correlation data');
      console.error('Error loading correlations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCorrelationPress = (correlation: Correlation) => {
    navigation.navigate('CorrelationDetail', { correlation });
  };

  const handleAlertPress = (alert: Alert) => {
    // Navigate to correlation detail or show alert details
    console.log('Alert pressed:', alert);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  const formatCorrelationType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading correlation insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const criticalCorrelations = analysis?.correlations.filter(c => c.severity === 'critical') || [];
  const warningCorrelations = analysis?.correlations.filter(c => c.severity === 'warning') || [];
  const infoCorrelations = analysis?.correlations.filter(c => c.severity === 'info') || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Correlation Insights</Text>
        <Text style={styles.subtitle}>
          {analysis?.date || 'Today'} • {analysis?.summary.totalCorrelations || 0} patterns detected
        </Text>
      </View>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Active Alerts ({alerts.length})</Text>
          {alerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.alertCard}
              onPress={() => handleAlertPress(alert)}
            >
              <Text style={styles.alertMessage}>{alert.message}</Text>
              {alert.actionRequired && (
                <Text style={styles.alertAction}>→ {alert.actionRequired}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Critical Correlations */}
      {criticalCorrelations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {getSeverityIcon('critical')} Critical ({criticalCorrelations.length})
          </Text>
          {criticalCorrelations.map((correlation) => (
            <TouchableOpacity
              key={correlation.id}
              style={[styles.correlationCard, { borderLeftColor: getSeverityColor('critical') }]}
              onPress={() => handleCorrelationPress(correlation)}
            >
              <Text style={styles.correlationType}>{formatCorrelationType(correlation.type)}</Text>
              <Text style={styles.correlationPattern}>{correlation.pattern}</Text>
              <Text style={styles.correlationInsight}>{correlation.insight}</Text>
              <View style={styles.correlationFooter}>
                <Text style={styles.confidence}>Confidence: {(correlation.confidence * 100).toFixed(0)}%</Text>
                <Text style={styles.viewDetails}>View Details →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Warning Correlations */}
      {warningCorrelations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {getSeverityIcon('warning')} Warnings ({warningCorrelations.length})
          </Text>
          {warningCorrelations.map((correlation) => (
            <TouchableOpacity
              key={correlation.id}
              style={[styles.correlationCard, { borderLeftColor: getSeverityColor('warning') }]}
              onPress={() => handleCorrelationPress(correlation)}
            >
              <Text style={styles.correlationType}>{formatCorrelationType(correlation.type)}</Text>
              <Text style={styles.correlationPattern}>{correlation.pattern}</Text>
              <View style={styles.correlationFooter}>
                <Text style={styles.confidence}>Confidence: {(correlation.confidence * 100).toFixed(0)}%</Text>
                <Text style={styles.viewDetails}>View Details →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Info Correlations */}
      {infoCorrelations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {getSeverityIcon('info')} Info ({infoCorrelations.length})
          </Text>
          {infoCorrelations.map((correlation) => (
            <TouchableOpacity
              key={correlation.id}
              style={[styles.correlationCard, { borderLeftColor: getSeverityColor('info') }]}
              onPress={() => handleCorrelationPress(correlation)}
            >
              <Text style={styles.correlationType}>{formatCorrelationType(correlation.type)}</Text>
              <Text style={styles.correlationPattern}>{correlation.pattern}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recurring Patterns */}
      {recurring.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Recurring Patterns ({recurring.length})</Text>
          {recurring.map((pattern, index) => (
            <View key={index} style={styles.recurringCard}>
              <Text style={styles.recurringType}>{formatCorrelationType(pattern.correlationType)}</Text>
              <Text style={styles.recurringCount}>{pattern.occurrenceCount}x in last 30 days</Text>
              <View style={styles.recurringFooter}>
                <Text style={styles.recurringConfidence}>
                  Avg: {(pattern.avgConfidence * 100).toFixed(0)}%
                </Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(pattern.severityTrend) }]}>
                  <Text style={styles.severityBadgeText}>{pattern.severityTrend}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* No Correlations */}
      {analysis && analysis.summary.totalCorrelations === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>✅ No significant correlations detected</Text>
          <Text style={styles.emptyStateSubtext}>Your health data looks balanced</Text>
        </View>
      )}
    </ScrollView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  alertAction: {
    fontSize: 14,
    color: '#78350F',
    fontStyle: 'italic',
  },
  correlationCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  correlationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  correlationPattern: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  correlationInsight: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  correlationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidence: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  viewDetails: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  recurringCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recurringType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  recurringCount: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  recurringFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringConfidence: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CorrelationInsightsScreen;
