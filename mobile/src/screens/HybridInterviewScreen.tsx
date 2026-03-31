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

interface Question {
  id: string;
  text: string;
  category: string;
  priority: number;
  source: 'static' | 'ai';
  expectedResponseTime?: number;
  quickResponses?: string[];
}

interface ConversationTurn {
  questionId: string;
  question: string;
  answer: string;
  timestamp: string;
  timeElapsed: number;
}

const HybridInterviewScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startInterview();
  }, []);

  useEffect(() => {
    if (sessionId && !isComplete) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionId, isComplete]);

  const startInterview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/hybrid-interview/start/${USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            recovery: { sleepHours: 7, sleepQuality: 3, status: 'Normal' },
            stress: { level: 'moderate' },
            workoutAdherence: 75,
            supplementAdherence: 80,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.data.sessionId);
        setCurrentQuestion(data.data.question);
        setTimeRemaining(data.data.timeRemaining);
      } else {
        setError(data.error || 'Failed to start interview');
      }
    } catch (err) {
      setError('Failed to start interview');
      console.error('Interview start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || !currentQuestion || !answer.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/hybrid-interview/answer/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          question: currentQuestion.text,
          answer: answer.trim(),
          category: currentQuestion.category,
          context: {
            recovery: { sleepHours: 7, sleepQuality: 3, status: 'Normal' },
            stress: { level: 'moderate' },
            workoutAdherence: 75,
            supplementAdherence: 80,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConversationHistory(prev => [
          ...prev,
          {
            questionId: currentQuestion.id,
            question: currentQuestion.text,
            answer: answer.trim(),
            timestamp: new Date().toISOString(),
            timeElapsed,
          },
        ]);

        setAnswer('');

        if (data.data.isComplete) {
          setIsComplete(true);
          setCurrentQuestion(null);
          Alert.alert(
            'Interview Complete!',
            `You answered ${data.data.summary.totalQuestions} questions in ${Math.floor(data.data.summary.totalTime / 60)}:${(data.data.summary.totalTime % 60).toString().padStart(2, '0')}.`,
            [{ text: 'OK' }]
          );
        } else {
          setCurrentQuestion(data.data.nextQuestion);
          setTimeRemaining(data.data.timeRemaining);
        }
      } else {
        setError(data.error || 'Failed to submit answer');
      }
    } catch (err) {
      setError('Failed to submit answer');
      console.error('Answer submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickResponse = (response: string) => {
    setAnswer(response);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Starting your daily check-in...</Text>
      </View>
    );
  }

  if (error && !sessionId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to Start</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={startInterview}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Check-In</Text>
        <View style={styles.headerStats}>
          <View style={styles.statBadge}>
            <Text style={styles.statLabel}>Questions</Text>
            <Text style={styles.statValue}>{conversationHistory.length}</Text>
          </View>
          <View style={[styles.statBadge, timeRemaining < 60 && styles.statBadgeWarning]}>
            <Text style={styles.statLabel}>Time Left</Text>
            <Text style={styles.statValue}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((180 - timeRemaining) / 180) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Previous Answers</Text>
            {conversationHistory.slice(-2).map((turn, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyQuestion}>Q: {turn.question}</Text>
                <Text style={styles.historyAnswer}>A: {turn.answer}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Current Question */}
        {currentQuestion && !isComplete && (
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionBadge}>
                {currentQuestion.source === 'ai' ? '🤖 AI' : '📋 Standard'}
              </Text>
              <Text style={styles.questionCategory}>{currentQuestion.category.replace(/_/g, ' ')}</Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.text}</Text>

            {/* Quick Responses */}
            {currentQuestion.quickResponses && currentQuestion.quickResponses.length > 0 && (
              <View style={styles.quickResponsesContainer}>
                <Text style={styles.quickResponsesLabel}>Quick responses:</Text>
                <View style={styles.quickResponsesGrid}>
                  {currentQuestion.quickResponses.map((response, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.quickResponseButton,
                        answer === response && styles.quickResponseButtonActive,
                      ]}
                      onPress={() => handleQuickResponse(response)}
                    >
                      <Text
                        style={[
                          styles.quickResponseText,
                          answer === response && styles.quickResponseTextActive,
                        ]}
                      >
                        {response}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Answer Input */}
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Your answer:</Text>
              <TextInput
                style={styles.answerInput}
                placeholder="Type your response here..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={answer}
                onChangeText={setAnswer}
                editable={!submitting}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!answer.trim() || submitting) && styles.submitButtonDisabled]}
              onPress={submitAnswer}
              disabled={!answer.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {conversationHistory.length >= 5 ? 'Finish' : 'Next Question'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Completion Screen */}
        {isComplete && (
          <View style={styles.completedContainer}>
            <Text style={styles.completedEmoji}>✅</Text>
            <Text style={styles.completedTitle}>Check-In Complete!</Text>
            <Text style={styles.completedSubtitle}>
              You answered {conversationHistory.length} questions in {formatTime(timeElapsed)}.
            </Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Areas Covered:</Text>
              <View style={styles.summaryChips}>
                {Array.from(new Set(conversationHistory.map(t => t.question.split(' ')[0]))).map(
                  (area, index) => (
                    <View key={index} style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>{area}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.doneButton} onPress={() => {}}>
              <Text style={styles.doneButtonText}>View Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Banner */}
        {error && sessionId && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  statBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
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
    padding: 20,
  },
  historySection: {
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#94A3B8',
  },
  historyQuestion: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  historyAnswer: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  questionCategory: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 26,
    marginBottom: 20,
  },
  quickResponsesContainer: {
    marginBottom: 20,
  },
  quickResponsesLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  quickResponsesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickResponseButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickResponseButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  quickResponseText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  quickResponseTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  answerSection: {
    marginBottom: 20,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  answerInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completedEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryChip: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  summaryChipText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HybridInterviewScreen;
