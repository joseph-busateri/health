import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HealthKit from '@kingstinct/react-native-healthkit';

interface ConnectionStatus {
  connected: boolean;
  autoSyncEnabled: boolean;
  syncStatus: string;
  lastSyncAt?: string;
  lastSuccessfulSyncAt?: string;
  deviceName?: string;
  consecutiveFailures: number;
  lastError?: string;
}

interface ActivityRings {
  moveRingPercentage: number;
  exerciseRingPercentage: number;
  standRingPercentage: number;
  moveGoal: number;
  exerciseGoal: number;
  standGoal: number;
}

export default function AppleWatchConnectScreen() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [activityRings, setActivityRings] = useState<ActivityRings | null>(null);
  const [healthKitAvailable, setHealthKitAvailable] = useState(false);

  useEffect(() => {
    checkHealthKitAvailability();
    loadConnectionStatus();
    loadActivityRings();
  }, []);

  const checkHealthKitAvailability = async () => {
    try {
      const available = await HealthKit.isHealthDataAvailable();
      setHealthKitAvailable(available);
    } catch (error) {
      console.error('Error checking HealthKit availability:', error);
      setHealthKitAvailable(false);
    }
  };

  const loadConnectionStatus = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call when server is running
      // const response = await fetch('/api/apple-watch/status');
      // const data = await response.json();
      // setConnectionStatus(data);
      
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnectionStatus({
        connected: false,
        autoSyncEnabled: true,
        syncStatus: 'active',
        consecutiveFailures: 0,
      });
    } catch (error) {
      console.error('Error loading connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityRings = async () => {
    try {
      // TODO: Implement API call
      // const response = await fetch('/api/apple-watch/activity-rings');
      // const data = await response.json();
      // setActivityRings(data);
      
      // Mock data
      setActivityRings({
        moveRingPercentage: 75,
        exerciseRingPercentage: 60,
        standRingPercentage: 83,
        moveGoal: 600,
        exerciseGoal: 30,
        standGoal: 12,
      });
    } catch (error) {
      console.error('Error loading activity rings:', error);
    }
  };

  const handleConnect = async () => {
    if (!healthKitAvailable) {
      Alert.alert('HealthKit Not Available', 'HealthKit is not available on this device.');
      return;
    }

    setConnecting(true);
    try {
      // Request HealthKit permissions
      const permissions = {
        read: [
          HealthKit.HKQuantityTypeIdentifier.heartRate,
          HealthKit.HKQuantityTypeIdentifier.heartRateVariabilitySDNN,
          HealthKit.HKQuantityTypeIdentifier.restingHeartRate,
          HealthKit.HKQuantityTypeIdentifier.walkingHeartRateAverage,
          HealthKit.HKQuantityTypeIdentifier.vo2Max,
          HealthKit.HKQuantityTypeIdentifier.activeEnergyBurned,
          HealthKit.HKQuantityTypeIdentifier.basalEnergyBurned,
          HealthKit.HKQuantityTypeIdentifier.stepCount,
          HealthKit.HKQuantityTypeIdentifier.distanceWalkingRunning,
          HealthKit.HKQuantityTypeIdentifier.flightsClimbed,
          HealthKit.HKQuantityTypeIdentifier.appleExerciseTime,
          HealthKit.HKQuantityTypeIdentifier.appleStandTime,
          HealthKit.HKQuantityTypeIdentifier.respiratoryRate,
          HealthKit.HKQuantityTypeIdentifier.oxygenSaturation,
          HealthKit.HKCategoryTypeIdentifier.sleepAnalysis,
          HealthKit.HKWorkoutTypeIdentifier.workoutType,
        ],
      };

      await HealthKit.requestAuthorization(permissions);

      // Get device information
      const deviceName = 'Apple Watch Series 9'; // Would get from device
      const watchOSVersion = '10.3'; // Would get from device

      // Save connection to server
      // TODO: Implement API call
      // await fetch('/api/apple-watch/connect', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     deviceName,
      //     watchOSVersion,
      //     healthkitAuthorized: true,
      //   }),
      // });

      // Trigger initial sync
      await handleSync();

      Alert.alert('Success', 'Apple Watch connected successfully! Your data will sync automatically every day.');
      
      await loadConnectionStatus();
    } catch (error) {
      console.error('Error connecting Apple Watch:', error);
      Alert.alert('Connection Failed', 'Failed to connect Apple Watch. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Read data from HealthKit
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Read heart rate data
      const heartRateData = await HealthKit.querySamples(
        HealthKit.HKQuantityTypeIdentifier.heartRate,
        { from: sevenDaysAgo, to: today }
      );

      // Read HRV data
      const hrvData = await HealthKit.querySamples(
        HealthKit.HKQuantityTypeIdentifier.heartRateVariabilitySDNN,
        { from: sevenDaysAgo, to: today }
      );

      // Read activity data
      const stepsData = await HealthKit.querySamples(
        HealthKit.HKQuantityTypeIdentifier.stepCount,
        { from: sevenDaysAgo, to: today }
      );

      // Read workouts
      const workouts = await HealthKit.queryWorkouts({ from: sevenDaysAgo, to: today });

      // Send data to server
      // TODO: Implement API calls
      // await fetch('/api/apple-watch/sync', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     heartRateData,
      //     hrvData,
      //     stepsData,
      //     workouts,
      //   }),
      // });

      Alert.alert('Success', 'Data synced successfully!');
      
      await loadConnectionStatus();
      await loadActivityRings();
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert('Sync Failed', 'Failed to sync data. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Apple Watch',
      'Are you sure you want to disconnect your Apple Watch? You can reconnect at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement API call
              // await fetch('/api/apple-watch/disconnect', { method: 'POST' });
              
              Alert.alert('Disconnected', 'Apple Watch has been disconnected.');
              await loadConnectionStatus();
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect Apple Watch.');
            }
          },
        },
      ]
    );
  };

  const toggleAutoSync = async (enabled: boolean) => {
    try {
      // TODO: Implement API call
      // await fetch('/api/apple-watch/auto-sync', {
      //   method: 'POST',
      //   body: JSON.stringify({ enabled }),
      // });
      
      setConnectionStatus(prev => prev ? { ...prev, autoSyncEnabled: enabled } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update auto-sync setting.');
    }
  };

  const renderActivityRing = (percentage: number, color: string, label: string, goal: string) => (
    <View style={styles.ringContainer}>
      <View style={styles.ring}>
        <View style={[styles.ringProgress, { borderColor: color, borderWidth: 8 }]}>
          <Text style={styles.ringPercentage}>{percentage}%</Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
      <Text style={styles.ringGoal}>{goal}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Apple Watch status...</Text>
      </View>
    );
  }

  if (!healthKitAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Apple Watch</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>HealthKit Not Available</Text>
          <Text style={styles.errorText}>
            HealthKit is not available on this device. Apple Watch integration requires HealthKit.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Apple Watch</Text>
        <Text style={styles.subtitle}>Series 9 Integration</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!connectionStatus?.connected ? (
          /* Not Connected View */
          <View style={styles.section}>
            <View style={styles.deviceCard}>
              <View style={styles.watchIcon}>
                <Ionicons name="watch" size={48} color="#007AFF" />
              </View>
              <Text style={styles.deviceTitle}>Connect Your Apple Watch</Text>
              <Text style={styles.deviceDescription}>
                Automatically sync your health data including heart rate, HRV, activity, sleep, and workouts.
              </Text>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="heart" size={20} color="#ef4444" />
                  <Text style={styles.featureText}>Heart Rate & HRV</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="fitness" size={20} color="#10b981" />
                  <Text style={styles.featureText}>Activity Rings</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="moon" size={20} color="#8b5cf6" />
                  <Text style={styles.featureText}>Sleep Tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="barbell" size={20} color="#f59e0b" />
                  <Text style={styles.featureText}>Workout Data</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
                onPress={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="link" size={20} color="#fff" />
                    <Text style={styles.connectButtonText}>Connect Apple Watch</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color="#3b82f6" />
                <Text style={styles.infoText}>
                  Your data syncs automatically every day. No manual action required!
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Connected View */
          <>
            {/* Connection Status */}
            <View style={styles.section}>
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusIcon}>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusTitle}>Connected</Text>
                    <Text style={styles.statusDevice}>{connectionStatus.deviceName || 'Apple Watch Series 9'}</Text>
                  </View>
                </View>

                {connectionStatus.lastSuccessfulSyncAt && (
                  <Text style={styles.lastSync}>
                    Last synced: {new Date(connectionStatus.lastSuccessfulSyncAt).toLocaleString()}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
                  onPress={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <ActivityIndicator color="#007AFF" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={20} color="#007AFF" />
                      <Text style={styles.syncButtonText}>Sync Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Activity Rings */}
            {activityRings && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Activity</Text>
                <View style={styles.ringsCard}>
                  {renderActivityRing(
                    activityRings.moveRingPercentage,
                    '#ef4444',
                    'Move',
                    `${activityRings.moveGoal} cal`
                  )}
                  {renderActivityRing(
                    activityRings.exerciseRingPercentage,
                    '#10b981',
                    'Exercise',
                    `${activityRings.exerciseGoal} min`
                  )}
                  {renderActivityRing(
                    activityRings.standRingPercentage,
                    '#3b82f6',
                    'Stand',
                    `${activityRings.standGoal} hrs`
                  )}
                </View>
              </View>
            )}

            {/* Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Automatic Sync</Text>
                    <Text style={styles.settingDescription}>
                      Sync data automatically every day at 6 AM
                    </Text>
                  </View>
                  <Switch
                    value={connectionStatus.autoSyncEnabled}
                    onValueChange={toggleAutoSync}
                    trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                    thumbColor={connectionStatus.autoSyncEnabled ? '#007AFF' : '#f3f4f6'}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Ionicons name="unlink" size={20} color="#ef4444" />
                <Text style={styles.disconnectButtonText}>Disconnect Apple Watch</Text>
              </TouchableOpacity>
            </View>

            {/* Data Privacy */}
            <View style={styles.section}>
              <View style={styles.privacyCard}>
                <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                <Text style={styles.privacyTitle}>Your Data is Secure</Text>
                <Text style={styles.privacyText}>
                  All data is encrypted and stored securely. We never share your health data with third parties.
                </Text>
              </View>
            </View>
          </>
        )}
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  watchIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  deviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  statusDevice: {
    fontSize: 14,
    color: '#6b7280',
  },
  lastSync: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  ringsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  ringContainer: {
    alignItems: 'center',
  },
  ring: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  ringProgress: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  ringPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  ringGoal: {
    fontSize: 11,
    color: '#6b7280',
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 8,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  privacyCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginTop: 8,
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
