import { supabase } from '../config/supabase';
import type { InterviewContext } from './hybridInterviewService';

type SexualHealthStatus = 'Aligned' | 'Monitoring' | 'Concerned';

const extractNumericScale = (answer: string): number | null => {
  // Try to extract number 1-5
  const numMatch = answer.match(/\b([1-5])\b/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }
  return null;
};

const extractSexualHealthMetrics = (conversationHistory: Array<{ question: string; answer: string }>) => {
  const metrics = {
    desireLevel: null as number | null,
    satisfactionLevel: null as number | null,
    stressImpact: null as number | null,
    notes: null as string | null,
  };

  conversationHistory.forEach(turn => {
    const answer = turn.answer.toLowerCase();
    const question = turn.question.toLowerCase();

    // Desire/libido level
    if (question.includes('libido')) {
      const num = extractNumericScale(answer);
      if (num) {
        metrics.desireLevel = num;
      } else {
        // Keyword fallback
        if (answer.includes('very low')) metrics.desireLevel = 1;
        else if (answer.includes('lower') || answer.includes('low')) metrics.desireLevel = 2;
        else if (answer.includes('normal')) metrics.desireLevel = 3;
        else if (answer.includes('higher') && !answer.includes('very')) metrics.desireLevel = 4;
        else if (answer.includes('very high') || answer.includes('high')) metrics.desireLevel = 5;
      }
    }

    // Satisfaction level
    if (question.includes('satisfied') && question.includes('sexual health')) {
      const num = extractNumericScale(answer);
      if (num) {
        metrics.satisfactionLevel = num;
      } else {
        // Keyword fallback
        if (answer.includes('very dissatisfied')) metrics.satisfactionLevel = 1;
        else if (answer.includes('dissatisfied')) metrics.satisfactionLevel = 2;
        else if (answer.includes('neutral')) metrics.satisfactionLevel = 3;
        else if (answer.includes('satisfied') && !answer.includes('very')) metrics.satisfactionLevel = 4;
        else if (answer.includes('very satisfied')) metrics.satisfactionLevel = 5;
      }
    }

    // Stress impact
    if (question.includes('stress impacting') || (question.includes('stress') && question.includes('intimacy'))) {
      const num = extractNumericScale(answer);
      if (num) {
        metrics.stressImpact = num;
      } else {
        // Keyword fallback
        if (answer.includes('no impact')) metrics.stressImpact = 1;
        else if (answer.includes('minimal')) metrics.stressImpact = 2;
        else if (answer.includes('moderate')) metrics.stressImpact = 3;
        else if (answer.includes('significant')) metrics.stressImpact = 4;
        else if (answer.includes('severe')) metrics.stressImpact = 5;
      }

      // Capture additional notes if answer is detailed
      if (turn.answer.length > 20) {
        metrics.notes = turn.answer;
      }
    }
  });

  return metrics;
};

const determineSexualHealthStatus = (
  desireLevel: number,
  satisfactionLevel: number,
  stressImpact: number
): SexualHealthStatus => {
  // Concerned: Low desire OR low satisfaction OR high stress
  if (desireLevel <= 2 || satisfactionLevel <= 2 || stressImpact >= 4) {
    return 'Concerned';
  }

  // Aligned: Good desire AND good satisfaction AND low stress
  if (desireLevel >= 4 && satisfactionLevel >= 4 && stressImpact <= 2) {
    return 'Aligned';
  }

  // Monitoring: Everything else
  return 'Monitoring';
};

const saveSexualHealthCheckIn = async (
  userId: string,
  desireLevel: number,
  satisfactionLevel: number,
  stressImpact: number,
  notes?: string | null
): Promise<void> => {
  try {
    const status = determineSexualHealthStatus(desireLevel, satisfactionLevel, stressImpact);

    const { error } = await supabase
      .from('sexual_health_check_ins')
      .insert({
        user_id: userId,
        taken_at: new Date().toISOString(),
        desire_level: desireLevel,
        satisfaction_level: satisfactionLevel,
        stress_impact: stressImpact,
        status: status,
        notes: notes || null,
      });

    if (error) {
      console.error('Error saving sexual health check-in:', error);
    }
  } catch (error) {
    console.error('Error in saveSexualHealthCheckIn:', error);
  }
};

