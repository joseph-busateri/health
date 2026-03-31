# Unified Intelligent Interview System

## 🎯 **Core Principle**

**To the user:** One seamless conversation with natural questions  
**Behind the scenes:** Intelligent routing based on cadence rules + AI analysis

**User sees:** "How would you rate your libido this week?"  
**System knows:** This is a weekly sexual health question, triggered by Saturday cadence

**User doesn't see:**
- ❌ Categories (recovery, stress, sexual health)
- ❌ Question types (static vs AI)
- ❌ Scheduling logic (daily vs weekly)
- ❌ Priority scores

**User experiences:** Natural conversation that adapts to their health state

---

## 🧠 **Intelligent Question Routing**

### **Two Routing Mechanisms:**

#### **1. Cadence-Based Routing (Rules)**
Certain questions asked on specific schedules:

```typescript
const cadenceRules = {
  // Daily questions (every day)
  sleep: { frequency: 'daily', priority: 10 },
  recovery: { frequency: 'daily', priority: 9 },
  stress: { frequency: 'daily', priority: 9 },
  workout: { frequency: 'daily', priority: 8 },
  energy: { frequency: 'daily', priority: 7 },
  
  // Weekly questions (specific days)
  sexual_health_desire: { frequency: 'weekly', dayOfWeek: 6, priority: 6 }, // Saturday
  sexual_health_satisfaction: { frequency: 'weekly', dayOfWeek: 6, priority: 6 },
  sexual_health_stress: { frequency: 'weekly', dayOfWeek: 6, priority: 6 },
  
  // Conditional questions (when triggered)
  sleep_interruptions: { frequency: 'as_needed', trigger: 'sleep_poor', priority: 8 },
  stress_sources: { frequency: 'as_needed', trigger: 'stress_high', priority: 8 },
  workout_barriers: { frequency: 'as_needed', trigger: 'workout_skipped', priority: 7 },
  joint_pain: { frequency: 'as_needed', trigger: 'has_pain', priority: 8 },
};
```

#### **2. AI-Driven Routing (Intelligence)**
AI analyzes context and generates questions when:
- Multiple health domains at risk
- Contradictory signals (good sleep but poor recovery)
- Complex health flags (abnormal bloodwork + symptoms)
- Deep dive needed based on previous answer

```typescript
const shouldUseAI = (context: InterviewContext, history: ConversationTurn[]): boolean => {
  // Multiple at-risk domains
  const atRiskCount = countAtRiskDomains(context);
  if (atRiskCount >= 3) return true;
  
  // Contradictory signals
  if (context.recovery?.sleepHours >= 8 && context.recovery?.score === 'low') return true;
  
  // Complex bloodwork flags
  if ((context.bloodwork?.flags?.length ?? 0) > 2) return true;
  
  // Deep dive needed
  if (needsDeepDive(history)) return true;
  
  return false;
};
```

---

## 📋 **Unified Question Pool**

All questions in one pool, differentiated only by internal metadata:

