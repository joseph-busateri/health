# Comprehensive Interview System - All Manual Data Entry via Conversation

## 🎯 **Vision**

**Replace ALL manual data entry forms with a single, conversational daily interview.**

Instead of users filling out separate forms for:
- Daily logs (sleep, stress, recovery)
- Meal logging
- Cardio metrics (BP, HR)
- Sexual health check-ins
- Supplement adherence
- Workout tracking

**They answer conversational questions in a 3-5 minute daily interview.**

---

## 📊 **Current Manual Data Entry Points**

### **1. Daily Logs** (Currently in interview)
- Sleep hours
- Sleep quality (1-5)
- Stress level (1-5)
- Recovery feeling (1-5)
- Workout adherence (%)
- Notes

**Status:** ✅ Already in interview

---

### **2. Meal Logging** (Separate form)
- Meal type (breakfast, lunch, dinner, snack)
- Protein grams
- Carbs grams
- Fats grams
- Notes

**Status:** ❌ Needs integration

**Current:** Users manually log each meal
**Proposed:** "Did you hit your protein target today? How many meals did you log?"

---

### **3. Cardio Metrics** (Separate form)
- Systolic BP (mmHg)
- Diastolic BP (mmHg)
- Resting heart rate (bpm)
- Source (manual, device)
- Notes

**Status:** ❌ Needs integration

**Current:** Users manually enter BP/HR readings
**Proposed:** "Did you take your blood pressure today? What were the readings?"

---

### **4. Sexual Health Check-Ins** (No UI exists)
- Desire level (1-5)
- Satisfaction level (1-5)
- Stress impact (1-5)
- Status (Aligned/Monitoring/Concerned)
- Notes

**Status:** ❌ Needs integration

**Current:** No way to collect
**Proposed:** Weekly question: "How would you rate your libido and sexual satisfaction this week?"

---

### **5. Supplement Adherence** (Separate tracking)
- Which supplements taken
- Adherence percentage
- Missed doses
- Notes

**Status:** ❌ Needs integration

**Current:** Separate supplement log
**Proposed:** "Did you take your supplements as planned today?"

---

### **6. Body Composition** (Separate form)
- Weight
- Body fat %
- Muscle mass
- Measurements
- Notes

**Status:** ❌ Needs integration (less frequent)

**Current:** Manual entry
**Proposed:** Weekly question: "Did you weigh yourself this week? What was it?"

---

## 🎯 **Comprehensive Interview Question Bank**

### **Core Daily Questions (Every Day):**

#### **Recovery Domain:**
1. "How did you sleep last night?" → Sleep hours + quality
2. "How recovered do you feel today?" → Recovery feeling (1-5)
3. "How stressed are you feeling?" → Stress level (1-5)

#### **Performance Domain:**
4. "Did you complete your planned workout?" → Workout adherence
5. "How are your energy levels today?" → Energy (1-5)

#### **Nutrition Domain:**
6. "How well did you stick to your nutrition plan?" → Adherence
7. "Did you hit your protein target today?" → Protein intake
8. "How many meals did you log?" → Meal frequency

#### **Supplement Domain:**
9. "Did you take your supplements as planned?" → Supplement adherence

---

### **Conditional Questions (Based on Context):**

#### **Cardiovascular (If BP/HR due or flagged):**
10. "Did you take your blood pressure today?" → Yes/No
11. "What were the readings?" → Systolic/Diastolic/HR
12. "Any cardiovascular symptoms?" → Chest pain, shortness of breath, etc.

#### **Sexual Health (Weekly on specific day):**
13. "How would you rate your libido this week?" → Desire (1-5)
14. "How satisfied are you with your sexual health?" → Satisfaction (1-5)
15. "Is stress impacting your intimacy?" → Stress impact (1-5)

#### **Body Composition (Weekly):**
16. "Did you weigh yourself this week?" → Yes/No
17. "What was your weight?" → Weight in lbs/kg
18. "Any changes in how your clothes fit?" → Subjective body comp

#### **Joint Health (If pain reported):**
19. "Any joint pain or discomfort?" → Yes/No
20. "Where is the pain located?" → Location
21. "How severe is it?" → Pain level (1-5)

#### **Meal Details (If nutrition adherence low):**
22. "What made it difficult to stick to your plan?" → Barriers
23. "Which meals did you skip or go off-plan?" → Specific meals
24. "What would help you stay on track?" → Solutions

---

## 🔄 **Interview Flow Design**

### **Daily Interview Structure:**

