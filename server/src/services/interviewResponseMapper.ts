import type { InterviewState } from '../types/dynamicFollowUps';
import type { StructuredInterviewData, ResponseMapping } from '../types/interviewSaveBack';

const SCALE_MAPPINGS = {
  sleep_quality: {
    'Great': 5,
    'Okay': 3,
    'Poor': 2,
    'Terrible': 1,
  },
  recovery_feeling: {
    'Fully recovered': 5,
    'Somewhat tired': 3,
    'Very fatigued': 2,
    'Exhausted': 1,
  },
  stress_level: {
    'Low': 1,
    'Moderate': 3,
    'High': 4,
    'Overwhelming': 5,
  },
  pain_level: {
    'No pain': 0,
    'Mild discomfort': 3,
    'Moderate pain': 6,
    'Severe pain': 9,
  },
  adherence: {
    '100%': 100,
    'Mostly': 80,
    'Struggled': 50,
    'Off track': 30,
  },
};

const extractSleepHours = (answer: string): number | undefined => {
  const match = answer.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
  if (match) return parseFloat(match[1]);
  
  if (answer.toLowerCase().includes('less than 5')) return 4;
  if (answer.toLowerCase().includes('5-6')) return 5.5;
  if (answer.toLowerCase().includes('6-7')) return 6.5;
  if (answer.toLowerCase().includes('7-8')) return 7.5;
  if (answer.toLowerCase().includes('8+')) return 8.5;
  
  return undefined;
};

const extractPainLevel = (answer: string): number | undefined => {
  const match = answer.match(/(\d+)(?:\/10)?/);
  if (match) return parseInt(match[1], 10);
  
  return SCALE_MAPPINGS.pain_level[answer as keyof typeof SCALE_MAPPINGS.pain_level];
};

const extractAdherencePercentage = (answer: string): number | undefined => {
  const match = answer.match(/(\d+)%/);
  if (match) return parseInt(match[1], 10);
  
  return SCALE_MAPPINGS.adherence[answer as keyof typeof SCALE_MAPPINGS.adherence];
};

const extractListItems = (answer: string): string[] => {
  const items = answer.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  if (items.length > 0) return items;
  
  return [answer];
};

