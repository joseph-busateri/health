import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DEFAULT_USER_ID, useUser } from '../context/UserContext';

import type { HomeStackParamList, InsightsStackParamList } from '../types/navigation';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type QuickAction = {
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  onPress: () => void;
};

type OverallComponent = {
  key: string;
  title: string;
  score: string;
  source: string;
  detail: string;
  icon: IconName;
  color: string;
};

type TimelineItem = {
  headline: string;
  detail: string;
  icon: IconName;
  color: string;
};

const fonts = {
  regular: Platform.OS === 'ios' ? 'AvenirNext-Regular' : Platform.OS === 'android' ? 'sans-serif' : 'System',
  medium: Platform.OS === 'ios' ? 'AvenirNext-Medium' : Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
  semibold: Platform.OS === 'ios' ? 'AvenirNext-DemiBold' : Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
  bold: Platform.OS === 'ios' ? 'AvenirNext-Bold' : Platform.OS === 'android' ? 'sans-serif-bold' : 'System',
  heavy: Platform.OS === 'ios' ? 'AvenirNext-Heavy' : Platform.OS === 'android' ? 'sans-serif-black' : 'System',
};

const heroShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0px 14px 24px rgba(31, 41, 55, 0.3)' }
    : {
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
      };

const actionCardShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0px 10px 16px rgba(15, 23, 42, 0.08)' }
    : {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
      };

const componentCardShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0px 10px 14px rgba(15, 23, 42, 0.07)' }
    : {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
        elevation: 4,
      };

const timelineCardShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0px 12px 18px rgba(15, 23, 42, 0.07)' }
    : {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.07,
        shadowRadius: 18,
        elevation: 6,
      };