```
START (0:00)
    ↓
GREETING
"Good morning! Let's do your daily check-in."
    ↓
CORE QUESTIONS (1:30)
1. Sleep (15s)
2. Recovery feeling (15s)
3. Stress (15s)
4. Workout (15s)
5. Supplements (15s)
6. Nutrition (15s)
    ↓
CONDITIONAL QUESTIONS (1:00)
- If high stress → Stress sources
- If poor sleep → Sleep interruptions
- If low workout → Barriers
- If joint pain → Pain details
- If BP due → Cardio metrics
- If weekly sexual health → Sexual health check-in
    ↓
FINAL QUESTION (0:30)
"Anything else you want to share about your health today?"
    ↓
COMPLETE (3:00)
```

---

## 📝 **Question Design Principles**

### **1. Natural Language:**
❌ "Enter systolic blood pressure (mmHg):"
✅ "What was your blood pressure reading? Just the top number first."

### **2. Conversational Flow:**
❌ "Desire level: 1-5"
✅ "How's your libido been this week? Would you say low, normal, or high?"

### **3. Smart Parsing:**
User: "I slept about 7 and a half hours"
System extracts: `sleepHours: 7.5`

User: "My BP was 120 over 75"
System extracts: `systolic: 120, diastolic: 75`

User: "Libido is pretty good, maybe a 4 out of 5"
System extracts: `desireLevel: 4`

### **4. Quick Responses:**
For common answers, provide tap shortcuts:
- Sleep: "Great (7-9h)", "Okay (6-7h)", "Poor (<6h)"
- Stress: "Low", "Moderate", "High", "Overwhelming"
- Workout: "Yes, fully", "Partially", "No", "Skipped"

---

## 🧠 **Smart Question Routing**

### **Priority-Based Selection:**

```typescript
const questionPriorities = {
  // Always ask (core daily)
  sleep: { priority: 10, frequency: 'daily' },
  recovery: { priority: 9, frequency: 'daily' },
  stress: { priority: 9, frequency: 'daily' },
  workout: { priority: 8, frequency: 'daily' },
  supplements: { priority: 7, frequency: 'daily' },
  nutrition: { priority: 7, frequency: 'daily' },
  
  // Conditional (based on context)
  bloodPressure: { priority: 9, frequency: 'weekly', condition: 'cv_at_risk || bp_due' },
  sexualHealth: { priority: 6, frequency: 'weekly', condition: 'day_of_week === 6' },
  bodyComposition: { priority: 5, frequency: 'weekly', condition: 'day_of_week === 0' },
  jointPain: { priority: 8, frequency: 'as_needed', condition: 'has_active_pain' },
  
  // Deep dives (based on answers)
  sleepInterruptions: { priority: 8, frequency: 'as_needed', condition: 'sleep_poor' },
  stressSources: { priority: 8, frequency: 'as_needed', condition: 'stress_high' },
  workoutBarriers: { priority: 7, frequency: 'as_needed', condition: 'workout_skipped' },
  nutritionChallenges: { priority: 6, frequency: 'as_needed', condition: 'nutrition_low' },
};
```

---

## 💾 **Data Extraction & Storage**

### **Answer Parsing Logic:**

```typescript
const parseAnswer = (question: string, answer: string) => {
  // Sleep hours
  if (question.includes('sleep')) {
    const hoursMatch = answer.match(/(\d+\.?\d*)\s*(hours?|h)/i);
    if (hoursMatch) return { sleepHours: parseFloat(hoursMatch[1]) };
  }
  
  // Blood pressure
  if (question.includes('blood pressure')) {
    const bpMatch = answer.match(/(\d+)\s*(?:over|\/)\s*(\d+)/i);
    if (bpMatch) return { 
      systolic: parseInt(bpMatch[1]), 
      diastolic: parseInt(bpMatch[2]) 
    };
  }
  
  // Heart rate
  if (question.includes('heart rate')) {
    const hrMatch = answer.match(/(\d+)\s*(?:bpm)?/i);
    if (hrMatch) return { restingHeartRate: parseInt(hrMatch[1]) };
  }
  
  // Numeric scales (1-5)
  if (answer.match(/\b[1-5]\b/)) {
    const num = parseInt(answer.match(/\b[1-5]\b/)[0]);
    if (question.includes('stress')) return { stressLevel: num };
    if (question.includes('recovery')) return { recoveryFeeling: num };
    if (question.includes('desire') || question.includes('libido')) return { desireLevel: num };
    if (question.includes('satisfaction')) return { satisfactionLevel: num };
  }
  
  // Meal count
  if (question.includes('meals')) {
    const mealMatch = answer.match(/(\d+)\s*meals?/i);
    if (mealMatch) return { mealsLogged: parseInt(mealMatch[1]) };
  }
  
  // Yes/No
  if (answer.match(/\b(yes|yeah|yep|yup)\b/i)) return { value: true };
  if (answer.match(/\b(no|nope|nah)\b/i)) return { value: false };
  
  // Default: store as text
  return { text: answer };
};
```

