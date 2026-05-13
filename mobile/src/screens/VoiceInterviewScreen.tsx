import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
// import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useUser } from '../context/UserContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface VoiceInterviewScreenProps {
  navigation?: any;
}

const VoiceInterviewScreen: React.FC<VoiceInterviewScreenProps> = ({ navigation }) => {
  const { userId } = useUser();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [questionCount, setQuestionCount] = useState(0);
  
  // const recording = useRef<Audio.Recording | null>(null);
  // const sound = useRef<Audio.Sound | null>(null);
  const recording = useRef<any>(null);
  const sound = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setupAudio();
    startInterview();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording || isAISpeaking) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isRecording, isAISpeaking]);

  const setupAudio = async () => {
    try {
      // await Audio.requestPermissionsAsync();
      // await Audio.setAudioModeAsync({
      //   allowsRecordingIOS: true,
      //   playsInSilentModeIOS: true,
      // });
      console.log('Audio setup skipped - expo-av not available in Expo Go');
    } catch (error) {
      console.error('Error setting up audio:', error);
      Alert.alert('Error', 'Failed to set up audio permissions');
    }
  };

  const cleanup = async () => {
    if (recording.current) {
      try {
        await recording.current.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
    if (sound.current) {
      try {
        await sound.current.unloadAsync();
      } catch (error) {
        console.error('Error unloading sound:', error);
      }
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startInterview = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please set your user ID in Settings');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId }),
      });

      const data = await response.json();
      
      if (data.sessionId && data.firstQuestion) {
        setSessionId(data.sessionId);
        setCurrentQuestion(data.firstQuestion);
        setQuestionCount(1);
        
        // Play audio if available, otherwise just show the question
        if (data.audioUrl) {
          await playAudio(data.audioUrl);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      Alert.alert('Error', 'Failed to start interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (audioUrl: string) => {
    setIsAISpeaking(true);
    try {
      // Unload previous sound if exists
      if (sound.current) {
        await sound.current.unloadAsync();
      }

      const fullUrl = audioUrl.startsWith('http')
        ? audioUrl
        : `${API_BASE_URL}${audioUrl}`;

      // const { sound: newSound } = await Audio.Sound.createAsync(
      //   { uri: fullUrl },
      //   { shouldPlay: true }
      // );

      // sound.current = newSound;

      // newSound.setOnPlaybackStatusUpdate((status) => {
      //   if (status.isLoaded && status.didJustFinish) {
      //     setIsAISpeaking(false);
      //     // Auto-start recording after AI finishes speaking
      //     setTimeout(() => startRecording(), 500);
      //   }
      // });
      
      console.log('Audio playback skipped - expo-av not available in Expo Go');
      setIsAISpeaking(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsAISpeaking(false);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const startRecording = async () => {
    try {
      // const { status } = await Audio.requestPermissionsAsync();
      // if (status !== 'granted') {
      //   Alert.alert('Permission Required', 'Microphone permission is required to record your response');
      //   return;
      // }

      // await Audio.setAudioModeAsync({
      //   allowsRecordingIOS: true,
      //   playsInSilentModeIOS: true,
      // });

      // const { recording: newRecording } = await Audio.Recording.createAsync(
      //   Audio.RecordingOptionsPresets.HIGH_QUALITY
      // );

      // recording.current = newRecording;
      setIsRecording(true);
      setTranscript('');
      console.log('Recording skipped - expo-av not available in Expo Go');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording.current) return;

    setIsRecording(false);
    setIsLoading(true);

    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      
      if (!uri) {
        throw new Error('No recording URI');
      }

      // Upload audio and get next question
      await submitVoiceResponse(uri);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      recording.current = null;
      setIsLoading(false);
    }
  };

  const submitVoiceResponse = async (audioUri: string) => {
    if (!sessionId) return;

    try {
      const formData = new FormData();
      formData.append('userId', userId || '');
      formData.append('sessionId', sessionId);
      formData.append('currentQuestion', currentQuestion);
      formData.append('questionId', `q${questionCount}`);
      
      // Read audio file and append
      const audioFile = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any;
      
      formData.append('audio', audioFile);

      const response = await fetch(`${API_BASE_URL}/api/voice-interview/respond`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.transcript) {
        setTranscript(data.transcript);
      }

      if (data.isFinalQuestion || data.isComplete) {
        // This is the final question or interview is complete
        setCurrentQuestion(data.nextQuestion);
        setQuestionCount(prev => prev + 1);
        await playAudio(data.audioUrl);
        
        if (data.isComplete) {
          // Interview is done
          setTimeout(() => completeInterview(), 2000);
        }
      } else {
        // Continue interview
        setCurrentQuestion(data.nextQuestion);
        setQuestionCount(prev => prev + 1);
        await playAudio(data.audioUrl);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    }
  };

  const completeInterview = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-interview/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, sessionId }),
      });

      const data = await response.json();

      if (data.saved) {
        setIsComplete(true);
        Alert.alert(
          'Interview Complete!',
          'Your daily check-in has been saved. Great job!',
          [
            {
              text: 'Done',
              onPress: () => navigation?.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      Alert.alert('Error', 'Failed to save interview data');
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isAISpeaking && !isLoading) {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Check-In</Text>
        <Text style={styles.subtitle}>Question {questionCount}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {!isLoading && (
          <>
            {/* Current Question Display */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{currentQuestion}</Text>
            </View>

            {/* Status Indicator */}
            <View style={styles.statusContainer}>
              {isAISpeaking && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusIcon}>🎙️</Text>
                  <Text style={styles.statusText}>AI is speaking...</Text>
                </View>
              )}

              {isRecording && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusIcon}>👂</Text>
                  <Text style={styles.statusText}>Listening...</Text>
                </View>
              )}

              {transcript && !isRecording && !isAISpeaking && (
                <View style={styles.transcriptContainer}>
                  <Text style={styles.transcriptLabel}>You said:</Text>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              )}
            </View>

            {/* Microphone Button */}
            <View style={styles.micContainer}>
              <Animated.View
                style={[
                  styles.micButtonWrapper,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isRecording && styles.micButtonRecording,
                    (isAISpeaking || isLoading) && styles.micButtonDisabled,
                  ]}
                  onPress={handleMicPress}
                  disabled={isAISpeaking || isLoading || isComplete}
                >
                  <Text style={styles.micIcon}>
                    {isRecording ? '🔴' : '🎤'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <Text style={styles.micHint}>
                {isRecording
                  ? 'Tap to stop recording'
                  : isAISpeaking
                  ? 'AI is speaking...'
                  : 'Tap to respond'}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Footer */}
      {!isLoading && !isComplete && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Speak naturally - just like talking to a friend
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    color: '#000000',
    textAlign: 'center',
  },
  statusContainer: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
  },
  transcriptContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    maxWidth: '100%',
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '600',
  },
  transcriptText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
  },
  micContainer: {
    alignItems: 'center',
  },
  micButtonWrapper: {
    marginBottom: 16,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  micButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  micIcon: {
    fontSize: 48,
  },
  micHint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default VoiceInterviewScreen;
