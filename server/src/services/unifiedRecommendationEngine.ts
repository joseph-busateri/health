import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import type {
  UnifiedRecommendation,
  CreateUnifiedRecommendationRequest,
  AcceptRecommendationRequest,
  DismissRecommendationRequest,
  GetRecommendationsRequest,
  GetRecommendationsResponse,
  RecommendationContext,
  GenerateRecommendationsRequest,
  GenerateRecommendationsResponse,
  RecommendationSource,
  RecommendationPriority,
  RecommendationTimeframe
} from '../types/unifiedRecommendations';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
  const inputCost = (usage.prompt_tokens / 1000) * 0.0025;
  const outputCost = (usage.completion_tokens / 1000) * 0.01;
  return inputCost + outputCost;
}

/**
 * Build comprehensive context for recommendation generation
 */
async function buildRecommendationContext(userId: string): Promise<RecommendationContext> {
  const context: RecommendationContext = { user_id: userId };

  try {
    // Get latest bloodwork
    const { data: bloodworkDocs } = await supabase
      .from('bloodwork_documents')
      .select('id, test_date')
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(1);

    if (bloodworkDocs && bloodworkDocs.length > 0) {
      const { data: markers } = await supabase
        .from('bloodwork_results')
        .select('raw_test_name, value_numeric, unit, abnormal_flag')
        .eq('document_id', bloodworkDocs[0].id)
        .limit(20);

      if (markers) {
        context.latest_bloodwork = {
          document_id: bloodworkDocs[0].id,
          test_date: bloodworkDocs[0].test_date,
          markers: markers.map(m => ({
            name: m.raw_test_name,
            value: m.value_numeric || 0,
            unit: m.unit || '',
            abnormal: !!m.abnormal_flag
          }))
        };
      }
    }

    // Get latest body composition
    const { data: bodyComp } = await supabase
      .from('body_composition_scans')
      .select('id, scan_date, weight, body_fat_percentage, skeletal_muscle_mass')
      .eq('user_id', userId)
      .order('scan_date', { ascending: false })
      .limit(1)
      .single();

    if (bodyComp) {
      context.latest_body_composition = {
        scan_id: bodyComp.id,
        scan_date: bodyComp.scan_date,
        weight: bodyComp.weight || 0,
        body_fat_percentage: bodyComp.body_fat_percentage || 0,
        muscle_mass: bodyComp.skeletal_muscle_mass || 0
      };
    }

    // Get device data (last 7 days average)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Apple Watch data
    const { data: appleWatchData } = await supabase
      .from('apple_watch_sleep')
      .select('sleep_duration_hours')
      .eq('user_id', userId)
      .gte('sleep_date', sevenDaysAgo);

    const { data: hrvData } = await supabase
      .from('apple_watch_hrv')
      .select('hrv_value')
      .eq('user_id', userId)
      .gte('measurement_date', sevenDaysAgo);

    const { data: activityData } = await supabase
      .from('apple_watch_activity')
      .select('active_minutes, steps')
      .eq('user_id', userId)
      .gte('activity_date', sevenDaysAgo);

    if (appleWatchData || hrvData || activityData) {
      context.device_data = {
        avg_sleep_hours: appleWatchData?.reduce((sum, d) => sum + (d.sleep_duration_hours || 0), 0) / (appleWatchData?.length || 1) || 0,
        avg_hrv: hrvData?.reduce((sum, d) => sum + (d.hrv_value || 0), 0) / (hrvData?.length || 1) || 0,
        avg_resting_hr: 0, // TODO: Add resting HR query
        avg_activity_minutes: activityData?.reduce((sum, d) => sum + (d.active_minutes || 0), 0) / (activityData?.length || 1) || 0,
        avg_steps: activityData?.reduce((sum, d) => sum + (d.steps || 0), 0) / (activityData?.length || 1) || 0
      };
    }

    // Get active goals
    const { data: goals } = await supabase
      .from('goals')
      .select('id, goal_name, goal_category')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (goals) {
      context.active_goals = goals.map(g => ({
        id: g.id,
        name: g.goal_name,
        category: g.goal_category,
        progress: 0, // TODO: Calculate progress
        on_track: true // TODO: Calculate on_track
      }));
    }

    // Get baseline profile
    const { data: baseline } = await supabase
      .from('baseline_documents')
      .select('demographics, health_goals')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (baseline) {
      const demographics = baseline.demographics as any;
      const healthGoals = baseline.health_goals as any;
      
      context.baseline = {
        age: demographics?.age || 0,
        gender: demographics?.gender || '',
        health_goals: healthGoals?.goals || []
      };
    }

    // Get supplement stack (using NEW system: supplement_stack_versions + supplements)
    const { data: currentStackVersion } = await supabase
      .from('supplement_stack_versions')
      .select('id, version_number')
      .eq('user_id', userId)
      .eq('is_current', true)
      .single();

    if (currentStackVersion) {
      const { data: supplementItems } = await supabase
        .from('supplements')
        .select('supplement_name, dosage_amount, dosage_unit, frequency, timing, status, goal')
        .eq('stack_version_id', currentStackVersion.id)
        .eq('status', 'active')
        .order('supplement_order');

      if (supplementItems) {
        context.supplements = supplementItems.map(s => ({
          name: s.supplement_name,
          dosage: s.dosage_amount || 0,
          dosage_unit: s.dosage_unit || 'unit',
          frequency: s.frequency || 'daily',
          timing: s.timing || 'unspecified',
          status: s.status as 'active' | 'paused' | 'removed',
          goal: s.goal
        }));
      }
    }

    // Get workout program
    const { data: workoutProgram } = await supabase
      .from('workout_programs')
      .select('program_name, split_type, days_per_week, rest_days')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (workoutProgram) {
      context.workout_program = {
        program_name: workoutProgram.program_name || 'Unknown',
        split_type: workoutProgram.split_type || 'Unknown',
        days_per_week: workoutProgram.days_per_week || 0,
        rest_days: workoutProgram.rest_days || 0
      };
    }

    // Get daily logs (last 30 days for pattern analysis)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: dailyLogs } = await supabase
      .from('daily_logs')
      .select('sleep_hours, energy_level, mood, stress_level, workout_adherence, nutrition_adherence')
      .eq('user_id', userId)
      .gte('log_date', thirtyDaysAgo);

    if (dailyLogs && dailyLogs.length > 0) {
      const totalLogs = dailyLogs.length;
      context.daily_logs = {
        avg_sleep_hours: dailyLogs.reduce((sum, l) => sum + (l.sleep_hours || 0), 0) / totalLogs,
        avg_energy_level: dailyLogs.reduce((sum, l) => sum + (l.energy_level || 0), 0) / totalLogs,
        avg_mood: dailyLogs.reduce((sum, l) => sum + (l.mood || 0), 0) / totalLogs,
        avg_stress_level: dailyLogs.reduce((sum, l) => sum + (l.stress_level || 0), 0) / totalLogs,
        workout_adherence_avg: dailyLogs.reduce((sum, l) => sum + (l.workout_adherence || 0), 0) / totalLogs,
        nutrition_adherence_avg: dailyLogs.reduce((sum, l) => sum + (l.nutrition_adherence || 0), 0) / totalLogs,
        total_logs: totalLogs
      };
    }

    // Get historical recommendations (learning from past)
    const { data: allRecommendations } = await supabase
      .from('unified_recommendations')
      .select('id, title, category, status, accepted_at, dismissed_at, dismissal_reason')
      .eq('user_id', userId);

    if (allRecommendations && allRecommendations.length > 0) {
      const accepted = allRecommendations.filter(r => r.status === 'accepted');
      const dismissed = allRecommendations.filter(r => r.status === 'dismissed');
      
      // Count by category
      const acceptedByCategory: Record<string, number> = {};
      const dismissedByCategory: Record<string, number> = {};
      
      accepted.forEach(r => {
        acceptedByCategory[r.category] = (acceptedByCategory[r.category] || 0) + 1;
      });
      
      dismissed.forEach(r => {
        dismissedByCategory[r.category] = (dismissedByCategory[r.category] || 0) + 1;
      });
      
      // Sort categories by count
      const mostAcceptedCategories = Object.entries(acceptedByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);
      
      const mostDismissedCategories = Object.entries(dismissedByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);
      
      context.historical_recommendations = {
        total_generated: allRecommendations.length,
        total_accepted: accepted.length,
        total_dismissed: dismissed.length,
        acceptance_rate: allRecommendations.length > 0 ? (accepted.length / allRecommendations.length) * 100 : 0,
        most_accepted_categories: mostAcceptedCategories,
        most_dismissed_categories: mostDismissedCategories,
        recent_accepted: accepted
          .sort((a, b) => new Date(b.accepted_at!).getTime() - new Date(a.accepted_at!).getTime())
          .slice(0, 5)
          .map(r => ({
            title: r.title,
            category: r.category,
            accepted_at: r.accepted_at!
          })),
        recent_dismissed: dismissed
          .sort((a, b) => new Date(b.dismissed_at!).getTime() - new Date(a.dismissed_at!).getTime())
          .slice(0, 5)
          .map(r => ({
            title: r.title,
            category: r.category,
            dismissal_reason: r.dismissal_reason
          }))
      };
    }

  } catch (error) {
    logger.error('Error building recommendation context', { error, userId });
  }

  return context;
}

