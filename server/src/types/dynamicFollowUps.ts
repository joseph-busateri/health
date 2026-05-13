export interface InterviewContext {
  userId: string;
  controlTower?: {
    overallHealthScore: number;
    status: 'Optimal' | 'Stable' | 'At Risk' | 'No Data';
    dailyRecommendation: string;
  };
  recovery?: {
    score: 'low' | 'moderate' | 'high';
    sleepHours: number;
    sleepQuality: number;
    recoveryFeeling: number;
  };
  stress?: {
    level: 'low' | 'moderate' | 'high';
    sources: string[];
    trend: 'improving' | 'stable' | 'worsening';
  };
  sexualHealth?: {
    libido: 'low' | 'moderate' | 'high';
    performance: 'poor' | 'fair' | 'good';
    concerns: string[];
  };
  bodyComposition?: {
    weight: number;
    bodyFat: number;
    bodyFatPercent: number;
    muscleMass: number;
    trend: 'gaining' | 'stable' | 'losing' | 'declining';
    targetBodyFat?: number;
  };
  bloodwork?: {
    hasRecentResults: boolean;
    criticalFlags: string[];
    flags: string[];
    recommendations: string[];
  };
  nutrition?: {
    adherence: number;
    proteinTarget?: number;
    proteinActual?: number;
    calorieTarget?: number;
    calorieActual?: number;
  };
  supplementAdherence?: number;
  medications?: {
    count: number;
    adherence: number;
  };
  priorResponses?: {
    question: string;
    answer: string;
    timestamp: string;
  }[];
  workoutAdherence?: number;
  jointPain?: {
    hasActivePain: boolean;
    location: string[];
    severity: number;
  };
}

export interface QuestionCandidate {
  id: string;
  text: string;
  priority: number;
  category: 'recovery' | 'stress' | 'workout' | 'nutrition' | 'sexual_health' | 'joint_health' | 'general' | 'energy' | 'supplements' | 'bloodwork' | 'body_composition' | 'mental_health' | 'medication';
  triggerCondition: string;
  quickResponses?: string[];
  expectsFreeText: boolean;
}

export interface InterviewState {
  sessionId: string;
  userId: string;
  questionsAsked: string[];
  responsesCollected: {
    questionId: string;
    question: string;
    answer: string;
    timestamp: string;
  }[];
  signalCollected: {
    recovery: boolean;
    stress: boolean;
    workout: boolean;
    nutrition: boolean;
    sexualHealth: boolean;
    jointHealth: boolean;
  };
  branchingPath: string[];
  isComplete: boolean;
  completionReason?: 'sufficient_signal' | 'user_ended' | 'max_questions';
}

export interface FollowUpDecision {
  shouldAskFollowUp: boolean;
  nextQuestion?: QuestionCandidate;
  reason: string;
  estimatedQuestionsRemaining: number;
}

export interface InterviewSummary {
  sessionId: string;
  userId: string;
  totalQuestions: number;
  signalQuality: 'low' | 'moderate' | 'high';
  keyInsights: string[];
  areasExplored: string[];
  recommendations: string[];
  completedAt: string;
}

export type BranchingScenario =
  | 'poor_sleep'
  | 'poor_recovery'
  | 'high_stress'
  | 'joint_pain'
  | 'missed_workout'
  | 'sexual_health_concern'
  | 'nutrition_issue'
  | 'bloodwork_flag';
