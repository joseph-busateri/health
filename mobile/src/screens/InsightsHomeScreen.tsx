import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { InsightsStackParamList } from '../types/navigation';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type QuickWin = {
  title: string;
  summary: string;
  icon: IconName;
  color: string;
};

type MicroPractice = {
  title: string;
  description: string;
  cue: string;
};

const mockInsights = {
  cardiovascular: {
    score: 72,
    status: 'Stable',
    risk: 'Moderate',
    highlights: ['HRV slightly below baseline', 'LDL trending down 5%'],
  },
  sexualHealth: {
    score: 68,
    status: 'Needs Review',
    hormoneFocus: ['Total Testosterone', 'DHEA-S'],
  },
  recommendations: [
    {
      id: 'rec-1',
      priority: 'HIGH',
      title: 'Schedule fasting labs to confirm hormone levels',
      category: 'Sexual Health',
    },
    {
      id: 'rec-2',
      priority: 'MED',
      title: 'Add 15 min Zone 2 cardio 3x this week',
      category: 'Cardiovascular',
    },
    {
      id: 'rec-3',
      priority: 'LOW',
      title: 'Discuss morning fatigue during AI interview',
      category: 'AI Coach',
    },
  ],
};

const quickWins: QuickWin[] = [
  {
    title: 'Protein + hydration',
    summary: 'Add 25g protein at lunch and finish 32oz of water before 2pm.',
    icon: 'cup-water',
    color: '#0EA5E9',
  },
  {
    title: 'Mobilize hips & spine',
    summary: 'Two 90-second flows between meetings to keep joints happy.',
    icon: 'human-handsup',
    color: '#8B5CF6',
  },
  {
    title: 'Wind-down ritual',
    summary: 'Dim lights + breathing ladder 20 minutes before bed.',
    icon: 'weather-night',
    color: '#F97316',
  },
];

const microPractices: MicroPractice[] = [
  {
    title: '1-minute grounding',
    description: 'Hand on chest, inhale 4 / exhale 6 for five rounds.',
    cue: 'Morning cue',
  },
  {
    title: 'Post-training fuel',
    description: 'Shake + banana within 30 minutes to support recovery.',
    cue: 'After workout',
  },
  {
    title: 'Screens off',
    description: 'Power down devices 60 minutes before bed.',
    cue: 'Tonight',
  },
];

const InsightsHomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<InsightsStackParamList>>();

  const navigateToCardio = () => navigation.navigate('CardiovascularDashboard');
  const navigateToSexualHealth = () => navigation.navigate('SexualHealthDashboard');
  const navigateToControlTower = () => navigation.navigate('ControlTower');
  const navigateToHealthDataHub = () => navigation.navigate('HealthDataHub');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Insights Hub</Text>
          <Text style={styles.subtitle}>Review readiness signals, quick wins, and deeper recommendations in one place.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessRow}>
            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={navigateToControlTower}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIconWrap, { backgroundColor: '#3B82F61A' }]}>
                <MaterialCommunityIcons name="view-dashboard" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.quickAccessTitle}>Control Tower</Text>
              <Text style={styles.quickAccessSubtitle}>AI health operating system</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={navigateToHealthDataHub}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIconWrap, { backgroundColor: '#10B9811A' }]}>
                <MaterialCommunityIcons name="database" size={24} color="#10B981" />
              </View>
              <Text style={styles.quickAccessTitle}>Health Data Hub</Text>
              <Text style={styles.quickAccessSubtitle}>Manage all health inputs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Highlights</Text>
          <View style={styles.highlightCard}>
            <Text style={styles.highlightHeader}>Cardiovascular Signals</Text>
            {mockInsights.cardiovascular.highlights.map((item, idx) => (
              <View key={`cardio-${idx}`} style={styles.highlightRow}>
                <MaterialCommunityIcons name="chart-line" size={18} color="#2563EB" />
                <Text style={styles.highlightText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.highlightCard}>
            <Text style={styles.highlightHeader}>Sexual Health Focus</Text>
            {mockInsights.sexualHealth.hormoneFocus.map((marker, idx) => (
              <View key={`sh-${idx}`} style={styles.highlightRow}>
                <MaterialCommunityIcons name="test-tube" size={18} color="#A855F7" />
                <Text style={styles.highlightText}>{marker}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Tiny Wins</Text>
            <Text style={styles.sectionMeta}>@ 2 minutes each</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickWinRow}
          >
            {quickWins.map(item => (
              <QuickWinCard key={item.title} item={item} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Micro-practices</Text>
          <Text style={styles.sectionSubtitle}>Drop these into natural moments</Text>
          <View style={styles.practiceList}>
            {microPractices.map(practice => (
              <MicroPracticeCard key={practice.title} practice={practice} />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const QuickWinCard = ({ item }: { item: QuickWin }) => (
  <View style={[styles.quickWinCard, { borderColor: item.color }]}> 
    <View style={[styles.quickWinIconWrap, { backgroundColor: `${item.color}1A` }]}> 
      <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
    </View>
    <Text style={styles.quickWinTitle}>{item.title}</Text>
    <Text style={styles.quickWinSummary}>{item.summary}</Text>
  </View>
);

const MicroPracticeCard = ({ practice }: { practice: MicroPractice }) => (
  <View style={styles.practiceCard}>
    <View>
      <Text style={styles.practiceCue}>{practice.cue}</Text>
      <Text style={styles.practiceTitle}>{practice.title}</Text>
      <Text style={styles.practiceDescription}>{practice.description}</Text>
    </View>
    <TouchableOpacity style={styles.practiceButton} activeOpacity={0.85}>
      <Text style={styles.practiceButtonLabel}>Mark done</Text>
    </TouchableOpacity>
  </View>
);

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
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginTop: 4,
  },
  interviewCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  interviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interviewIcon: {
    marginRight: 16,
  },
  interviewTextWrapper: {
    flex: 1,
  },
  interviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#312E81',
  },
  interviewSubtitle: {
    fontSize: 14,
    color: '#4338CA',
    marginTop: 6,
  },
  interviewCta: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  highlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  highlightHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  highlightText: {
    fontSize: 14,
    color: '#475569',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionMeta: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  quickWinRow: {
    gap: 14,
    paddingRight: 4,
  },
  quickWinCard: {
    width: 220,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  quickWinIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickWinTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  quickWinSummary: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  practiceList: {
    gap: 12,
    marginTop: 12,
  },
  practiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  practiceCue: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  practiceTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  practiceDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  practiceButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  practiceButtonLabel: {
    color: '#4338CA',
    fontSize: 13,
    fontWeight: '600',
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAccessIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickAccessTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  quickAccessSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
});

export default InsightsHomeScreen;