export const buildInterviewContext = async (userId: string): Promise<InterviewContext> => {
  const context: InterviewContext = {
    userId,
  };

  try {
    // Fetch recent daily logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: dailyLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false })
      .limit(7);

    if (dailyLogs && dailyLogs.length > 0) {
      const avgSleep = dailyLogs.reduce((sum, log) => sum + (log.sleep_hours || 0), 0) / dailyLogs.length;
      const avgSleepQuality = dailyLogs.reduce((sum, log) => sum + (log.sleep_quality || 0), 0) / dailyLogs.length;
      const avgStress = dailyLogs.reduce((sum, log) => sum + (log.stress_level || 0), 0) / dailyLogs.length;

      context.recovery = {
        sleepHours: Math.round(avgSleep * 10) / 10,
        sleepQuality: Math.round(avgSleepQuality),
        score: avgSleep < 6 ? 'low' : avgSleep < 7 ? 'moderate' : 'good',
        status: avgSleep < 6 ? 'At Risk' : avgSleep < 7 ? 'Needs Attention' : 'Normal',
      };

      context.stress = {
        level: avgStress > 7 ? 'high' : avgStress > 4 ? 'moderate' : 'low',
      };
    }

    // Fetch recent bloodwork (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: bloodwork } = await supabase
      .from('bloodwork_results')
      .select('*')
      .eq('user_id', userId)
      .gte('test_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('test_date', { ascending: false })
      .limit(1);

    if (bloodwork && bloodwork.length > 0) {
      const result = bloodwork[0];
      const flags: string[] = [];
      const criticalFlags: string[] = [];

      // Check for abnormal values
      if (result.triglycerides && result.triglycerides > 200) {
        flags.push('triglycerides');
        if (result.triglycerides > 400) criticalFlags.push('triglycerides');
      }
      if (result.ldl_cholesterol && result.ldl_cholesterol > 130) {
        flags.push('ldl');
        if (result.ldl_cholesterol > 160) criticalFlags.push('ldl');
      }
      if (result.hdl_cholesterol && result.hdl_cholesterol < 40) {
        flags.push('hdl');
      }
      if (result.glucose && result.glucose > 100) {
        flags.push('glucose');
        if (result.glucose > 125) criticalFlags.push('glucose');
      }
      if (result.testosterone && result.testosterone < 300) {
        flags.push('testosterone');
      }

      context.bloodwork = {
        flags,
        criticalFlags,
      };
    }

    // Fetch workout adherence (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: workoutLogs } = await supabase
      .from('daily_logs')
      .select('workout_completed')
      .eq('user_id', userId)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (workoutLogs && workoutLogs.length > 0) {
      const completed = workoutLogs.filter(log => log.workout_completed).length;
      context.workoutAdherence = Math.round((completed / workoutLogs.length) * 100);
    }

    // Fetch supplement adherence (last 30 days)
    const { data: supplementLogs } = await supabase
      .from('supplement_adherence_log')
      .select('adherence_percentage')
      .eq('user_id', userId)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (supplementLogs && supplementLogs.length > 0) {
      const avgAdherence = supplementLogs.reduce((sum, log) => sum + (log.adherence_percentage || 0), 0) / supplementLogs.length;
      context.supplementAdherence = Math.round(avgAdherence);
    }

    // Check for active joint pain
    const { data: recentLogs } = await supabase
      .from('daily_logs')
      .select('joint_pain_level')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(3);

    if (recentLogs && recentLogs.length > 0) {
      const hasActivePain = recentLogs.some(log => (log.joint_pain_level || 0) > 2);
      context.jointPain = {
        hasActivePain,
      };
    }

    // Fetch nutrition adherence (last 30 days)
    const { data: nutritionLogs } = await supabase
      .from('daily_logs')
      .select('nutrition_adherence')
      .eq('user_id', userId)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (nutritionLogs && nutritionLogs.length > 0) {
      const avgNutrition = nutritionLogs.reduce((sum, log) => sum + (log.nutrition_adherence || 0), 0) / nutritionLogs.length;
      context.nutrition = {
        adherence: Math.round(avgNutrition),
      };
    }

    // Fetch recommendation adherence
    const { data: recommendations } = await supabase
      .from('unified_recommendations')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'accepted', 'dismissed'])
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recommendations && recommendations.length > 0) {
      const total = recommendations.length;
      const accepted = recommendations.filter(r => r.status === 'accepted').length;
      const acceptance = total > 0 ? (accepted / total) * 100 : 0;

      context.recommendationAdherence = {
        total,
        implemented: accepted,
        acceptance: Math.round(acceptance),
        barriers: [],
      };
    }

    // Fetch body composition trend
    const { data: bodyComp } = await supabase
      .from('body_composition')
      .select('body_fat_percentage, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2);

    if (bodyComp && bodyComp.length >= 2) {
      const current = bodyComp[0].body_fat_percentage;
      const previous = bodyComp[1].body_fat_percentage;
      const trend = current < previous ? 'improving' : current > previous ? 'declining' : 'stable';

      context.bodyComposition = {
        trend,
      };
    }

  } catch (error) {
    console.error('Error building interview context:', error);
  }

  return context;
};

