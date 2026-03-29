export interface StructuredInterviewData {
  userId: string;
  interviewDate: string;
  conversationId: string;
  
  // Recovery Engine Inputs
  recovery?: {
    sleepHours?: number;
    sleepQuality?: number; // 1-5 scale
    sleepInterruptions?: string[];
    recoveryFeeling?: number; // 1-5 scale
    hrv?: number;
    restingHr?: number;
  };
  
  // Stress Engine Inputs
  stress?: {
    level?: number; // 1-5 scale
    sources?: string[];
    cnsLoad?: number;
    copingStrategies?: string[];
  };
  
  // Joint Health Engine Inputs
  jointHealth?: {
    hasActivePain: boolean;
    painLevel?: number; // 0-10 scale
    affectedAreas?: string[];
    tightnessLevel?: number;
    sorenessLevel?: number;
    impactsWorkout?: boolean;
  };
  
  // Adherence Engine Inputs
  adherence?: {
    workoutAdherence?: number; // 0-100
    nutritionAdherence?: number; // 0-100
    supplementAdherence?: number; // 0-100
    sleepAdherence?: number; // 0-100
    barriers?: string[];
  };
  
  // Sexual Health Inputs
  sexualHealth?: {
    libido?: 'low' | 'moderate' | 'high';
    performance?: 'poor' | 'fair' | 'good';
    duration?: string;
    concerns?: string[];
  };
  
  // Workout Readiness
  workoutReadiness?: {
    completed?: boolean;
    intensity?: 'light' | 'moderate' | 'hard' | 'very hard';
    performance?: 'better' | 'same' | 'worse' | 'much worse';
    skipReason?: string;
    plannedSessions?: number;
    completedSessions?: number;
  };
  
  // Nutrition Signals
  nutrition?: {
    adherence?: number; // 0-100
    proteinTarget?: number;
    proteinActual?: number;
    hydration?: 'well hydrated' | 'adequate' | 'could be better' | 'dehydrated';
    challenges?: string[];
    appetite?: 'normal' | 'increased' | 'decreased' | 'no appetite';
    digestion?: 'none' | 'mild bloating' | 'discomfort' | 'significant issues';
  };
  
  // Energy & Mental Health
  energy?: {
    level?: 'high energy' | 'normal' | 'low energy' | 'exhausted';
    timing?: 'morning' | 'afternoon' | 'evening' | 'all day';
  };
  
  mentalHealth?: {
    mood?: 'great' | 'good' | 'okay' | 'poor';
    moodImpact?: string[];
  };
  
  // Bloodwork-Related Symptoms
  bloodworkSymptoms?: {
    hasSymptoms: boolean;
    symptoms?: string[];
    severity?: 'no symptoms' | 'mild symptoms' | 'noticeable symptoms' | 'concerning symptoms';
  };
  
  // Body Composition Perception
  bodyComposition?: {
    progressFeeling?: 'on track' | 'slow progress' | 'plateaued' | 'regressing';
    concerns?: string[];
  };
  
  // Medication & Supplement Tracking
  medication?: {
    adherence?: 'yes, all' | 'mostly' | 'sometimes' | 'no';
    missedReasons?: string[];
  };
  
  // Free Text & Additional Context
  additionalNotes?: string;
  rawConversation: Array<{
    questionId: string;
    question: string;
    answer: string;
    timestamp: string;
  }>;
}

export interface InterviewSaveBackResult {
  success: boolean;
  conversationId: string;
  structuredData: StructuredInterviewData;
  enginesUpdated: string[];
  pointInTimeRecordId?: string;
  errors?: string[];
}

export interface ResponseMapping {
  questionId: string;
  answer: string;
  mappedTo: {
    engine: string;
    field: string;
    value: any;
  }[];
}

export interface EngineSaveBackStatus {
  engine: string;
  success: boolean;
  recordId?: string;
  error?: string;
}
