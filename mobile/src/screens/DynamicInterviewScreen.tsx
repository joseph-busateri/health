import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import api from '../services/api';
import { useUser } from '../context/UserContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Agent'>;

interface Message {
  id: string;
  type: 'question' | 'answer' | 'system';
  text: string;
  timestamp: string;
  quickResponses?: string[];
}

interface QuestionCandidate {
  id: string;
  text: string;
  quickResponses?: string[];
  expectsFreeText: boolean;
}

const DynamicInterviewScreen: React.FC<Props> = ({ navigation }) => {
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionCandidate | null>(null);
  const [freeTextInput, setFreeTextInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const startInterview = useCallback(async () => {
    if (!userId) {
      setMessages([{
        id: 'error',
        type: 'system',
        text: 'Please set your user ID in Settings',
        timestamp: new Date().toISOString(),
      }]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const contextResponse = await api.get(`/dashboard/${userId}/summary`);
      const context = contextResponse.data.data;

      const response = await api.post<{ success: boolean; data: { sessionId: string; firstQuestion: QuestionCandidate } }>('/interview/start', {
        userId: userId,
        context: {
          userId: userId,
          recovery: context.latestLog ? {
            score: context.recoveryScore,
            sleepHours: context.latestLog.sleepHours,
            sleepQuality: 3,
            recoveryFeeling: context.latestLog.recoveryFeeling,
          } : undefined,
          stress: context.latestLog ? {
            level: context.latestLog.stressLevel > 7 ? 'high' : context.latestLog.stressLevel > 4 ? 'moderate' : 'low',
            sources: [],
            trend: 'stable',
          } : undefined,
          workoutAdherence: context.latestLog?.workoutAdherence,
        },
      });

      setSessionId(response.data.data.sessionId);
      setCurrentQuestion(response.data.data.firstQuestion);

      if (response.data.data.firstQuestion) {
        setMessages([{
          id: '1',
          type: 'question',
          text: response.data.data.firstQuestion.text,
          timestamp: new Date().toISOString(),
          quickResponses: response.data.data.firstQuestion.quickResponses,
        }]);
      }
    } catch (err: any) {
      console.error('Failed to start interview:', err);
      setMessages([{
        id: 'error',
        type: 'system',
        text: 'Failed to start interview. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startInterview();
  }, [startInterview]);

  const submitAnswer = async (answer: string) => {
    if (!sessionId || !currentQuestion) return;

    const answerMessage: Message = {
      id: `answer-${Date.now()}`,
      type: 'answer',
      text: answer,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, answerMessage]);
    setFreeTextInput('');
    setLoading(true);

    try {
      const contextResponse = await api.get(`/dashboard/${userId}/summary`);
      const context = contextResponse.data.data;

      const response = await api.post<{
        success: boolean;
        data: {
          followUpDecision: {
            shouldAskFollowUp: boolean;
            nextQuestion?: QuestionCandidate;
            reason: string;
          };
        };
      }>(`/interview/${sessionId}/response`, {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer,
        context: {
          userId: userId,
          recovery: context.latestLog ? {
            score: context.recoveryScore,
            sleepHours: context.latestLog.sleepHours,
            sleepQuality: 3,
            recoveryFeeling: context.latestLog.recoveryFeeling,
          } : undefined,
          stress: context.latestLog ? {
            level: context.latestLog.stressLevel > 7 ? 'high' : context.latestLog.stressLevel > 4 ? 'moderate' : 'low',
            sources: [],
            trend: 'stable',
          } : undefined,
          workoutAdherence: context.latestLog?.workoutAdherence,
        },
      });

      const followUpDecision = response.data.data.followUpDecision;

      if (followUpDecision.shouldAskFollowUp && followUpDecision.nextQuestion) {
        setCurrentQuestion(followUpDecision.nextQuestion);
        setMessages(prev => [...prev, {
          id: `question-${Date.now()}`,
          type: 'question',
          text: followUpDecision.nextQuestion!.text,
          timestamp: new Date().toISOString(),
          quickResponses: followUpDecision.nextQuestion!.quickResponses,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: 'final',
          type: 'question',
          text: 'Is there anything else you want to add?',
          timestamp: new Date().toISOString(),
        }]);
        setCurrentQuestion({
          id: 'final_question',
          text: 'Is there anything else you want to add?',
          expectsFreeText: true,
        });
      }
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      setMessages(prev => [...prev, {
        id: 'error',
        type: 'system',
        text: 'Failed to process your response. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const finalizeInterview = async (finalAnswer?: string) => {
    if (!sessionId) return;

    if (finalAnswer) {
      const answerMessage: Message = {
        id: `answer-${Date.now()}`,
        type: 'answer',
        text: finalAnswer,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, answerMessage]);
    }

    setLoading(true);

    try {
      const contextResponse = await api.get(`/dashboard/${userId}/summary`);
      const context = contextResponse.data.data;

      const response = await api.post<{ success: boolean; data: any }>(`/interview/${sessionId}/finalize`, {
        context: {
          userId: userId,
          recovery: context.latestLog ? {
            score: context.recoveryScore,
            sleepHours: context.latestLog.sleepHours,
            sleepQuality: 3,
            recoveryFeeling: context.latestLog.recoveryFeeling,
          } : undefined,
        },
        reason: 'user_ended',
      });

      setSummary(response.data.data);
      setIsComplete(true);
      setMessages(prev => [...prev, {
        id: 'complete',
        type: 'system',
        text: 'Interview complete! Thank you for sharing.',
        timestamp: new Date().toISOString(),
      }]);
    } catch (err: any) {
      console.error('Failed to finalize interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickResponse = (response: string) => {
    submitAnswer(response);
  };

  const handleFreeTextSubmit = () => {
    if (freeTextInput.trim()) {
      if (currentQuestion?.id === 'final_question') {
        if (freeTextInput.toLowerCase().includes('no') || freeTextInput.toLowerCase().includes('nothing')) {
          finalizeInterview();
        } else {
          finalizeInterview(freeTextInput);
        }
      } else {
        submitAnswer(freeTextInput);
      }
    }
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Starting your check-in...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        ref={ref => ref?.scrollToEnd({ animated: true })}
      >
        {messages.map(message => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.type === 'answer' ? styles.answerBubble : styles.questionBubble,
              message.type === 'system' && styles.systemBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.type === 'answer' && styles.answerText,
                message.type === 'system' && styles.systemText,
              ]}
            >
              {message.text}
            </Text>
            {message.quickResponses && message.id === messages[messages.length - 1].id && !isComplete && (
              <View style={styles.quickResponsesContainer}>
                {message.quickResponses.map((qr, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickResponseButton}
                    onPress={() => handleQuickResponse(qr)}
                    disabled={loading}
                  >
                    <Text style={styles.quickResponseText}>{qr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        )}

        {isComplete && summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Interview Summary</Text>
            <Text style={styles.summaryText}>Questions: {summary.totalQuestions}</Text>
            <Text style={styles.summaryText}>Signal Quality: {summary.signalQuality}</Text>
            {summary.keyInsights && summary.keyInsights.length > 0 && (
              <>
                <Text style={styles.summarySubtitle}>Key Insights:</Text>
                {summary.keyInsights.map((insight: string, idx: number) => (
                  <Text key={idx} style={styles.insightText}>• {insight}</Text>
                ))}
              </>
            )}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {!isComplete && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your response..."
            value={freeTextInput}
            onChangeText={setFreeTextInput}
            onSubmitEditing={handleFreeTextSubmit}
            editable={!loading}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !freeTextInput.trim() && styles.sendButtonDisabled]}
            onPress={handleFreeTextSubmit}
            disabled={!freeTextInput.trim() || loading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 16, marginBottom: 8 },
  questionBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  answerBubble: { alignSelf: 'flex-end', backgroundColor: '#2563EB' },
  systemBubble: { alignSelf: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  messageText: { fontSize: 15, color: '#111827', lineHeight: 22 },
  answerText: { color: '#FFFFFF' },
  systemText: { color: '#6B7280', fontStyle: 'italic', textAlign: 'center' },
  quickResponsesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quickResponseButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickResponseText: { fontSize: 14, color: '#1E40AF', fontWeight: '500' },
  loadingIndicator: { alignSelf: 'flex-start', padding: 14 },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#9CA3AF' },
  sendButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginTop: 16 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  summaryText: { fontSize: 14, color: '#4B5563', marginBottom: 6 },
  summarySubtitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 12, marginBottom: 8 },
  insightText: { fontSize: 14, color: '#4B5563', marginBottom: 4, lineHeight: 20 },
  doneButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  doneButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default DynamicInterviewScreen;