### **Multi-Table Storage:**

After interview completion, data is distributed to appropriate tables:

```typescript
const saveInterviewData = async (userId: string, answers: Answer[]) => {
  const extracted = extractAllMetrics(answers);
  
  // Save to daily_logs
  await supabase.from('daily_logs').upsert({
    user_id: userId,
    log_date: today(),
    sleep_hours: extracted.sleepHours,
    sleep_quality: extracted.sleepQuality,
    stress_level: extracted.stressLevel,
    recovery_feeling: extracted.recoveryFeeling,
    workout_adherence: extracted.workoutAdherence,
    energy_level: extracted.energyLevel,
    notes: extracted.notes,
  });
  
  // Save to cardio_metrics (if collected)
  if (extracted.systolic && extracted.diastolic) {
    await supabase.from('cardio_metrics').insert({
      user_id: userId,
      taken_at: now(),
      systolic: extracted.systolic,
      diastolic: extracted.diastolic,
      resting_heart_rate: extracted.restingHeartRate,
      source: 'interview',
    });
  }
  
  // Save to sexual_health_check_ins (if weekly check-in)
  if (extracted.desireLevel) {
    await supabase.from('sexual_health_check_ins').insert({
      user_id: userId,
      taken_at: now(),
      desire_level: extracted.desireLevel,
      satisfaction_level: extracted.satisfactionLevel,
      stress_impact: extracted.stressImpact,
      status: determineStatus(extracted),
      notes: extracted.sexualHealthNotes,
    });
  }
  
  // Save to supplement_adherence_log
  if (extracted.supplementAdherence !== undefined) {
    await supabase.from('supplement_adherence_log').upsert({
      user_id: userId,
      log_date: today(),
      adherence_percentage: extracted.supplementAdherence,
    });
  }
  
  // Save to body_composition (if weekly weigh-in)
  if (extracted.weight) {
    await supabase.from('body_composition').insert({
      user_id: userId,
      measured_at: now(),
      weight: extracted.weight,
      source: 'interview',
    });
  }
};
```

---

## 🎯 **Weekly Schedule**

### **Monday:**
- Core daily questions
- "Did you weigh yourself over the weekend?" (body composition)

### **Tuesday-Friday:**
- Core daily questions
- Conditional deep-dives

### **Saturday:**
- Core daily questions
- "How's your libido and sexual satisfaction been this week?" (sexual health)

### **Sunday:**
- Core daily questions
- "Did you take your blood pressure this week?" (cardiovascular)

---

## 📊 **Example Interview Flows**

### **Scenario 1: Simple Day (2 minutes)**

```
Q: "How did you sleep last night?"
A: "Pretty good, about 7.5 hours"
   → Extracted: sleepHours: 7.5

Q: "How recovered do you feel today?"
A: "Good, maybe a 4"
   → Extracted: recoveryFeeling: 4

Q: "How stressed are you feeling?"
A: "Low stress today, a 2"
   → Extracted: stressLevel: 2

Q: "Did you complete your planned workout?"
A: "Yes, fully"
   → Extracted: workoutAdherence: 100

Q: "Did you take your supplements?"
A: "Yep, all of them"
   → Extracted: supplementAdherence: 100

Q: "How well did you stick to your nutrition plan?"
A: "Pretty well, maybe 80%"
   → Extracted: nutritionAdherence: 80

Q: "Anything else you want to share?"
A: "Nope, feeling great!"
   → Extracted: notes: "Feeling great!"

✅ Interview complete: 6 questions, 2:00 elapsed
```

---

### **Scenario 2: Complex Day with Deep Dives (4 minutes)**

