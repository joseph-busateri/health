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

interface DataSource {
  id: string;
  name: string;
  type: string;
  lastSync: string;
  status: string;
  confidence: number;
  dataPoints: number;
}

interface DataConflict {
  id: string;
  dataType: string;
  field: string;
  sources: {
    source: string;
    value: any;
    confidence: number;
    timestamp: string;
  }[];
  resolution: string;
  resolvedValue: any;
}

interface ProvenanceData {
  sources: DataSource[];
  conflicts: DataConflict[];
  freshnessScore: number;
  overallConfidence: number;
}

const SourceProvenanceScreen = () => {
  const [data, setData] = useState<ProvenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProvenance = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/provenance/${USER_ID}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': process.env.EXPO_PUBLIC_APP_ID || '12345678-1234-1234-1234-123456789abc',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch provenance data');
      }
      const provenanceData = await response.json();
      setData(provenanceData);
    } catch (err) {
      setError('Failed to load source provenance data. Please try again.');
      console.error('Provenance error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProvenance();
  }, [fetchProvenance]);

  const onRefresh = useCallback(() => {
    fetchProvenance(true);
  }, [fetchProvenance]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading source provenance...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchProvenance()}>
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
      <View style={styles.metricsCard}>
        <Text style={styles.metricsTitle}>Data Quality Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Freshness Score</Text>
            <Text style={styles.metricValue}>{data?.freshnessScore || 0}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Overall Confidence</Text>
            <Text style={styles.metricValue}>{data?.overallConfidence || 0}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <Text style={styles.sectionSubtitle}>
          {data?.sources.length || 0} connected sources
        </Text>

        {data?.sources.map((source) => (
          <View key={source.id} style={styles.sourceCard}>
            <View style={styles.sourceHeader}>
              <View style={styles.sourceHeaderLeft}>
                <Text style={styles.sourceName}>{source.name}</Text>
                <Text style={styles.sourceType}>{source.type}</Text>
              </View>
              <View style={[styles.statusBadge, getStatusColor(source.status)]}>
                <Text style={styles.statusText}>{source.status}</Text>
              </View>
            </View>

            <View style={styles.sourceMetrics}>
              <View style={styles.sourceMetricItem}>
                <Text style={styles.sourceMetricLabel}>Confidence</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${source.confidence}%` },
                      getConfidenceColor(source.confidence),
                    ]}
                  />
                </View>
                <Text style={styles.sourceMetricValue}>{source.confidence}%</Text>
              </View>

              <View style={styles.sourceMetricItem}>
                <Text style={styles.sourceMetricLabel}>Data Points</Text>
                <Text style={styles.sourceMetricValue}>{source.dataPoints}</Text>
              </View>

              <View style={styles.sourceMetricItem}>
                <Text style={styles.sourceMetricLabel}>Last Sync</Text>
                <Text style={styles.sourceMetricValue}>
                  {new Date(source.lastSync).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {data?.conflicts && data.conflicts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Conflicts</Text>
          <Text style={styles.sectionSubtitle}>
            {data.conflicts.length} conflict{data.conflicts.length !== 1 ? 's' : ''} detected
          </Text>

          {data.conflicts.map((conflict) => (
            <View key={conflict.id} style={styles.conflictCard}>
              <View style={styles.conflictHeader}>
                <Text style={styles.conflictType}>{conflict.dataType}</Text>
                <Text style={styles.conflictField}>{conflict.field}</Text>
              </View>

              <View style={styles.conflictSources}>
                {conflict.sources.map((src, idx) => (
                  <View key={idx} style={styles.conflictSource}>
                    <View style={styles.conflictSourceHeader}>
                      <Text style={styles.conflictSourceName}>{src.source}</Text>
                      <Text style={styles.conflictConfidence}>{src.confidence}%</Text>
                    </View>
                    <Text style={styles.conflictValue}>{JSON.stringify(src.value)}</Text>
                    <Text style={styles.conflictTimestamp}>
                      {new Date(src.timestamp).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.conflictResolution}>
                <Text style={styles.resolutionLabel}>Resolution:</Text>
                <Text style={styles.resolutionMethod}>{conflict.resolution}</Text>
                <Text style={styles.resolvedValue}>
                  Resolved: {JSON.stringify(conflict.resolvedValue)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return { backgroundColor: '#10B981' };
    case 'syncing':
      return { backgroundColor: '#3B82F6' };
    case 'error':
      return { backgroundColor: '#EF4444' };
    default:
      return { backgroundColor: '#6B7280' };
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return { backgroundColor: '#10B981' };
  if (confidence >= 60) return { backgroundColor: '#3B82F6' };
  if (confidence >= 40) return { backgroundColor: '#F59E0B' };
  return { backgroundColor: '#EF4444' };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563EB',
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
  sourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sourceHeaderLeft: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sourceType: {
    fontSize: 12,
    color: '#64748B',
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
  sourceMetrics: {
    gap: 12,
  },
  sourceMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceMetricLabel: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  sourceMetricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  confidenceBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  conflictCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  conflictHeader: {
    marginBottom: 16,
  },
  conflictType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  conflictField: {
    fontSize: 13,
    color: '#64748B',
  },
  conflictSources: {
    gap: 12,
    marginBottom: 16,
  },
  conflictSource: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  conflictSourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  conflictSourceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  conflictConfidence: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  conflictValue: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  conflictTimestamp: {
    fontSize: 11,
    color: '#94A3B8',
  },
  conflictResolution: {
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  resolutionMethod: {
    fontSize: 13,
    color: '#1E40AF',
    marginBottom: 8,
  },
  resolvedValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
});

export default SourceProvenanceScreen;
