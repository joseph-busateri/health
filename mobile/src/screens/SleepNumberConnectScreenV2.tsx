import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, DEFAULT_USER_ID } from '../context/UserContext';
import { API_BASE_URL } from '../config';

/**
 * Sleep Number Connect Screen V2
 * 
 * Version 2 Changes:
 * - Integrated with UserContext for proper authentication
 * - Uses useUser() hook instead of hardcoded 'default-user'
 * - Handles loading state when userId is being loaded
 * - Validates userId before making API calls
 * - Graceful error handling when userId is unavailable
 */
export default function SleepNumberConnectScreenV2() {
  const { userId, isLoading: isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState<'daily' | 'twice_daily'>('daily');

  // Show loading state while userId is being loaded
  if (isUserLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading user profile...</Text>
      </View>
    );
  }

  // Validate userId before allowing actions
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

  const connectAccount = async () => {
    if (!validateUserId()) return;
    
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter your Sleep Number email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/sleep-number/${userId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Connection failed');
      }

      setConnected(true);

      Alert.alert(
        'Connected!',
        'Your Sleep Number account is now connected. Sleep data will automatically sync every day at 6 AM.',
        [
          {
            text: 'Great!',
            onPress: () => {
              // Navigate back or to dashboard
            },
          },
        ]
      );
    } catch (error) {
      console.error('Sleep Number connection error:', error);
      Alert.alert('Connection Failed', 'Failed to connect to Sleep Number. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectAccount = async () => {
    if (!validateUserId()) return;

    Alert.alert(
      'Disconnect Account',
      'Are you sure you want to disconnect your Sleep Number account? Automatic syncing will stop.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_BASE_URL}/api/devices/sleep-number/${userId}/disconnect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });

              const data = await response.json();

              if (!data.success) {
                throw new Error(data.error || 'Disconnect failed');
              }

              setConnected(false);
              setEmail('');
              setPassword('');
              Alert.alert('Disconnected', 'Your Sleep Number account has been disconnected.');
            } catch (error) {
              console.error('Sleep Number disconnect error:', error);
              Alert.alert('Error', 'Failed to disconnect account.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const triggerManualSync = async () => {
    if (!validateUserId()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/sleep-number/${userId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Sync failed');
      }
      
      Alert.alert(
        'Sync Complete',
        'Successfully synced your latest sleep data from Sleep Number.'
      );
    } catch (error) {
      console.error('Sleep Number sync error:', error);
      Alert.alert('Sync Failed', 'Failed to sync sleep data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (connected) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sleep Number Connected</Text>
          <Text style={styles.subtitle}>Automatic sync is active</Text>
        </View>

        {/* Connection Status */}
        <View style={styles.statusSection}>
          <View style={styles.statusIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          </View>
          <Text style={styles.statusTitle}>Account Connected</Text>
          <Text style={styles.statusEmail}>{email}</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="sync" size={16} color="#10b981" />
            <Text style={styles.statusBadgeText}>Auto-sync enabled</Text>
          </View>
        </View>

        {/* Sync Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Automatic Sync</Text>
              <Text style={styles.settingDescription}>
                Sync sleep data automatically every day
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, autoSyncEnabled && styles.toggleActive]}
              onPress={() => setAutoSyncEnabled(!autoSyncEnabled)}
            >
              <View style={[styles.toggleThumb, autoSyncEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sync Frequency</Text>
              <Text style={styles.settingDescription}>
                How often to sync your data
              </Text>
            </View>
            <View style={styles.frequencyButtons}>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  syncFrequency === 'daily' && styles.frequencyButtonActive,
                ]}
                onPress={() => setSyncFrequency('daily')}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    syncFrequency === 'daily' && styles.frequencyButtonTextActive,
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  syncFrequency === 'twice_daily' && styles.frequencyButtonActive,
                ]}
                onPress={() => setSyncFrequency('twice_daily')}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    syncFrequency === 'twice_daily' && styles.frequencyButtonTextActive,
                  ]}
                >
                  Twice Daily
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sync Time</Text>
              <Text style={styles.settingDescription}>
                6:00 AM daily
              </Text>
            </View>
            <Ionicons name="time" size={24} color="#6b7280" />
          </View>
        </View>

        {/* Manual Sync */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.syncButton, loading && styles.syncButtonDisabled]}
            onPress={triggerManualSync}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.syncButtonText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.syncHint}>
            Manually trigger a sync to get the latest sleep data
          </Text>
        </View>

        {/* Disconnect */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnectAccount}
          >
            <Ionicons name="unlink" size={20} color="#ef4444" />
            <Text style={styles.disconnectButtonText}>Disconnect Account</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoFooter}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoFooterText}>
            Your Sleep Number credentials are encrypted and stored securely. We only access your sleep data to sync it to your health profile.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connect Sleep Number</Text>
        <Text style={styles.subtitle}>Enable automatic sleep tracking</Text>
      </View>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="bed" size={48} color="#3b82f6" />
        </View>
        <Text style={styles.benefitsTitle}>Automatic Sleep Tracking</Text>
        <Text style={styles.benefitsText}>
          Connect your Sleep Number account to automatically sync your sleep data every day. No manual uploads needed!
        </Text>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.benefitText}>Daily automatic sync</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.benefitText}>No user interaction needed</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.benefitText}>Complete sleep history</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.benefitText}>Secure encrypted storage</Text>
          </View>
        </View>
      </View>

      {/* Login Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sleep Number Account</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.connectButton, loading && styles.connectButtonDisabled]}
          onPress={connectAccount}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="link" size={20} color="#fff" />
              <Text style={styles.connectButtonText}>Connect Account</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Security Notice */}
      <View style={styles.securitySection}>
        <Ionicons name="shield-checkmark" size={24} color="#10b981" />
        <Text style={styles.securityTitle}>Your Data is Secure</Text>
        <Text style={styles.securityText}>
          Your Sleep Number credentials are encrypted using AES-256 encryption and stored securely. We never share your login information with third parties.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  benefitsSection: {
    margin: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#eff6ff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  benefitsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    width: '100%',
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  passwordToggle: {
    padding: 12,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  connectButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  securitySection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    alignItems: 'center',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginTop: 8,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusSection: {
    margin: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIcon: {
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  toggle: {
    width: 48,
    height: 28,
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  frequencyButtonActive: {
    backgroundColor: '#3b82f6',
  },
  frequencyButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  frequencyButtonTextActive: {
    color: '#fff',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  syncHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disconnectButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  infoFooter: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    gap: 12,
  },
  infoFooterText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
});
