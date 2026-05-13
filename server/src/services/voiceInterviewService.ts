import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import type { InterviewContext } from './hybridInterviewService';
import { selectNextQuestion } from './hybridInterviewService';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { parseInterviewAnswer, saveInterviewSignal } from './interviewAnswerParserService';

let openai: OpenAI | null = null;

const getOpenAI = (): OpenAI | null => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

export interface VoiceTranscript {
  questionId: string;
  question: string;
  answer: string;
  timestamp: string;
  timeElapsed: number;
}

export interface VoiceInterviewSession {
  sessionId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  conversationHistory: VoiceTranscript[];
  totalTimeElapsed: number;
  isComplete: boolean;
  questionCount: number;
}

const sessionStore = new Map<string, VoiceInterviewSession>();

/**
 * Load voice interview session from database
 */
const loadVoiceSessionFromDatabase = async (sessionId: string): Promise<VoiceInterviewSession | null> => {
  try {
    const { data, error } = await supabase
      .from('voice_interview_transcripts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .single();

    if (error || !data) {
      return null;
    }

    // Parse conversation history from transcript
    let conversationHistory: VoiceTranscript[] = [];
    if (data.extracted_signals && Array.isArray(data.extracted_signals)) {
      conversationHistory = data.extracted_signals;
    }

    return {
      sessionId: data.session_id,
      userId: data.user_id,
      startedAt: data.created_at,
      completedAt: data.processed_at || undefined,
      conversationHistory,
      totalTimeElapsed: data.audio_duration_seconds || 0,
      isComplete: data.processing_status === 'completed',
      questionCount: conversationHistory.length,
    };
  } catch (error) {
    logger.error('❌ [VOICE INTERVIEW] Error loading session from database', {
      error: (error as Error).message,
    });
    return null;
  }
};

/**
 * Save voice interview session to database
 */
const saveVoiceSessionToDatabase = async (
  sessionId: string,
  userId: string,
  conversationHistory: VoiceTranscript[],
  isComplete: boolean = false
): Promise<void> => {
  try {
    const existingSession = await loadVoiceSessionFromDatabase(sessionId);

    if (existingSession) {
      // Update existing session
      const { error } = await supabase
        .from('voice_interview_transcripts')
        .update({
          extracted_signals: conversationHistory,
          processing_status: isComplete ? 'completed' : 'processing',
          processed_at: isComplete ? new Date().toISOString() : null,
        })
        .eq('session_id', sessionId);

      if (error) {
        logger.error('❌ [VOICE INTERVIEW] Error updating session in database', {
          error: error.message,
        });
      }
    } else {
      // Insert new session
      const { error } = await supabase
        .from('voice_interview_transcripts')
        .insert({
          session_id: sessionId,
          user_id: userId,
          transcript_text: conversationHistory.map(t => `Q: ${t.question}\nA: ${t.answer}`).join('\n\n'),
          extracted_signals: conversationHistory,
          processing_status: isComplete ? 'completed' : 'processing',
          processed_at: isComplete ? new Date().toISOString() : null,
        });

      if (error) {
        logger.error('❌ [VOICE INTERVIEW] Error inserting session to database', {
          error: error.message,
        });
      } else {
        logger.info('✅ [VOICE INTERVIEW] Session saved to database', { sessionId });
      }
    }
  } catch (error) {
    logger.error('❌ [VOICE INTERVIEW] Database error', {
      error: (error as Error).message,
    });
  }
};

const TIME_CONSTRAINTS = {
  MAX_INTERVIEW_DURATION: 300, // 5 minutes
  MAX_QUESTIONS: 10,
  FINAL_QUESTION: "Do you have anything else to share?",
};

/**
 * Transcribe audio to text using OpenAI Whisper
 */
export const transcribeAudio = async (audioFilePath: string): Promise<string> => {
  const client = getOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'en',
    });

    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

/**
 * Generate speech from text using OpenAI TTS
 */