```typescript
interface UnifiedQuestion {
  id: string;
  text: string;
  priority: number;
  source: 'static' | 'ai';           // Internal only
  category: string;                   // Internal only
  frequency: 'daily' | 'weekly' | 'as_needed';
  dayOfWeek?: number;                 // 0-6 for weekly questions
  triggerCondition?: string;          // For as_needed questions
  quickResponses?: string[];
  expectsFreeText: boolean;
}

const UNIFIED_QUESTION_POOL: UnifiedQuestion[] = [
  // Daily questions
  {
    id: 'sleep_hours',
    text: 'How did you sleep last night?',
    priority: 10,
    source: 'static',
    category: 'recovery',
    frequency: 'daily',
    quickResponses: ['Great (7-9h)', 'Okay (6-7h)', 'Poor (<6h)', 'Terrible'],
    expectsFreeText: true,
  },
  {
    id: 'recovery_feeling',
    text: 'How recovered do you feel today?',
    priority: 9,
    source: 'static',
    category: 'recovery',
    frequency: 'daily',
    quickResponses: ['Fully recovered', 'Somewhat tired', 'Very fatigued', 'Exhausted'],
    expectsFreeText: true,
  },
  {
    id: 'stress_level',
    text: 'How stressed are you feeling?',
    priority: 9,
    source: 'static',
    category: 'stress',
    frequency: 'daily',
    quickResponses: ['Low', 'Moderate', 'High', 'Overwhelming'],
    expectsFreeText: true,
  },
  {
    id: 'workout_adherence',
    text: 'Did you complete your planned workout?',
    priority: 8,
    source: 'static',
    category: 'workout',
    frequency: 'daily',
    quickResponses: ['Yes, fully', 'Partially', 'No', 'Skipped'],
    expectsFreeText: true,
  },
  {
    id: 'energy_level',
    text: 'How are your energy levels today?',
    priority: 7,
    source: 'static',
    category: 'energy',
    frequency: 'daily',
    quickResponses: ['High energy', 'Normal', 'Low energy', 'Exhausted'],
    expectsFreeText: true,
  },
  
  // Weekly questions (Saturday)
  {
    id: 'sexual_health_desire',
    text: 'How would you rate your libido this week?',
    priority: 6,
    source: 'static',
    category: 'sexual_health',
    frequency: 'weekly',
    dayOfWeek: 6, // Saturday
    quickResponses: ['Very low (1)', 'Lower than usual (2)', 'Normal (3)', 'Higher than usual (4)', 'Very high (5)'],
    expectsFreeText: true,
  },
  {
    id: 'sexual_health_satisfaction',
    text: 'How satisfied are you with your sexual health this week?',
    priority: 6,
    source: 'static',
    category: 'sexual_health',
    frequency: 'weekly',
    dayOfWeek: 6,
    quickResponses: ['Very dissatisfied (1)', 'Somewhat dissatisfied (2)', 'Neutral (3)', 'Satisfied (4)', 'Very satisfied (5)'],
    expectsFreeText: true,
  },
  {
    id: 'sexual_health_stress_impact',
    text: 'Is stress impacting your intimacy or sexual health?',
    priority: 6,
    source: 'static',
    category: 'sexual_health',
    frequency: 'weekly',
    dayOfWeek: 6,
    quickResponses: ['No impact (1)', 'Minimal impact (2)', 'Moderate impact (3)', 'Significant impact (4)', 'Severe impact (5)'],
    expectsFreeText: true,
  },
  
  // Conditional questions (as_needed)
  {
    id: 'sleep_interruptions',
    text: 'What interrupted your sleep?',
    priority: 8,
    source: 'static',
    category: 'recovery',
    frequency: 'as_needed',
    triggerCondition: 'sleep_hours < 6 || sleep_quality < 3',
    quickResponses: ['Woke up multiple times', 'Trouble falling asleep', 'Early wake', 'Pain/discomfort'],
    expectsFreeText: true,
  },
  {
    id: 'stress_sources',
    text: 'What are the main sources of stress right now?',
    priority: 8,
    source: 'static',
    category: 'stress',
    frequency: 'as_needed',
    triggerCondition: 'stress_level >= 4',
    quickResponses: ['Work', 'Relationships', 'Finances', 'Health'],
    expectsFreeText: true,
  },
  {
    id: 'workout_barriers',
    text: 'What prevented you from working out?',
    priority: 7,
    source: 'static',
    category: 'workout',
    frequency: 'as_needed',
    triggerCondition: 'workout_adherence < 50',
    quickResponses: ['Too tired', 'No time', 'Pain/injury', 'Not motivated'],
    expectsFreeText: true,
  },
  {
    id: 'joint_pain_check',
    text: 'Are you experiencing any joint pain or discomfort?',
    priority: 8,
    source: 'static',
    category: 'joint_health',
    frequency: 'as_needed',
    triggerCondition: 'has_active_pain',
    quickResponses: ['No pain', 'Mild discomfort', 'Moderate pain', 'Severe pain'],
    expectsFreeText: true,
  },
];
```

---

## 🔄 **Intelligent Question Selection**

### **Selection Algorithm:**

```typescript
const selectNextQuestion = async (
  context: InterviewContext,
  conversationHistory: ConversationTurn[],
  sessionState: InterviewSession
): Promise<Question> => {
  
  const today = new Date();
  const dayOfWeek = today.getDay();
  const askedQuestionIds = new Set(conversationHistory.map(t => t.questionId));
  
  // Step 1: Get eligible questions
  const eligibleQuestions = UNIFIED_QUESTION_POOL.filter(q => {
    // Already asked this session
    if (askedQuestionIds.has(q.id)) return false;
    
    // Check frequency
    if (q.frequency === 'daily') return true;
    
    if (q.frequency === 'weekly') {
      return q.dayOfWeek === dayOfWeek;
    }
    
    if (q.frequency === 'as_needed') {
      return evaluateTriggerCondition(q.triggerCondition, context, conversationHistory);
    }
    
    return false;
  });
  
  // Step 2: Decide static vs AI
  if (shouldUseAI(context, conversationHistory)) {
    // Generate AI question for complex scenarios
    return await generateAIQuestion(context, conversationHistory);
  }
  
  // Step 3: Select highest priority static question
  const sortedQuestions = eligibleQuestions.sort((a, b) => b.priority - a.priority);
  
  if (sortedQuestions.length > 0) {
    return sortedQuestions[0];
  }
  
  // Step 4: Fallback to final open question
  return {
    id: 'final_open',
    text: 'Anything else you want to share about your health today?',
    priority: 5,
    source: 'static',
    category: 'general',
    frequency: 'daily',
    expectsFreeText: true,
  };
};
```