export const mapInterviewResponsesToStructuredData = (
  userId: string,
  interviewState: InterviewState,
  conversationId: string
): StructuredInterviewData => {
  const structuredData: StructuredInterviewData = {
    userId,
    interviewDate: new Date().toISOString().split('T')[0],
    conversationId,
    rawConversation: interviewState.responsesCollected,
  };

  const responseMappings: ResponseMapping[] = [];

  for (const response of interviewState.responsesCollected) {
    const { questionId, answer } = response;
    const mapping: ResponseMapping = {
      questionId,
      answer,
      mappedTo: [],
    };

    switch (questionId) {
      case 'sleep_quality':
        if (!structuredData.recovery) structuredData.recovery = {};
        structuredData.recovery.sleepQuality = SCALE_MAPPINGS.sleep_quality[answer as keyof typeof SCALE_MAPPINGS.sleep_quality] ?? 3;
        mapping.mappedTo.push({ engine: 'recovery', field: 'sleepQuality', value: structuredData.recovery.sleepQuality });
        
        const hours = extractSleepHours(answer);
        if (hours) {
          structuredData.recovery.sleepHours = hours;
          mapping.mappedTo.push({ engine: 'recovery', field: 'sleepHours', value: hours });
        }
        break;

      case 'sleep_interruptions':
        if (!structuredData.recovery) structuredData.recovery = {};
        structuredData.recovery.sleepInterruptions = extractListItems(answer);
        mapping.mappedTo.push({ engine: 'recovery', field: 'sleepInterruptions', value: structuredData.recovery.sleepInterruptions });
        break;

      case 'recovery_feeling':
        if (!structuredData.recovery) structuredData.recovery = {};
        structuredData.recovery.recoveryFeeling = SCALE_MAPPINGS.recovery_feeling[answer as keyof typeof SCALE_MAPPINGS.recovery_feeling] ?? 3;
        mapping.mappedTo.push({ engine: 'recovery', field: 'recoveryFeeling', value: structuredData.recovery.recoveryFeeling });
        break;

      case 'stress_level':
        if (!structuredData.stress) structuredData.stress = {};
        structuredData.stress.level = SCALE_MAPPINGS.stress_level[answer as keyof typeof SCALE_MAPPINGS.stress_level] ?? 3;
        mapping.mappedTo.push({ engine: 'stress', field: 'level', value: structuredData.stress.level });
        break;

      case 'stress_sources':
        if (!structuredData.stress) structuredData.stress = {};
        structuredData.stress.sources = extractListItems(answer);
        mapping.mappedTo.push({ engine: 'stress', field: 'sources', value: structuredData.stress.sources });
        break;

      case 'joint_pain_check':
        if (!structuredData.jointHealth) structuredData.jointHealth = { hasActivePain: false };
        const painLevel = extractPainLevel(answer);
        structuredData.jointHealth.hasActivePain = painLevel !== undefined && painLevel > 0;
        structuredData.jointHealth.painLevel = painLevel;
        mapping.mappedTo.push({ engine: 'joint_health', field: 'painLevel', value: painLevel });
        break;

      case 'joint_pain_location':
        if (!structuredData.jointHealth) structuredData.jointHealth = { hasActivePain: true };
        structuredData.jointHealth.affectedAreas = extractListItems(answer);
        mapping.mappedTo.push({ engine: 'joint_health', field: 'affectedAreas', value: structuredData.jointHealth.affectedAreas });
        break;

      case 'workout_adherence':
        if (!structuredData.workoutReadiness) structuredData.workoutReadiness = {};
        structuredData.workoutReadiness.completed = answer.toLowerCase().includes('yes') || answer.toLowerCase().includes('fully');
        mapping.mappedTo.push({ engine: 'workout', field: 'completed', value: structuredData.workoutReadiness.completed });
        
        if (!structuredData.adherence) structuredData.adherence = {};
        structuredData.adherence.workoutAdherence = structuredData.workoutReadiness.completed ? 100 : 0;
        mapping.mappedTo.push({ engine: 'adherence', field: 'workoutAdherence', value: structuredData.adherence.workoutAdherence });
        break;

      case 'workout_skip_reason':
        if (!structuredData.workoutReadiness) structuredData.workoutReadiness = {};
        structuredData.workoutReadiness.skipReason = answer;
        if (!structuredData.adherence) structuredData.adherence = {};
        if (!structuredData.adherence.barriers) structuredData.adherence.barriers = [];
        structuredData.adherence.barriers.push(answer);
        mapping.mappedTo.push({ engine: 'adherence', field: 'barriers', value: answer });
        break;

      case 'workout_intensity':
        if (!structuredData.workoutReadiness) structuredData.workoutReadiness = {};
        const intensityMap: Record<string, 'light' | 'moderate' | 'hard' | 'very hard'> = {
          'Light': 'light',
          'Moderate': 'moderate',
          'Hard': 'hard',
          'Very hard': 'very hard',
        };
        structuredData.workoutReadiness.intensity = intensityMap[answer] ?? 'moderate';
        mapping.mappedTo.push({ engine: 'workout', field: 'intensity', value: structuredData.workoutReadiness.intensity });
        break;

      case 'workout_performance':
        if (!structuredData.workoutReadiness) structuredData.workoutReadiness = {};
        const perfMap: Record<string, 'better' | 'same' | 'worse' | 'much worse'> = {
          'Better': 'better',
          'Same': 'same',
          'Worse': 'worse',
          'Much worse': 'much worse',
        };
        structuredData.workoutReadiness.performance = perfMap[answer] ?? 'same';
        mapping.mappedTo.push({ engine: 'workout', field: 'performance', value: structuredData.workoutReadiness.performance });
        break;

      case 'nutrition_adherence':
        if (!structuredData.nutrition) structuredData.nutrition = {};
        structuredData.nutrition.adherence = extractAdherencePercentage(answer) ?? 70;
        if (!structuredData.adherence) structuredData.adherence = {};
        structuredData.adherence.nutritionAdherence = structuredData.nutrition.adherence;
        mapping.mappedTo.push({ engine: 'nutrition', field: 'adherence', value: structuredData.nutrition.adherence });
        break;

      case 'nutrition_challenges':
        if (!structuredData.nutrition) structuredData.nutrition = {};
        structuredData.nutrition.challenges = extractListItems(answer);
        mapping.mappedTo.push({ engine: 'nutrition', field: 'challenges', value: structuredData.nutrition.challenges });
        break;

      case 'protein_intake':
        if (!structuredData.nutrition) structuredData.nutrition = {};
        const proteinMatch = answer.match(/(\d+)\s*g/);
        if (proteinMatch) {
          structuredData.nutrition.proteinActual = parseInt(proteinMatch[1], 10);
          mapping.mappedTo.push({ engine: 'nutrition', field: 'proteinActual', value: structuredData.nutrition.proteinActual });
        }
        break;

      case 'hydration_check':
        if (!structuredData.nutrition) structuredData.nutrition = {};
        const hydrationMap: Record<string, 'well hydrated' | 'adequate' | 'could be better' | 'dehydrated'> = {
          'Well hydrated': 'well hydrated',
          'Adequate': 'adequate',
          'Could be better': 'could be better',
          'Dehydrated': 'dehydrated',
        };
        structuredData.nutrition.hydration = hydrationMap[answer] ?? 'adequate';
        mapping.mappedTo.push({ engine: 'nutrition', field: 'hydration', value: structuredData.nutrition.hydration });
        break;

      case 'appetite_check':
        if (!structuredData.nutrition) structuredData.nutrition = {};
        const appetiteMap: Record<string, 'normal' | 'increased' | 'decreased' | 'no appetite'> = {
          'Normal': 'normal',
          'Increased': 'increased',
          'Decreased': 'decreased',
          'No appetite': 'no appetite',
        };
        structuredData.nutrition.appetite = appetiteMap[answer] ?? 'normal';
        mapping.mappedTo.push({ engine: 'nutrition', field: 'appetite', value: structuredData.nutrition.appetite });
        break;

      case 'digestion_check':
        if (!structuredData.nutrition) structuredData.nutrition = {};
        const digestionMap: Record<string, 'none' | 'mild bloating' | 'discomfort' | 'significant issues'> = {
          'None': 'none',
          'Mild bloating': 'mild bloating',
          'Discomfort': 'discomfort',
          'Significant issues': 'significant issues',
        };
        structuredData.nutrition.digestion = digestionMap[answer] ?? 'none';
        mapping.mappedTo.push({ engine: 'nutrition', field: 'digestion', value: structuredData.nutrition.digestion });
        break;

      case 'sexual_health_check':
        if (!structuredData.sexualHealth) structuredData.sexualHealth = {};
        const libidoMap: Record<string, 'low' | 'moderate' | 'high'> = {
          'Normal': 'moderate',
          'Lower than usual': 'low',
          'Very low': 'low',
          'Non-existent': 'low',
        };
        structuredData.sexualHealth.libido = libidoMap[answer] ?? 'moderate';
        mapping.mappedTo.push({ engine: 'sexual_health', field: 'libido', value: structuredData.sexualHealth.libido });
        break;

      case 'sexual_health_duration':
        if (!structuredData.sexualHealth) structuredData.sexualHealth = {};
        structuredData.sexualHealth.duration = answer;
        mapping.mappedTo.push({ engine: 'sexual_health', field: 'duration', value: answer });
        break;

      case 'supplement_adherence':
        if (!structuredData.adherence) structuredData.adherence = {};
        const suppAdherence: Record<string, number> = {
          'All of them': 100,
          'Most': 80,
          'Some': 50,
          'None': 0,
        };
        structuredData.adherence.supplementAdherence = suppAdherence[answer] ?? 70;
        mapping.mappedTo.push({ engine: 'adherence', field: 'supplementAdherence', value: structuredData.adherence.supplementAdherence });
        break;

      case 'supplement_skip_reason':
        if (!structuredData.adherence) structuredData.adherence = {};
        if (!structuredData.adherence.barriers) structuredData.adherence.barriers = [];
        structuredData.adherence.barriers.push(`Supplements: ${answer}`);
        mapping.mappedTo.push({ engine: 'adherence', field: 'barriers', value: answer });
        break;

      case 'energy_level':
        if (!structuredData.energy) structuredData.energy = {};
        const energyMap: Record<string, 'high energy' | 'normal' | 'low energy' | 'exhausted'> = {
          'High energy': 'high energy',
          'Normal': 'normal',
          'Low energy': 'low energy',
          'Exhausted': 'exhausted',
        };
        structuredData.energy.level = energyMap[answer] ?? 'normal';
        mapping.mappedTo.push({ engine: 'energy', field: 'level', value: structuredData.energy.level });
        break;

      case 'energy_timing':
        if (!structuredData.energy) structuredData.energy = {};
        const timingMap: Record<string, 'morning' | 'afternoon' | 'evening' | 'all day'> = {
          'Morning': 'morning',
          'Afternoon': 'afternoon',
          'Evening': 'evening',
          'All day': 'all day',
        };
        structuredData.energy.timing = timingMap[answer] ?? 'all day';
        mapping.mappedTo.push({ engine: 'energy', field: 'timing', value: structuredData.energy.timing });
        break;

      case 'mood_check':
        if (!structuredData.mentalHealth) structuredData.mentalHealth = {};
        const moodMap: Record<string, 'great' | 'good' | 'okay' | 'poor'> = {
          'Great': 'great',
          'Good': 'good',
          'Okay': 'okay',
          'Poor': 'poor',
        };
        structuredData.mentalHealth.mood = moodMap[answer] ?? 'okay';
        mapping.mappedTo.push({ engine: 'mental_health', field: 'mood', value: structuredData.mentalHealth.mood });
        break;

      case 'mood_impact':
        if (!structuredData.mentalHealth) structuredData.mentalHealth = {};
        structuredData.mentalHealth.moodImpact = extractListItems(answer);
        mapping.mappedTo.push({ engine: 'mental_health', field: 'moodImpact', value: structuredData.mentalHealth.moodImpact });
        break;

      case 'bloodwork_concern':
        if (!structuredData.bloodworkSymptoms) structuredData.bloodworkSymptoms = { hasSymptoms: false };
        const symptomMap: Record<string, 'no symptoms' | 'mild symptoms' | 'noticeable symptoms' | 'concerning symptoms'> = {
          'No symptoms': 'no symptoms',
          'Mild symptoms': 'mild symptoms',
          'Noticeable symptoms': 'noticeable symptoms',
          'Concerning symptoms': 'concerning symptoms',
        };
        structuredData.bloodworkSymptoms.severity = symptomMap[answer] ?? 'no symptoms';
        structuredData.bloodworkSymptoms.hasSymptoms = answer !== 'No symptoms';
        mapping.mappedTo.push({ engine: 'bloodwork', field: 'severity', value: structuredData.bloodworkSymptoms.severity });
        break;

      case 'bloodwork_symptom_detail':
        if (!structuredData.bloodworkSymptoms) structuredData.bloodworkSymptoms = { hasSymptoms: true };
        structuredData.bloodworkSymptoms.symptoms = extractListItems(answer);
        mapping.mappedTo.push({ engine: 'bloodwork', field: 'symptoms', value: structuredData.bloodworkSymptoms.symptoms });
        break;

      case 'body_composition_goal':
        if (!structuredData.bodyComposition) structuredData.bodyComposition = {};
        const progressMap: Record<string, 'on track' | 'slow progress' | 'plateaued' | 'regressing'> = {
          'On track': 'on track',
          'Slow progress': 'slow progress',
          'Plateaued': 'plateaued',
          'Regressing': 'regressing',
        };
        structuredData.bodyComposition.progressFeeling = progressMap[answer] ?? 'on track';
        mapping.mappedTo.push({ engine: 'body_composition', field: 'progressFeeling', value: structuredData.bodyComposition.progressFeeling });
        break;

      case 'body_composition_concern':
        if (!structuredData.bodyComposition) structuredData.bodyComposition = {};
        structuredData.bodyComposition.concerns = extractListItems(answer);
        mapping.mappedTo.push({ engine: 'body_composition', field: 'concerns', value: structuredData.bodyComposition.concerns });
        break;

      case 'medication_adherence':
        if (!structuredData.medication) structuredData.medication = {};
        const medAdherenceMap: Record<string, 'yes, all' | 'mostly' | 'sometimes' | 'no'> = {
          'Yes, all': 'yes, all',
          'Mostly': 'mostly',
          'Sometimes': 'sometimes',
          'No': 'no',
        };
        structuredData.medication.adherence = medAdherenceMap[answer] ?? 'yes, all';
        mapping.mappedTo.push({ engine: 'medication', field: 'adherence', value: structuredData.medication.adherence });
        break;

      case 'injury_concern':
        if (!structuredData.jointHealth) structuredData.jointHealth = { hasActivePain: false };
        structuredData.jointHealth.impactsWorkout = answer.toLowerCase().includes('injury') || answer.toLowerCase().includes('concerning');
        mapping.mappedTo.push({ engine: 'joint_health', field: 'impactsWorkout', value: structuredData.jointHealth.impactsWorkout });
        break;

      case 'final_open_question':
        structuredData.additionalNotes = answer;
        mapping.mappedTo.push({ engine: 'general', field: 'additionalNotes', value: answer });
        break;

      default:
        if (answer && answer.toLowerCase() !== 'nothing else' && answer.toLowerCase() !== 'no') {
          if (!structuredData.additionalNotes) {
            structuredData.additionalNotes = answer;
          } else {
            structuredData.additionalNotes += `\n${answer}`;
          }
        }
        break;
    }

    responseMappings.push(mapping);
  }

  return structuredData;
};