export const generateSpeech = async (text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'): Promise<Buffer> => {
  const client = getOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const mp3 = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

/**
 * Generate voice-optimized question using enhanced AI with dynamic question generation
 */
export const generateVoiceQuestion = async (
  context: InterviewContext,
  conversationHistory: VoiceTranscript[],
  isFinalQuestion: boolean = false
): Promise<string> => {
  // Always return final question if flagged
  if (isFinalQuestion) {
    return TIME_CONSTRAINTS.FINAL_QUESTION;
  }

  // Check if it's Saturday
  const today = new Date();
  const isSaturday = today.getDay() === 6;
  
  // Check if sexual health has been asked
  const askedAboutSexualHealth = conversationHistory.some(t => 
    t.question.toLowerCase().includes('libido') ||
    t.question.toLowerCase().includes('sexual') ||
    t.question.toLowerCase().includes('intimacy') ||
    t.question.toLowerCase().includes('satisfaction')
  );
  
  // Detect concerns in last answer
  const lastAnswer = conversationHistory[conversationHistory.length - 1]?.answer || '';
  const hasConcern = lastAnswer.toLowerCase().includes('not') ||
                     lastAnswer.toLowerCase().includes('poor') ||
                     lastAnswer.toLowerCase().includes('bad') ||
                     lastAnswer.toLowerCase().includes('only') ||
                     lastAnswer.toLowerCase().includes('low') ||
                     /\b[1-3]\b/.test(lastAnswer); // Low numbers (1-3)

  // Voice-specific priority: Saturday sexual health check-in
  if (isSaturday && !askedAboutSexualHealth) {
    return "How would you rate your libido this week on a scale of 1 to 5?";
  }

  // Voice-specific priority: Follow up on concerns
  if (hasConcern) {
    const client = getOpenAI();
    if (client) {
      try {
        const prompt = `The user just expressed a concern in their answer: "${lastAnswer}"

Generate ONE warm, empathetic follow-up question to understand this concern better.
Keep it short (10-15 seconds) and conversational.
Return ONLY the question text.`;

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 80,
        });

        return response.choices[0].message.content?.trim() || "Can you tell me more about that?";
      } catch (error) {
        logger.warn('⚠️ [VOICE INTERVIEW] Follow-up question generation failed, using fallback');
      }
    }
    return "Can you tell me more about that?";
  }

  // Use enhanced dynamic question generation from hybrid interview service
  try {
    // Convert VoiceTranscript to ConversationTurn format
    const conversationTurns = conversationHistory.map(t => ({
      questionId: t.questionId,
      question: t.question,
      answer: t.answer,
      timestamp: t.timestamp,
      timeElapsed: t.timeElapsed,
    }));

    const selectedQuestion = await selectNextQuestion(context, conversationTurns);
    
    logger.info('✅ [VOICE INTERVIEW] Using dynamic question generation', {
      category: selectedQuestion.category,
      source: selectedQuestion.source,
    });

    return selectedQuestion.text;
  } catch (error) {
    logger.warn('⚠️ [VOICE INTERVIEW] Dynamic question generation failed, using fallback', {
      error: (error as Error).message,
    });
    
    // Fallback to simple question
    return "How are you feeling today?";
  }
};

/**
 * Start a new voice interview session
 */
export const startVoiceInterviewSession = async (
  userId: string,
  context: InterviewContext
): Promise<{ sessionId: string; firstQuestion: string; audioBuffer: Buffer }> => {
  const sessionId = randomUUID();
  
  const session: VoiceInterviewSession = {
    sessionId,
    userId,
    startedAt: new Date().toISOString(),
    conversationHistory: [],
    totalTimeElapsed: 0,
    isComplete: false,
    questionCount: 0,
  };
  
  // Save to in-memory store for quick access
  sessionStore.set(sessionId, session);

  // Save initial session to database
  await saveVoiceSessionToDatabase(sessionId, userId, [], false);

  // Generate first question
  let firstQuestion: string;
  try {
    firstQuestion = await generateVoiceQuestion(context, []);
  } catch (error) {
    logger.error('❌ [VOICE INTERVIEW] Error generating first question', {
      error: (error as Error).message,
    });
    // Fallback question
    firstQuestion = "Good morning! How are you feeling today, and how did you sleep last night?";
  }
  
  // Generate audio
  let audioBuffer: Buffer | null = null;
  try {
    audioBuffer = await generateSpeech(firstQuestion);
  } catch (error) {
    logger.error('❌ [VOICE INTERVIEW] Error generating speech', {
      error: (error as Error).message,
    });
    // Continue without audio
  }

  logger.info('✅ [VOICE INTERVIEW] Session started', { sessionId, userId });

  return { sessionId, firstQuestion, audioBuffer };
};

