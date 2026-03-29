import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const SettingsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Profile</Text>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>User ID</Text>
          <Text style={styles.settingValue}>default-user</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Daily Check-In Reminders</Text>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Agent Interview Reminders</Text>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Export Health Data</Text>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Delete All Data</Text>
          <Text style={[styles.settingValue, styles.dangerText]}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Version</Text>
          <Text style={styles.settingValue}>1.0.0 (V13)</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Spec Version</Text>
          <Text style={styles.settingValue}>Product Spec V13</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Personal Health & Performance Agent</Text>
        <Text style={styles.footerSubtext}>Powered by AI Intelligence Engines</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    marginTop: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
  },
  settingValue: {
    fontSize: 16,
    color: '#64748B',
  },
  dangerText: {
    color: '#EF4444',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default SettingsScreen;
