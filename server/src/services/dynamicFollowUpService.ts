import { randomUUID } from 'crypto';

import { saveInterviewOutputs } from './interviewSaveBackService';
import type {
  BranchingScenario,
  FollowUpDecision,
  InterviewContext,
  InterviewState,
  InterviewSummary,
  QuestionCandidate,
} from '../types/dynamicFollowUps';
import type { InterviewSaveBackResult } from '../types/interviewSaveBack';

const interviewSessions = new Map<string, InterviewState>();

const QUESTION_BANK: QuestionCandidate[] = [
  {
    id: 'sleep_quality',
    text: 'How did you sleep last night?',
    priority: 10,
    category: 'recovery',
    triggerCondition: 'recovery.sleepHours < 7 || recovery.sleepQuality < 3',
    quickResponses: ['Great', 'Okay', 'Poor', 'Terrible'],
    expectsFreeText: true,
  },
  {
    id: 'sleep_interruptions',
    text: 'What interrupted your sleep?',
    priority: 9,
    category: 'recovery',
    triggerCondition: 'prior_response:sleep_quality in [Poor, Terrible]',
    quickResponses: ['Woke up multiple times', 'Trouble falling asleep', 'Early wake', 'Pain/discomfort'],
    expectsFreeText: true,
  },
  {
    id: 'recovery_feeling',
    text: 'How recovered do you feel today?',
    priority: 8,
    category: 'recovery',
    triggerCondition: 'recovery.recoveryFeeling < 3',
    quickResponses: ['Fully recovered', 'Somewhat tired', 'Very fatigued', 'Exhausted'],
    expectsFreeText: true,
  },
  {
    id: 'stress_level',
    text: 'How stressed are you feeling?',
    priority: 9,
    category: 'stress',
    triggerCondition: 'stress.level === high',
    quickResponses: ['Low', 'Moderate', 'High', 'Overwhelming'],
    expectsFreeText: true,
  },
  {
    id: 'stress_sources',
    text: 'What are the main sources of stress right now?',
    priority: 8,
    category: 'stress',
    triggerCondition: 'prior_response:stress_level in [High, Overwhelming]',
    quickResponses: ['Work', 'Relationships', 'Finances', 'Health'],
    expectsFreeText: true,
  },
  {
    id: 'workout_adherence',
    text: 'Did you complete your planned workout?',
    priority: 7,
    category: 'workout',
    triggerCondition: 'workoutAdherence < 50',
    quickResponses: ['Yes, fully', 'Partially', 'No', 'Skipped'],
    expectsFreeText: true,
  },
  {
    id: 'workout_skip_reason',
    text: 'What prevented you from working out?',
    priority: 8,
    category: 'workout',
    triggerCondition: 'prior_response:workout_adherence in [No, Skipped]',
    quickResponses: ['Too tired', 'No time', 'Pain/injury', 'Not motivated'],
    expectsFreeText: true,
  },
  {
    id: 'joint_pain_check',
    text: 'Are you experiencing any joint pain or discomfort?',
    priority: 9,
    category: 'joint_health',
    triggerCondition: 'jointPain.hasActivePain === true',
    quickResponses: ['No pain', 'Mild discomfort', 'Moderate pain', 'Severe pain'],
    expectsFreeText: true,
  },
  {
    id: 'joint_pain_location',
    text: 'Where is the pain located?',
    priority: 9,
    category: 'joint_health',
    triggerCondition: 'prior_response:joint_pain_check in [Moderate pain, Severe pain]',
    quickResponses: ['Knee', 'Shoulder', 'Lower back', 'Hip', 'Elbow'],
    expectsFreeText: true,
  },
  {
    id: 'sexual_health_check',
    text: 'How is your libido and sexual health?',
    priority: 6,
    category: 'sexual_health',
    triggerCondition: 'sexualHealth.libido === low',
    quickResponses: ['Normal', 'Lower than usual', 'Very low', 'Non-existent'],
    expectsFreeText: true,
  },
  {
    id: 'sexual_health_duration',
    text: 'How long have you noticed this change?',
    priority: 7,
    category: 'sexual_health',
    triggerCondition: 'prior_response:sexual_health_check in [Lower than usual, Very low, Non-existent]',
    quickResponses: ['Few days', '1-2 weeks', 'Several weeks', 'Months'],
    expectsFreeText: true,
  },
  {
    id: 'nutrition_adherence',
    text: 'How well did you stick to your nutrition plan?',
    priority: 5,
    category: 'nutrition',
    triggerCondition: 'always',
    quickResponses: ['100%', 'Mostly', 'Struggled', 'Off track'],
    expectsFreeText: true,
  },
  {
    id: 'nutrition_challenges',
    text: 'What made it difficult to stick to your plan?',
    priority: 6,
    category: 'nutrition',
    triggerCondition: 'prior_response:nutrition_adherence in [Struggled, Off track]',
    quickResponses: ['Cravings', 'Social events', 'Time constraints', 'Stress eating'],
    expectsFreeText: true,
  },
  {
    id: 'protein_intake',
    text: 'Did you hit your protein target today?',
    priority: 5,
    category: 'nutrition',
    triggerCondition: 'nutrition.proteinTarget && nutrition.proteinActual < nutrition.proteinTarget * 0.8',
    quickResponses: ['Yes', 'Close', 'Under', 'Way under'],
    expectsFreeText: true,
  },
  {
    id: 'hydration_check',
    text: 'How is your water intake today?',
    priority: 4,
    category: 'nutrition',
    triggerCondition: 'always',
    quickResponses: ['Well hydrated', 'Adequate', 'Could be better', 'Dehydrated'],
    expectsFreeText: true,
  },
  {
    id: 'energy_level',
    text: 'How are your energy levels today?',
    priority: 7,
    category: 'energy',
    triggerCondition: 'recovery.recoveryFeeling < 3 || bloodwork.flags.length > 0',
    quickResponses: ['High energy', 'Normal', 'Low energy', 'Exhausted'],
    expectsFreeText: true,
  },
  {
    id: 'energy_timing',
    text: 'When do you feel most tired?',
    priority: 8,
    category: 'energy',
    triggerCondition: 'prior_response:energy_level in [Low energy, Exhausted]',
    quickResponses: ['Morning', 'Afternoon', 'Evening', 'All day'],
    expectsFreeText: true,
  },
  {
    id: 'supplement_adherence',
    text: 'Did you take your supplements as planned?',
    priority: 6,
    category: 'supplements',
    triggerCondition: 'supplementAdherence < 80',
    quickResponses: ['All of them', 'Most', 'Some', 'None'],
    expectsFreeText: true,
  },
  {
    id: 'supplement_skip_reason',
    text: 'What caused you to miss your supplements?',
    priority: 7,
    category: 'supplements',
    triggerCondition: 'prior_response:supplement_adherence in [Some, None]',
    quickResponses: ['Forgot', 'Ran out', 'Side effects', 'Too many pills'],
    expectsFreeText: true,
  },
  {
    id: 'bloodwork_concern',
    text: 'Have you noticed any symptoms related to your recent bloodwork results?',
    priority: 9,
    category: 'bloodwork',
    triggerCondition: 'bloodwork.flags.length > 0',
    quickResponses: ['No symptoms', 'Mild symptoms', 'Noticeable symptoms', 'Concerning symptoms'],
    expectsFreeText: true,
  },
  {
    id: 'bloodwork_symptom_detail',
    text: 'What symptoms are you experiencing?',
    priority: 10,
    category: 'bloodwork',
    triggerCondition: 'prior_response:bloodwork_concern in [Noticeable symptoms, Concerning symptoms]',
    quickResponses: ['Fatigue', 'Brain fog', 'Weakness', 'Other'],
    expectsFreeText: true,
  },
  {
    id: 'body_composition_goal',
    text: 'How do you feel about your current body composition progress?',
    priority: 6,
    category: 'body_composition',
    triggerCondition: 'bodyComposition.trend === declining || bodyComposition.bodyFatPercent > bodyComposition.targetBodyFat',
    quickResponses: ['On track', 'Slow progress', 'Plateaued', 'Regressing'],
    expectsFreeText: true,
  },
  {
    id: 'body_composition_concern',
    text: 'What aspect of your physique concerns you most?',
    priority: 7,
    category: 'body_composition',
    triggerCondition: 'prior_response:body_composition_goal in [Plateaued, Regressing]',
    quickResponses: ['Body fat', 'Muscle mass', 'Strength', 'Overall appearance'],
    expectsFreeText: true,
  },
  {
    id: 'mood_check',
    text: 'How has your mood been today?',
    priority: 7,
    category: 'mental_health',
    triggerCondition: 'stress.level === high || recovery.score === low',
    quickResponses: ['Great', 'Good', 'Okay', 'Poor'],
    expectsFreeText: true,
  },
  {
    id: 'mood_impact',
    text: 'What has been affecting your mood?',
    priority: 8,
    category: 'mental_health',
    triggerCondition: 'prior_response:mood_check in [Okay, Poor]',
    quickResponses: ['Stress', 'Sleep', 'Work', 'Relationships'],
    expectsFreeText: true,
  },
  {
    id: 'appetite_check',
    text: 'How has your appetite been?',
    priority: 5,
    category: 'nutrition',
    triggerCondition: 'bloodwork.flags.includes("testosterone") || stress.level === high',
    quickResponses: ['Normal', 'Increased', 'Decreased', 'No appetite'],
    expectsFreeText: true,
  },
  {
    id: 'digestion_check',
    text: 'Any digestive issues or discomfort?',
    priority: 6,
    category: 'nutrition',
    triggerCondition: 'nutrition.adherence < 60 || prior_response:nutrition_challenges includes Cravings',
    quickResponses: ['None', 'Mild bloating', 'Discomfort', 'Significant issues'],
    expectsFreeText: true,
  },
  {
    id: 'workout_intensity',
    text: 'How intense was your workout today?',
    priority: 6,
    category: 'workout',
    triggerCondition: 'prior_response:workout_adherence in [Yes, fully, Partially]',
    quickResponses: ['Light', 'Moderate', 'Hard', 'Very hard'],
    expectsFreeText: true,
  },
  {
    id: 'workout_performance',
    text: 'How did you perform compared to your usual?',
    priority: 7,
    category: 'workout',
    triggerCondition: 'prior_response:workout_intensity in [Hard, Very hard]',
    quickResponses: ['Better', 'Same', 'Worse', 'Much worse'],
    expectsFreeText: true,
  },
  {
    id: 'injury_concern',
    text: 'Any new aches, pains, or injury concerns?',
    priority: 8,
    category: 'joint_health',
    triggerCondition: 'prior_response:workout_performance in [Worse, Much worse] || jointPain.hasActivePain',
    quickResponses: ['None', 'Minor soreness', 'Concerning pain', 'Injury'],
    expectsFreeText: true,
  },
  {
    id: 'medication_adherence',
    text: 'Are you taking any prescribed medications as directed?',
    priority: 7,
    category: 'medication',
    triggerCondition: 'bloodwork.flags.length > 0 || medications.count > 0',
    quickResponses: ['Yes, all', 'Mostly', 'Sometimes', 'No'],
    expectsFreeText: true,
  },
];

