import OpenAI from 'openai';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

let openai: OpenAI | null = null;

const getOpenAI = (): OpenAI | null => {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('⚠️ [AI AGENT] OpenAI API key not configured');
    return null;
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatSession {
  id: string;
  userId: string;
  sessionType: string;
  title?: string;
  contextSnapshot: any;
  sessionState: any;
  status: string;
  messageCount: number;
  createdAt: string;
}

interface ChatResponse {
  response: string;
  sessionId: string;
  suggestions?: string[];
  actions?: any[];
}

const SYSTEM_PROMPT = `You are a knowledgeable and empathetic health assistant helping users optimize their health and fitness.

Your capabilities:
- Analyze health metrics (bloodwork, recovery, workouts, nutrition, stress)
- Provide personalized recommendations based on user data
- Answer questions about health, fitness, nutrition, and recovery
- Help users set and track health goals
- Identify patterns and correlations in health data
- Suggest actionable interventions

Guidelines:
- Be conversational, supportive, and encouraging
- Use data-driven insights when available
- Acknowledge limitations and recommend medical consultation when appropriate
- Focus on actionable, practical advice
- Consider the user's full health context
- Be concise but thorough

IMPORTANT: Always include a medical disclaimer for health advice: "This is general health information. Consult a healthcare provider for medical advice."`;

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export async function createChatSession(
  userId: string,
  sessionType: string = 'general_chat',
  contextSnapshot: any = {}
): Promise<ChatSession> {
  try {
    const sessionId = randomUUID();
    const title = generateSessionTitle(sessionType);

    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        session_type: sessionType,
        title: title,
        context_snapshot: contextSnapshot,
        session_state: {},
        status: 'active',
        message_count: 0,
        total_tokens_used: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ [AI AGENT] Failed to create chat session', { error: error.message });
      throw new Error('Failed to create chat session');
    }

    logger.info('✅ [AI AGENT] Chat session created', { sessionId, userId });

    return {
      id: data.id,
      userId: data.user_id,
      sessionType: data.session_type,
      title: data.title,
      contextSnapshot: data.context_snapshot,
      sessionState: data.session_state,
      status: data.status,
      messageCount: data.message_count,
      createdAt: data.created_at,
    };
  } catch (error) {
    logger.error('❌ [AI AGENT] Error creating chat session', {
      error: (error as Error).message,
    });
    throw error;
  }
}

export async function getActiveSession(userId: string): Promise<ChatSession | null> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('last_activity_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('❌ [AI AGENT] Failed to get active session', { error: error.message });
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      sessionType: data.session_type,
      title: data.title,
      contextSnapshot: data.context_snapshot,
      sessionState: data.session_state,
      status: data.status,
      messageCount: data.message_count,
      createdAt: data.created_at,
    };
  } catch (error) {
    logger.error('❌ [AI AGENT] Error getting active session', {
      error: (error as Error).message,
    });
    return null;
  }
}

// ============================================================================
// CHAT FUNCTIONALITY
// ============================================================================

export async function chat(
  userId: string,
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  try {
    const client = getOpenAI();
    if (!client) {
      return {
        response: 'AI assistant is currently unavailable. Please try again later.',
        sessionId: sessionId || '',
        suggestions: [],
      };
    }

    // Get or create session
    let session: ChatSession | null = null;
    if (sessionId) {
      session = await getSessionById(sessionId);
    } else {
      session = await getActiveSession(userId);
      if (!session) {
        session = await createChatSession(userId, 'general_chat');
      }
    }

    if (!session) {
      throw new Error('Failed to get or create chat session');
    }

    // Save user message
    await saveMessage(session.id, 'user', message);

    // Get conversation history
    const history = await getChatHistory(session.id, 10);

    // Build messages for OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ];

    // Call OpenAI
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = response.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
    const tokensUsed = response.usage?.total_tokens || 0;

    // Save assistant message
    await saveMessage(session.id, 'assistant', assistantMessage, {
      model: 'gpt-4o-mini',
      tokensUsed: tokensUsed,
      finishReason: response.choices[0].finish_reason,
    });

    // Update session tokens
    await updateSessionTokens(session.id, tokensUsed);

    logger.info('✅ [AI AGENT] Chat response generated', {
      sessionId: session.id,
      tokensUsed,
    });

    return {
      response: assistantMessage,
      sessionId: session.id,
      suggestions: generateFollowUpSuggestions(message, assistantMessage),
    };
  } catch (error) {
    logger.error('❌ [AI AGENT] Error in chat', {
      error: (error as Error).message,
    });
    throw error;
  }
}

