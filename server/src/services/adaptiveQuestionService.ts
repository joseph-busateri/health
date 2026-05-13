/**
 * Phase 25: Adaptive Question Service
 * 
 * Purpose: Generate personalized interview questions based on data gaps and user patterns
 * Features: Smart question selection, redundancy avoidance, personalization
 */

import { logger } from '../utils/logger';
import { getOrCreateProfile, getMissingDataCategories } from './userInterviewProfileService';
import { analyzeDataGaps, prioritizeDataGaps, type DataGap } from './dataGapAnalysisService';

// ============================================================================
// TYPES
// ============================================================================

export type InterviewStrategy = 
  | 'data_gap_focused'
  | 'pattern_exploration'
  | 'anomaly_investigation'
  | 'routine_check'
  | 'follow_up';

export interface AdaptiveQuestion {
  id: string;
  text: string;
  category: string;
  type: 'open_ended' | 'yes_no' | 'scale' | 'multiple_choice';
  priority: number;
  reasoning: string;
  followUpQuestions?: string[];
}

export interface AdaptiveQuestionSet {
  userId: string;
  strategy: InterviewStrategy;
  questions: AdaptiveQuestion[];
  reasoning: string;
  estimatedDuration: number;
}

// ============================================================================
// QUESTION BANK
// ============================================================================

const QUESTION_BANK: Record<string, AdaptiveQuestion[]> = {
  sleep: [
    {
      id: 'sleep_quality_1',
      text: 'How would you rate your sleep quality last night on a scale of 1-10?',
      category: 'sleep',
      type: 'scale',
      priority: 1,
      reasoning: 'Core sleep quality metric',
    },
    {
      id: 'sleep_duration_1',
      text: 'How many hours of sleep did you get last night?',
      category: 'sleep',
      type: 'open_ended',
      priority: 1,
      reasoning: 'Essential sleep duration data',
    },
    {
      id: 'sleep_barriers_1',
      text: 'What prevented you from getting good sleep, if anything?',
      category: 'sleep',
      type: 'open_ended',
      priority: 2,
      reasoning: 'Identify sleep barriers',
    },
  ],
  stress: [
    {
      id: 'stress_level_1',
      text: 'On a scale of 1-10, how stressed have you felt today?',
      category: 'stress',
      type: 'scale',
      priority: 1,
      reasoning: 'Core stress metric',
    },
    {
      id: 'stress_triggers_1',
      text: 'What has been causing you stress lately?',
      category: 'stress',
      type: 'open_ended',
      priority: 2,
      reasoning: 'Identify stress triggers',
    },
  ],
  nutrition: [
    {
      id: 'nutrition_adherence_1',
      text: 'Have you been following your nutrition plan this week?',
      category: 'nutrition',
      type: 'yes_no',
      priority: 1,
      reasoning: 'Track nutrition adherence',
    },
    {
      id: 'nutrition_meals_1',
      text: 'What did you eat for your main meals today?',
      category: 'nutrition',
      type: 'open_ended',
      priority: 2,
      reasoning: 'Capture meal data',
    },
  ],
  workout: [
    {
      id: 'workout_completion_1',
      text: 'Did you complete your planned workout today?',
      category: 'workout',
      type: 'yes_no',
      priority: 1,
      reasoning: 'Track workout adherence',
    },
    {
      id: 'workout_feeling_1',
      text: 'How did your workout feel today?',
      category: 'workout',
      type: 'open_ended',
      priority: 2,
      reasoning: 'Assess workout quality',
    },
  ],
  recovery: [
    {
      id: 'recovery_soreness_1',
      text: 'Are you experiencing any muscle soreness or fatigue?',
      category: 'recovery',
      type: 'yes_no',
      priority: 1,
      reasoning: 'Monitor recovery status',
    },
    {
      id: 'recovery_pain_1',
      text: 'Do you have any pain or discomfort to report?',
      category: 'recovery',
      type: 'yes_no',
      priority: 2,
      reasoning: 'Track pain and injury',
    },
  ],
  energy: [
    {
      id: 'energy_level_1',
      text: 'How would you rate your energy level today on a scale of 1-10?',
      category: 'energy',
      type: 'scale',
      priority: 1,
      reasoning: 'Core energy metric',
    },
  ],
  mood: [
    {
      id: 'mood_rating_1',
      text: 'How has your mood been today?',
      category: 'mood',
      type: 'open_ended',
      priority: 1,
      reasoning: 'Track emotional state',
    },
  ],
  supplements: [
    {
      id: 'supplements_adherence_1',
      text: 'Have you been taking your supplements as planned?',
      category: 'supplements',
      type: 'yes_no',
      priority: 1,
      reasoning: 'Track supplement adherence',
    },
  ],
};

// ============================================================================
// GENERATE ADAPTIVE QUESTIONS
// ============================================================================

