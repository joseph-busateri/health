# PHASE 5: VOICE INTERVIEW ADAPTATION - ARCHITECTURE DESIGN

**Date**: April 15, 2026  
**Status**: 🏗️ **IN DESIGN**  
**Backend Phase**: Phase 25  
**UI Phase**: Phase 25 UI

---

## 🎯 OBJECTIVE

**Goal**: Make the voice interview intelligent and adaptive by learning from user patterns, detecting data gaps, and personalizing question selection to reduce redundancy and improve data quality.

**Building On**:
- Phase 22: Interview signals extraction and storage
- Phase 23: Multi-source aggregation
- Phase 24: Correlation detection and trend analysis

**Phase 5 Adds**:
- User interview profile tracking
- Pattern detection from historical signals
- Data gap identification
- Adaptive question generation
- Reduced redundancy through smart question selection
- Personalized follow-up questions

---

## 📐 ARCHITECTURE OVERVIEW

### **Phase 25 Backend Components**

1. **User Interview Profile Service**
   - Track user response patterns
   - Identify frequently mentioned topics
   - Detect data gaps across sources
   - Calculate question effectiveness scores

2. **Pattern Detection Service**
   - Analyze historical interview signals
   - Identify recurring themes
   - Detect seasonal patterns
   - Find trigger-symptom relationships

3. **Data Gap Analysis Service**
   - Compare interview signals with other data sources
   - Identify missing data categories
   - Prioritize data collection needs
   - Track data completeness over time

4. **Adaptive Question Generation Service**
   - Select questions based on data gaps
   - Generate follow-up questions for anomalies
   - Avoid redundant questions
   - Personalize question difficulty/depth

5. **Enhanced Voice Interview Service**
   - Integrate adaptive logic into existing interview flow
   - Use profile data to customize questions
   - Track question effectiveness
   - Adjust interview length based on user engagement

### **Phase 25 UI Components**

1. **Interview Insights Screen**
   - Show user's interview patterns
   - Display data completeness
   - Visualize topic coverage
   - Show interview effectiveness metrics

2. **Adaptive Interview Feedback**
   - Real-time feedback during interview
   - Show why questions are being asked
   - Display data gap progress
   - Engagement indicators

---

## 🗄️ DATABASE SCHEMA

### **New Table: `user_interview_profiles`**

```sql
CREATE TABLE user_interview_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    
    -- Interview statistics
    total_interviews INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    avg_response_length DECIMAL(10,2),
    avg_interview_duration INTEGER, -- seconds
    
    -- Response patterns
    frequent_topics JSONB DEFAULT '[]', -- Array of {topic, count, lastMentioned}
    avoided_topics JSONB DEFAULT '[]', -- Topics user tends to skip
    preferred_question_types JSONB DEFAULT '{}', -- {open_ended: 0.7, yes_no: 0.3}
    
    -- Data quality
    data_completeness JSONB DEFAULT '{}', -- {sleep: 0.9, nutrition: 0.6, ...}
    missing_data_categories JSONB DEFAULT '[]',
    last_data_gap_analysis TIMESTAMPTZ,
    
    -- Engagement metrics
    engagement_score DECIMAL(3,2) DEFAULT 0.5,
    skip_rate DECIMAL(3,2) DEFAULT 0,
    avg_confidence DECIMAL(3,2),
    
    -- Personalization
    question_preferences JSONB DEFAULT '{}',
    optimal_interview_length INTEGER DEFAULT 10, -- questions
    best_interview_time TEXT, -- 'morning', 'afternoon', 'evening'
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_interview_at TIMESTAMPTZ
);
```

### **New Table: `interview_question_effectiveness`**

```sql
CREATE TABLE interview_question_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    category TEXT NOT NULL,
    
    -- Effectiveness metrics
    times_asked INTEGER DEFAULT 1,
    times_answered INTEGER DEFAULT 0,
    times_skipped INTEGER DEFAULT 0,
    avg_response_quality DECIMAL(3,2), -- 0-1 based on signal extraction
    avg_confidence DECIMAL(3,2),
    
    -- Outcomes
    signals_extracted INTEGER DEFAULT 0,
    data_gaps_filled INTEGER DEFAULT 0,
    correlations_discovered INTEGER DEFAULT 0,
    
    -- Timing
    first_asked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_asked TIMESTAMPTZ,
    last_answered TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT question_effectiveness_unique 
        UNIQUE (user_id, question_id)
);
```

