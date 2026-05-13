import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

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

export interface InterviewContext {
  userId: string;
  recovery?: {
    sleepHours?: number;
    sleepQuality?: number;
    score?: string;
    status?: string;
  };
  stress?: {
    level?: string;
  };
  workoutAdherence?: number;
  supplementAdherence?: number;
  jointPain?: {
    hasActivePain?: boolean;
  };
  sexualHealth?: {
    libido?: string;
  };
  bloodwork?: {
    flags?: string[];
    criticalFlags?: string[];
  };
  bodyComposition?: {
    trend?: string;
  };
  nutrition?: {
    adherence?: number;
  };
  recommendationAdherence?: {
    total?: number;
    implemented?: number;
    acceptance?: number;
    barriers?: string[];
  };
}

export interface Question {
  id: string;
  text: string;
  category: string;
  priority: number;
  source: 'static' | 'ai';
  expectedResponseTime?: number;
  quickResponses?: string[];
}

export interface ConversationTurn {
  questionId: string;
  question: string;
  answer: string;
  timestamp: string;
  timeElapsed: number;
}

export interface InterviewSession {
  sessionId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  conversationHistory: ConversationTurn[];
  signalCollected: {
    recovery: boolean;
    stress: boolean;
    workout: boolean;
    nutrition: boolean;
    supplements: boolean;
  };
  totalTimeElapsed: number;
  isComplete: boolean;
}

const TIME_CONSTRAINTS = {
  MAX_INTERVIEW_DURATION: 180,
  GREETING_TIME: 5,
  QUESTION_TIME: 30,
  WRAP_UP_TIME: 10,
  BUFFER_TIME: 15,
};

const STATIC_QUESTION_BANK: Omit<Question, 'id'>[] = [
  {
    text: 'How did you sleep last night?',
    category: 'recovery',
    priority: 9,
    source: 'static',
    expectedResponseTime: 20,
    quickResponses: ['Great (7-9h)', 'Okay (6-7h)', 'Poor (<6h)', 'Terrible'],
  },
  {
    text: 'How recovered do you feel today?',
    category: 'recovery',
    priority: 8,
    source: 'static',
    expectedResponseTime: 15,
    quickResponses: ['Fully recovered', 'Somewhat tired', 'Very fatigued', 'Exhausted'],
  },
  {
    text: 'How stressed are you feeling?',
    category: 'stress',
    priority: 9,
    source: 'static',
    expectedResponseTime: 20,
    quickResponses: ['Low', 'Moderate', 'High', 'Overwhelming'],
  },
  {
    text: 'Did you complete your planned workout?',
    category: 'workout',
    priority: 7,
    source: 'static',
    expectedResponseTime: 15,
    quickResponses: ['Yes, fully', 'Partially', 'No', 'Skipped'],
  },
  {
    text: 'Did you take your supplements as planned?',
    category: 'supplements',
    priority: 6,
    source: 'static',
    expectedResponseTime: 15,
    quickResponses: ['All of them', 'Most', 'Some', 'None'],
  },
  {
    text: 'Are you experiencing any joint pain or discomfort?',
    category: 'joint_health',
    priority: 8,
    source: 'static',
    expectedResponseTime: 20,
    quickResponses: ['No pain', 'Mild discomfort', 'Moderate pain', 'Severe pain'],
  },
  {
    text: 'How well did you stick to your nutrition plan?',
    category: 'nutrition',
    priority: 6,
    source: 'static',
    expectedResponseTime: 20,
    quickResponses: ['100%', 'Mostly', 'Struggled', 'Off track'],
  },
  {
    text: 'How are your energy levels today?',
    category: 'energy',
    priority: 7,
    source: 'static',
    expectedResponseTime: 15,
    quickResponses: ['High energy', 'Normal', 'Low energy', 'Exhausted'],
  },
  {
    text: 'Any new aches, pains, or injury concerns?',
    category: 'joint_health',
    priority: 7,
    source: 'static',
    expectedResponseTime: 20,
    quickResponses: ['None', 'Minor soreness', 'Concerning pain', 'Injury'],
  },
  {
    text: 'How has your mood been today?',
    category: 'mental_health',
    priority: 7,
    source: 'static',
    expectedResponseTime: 15,
    quickResponses: ['Great', 'Good', 'Okay', 'Poor'],
  },
  {
    text: 'How would you rate your libido this week?',
    category: 'sexual_health',
    priority: 6,
    source: 'static',
    expectedResponseTime: 20,
    quickResponses: ['Very low (1)', 'Lower than usual (2)', 'Normal (3)', 'Higher than usual (4)', 'Very high (5)'],
  },
  {
    text: 'How satisfied are you with your sexual health this week?',
    category: 'sexual_health',
    priority: 6,
    source: 'static',
    expectedResponseTime: 20,
    quickResponses: ['Very dissatisfied (1)', 'Somewhat dissatisfied (2)', 'Neutral (3)', 'Satisfied (4)', 'Very satisfied (5)'],
  },
  {
    text: 'Is stress impacting your intimacy or sexual health?',
    category: 'sexual_health',
    priority: 6,
    source: 'static',
    expectedResponseTime: 20,
    quickResponses: ['No impact (1)', 'Minimal impact (2)', 'Moderate impact (3)', 'Significant impact (4)', 'Severe impact (5)'],
  },
];

