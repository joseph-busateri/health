import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';
import { initializeHealthKit, syncBloodPressure } from '../services/healthKitService';

export default function DevicesScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { userId } = useUser();
  const [syncing, setSyncing] = useState<{ [key: string]: boolean }>({});
  const [lastSync, setLastSync] = useState<{ [key: string]: string }>({});

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

    if (deviceId === 'bpMonitor') {
      try {
        await initializeHealthKit();
        const result = await syncBloodPressure(30);
        setLastSync(prev => ({ ...prev, [deviceId]: new Date().toLocaleTimeString() }));
        Alert.alert('Success', `Synced ${result.recordCount} blood pressure readings from Apple Health`);
      } catch (error: any) {
        Alert.alert('Sync Failed', error.message || 'Failed to sync blood pressure from Apple Health');
      }
      setSyncing({ ...syncing, [deviceId]: false });
      return;
    }

    setSyncing({ ...syncing, [deviceId]: true });

    try {
      if (deviceId === 'oura') {
        await healthApi.devices.oura.sync(userId);
      } else if (deviceId === 'appleWatch') {
        await healthApi.devices.appleWatch.sync(userId);
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
                      {device.id === 'bpMonitor' ? 'BP Monitor' : 'Sync Now'}
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
                    <Text style={styles.detailText}>Workouts, HRV, and activity rings</Text>
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
                    <Text style={styles.detailText}>Sync from Omron Evolv via Apple Health</Text>
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
            <MaterialCommunityIcons name="sync" size={24} color="#4CAF50" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>Auto-Sync Enabled</Text>
          </View>
          <Text style={styles.infoText}>
            All devices automatically sync daily at 6:00 AM. Use "Sync Now" to manually trigger a sync.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="link-variant" size={24} color="#FF9800" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>Connection Required</Text>
          </View>
          <Text style={styles.infoText}>
            To connect devices, you'll need to authorize each integration with your account credentials.
            Contact support for connection setup.
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
});