/**
 * Generate AI-enhanced recommendations using all available data
 */
async function generateAIRecommendations(
  context: RecommendationContext
): Promise<{ recommendations: CreateUnifiedRecommendationRequest[]; cost: number }> {
  const startTime = Date.now();
  
  try {
    const openai = getOpenAIClient();

    // Build comprehensive prompt with all context
    const systemPrompt = `You are a holistic health intelligence system analyzing comprehensive health data to generate personalized recommendations.

Your role is to:
1. Analyze ALL available data sources (bloodwork, body composition, device data, goals, adherence)
2. Identify patterns, trends, and areas for improvement
3. Generate specific, actionable recommendations
4. Prioritize recommendations by impact and urgency
5. Explain the rationale and intended outcome for each recommendation

Guidelines:
- Be specific and actionable (not generic advice)
- Consider interactions between different health domains
- Prioritize based on health impact and user goals
- Use friendly, encouraging tone
- Recommend professional consultation for concerning trends

Return JSON array of recommendations with this structure:
{
  "recommendations": [
    {
      "source": "bloodwork|body_composition|device_data|goals|adherence|ai_analysis",
      "category": "cardiovascular|metabolic|hormonal|inflammation|body_composition|recovery|performance|lifestyle|nutrition|supplement|workout|sleep|stress_management",
      "priority": "critical|high|medium|low",
      "timeframe": "immediate|today|this_week|this_month|long_term",
      "title": "Clear, specific title (5-8 words)",
      "description": "Detailed explanation of what to do (2-3 sentences)",
      "rationale": "Why this recommendation matters based on data (2-3 sentences)",
      "intended_outcome": "Expected result if implemented (1-2 sentences)",
      "action_items": ["Specific action 1", "Specific action 2", "Specific action 3"],
      "confidence": 0.85
    }
  ]
}`;

    // Build user context
    let contextText = `User Health Data:\n\n`;
    
    if (context.latest_bloodwork) {
      contextText += `Bloodwork (${context.latest_bloodwork.test_date}):\n`;
      context.latest_bloodwork.markers.slice(0, 10).forEach(m => {
        contextText += `- ${m.name}: ${m.value} ${m.unit} ${m.abnormal ? '(ABNORMAL)' : ''}\n`;
      });
      contextText += '\n';
    }

    if (context.latest_body_composition) {
      contextText += `Body Composition (${context.latest_body_composition.scan_date}):\n`;
      contextText += `- Weight: ${context.latest_body_composition.weight} lb\n`;
      contextText += `- Body Fat: ${context.latest_body_composition.body_fat_percentage}%\n`;
      contextText += `- Muscle Mass: ${context.latest_body_composition.muscle_mass} lb\n\n`;
    }

    if (context.device_data) {
      contextText += `Device Data (7-day average):\n`;
      contextText += `- Sleep: ${context.device_data.avg_sleep_hours.toFixed(1)} hours/night\n`;
      contextText += `- HRV: ${context.device_data.avg_hrv.toFixed(0)} ms\n`;
      contextText += `- Activity: ${context.device_data.avg_activity_minutes.toFixed(0)} min/day\n`;
      contextText += `- Steps: ${context.device_data.avg_steps.toFixed(0)}/day\n\n`;
    }

    if (context.active_goals && context.active_goals.length > 0) {
      contextText += `Active Goals:\n`;
      context.active_goals.forEach(g => {
        contextText += `- ${g.name} (${g.category})\n`;
      });
      contextText += '\n';
    }

    if (context.baseline) {
      contextText += `User Profile:\n`;
      contextText += `- Age: ${context.baseline.age}\n`;
      contextText += `- Gender: ${context.baseline.gender}\n`;
      if (context.baseline.health_goals.length > 0) {
        contextText += `- Health Goals: ${context.baseline.health_goals.join(', ')}\n`;
      }
      contextText += '\n';
    }

    if (context.supplements && context.supplements.length > 0) {
      contextText += `Current Supplement Stack:\n`;
      context.supplements.filter(s => s.status === 'active').forEach(s => {
        contextText += `- ${s.name}: ${s.dosage} ${s.dosage_unit} ${s.frequency}`;
        if (s.goal) contextText += ` (${s.goal})`;
        contextText += '\n';
      });
      contextText += '\n';
    }

    if (context.workout_program) {
      contextText += `Workout Program:\n`;
      contextText += `- Program: ${context.workout_program.program_name}\n`;
      contextText += `- Split: ${context.workout_program.split_type}\n`;
      contextText += `- Frequency: ${context.workout_program.days_per_week} days/week\n\n`;
    }

    if (context.daily_logs && context.daily_logs.total_logs > 0) {
      contextText += `Daily Log Patterns (30-day average, ${context.daily_logs.total_logs} logs):\n`;
      contextText += `- Sleep: ${context.daily_logs.avg_sleep_hours.toFixed(1)} hours\n`;
      contextText += `- Energy Level: ${context.daily_logs.avg_energy_level.toFixed(1)}/10\n`;
      contextText += `- Mood: ${context.daily_logs.avg_mood.toFixed(1)}/10\n`;
      contextText += `- Stress: ${context.daily_logs.avg_stress_level.toFixed(1)}/10\n`;
      contextText += `- Workout Adherence: ${context.daily_logs.workout_adherence_avg.toFixed(0)}%\n`;
      contextText += `- Nutrition Adherence: ${context.daily_logs.nutrition_adherence_avg.toFixed(0)}%\n\n`;
    }

    if (context.historical_recommendations && context.historical_recommendations.total_generated > 0) {
      contextText += `Historical Recommendation Patterns:\n`;
      contextText += `- Total Generated: ${context.historical_recommendations.total_generated}\n`;
      contextText += `- Acceptance Rate: ${context.historical_recommendations.acceptance_rate.toFixed(0)}%\n`;
      if (context.historical_recommendations.most_accepted_categories.length > 0) {
        contextText += `- Most Accepted: ${context.historical_recommendations.most_accepted_categories.join(', ')}\n`;
      }
      if (context.historical_recommendations.most_dismissed_categories.length > 0) {
        contextText += `- Most Dismissed: ${context.historical_recommendations.most_dismissed_categories.join(', ')}\n`;
      }
      contextText += '\n';
    }

    const userPrompt = `${contextText}\n\nAnalyze this comprehensive health data and generate 3-7 prioritized, actionable recommendations. Focus on the most impactful areas for improvement based on the data.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    const parsed = JSON.parse(content);
    const cost = response.usage ? calculateCost(response.usage) : 0;
    const processingTime = Date.now() - startTime;

    logger.info('AI recommendations generated', {
      userId: context.user_id,
      count: parsed.recommendations?.length || 0,
      cost: cost.toFixed(4),
      processingTimeMs: processingTime
    });

    // Convert to CreateUnifiedRecommendationRequest format
    const recommendations: CreateUnifiedRecommendationRequest[] = (parsed.recommendations || []).map((rec: any) => ({
      user_id: context.user_id,
      source: rec.source as RecommendationSource,
      category: rec.category,
      priority: rec.priority as RecommendationPriority,
      timeframe: rec.timeframe as RecommendationTimeframe,
      title: rec.title,
      description: rec.description,
      rationale: rec.rationale,
      intended_outcome: rec.intended_outcome,
      action_items: rec.action_items || [],
      confidence: rec.confidence || 0.8,
      source_data: {
        source_type: 'ai_analysis' as RecommendationSource,
        source_ids: [],
        data_points: 1
      },
      ai_generated: true,
      ai_cost: cost / (parsed.recommendations?.length || 1)
    }));

    return { recommendations, cost };

  } catch (error) {
    logger.error('AI recommendation generation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: context.user_id
    });
    return { recommendations: [], cost: 0 };
  }
}

/**
 * Create a unified recommendation
 */
export async function createUnifiedRecommendation(
  request: CreateUnifiedRecommendationRequest
): Promise<{ success: boolean; data?: UnifiedRecommendation; error?: string }> {
  try {
    const recommendation: Partial<UnifiedRecommendation> = {
      ...request,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('unified_recommendations')
      .insert(recommendation)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create recommendation: ${error.message}`
      };
    }

    return {
      success: true,
      data: data as UnifiedRecommendation
    };
  } catch (error) {
    return {
      success: false,
      error: `Error creating recommendation: ${(error as Error).message}`
    };
  }
}

