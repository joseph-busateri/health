import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import type { InterviewContext } from './hybridInterviewService';

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
 * Generate voice-optimized question using AI
 */
export const generateVoiceQuestion = async (
  context: InterviewContext,
  conversationHistory: VoiceTranscript[],
  isFinalQuestion: boolean = false
): Promise<string> => {
  const client = getOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  // Always return final question if flagged
  if (isFinalQuestion) {
    return TIME_CONSTRAINTS.FINAL_QUESTION;
  }

  const conversationSummary = conversationHistory
    .map(t => `Q: ${t.question}\nA: ${t.answer}`)
    .join('\n\n');

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

  const prompt = `You are a warm, empathetic health coach having a voice conversation with a user.

CONTEXT:
User's Health Data:
- Sleep: ${context.recovery?.sleepHours ?? 'unknown'} hours, quality: ${context.recovery?.sleepQuality ?? 'unknown'}/5
- Recovery status: ${context.recovery?.status ?? 'unknown'}
- Stress level: ${context.stress?.level ?? 'unknown'}
- Workout adherence: ${context.workoutAdherence ?? 'unknown'}%
- Supplement adherence: ${context.supplementAdherence ?? 'unknown'}%
- Sexual health libido: ${context.sexualHealth?.libido ?? 'unknown'}

Conversation So Far:
${conversationSummary || 'No questions asked yet'}

CRITICAL PRIORITY RULES (MUST FOLLOW):
${isSaturday && !askedAboutSexualHealth ? '🔴 TODAY IS SATURDAY - YOU MUST ASK ABOUT SEXUAL HEALTH! Ask about libido, satisfaction, or stress impact on intimacy.' : ''}
${hasConcern ? '🔴 USER EXPRESSED CONCERN IN LAST ANSWER - ASK A FOLLOW-UP QUESTION about what they just mentioned!' : ''}

TASK:
Generate ONE conversational question for a voice interview that:
1. ${isSaturday && !askedAboutSexualHealth ? 'MUST ask about sexual health (libido/satisfaction/stress impact)' : 'Addresses an important health area not yet explored'}
2. ${hasConcern ? 'MUST follow up on the concern they just mentioned' : 'Flows naturally from previous responses'}
3. Can be answered in 10-20 seconds
4. Is warm and empathetic (like talking to a friend)
5. Uses natural speech patterns (contractions, casual language)
6. Is SHORT and CLEAR for voice delivery

Examples of good questions:
- "How would you rate your libido this week?" (Saturday)
- "What's making it hard to get good sleep?" (follow-up to poor sleep)
- "How are your stress levels today?"
- "Did you complete your workout?"

Return ONLY the spoken question text (no JSON, no formatting, just the question).`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 100,
    });

    return response.choices[0].message.content?.trim() || "How are you feeling today?";
  } catch (error) {
    console.error('Error generating voice question:', error);
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
  
  sessionStore.set(sessionId, session);

  // Generate first question
  let firstQuestion: string;
  try {
    firstQuestion = await generateVoiceQuestion(context, []);
  } catch (error) {
    console.error('Error generating question:', error);
    // Fallback question
    firstQuestion = "Good morning! How are you feeling today, and how did you sleep last night?";
  }
  
  // Generate audio
  let audioBuffer: Buffer | null = null;
  try {
    audioBuffer = await generateSpeech(firstQuestion);
  } catch (error) {
    console.error('Error generating speech:', error);
    // Continue without audio
  }

  return { sessionId, firstQuestion, audioBuffer };
};

/**
 * Process voice response and generate next question
 */
export const processVoiceResponse = async (
  sessionId: string,
  audioFilePath: string,
  context: InterviewContext
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

  // Determine if this should be the final question
  const shouldBeFinalQuestion = 
    session.questionCount >= TIME_CONSTRAINTS.MAX_QUESTIONS - 1 ||
    timeElapsed >= TIME_CONSTRAINTS.MAX_INTERVIEW_DURATION - 30; // 30 seconds buffer

  // Generate next question
  const nextQuestion = await generateVoiceQuestion(
    context, 
    session.conversationHistory,
    shouldBeFinalQuestion
  );

  // Generate audio for next question
  const audioBuffer = await generateSpeech(nextQuestion);

  // Record the current Q&A (we'll record the question that was just answered)
  // Note: The question text needs to be tracked separately or passed in
  
  const isFinalQuestion = nextQuestion === TIME_CONSTRAINTS.FINAL_QUESTION;
  const isComplete = false; // Will be complete after final question is answered

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
export const completeVoiceInterviewSession = (sessionId: string): VoiceInterviewSession => {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  session.isComplete = true;
  session.completedAt = new Date().toISOString();

  return session;
};

/**
 * Get voice interview session
 */
export const getVoiceInterviewSession = (sessionId: string): VoiceInterviewSession | undefined => {
  return sessionStore.get(sessionId);
};