export const saveInterviewToDatabase = async (
  userId: string,
  sessionId: string,
  conversationHistory: Array<{
    questionId: string;
    question: string;
    answer: string;
    timestamp: string;
    timeElapsed: number;
  }>,
  signalCollected: {
    recovery: boolean;
    stress: boolean;
    workout: boolean;
    nutrition: boolean;
    supplements: boolean;
  }
): Promise<void> => {
  try {
    // Extract key metrics from conversation
    const answers = conversationHistory.map(turn => ({
      question: turn.question,
      answer: turn.answer,
    }));

    // Create a daily log entry
    const today = new Date().toISOString().split('T')[0];

    const logData: any = {
      user_id: userId,
      log_date: today,
      interview_session_id: sessionId,
      interview_answers: answers,
      interview_completed_at: new Date().toISOString(),
    };

    // Extract specific metrics from answers if available
    conversationHistory.forEach(turn => {
      const answer = turn.answer.toLowerCase();
      
      // Sleep hours
      if (turn.question.toLowerCase().includes('sleep')) {
        const sleepMatch = answer.match(/(\d+\.?\d*)\s*h/i) || answer.match(/(\d+\.?\d*)/);
        if (sleepMatch) {
          logData.sleep_hours = parseFloat(sleepMatch[1]);
        }
        
        if (answer.includes('great') || answer.includes('7-9h')) {
          logData.sleep_quality = 5;
        } else if (answer.includes('okay') || answer.includes('6-7h')) {
          logData.sleep_quality = 3;
        } else if (answer.includes('poor') || answer.includes('<6h')) {
          logData.sleep_quality = 2;
        } else if (answer.includes('terrible')) {
          logData.sleep_quality = 1;
        }
      }

      // Stress level
      if (turn.question.toLowerCase().includes('stress')) {
        if (answer.includes('overwhelming')) {
          logData.stress_level = 10;
        } else if (answer.includes('high')) {
          logData.stress_level = 7;
        } else if (answer.includes('moderate')) {
          logData.stress_level = 5;
        } else if (answer.includes('low')) {
          logData.stress_level = 2;
        }
      }

      // Workout completion
      if (turn.question.toLowerCase().includes('workout')) {
        logData.workout_completed = answer.includes('yes') || answer.includes('fully');
      }

      // Energy level
      if (turn.question.toLowerCase().includes('energy')) {
        if (answer.includes('high')) {
          logData.energy_level = 5;
        } else if (answer.includes('normal')) {
          logData.energy_level = 3;
        } else if (answer.includes('low')) {
          logData.energy_level = 2;
        } else if (answer.includes('exhausted')) {
          logData.energy_level = 1;
        }
      }

      // Mood
      if (turn.question.toLowerCase().includes('mood')) {
        if (answer.includes('great')) {
          logData.mood = 5;
        } else if (answer.includes('good')) {
          logData.mood = 4;
        } else if (answer.includes('okay')) {
          logData.mood = 3;
        } else if (answer.includes('poor')) {
          logData.mood = 2;
        }
      }
    });

    // Extract sexual health metrics (if Saturday and questions were asked)
    const sexualHealthData = extractSexualHealthMetrics(conversationHistory);
    
    // Save sexual health check-in if data was collected
    if (sexualHealthData.desireLevel && sexualHealthData.satisfactionLevel && sexualHealthData.stressImpact) {
      await saveSexualHealthCheckIn(
        userId,
        sexualHealthData.desireLevel,
        sexualHealthData.satisfactionLevel,
        sexualHealthData.stressImpact,
        sexualHealthData.notes
      );
    }

    // Upsert to daily_logs
    const { error } = await supabase
      .from('daily_logs')
      .upsert(logData, {
        onConflict: 'user_id,log_date',
      });

    if (error) {
      console.error('Error saving interview to database:', error);
    }
  } catch (error) {
    console.error('Error in saveInterviewToDatabase:', error);
  }
};
