import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

export default function RecoveryScreen() {
  const { userId } = useUser();
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadRecoveryData();
    }
  }, [userId]);

  const loadRecoveryData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const [scoreResponse, recommendationsResponse] = await Promise.allSettled([
        healthApi.recovery.getScore(userId),
        healthApi.recovery.getRecommendations(userId),
      ]);

      if (scoreResponse.status === 'fulfilled') {
        setRecoveryData(scoreResponse.value.data.data);
      }
      if (recommendationsResponse.status === 'fulfilled') {
        setRecommendations(recommendationsResponse.value.data.data || []);
      }
    } catch (error) {
      console.error('Error loading recovery data:', error);
      Alert.alert('Error', 'Failed to load recovery data');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadRecoveryData();
    setRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { emoji: '🟢', text: 'Excellent Recovery' };
    if (score >= 60) return { emoji: '🟡', text: 'Good Recovery' };
    return { emoji: '🔴', text: 'Rest Needed' };
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>Set your user ID in Settings to get started</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const scoreColor = recoveryData ? getScoreColor(recoveryData.recoveryScore) : '#999';
  const scoreStatus = recoveryData ? getScoreStatus(recoveryData.recoveryScore) : { emoji: '⚪', text: 'No Data' };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recovery Status</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refresh} disabled={refreshing}>
          <Text style={styles.refreshButtonText}>{refreshing ? '⏳' : '🔄'} Refresh</Text>
        </TouchableOpacity>
      </View>

      {recoveryData ? (
        <>
          <View style={[styles.scoreCard, { borderLeftColor: scoreColor }]}>
            <Text style={styles.scoreEmoji}>{scoreStatus.emoji}</Text>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {recoveryData.recoveryScore}
            </Text>
            <Text style={styles.scoreLabel}>Recovery Score</Text>
            <Text style={styles.scoreStatus}>{scoreStatus.text}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recovery Factors</Text>
            
            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorIcon}>😴</Text>
                <Text style={styles.factorName}>Sleep Quality</Text>
              </View>
              <View style={styles.factorBar}>
                <View style={[styles.factorBarFill, { width: `${recoveryData.sleepScore || 0}%`, backgroundColor: '#9C27B0' }]} />
              </View>
              <Text style={styles.factorValue}>{recoveryData.sleepScore || 0}%</Text>
            </View>

            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorIcon}>❤️</Text>
                <Text style={styles.factorName}>HRV (Heart Rate Variability)</Text>
              </View>
              <View style={styles.factorBar}>
                <View style={[styles.factorBarFill, { width: `${recoveryData.hrvScore || 0}%`, backgroundColor: '#E91E63' }]} />
              </View>
              <Text style={styles.factorValue}>{recoveryData.hrvScore || 0}%</Text>
            </View>

            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorIcon}>💪</Text>
                <Text style={styles.factorName}>Muscle Soreness</Text>
              </View>
              <View style={styles.factorBar}>
                <View style={[styles.factorBarFill, { width: `${100 - (recoveryData.sorenessLevel || 0)}%`, backgroundColor: '#FF5722' }]} />
              </View>
              <Text style={styles.factorValue}>{recoveryData.sorenessLevel || 0}/10</Text>
            </View>

            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorIcon}>😌</Text>
                <Text style={styles.factorName}>Stress Level</Text>
              </View>
              <View style={styles.factorBar}>
                <View style={[styles.factorBarFill, { width: `${100 - (recoveryData.stressLevel || 0)}%`, backgroundColor: '#FFC107' }]} />
              </View>
              <Text style={styles.factorValue}>{recoveryData.stressLevel || 0}/10</Text>
            </View>
          </View>

          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recovery Strategies</Text>
              {recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <Text style={styles.recommendationTitle}>{rec.strategy || rec.title}</Text>
                  <Text style={styles.recommendationDescription}>
                    {rec.description || rec.recommendation}
                  </Text>
                  {rec.priority && (
                    <Text style={[styles.priorityBadge, 
                      rec.priority === 'high' ? styles.priorityHigh : 
                      rec.priority === 'medium' ? styles.priorityMedium : 
                      styles.priorityLow
                    ]}>
                      {rec.priority.toUpperCase()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📊 Understanding Your Score</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>80-100:</Text> Excellent - Ready for intense training{'\n'}
              <Text style={styles.infoBold}>60-79:</Text> Good - Moderate training recommended{'\n'}
              <Text style={styles.infoBold}>Below 60:</Text> Rest needed - Focus on recovery
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>No recovery data available</Text>
          <Text style={styles.emptySubtext}>Connect your devices to track recovery metrics</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 6,
  },
  scoreEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  factorCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  factorIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  factorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  factorBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  factorValue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  recommendationCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 10,
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  priorityHigh: {
    backgroundColor: '#F44336',
  },
  priorityMedium: {
    backgroundColor: '#FF9800',
  },
  priorityLow: {
    backgroundColor: '#4CAF50',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  infoBold: {
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