---

## 📊 **Example Interview Flows**

### **Monday (Regular Day):**

```
User sees:
1. "How did you sleep last night?" → Daily
2. "How recovered do you feel today?" → Daily
3. "How stressed are you feeling?" → Daily
4. "Did you complete your planned workout?" → Daily
5. "How are your energy levels today?" → Daily
6. "Anything else you want to share?" → Final

Backend knows:
- All daily cadence questions
- No weekly questions (not Saturday)
- No conditional triggers (user is healthy)
- 6 questions, ~2 minutes
```

---

### **Saturday (Sexual Health Week):**

```
User sees:
1. "How did you sleep last night?" → Daily
2. "How recovered do you feel today?" → Daily
3. "How stressed are you feeling?" → Daily
4. "Did you complete your planned workout?" → Daily
5. "How are your energy levels today?" → Daily
6. "How would you rate your libido this week?" → Weekly (Saturday)
7. "How satisfied are you with your sexual health this week?" → Weekly (Saturday)
8. "Is stress impacting your intimacy or sexual health?" → Weekly (Saturday)
9. "Anything else you want to share?" → Final

Backend knows:
- 5 daily questions
- 3 weekly sexual health questions (Saturday cadence)
- Questions appear in natural flow
- 9 questions, ~3 minutes
```

---

### **Tuesday (Poor Sleep + High Stress):**

```
User sees:
1. "How did you sleep last night?" → Daily
   Answer: "Terrible, only 5 hours"
   
2. "What interrupted your sleep?" → Conditional (triggered by poor sleep)
   Answer: "Woke up multiple times"
   
3. "How recovered do you feel today?" → Daily
   Answer: "Exhausted, a 1"
   
4. "How stressed are you feeling?" → Daily
   Answer: "Very high, a 5"
   
5. "What are the main sources of stress right now?" → Conditional (triggered by high stress)
   Answer: "Work deadlines and family stuff"
   
6. [AI-GENERATED] "Your sleep was poor and stress is very high. Are you experiencing any physical symptoms like headaches or chest tightness?" → AI (complex scenario)
   Answer: "Yeah, tension headaches"
   
7. "Did you complete your planned workout?" → Daily
   Answer: "No, too tired"
   
8. "What prevented you from working out?" → Conditional (triggered by skipped workout)
   Answer: "Exhaustion from poor sleep"
   
9. "Anything else you want to share?" → Final

Backend knows:
- 5 daily questions
- 3 conditional questions (sleep, stress, workout triggers)
- 1 AI-generated question (complex health scenario)
- Questions flow naturally despite different sources
- 9 questions, ~4 minutes
```

---

## 🎨 **User Experience**

### **What User Sees (Mobile UI):**

```
┌─────────────────────────────────────────┐
│  Daily Check-In                         │
│  Questions: 6/9  |  Time: 2:15 / 3:00  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│  "How would you rate your libido       │
│   this week?"                           │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Very low │ │ Lower   │ │ Normal  │  │
│  │   (1)   │ │   (2)   │ │   (3)   │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  ┌─────────┐ ┌─────────┐              │
│  │ Higher  │ │Very high│              │
│  │   (4)   │ │   (5)   │              │
│  └─────────┘ └─────────┘              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Or type your answer...            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Skip]              [Next Question]   │
│                                         │
└─────────────────────────────────────────┘
```

**User doesn't see:**
- ❌ "Sexual Health Category"
- ❌ "Weekly Question (Saturday)"
- ❌ "Static Question from Bank"
- ❌ Priority scores or routing logic

**User only sees:**
- ✅ Natural question
- ✅ Quick response options
- ✅ Text input alternative
- ✅ Progress indicator

---

## 💾 **Data Extraction & Storage**

### **Unified Answer Processing:**

