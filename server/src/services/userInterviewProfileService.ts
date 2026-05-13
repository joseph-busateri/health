/**
 * Phase 25: User Interview Profile Service
 * 
 * Purpose: Track user interview patterns, preferences, and data completeness
 * Features: Profile management, engagement tracking, data gap analysis
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface UserInterviewProfile {
  id: string;
  userId: string;
  totalInterviews: number;
  totalQuestionsAnswered: number;
  totalQuestionsSkipped: number;
  avgResponseLength?: number;
  avgInterviewDuration?: number;
  frequentTopics: Array<{ topic: string; count: number; lastMentioned: string }>;
  avoidedTopics: string[];
  preferredQuestionTypes: Record<string, number>;
  dataCompleteness: Record<string, number>;
  missingDataCategories: string[];
  lastDataGapAnalysis?: string;
  engagementScore: number;
  skipRate: number;
  avgConfidence?: number;
  questionPreferences: Record<string, any>;
  optimalInterviewLength: number;
  bestInterviewTime?: string;
  createdAt: string;
  updatedAt: string;
  lastInterviewAt?: string;
}

// ============================================================================
// GET OR CREATE PROFILE
// ============================================================================

export async function getOrCreateProfile(userId: string): Promise<UserInterviewProfile | null> {
  try {
    logger.info('👤 [INTERVIEW PROFILE] Getting or creating profile', { userId });

    const { data, error } = await supabase.rpc('get_or_create_interview_profile', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to get or create profile: ${error.message}`);
    }

    if (!data) {
      throw new Error('No profile returned from database');
    }

    const profile: UserInterviewProfile = mapDatabaseProfile(data);

    logger.info('✅ [INTERVIEW PROFILE] Profile retrieved', {
      userId,
      totalInterviews: profile.totalInterviews,
      engagementScore: profile.engagementScore,
    });

    return profile;
  } catch (error) {
    logger.error('❌ [INTERVIEW PROFILE] Failed to get or create profile', {
      error: (error as Error).message,
      userId,
    });
    return null;
  }
}

// ============================================================================
// UPDATE PROFILE AFTER INTERVIEW
// ============================================================================

export async function updateProfileAfterInterview(
  userId: string,
  sessionData: {
    questionsAnswered: number;
    questionsSkipped: number;
    durationSeconds: number;
  }
): Promise<boolean> {
  try {
    logger.info('📝 [INTERVIEW PROFILE] Updating profile after interview', {
      userId,
      ...sessionData,
    });

    const { error } = await supabase.rpc('update_profile_after_interview', {
      p_user_id: userId,
      p_questions_answered: sessionData.questionsAnswered,
      p_questions_skipped: sessionData.questionsSkipped,
      p_duration_seconds: sessionData.durationSeconds,
    });

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    logger.info('✅ [INTERVIEW PROFILE] Profile updated successfully', { userId });
    return true;
  } catch (error) {
    logger.error('❌ [INTERVIEW PROFILE] Failed to update profile', {
      error: (error as Error).message,
      userId,
    });
    return false;
  }
}

// ============================================================================
// UPDATE DATA COMPLETENESS
// ============================================================================

export async function updateDataCompleteness(
  userId: string,
  completeness: Record<string, number>
): Promise<boolean> {
  try {
    logger.info('📊 [INTERVIEW PROFILE] Updating data completeness', {
      userId,
      categories: Object.keys(completeness).length,
    });

    const { error } = await supabase
      .from('user_interview_profiles')
      .update({
        data_completeness: completeness,
        last_data_gap_analysis: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update data completeness: ${error.message}`);
    }

    logger.info('✅ [INTERVIEW PROFILE] Data completeness updated', { userId });
    return true;
  } catch (error) {
    logger.error('❌ [INTERVIEW PROFILE] Failed to update data completeness', {
      error: (error as Error).message,
      userId,
    });
    return false;
  }
}

// ============================================================================
// UPDATE FREQUENT TOPICS
// ============================================================================

export async function updateFrequentTopics(
  userId: string,
  topic: string
): Promise<boolean> {
  try {
    const profile = await getOrCreateProfile(userId);
    if (!profile) return false;

    const topics = [...profile.frequentTopics];
    const existingIndex = topics.findIndex(t => t.topic === topic);

    if (existingIndex >= 0) {
      topics[existingIndex].count++;
      topics[existingIndex].lastMentioned = new Date().toISOString();
    } else {
      topics.push({
        topic,
        count: 1,
        lastMentioned: new Date().toISOString(),
      });
    }

    // Keep top 20 topics
    topics.sort((a, b) => b.count - a.count);
    const topTopics = topics.slice(0, 20);

    const { error } = await supabase
      .from('user_interview_profiles')
      .update({
        frequent_topics: topTopics,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update frequent topics: ${error.message}`);
    }

    logger.info('✅ [INTERVIEW PROFILE] Frequent topics updated', {
      userId,
      topic,
      totalTopics: topTopics.length,
    });

    return true;
  } catch (error) {
    logger.error('❌ [INTERVIEW PROFILE] Failed to update frequent topics', {
      error: (error as Error).message,
      userId,
      topic,
    });
    return false;
  }
}

// ============================================================================
// CALCULATE ENGAGEMENT SCORE
// ============================================================================

export async function calculateEngagementScore(userId: string): Promise<number> {
  try {
    logger.info('📈 [INTERVIEW PROFILE] Calculating engagement score', { userId });

    const { data, error } = await supabase.rpc('calculate_engagement_score', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to calculate engagement score: ${error.message}`);
    }

    const score = parseFloat(data) || 0.5;

    logger.info('✅ [INTERVIEW PROFILE] Engagement score calculated', {
      userId,
      score,
    });

    return score;
  } catch (error) {
    logger.error('❌ [INTERVIEW PROFILE] Failed to calculate engagement score', {
      error: (error as Error).message,
      userId,
    });
    return 0.5; // Default score
  }
}

// ============================================================================
// GET OPTIMAL INTERVIEW LENGTH
// ============================================================================

export async function getOptimalInterviewLength(userId: string): Promise<number> {
  try {
    const profile = await getOrCreateProfile(userId);
    if (!profile) return 10; // Default

    // Adjust based on engagement
    if (profile.engagementScore > 0.8) {
      return Math.min(15, profile.optimalInterviewLength + 2);
    } else if (profile.engagementScore < 0.5) {
      return Math.max(5, profile.optimalInterviewLength - 2);
    }

    return profile.optimalInterviewLength;
  } catch (error) {
    logger.error('❌ [INTERVIEW PROFILE] Failed to get optimal length', {
      error: (error as Error).message,
      userId,
    });
    return 10; // Default
  }
}

// ============================================================================
// UPDATE QUESTION PREFERENCES
// ============================================================================

export async function updateQuestionPreferences(
  userId: string,
  questionType: string,
  outcome: 'answered' | 'skipped'
): Promise<boolean> {
  try {
    const profile = await getOrCreateProfile(userId);
    if (!profile) return false;

    const preferences = { ...profile.questionPreferences };
    
    if (!preferences[questionType]) {
      preferences[questionType] = { answered: 0, skipped: 0 };
    }

    if (outcome === 'answered') {
      preferences[questionType].answered++;
    } else {
      preferences[questionType].skipped++;
    }

    const { error } = await supabase
      .from('user_interview_profiles')
      .update({
        question_preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update question preferences: ${error.message}`);
    }

    return true;
  } catch (error) {
    logger.error('❌ [INTERVIEW PROFILE] Failed to update question preferences', {
      error: (error as Error).message,
      userId,
    });
    return false;
  }
}

// ============================================================================
// GET MISSING DATA CATEGORIES
// ============================================================================

export async function getMissingDataCategories(userId: string): Promise<string[]> {
  try {
    const profile = await getOrCreateProfile(userId);
    if (!profile) return [];

    const allCategories = [
      'sleep',
      'stress',
      'workout',
      'nutrition',
      'supplements',
      'energy',
      'mood',
      'pain',
      'recovery',
      'sexual_health',
    ];

    const completeness = profile.dataCompleteness;
    const missing = allCategories.filter(cat => {
      const score = completeness[cat] || 0;
      return score < 0.5; // Less than 50% complete
    });

    return missing;
  } catch (error) {
    logger.error('❌ [INTERVIEW PROFILE] Failed to get missing categories', {
      error: (error as Error).message,
      userId,
    });
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapDatabaseProfile(data: any): UserInterviewProfile {
  return {
    id: data.id,
    userId: data.user_id,
    totalInterviews: data.total_interviews || 0,
    totalQuestionsAnswered: data.total_questions_answered || 0,
    totalQuestionsSkipped: data.total_questions_skipped || 0,
    avgResponseLength: data.avg_response_length,
    avgInterviewDuration: data.avg_interview_duration,
    frequentTopics: data.frequent_topics || [],
    avoidedTopics: data.avoided_topics || [],
    preferredQuestionTypes: data.preferred_question_types || {},
    dataCompleteness: data.data_completeness || {},
    missingDataCategories: data.missing_data_categories || [],
    lastDataGapAnalysis: data.last_data_gap_analysis,
    engagementScore: parseFloat(data.engagement_score) || 0.5,
    skipRate: parseFloat(data.skip_rate) || 0,
    avgConfidence: data.avg_confidence ? parseFloat(data.avg_confidence) : undefined,
    questionPreferences: data.question_preferences || {},
    optimalInterviewLength: data.optimal_interview_length || 10,
    bestInterviewTime: data.best_interview_time,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastInterviewAt: data.last_interview_at,
  };
}
