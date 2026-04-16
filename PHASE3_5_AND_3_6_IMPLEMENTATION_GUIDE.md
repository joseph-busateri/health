# Phase 3.5 & 3.6 Implementation Guide

**Status**: Design Complete - Ready for Implementation  
**Estimated Effort**: 8-12 hours total

---

## Overview

Phase 3.5 and 3.6 add database persistence for interview sessions and AI conversation history. These features require:
- Database migrations (Supabase)
- Backend services
- API endpoints
- UI integration

Since these are backend-heavy tasks requiring careful database design and testing, this document provides the complete implementation roadmap.

---

## PHASE 3.5: Interview Database Persistence

### **Objective**
Save interview session data (voice, agent, dynamic, hybrid) to database for history tracking and analytics.

### **Database Schema**

**New Table: `interview_sessions`**

```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('voice', 'agent', 'dynamic', 'hybrid')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  
  -- Interview content
  questions_asked JSONB DEFAULT '[]',
  responses_given JSONB DEFAULT '[]',
  
  -- Metadata
  device_info JSONB,
  app_version TEXT,
  
  -- Analytics
  completion_rate DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_started_at ON interview_sessions(started_at DESC);
CREATE INDEX idx_interview_sessions_type ON interview_sessions(interview_type);
```

### **Backend Service**

**File**: `server/src/services/interviewSessionService.ts`

```typescript
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface InterviewSession {
  id: string;
  userId: string;
  interviewType: 'voice' | 'agent' | 'dynamic' | 'hybrid';
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  questionsAsked: any[];
  responsesGiven: any[];
  deviceInfo?: any;
  appVersion?: string;
  completionRate?: number;
  qualityScore?: number;
}

export const createInterviewSession = async (
  userId: string,
  interviewType: InterviewSession['interviewType']
): Promise<InterviewSession> => {
  const { data, error } = await supabase
    .from('interview_sessions')
    .insert({
      user_id: userId,
      interview_type: interviewType,
      status: 'in_progress',
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create interview session', { error });
    throw error;
  }

  return mapInterviewSession(data);
};

export const updateInterviewSession = async (
  sessionId: string,
  updates: Partial<InterviewSession>
): Promise<InterviewSession> => {
  const { data, error } = await supabase
    .from('interview_sessions')
    .update({
      completed_at: updates.completedAt,
      duration_seconds: updates.durationSeconds,
      status: updates.status,
      questions_asked: updates.questionsAsked,
      responses_given: updates.responsesGiven,
      completion_rate: updates.completionRate,
      quality_score: updates.qualityScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update interview session', { error });
    throw error;
  }

  return mapInterviewSession(data);
};

export const getInterviewSessions = async (
  userId: string,
  limit: number = 20
): Promise<InterviewSession[]> => {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch interview sessions', { error });
    throw error;
  }

  return (data || []).map(mapInterviewSession);
};

const mapInterviewSession = (row: any): InterviewSession => ({
  id: row.id,
  userId: row.user_id,
  interviewType: row.interview_type,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  durationSeconds: row.duration_seconds,
  status: row.status,
  questionsAsked: row.questions_asked || [],
  responsesGiven: row.responses_given || [],
  deviceInfo: row.device_info,
  appVersion: row.app_version,
  completionRate: row.completion_rate,
  qualityScore: row.quality_score,
});
```

### **API Routes**

**File**: `server/src/routes/interviewSessionRoutes.ts`