### **New Table: `adaptive_interview_sessions`**

```sql
CREATE TABLE adaptive_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES voice_interview_transcripts(session_id) ON DELETE CASCADE,
    
    -- Adaptation strategy
    strategy TEXT NOT NULL CHECK (strategy IN (
        'data_gap_focused',
        'pattern_exploration',
        'anomaly_investigation',
        'routine_check',
        'follow_up'
    )),
    
    -- Questions selected
    questions_planned JSONB NOT NULL, -- Array of question objects
    questions_asked INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    questions_skipped INTEGER DEFAULT 0,
    
    -- Data gaps targeted
    data_gaps_targeted JSONB DEFAULT '[]',
    data_gaps_filled JSONB DEFAULT '[]',
    
    -- Outcomes
    signals_extracted INTEGER DEFAULT 0,
    new_patterns_discovered INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2),
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER
);
```

---

## 🔧 BACKEND SERVICES (Phase 25)

### **1. User Interview Profile Service**
**File**: `server/src/services/userInterviewProfileService.ts`

**Functions**:
- `getOrCreateProfile(userId)` - Get or initialize user profile
- `updateProfileAfterInterview(userId, sessionData)` - Update stats and patterns
- `calculateDataCompleteness(userId)` - Analyze data gaps across all sources
- `identifyFrequentTopics(userId)` - Find recurring themes
- `calculateEngagementScore(userId)` - Measure user engagement
- `getOptimalInterviewLength(userId)` - Determine ideal question count
- `updateQuestionPreferences(userId, questionType, outcome)` - Learn preferences

### **2. Pattern Detection Service**
**File**: `server/src/services/interviewPatternDetectionService.ts`

**Functions**:
- `detectRecurringPatterns(userId, days)` - Find repeated themes
- `identifySeasonalPatterns(userId)` - Detect time-based patterns
- `findTriggerSymptomRelationships(userId)` - Connect causes and effects
- `detectAnomalies(userId)` - Find unusual responses
- `calculatePatternConfidence(pattern)` - Assess pattern reliability
- `getPatternsForFollowUp(userId)` - Identify patterns needing investigation

### **3. Data Gap Analysis Service**
**File**: `server/src/services/dataGapAnalysisService.ts`

**Functions**:
- `analyzeDataGaps(userId)` - Compare interview vs other sources
- `prioritizeDataGaps(gaps)` - Rank gaps by importance
- `identifyMissingCategories(userId)` - Find uncovered topics
- `calculateCategoryCompleteness(userId, category)` - Score data coverage
- `getDataGapTrends(userId, days)` - Track gap closure over time
- `suggestQuestionsForGaps(gaps)` - Map gaps to questions

### **4. Adaptive Question Generation Service**
**File**: `server/src/services/adaptiveQuestionService.ts`

**Functions**:
- `generateAdaptiveQuestions(userId, strategy)` - Create personalized question set
- `selectQuestionsForDataGaps(userId, gaps)` - Target missing data
- `generateFollowUpQuestions(userId, anomalies)` - Investigate unusual patterns
- `avoidRedundantQuestions(userId, candidateQuestions)` - Filter duplicates
- `personalizeQuestionDepth(userId, question)` - Adjust complexity
- `scoreQuestionRelevance(userId, question)` - Rank question importance

### **5. Question Effectiveness Tracking Service**
**File**: `server/src/services/questionEffectivenessService.ts`

**Functions**:
- `trackQuestionAsked(userId, questionId, questionText)` - Log question
- `trackQuestionAnswered(userId, questionId, quality)` - Log response
- `trackQuestionSkipped(userId, questionId)` - Log skip
- `calculateQuestionEffectiveness(questionId)` - Score question performance
- `getTopPerformingQuestions(category)` - Find best questions
- `getUnderperformingQuestions(category)` - Find weak questions

---

