import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

const InterviewSelectorScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const interviewModes = [
    {
      id: 'voice',
      title: 'Voice Interview',
      description: 'Speak your responses naturally with voice recording',
      icon: '🎤',
      route: 'VoiceInterview' as const,
      features: ['Voice recording', 'AI transcription', 'Natural conversation'],
      recommended: true,
    },
    {
      id: 'agent',
      title: 'Agent Interview',
      description: 'Structured interview guided by AI agent',
      icon: '🤖',
      route: 'AgentInterview' as const,
      features: ['Guided questions', 'Context-aware', 'Structured format'],
      recommended: false,
    },
    {
      id: 'dynamic',
      title: 'Dynamic Interview',
      description: 'Questions adapt based on your responses',
      icon: '🔄',
      route: 'DynamicInterview' as const,
      features: ['Adaptive questions', 'Personalized flow', 'Smart branching'],
      recommended: false,
    },
    {
      id: 'hybrid',
      title: 'Hybrid Interview',
      description: 'Mix of predefined and AI-generated questions',
      icon: '⚡',
      route: 'HybridInterview' as const,
      features: ['Best of both worlds', 'Flexible format', 'Comprehensive'],
      recommended: false,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Interview Mode</Text>
        <Text style={styles.subtitle}>
          Select how you'd like to complete your daily check-in
        </Text>
      </View>

      {interviewModes.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={[
            styles.modeCard,
            mode.recommended && styles.modeCardRecommended,
          ]}
          onPress={() => navigation.navigate(mode.route)}
        >
          {mode.recommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>RECOMMENDED</Text>
            </View>
          )}
          
          <View style={styles.modeHeader}>
            <Text style={styles.modeIcon}>{mode.icon}</Text>
            <View style={styles.modeHeaderText}>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {mode.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.modeFooter}>
            <Text style={styles.startButton}>Start Interview →</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeCardRecommended: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modeIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  modeHeaderText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    color: '#2563EB',
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  modeFooter: {
    alignItems: 'flex-end',
  },
  startButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
});

export default InterviewSelectorScreen;