// ============================================================================
// MESSAGE MANAGEMENT
// ============================================================================

async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: any
): Promise<void> {
  try {
    // Get current message count
    const { data: session } = await supabase
      .from('ai_chat_sessions')
      .select('message_count')
      .eq('id', sessionId)
      .single();

    const messageOrder = session?.message_count || 0;

    const { error } = await supabase
      .from('ai_chat_messages')
      .insert({
        session_id: sessionId,
        role: role,
        content: content,
        message_order: messageOrder,
        model: metadata?.model,
        tokens_used: metadata?.tokensUsed,
        finish_reason: metadata?.finishReason,
      });

    if (error) {
      logger.error('❌ [AI AGENT] Failed to save message', { error: error.message });
    }
  } catch (error) {
    logger.error('❌ [AI AGENT] Error saving message', {
      error: (error as Error).message,
    });
  }
}

export async function getChatHistory(
  sessionId: string,
  limit: number = 20
): Promise<Array<{ role: string; content: string; createdAt: string }>> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('message_order', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error('❌ [AI AGENT] Failed to get chat history', { error: error.message });
      return [];
    }

    return data.map(m => ({
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    }));
  } catch (error) {
    logger.error('❌ [AI AGENT] Error getting chat history', {
      error: (error as Error).message,
    });
    return [];
  }
}

// ============================================================================
// HEALTH ANALYSIS
// ============================================================================

export async function analyzeHealth(userId: string): Promise<any> {
  try {
    const client = getOpenAI();
    if (!client) {
      return { analysis: 'AI analysis is currently unavailable.' };
    }

    // Gather user health data (simplified - would pull from various tables)
    const healthContext = await gatherHealthContext(userId);

    const prompt = `Analyze the following health data and provide insights:

${JSON.stringify(healthContext, null, 2)}

Provide:
1. Key observations
2. Potential concerns
3. Positive trends
4. Actionable recommendations

Format as JSON with keys: observations, concerns, positives, recommendations`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 800,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    logger.info('✅ [AI AGENT] Health analysis generated', { userId });

    return analysis;
  } catch (error) {
    logger.error('❌ [AI AGENT] Error analyzing health', {
      error: (error as Error).message,
    });
    return { analysis: 'Failed to analyze health data' };
  }
}