```typescript
const processAnswer = (question: UnifiedQuestion, answer: string, context: InterviewContext) => {
  // Extract metrics based on question category (internal)
  const extracted: any = {};
  
  switch (question.category) {
    case 'recovery':
      if (question.id === 'sleep_hours') {
        extracted.sleepHours = extractSleepHours(answer);
      }
      if (question.id === 'recovery_feeling') {
        extracted.recoveryFeeling = extractNumericScale(answer);
      }
      break;
      
    case 'stress':
      if (question.id === 'stress_level') {
        extracted.stressLevel = extractNumericScale(answer);
      }
      break;
      
    case 'workout':
      if (question.id === 'workout_adherence') {
        extracted.workoutAdherence = extractWorkoutAdherence(answer);
      }
      break;
      
    case 'sexual_health':
      if (question.id === 'sexual_health_desire') {
        extracted.desireLevel = extractNumericScale(answer);
      }
      if (question.id === 'sexual_health_satisfaction') {
        extracted.satisfactionLevel = extractNumericScale(answer);
      }
      if (question.id === 'sexual_health_stress_impact') {
        extracted.stressImpact = extractNumericScale(answer);
      }
      break;
  }
  
  return extracted;
};
```

### **Multi-Table Distribution:**

```typescript
const saveInterviewData = async (session: InterviewSession) => {
  const allExtracted = {};
  
  // Process all answers
  session.conversationHistory.forEach(turn => {
    const question = findQuestionById(turn.questionId);
    const extracted = processAnswer(question, turn.answer, session.context);
    Object.assign(allExtracted, extracted);
  });
  
  // Save to daily_logs
  await saveToDailyLogs(session.userId, allExtracted);
  
  // Save to sexual_health_check_ins (if Saturday and data collected)
  if (allExtracted.desireLevel && allExtracted.satisfactionLevel && allExtracted.stressImpact) {
    await saveToSexualHealthCheckIns(session.userId, allExtracted);
  }
  
  // Save to other tables as needed
  // ...
};
```

---

## 🎯 **Key Benefits**

### **For Users:**
1. **Seamless experience** - All questions feel the same
2. **No cognitive load** - Don't need to understand categories or schedules
3. **Natural flow** - Conversation adapts without jarring transitions
4. **Consistent UI** - Same interface for all questions

### **For System:**
1. **Intelligent routing** - Right questions at right time
2. **Flexible scheduling** - Daily, weekly, conditional, AI-driven
3. **Unified data model** - All questions processed the same way
4. **Easy to extend** - Add new questions to pool with metadata

### **For Data Quality:**
1. **Complete coverage** - All health domains captured
2. **Contextual depth** - AI dives deeper when needed
3. **Temporal consistency** - Weekly questions on schedule
4. **High completion** - Natural flow = better adherence

---

## 🔧 **Implementation Strategy**

### **Phase 1: Unified Question Pool**
- Merge static question bank with metadata
- Add sexual health questions with weekly cadence
- Add conditional questions with triggers
- Test question eligibility filtering

### **Phase 2: Intelligent Routing**
- Implement cadence-based selection (daily, weekly, as_needed)
- Implement AI decision logic (when to use AI vs static)
- Add day-of-week checking for weekly questions
- Test routing with various scenarios

### **Phase 3: Seamless UI**
- Remove category badges from mobile UI
- Remove source indicators (static/AI)
- Keep only: question text, quick responses, progress
- Test user experience

### **Phase 4: Data Processing**
- Unified answer extraction
- Multi-table distribution
- Sexual health auto-status determination
- Test data flow end-to-end

---

## 📊 **Success Metrics**

- [ ] Users can't distinguish static vs AI questions
- [ ] Sexual health questions appear only on Saturdays
- [ ] Conditional questions trigger correctly
- [ ] AI questions generate for complex scenarios
- [ ] All data saves to correct tables
- [ ] Interview duration stays under 5 minutes
- [ ] User feedback: "Natural, conversational, not repetitive"

---

## 🎯 **Summary**

**Unified Intelligent Interview System:**
- **One conversation** with seamless question flow
- **Two routing mechanisms:** Cadence rules + AI intelligence
- **No visible categories** to users
- **Automatic scheduling:** Daily, weekly (Saturday sexual health), conditional
- **Smart adaptation:** AI kicks in for complex scenarios
- **Complete data capture:** All health domains covered naturally

**User experience:** "Just answering health questions"  
**System reality:** Sophisticated routing, scheduling, and intelligence

**Result:** Natural conversation that comprehensively captures health data without overwhelming or confusing users.
