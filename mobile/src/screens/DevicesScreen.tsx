import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';
import { initializeHealthKit, syncAllHealthData, enableBloodPressureBackgroundDelivery, disableBloodPressureBackgroundDelivery, enableWatchBackgroundDelivery, disableWatchBackgroundDelivery } from '../services/healthKitService';
import { syncPreferencesService, SyncPreferences } from '../services/syncPreferencesService';

export default function DevicesScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { userId } = useUser();
  const [syncing, setSyncing] = useState<{ [key: string]: boolean }>({});
  const [lastSync, setLastSync] = useState<{ [key: string]: string }>({});
  const [syncPreferences, setSyncPreferences] = useState<SyncPreferences>({
    automaticBPSync: true,
    automaticWatchSync: true,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // Load sync preferences on mount
  useEffect(() => {
    loadSyncPreferences();
  }, []);

  const loadSyncPreferences = async () => {
    try {
      const prefs = await syncPreferencesService.getPreferences();
      setSyncPreferences(prefs);
    } catch (error) {
      console.error('Error loading sync preferences:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const toggleAutomaticBPSync = async (value: boolean) => {
    try {
      await syncPreferencesService.setAutomaticBPSync(value);
      setSyncPreferences(prev => ({ ...prev, automaticBPSync: value }));
      
      if (value) {
        await initializeHealthKit();
        await enableBloodPressureBackgroundDelivery();
        Alert.alert('Automatic Sync Enabled', 'Blood pressure data will sync automatically when received in Apple Health');
      } else {
        await disableBloodPressureBackgroundDelivery();
        Alert.alert('Automatic Sync Disabled', 'Blood pressure data will only sync when you tap "Sync BP"');
      }
    } catch (error) {
      console.error('Error toggling automatic BP sync:', error);
      Alert.alert('Error', 'Failed to update automatic sync setting');
    }
  };

  const toggleAutomaticWatchSync = async (value: boolean) => {
    try {
      await syncPreferencesService.setAutomaticWatchSync(value);
      setSyncPreferences(prev => ({ ...prev, automaticWatchSync: value }));
      
      if (value) {
        await initializeHealthKit();
        await enableWatchBackgroundDelivery();
        Alert.alert('Automatic Sync Enabled', 'Apple Watch data will sync automatically when received in Apple Health');
      } else {
        await disableWatchBackgroundDelivery();
        Alert.alert('Automatic Sync Disabled', 'Apple Watch data will only sync when you tap "Sync Now"');
      }
    } catch (error) {
      console.error('Error toggling automatic Watch sync:', error);
      Alert.alert('Error', 'Failed to update automatic sync setting');
    }
  };

  const devices = [
    { id: 'oura', name: 'Oura Ring', iconName: 'ring', color: '#FF6B6B', hasConnectScreen: true },
    { id: 'appleWatch', name: 'Apple Watch', iconName: 'watch-variant', color: '#007AFF', hasConnectScreen: false },
    { id: 'sleepNumber', name: 'Sleep Number', iconName: 'bed-king', color: '#4CAF50', hasConnectScreen: true },
    { id: 'bpMonitor', name: 'Blood Pressure Monitor', iconName: 'heart-pulse', color: '#EC4899' },
  ];

  const uploads = [
    {
      id: 'bodyComposition',
      name: 'Body Composition Upload',
      iconName: 'human-male-height-variant',
      color: '#6366F1',
      description: 'Import DEXA, InBody, or smart scale scans',
      onPress: () => navigation.navigate('BodyCompositionUpload'),
    },
    {
      id: 'tapeMeasurements',
      name: 'Tape Measurements',
      iconName: 'tape-measure',
      color: '#F59E0B',
      description: 'Track body measurements over time',
      onPress: () => navigation.navigate('TapeMeasurements'),
    },
    {
      id: 'nutrition',
      name: 'Nutrition Dashboard',
      iconName: 'food',
      color: '#10B981',
      description: 'View nutrition targets and meal timing',
      onPress: () => navigation.navigate('NutritionDashboard'),
    },
    {
      id: 'bloodwork',
      name: 'Bloodwork Upload',
      iconName: 'test-tube',
      color: '#22C55E',
      description: 'Upload lab panels for AI interpretation',
      onPress: () => navigation.navigate('BloodworkUpload'),
    },
  ];

  const syncDevice = async (deviceId: string) => {
    if (!userId) {
      Alert.alert('Error', 'Set your user ID in Settings first');
      return;
    }

    // Apple Health-based devices (Apple Watch and BP Monitor)
    if (deviceId === 'bpMonitor' || deviceId === 'appleWatch') {
      setSyncing({ ...syncing, [deviceId]: true });
      
      try {
        await initializeHealthKit();
        
        let result;
        let message;
        
        if (deviceId === 'bpMonitor') {
          // Sync blood pressure data from last 30 days
          result = await syncAllHealthData(30, ['blood_pressure']);
          message = `Synced ${result.recordCount} blood pressure readings from Apple Health`;
        } else if (deviceId === 'appleWatch') {
          // Sync Apple Watch data from last 7 days
          result = await syncAllHealthData(7, ['heart_rate', 'hrv', 'steps', 'workouts', 'sleep', 'active_energy']);
          message = `Synced ${result.recordCount} records from Apple Watch (${result.dataTypes.join(', ')})`;
        }
        
        setLastSync(prev => ({ ...prev, [deviceId]: new Date().toLocaleTimeString() }));
        Alert.alert('Success', message);
      } catch (error: any) {
        Alert.alert('Sync Failed', error.message || `Failed to sync ${deviceId} from Apple Health`);
      } finally {
        setSyncing({ ...syncing, [deviceId]: false });
      }
      return;
    }

    // Backend API devices (Oura Ring, Sleep Number)
    setSyncing({ ...syncing, [deviceId]: true });

    try {
      if (deviceId === 'oura') {
        await healthApi.devices.oura.sync(userId);
      } else if (deviceId === 'sleepNumber') {
        await healthApi.devices.sleepNumber.sync(userId);
      }

      setLastSync({ ...lastSync, [deviceId]: new Date().toLocaleTimeString() });
      Alert.alert('Success', `${deviceId} synced successfully!`);
    } catch (error: any) {
      console.error(`Error syncing ${deviceId}:`, error);
      Alert.alert('Sync Failed', error.response?.data?.error || 'Failed to sync device');
    } finally {
      setSyncing({ ...syncing, [deviceId]: false });
    }
  };


  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>Set your user ID in Settings to manage integrations</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Integrations</Text>
        <Text style={styles.subtitle}>Connect wearables and upload your biometrics</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Text style={styles.sectionLabel}>Connected Devices</Text>
        {devices.map((device) => (
          <View key={device.id} style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceInfo}>
                <MaterialCommunityIcons
                  name={device.iconName as any}
                  size={40}
                  color={device.color}
                  style={styles.deviceIcon}
                />
                <View>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  {lastSync[device.id] && (
                    <Text style={styles.lastSync}>Last sync: {lastSync[device.id]}</Text>
                  )}
                </View>
              </View>
              {device.hasConnectScreen ? (
                <TouchableOpacity
                  style={[styles.connectButton, { backgroundColor: device.color }]}
                  onPress={() => {
                    if (device.id === 'oura') {
                      navigation.navigate('OuraConnect');
                    } else if (device.id === 'sleepNumber') {
                      navigation.navigate('SleepNumberConnect');
                    }
                  }}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.syncButton, { backgroundColor: device.color }]}
                  onPress={() => syncDevice(device.id)}
                  disabled={syncing[device.id]}
                >
                  {syncing[device.id] ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.syncButtonText}>
                      {device.id === 'bpMonitor' ? 'Sync BP' : 'Sync Now'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.deviceDetails}>
              <View style={styles.detailRow}>
                {device.id === 'oura' && (
                  <>
                    <MaterialCommunityIcons name="chart-line" size={16} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText}>Sleep, readiness, and activity data</Text>
                  </>
                )}
                {device.id === 'appleWatch' && (
                  <>
                    <MaterialCommunityIcons name="heart-pulse" size={16} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText}>Sync via Apple Health: workouts, HRV, heart rate, steps, sleep</Text>
                  </>
                )}
                {device.id === 'sleepNumber' && (
                  <>
                    <MaterialCommunityIcons name="sleep" size={16} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText}>Sleep quality and duration</Text>
                  </>
                )}
                {device.id === 'bpMonitor' && (
                  <>
                    <MaterialCommunityIcons name="stethoscope" size={16} color="#666" style={styles.detailIcon} />
                    <Text style={styles.detailText}>Sync via Apple Health: blood pressure readings (systolic/diastolic)</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpacing]}>Manual Uploads</Text>
        {uploads.map((item) => (
          <TouchableOpacity key={item.id} style={styles.uploadCard} onPress={item.onPress} activeOpacity={0.88}>
            <View style={[styles.uploadIconWrapper, { backgroundColor: `${item.color}1A` }]}> 
              <MaterialCommunityIcons name={item.iconName as any} size={24} color={item.color} />
            </View>
            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>{item.name}</Text>
              <Text style={styles.uploadSubtitle}>{item.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="apple" size={24} color="#4CAF50" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>Apple Health Integration</Text>
          </View>
          <Text style={styles.infoText}>
            Apple Watch and Blood Pressure Monitor sync through Apple Health. Ensure your devices are paired with your iPhone and data is syncing to the Health app.
          </Text>
        </View>

        {/* Sync Status Card */}
        {!loadingPreferences && process.env.EXPO_PUBLIC_ENABLE_BACKGROUND_SYNC === 'true' && (
          <View style={styles.syncStatusCard}>
            <View style={styles.syncStatusHeader}>
              <MaterialCommunityIcons name="sync-circle" size={24} color="#2563EB" style={styles.syncStatusIcon} />
              <Text style={styles.syncStatusTitle}>Automatic Sync Status</Text>
            </View>
            
            <View style={styles.syncStatusRow}>
              <View style={styles.syncStatusItem}>
                <MaterialCommunityIcons name="heart-pulse" size={20} color="#EC4899" />
                <Text style={styles.syncStatusLabel}>BP Monitor</Text>
                <Switch
                  value={syncPreferences.automaticBPSync}
                  onValueChange={toggleAutomaticBPSync}
                  trackColor={{ false: '#767577', true: '#EC4899' }}
                  thumbColor={syncPreferences.automaticBPSync ? '#EC4899' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.syncStatusItem}>
                <MaterialCommunityIcons name="watch-variant" size={20} color="#007AFF" />
                <Text style={styles.syncStatusLabel}>Apple Watch</Text>
                <Switch
                  value={syncPreferences.automaticWatchSync}
                  onValueChange={toggleAutomaticWatchSync}
                  trackColor={{ false: '#767577', true: '#007AFF' }}
                  thumbColor={syncPreferences.automaticWatchSync ? '#007AFF' : '#f4f3f4'}
                />
              </View>
            </View>

            {syncPreferences.lastSyncTime && (
              <Text style={styles.lastSyncTime}>
                Last sync: {new Date(syncPreferences.lastSyncTime).toLocaleString()}
              </Text>
            )}
            
            {syncPreferences.lastSyncStatus === 'error' && syncPreferences.lastSyncError && (
              <View style={styles.syncErrorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.syncErrorText}>{syncPreferences.lastSyncError}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="sync" size={24} color="#FF9800" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>Manual Sync</Text>
          </View>
          <Text style={styles.infoText}>
            Use "Sync Now" to manually pull the latest data from Apple Health. Data from the last 7 days (Apple Watch) or 30 days (BP) will be synced.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    flex: 1,
    padding: 15,
  },
  listContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  sectionLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionLabelSpacing: {
    marginTop: 10,
    marginBottom: 10,
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lastSync: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  syncButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  connectButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  deviceDetails: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bpDetailColumn: {
    flex: 1,
    gap: 4,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailTextSecondary: {
    fontSize: 12,
    color: '#94A3B8',
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  uploadIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadContent: {
    flex: 1,
    gap: 4,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  uploadSubtitle: {
    fontSize: 13,
    color: '#475569',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputGroupFull: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  modalCancelText: {
    color: '#475569',
    fontWeight: '600',
  },
  modalSave: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563EB',
  },
  modalSaveText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  syncStatusCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  syncStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncStatusIcon: {
    marginRight: 8,
  },
  syncStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  syncStatusRow: {
    gap: 12,
  },
  syncStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  syncStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginLeft: 8,
  },
  lastSyncTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  syncErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
  },
  syncErrorText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 6,
    flex: 1,
  },
});
