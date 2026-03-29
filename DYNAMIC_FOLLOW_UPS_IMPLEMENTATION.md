# Dynamic Follow-Ups End-to-End Implementation

## Overview
Built a complete adaptive, context-aware conversational interview system that dynamically generates follow-up questions based on user responses and health context.

---

## Backend Implementation

### Types & Context Structures
**File**: `server/src/types/dynamicFollowUps.ts`

**Core Types**:
- `InterviewContext` - Comprehensive health context including:
  - Control Tower (overall health score, status, recommendations)
  - Recovery (score, sleep hours, sleep quality, recovery feeling)
  - Stress (level, sources, trend)
  - Sexual Health (libido, performance, concerns)
  - Body Composition (weight, body fat, muscle mass, trend)
  - Bloodwork (recent results, critical flags, recommendations)
  - Prior Responses (question history)
  - Workout Adherence
  - Joint Pain (active pain, location, severity)

- `QuestionCandidate` - Question structure with:
  - ID, text, priority, category
  - Trigger conditions
  - Quick responses
  - Free text expectation

- `InterviewState` - Session state tracking:
  - Questions asked
  - Responses collected
  - Signal collected by domain
  - Branching path
  - Completion status

- `FollowUpDecision` - Next question determination:
  - Should ask follow-up
  - Next question candidate
  - Reason for decision
  - Estimated questions remaining

- `InterviewSummary` - Completion summary:
  - Total questions
  - Signal quality (low/moderate/high)
  - Key insights
  - Areas explored
  - Recommendations

- `BranchingScenario` - 8 dynamic branching paths:
  - poor_sleep
  - poor_recovery
  - high_stress
  - joint_pain
  - missed_workout
  - sexual_health_concern
  - nutrition_issue
  - bloodwork_flag

### Dynamic Follow-Up Service
**File**: `server/src/services/dynamicFollowUpService.ts`

**Question Bank**: 13 context-aware questions covering:
- Sleep quality and interruptions
- Recovery feeling
- Stress level and sources
- Workout adherence and skip reasons
- Joint pain check and location
- Sexual health and duration
- Nutrition adherence and challenges

**Core Functions**:

1. **`generateNextQuestion(context, state)`**
   - Filters already-asked questions
   - Scores candidates based on context triggers
   - Prioritizes based on:
     - Low recovery (+5 priority)
     - High stress (+5 priority)
     - Active joint pain (+5 priority)
     - Low workout adherence (+4 priority)
     - Low libido (+3 priority)
     - Prior response triggers (+8 priority)
   - Returns highest-scored question

2. **`evaluateInterviewState(state)`**
   - Counts signal collected across domains
   - Identifies missing areas
   - Determines if sufficient signal collected (≥3 domains or ≥6 questions)

3. **`determineFollowUp(context, state, lastResponse)`**
   - Evaluates current interview state
   - Checks for completion criteria
   - Generates next question if needed
   - Returns follow-up decision with reasoning

4. **`identifyBranchingScenario(context, lastResponse)`**
   - Analyzes context and response
   - Identifies critical scenarios requiring deeper exploration
   - Returns branching scenario or null

5. **`finalizeInterview(state, context)`**
   - Calculates signal quality
   - Extracts key insights from responses
   - Generates recommendations based on collected signal
   - Returns comprehensive summary

6. **Session Management**:
   - `startInterviewSession()` - Initialize new session
   - `recordResponse()` - Store response and update signal tracking
   - `getInterviewSession()` - Retrieve session state
   - `completeInterviewSession()` - Mark session complete

**Adaptive Logic**:
- Not a fixed script - questions adapt to responses
- Context-aware prioritization
- Minimizes questions while maximizing signal
- Stops when sufficient signal collected or max questions reached

### API Endpoints
**File**: `server/src/routes/dynamicFollowUpRoutes.ts`

```
POST   /interview/start
POST   /interview/:session_id/response
POST   /interview/:session_id/next-question
POST   /interview/:session_id/finalize
GET    /interview/:session_id/state
```

**Registered in**: `server/src/index.ts`

---

## Mobile Implementation