## 🌐 API ENDPOINTS (Phase 25)

### **User Interview Profiles**
```
GET /api/interview/profile/:userId
PUT /api/interview/profile/:userId
GET /api/interview/profile/:userId/data-completeness
GET /api/interview/profile/:userId/patterns
```

### **Adaptive Question Generation**
```
POST /api/interview/adaptive-questions/:userId
GET /api/interview/data-gaps/:userId
GET /api/interview/question-suggestions/:userId
```

### **Question Effectiveness**
```
GET /api/interview/question-effectiveness/:userId
GET /api/interview/question-effectiveness/category/:category
POST /api/interview/question-effectiveness/track
```

### **Interview Insights**
```
GET /api/interview/insights/:userId
GET /api/interview/insights/:userId/engagement
GET /api/interview/insights/:userId/topics
```

---

## 📱 MOBILE UI (Phase 25 UI)

### **1. Interview Insights Screen**
**File**: `mobile/src/screens/InterviewInsightsScreen.tsx`

**Layout**:
```
┌─────────────────────────────────────┐
│  Interview Insights                 │
├─────────────────────────────────────┤
│  📊 Your Interview Stats            │
│  • Total Interviews: 45             │
│  • Questions Answered: 387          │
│  • Engagement Score: 85%            │
├─────────────────────────────────────┤
│  📈 Data Completeness               │
│  Sleep:       ████████░░ 80%        │
│  Nutrition:   ██████░░░░ 60%        │
│  Stress:      █████████░ 90%        │
│  Workouts:    ███████░░░ 70%        │
├─────────────────────────────────────┤
│  🔄 Frequent Topics                 │
│  • Sleep quality (mentioned 23x)    │
│  • Workout recovery (mentioned 18x) │
│  • Stress triggers (mentioned 15x)  │
├─────────────────────────────────────┤
│  🎯 Data Gaps to Fill               │
│  • Sexual health (not covered)      │
│  • Supplement side effects (low)    │
│  • Joint pain details (incomplete)  │
│                                     │
│  [Start Focused Interview]          │
└─────────────────────────────────────┘
```

### **2. Adaptive Interview Feedback Component**
**File**: `mobile/src/components/AdaptiveInterviewFeedback.tsx`

**Features**:
- Real-time progress indicator
- "Why this question?" tooltip
- Data gap closure visualization
- Engagement encouragement

**Layout During Interview**:
```
┌─────────────────────────────────────┐
│  Question 3 of 8                    │
│  ████████░░░░░░░░░░░░ 37%          │
├─────────────────────────────────────┤
│  💡 Why we're asking:               │
│  We haven't captured your sleep     │
│  quality data in 3 days             │
├─────────────────────────────────────┤
│  [Question appears here]            │
│                                     │
│  [Answer input]                     │
├─────────────────────────────────────┤
│  ✅ Data gaps filled: 2/5           │
│  🎯 Engagement: Great!              │
└─────────────────────────────────────┘
```

---

## 🔄 ADAPTIVE INTERVIEW FLOW

### **Strategy Selection**

```typescript
function selectInterviewStrategy(userId: string): InterviewStrategy {
  const profile = await getInterviewProfile(userId);
  const dataGaps = await analyzeDataGaps(userId);
  const patterns = await detectRecurringPatterns(userId, 30);
  const correlations = await getRecentCorrelations(userId);
  
  // Priority 1: Critical data gaps
  if (dataGaps.critical.length > 0) {
    return 'data_gap_focused';
  }
  
  // Priority 2: Investigate anomalies
  if (patterns.anomalies.length > 0) {
    return 'anomaly_investigation';
  }
  
  // Priority 3: Explore patterns
  if (patterns.needingFollowUp.length > 0) {
    return 'pattern_exploration';
  }
  
  // Priority 4: Follow up on correlations
  if (correlations.critical.length > 0) {
    return 'follow_up';
  }
  
  // Default: Routine check
  return 'routine_check';
}
```

### **Question Selection Logic**

