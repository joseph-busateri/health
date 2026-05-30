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

const mockSexualHealth = {
  score: 68,
  status: 'Needs Review',
  focusAreas: ['Total Testosterone', 'Free Testosterone', 'DHEA-S'],
  lastLabDate: '32 days ago',
  hormoneSummary: [
    { marker: 'Total Testosterone', value: '512 ng/dL', status: 'borderline', trend: 'down', note: 'Below optimal for age' },
    { marker: 'Free Testosterone', value: '12.1 ng/dL', status: 'low', trend: 'flat', note: 'Support with supplementation' },
    { marker: 'SHBG', value: '34 nmol/L', status: 'normal', trend: 'up', note: 'Monitor with next lab draw' },
  ],
  recommendations: [
    'Schedule hormone panel re-test with fasting protocol',
    'AI Coach: review morning erection frequency & libido changes',
    'Add zinc and magnesium stack 1 hour before bed',
  ],
  readinessSteps: [
    'Keep consistent sleep window for 7 nights',
    'Limit alcohol intake before lab draw',
    'Log subjective libido score daily',
  ],
};

const statusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Optimal':
      return [styles.statusBadge, styles.statusOptimal];
    case 'Needs Review':
      return [styles.statusBadge, styles.statusReview];
    case 'Urgent':
      return [styles.statusBadge, styles.statusUrgent];
    default:
      return styles.statusBadge;
  }
};

const markerStatusBadge = (status: string) => {
  switch (status) {
    case 'normal':
      return [styles.markerBadge, styles.markerNormal];
    case 'borderline':
      return [styles.markerBadge, styles.markerBorderline];
    case 'low':
    case 'high':
      return [styles.markerBadge, styles.markerOutOfRange];
    default:
      return styles.markerBadge;
  }
};

const SexualHealthDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<InsightsStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Sexual Health Focus</Text>
          <Text style={styles.subtitle}>Hormones, vitality markers, and action plan</Text>
        </View>

        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>Current Score</Text>
            <Text style={styles.scoreValue}>{mockSexualHealth.score}</Text>
            <Text style={styles.lastLab}>Last labs {mockSexualHealth.lastLabDate}</Text>
          </View>
          <View style={styles.statusWrapper}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={statusBadgeStyle(mockSexualHealth.status)}>
              <Text style={styles.statusText}>{mockSexualHealth.status}</Text>
            </View>
            <Text style={styles.focusLabel}>Focus markers</Text>
            <Text style={styles.focusText}>{mockSexualHealth.focusAreas.join(', ')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hormone Snapshot</Text>
          <View style={styles.card}>
            {mockSexualHealth.hormoneSummary.map(hormone => (
              <View key={hormone.marker} style={styles.markerRow}>
                <View style={styles.markerHeader}>
                  <MaterialCommunityIcons name="test-tube" size={18} color="#A855F7" />
                  <Text style={styles.markerName}>{hormone.marker}</Text>
                </View>
                <View style={styles.markerMeta}>
                  <Text style={styles.markerValue}>{hormone.value}</Text>
                  <View style={markerStatusBadge(hormone.status)}>
                    <Text style={styles.markerStatusText}>{hormone.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.markerNote}>{hormone.note}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Actions</Text>
          <View style={styles.callout}>
            {mockSexualHealth.recommendations.map((item, idx) => (
              <View key={`rec-${idx}`} style={styles.actionRow}>
                <MaterialCommunityIcons name="clipboard-pulse" size={18} color="#F97316" />
                <Text style={styles.actionText}>{item}</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Readiness Checklist</Text>
          <View style={styles.card}>
            {mockSexualHealth.readinessSteps.map((step, idx) => (
              <View key={`step-${idx}`} style={styles.stepRow}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={18} color="#22C55E" />
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
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
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  subtitle: {
    fontSize: 16,
    color: '#9F1239',
  },
  scoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#7F1D1D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#9F1239',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  lastLab: {
    marginTop: 8,
    fontSize: 12,
    color: '#BE123C',
  },
  statusWrapper: {
    alignItems: 'flex-end',
    maxWidth: '45%',
  },
  statusLabel: {
    fontSize: 12,
    color: '#9F1239',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusOptimal: {
    backgroundColor: '#F0FDF4',
  },
  statusReview: {
    backgroundColor: '#FEF3C7',
  },
  statusUrgent: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  focusLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#9F1239',
  },
  focusText: {
    marginTop: 6,
    fontSize: 12,
    color: '#BE123C',
    lineHeight: 18,
    textAlign: 'right',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#7F1D1D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  markerRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingBottom: 12,
    marginBottom: 12,
  },
  markerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F1D1D',
  },
  markerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  markerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F1D1D',
  },
  markerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  markerNormal: {
    backgroundColor: '#DCFCE7',
  },
  markerBorderline: {
    backgroundColor: '#FEF9C3',
  },
  markerOutOfRange: {
    backgroundColor: '#FEE2E2',
  },
  markerStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  markerNote: {
    fontSize: 12,
    color: '#9F1239',
    marginTop: 6,
  },
  callout: {
    backgroundColor: '#7F1D1D',
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
    color: '#FDE68A',
    flex: 1,
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 8,
    backgroundColor: '#FACC15',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  ctaText: {
    color: '#7F1D1D',
    fontWeight: '700',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepText: {
    fontSize: 14,
    color: '#7F1D1D',
    flex: 1,
    lineHeight: 20,
  },
});

export default SexualHealthDashboardScreen;