/**
 * Get recommendations for user
 */
export async function getUnifiedRecommendations(
  request: GetRecommendationsRequest
): Promise<GetRecommendationsResponse> {
  try {
    const {
      user_id,
      status,
      source,
      category,
      priority,
      timeframe,
      limit = 50,
      offset = 0
    } = request;

    let query = supabase
      .from('unified_recommendations')
      .select('*')
      .eq('user_id', user_id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query = query.in('status', statuses);
    }

    if (source) {
      const sources = Array.isArray(source) ? source : [source];
      query = query.in('source', sources);
    }

    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      query = query.in('category', categories);
    }

    if (priority) {
      const priorities = Array.isArray(priority) ? priority : [priority];
      query = query.in('priority', priorities);
    }

    if (timeframe) {
      const timeframes = Array.isArray(timeframe) ? timeframe : [timeframe];
      query = query.in('timeframe', timeframes);
    }

    const { data: recommendations, error } = await query;

    if (error) {
      return {
        success: false,
        error: `Failed to fetch recommendations: ${error.message}`
      };
    }

    // Calculate aggregations
    const byPriority = {
      critical: recommendations?.filter(r => r.priority === 'critical').length || 0,
      high: recommendations?.filter(r => r.priority === 'high').length || 0,
      medium: recommendations?.filter(r => r.priority === 'medium').length || 0,
      low: recommendations?.filter(r => r.priority === 'low').length || 0
    };

    const byTimeframe = {
      immediate: recommendations?.filter(r => r.timeframe === 'immediate').length || 0,
      today: recommendations?.filter(r => r.timeframe === 'today').length || 0,
      this_week: recommendations?.filter(r => r.timeframe === 'this_week').length || 0,
      this_month: recommendations?.filter(r => r.timeframe === 'this_month').length || 0,
      long_term: recommendations?.filter(r => r.timeframe === 'long_term').length || 0
    };

    const bySource: Record<string, number> = {};
    recommendations?.forEach(r => {
      bySource[r.source] = (bySource[r.source] || 0) + 1;
    });

    return {
      success: true,
      data: {
        recommendations: recommendations as UnifiedRecommendation[] || [],
        total: recommendations?.length || 0,
        by_priority: byPriority,
        by_timeframe: byTimeframe,
        by_source: bySource as Record<RecommendationSource, number>
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Error fetching recommendations: ${(error as Error).message}`
    };
  }
}

/**
 * Accept a recommendation
 */
export async function acceptRecommendation(
  request: AcceptRecommendationRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { recommendation_id, user_notes } = request;

    const { error } = await supabase
      .from('unified_recommendations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        user_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', recommendation_id);

    if (error) {
      return {
        success: false,
        error: `Failed to accept recommendation: ${error.message}`
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Error accepting recommendation: ${(error as Error).message}`
    };
  }
}