export const generateNextQuestion = async (
  context: InterviewContext,
  currentState: InterviewState,
): Promise<QuestionCandidate | null> => {
  const askedIds = new Set(currentState.questionsAsked);
  const candidates = QUESTION_BANK.filter(q => !askedIds.has(q.id));

  const scoredCandidates = candidates.map(q => {
    let score = q.priority;

    if (q.category === 'recovery' && context.recovery?.score === 'low') {
      score += 5;
    }
    if (q.category === 'stress' && context.stress?.level === 'high') {
      score += 25;
    }
    if (q.category === 'joint_health' && context.jointPain?.hasActivePain) {
      score += 30;
    }
    if (q.category === 'workout' && (context.workoutAdherence ?? 100) < 50) {
      score += 4;
    }
    if (q.category === 'sexual_health' && context.sexualHealth?.libido === 'low') {
      score += 20;
    }
    if (q.category === 'energy' && (context.bloodwork?.flags?.length ?? 0) > 0) {
      score += 15;
    }
    if (q.category === 'supplements' && (context.supplementAdherence ?? 100) < 80) {
      score += 10;
    }
    if (q.category === 'bloodwork' && (context.bloodwork?.flags?.length ?? 0) > 0) {
      score += 35;
    }
    if (q.category === 'body_composition' && context.bodyComposition?.trend === 'declining') {
      score += 12;
    }
    if (q.category === 'mental_health' && context.stress?.level === 'high') {
      score += 18;
    }
    if (q.category === 'medication' && (context.medications?.count ?? 0) > 0) {
      score += 15;
    }
    if (q.category === 'nutrition' && (context.nutrition?.adherence ?? 100) < 70) {
      score += 8;
    }

    if (q.triggerCondition.includes('prior_response')) {
      const lastResponse = currentState.responsesCollected[currentState.responsesCollected.length - 1];
      if (lastResponse && q.triggerCondition.includes(lastResponse.questionId)) {
        score += 8;
      }
    }

    return { question: q, score };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  return scoredCandidates.length > 0 ? scoredCandidates[0].question : null;
};

export const evaluateInterviewState = async (state: InterviewState): Promise<{
  hasSufficientSignal: boolean;
  missingAreas: string[];
}> => {
  const signal = state.signalCollected;
  const collectedCount = Object.values(signal).filter(Boolean).length;

  const missingAreas: string[] = [];
  if (!signal.recovery) missingAreas.push('recovery');
  if (!signal.stress) missingAreas.push('stress');
  if (!signal.workout) missingAreas.push('workout');
  if (!signal.nutrition) missingAreas.push('nutrition');

  const hasSufficientSignal = collectedCount >= 3 || state.questionsAsked.length >= 6;

  return { hasSufficientSignal, missingAreas };
};

export const determineFollowUp = async (
  context: InterviewContext,
  state: InterviewState,
  lastResponse: { questionId: string; answer: string },
): Promise<FollowUpDecision> => {
  const evaluation = await evaluateInterviewState(state);
  const hasFinalQuestion = state.questionsAsked.includes('final_open_question');

  if (evaluation.hasSufficientSignal && !hasFinalQuestion) {
    return {
      shouldAskFollowUp: true,
      nextQuestion: {
        id: 'final_open_question',
        text: 'Is there anything else you want to add?',
        priority: 100,
        category: 'general',
        triggerCondition: 'always',
        expectsFreeText: true,
      },
      reason: 'Asking final open-ended question',
      estimatedQuestionsRemaining: 1,
    };
  }

  if (evaluation.hasSufficientSignal && hasFinalQuestion) {
    return {
      shouldAskFollowUp: false,
      reason: 'Sufficient signal collected and final question asked',
      estimatedQuestionsRemaining: 0,
    };
  }

  if (state.questionsAsked.length >= 8 && !hasFinalQuestion) {
    return {
      shouldAskFollowUp: true,
      nextQuestion: {
        id: 'final_open_question',
        text: 'Is there anything else you want to add?',
        priority: 100,
        category: 'general',
        triggerCondition: 'always',
        expectsFreeText: true,
      },
      reason: 'Maximum questions reached, asking final question',
      estimatedQuestionsRemaining: 1,
    };
  }

  if (state.questionsAsked.length >= 8 && hasFinalQuestion) {
    return {
      shouldAskFollowUp: false,
      reason: 'Maximum questions reached and final question asked',
      estimatedQuestionsRemaining: 0,
    };
  }

  const nextQuestion = await generateNextQuestion(context, state);

  if (!nextQuestion && !hasFinalQuestion) {
    return {
      shouldAskFollowUp: true,
      nextQuestion: {
        id: 'final_open_question',
        text: 'Is there anything else you want to add?',
        priority: 100,
        category: 'general',
        triggerCondition: 'always',
        expectsFreeText: true,
      },
      reason: 'No more questions available, asking final question',
      estimatedQuestionsRemaining: 1,
    };
  }

  if (!nextQuestion && hasFinalQuestion) {
    return {
      shouldAskFollowUp: false,
      reason: 'No more relevant questions available',
      estimatedQuestionsRemaining: 0,
    };
  }

  return {
    shouldAskFollowUp: true,
    nextQuestion,
    reason: `Exploring ${nextQuestion.category} based on context`,
    estimatedQuestionsRemaining: Math.max(0, 3 - evaluation.missingAreas.length),
  };
};

export const identifyBranchingScenario = (
  context: InterviewContext,
  lastResponse?: { questionId: string; answer: string },
): BranchingScenario | null => {
  if (context.recovery?.sleepHours < 6 || lastResponse?.answer.toLowerCase().includes('terrible')) {
    return 'poor_sleep';
  }
  if (context.recovery?.score === 'low') {
    return 'poor_recovery';
  }
  if (context.stress?.level === 'high' || lastResponse?.answer.toLowerCase().includes('overwhelming')) {
    return 'high_stress';
  }
  if (context.jointPain?.hasActivePain || lastResponse?.answer.toLowerCase().includes('severe pain')) {
    return 'joint_pain';
  }
  if ((context.workoutAdherence ?? 100) < 30 || lastResponse?.answer.toLowerCase().includes('skipped')) {
    return 'missed_workout';
  }
  if (context.sexualHealth?.libido === 'low' || lastResponse?.answer.toLowerCase().includes('very low')) {
    return 'sexual_health_concern';
  }
  if (context.bloodwork?.criticalFlags && context.bloodwork.criticalFlags.length > 0) {
    return 'bloodwork_flag';
  }

  return null;
};

export const finalizeInterview = async (
  context: InterviewContext,
  state: InterviewState,
): Promise<InterviewSummary & { saveBackResult?: InterviewSaveBackResult }> => {
  const evaluation = await evaluateInterviewState(state);

  const signalQuality =
    Object.values(state.signalCollected).filter(Boolean).length >= 4
      ? 'high'
      : Object.values(state.signalCollected).filter(Boolean).length >= 2
        ? 'moderate'
        : 'low';

  const keyInsights: string[] = [];
  const areasExplored = state.responsesCollected.map(r => {
    const question = QUESTION_BANK.find(q => q.id === r.questionId);
    return question?.category ?? 'general';
  });

  const uniqueAreas = [...new Set(areasExplored)];

  state.responsesCollected.forEach(response => {
    if (response.answer.toLowerCase().includes('pain') || response.answer.toLowerCase().includes('severe')) {
      keyInsights.push(`Reported pain/discomfort: ${response.answer}`);
    }
    if (response.answer.toLowerCase().includes('stress') || response.answer.toLowerCase().includes('overwhelming')) {
      keyInsights.push(`High stress identified: ${response.answer}`);
    }
    if (response.answer.toLowerCase().includes('poor') || response.answer.toLowerCase().includes('terrible')) {
      keyInsights.push(`Poor recovery signal: ${response.answer}`);
    }
  });

  const recommendations: string[] = [];
  if (state.signalCollected.recovery === false || context.recovery?.score === 'low') {
    recommendations.push('Prioritize sleep and recovery protocols');
  }
  if (state.signalCollected.stress === false || context.stress?.level === 'high') {
    recommendations.push('Implement stress management techniques');
  }
  if (context.jointPain?.hasActivePain) {
    recommendations.push('Address joint pain before resuming high-intensity training');
  }

  // Save structured data back to engines
  let saveBackResult: InterviewSaveBackResult | undefined;
  try {
    saveBackResult = await saveInterviewOutputs(state.userId, state);
    
    if (saveBackResult.success) {
      console.log(`Interview saved: ${saveBackResult.conversationId}, engines updated: ${saveBackResult.enginesUpdated.join(', ')}`);
    } else {
      console.warn(`Interview save had errors: ${saveBackResult.errors?.join(', ')}`);
    }
  } catch (error) {
    console.error('Failed to save interview outputs:', error);
  }

  return {
    sessionId: state.sessionId,
    userId: state.userId,
    totalQuestions: state.questionsAsked.length,
    signalQuality,
    keyInsights,
    areasExplored: uniqueAreas,
    recommendations,
    completedAt: new Date().toISOString(),
    saveBackResult,
  };
};

export const startInterviewSession = async (userId: string, context: InterviewContext): Promise<InterviewState> => {
  const sessionId = randomUUID();

  const initialState: InterviewState = {
    sessionId,
    userId,
    questionsAsked: [],
    responsesCollected: [],
    signalCollected: {
      recovery: false,
      stress: false,
      workout: false,
      nutrition: false,
      sexualHealth: false,
      jointHealth: false,
    },
    branchingPath: [],
    isComplete: false,
  };

  interviewSessions.set(sessionId, initialState);
  return initialState;
};

export const recordResponse = async (
  sessionId: string,
  questionId: string,
  question: string,
  answer: string,
): Promise<InterviewState> => {
  const state = interviewSessions.get(sessionId);
  if (!state) {
    throw new Error(`Interview session ${sessionId} not found`);
  }

  state.responsesCollected.push({
    questionId,
    question,
    answer,
    timestamp: new Date().toISOString(),
  });

  state.questionsAsked.push(questionId);

  const questionData = QUESTION_BANK.find(q => q.id === questionId);
  if (questionData) {
    const category = questionData.category;
    if (category === 'recovery') state.signalCollected.recovery = true;
    if (category === 'stress') state.signalCollected.stress = true;
    if (category === 'workout') state.signalCollected.workout = true;
    if (category === 'nutrition') state.signalCollected.nutrition = true;
    if (category === 'sexual_health') state.signalCollected.sexualHealth = true;
    if (category === 'joint_health') state.signalCollected.jointHealth = true;
  }

  interviewSessions.set(sessionId, state);
  return state;
};

export const getInterviewSession = async (sessionId: string): Promise<InterviewState | null> => {
  return interviewSessions.get(sessionId) ?? null;
};

export const completeInterviewSession = async (sessionId: string, reason: string): Promise<void> => {
  const state = interviewSessions.get(sessionId);
  if (state) {
    state.isComplete = true;
    state.completionReason = reason as any;
    interviewSessions.set(sessionId, state);
  }
};