// Database persistence via Supabase (hybrid_interview_sessions table)

const isCommonScenario = (context: InterviewContext): boolean => {
  const priorities = calculatePriorities(context);
  
  if (priorities.length === 1 && priorities[0].severity >= 8) {
    return true;
  }
  
  if ((context.recovery?.sleepHours ?? 8) < 7 && !(context.bloodwork?.flags?.length ?? 0 > 0)) {
    return true;
  }
  
  if ((context.workoutAdherence ?? 100) < 70 && !context.jointPain?.hasActivePain) {
    return true;
  }
  
  if (context.stress?.level === 'high' && context.recovery?.score !== 'critical') {
    return true;
  }
  
  return false;
};

const hasComplexHealthFlags = (context: InterviewContext): boolean => {
  if ((context.bloodwork?.flags?.length ?? 0) > 2) {
    return true;
  }
  
  if ((context.recovery?.sleepHours ?? 0) >= 8 && context.recovery?.score === 'low') {
    return true;
  }
  
  const atRiskDomains = [
    context.recovery?.status === 'At Risk',
    context.stress?.level === 'high',
    (context.workoutAdherence ?? 100) < 50,
    context.jointPain?.hasActivePain,
    context.sexualHealth?.libido === 'low',
  ].filter(Boolean).length;
  
  if (atRiskDomains >= 3) {
    return true;
  }
  
  return false;
};

const needsDeepDive = (conversationHistory: ConversationTurn[]): boolean => {
  if (conversationHistory.length === 0) return false;
  
  const lastAnswer = conversationHistory[conversationHistory.length - 1].answer.toLowerCase();
  
  const concernKeywords = ['severe', 'terrible', 'pain', 'overwhelming', 'exhausted', 'injury'];
  return concernKeywords.some(keyword => lastAnswer.includes(keyword));
};

const calculatePriorities = (context: InterviewContext): Array<{ category: string; severity: number }> => {
  const priorities: Array<{ category: string; severity: number }> = [];
  
  if ((context.bloodwork?.criticalFlags?.length ?? 0) > 0) {
    priorities.push({ category: 'bloodwork', severity: 10 });
  }
  
  if ((context.recovery?.sleepHours ?? 8) < 6) {
    priorities.push({ category: 'recovery', severity: 9 });
  }
  
  if (context.stress?.level === 'high') {
    priorities.push({ category: 'stress', severity: 9 });
  }
  
  if (context.jointPain?.hasActivePain) {
    priorities.push({ category: 'joint_health', severity: 8 });
  }
  
  if ((context.workoutAdherence ?? 100) < 50) {
    priorities.push({ category: 'workout', severity: 7 });
  }
  
  if ((context.recommendationAdherence?.acceptance ?? 100) < 50) {
    priorities.push({ category: 'adherence', severity: 7 });
  }
  
  return priorities.sort((a, b) => b.severity - a.severity);
};

const selectStaticQuestion = (
  context: InterviewContext,
  conversationHistory: ConversationTurn[]
): Question => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const isSaturday = dayOfWeek === 6;
  
  const askedCategories = new Set(conversationHistory.map(t => {
    const q = STATIC_QUESTION_BANK.find(sq => sq.text === t.question);
    return q?.category;
  }));
  
  const priorities = calculatePriorities(context);
  
  // On Saturday, add sexual_health to priorities with high priority
  if (isSaturday && !askedCategories.has('sexual_health')) {
    priorities.push({ category: 'sexual_health', severity: 8 });
  }
  
  for (const priority of priorities) {
    if (askedCategories.has(priority.category)) continue;
    
    const question = STATIC_QUESTION_BANK.find(q => 
      q.category === priority.category && 
      !conversationHistory.some(t => t.question === q.text) &&
      // Filter out sexual health questions on non-Saturday days
      (q.category !== 'sexual_health' || isSaturday)
    );
    
    if (question) {
      return { ...question, id: randomUUID() };
    }
  }
  
  const unaskedQuestions = STATIC_QUESTION_BANK.filter(q => 
    !conversationHistory.some(t => t.question === q.text) &&
    // Filter out sexual health questions on non-Saturday days
    (q.category !== 'sexual_health' || isSaturday)
  );
  
  if (unaskedQuestions.length > 0) {
    const selected = unaskedQuestions.sort((a, b) => {
      // Boost sexual health priority on Saturday
      const aPriority = a.category === 'sexual_health' && isSaturday ? a.priority + 2 : a.priority;
      const bPriority = b.category === 'sexual_health' && isSaturday ? b.priority + 2 : b.priority;
      return bPriority - aPriority;
    })[0];
    return { ...selected, id: randomUUID() };
  }
  
  return {
    id: randomUUID(),
    text: 'Is there anything else you want to share about your health today?',
    category: 'general',
    priority: 5,
    source: 'static',
    expectedResponseTime: 30,
  };
};

