import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

export default function ConnectedDashboardScreen({ navigation }: any) {
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>({
    recovery: null,
    workouts: null,
    goals: null,
    healthScore: null,
  });

  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  const loadDashboardData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [recovery, workouts, goals, healthScore] = await Promise.allSettled([
        healthApi.recovery.getScore(userId),
        healthApi.workouts.getStats(userId, 7),
        healthApi.goals.getActive(userId),
        healthApi.bloodwork.getHealthScore(userId),
      ]);

      setDashboardData({
        recovery: recovery.status === 'fulfilled' ? recovery.value.data : null,
        workouts: workouts.status === 'fulfilled' ? workouts.value.data : null,
        goals: goals.status === 'fulfilled' ? goals.value.data : null,
        healthScore: healthScore.status === 'fulfilled' ? healthScore.value.data : null,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (!userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Health Optimization</Text>
        <Text style={styles.subtitle}>Set your user ID in settings to get started</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your health data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>Health Dashboard</Text>
      <Text style={styles.subheader}>User ID: {userId.substring(0, 8)}...</Text>

      {/* Recovery Score Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Recovery')}
      >
        <Text style={styles.cardTitle}>Recovery Score</Text>
        {dashboardData.recovery?.data ? (
          <>
            <Text style={styles.bigNumber}>{dashboardData.recovery.data.recoveryScore}</Text>
            <Text style={styles.cardSubtitle}>
              {dashboardData.recovery.data.recoveryScore >= 80 ? '🟢 Excellent' :
               dashboardData.recovery.data.recoveryScore >= 60 ? '🟡 Good' : '🔴 Rest Needed'}
            </Text>
          </>
        ) : (
          <Text style={styles.noData}>No recovery data available</Text>
        )}
      </TouchableOpacity>

      {/* Workout Stats Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Workouts')}
      >
        <Text style={styles.cardTitle}>This Week's Workouts</Text>
        {dashboardData.workouts?.data ? (
          <>
            <Text style={styles.bigNumber}>{dashboardData.workouts.data.totalWorkouts || 0}</Text>
            <Text style={styles.cardSubtitle}>
              {dashboardData.workouts.data.totalVolume ? 
                `${Math.round(dashboardData.workouts.data.totalVolume).toLocaleString()} lbs total volume` : 
                'Track your workouts'}
            </Text>
          </>
        ) : (
          <Text style={styles.noData}>No workout data available</Text>
        )}
      </TouchableOpacity>

      {/* Active Goals Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Goals')}
      >
        <Text style={styles.cardTitle}>Active Goals</Text>
        {dashboardData.goals?.data ? (
          <>
            <Text style={styles.bigNumber}>{dashboardData.goals.data.length || 0}</Text>
            <Text style={styles.cardSubtitle}>
              {dashboardData.goals.data.length > 0 ? 'Keep pushing!' : 'Create your first goal'}
            </Text>
          </>
        ) : (
          <Text style={styles.noData}>No goals set</Text>
        )}
      </TouchableOpacity>

      {/* Health Score Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Bloodwork')}
      >
        <Text style={styles.cardTitle}>Overall Health Score</Text>
        {dashboardData.healthScore?.data ? (
          <>
            <Text style={styles.bigNumber}>{dashboardData.healthScore.data.overallScore || 'N/A'}</Text>
            <Text style={styles.cardSubtitle}>Based on latest bloodwork</Text>
          </>
        ) : (
          <Text style={styles.noData}>Add bloodwork results</Text>
        )}
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Text style={styles.actionButtonText}>💪 Log Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Supplements')}
        >
          <Text style={styles.actionButtonText}>💊 Log Supplement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Devices')}
        >
          <Text style={styles.actionButtonText}>📱 Sync Devices</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 5,
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginVertical: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  noData: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  actionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
