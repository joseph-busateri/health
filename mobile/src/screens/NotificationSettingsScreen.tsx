import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import api from '../services/api';
import {
  cancelAllNotifications,
  requestNotificationPermissions,
  scheduleDailyCheckInNotification,
} from '../services/notificationManager';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

const USER_ID = 'demo-user-123';

const NotificationSettingsScreen: React.FC<Props> = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyCheckInEnabled, setDailyCheckInEnabled] = useState(true);
  const [preferredReminderTime, setPreferredReminderTime] = useState('09:00');
  const [permissionGranted, setPermissionGranted] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ success: boolean; data: { dailyCheckInEnabled: boolean; preferredReminderTime: string } }>(`/notifications/${USER_ID}/settings`);
      setDailyCheckInEnabled(response.data.data.dailyCheckInEnabled);
      setPreferredReminderTime(response.data.data.preferredReminderTime);

      const hasPermission = await requestNotificationPermissions();
      setPermissionGranted(hasPermission);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggleDailyCheckIn = async (value: boolean) => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/notifications/${USER_ID}/settings`, {
        dailyCheckInEnabled: value,
      });

      if (value) {
        await scheduleDailyCheckInNotification(USER_ID, preferredReminderTime);
      } else {
        await cancelAllNotifications();
      }

      setDailyCheckInEnabled(value);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (time: string) => {
    setPreferredReminderTime(time);
  };

  const handleSaveTime = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/notifications/${USER_ID}/settings`, {
        preferredReminderTime,
      });

      if (dailyCheckInEnabled) {
        await cancelAllNotifications();
        await scheduleDailyCheckInNotification(USER_ID, preferredReminderTime);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to update time');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notification Settings</Text>

      {!permissionGranted && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>Notification permissions not granted. Enable in device settings.</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Check-In Reminder</Text>
            <Text style={styles.settingDescription}>Get a daily reminder to complete your health check-in</Text>
          </View>
          <Switch
            value={dailyCheckInEnabled}
            onValueChange={handleToggleDailyCheckIn}
            disabled={saving || !permissionGranted}
          />
        </View>
      </View>

      {dailyCheckInEnabled && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferred Reminder Time</Text>
          <View style={styles.timeSelector}>
            {['07:00', '08:00', '09:00', '10:00', '18:00', '19:00', '20:00'].map(time => (
              <TouchableOpacity
                key={time}
                style={[styles.timeButton, preferredReminderTime === time && styles.timeButtonActive]}
                onPress={() => handleTimeChange(time)}
                disabled={saving}
              >
                <Text style={[styles.timeButtonText, preferredReminderTime === time && styles.timeButtonTextActive]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveTime} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Time'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About Notifications</Text>
        <Text style={styles.infoText}>
          Daily check-ins help the AI agent understand your recovery, stress, and readiness to provide personalized
          workout and health recommendations.
        </Text>
        <Text style={styles.infoText}>
          If you miss a check-in, you'll receive a gentle follow-up reminder 4 hours later.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#111827' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  settingDescription: { fontSize: 13, color: '#6B7280' },
  timeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  timeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  timeButtonActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  timeButtonText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  timeButtonTextActive: { color: '#FFFFFF' },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  infoText: { fontSize: 14, color: '#4B5563', marginBottom: 8, lineHeight: 20 },
  warningCard: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, marginBottom: 12 },
  warningText: { fontSize: 14, color: '#92400E', fontWeight: '500' },
  errorCard: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 12 },
  errorText: { fontSize: 14, color: '#991B1B', fontWeight: '500' },
});

export default NotificationSettingsScreen;