### Dynamic Interview Screen
**File**: `mobile/src/screens/DynamicInterviewScreen.tsx`

**Features**:
- Conversational UI with message bubbles
- Question and answer differentiation
- Quick response buttons for common answers
- Free text input for detailed responses
- Auto-scrolling message feed
- Loading states between questions
- Completion summary display

**Interview Flow**:
1. **Start**: Fetches user context from dashboard, starts interview session
2. **Question Display**: Shows question with quick responses
3. **User Response**: Tap quick response or type free text
4. **Follow-Up Logic**: Backend determines next question based on response
5. **Final Question**: "Is there anything else you want to add?"
6. **Completion**: Shows summary with insights and recommendations

**UI Components**:
- Message bubbles (question/answer/system)
- Quick response chips
- Free text input with send button
- Loading indicators
- Summary card with key insights
- Done button to return to dashboard

**Context Integration**:
- Pulls recovery, stress, and workout data from dashboard
- Sends context with each response
- Enables intelligent question selection

---

## Dynamic Branching Scenarios

### 1. Poor Sleep
**Trigger**: Sleep hours < 6 or response contains "terrible"
**Follow-up**: Sleep interruptions, sleep environment, stress factors

### 2. Poor Recovery
**Trigger**: Recovery score = low
**Follow-up**: Training volume, nutrition, sleep quality, stress

### 3. High Stress
**Trigger**: Stress level = high or response contains "overwhelming"
**Follow-up**: Stress sources, coping mechanisms, duration, impact on training

### 4. Joint Pain
**Trigger**: Active joint pain or response contains "severe pain"
**Follow-up**: Pain location, severity, onset, impact on movement

### 5. Missed Workout
**Trigger**: Workout adherence < 30% or response contains "skipped"
**Follow-up**: Reason for skip, barriers, motivation, recovery status

### 6. Sexual Health Concern
**Trigger**: Libido = low or response contains "very low"
**Follow-up**: Duration, other symptoms, stress correlation, sleep quality

### 7. Nutrition Issue
**Trigger**: Nutrition adherence struggles
**Follow-up**: Specific challenges, cravings, meal timing, social factors

### 8. Bloodwork Flag
**Trigger**: Critical flags in recent bloodwork
**Follow-up**: Symptoms, supplement adherence, lifestyle factors

---

## Agent Behavior

### Initial Question Selection
- Analyzes full health context
- Prioritizes highest-concern areas
- Starts with most relevant question

### Follow-Up Generation
- Evaluates response content
- Identifies branching scenarios
- Selects next question based on:
  - Prior response triggers
  - Context signals
  - Missing domain coverage
  - Priority scoring

### Stopping Criteria
1. **Sufficient Signal**: ≥3 domains covered
2. **Max Questions**: ≥6-8 questions asked
3. **User Completion**: Final question answered
4. **No More Questions**: Question bank exhausted

### Final Question
Always ends with: **"Is there anything else you want to add?"**
- Allows user to share additional context
- Captures information not covered by structured questions
- User can decline to complete interview

---

## Signal Collection

### Domains Tracked
- ✅ Recovery
- ✅ Stress
- ✅ Workout
- ✅ Nutrition
- ✅ Sexual Health
- ✅ Joint Health

### Signal Quality Calculation
- **High**: ≥4 domains covered
- **Moderate**: 2-3 domains covered
- **Low**: <2 domains covered

### Key Insights Extraction
Automatically identifies:
- Pain/discomfort mentions
- High stress indicators
- Poor recovery signals
- Critical health concerns

---

## Example Interview Flow

**Context**: User has low recovery score (4/10), high stress (8/10), missed workout

**Question 1**: "How did you sleep last night?"
- Quick responses: Great | Okay | Poor | Terrible
- User selects: "Poor"
- Signal: Recovery ✅

**Question 2**: "What interrupted your sleep?"
- Quick responses: Woke up multiple times | Trouble falling asleep | Early wake | Pain/discomfort
- User types: "Woke up 3 times, mind racing about work"
- Signal: Stress ✅, Recovery ✅

