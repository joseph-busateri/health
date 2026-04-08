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

const USER_ID = 'default-user';

interface AdjustmentRationale {
  reason: string;
  dataPoints: string[];
  confidence: number;
}

interface AutonomousAdjustment {
  id: string;
  timestamp: string;
  adjustmentType: string;
  category: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  rationale: AdjustmentRationale;
  beforeValue: string;
  afterValue: string;
  expectedImpact: string;
  userOverride?: boolean;
  userFeedback?: string;
  appliedAt?: string;
}

const AutonomousAdjustmentsScreen = () => {
  const [adjustments, setAdjustments] = useState<AutonomousAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'applied' | 'overridden'>('all');

  const fetchAdjustments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/autonomous-adjustments/${USER_ID}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': '12345678-1234-1234-1234-123456789abc',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch autonomous adjustments');
      }
      const data = await response.json();
      setAdjustments(data.adjustments || []);
    } catch (err) {
      setError('Failed to load autonomous adjustments. Please try again.');
      console.error('Autonomous adjustments error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  const onRefresh = useCallback(() => {
    fetchAdjustments(true);
  }, [fetchAdjustments]);

  const handleApprove = async (adjustmentId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/autonomous-adjustments/${adjustmentId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-App-ID': '12345678-1234-1234-1234-123456789abc',
        },
        body: JSON.stringify({ user_id: USER_ID }),
      });
      if (response.ok) {
        fetchAdjustments();
      }
    } catch (err) {
      console.error('Failed to approve adjustment:', err);
    }
  };

  const handleOverride = async (adjustmentId: string, feedback: string) => {
    try {
      const response = await fetch(`http://localhost:3000/autonomous-adjustments/${adjustmentId}/override`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-App-ID': '12345678-1234-1234-1234-123456789abc',
        },
        body: JSON.stringify({ user_id: USER_ID, feedback }),
      });
      if (response.ok) {
        fetchAdjustments();
      }
    } catch (err) {
      console.error('Failed to override adjustment:', err);
    }
  };

  const filteredAdjustments = adjustments.filter(adj => {
    if (filter === 'all') return true;
    if (filter === 'pending') return adj.status === 'pending';
    if (filter === 'applied') return adj.status === 'applied';
    if (filter === 'overridden') return adj.userOverride === true;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading autonomous adjustments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchAdjustments()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Autonomous Adjustments</Text>
        <Text style={styles.subtitle}>AI-driven plan modifications</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({adjustments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'applied' && styles.filterButtonActive]}
          onPress={() => setFilter('applied')}
        >
          <Text style={[styles.filterText, filter === 'applied' && styles.filterTextActive]}>
            Applied
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'overridden' && styles.filterButtonActive]}
          onPress={() => setFilter('overridden')}
        >
          <Text style={[styles.filterText, filter === 'overridden' && styles.filterTextActive]}>
            Overridden
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAdjustments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No autonomous adjustments found</Text>
            <Text style={styles.emptySubtext}>
              The system will automatically suggest adjustments based on your health data
            </Text>
          </View>
        ) : (
          filteredAdjustments.map((adjustment) => (
            <View key={adjustment.id} style={styles.adjustmentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.adjustmentTitle}>{adjustment.title}</Text>
                  <Text style={styles.adjustmentCategory}>{adjustment.category}</Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={[styles.priorityBadge, getPriorityColor(adjustment.priority)]}>
                    <Text style={styles.priorityText}>{adjustment.priority}</Text>
                  </View>
                  <View style={[styles.statusBadge, getStatusColor(adjustment.status)]}>
                    <Text style={styles.statusText}>{adjustment.status}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.adjustmentDescription}>{adjustment.description}</Text>

              <View style={styles.changeContainer}>
                <View style={styles.changeBox}>
                  <Text style={styles.changeLabel}>Before</Text>
                  <Text style={styles.changeValue}>{adjustment.beforeValue}</Text>
                </View>
                <Text style={styles.changeArrow}>→</Text>
                <View style={styles.changeBox}>
                  <Text style={styles.changeLabel}>After</Text>
                  <Text style={styles.changeValue}>{adjustment.afterValue}</Text>
                </View>
              </View>

              <View style={styles.rationaleContainer}>
                <Text style={styles.rationaleTitle}>Rationale</Text>
                <Text style={styles.rationaleReason}>{adjustment.rationale.reason}</Text>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence:</Text>
                  <View style={styles.confidenceBar}>
                    <View
                      style={[
                        styles.confidenceFill,
                        { width: `${adjustment.rationale.confidence}%` },
                        getConfidenceColor(adjustment.rationale.confidence),
                      ]}
                    />
                  </View>
                  <Text style={styles.confidenceValue}>{adjustment.rationale.confidence}%</Text>
                </View>
                {adjustment.rationale.dataPoints.length > 0 && (
                  <View style={styles.dataPointsContainer}>
                    <Text style={styles.dataPointsTitle}>Based on:</Text>
                    {adjustment.rationale.dataPoints.map((point, idx) => (
                      <Text key={idx} style={styles.dataPoint}>• {point}</Text>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.impactContainer}>
                <Text style={styles.impactLabel}>Expected Impact:</Text>
                <Text style={styles.impactValue}>{adjustment.expectedImpact}</Text>
              </View>

              {adjustment.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(adjustment.id)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.overrideButton}
                    onPress={() => handleOverride(adjustment.id, 'User declined')}
                  >
                    <Text style={styles.overrideButtonText}>Override</Text>
                  </TouchableOpacity>
                </View>
              )}

              {adjustment.userOverride && adjustment.userFeedback && (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackLabel}>User Feedback:</Text>
                  <Text style={styles.feedbackText}>{adjustment.userFeedback}</Text>
                </View>
              )}

              <Text style={styles.timestamp}>
                {new Date(adjustment.timestamp).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical':
      return { backgroundColor: '#DC2626' };
    case 'high':
      return { backgroundColor: '#F59E0B' };
    case 'medium':
      return { backgroundColor: '#3B82F6' };
    case 'low':
      return { backgroundColor: '#10B981' };
    default:
      return { backgroundColor: '#6B7280' };
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return { backgroundColor: '#F59E0B' };
    case 'applied':
      return { backgroundColor: '#10B981' };
    case 'overridden':
      return { backgroundColor: '#6B7280' };
    default:
      return { backgroundColor: '#6B7280' };
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return { backgroundColor: '#10B981' };
  if (confidence >= 60) return { backgroundColor: '#3B82F6' };
  if (confidence >= 40) return { backgroundColor: '#F59E0B' };
  return { backgroundColor: '#DC2626' };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  adjustmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    gap: 4,
    alignItems: 'flex-end',
  },
  adjustmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  adjustmentCategory: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  adjustmentDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  changeBox: {
    flex: 1,
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  changeArrow: {
    fontSize: 20,
    color: '#2563EB',
    marginHorizontal: 12,
  },
  rationaleContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  rationaleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  rationaleReason: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
    minWidth: 40,
    textAlign: 'right',
  },
  dataPointsContainer: {
    marginTop: 8,
  },
  dataPointsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  dataPoint: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  impactContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  impactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  approveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overrideButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    alignItems: 'center',
  },
  overrideButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  feedbackContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
  },
});

export default AutonomousAdjustmentsScreen;