export async function askQuestion(
  userId: string,
  question: string
): Promise<string> {
  try {
    const client = getOpenAI();
    if (!client) {
      return 'AI assistant is currently unavailable. Please try again later.';
    }

    // Get health context for personalized answer
    const healthContext = await gatherHealthContext(userId);

    const prompt = `User question: ${question}

User health context:
${JSON.stringify(healthContext, null, 2)}

Provide a helpful, personalized answer based on their health data.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const answer = response.choices[0].message.content || 'I apologize, but I was unable to answer your question.';

    // Save query for analytics
    await saveHealthQuery(userId, question, answer);

    logger.info('✅ [AI AGENT] Question answered', { userId });

    return answer;
  } catch (error) {
    logger.error('❌ [AI AGENT] Error answering question', {
      error: (error as Error).message,
    });
    return 'I apologize, but I encountered an error. Please try again.';
  }
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export async function getRecommendations(
  userId: string,
  category?: string
): Promise<any[]> {
  try {
    const client = getOpenAI();
    if (!client) {
      return [];
    }

    const healthContext = await gatherHealthContext(userId);
    const categoryFilter = category ? ` for ${category}` : '';

    const prompt = `Based on this health data, generate 3-5 personalized recommendations${categoryFilter}:

${JSON.stringify(healthContext, null, 2)}

Format as JSON array with objects containing: title, description, priority, category, actionSteps`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 600,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"recommendations":[]}');

    logger.info('✅ [AI AGENT] Recommendations generated', { userId, category });

    return result.recommendations || [];
  } catch (error) {
    logger.error('❌ [AI AGENT] Error generating recommendations', {
      error: (error as Error).message,
    });
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getSessionById(sessionId: string): Promise<ChatSession | null> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      sessionType: data.session_type,
      title: data.title,
      contextSnapshot: data.context_snapshot,
      sessionState: data.session_state,
      status: data.status,
      messageCount: data.message_count,
      createdAt: data.created_at,
    };
  } catch (error) {
    return null;
  }
}

async function updateSessionTokens(sessionId: string, tokens: number): Promise<void> {
  try {
    await supabase
      .from('ai_chat_sessions')
      .update({
        total_tokens_used: supabase.rpc('increment_tokens', { session_id: sessionId, tokens: tokens }),
      })
      .eq('id', sessionId);
  } catch (error) {
    logger.error('❌ [AI AGENT] Error updating session tokens', {
      error: (error as Error).message,
    });
  }
}

function generateSessionTitle(sessionType: string): string {
  const titles: Record<string, string> = {
    general_chat: 'Health Chat',
    health_analysis: 'Health Analysis',
    workout_planning: 'Workout Planning',
    nutrition_advice: 'Nutrition Advice',
    goal_setting: 'Goal Setting',
    symptom_check: 'Symptom Check',
  };
  return titles[sessionType] || 'Chat Session';
}

function generateFollowUpSuggestions(userMessage: string, assistantResponse: string): string[] {
  // Simple keyword-based suggestions (could be enhanced with AI)
  const suggestions: string[] = [];

  if (userMessage.toLowerCase().includes('workout')) {
    suggestions.push('What exercises should I focus on?');
    suggestions.push('How can I improve my recovery?');
  }

  if (userMessage.toLowerCase().includes('nutrition') || userMessage.toLowerCase().includes('diet')) {
    suggestions.push('What should I eat before workouts?');
    suggestions.push('How can I improve my protein intake?');
  }

  if (userMessage.toLowerCase().includes('sleep') || userMessage.toLowerCase().includes('recovery')) {
    suggestions.push('How can I improve my sleep quality?');
    suggestions.push('What supplements help with recovery?');
  }

  if (suggestions.length === 0) {
    suggestions.push('Tell me more about my health trends');
    suggestions.push('What should I focus on this week?');
    suggestions.push('How am I progressing toward my goals?');
  }

  return suggestions.slice(0, 3);
}

async function gatherHealthContext(userId: string): Promise<any> {
  // Simplified - would pull from actual tables
  return {
    userId: userId,
    note: 'Health context would be gathered from user profile, recent logs, bloodwork, etc.',
  };
}

async function saveHealthQuery(
  userId: string,
  question: string,
  answer: string
): Promise<void> {
  try {
    await supabase
      .from('ai_health_queries')
      .insert({
        user_id: userId,
        query_text: question,
        query_type: 'general',
        response_text: answer,
        response_confidence: 0.8,
        requires_medical_disclaimer: true,
        disclaimer_shown: true,
      });
  } catch (error) {
    logger.error('❌ [AI AGENT] Error saving health query', {
      error: (error as Error).message,
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const aiAgentEngine = {
  chat,
  getChatHistory,
  getRecommendations,
  analyzeHealth,
  askQuestion,
  createChatSession,
  getActiveSession,
};