**Question 3**: "How stressed are you feeling?"
- Quick responses: Low | Moderate | High | Overwhelming
- User selects: "High"
- Signal: Stress ✅

**Question 4**: "What are the main sources of stress right now?"
- Quick responses: Work | Relationships | Finances | Health
- User selects: "Work"
- Signal: Stress ✅

**Question 5**: "Did you complete your planned workout?"
- Quick responses: Yes, fully | Partially | No | Skipped
- User selects: "Skipped"
- Signal: Workout ✅

**Question 6**: "What prevented you from working out?"
- Quick responses: Too tired | No time | Pain/injury | Not motivated
- User selects: "Too tired"
- Signal: Workout ✅, Recovery ✅

**Final Question**: "Is there anything else you want to add?"
- User types: "Feeling burnt out, need a deload week"

**Summary**:
- Questions: 7
- Signal Quality: High
- Domains: Recovery, Stress, Workout
- Key Insights: Poor sleep, high work stress, fatigue affecting training
- Recommendations: Prioritize sleep and recovery, implement stress management, consider deload week

---

## Files Created/Modified

### Backend
- ✅ `server/src/types/dynamicFollowUps.ts`
- ✅ `server/src/services/dynamicFollowUpService.ts`
- ✅ `server/src/controllers/dynamicFollowUpController.ts`
- ✅ `server/src/routes/dynamicFollowUpRoutes.ts`
- ✅ `server/src/index.ts` (registered routes)

### Mobile
- ✅ `mobile/src/screens/DynamicInterviewScreen.tsx`

### Documentation
- ✅ `DYNAMIC_FOLLOW_UPS_IMPLEMENTATION.md` (this file)

---

## Design Principles

### Not a Fixed Script
- Questions adapt to responses in real-time
- No predetermined question order
- Branching based on actual user input

### Context-Aware
- Integrates Control Tower data
- Uses recovery, stress, workout, bloodwork context
- Prioritizes questions based on current health state

### Signal Maximization
- Targets 3+ domains for sufficient signal
- Stops when enough information collected
- Avoids redundant questions

### User-Centric
- Quick responses for common answers
- Free text for detailed responses
- Always allows final open-ended input
- Shows completion summary

---

## Testing Scenarios

### High Stress Path
1. Start with high stress context
2. Ask stress level → High
3. Ask stress sources → Work
4. Ask impact on sleep → Poor sleep
5. Ask sleep interruptions → Mind racing
6. Collect sufficient signal (stress + recovery)
7. Final question → Complete

### Joint Pain Path
1. Start with active joint pain
2. Ask joint pain check → Moderate pain
3. Ask location → Knee
4. Ask impact on workout → Skipped
5. Ask skip reason → Pain/injury
6. Collect sufficient signal (joint health + workout)
7. Final question → Complete

### Low Recovery Path
1. Start with low recovery score
2. Ask sleep quality → Poor
3. Ask recovery feeling → Very fatigued
4. Ask workout adherence → Partially
5. Ask nutrition adherence → Struggled
6. Collect sufficient signal (recovery + workout + nutrition)
7. Final question → Complete

---

## Next Steps (Integration)

1. **Replace Agent Screen**: Update `Agent` route to use `DynamicInterviewScreen`
2. **Test Context Integration**: Verify dashboard context flows correctly
3. **Validate Branching**: Test all 8 branching scenarios
4. **Refine Question Bank**: Add more questions based on user feedback
5. **Add Analytics**: Track question effectiveness and completion rates

---

## Summary

The Dynamic Follow-Ups system is **fully implemented** with:
- ✅ Context-aware question generation (7 input sources)
- ✅ Adaptive branching (8 scenarios)
- ✅ Interview state evaluation
- ✅ Signal quality tracking (6 domains)
- ✅ Conversational UI with quick responses
- ✅ Completion summary with insights
- ✅ 13-question bank with priority scoring
- ✅ 5 API endpoints for interview management
- ✅ Not a fixed script - fully adaptive

The system minimizes questions while maximizing signal, always ends with "Is there anything else you want to add?", and provides intelligent follow-ups based on user responses and health context.