```
Q: "How did you sleep last night?"
A: "Terrible, only got like 5 hours"
   → Extracted: sleepHours: 5
   → Triggers: sleep_interruptions question

Q: "What interrupted your sleep?"
A: "Woke up multiple times, couldn't fall back asleep"
   → Extracted: sleepInterruptions: "woke up multiple times"

Q: "How recovered do you feel today?"
A: "Exhausted, a 1"
   → Extracted: recoveryFeeling: 1

Q: "How stressed are you feeling?"
A: "Very high, like a 5"
   → Extracted: stressLevel: 5
   → Triggers: stress_sources question

Q: "What are the main sources of stress right now?"
A: "Work deadlines and family stuff"
   → Extracted: stressSources: "work, family"

Q: "Did you complete your planned workout?"
A: "No, skipped it"
   → Extracted: workoutAdherence: 0
   → Triggers: workout_barriers question

Q: "What prevented you from working out?"
A: "Too tired from poor sleep"
   → Extracted: workoutBarriers: "fatigue"

Q: "Did you take your supplements?"
A: "Forgot them this morning"
   → Extracted: supplementAdherence: 0

Q: "How well did you stick to your nutrition plan?"
A: "Not great, stress eating, maybe 40%"
   → Extracted: nutritionAdherence: 40

Q: "Any joint pain or discomfort today?"
A: "Yeah, my lower back is killing me"
   → Extracted: jointPain: true, location: "lower back"

Q: "How severe is the pain?"
A: "Pretty bad, like a 4 out of 5"
   → Extracted: painLevel: 4

Q: "Anything else you want to share?"
A: "Just need to get better sleep tonight"
   → Extracted: notes: "Need better sleep"

✅ Interview complete: 12 questions, 4:15 elapsed
```

---

### **Scenario 3: Saturday with Sexual Health (3 minutes)**

```
[Core questions 1-6 completed]

Q: "How's your libido and sexual satisfaction been this week?"
A: "Libido has been pretty good, maybe a 4. Satisfaction is good too, also a 4."
   → Extracted: desireLevel: 4, satisfactionLevel: 4

Q: "Is stress impacting your intimacy at all?"
A: "Not really, stress is low, maybe a 2"
   → Extracted: stressImpact: 2

Q: "Would you say your sexual health is aligned with your goals?"
A: "Yeah, definitely aligned"
   → Extracted: status: "Aligned"

Q: "Anything else you want to share?"
A: "Nope, all good!"

✅ Interview complete: 9 questions, 3:00 elapsed
   → Saved to sexual_health_check_ins table
```

---

## 🎯 **Benefits of Comprehensive Interview**

### **For Users:**
1. **Single daily touchpoint** - No more juggling multiple forms
2. **Faster** - 3-5 minutes vs. 10+ minutes across forms
3. **Natural** - Conversational vs. clinical data entry
4. **Contextual** - Only asks relevant questions
5. **Adaptive** - Deep dives when needed

### **For Data Quality:**
1. **Higher completion rates** - Easier = more consistent
2. **Richer context** - Free-form answers provide nuance
3. **Better adherence tracking** - Daily check-in habit
4. **Fewer missed metrics** - All in one place
5. **Temporal consistency** - All data from same time each day

### **For System Intelligence:**
1. **Complete daily snapshot** - All health domains captured
2. **Better recommendations** - More data = better insights
3. **Trend detection** - Consistent daily data
4. **Correlation analysis** - All metrics timestamped together
5. **Predictive modeling** - Rich dataset for ML

---

## 🔧 **Implementation Phases**

### **Phase 1: Expand Question Bank (Week 1)**
- Add sexual health questions
- Add cardio metric questions
- Add body composition questions
- Add meal logging questions
- Test question routing logic

### **Phase 2: Smart Parsing (Week 2)**
- Build answer extraction logic
- Test BP/HR parsing
- Test numeric scale parsing
- Test meal count parsing
- Handle edge cases

### **Phase 3: Multi-Table Storage (Week 3)**
- Update `saveInterviewToDatabase()`
- Add cardio metrics insertion
- Add sexual health insertion
- Add supplement adherence insertion
- Add body composition insertion

### **Phase 4: UI Updates (Week 4)**
- Update mobile interview screen
- Add quick response buttons for new questions
- Add visual indicators for weekly questions
- Test full flow end-to-end

### **Phase 5: Migration (Week 5)**
- Deprecate separate forms
- Update navigation
- User communication
- Monitor completion rates

---

## 📊 **Success Metrics**

### **Adoption:**
- Daily interview completion rate > 80%
- Average interview duration < 4 minutes
- User satisfaction > 4.5/5

### **Data Quality:**
- All 5 health components have data > 90% of days
- Sexual health check-ins > 75% weekly completion
- Cardio metrics > 50% weekly completion

### **System Impact:**
- Overall health score calculable > 95% of days
- Recommendation quality improves (measured by acceptance rate)
- User retention increases

---

## 🎯 **Summary**

**Transform from:**
- 6 separate forms
- 10+ minutes of data entry
- Low completion rates
- Fragmented user experience

**To:**
- 1 conversational interview
- 3-5 minutes daily
- High completion rates
- Seamless user experience

**All manual data entry consolidated into a single, intelligent, adaptive daily conversation.**