const generateAIQuestion = async (
  context: InterviewContext,
  conversationHistory: ConversationTurn[]
): Promise<Question> => {
  const priorities = calculatePriorities(context);
  const conversationSummary = conversationHistory
    .map(t => `Q: ${t.question}\nA: ${t.answer}`)
    .join('\n\n');
  
  const prompt = `You are a health coach conducting a brief 3-minute daily check-in.

CONTEXT:
User's Health Data:
- Sleep: ${context.recovery?.sleepHours ?? 'unknown'} hours, quality: ${context.recovery?.sleepQuality ?? 'unknown'}/5
- Recovery status: ${context.recovery?.status ?? 'unknown'}
- Stress level: ${context.stress?.level ?? 'unknown'}
- Workout adherence: ${context.workoutAdherence ?? 'unknown'}%
- Supplement adherence: ${context.supplementAdherence ?? 'unknown'}%
- Bloodwork flags: ${context.bloodwork?.flags?.join(', ') ?? 'none'}
- Joint pain: ${context.jointPain?.hasActivePain ? 'yes' : 'no'}
- Recommendation adherence: ${context.recommendationAdherence?.acceptance ?? 'unknown'}%

CONVERSATION SO FAR:
${conversationSummary || 'No questions asked yet'}

TOP PRIORITIES:
${priorities.map((p, i) => `${i + 1}. ${p.category} (severity: ${p.severity}/10)`).join('\n')}

TASK:
Generate ONE conversational question that:
1. Addresses the highest priority health concern not yet explored
2. Follows naturally from previous answers
3. Can be answered in 15-30 seconds
4. Is warm and empathetic (not clinical)
5. Digs deeper if previous answer revealed concern

Return ONLY a JSON object:
{
  "question": "the question text",
  "category": "recovery|stress|workout|nutrition|etc",
  "expectedResponseTime": 20
}`;

  try {
    const client = getOpenAI();
    
    if (!client) {
      console.log('OpenAI API key not available, falling back to static question');
      return selectStaticQuestion(context, conversationHistory);
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      id: randomUUID(),
      text: result.question || 'How are you feeling today?',
      category: result.category || 'general',
      priority: 8,
      source: 'ai',
      expectedResponseTime: result.expectedResponseTime || 20,
    };
  } catch (error) {
    console.error('AI question generation failed:', error);
    return selectStaticQuestion(context, conversationHistory);
  }
};

export const selectNextQuestion = async (
  context: InterviewContext,
  conversationHistory: ConversationTurn[]
): Promise<Question> => {
  if (isCommonScenario(context)) {
    return selectStaticQuestion(context, conversationHistory);
  }
  
  if (hasComplexHealthFlags(context)) {
    return await generateAIQuestion(context, conversationHistory);
  }
  
  if (needsDeepDive(conversationHistory)) {
    return await generateAIQuestion(context, conversationHistory);
  }
  
  return selectStaticQuestion(context, conversationHistory);
};

export const startInterviewSession = async (userId: string, context: InterviewContext): Promise<InterviewSession> => {
  const sessionId = randomUUID();
  
  const session: InterviewSession = {
    sessionId,
    userId,
    startedAt: new Date().toISOString(),
    conversationHistory: [],
    signalCollected: {
      recovery: false,
      stress: false,
      workout: false,
      nutrition: false,
      supplements: false,
    },
    totalTimeElapsed: 0,
    isComplete: false,
  };
  
  // Persist to database
  try {
    const { error } = await supabase
      .from('hybrid_interview_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        started_at: session.startedAt,
        interview_context: context,
        conversation_history: session.conversationHistory,
        signals_collected: session.signalCollected,
        total_time_elapsed: session.totalTimeElapsed,
        is_complete: session.isComplete,
      });

    if (error) {
      logger.error('❌ [HYBRID INTERVIEW] Failed to persist session', {
        error: error.message,
      });
    } else {
      logger.info('✅ [HYBRID INTERVIEW] Session created', { sessionId });
    }
  } catch (error) {
    logger.error('❌ [HYBRID INTERVIEW] Database error', {
      error: (error as Error).message,
    });
  }
  
  return session;
};