export default function ModernHomeScreen() {
  const [loading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList & InsightsStackParamList>>();
  const { userId } = useUser();
  const resolvedUserId = userId ?? DEFAULT_USER_ID;

  const overallScore = 85;

  const overallComponents: OverallComponent[] = [
    {
      key: 'recovery',
      title: 'Recovery',
      score: '78',
      source: 'Sleep debt eased 45 minutes',
      detail: 'Sleep debt eased 45 minutes',
      icon: 'bed-outline',
      color: '#38BDF8',
    },
    {
      key: 'cardiovascular',
      title: 'Cardiovascular',
      score: '72',
      source: 'Resting HR slightly elevated',
      detail: 'Resting HR slightly elevated',
      icon: 'heart-pulse',
      color: '#F87171',
    },
    {
      key: 'metabolic',
      title: 'Metabolic',
      score: '75',
      source: 'Macros tracked 6/7 days',
      detail: 'Macros tracked 6/7 days',
      icon: 'fire',
      color: '#FB923C',
    },
    {
      key: 'performance',
      title: 'Performance',
      score: '74',
      source: 'Keep joints happy with rehab work',
      detail: 'Keep joints happy with rehab work',
      icon: 'run-fast',
      color: '#22C55E',
    },
    {
      key: 'sexualHealth',
      title: 'Sexual Health',
      score: '82',
      source: 'Mood & libido steady',
      detail: 'Mood & libido steady',
      icon: 'gender-male-female',
      color: '#C084FC',
    },
  ];

  const getComponentPressHandler = (componentKey: string): (() => void) | undefined => {
    switch (componentKey) {
      case 'recovery':
        return () => navigation.navigate('RecoveryStatus', { userId: resolvedUserId });
      case 'cardiovascular':
        return () => navigation.navigate('CardiovascularDashboard');
      case 'metabolic':
        return () => navigation.navigate('InsightsHome');
      case 'performance':
        return () => navigation.navigate('JointHealthStatus', { userId: resolvedUserId });
      case 'sexualHealth':
        return () => navigation.navigate('SexualHealthDashboard');
      default:
        return undefined;
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Cardiovascular Risk',
      subtitle: '10-year CVD risk assessment',
      icon: 'heart-pulse',
      color: '#EF4444',
      onPress: () => navigation.navigate('ActuarialRisk' as any),
    },
    {
      title: 'Today\'s Workout',
      subtitle: 'View today\'s plan',
      icon: 'calendar-today',
      color: '#10B981',
      onPress: () => {
        navigation.navigate('WorkoutToday', { userId: resolvedUserId });
      },
    },
    {
      title: 'View supplements',
      subtitle: 'Current stack & recommendations',
      icon: 'pill',
      color: '#059669',
      onPress: () => navigation.navigate('SupplementRecommendations', { userId: resolvedUserId }),
    },
    {
      title: 'Review recommendations',
      subtitle: 'Approve or reject AI guidance',
      icon: 'lightbulb-on-outline',
      color: '#0EA5E9',
      onPress: () => navigation.navigate('Recommendations'),
    },
  ];

  const healthTimeline: TimelineItem[] = [
    {
      headline: 'Stress load softened',
      detail: 'HRV rose 6% compared with last week’s average.',
      icon: 'trending-up',
      color: '#38BDF8',
    },
    {
      headline: 'Rehab momentum',
      detail: 'Shoulder mobility sessions checked off 3/3 days.',
      icon: 'arm-flex',
      color: '#10B981',
    },
    {
      headline: 'Coach insight',
      detail: 'AI suggests adding vitamin D on overcast mornings.',
      icon: 'lightbulb-on',
      color: '#FACC15',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Settling in your dashboard…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <LinearGradient
          colors={["#312E81", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroChip}>
              <MaterialCommunityIcons name="clock-check" size={14} color="#C4B5FD" />
              <Text style={styles.heroChipText}>Last check-in · 7:30 am</Text>
            </View>
          </View>
          <View style={styles.heroScoreRow}>
            <View>
              <Text style={styles.heroScoreValue}>{overallScore}</Text>
              <Text style={styles.heroScoreLabel}>Overall readiness</Text>
            </View>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="trending-up" size={18} color="#22C55E" />
              <Text style={styles.heroBadgeText}>Steady upswing</Text>
            </View>
          </View>
          <Text style={styles.heroNarrative}>
            Sleep recovered nicely and cardiovascular load is balanced. Keep water and protein steady to stay in the groove.
          </Text>
          <TouchableOpacity
            style={styles.heroAction}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('VoiceInterview')}
          >
            <MaterialCommunityIcons name="account-voice" size={20} color="#312E81" />
            <Text style={styles.heroActionText}>Check in with the AI coach</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overall readiness breakdown</Text>
            <Text style={styles.sectionSubtitle}>How the system scores your 85 today</Text>
          </View>
          <View style={styles.componentList}>
            {overallComponents.map(component => {
              const pressHandler = getComponentPressHandler(component.key);

              return (
                <OverallComponentCard
                  key={component.key}
                  component={component}
                  onPress={pressHandler}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <Text style={styles.sectionSubtitle}>Stay on top of the essentials</Text>
          </View>
          <View style={styles.actionGrid}>
            {quickActions.map(action => (
              <QuickActionCard key={action.title} action={action} />
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health timeline</Text>
            <Text style={styles.sectionSubtitle}>What moved the needle this week</Text>
          </View>
          <View style={styles.timelineCard}>
            {healthTimeline.map(item => (
              <View key={item.headline} style={styles.timelineRow}>
                <View style={[styles.timelineIconWrap, { backgroundColor: `${item.color}1A` }]}>
                  {/* 1A approx 10% */}
                  <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={styles.timelineTextWrap}>
                  <Text style={styles.timelineHeadline}>{item.headline}</Text>
                  <Text style={styles.timelineDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const QuickActionCard = ({ action }: { action: QuickAction }) => (
  <TouchableOpacity
    style={styles.actionCard}
    activeOpacity={0.85}
    onPress={action.onPress}
  >
    <View style={[styles.actionIconWrap, { backgroundColor: `${action.color}1A` }]}>
      <MaterialCommunityIcons name={action.icon} size={20} color={action.color} />
    </View>
    <View style={styles.actionTextGroup}>
      <Text style={styles.actionTitle}>{action.title}</Text>
      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(15, 23, 42, 0.4)" />
  </TouchableOpacity>
);

const OverallComponentCard = ({
  component,
  onPress,
}: {
  component: OverallComponent;
  onPress?: () => void;
}) => {
  const content = (
    <View style={styles.componentCardContent}>
      <View style={[styles.componentIconWrap, { backgroundColor: `${component.color}1A` }]}> 
        <MaterialCommunityIcons name={component.icon} size={20} color={component.color} />
      </View>
      <View style={styles.componentTextGroup}>
        <Text style={styles.componentTitle}>{component.title}</Text>
        <Text style={styles.componentSource}>{component.source}</Text>
        <Text style={styles.componentDetail}>{component.detail}</Text>
      </View>
      <Text style={[styles.componentScore, { color: component.color }]}>{component.score}</Text>
    </View>
  );

  if (!onPress) {
    return <View style={styles.componentCard}>{content}</View>;
  }

  return (
    <TouchableOpacity style={styles.componentCard} activeOpacity={0.85} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 28,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontFamily: fonts.semibold,
  },
  heroCard: {
    borderRadius: 28,
    padding: 16,
    gap: 12,
    ...heroShadow,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroGreeting: {
    color: '#E0E7FF',
    fontSize: 16,
    fontFamily: fonts.medium,
    letterSpacing: 0.3,
  },
  heroChip: {
    backgroundColor: 'rgba(99,102,241,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroChipText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontFamily: fonts.regular,
    letterSpacing: 0.4,
  },
  heroScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroScoreValue: {
    fontSize: 48,
    color: '#F9FAFB',
    fontFamily: fonts.heavy,
    letterSpacing: -1,
  },
  heroScoreLabel: {
    color: 'rgba(226,232,240,0.85)',
    fontSize: 14,
    fontFamily: fonts.regular,
    marginTop: -4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroBadgeText: {
    color: '#DCFCE7',
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  heroNarrative: {
    color: '#E0E7FF',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  heroAction: {
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
  },
  heroActionText: {
    color: '#312E81',
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  sectionBlock: {
    gap: 16,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontFamily: fonts.heavy,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: '#475569',
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  sectionMeta: {
    color: '#6366F1',
    fontSize: 12,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  actionGrid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...actionCardShadow,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextGroup: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontFamily: fonts.semibold,
  },
  actionSubtitle: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  componentList: {
    gap: 12,
  },
  componentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...componentCardShadow,
  },
  componentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  componentIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  componentTextGroup: {
    flex: 1,
    gap: 4,
  },
  componentTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontFamily: fonts.semibold,
  },
  componentSource: {
    color: '#6366F1',
    fontSize: 12,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  componentDetail: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  componentScore: {
    fontSize: 22,
    fontFamily: fonts.heavy,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    gap: 14,
    ...timelineCardShadow,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTextWrap: {
    flex: 1,
    gap: 4,
  },
  timelineHeadline: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  timelineDetail: {
    color: '#475569',
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
  },
});