/**
 * Process voice response and generate next question
 */
export const processVoiceResponse = async (
  sessionId: string,
  audioFilePath: string,
  context: InterviewContext,
  currentQuestion: string
): Promise<{ 
  nextQuestion: string; 
  audioBuffer: Buffer; 
  isFinalQuestion: boolean; 
  isComplete: boolean;
  transcript: string;
}> => {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Transcribe user's response
  const transcript = await transcribeAudio(audioFilePath);

  // Calculate time elapsed
  const timeElapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
  session.totalTimeElapsed = timeElapsed;
  session.questionCount++;

  // Record the Q&A in session history
  const questionId = randomUUID();
  session.conversationHistory.push({
    questionId,
    question: currentQuestion,
    answer: transcript,
    timestamp: new Date().toISOString(),
    timeElapsed,
  });

  // Save updated conversation history to database
  await saveVoiceSessionToDatabase(sessionId, session.userId, session.conversationHistory, false);

  // Phase 22: Parse answer and extract structured signals
  try {
    const parsedAnswer = await parseInterviewAnswer(currentQuestion, transcript, questionId);
    await saveInterviewSignal(session.userId, sessionId, parsedAnswer);
    logger.info('✅ [VOICE INTERVIEW] Signal extracted and saved', {
      category: parsedAnswer.category,
      confidence: parsedAnswer.confidence,
      method: parsedAnswer.extractionMethod,
    });
  } catch (error) {
    logger.warn('⚠️ [VOICE INTERVIEW] Signal extraction failed, continuing interview', {
      error: (error as Error).message,
    });
    // Non-blocking: Continue interview even if signal extraction fails
  }

  // Determine if this should be the final question
  const shouldBeFinalQuestion = 
    session.questionCount >= TIME_CONSTRAINTS.MAX_QUESTIONS - 1 ||
    timeElapsed >= TIME_CONSTRAINTS.MAX_INTERVIEW_DURATION - 30; // 30 seconds buffer

  // Generate next question using enhanced dynamic generation
  const nextQuestion = await generateVoiceQuestion(
    context, 
    session.conversationHistory,
    shouldBeFinalQuestion
  );

  // Generate audio for next question
  const audioBuffer = await generateSpeech(nextQuestion);
  
  const isFinalQuestion = nextQuestion === TIME_CONSTRAINTS.FINAL_QUESTION;
  const isComplete = false; // Will be complete after final question is answered

  logger.info('✅ [VOICE INTERVIEW] Response processed', {
    sessionId,
    questionCount: session.questionCount,
    timeElapsed,
    isFinalQuestion,
  });

  return {
    nextQuestion,
    audioBuffer,
    isFinalQuestion,
    isComplete,
    transcript,
  };
};

/**
 * Record a question and answer in the session
 */
export const recordVoiceAnswer = (
  sessionId: string,
  questionId: string,
  question: string,
  answer: string
): void => {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const timeElapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);

  session.conversationHistory.push({
    questionId,
    question,
    answer,
    timestamp: new Date().toISOString(),
    timeElapsed,
  });
};

/**
 * Complete voice interview session
 */
export const completeVoiceInterviewSession = async (sessionId: string): Promise<VoiceInterviewSession> => {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  session.isComplete = true;
  session.completedAt = new Date().toISOString();

  // Save final session state to database
  await saveVoiceSessionToDatabase(sessionId, session.userId, session.conversationHistory, true);

  logger.info('✅ [VOICE INTERVIEW] Session completed', {
    sessionId,
    userId: session.userId,
    questionCount: session.questionCount,
    totalTimeElapsed: session.totalTimeElapsed,
  });

  return session;
};

/**
 * Get voice interview session
 */
export const getVoiceInterviewSession = (sessionId: string): VoiceInterviewSession | undefined => {
  return sessionStore.get(sessionId);
};