```typescript
import { Router } from 'express';
import {
  createInterviewSession,
  updateInterviewSession,
  getInterviewSessions,
} from '../services/interviewSessionService';

const router = Router();

router.post('/interview-sessions', async (req, res, next) => {
  try {
    const { userId, interviewType } = req.body;
    const session = await createInterviewSession(userId, interviewType);
    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

router.patch('/interview-sessions/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await updateInterviewSession(sessionId, req.body);
    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

router.get('/interview-sessions/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const sessions = await getInterviewSessions(userId);
    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### **UI Integration**

**Modify Interview Screens** to call persistence APIs:

1. **VoiceInterviewScreen.tsx** - Start session on mount, update on completion
2. **AgentInterviewScreen.tsx** - Same pattern
3. **DynamicInterviewScreen.tsx** - Same pattern
4. **HybridInterviewScreen.tsx** - Same pattern

**Example Integration**:

```typescript
// In interview screen
const [sessionId, setSessionId] = useState<string | null>(null);

useEffect(() => {
  // Start session
  const startSession = async () => {
    const response = await fetch('http://localhost:3000/api/interview-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, interviewType: 'voice' }),
    });
    const result = await response.json();
    setSessionId(result.session.id);
  };
  startSession();
}, []);

const handleComplete = async () => {
  if (!sessionId) return;
  
  await fetch(`http://localhost:3000/api/interview-sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      completedAt: new Date().toISOString(),
      status: 'completed',
      questionsAsked: questions,
      responsesGiven: responses,
    }),
  });
};
```

---

## PHASE 3.6: AI Conversation History

### **Objective**
Save AI chat conversations for history, context, and continuity across sessions.

### **Database Schema**

**New Table: `ai_conversations`**

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  conversation_type TEXT NOT NULL DEFAULT 'general' CHECK (conversation_type IN ('general', 'health', 'workout', 'nutrition')),
  title TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata
  model TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_last_message ON ai_conversations(last_message_at DESC);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at);
```

### **Backend Service**

**File**: `server/src/services/aiConversationService.ts`

```typescript
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface AIConversation {
  id: string;
  userId: string;
  conversationType: 'general' | 'health' | 'workout' | 'nutrition';
  title?: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  status: 'active' | 'archived';
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokensUsed?: number;
  responseTimeMs?: number;
  createdAt: string;
}

export const createConversation = async (
  userId: string,
  conversationType: AIConversation['conversationType']
): Promise<AIConversation> => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      conversation_type: conversationType,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create AI conversation', { error });
    throw error;
  }

  return mapConversation(data);
};

export const addMessage = async (
  conversationId: string,
  message: Omit<AIMessage, 'id' | 'conversationId' | 'createdAt'>
): Promise<AIMessage> => {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      model: message.model,
      tokens_used: message.tokensUsed,
      response_time_ms: message.responseTimeMs,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to add AI message', { error });
    throw error;
  }

  // Update conversation last_message_at and message_count
  await supabase
    .from('ai_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      message_count: supabase.raw('message_count + 1'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  return mapMessage(data);
};

export const getConversations = async (
  userId: string,
  limit: number = 20
): Promise<AIConversation[]> => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch AI conversations', { error });
    throw error;
  }

  return (data || []).map(mapConversation);
};

export const getMessages = async (
  conversationId: string,
  limit: number = 100
): Promise<AIMessage[]> => {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch AI messages', { error });
    throw error;
  }

  return (data || []).map(mapMessage);
};

const mapConversation = (row: any): AIConversation => ({
  id: row.id,
  userId: row.user_id,
  conversationType: row.conversation_type,
  title: row.title,
  startedAt: row.started_at,
  lastMessageAt: row.last_message_at,
  messageCount: row.message_count,
  status: row.status,
});

const mapMessage = (row: any): AIMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  role: row.role,
  content: row.content,
  model: row.model,
  tokensUsed: row.tokens_used,
  responseTimeMs: row.response_time_ms,
  createdAt: row.created_at,
});
```

### **API Routes**

**File**: `server/src/routes/aiConversationRoutes.ts`

```typescript
import { Router } from 'express';
import {
  createConversation,
  addMessage,
  getConversations,
  getMessages,
} from '../services/aiConversationService';

const router = Router();