export const recordAnswer = async (
  sessionId: string,
  questionId: string,
  question: string,
  answer: string,
  category: string
): Promise<InterviewSession> => {
  // Fetch session from database
  const { data: session, error: fetchError } = await supabase
    .from('hybrid_interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (fetchError || !session) {
    logger.error('❌ [HYBRID INTERVIEW] Session not found', { sessionId });
    throw new Error(`Session ${sessionId} not found`);
  }
  
  const timeElapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
  
  const conversationHistory = session.conversation_history || [];
  conversationHistory.push({
    questionId,
    question,
    answer,
    timestamp: new Date().toISOString(),
    timeElapsed,
  });
  
  const signalsCollected = session.signals_collected || {
    recovery: false,
    stress: false,
    workout: false,
    nutrition: false,
    supplements: false,
  };
  
  if (category === 'recovery') signalsCollected.recovery = true;
  if (category === 'stress') signalsCollected.stress = true;
  if (category === 'workout') signalsCollected.workout = true;
  if (category === 'nutrition') signalsCollected.nutrition = true;
  if (category === 'supplements') signalsCollected.supplements = true;
  
  // Update database
  const { error: updateError } = await supabase
    .from('hybrid_interview_sessions')
    .update({
      conversation_history: conversationHistory,
      signals_collected: signalsCollected,
      total_time_elapsed: timeElapsed,
    })
    .eq('id', sessionId);

  if (updateError) {
    logger.error('❌ [HYBRID INTERVIEW] Failed to update session', {
      error: updateError.message,
    });
  }
  
  return {
    sessionId: session.id,
    userId: session.user_id,
    startedAt: session.started_at,
    conversationHistory,
    signalCollected: signalsCollected,
    totalTimeElapsed: timeElapsed,
    isComplete: session.is_complete,
    completedAt: session.completed_at,
  };
};

export const shouldContinueInterview = (session: InterviewSession): boolean => {
  if (session.totalTimeElapsed >= TIME_CONSTRAINTS.MAX_INTERVIEW_DURATION) {
    return false;
  }
  
  const timeRemaining = TIME_CONSTRAINTS.MAX_INTERVIEW_DURATION - session.totalTimeElapsed;
  if (timeRemaining < TIME_CONSTRAINTS.QUESTION_TIME + TIME_CONSTRAINTS.WRAP_UP_TIME) {
    return false;
  }
  
  if (session.conversationHistory.length >= 6) {
    return false;
  }
  
  const signalCount = Object.values(session.signalCollected).filter(Boolean).length;
  if (signalCount >= 4 && session.conversationHistory.length >= 4) {
    return false;
  }
  
  return true;
};

export const completeInterviewSession = async (sessionId: string): Promise<InterviewSession> => {
  const completedAt = new Date().toISOString();
  
  const { data: session, error: updateError } = await supabase
    .from('hybrid_interview_sessions')
    .update({
      is_complete: true,
      completed_at: completedAt,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (updateError || !session) {
    logger.error('❌ [HYBRID INTERVIEW] Failed to complete session', { sessionId });
    throw new Error(`Session ${sessionId} not found`);
  }
  
  logger.info('✅ [HYBRID INTERVIEW] Session completed', { sessionId });
  
  return {
    sessionId: session.id,
    userId: session.user_id,
    startedAt: session.started_at,
    conversationHistory: session.conversation_history || [],
    signalCollected: session.signals_collected || {},
    totalTimeElapsed: session.total_time_elapsed,
    isComplete: session.is_complete,
    completedAt: session.completed_at,
  };
};

export const getInterviewSession = async (sessionId: string): Promise<InterviewSession | null> => {
  try {
    const { data: session, error } = await supabase
      .from('hybrid_interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return null;
    }

    return {
      sessionId: session.id,
      userId: session.user_id,
      startedAt: session.started_at,
      conversationHistory: session.conversation_history || [],
      signalCollected: session.signals_collected || {},
      totalTimeElapsed: session.total_time_elapsed,
      isComplete: session.is_complete,
      completedAt: session.completed_at,
    };
  } catch (error) {
    logger.error('❌ [HYBRID INTERVIEW] Error fetching session', {
      error: (error as Error).message,
    });
    return null;
  }
};
