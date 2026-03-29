import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3020';
const USER_ID = 'default-user';

interface DailyInterviewSession {
  id: string;
  userId: string;
  date: string;
  primaryPrompt: string;
  followUpPrompt?: string;
  dynamicQuestions: string[];
  focusComponents: string[];
  status: 'pending' | 'completed';
  reason: string;
  createdAt: string;
  completedAt?: string;
}

interface InterviewAnswers {
  primaryResponse: string;
  followUpResponse: string;
  sleepHours: string;
  recoveryFeeling: string;
  stressLevel: string;
  jointPainLevel: string;
  adherenceLevel: string;
  notes: string;
}

const AgentInterviewScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<DailyInterviewSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [answers, setAnswers] = useState<InterviewAnswers>({
    primaryResponse: '',
    followUpResponse: '',
    sleepHours: '',
    recoveryFeeling: '',
    stressLevel: '',
    jointPainLevel: '',
    adherenceLevel: '',
    notes: '',
  });

  useEffect(() => {
    fetchTodayInterview();
  }, []);

  const fetchTodayInterview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/agent/interview/today/${USER_ID}`);
      const data = await response.json();

      if (data.success && data.data) {
        setSession(data.data);
        
        if (data.data.status === 'completed') {
          setCurrentStep(999);
        }
      } else {
        setError('No interview available today');
      }
    } catch (err) {
      setError('Failed to load interview');
      console.error('Interview fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!session) return;

    try {
      setSubmitting(true);
      setError(null);

      const submission = {
        primaryResponse: answers.primaryResponse,
        followUpResponse: answers.followUpResponse,
        recoveryCluster: {
          sleepHours: answers.sleepHours ? parseFloat(answers.sleepHours) : undefined,
          recoveryFeeling: answers.recoveryFeeling ? parseInt(answers.recoveryFeeling) : undefined,
          stressLevel: answers.stressLevel ? parseInt(answers.stressLevel) : undefined,
          jointPainLevel: answers.jointPainLevel ? parseInt(answers.jointPainLevel) : undefined,
          adherenceLevel: answers.adherenceLevel ? parseInt(answers.adherenceLevel) : undefined,
          notes: answers.notes || undefined,
        },
      };

      const response = await fetch(`${API_BASE_URL}/agent/interview/respond/${session.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success',
          'Your daily check-in has been submitted!',
          [
            {
              text: 'OK',
              onPress: () => {
                setCurrentStep(999);
                fetchTodayInterview();
              },
            },
          ]
        );
      } else {
        setError(data.error || 'Failed to submit interview');
      }
    } catch (err) {
      setError('Failed to submit interview');
      console.error('Interview submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderScaleButtons = (field: keyof InterviewAnswers, max: number, label: string) => {
    const value = answers[field];
    return (
      <View style={styles.scaleContainer}>
        <Text style={styles.scaleLabel}>{label}</Text>
        <View style={styles.scaleButtons}>
          {Array.from({ length: max }, (_, i) => i + 1).map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.scaleButton,
                value === String(num) && styles.scaleButtonActive,
              ]}
              onPress={() => setAnswers({ ...answers, [field]: String(num) })}
            >
              <Text
                style={[
                  styles.scaleButtonText,
                  value === String(num) && styles.scaleButtonTextActive,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStep = () => {
    if (!session) return null;

    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.promptText}>{session.primaryPrompt}</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Type your response here..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={6}
              value={answers.primaryResponse}
              onChangeText={(text) => setAnswers({ ...answers, primaryResponse: text })}
            />
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => setCurrentStep(1)}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );

      case 1:
        if (!session.followUpPrompt) {
          setCurrentStep(2);
          return null;
        }
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.promptText}>{session.followUpPrompt}</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Type your response here..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={6}
              value={answers.followUpResponse}
              onChangeText={(text) => setAnswers({ ...answers, followUpResponse: text })}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep(0)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setCurrentStep(2)}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>Daily Health Metrics</Text>
            <Text style={styles.sectionSubtitle}>Help us track your recovery and wellness</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sleep Duration (hours)</Text>
              <TextInput
                style={styles.numberInput}
                placeholder="7.5"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={answers.sleepHours}
                onChangeText={(text) => setAnswers({ ...answers, sleepHours: text })}
              />
            </View>

            {renderScaleButtons('recoveryFeeling', 5, 'How recovered do you feel? (1=Poor, 5=Excellent)')}
            {renderScaleButtons('stressLevel', 5, 'Current stress level? (1=Low, 5=High)')}
            {renderScaleButtons('jointPainLevel', 5, 'Any joint pain? (1=None, 5=Severe)')}
            {renderScaleButtons('adherenceLevel', 5, 'Overall adherence today? (1=Poor, 5=Perfect)')}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Any other observations or concerns..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={answers.notes}
                onChangeText={(text) => setAnswers({ ...answers, notes: text })}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep(session.followUpPrompt ? 1 : 0)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Check-In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 999:
        return (
          <View style={styles.completedContainer}>
            <Text style={styles.completedEmoji}>✅</Text>
            <Text style={styles.completedTitle}>Check-In Complete!</Text>
            <Text style={styles.completedSubtitle}>
              You've completed today's health check-in. Come back tomorrow for your next session.
            </Text>
            <TouchableOpacity
              style={styles.viewDashboardButton}
              onPress={() => {}}
            >
              <Text style={styles.viewDashboardButtonText}>View Dashboard</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading interview...</Text>
      </View>
    );
  }

  if (error && !session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>🤖</Text>
        <Text style={styles.errorTitle}>No Interview Available</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTodayInterview}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Check-In</Text>
        <Text style={styles.subtitle}>
          {session?.status === 'completed' ? 'Completed' : `Step ${currentStep + 1} of 3`}
        </Text>
      </View>

      {session?.status !== 'completed' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentStep + 1) / 3) * 100}%` }]} />
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {session && (
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Today's Focus</Text>
            <Text style={styles.contextReason}>{session.reason}</Text>
            {session.focusComponents.length > 0 && (
              <View style={styles.focusChips}>
                {session.focusComponents.map((component, index) => (
                  <View key={index} style={styles.focusChip}>
                    <Text style={styles.focusChipText}>{component}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {renderStep()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 14,
  },
  contextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  contextReason: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  focusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  focusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 26,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  numberInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  scaleContainer: {
    marginBottom: 20,
  },
  scaleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scaleButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scaleButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  scaleButtonTextActive: {
    color: '#2563EB',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  viewDashboardButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewDashboardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AgentInterviewScreen;