router.post('/ai-conversations', async (req, res, next) => {
  try {
    const { userId, conversationType } = req.body;
    const conversation = await createConversation(userId, conversationType);
    res.status(201).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
});

router.post('/ai-conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const message = await addMessage(conversationId, req.body);
    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.get('/ai-conversations/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const conversations = await getConversations(userId);
    res.json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
});

router.get('/ai-conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const messages = await getMessages(conversationId);
    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### **UI Integration**

**Create New Screen**: `AIConversationHistoryScreen.tsx`

Shows list of past conversations with ability to view and continue them.

**Modify AI Chat Components** to save messages:

```typescript
// In AI chat component
const sendMessage = async (userMessage: string) => {
  // Save user message
  await fetch(`http://localhost:3000/api/ai-conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'user',
      content: userMessage,
    }),
  });

  // Get AI response
  const aiResponse = await callAIAPI(userMessage);

  // Save AI response
  await fetch(`http://localhost:3000/api/ai-conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'assistant',
      content: aiResponse,
      model: 'gpt-4',
      tokensUsed: aiResponse.tokens,
    }),
  });
};
```

---

## Implementation Steps

### **Phase 3.5: Interview Persistence**

1. **Database** (30 min)
   - Run migration to create `interview_sessions` table
   - Test table creation in Supabase

2. **Backend** (2 hours)
   - Create `interviewSessionService.ts`
   - Create `interviewSessionRoutes.ts`
   - Register routes in `server.ts`
   - Test endpoints with Postman

3. **UI Integration** (2 hours)
   - Modify 4 interview screens to call persistence APIs
   - Add session start/end tracking
   - Test end-to-end flow

### **Phase 3.6: AI Conversation History**

1. **Database** (30 min)
   - Run migrations to create `ai_conversations` and `ai_messages` tables
   - Test table creation in Supabase

2. **Backend** (2 hours)
   - Create `aiConversationService.ts`
   - Create `aiConversationRoutes.ts`
   - Register routes in `server.ts`
   - Test endpoints with Postman

3. **UI** (3 hours)
   - Create `AIConversationHistoryScreen.tsx`
   - Modify AI chat components to save messages
   - Add conversation list UI
   - Test end-to-end flow

---

## Testing Checklist

### **Phase 3.5**
- [ ] Database migration runs successfully
- [ ] Can create interview session via API
- [ ] Can update interview session via API
- [ ] Can fetch interview sessions via API
- [ ] Interview screens start sessions on mount
- [ ] Interview screens update sessions on completion
- [ ] Session data persists correctly

### **Phase 3.6**
- [ ] Database migrations run successfully
- [ ] Can create conversation via API
- [ ] Can add messages via API
- [ ] Can fetch conversations via API
- [ ] Can fetch messages via API
- [ ] AI chat saves user messages
- [ ] AI chat saves assistant responses
- [ ] Conversation history screen displays correctly
- [ ] Can resume past conversations

---

## Production Considerations

### **Performance**
- Index on `user_id` for fast user queries
- Index on timestamps for chronological sorting
- Limit message history to prevent large payloads

### **Privacy**
- Ensure user data isolation (user_id foreign key)
- Add data retention policies
- Consider encryption for sensitive content

### **Scalability**
- Partition tables by date if volume grows
- Archive old conversations
- Implement pagination for large histories

---

## Estimated Total Effort

| Task | Time |
|------|------|
| Phase 3.5 Database | 30 min |
| Phase 3.5 Backend | 2 hours |
| Phase 3.5 UI | 2 hours |
| Phase 3.6 Database | 30 min |
| Phase 3.6 Backend | 2 hours |
| Phase 3.6 UI | 3 hours |
| Testing & Debugging | 2 hours |
| **TOTAL** | **12 hours** |

---

## Next Steps

1. **Review this implementation guide**
2. **Run database migrations** in Supabase
3. **Implement backend services** following the code templates
4. **Test APIs** with Postman
5. **Integrate UI** following the patterns
6. **Test end-to-end** with real data

---

**Status**: Implementation guide complete. Ready for development when needed.
