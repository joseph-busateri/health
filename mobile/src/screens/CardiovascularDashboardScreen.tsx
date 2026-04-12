import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { InsightsStackParamList } from '../types/navigation';

const mockCardioData = {
  score: 72,
  status: 'Stable',
  riskLevel: 'Moderate Risk',
  lastUpdated: 'Today, 6:15 AM',
  vitals: [
    { label: 'Resting HR', value: '58 bpm', trend: 'down', note: 'Improving compared to last week' },
    { label: 'HR Variability', value: '74 ms', trend: 'flat', note: 'Hold steady in deep sleep routines' },
    { label: 'Blood Pressure', value: '118 / 74', trend: 'down', note: 'In target range' },
    { label: 'VO2 Max', value: '46 ml/kg/min', trend: 'up', note: 'Improved after Zone 2 focus' },
  ],
  labs: [
    { marker: 'LDL Cholesterol', status: 'borderline', value: '102 mg/dL', note: 'Re-test in 6 weeks' },
    { marker: 'hs-CRP', status: 'normal', value: '0.7 mg/L', note: 'Inflammation low' },
    { marker: 'Triglycerides', status: 'normal', value: '92 mg/dL', note: 'Within optimal range' },
  ],
  actions: [
    'Add 3 x 20 min Zone 2 sessions this week',
    'Schedule fasting lipid panel with sexual health labs',
    'AI Coach: discuss morning dizziness and hydration',
  ],
};

const statusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Stable':
      return [styles.statusBadge, styles.statusStable];
    case 'Optimal':
      return [styles.statusBadge, styles.statusOptimal];
    case 'At Risk':
      return [styles.statusBadge, styles.statusRisk];
    default:
      return styles.statusBadge;
  }
};

const labStatusStyle = (status: string) => {
  switch (status) {
    case 'normal':
      return [styles.labBadge, styles.labNormal];
    case 'borderline':
      return [styles.labBadge, styles.labBorderline];
    case 'abnormal':
      return [styles.labBadge, styles.labAbnormal];
    default:
      return styles.labBadge;
  }
};

const CardiovascularDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<InsightsStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Cardiovascular Risk</Text>
          <Text style={styles.subtitle}>Heart health signals, labs, and daily actions</Text>
        </View>

        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>Current Score</Text>
            <Text style={styles.scoreValue}>{mockCardioData.score}</Text>
            <Text style={styles.lastUpdated}>Last updated {mockCardioData.lastUpdated}</Text>
          </View>
          <View style={styles.statusWrapper}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={statusBadgeStyle(mockCardioData.status)}>
              <Text style={styles.statusText}>{mockCardioData.status}</Text>
            </View>
            <Text style={styles.riskLevel}>{mockCardioData.riskLevel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Signals</Text>
          <View style={styles.card}>
            {mockCardioData.vitals.map(signal => (
              <View key={signal.label} style={styles.signalRow}>
                <View style={styles.signalHeader}>
                  <MaterialCommunityIcons name="heart-pulse" size={18} color="#EF4444" />
                  <Text style={styles.signalLabel}>{signal.label}</Text>
                </View>
                <Text style={styles.signalValue}>{signal.value}</Text>
                <Text style={styles.signalNote}>{signal.note}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Labs</Text>
          <View style={styles.card}>
            {mockCardioData.labs.map(lab => (
              <View key={lab.marker} style={styles.labRow}>
                <View style={styles.labHeader}>
                  <MaterialCommunityIcons name="test-tube" size={18} color="#2563EB" />
                  <Text style={styles.labMarker}>{lab.marker}</Text>
                </View>
                <View style={styles.labMeta}>
                  <Text style={styles.labValue}>{lab.value}</Text>
                  <View style={labStatusStyle(lab.status)}>
                    <Text style={styles.labStatusText}>{lab.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.labNote}>{lab.note}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions for Today</Text>
          <View style={styles.callout}>
            {mockCardioData.actions.map((action, index) => (
              <View key={`action-${index}`} style={styles.actionRow}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={18} color="#22C55E" />
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('VoiceInterview')}
            >
              <Text style={styles.ctaText}>Discuss with AI Coach</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
  },
  scoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0F172A',
  },
  lastUpdated: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
  },
  statusWrapper: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusOptimal: {
    backgroundColor: '#DCFCE7',
  },
  statusStable: {
    backgroundColor: '#FEF9C3',
  },
  statusRisk: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  riskLevel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  signalRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  signalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  signalNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  labRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  labHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labMarker: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  labMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  labValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  labBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  labNormal: {
    backgroundColor: '#DCFCE7',
  },
  labBorderline: {
    backgroundColor: '#FEF9C3',
  },
  labAbnormal: {
    backgroundColor: '#FEE2E2',
  },
  labStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  labNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  callout: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#E2E8F0',
    flex: 1,
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CardiovascularDashboardScreen;
