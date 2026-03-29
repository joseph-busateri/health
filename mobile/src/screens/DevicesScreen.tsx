import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

export default function DevicesScreen() {
  const { userId } = useUser();
  const [syncing, setSyncing] = useState<{ [key: string]: boolean }>({});
  const [lastSync, setLastSync] = useState<{ [key: string]: string }>({});

  const devices = [
    { id: 'oura', name: 'Oura Ring', icon: '💍', color: '#FF6B6B' },
    { id: 'appleWatch', name: 'Apple Watch', icon: '⌚', color: '#007AFF' },
    { id: 'sleepNumber', name: 'Sleep Number', icon: '🛏️', color: '#4CAF50' },
  ];

  const syncDevice = async (deviceId: string) => {
    if (!userId) {
      Alert.alert('Error', 'Set your user ID in Settings first');
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
        <Text style={styles.message}>Set your user ID in Settings to manage devices</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device Integrations</Text>
        <Text style={styles.subtitle}>Sync your health devices</Text>
      </View>

      <ScrollView style={styles.list}>
        {devices.map((device) => (
          <View key={device.id} style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceIcon}>{device.icon}</Text>
                <View>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  {lastSync[device.id] && (
                    <Text style={styles.lastSync}>Last sync: {lastSync[device.id]}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.syncButton, { backgroundColor: device.color }]}
                onPress={() => syncDevice(device.id)}
                disabled={syncing[device.id]}
              >
                {syncing[device.id] ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.deviceDetails}>
              <Text style={styles.detailText}>
                {device.id === 'oura' && '📊 Sleep, readiness, and activity data'}
                {device.id === 'appleWatch' && '💪 Workouts, HRV, and activity rings'}
                {device.id === 'sleepNumber' && '😴 Sleep quality and duration'}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Auto-Sync Enabled</Text>
          <Text style={styles.infoText}>
            All devices automatically sync daily at 6:00 AM. Use "Sync Now" to manually trigger a sync.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔐 Connection Required</Text>
          <Text style={styles.infoText}>
            To connect devices, you'll need to authorize each integration with your account credentials.
            Contact support for connection setup.
          </Text>
        </View>
      </ScrollView>
    </View>
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
    minWidth: 100,
    alignItems: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  deviceDetails: {
    marginTop: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
    lineHeight: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