export async function generateAdaptiveQuestions(
  userId: string,
  maxQuestions: number = 10
): Promise<AdaptiveQuestionSet> {
  try {
    logger.info('🎯 [ADAPTIVE QUESTIONS] Generating adaptive question set', {
      userId,
      maxQuestions,
    });

    // Get user profile and data gaps
    const profile = await getOrCreateProfile(userId);
    const dataGapAnalysis = await analyzeDataGaps(userId);
    
    // Select strategy
    const strategy = selectStrategy(dataGapAnalysis);
    
    // Generate questions based on strategy
    let questions: AdaptiveQuestion[] = [];
    
    switch (strategy) {
      case 'data_gap_focused':
        questions = await selectQuestionsForDataGaps(dataGapAnalysis.criticalGaps);
        break;
      case 'routine_check':
        questions = await selectRoutineQuestions();
        break;
      default:
        questions = await selectRoutineQuestions();
    }

    // Avoid redundant questions
    questions = await avoidRedundantQuestions(userId, questions);
    
    // Limit to max questions
    questions = questions.slice(0, maxQuestions);
    
    // Calculate estimated duration (30 seconds per question)
    const estimatedDuration = questions.length * 30;

    const questionSet: AdaptiveQuestionSet = {
      userId,
      strategy,
      questions,
      reasoning: generateStrategyReasoning(strategy, dataGapAnalysis),
      estimatedDuration,
    };

    logger.info('✅ [ADAPTIVE QUESTIONS] Question set generated', {
      userId,
      strategy,
      questionCount: questions.length,
      estimatedDuration: `${estimatedDuration}s`,
    });

    return questionSet;
  } catch (error) {
    logger.error('❌ [ADAPTIVE QUESTIONS] Failed to generate questions', {
      error: (error as Error).message,
      userId,
    });
    
    // Fallback to routine questions
    return {
      userId,
      strategy: 'routine_check',
      questions: await selectRoutineQuestions(),
      reasoning: 'Using routine questions due to error',
      estimatedDuration: 300,
    };
  }
}

// ============================================================================
// STRATEGY SELECTION
// ============================================================================

function selectStrategy(dataGapAnalysis: any): InterviewStrategy {
  // Priority 1: Critical data gaps
  if (dataGapAnalysis.criticalGaps.length > 0) {
    return 'data_gap_focused';
  }
  
  // Default: Routine check
  return 'routine_check';
}

// ============================================================================
// QUESTION SELECTION
// ============================================================================

async function selectQuestionsForDataGaps(gaps: DataGap[]): Promise<AdaptiveQuestion[]> {
  const questions: AdaptiveQuestion[] = [];
  
  // Prioritize gaps
  const prioritized = prioritizeDataGaps(gaps);
  
  // Select questions for top gaps
  for (const gap of prioritized.slice(0, 5)) {
    const category = gap.category.replace('_data', '').replace('_signals', '');
    const categoryQuestions = QUESTION_BANK[category] || [];
    
    // Add suggested questions from gap analysis
    for (const suggestedText of gap.suggestedQuestions.slice(0, 2)) {
      questions.push({
        id: `gap_${category}_${questions.length}`,
        text: suggestedText,
        category,
        type: 'open_ended',
        priority: gap.priority === 'critical' ? 1 : 2,
        reasoning: `Fill ${gap.priority} priority data gap in ${category}`,
      });
    }
    
    // Add questions from bank
    questions.push(...categoryQuestions.slice(0, 1));
  }
  
  return questions;
}

async function selectRoutineQuestions(): Promise<AdaptiveQuestion[]> {
  const questions: AdaptiveQuestion[] = [];
  
  // Select one question from each major category
  const categories = ['sleep', 'stress', 'energy', 'mood', 'workout', 'nutrition'];
  
  for (const category of categories) {
    const categoryQuestions = QUESTION_BANK[category] || [];
    if (categoryQuestions.length > 0) {
      questions.push(categoryQuestions[0]);
    }
  }
  
  return questions;
}

// ============================================================================
// REDUNDANCY AVOIDANCE
// ============================================================================

async function avoidRedundantQuestions(
  userId: string,
  candidateQuestions: AdaptiveQuestion[]
): Promise<AdaptiveQuestion[]> {
  // For now, just return all questions
  // In production, would check recent interview history
  return candidateQuestions;
}

// ============================================================================
// STRATEGY REASONING
// ============================================================================

function generateStrategyReasoning(
  strategy: InterviewStrategy,
  dataGapAnalysis: any
): string {
  switch (strategy) {
    case 'data_gap_focused':
      return `Focusing on ${dataGapAnalysis.criticalGaps.length} critical data gaps to improve overall completeness (${(dataGapAnalysis.overallCompleteness * 100).toFixed(0)}%)`;
    case 'routine_check':
      return 'Routine check-in across all major health categories';
    default:
      return 'Standard interview approach';
  }
}

// ============================================================================
// PERSONALIZE QUESTION DEPTH
// ============================================================================

export function personalizeQuestionDepth(
  userId: string,
  question: AdaptiveQuestion,
  engagementScore: number
): AdaptiveQuestion {
  // If high engagement, can ask more detailed questions
  if (engagementScore > 0.8 && question.type === 'open_ended') {
    return {
      ...question,
      text: question.text + ' Please provide details.',
    };
  }
  
  // If low engagement, keep questions simple
  if (engagementScore < 0.5 && question.type === 'open_ended') {
    return {
      ...question,
      type: 'yes_no',
      text: question.text.replace('?', ' - yes or no?'),
    };
  }
  
  return question;
}