/**
 * Dismiss a recommendation
 */
export async function dismissRecommendation(
  request: DismissRecommendationRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { recommendation_id, reason, user_notes } = request;

    const { error } = await supabase
      .from('unified_recommendations')
      .update({
        status: 'dismissed',
        dismissed_at: new Date().toISOString(),
        dismissal_reason: reason,
        user_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', recommendation_id);

    if (error) {
      return {
        success: false,
        error: `Failed to dismiss recommendation: ${error.message}`
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Error dismissing recommendation: ${(error as Error).message}`
    };
  }
}

/**
 * Generate unified recommendations using hybrid approach (rules + AI)
 */
export async function generateUnifiedRecommendations(
  request: GenerateRecommendationsRequest
): Promise<GenerateRecommendationsResponse> {
  const startTime = Date.now();
  let totalCost = 0;
  
  try {
    const { user_id, force_regenerate = false, use_ai_enhancement = true } = request;

    // Build comprehensive context
    const context = await buildRecommendationContext(user_id);

    // Supersede existing active recommendations if force_regenerate
    let supersededCount = 0;
    if (force_regenerate) {
      const { error: updateError } = await supabase
        .from('unified_recommendations')
        .update({ 
          status: 'superseded',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .eq('status', 'active');

      if (!updateError) {
        const { count } = await supabase
          .from('unified_recommendations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('status', 'superseded');
        
        supersededCount = count || 0;
      }
    }

    // Generate AI recommendations
    const aiResult = use_ai_enhancement 
      ? await generateAIRecommendations(context)
      : { recommendations: [], cost: 0 };
    
    totalCost += aiResult.cost;

    // Create recommendations
    const createdRecommendations: UnifiedRecommendation[] = [];
    
    for (const recRequest of aiResult.recommendations) {
      const result = await createUnifiedRecommendation(recRequest);
      if (result.success && result.data) {
        createdRecommendations.push(result.data);
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info('Unified recommendations generated', {
      userId: user_id,
      generated: createdRecommendations.length,
      superseded: supersededCount,
      cost: totalCost.toFixed(4),
      processingTimeMs: processingTime
    });

    return {
      success: true,
      data: {
        generated_count: createdRecommendations.length,
        superseded_count: supersededCount,
        recommendations: createdRecommendations,
        cost: totalCost,
        processing_time_ms: processingTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Error generating recommendations: ${(error as Error).message}`
    };
  }
}