```typescript
function generateAdaptiveQuestions(
  userId: string,
  strategy: InterviewStrategy
): Question[] {
  const profile = await getInterviewProfile(userId);
  const dataGaps = await analyzeDataGaps(userId);
  const effectiveness = await getQuestionEffectiveness(userId);
  
  let candidateQuestions: Question[] = [];
  
  switch (strategy) {
    case 'data_gap_focused':
      candidateQuestions = await selectQuestionsForDataGaps(dataGaps);
      break;
    case 'anomaly_investigation':
      candidateQuestions = await generateFollowUpQuestions(anomalies);
      break;
    case 'pattern_exploration':
      candidateQuestions = await selectPatternQuestions(patterns);
      break;
    case 'routine_check':
      candidateQuestions = await selectRoutineQuestions(profile);
      break;
  }
  
  // Filter redundant questions
  candidateQuestions = await avoidRedundantQuestions(userId, candidateQuestions);
  
  // Personalize depth
  candidateQuestions = candidateQuestions.map(q => 
    personalizeQuestionDepth(userId, q)
  );
  
  // Score and rank
  candidateQuestions = candidateQuestions
    .map(q => ({ ...q, score: scoreQuestionRelevance(userId, q) }))
    .sort((a, b) => b.score - a.score);
  
  // Select optimal number
  const optimalLength = profile.optimal_interview_length;
  return candidateQuestions.slice(0, optimalLength);
}
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### **Caching Strategy**
- User profiles: 1 hour TTL
- Data gap analysis: 6 hours TTL
- Pattern detection: 12 hours TTL
- Question effectiveness: 24 hours TTL

### **Database Optimizations**
- Indexed queries on user_id + timestamps
- Materialized views for pattern detection
- Partial indexes on effectiveness scores
- JSONB indexes on frequent_topics

### **Computation Optimizations**
- Async pattern detection (non-blocking)
- Batch question effectiveness updates
- Incremental profile updates
- Lazy loading of insights

---

## 🔒 PRODUCTION SAFETY

### **Backward Compatibility**
- ✅ Existing voice interview flow unchanged
- ✅ Adaptive features are opt-in enhancements
- ✅ Falls back to standard questions if adaptation fails
- ✅ No breaking changes to Phase 22 interview signals

### **Graceful Degradation**
- ✅ Profile creation failures don't block interviews
- ✅ Pattern detection failures use default questions
- ✅ Data gap analysis failures use routine questions
- ✅ Question generation failures use question bank

### **Error Handling**
- ✅ Comprehensive try-catch blocks
- ✅ Detailed error logging
- ✅ Fallback to non-adaptive mode
- ✅ User-friendly error messages

---

## 📊 SUCCESS METRICS

### **Adaptation Effectiveness**
- Data gap closure rate: >30% per interview
- Question redundancy reduction: >50%
- User engagement increase: >20%
- Interview completion rate: >90%

### **Data Quality**
- Signal extraction rate: >80%
- Average confidence: >0.75
- Data completeness improvement: +10% per week
- Pattern detection accuracy: >85%

### **User Experience**
- Interview duration reduction: -20%
- Skip rate reduction: -30%
- User satisfaction: >4.5/5
- Return rate: >80%

---

## 🚀 IMPLEMENTATION PHASES

### **Phase 25 Backend (Week 9)**
1. Database schema migration
2. User interview profile service
3. Pattern detection service
4. Data gap analysis service
5. Adaptive question generation service
6. Question effectiveness tracking
7. Enhanced voice interview service integration
8. API endpoints
9. Testing and deployment

### **Phase 25 UI (Week 10)**
1. Interview Insights Screen
2. Adaptive Interview Feedback Component
3. Data completeness visualization
4. Pattern display components
5. Navigation integration
6. Testing and deployment

---

## 📝 DELIVERABLES

### **Backend (Phase 25)**
- Database migration SQL
- 5 new services (profile, patterns, gaps, adaptive, effectiveness)
- Enhanced voice interview service
- 12+ new API endpoints
- Comprehensive tests
- Deployment guide

### **UI (Phase 25 UI)**
- 1 new screen (Interview Insights)
- 2 new components (Adaptive Feedback, Data Completeness)
- Navigation integration
- API integration
- UI tests
- User guide

---

**Phase 5: Voice Interview Adaptation - Ready for Implementation** 🚀
