import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

/**
 * Oura Connect Screen V2
 * 
 * Version 2 Changes:
 * - Integrated with UserContext for proper authentication
 * - Real OAuth 2.0 flow with deep linking
 * - Real API calls replacing all mock data
 * - Connection status polling
 * - Comprehensive error handling and loading states
 * - Token management handled by backend
 */

interface ConnectionStatus {
  connected: boolean;
  autoSyncEnabled: boolean;
  lastSyncDate?: string;
  lastSuccessfulSyncDate?: string;
  ringModel?: string;
  consecutiveFailures: number;
  lastError?: string;
}

interface ReadinessData {
  readinessScore: number;
  sleepBalance: number;
  activityBalance: number;
  hrvBalance: number;
  restingHeartRate: number;
}

interface SyncStats {
  totalSyncs: number;
  successfulSyncs: number;
  successRate: number;
  lastSyncDate?: string;
}

const OURA_CLIENT_ID = process.env.EXPO_PUBLIC_OURA_CLIENT_ID || '';
const REDIRECT_URI = 'healthapp://oura-callback';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const POLLING_INTERVAL = 30000; // 30 seconds

export default function OuraConnectScreenV2() {
  const { userId, isLoading: isUserLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [readinessData, setReadinessData] = useState<ReadinessData | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [pollingInterval, setPollingIntervalState] = useState<NodeJS.Timeout | null>(null);

  // Validate userId before API calls
  const validateUserId = (): boolean => {
    if (!userId) {
      Alert.alert(
        'Authentication Required',
        'Unable to load user profile. Please restart the app.'
      );
      return false;
    }
    return true;
  };

  // Load connection status from API
  const loadConnectionStatus = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/devices/oura/${userId}/sync/stats?days=30`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Map sync stats to connection status
        setConnectionStatus({
          connected: data.data.total_syncs > 0,
          autoSyncEnabled: true,
          lastSyncDate: data.data.last_sync_date,
          lastSuccessfulSyncDate: data.data.last_successful_sync_date,
          consecutiveFailures: data.data.consecutive_failures || 0,
          lastError: data.data.last_error_message,
        });
      } else {
        // Not connected
        setConnectionStatus({
          connected: false,
          autoSyncEnabled: true,
          consecutiveFailures: 0,
        });
      }
    } catch (error) {
      console.error('Error loading connection status:', error);
      setConnectionStatus({
        connected: false,
        autoSyncEnabled: true,
        consecutiveFailures: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load readiness data from API
  const loadReadinessData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_URL}/devices/oura/${userId}/readiness/latest`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setReadinessData({
          readinessScore: data.data.readiness_score || 0,
          sleepBalance: data.data.sleep_balance || 0,
          activityBalance: data.data.activity_balance || 0,
          hrvBalance: data.data.hrv_balance || 0,
          restingHeartRate: data.data.resting_heart_rate || 0,
        });
      }
    } catch (error) {
      console.error('Error loading readiness data:', error);
    }
  }, [userId]);

  // Load sync stats from API
  const loadSyncStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_URL}/devices/oura/${userId}/sync/stats?days=30`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setSyncStats({
          totalSyncs: data.data.total_syncs || 0,
          successfulSyncs: data.data.successful_syncs || 0,
          successRate: data.data.success_rate || 0,
          lastSyncDate: data.data.last_sync_date,
        });
      }
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  }, [userId]);

  // Load all data
  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadConnectionStatus(),
      loadReadinessData(),
      loadSyncStats(),
    ]);
  }, [loadConnectionStatus, loadReadinessData, loadSyncStats]);

  // Setup OAuth callback listener
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      
      // Check if this is an Oura OAuth callback
      if (url.startsWith(REDIRECT_URI)) {
        const params = new URLSearchParams(url.split('?')[1]);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        
        if (error) {
          Alert.alert('Authorization Failed', `Oura authorization was denied: ${error}`);
          setConnecting(false);
          return;
        }
        
        if (code && userId) {
          try {
            // Exchange code for tokens via backend
            const response = await fetch(`${API_URL}/devices/oura/${userId}/connect`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code,
                redirectUri: REDIRECT_URI,
              }),
            });
            
            const data = await response.json();
            
            if (data.success) {
              Alert.alert(
                'Connected!',
                'Your Oura Ring is now connected. Data will sync automatically every day at 6 AM.',
                [{ text: 'Great!', onPress: () => loadAllData() }]
              );
            } else {
              throw new Error(data.error || 'Connection failed');
            }
          } catch (error) {
            console.error('Error exchanging OAuth code:', error);
            Alert.alert('Connection Failed', 'Failed to connect Oura Ring. Please try again.');
          } finally {
            setConnecting(false);
          }
        }
      }
    };
    
    // Listen for deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [userId, loadAllData]);

  // Initial data load
  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId, loadAllData]);

  // Setup polling for connected users
  useEffect(() => {
    if (connectionStatus?.connected && userId) {
      // Poll every 30 seconds
      const interval = setInterval(() => {
        loadAllData();
      }, POLLING_INTERVAL);
      
      setPollingIntervalState(interval);
      
      return () => {
        clearInterval(interval);
      };
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingIntervalState(null);
      }
    }
  }, [connectionStatus?.connected, userId, loadAllData, pollingInterval]);

  // Handle OAuth connection
  const handleConnect = async () => {
    if (!validateUserId()) return;
    
    if (!OURA_CLIENT_ID) {
      Alert.alert('Configuration Error', 'Oura Client ID is not configured. Please contact support.');
      return;
    }
    
    setConnecting(true);
    
    try {
      // Generate OAuth URL
      const scope = encodeURIComponent('daily personal email');
      const state = Math.random().toString(36).substring(7);
      const redirectUriEncoded = encodeURIComponent(REDIRECT_URI);
      
      const ouraAuthUrl = `https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=${OURA_CLIENT_ID}&redirect_uri=${redirectUriEncoded}&scope=${scope}&state=${state}`;
      
      // Open OAuth flow in browser
      const supported = await Linking.canOpenURL(ouraAuthUrl);
      if (supported) {
        await Linking.openURL(ouraAuthUrl);
        
        Alert.alert(
          'Authorization Required',
          'Please authorize the app in your browser. You will be redirected back automatically.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Cannot open Oura authorization page');
        setConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting Oura:', error);
      Alert.alert('Connection Failed', 'Failed to open Oura authorization. Please try again.');
      setConnecting(false);
    }
  };

  // Handle manual sync
  const handleSync = async () => {
    if (!validateUserId()) return;
    
    setSyncing(true);
    try {
      const response = await fetch(`${API_URL}/devices/oura/${userId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Data synced successfully!');
        await loadAllData();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert('Sync Failed', 'Failed to sync data. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!validateUserId()) return;
    
    Alert.alert(
      'Disconnect Oura Ring',
      'Are you sure you want to disconnect your Oura Ring? You can reconnect at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/devices/oura/${userId}/disconnect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });
              
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Disconnected', 'Oura Ring has been disconnected.');
                await loadAllData();
              } else {
                throw new Error(data.error || 'Disconnect failed');
              }
            } catch (error) {
              console.error('Error disconnecting:', error);
              Alert.alert('Error', 'Failed to disconnect Oura Ring.');
            }
          },
        },
      ]
    );
  };

  // Helper functions
  const getReadinessColor = (score: number) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 55) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Optimal';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Pay Attention';
    return 'Rest';
  };

  // Show loading state while user is being loaded
  if (isUserLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading user profile...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading Oura Ring status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Oura Ring</Text>
        <Text style={styles.subtitle}>Gen 3 Horizon</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!connectionStatus?.connected ? (
          /* Not Connected View */
          <View style={styles.section}>
            <View style={styles.deviceCard}>
              <View style={styles.ringIcon}>
                <Ionicons name="radio-button-on" size={64} color="#6366f1" />
              </View>
              <Text style={styles.deviceTitle}>Connect Your Oura Ring</Text>
              <Text style={styles.deviceDescription}>
                Automatically sync your sleep, readiness, and activity data every day. Get insights into your recovery and optimize your health.
              </Text>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="moon" size={20} color="#8b5cf6" />
                  <Text style={styles.featureText}>Sleep Tracking & Stages</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="pulse" size={20} color="#ef4444" />
                  <Text style={styles.featureText}>HRV & Heart Rate</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="fitness" size={20} color="#10b981" />
                  <Text style={styles.featureText}>Readiness Score</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="walk" size={20} color="#3b82f6" />
                  <Text style={styles.featureText}>Activity & Movement</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="thermometer" size={20} color="#f59e0b" />
                  <Text style={styles.featureText}>Body Temperature</Text>
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
                    <Text style={styles.connectButtonText}>Connect Oura Ring</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color="#6366f1" />
                <Text style={styles.infoText}>
                  Your data syncs automatically every day at 6 AM. No manual action required!
                </Text>
              </View>

              <View style={styles.securityBox}>
                <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                <Text style={styles.securityText}>
                  AES-256 encrypted token storage. Your data is secure.
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
                    <Text style={styles.statusDevice}>{connectionStatus.ringModel || 'Oura Ring Gen 3 Horizon'}</Text>
                  </View>
                </View>

                {connectionStatus.lastSuccessfulSyncDate && (
                  <Text style={styles.lastSync}>
                    Last synced: {new Date(connectionStatus.lastSuccessfulSyncDate).toLocaleString()}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
                  onPress={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <ActivityIndicator color="#6366f1" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={20} color="#6366f1" />
                      <Text style={styles.syncButtonText}>Sync Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Readiness Score */}
            {readinessData && readinessData.readinessScore > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Readiness</Text>
                <View style={styles.readinessCard}>
                  <View style={styles.readinessHeader}>
                    <View style={styles.scoreCircle}>
                      <Text style={[styles.scoreValue, { color: getReadinessColor(readinessData.readinessScore) }]}>
                        {readinessData.readinessScore}
                      </Text>
                      <Text style={styles.scoreLabel}>Readiness</Text>
                    </View>
                    <View style={styles.scoreStatus}>
                      <View style={[styles.statusBadge, { backgroundColor: getReadinessColor(readinessData.readinessScore) }]}>
                        <Text style={styles.statusBadgeText}>{getScoreLabel(readinessData.readinessScore)}</Text>
                      </View>
                      <Text style={styles.statusDescription}>
                        {readinessData.readinessScore >= 85 && 'Your body is ready for challenges'}
                        {readinessData.readinessScore >= 70 && readinessData.readinessScore < 85 && 'Good day for moderate activity'}
                        {readinessData.readinessScore >= 55 && readinessData.readinessScore < 70 && 'Take it easy today'}
                        {readinessData.readinessScore < 55 && 'Focus on recovery today'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.contributorsGrid}>
                    <View style={styles.contributorItem}>
                      <Ionicons name="moon" size={20} color="#8b5cf6" />
                      <Text style={styles.contributorValue}>{readinessData.sleepBalance}</Text>
                      <Text style={styles.contributorLabel}>Sleep</Text>
                    </View>
                    <View style={styles.contributorItem}>
                      <Ionicons name="fitness" size={20} color="#10b981" />
                      <Text style={styles.contributorValue}>{readinessData.activityBalance}</Text>
                      <Text style={styles.contributorLabel}>Activity</Text>
                    </View>
                    <View style={styles.contributorItem}>
                      <Ionicons name="pulse" size={20} color="#ef4444" />
                      <Text style={styles.contributorValue}>{readinessData.hrvBalance}</Text>
                      <Text style={styles.contributorLabel}>HRV</Text>
                    </View>
                    <View style={styles.contributorItem}>
                      <Ionicons name="heart" size={20} color="#f59e0b" />
                      <Text style={styles.contributorValue}>{readinessData.restingHeartRate}</Text>
                      <Text style={styles.contributorLabel}>RHR (bpm)</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Sync Statistics */}
            {syncStats && syncStats.totalSyncs > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sync Statistics</Text>
                <View style={styles.statsCard}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Syncs</Text>
                    <Text style={styles.statValue}>{syncStats.totalSyncs}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Success Rate</Text>
                    <Text style={[styles.statValue, { color: '#10b981' }]}>{syncStats.successRate}%</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Successful Syncs</Text>
                    <Text style={styles.statValue}>{syncStats.successfulSyncs}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <View style={styles.settingCard}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Automatic Sync</Text>
                  <Text style={styles.settingDescription}>
                    Data syncs automatically every day at 6 AM
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>

              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Ionicons name="unlink" size={20} color="#ef4444" />
                <Text style={styles.disconnectButtonText}>Disconnect Oura Ring</Text>
              </TouchableOpacity>
            </View>

            {/* Data Privacy */}
            <View style={styles.section}>
              <View style={styles.privacyCard}>
                <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                <Text style={styles.privacyTitle}>Your Data is Secure</Text>
                <Text style={styles.privacyText}>
                  All OAuth tokens are encrypted with AES-256. We never share your health data with third parties.
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
  ringIcon: {
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
    backgroundColor: '#6366f1',
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
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    width: '100%',
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4338ca',
    lineHeight: 16,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    width: '100%',
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
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
    backgroundColor: '#eef2ff',
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
    color: '#6366f1',
  },
  readinessCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  readinessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  scoreCircle: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  scoreStatus: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  contributorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contributorItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contributorValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  contributorLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
