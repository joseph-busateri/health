# Sexual Health Interview Integration

## 🎯 **Scope**

Add **weekly sexual health check-in questions** to the existing hybrid interview system.

**What's being added:**
- ✅ Sexual health check-ins (weekly)

**What's NOT being added (handled elsewhere):**
- ❌ Meal logging → Separate nutrition section
- ❌ Cardio metrics (BP, HR) → Device integration
- ❌ Supplement adherence → Separate tracking
- ❌ Body composition → Monthly scans

---

## 📊 **Sexual Health Data to Collect**

### **Weekly Check-In (Every Saturday):**

```typescript
{
  desireLevel: number,          // 1-5 scale
  satisfactionLevel: number,    // 1-5 scale
  stressImpact: number,         // 1-5 scale
  status: 'Aligned' | 'Monitoring' | 'Concerned',
  notes?: string
}
```

---

## 🗓️ **Interview Schedule**

### **Monday-Friday:**
- Core daily questions only (sleep, stress, recovery, workout, energy)
- No sexual health questions

### **Saturday:**
- Core daily questions
- **+ Sexual health check-in** (3 additional questions)

### **Sunday:**
- Core daily questions only
- No sexual health questions

---

## 📝 **Sexual Health Questions**

### **Question 1: Desire/Libido**
**Static Question:**
```
"How would you rate your libido this week?"
```

**Quick Responses:**
- "Very low (1)"
- "Lower than usual (2)"
- "Normal (3)"
- "Higher than usual (4)"
- "Very high (5)"

**Expected Answer Formats:**
- "Pretty good, maybe a 4"
- "Low, like a 2"
- "Normal, 3"
- "Very high this week, 5"

**Parsing Logic:**
```typescript
// Extract number 1-5
const desireMatch = answer.match(/\b([1-5])\b/);
if (desireMatch) {
  desireLevel = parseInt(desireMatch[1]);
}

// Or keyword mapping
if (answer.match(/very low|non-existent/i)) desireLevel = 1;
if (answer.match(/low|lower/i)) desireLevel = 2;
if (answer.match(/normal|average|okay/i)) desireLevel = 3;
if (answer.match(/high|higher|good/i)) desireLevel = 4;
if (answer.match(/very high|excellent/i)) desireLevel = 5;
```

---

### **Question 2: Satisfaction**
**Static Question:**
```
"How satisfied are you with your sexual health this week?"
```

**Quick Responses:**
- "Very dissatisfied (1)"
- "Somewhat dissatisfied (2)"
- "Neutral (3)"
- "Satisfied (4)"
- "Very satisfied (5)"

**Expected Answer Formats:**
- "Satisfied, 4"
- "Pretty good, maybe a 4"
- "Not great, 2"
- "Very satisfied, 5"

**Parsing Logic:**
```typescript
const satisfactionMatch = answer.match(/\b([1-5])\b/);
if (satisfactionMatch) {
  satisfactionLevel = parseInt(satisfactionMatch[1]);
}

// Keyword mapping
if (answer.match(/very dissatisfied|terrible/i)) satisfactionLevel = 1;
if (answer.match(/dissatisfied|not great/i)) satisfactionLevel = 2;
if (answer.match(/neutral|okay|fine/i)) satisfactionLevel = 3;
if (answer.match(/satisfied|good/i)) satisfactionLevel = 4;
if (answer.match(/very satisfied|excellent|great/i)) satisfactionLevel = 5;
```

---

### **Question 3: Stress Impact**
**Static Question:**
```
"Is stress impacting your intimacy or sexual health?"
```

**Quick Responses:**
- "No impact (1)"
- "Minimal impact (2)"
- "Moderate impact (3)"
- "Significant impact (4)"
- "Severe impact (5)"

**Expected Answer Formats:**
- "Not really, maybe a 2"
- "Yeah, stress is high, like a 4"
- "No impact, 1"
- "Moderate impact, 3"

**Parsing Logic:**
```typescript
const stressMatch = answer.match(/\b([1-5])\b/);
if (stressMatch) {
  stressImpact = parseInt(stressMatch[1]);
}

// Keyword mapping
if (answer.match(/no impact|not at all/i)) stressImpact = 1;
if (answer.match(/minimal|slight|a little/i)) stressImpact = 2;
if (answer.match(/moderate|some/i)) stressImpact = 3;
if (answer.match(/significant|high|quite a bit/i)) stressImpact = 4;
if (answer.match(/severe|very high|overwhelming/i)) stressImpact = 5;
```

---

### **Question 4: Status (Optional - Auto-Determined)**
**Not asked directly, determined from answers:**

```typescript
const determineStatus = (desire: number, satisfaction: number, stress: number) => {
  // Concerned: Low desire OR low satisfaction OR high stress
  if (desire <= 2 || satisfaction <= 2 || stress >= 4) {
    return 'Concerned';
  }
  
  // Aligned: Good desire AND good satisfaction AND low stress
  if (desire >= 4 && satisfaction >= 4 && stress <= 2) {
    return 'Aligned';
  }
  
  // Monitoring: Everything else
  return 'Monitoring';
};
```

---

## 🔄 **Interview Flow on Saturday**

### **Example Saturday Interview:**

```
[Core questions 1-6 completed in ~90 seconds]

Q7: "How would you rate your libido this week?"
A: "Pretty good, maybe a 4"
   → Extracted: desireLevel = 4

Q8: "How satisfied are you with your sexual health this week?"
A: "Satisfied, also a 4"
   → Extracted: satisfactionLevel = 4

Q9: "Is stress impacting your intimacy or sexual health?"
A: "Not really, minimal impact, like a 2"
   → Extracted: stressImpact = 2
   → Auto-determined: status = 'Aligned'

Q10: "Anything else you want to share about your health today?"
A: "Nope, all good!"
   → Extracted: notes = "All good"

✅ Interview complete: 10 questions, 3:15 elapsed
   → Saved to daily_logs + sexual_health_check_ins
```

---

## 💾 **Data Storage**

### **After Interview Completion:**

```typescript
const saveSexualHealthCheckIn = async (
  userId: string,
  desireLevel: number,
  satisfactionLevel: number,
  stressImpact: number,
  notes?: string
) => {
  const status = determineStatus(desireLevel, satisfactionLevel, stressImpact);
  
  await supabase.from('sexual_health_check_ins').insert({
    user_id: userId,
    taken_at: new Date().toISOString(),
    desire_level: desireLevel,
    satisfaction_level: satisfactionLevel,
    stress_impact: stressImpact,
    status: status,
    notes: notes || null,
  });
};
```

### **Integrated with Existing Interview Save:**

```typescript
// In interviewContextService.ts - saveInterviewToDatabase()

// ... existing daily_logs save ...

// Check if Saturday (day 6) and sexual health data collected
const isSaturday = new Date().getDay() === 6;
const hasSexualHealthData = extracted.desireLevel && extracted.satisfactionLevel && extracted.stressImpact;

if (isSaturday && hasSexualHealthData) {
  await saveSexualHealthCheckIn(
    userId,
    extracted.desireLevel,
    extracted.satisfactionLevel,
    extracted.stressImpact,
    extracted.sexualHealthNotes
  );
}
```

---

## 📋 **Updated Question Bank**

### **Add to STATIC_QUESTION_BANK:**

```typescript
{
  id: 'sexual_health_desire',
  text: 'How would you rate your libido this week?',
  priority: 6,
  category: 'sexual_health',
  triggerCondition: 'day_of_week === 6', // Saturday only
  quickResponses: ['Very low (1)', 'Lower than usual (2)', 'Normal (3)', 'Higher than usual (4)', 'Very high (5)'],
  expectsFreeText: true,
},
{
  id: 'sexual_health_satisfaction',
  text: 'How satisfied are you with your sexual health this week?',
  priority: 6,
  category: 'sexual_health',
  triggerCondition: 'day_of_week === 6 && prior_response:sexual_health_desire', // After desire question
  quickResponses: ['Very dissatisfied (1)', 'Somewhat dissatisfied (2)', 'Neutral (3)', 'Satisfied (4)', 'Very satisfied (5)'],
  expectsFreeText: true,
},
{
  id: 'sexual_health_stress_impact',
  text: 'Is stress impacting your intimacy or sexual health?',
  priority: 6,
  category: 'sexual_health',
  triggerCondition: 'day_of_week === 6 && prior_response:sexual_health_satisfaction', // After satisfaction
  quickResponses: ['No impact (1)', 'Minimal impact (2)', 'Moderate impact (3)', 'Significant impact (4)', 'Severe impact (5)'],
  expectsFreeText: true,
},
```

---

## 🧠 **Routing Logic**

### **When to Ask Sexual Health Questions:**

```typescript
const shouldAskSexualHealthQuestions = (context: InterviewContext, conversationHistory: ConversationTurn[]): boolean => {
  // Only on Saturdays
  const today = new Date();
  if (today.getDay() !== 6) return false;
  
  // Only if not already asked this session
  const alreadyAsked = conversationHistory.some(turn => 
    turn.question.includes('libido') || 
    turn.question.includes('sexual health')
  );
  
  return !alreadyAsked;
};
```

### **Question Sequence:**

```typescript
// After core daily questions (sleep, stress, recovery, workout, energy)
// Check if Saturday
if (shouldAskSexualHealthQuestions(context, history)) {
  // Ask in sequence:
  // 1. Desire/libido
  // 2. Satisfaction (only after desire answered)
  // 3. Stress impact (only after satisfaction answered)
}
```

---

## 📊 **Answer Extraction Logic**

### **Parse Sexual Health Answers:**

```typescript
const extractSexualHealthMetrics = (conversationHistory: ConversationTurn[]) => {
  const metrics = {
    desireLevel: null,
    satisfactionLevel: null,
    stressImpact: null,
    sexualHealthNotes: null,
  };
  
  conversationHistory.forEach(turn => {
    const answer = turn.answer.toLowerCase();
    
    // Desire level
    if (turn.question.includes('libido')) {
      const numMatch = answer.match(/\b([1-5])\b/);
      if (numMatch) {
        metrics.desireLevel = parseInt(numMatch[1]);
      } else {
        // Keyword fallback
        if (answer.includes('very low')) metrics.desireLevel = 1;
        else if (answer.includes('low')) metrics.desireLevel = 2;
        else if (answer.includes('normal')) metrics.desireLevel = 3;
        else if (answer.includes('high') && !answer.includes('very')) metrics.desireLevel = 4;
        else if (answer.includes('very high')) metrics.desireLevel = 5;
      }
    }
    
    // Satisfaction level
    if (turn.question.includes('satisfied')) {
      const numMatch = answer.match(/\b([1-5])\b/);
      if (numMatch) {
        metrics.satisfactionLevel = parseInt(numMatch[1]);
      } else {
        if (answer.includes('very dissatisfied')) metrics.satisfactionLevel = 1;
        else if (answer.includes('dissatisfied')) metrics.satisfactionLevel = 2;
        else if (answer.includes('neutral')) metrics.satisfactionLevel = 3;
        else if (answer.includes('satisfied') && !answer.includes('very')) metrics.satisfactionLevel = 4;
        else if (answer.includes('very satisfied')) metrics.satisfactionLevel = 5;
      }
    }
    
    // Stress impact
    if (turn.question.includes('stress impacting')) {
      const numMatch = answer.match(/\b([1-5])\b/);
      if (numMatch) {
        metrics.stressImpact = parseInt(numMatch[1]);
      } else {
        if (answer.includes('no impact')) metrics.stressImpact = 1;
        else if (answer.includes('minimal')) metrics.stressImpact = 2;
        else if (answer.includes('moderate')) metrics.stressImpact = 3;
        else if (answer.includes('significant')) metrics.stressImpact = 4;
        else if (answer.includes('severe')) metrics.stressImpact = 5;
      }
      
      // Capture any additional notes
      if (answer.length > 20) {
        metrics.sexualHealthNotes = turn.answer;
      }
    }
  });
  
  return metrics;
};
```

---

## 🎯 **Impact on Interview Duration**

### **Monday-Friday:**
- Duration: 2-3 minutes (unchanged)
- Questions: 6-8 (unchanged)

### **Saturday:**
- Duration: 3-4 minutes (+1 minute)
- Questions: 9-11 (+3 questions)

**Still well within 5-minute target!**

---

## 📈 **Impact on Health Score**

### **Before Integration:**
- Sexual Health component: Often "No Data" or based only on reminders
- Score: Incomplete or placeholder

### **After Integration:**
- Sexual Health component: Real data every week
- Score: Accurate 15% contribution to overall health
- Trends: Trackable week-over-week
- Insights: "Stress impacting sexual health", "Desire trending low", etc.

---

## 🔧 **Implementation Checklist**

### **Backend:**
- [ ] Add 3 sexual health questions to static question bank
- [ ] Add day-of-week check to routing logic
- [ ] Implement answer parsing for desire/satisfaction/stress
- [ ] Add `saveSexualHealthCheckIn()` function
- [ ] Update `saveInterviewToDatabase()` to call sexual health save on Saturdays
- [ ] Test extraction logic with sample answers

### **Frontend:**
- [ ] No changes needed (questions appear automatically on Saturdays)
- [ ] Verify quick response buttons display correctly
- [ ] Test Saturday interview flow

### **Testing:**
- [ ] Test on Saturday (day 6)
- [ ] Test on other days (should not appear)
- [ ] Test answer parsing (numbers, keywords, free text)
- [ ] Test database insertion
- [ ] Verify sexual health score updates in dashboard

---

## 📊 **Example Test Cases**

### **Test 1: Numeric Answers**
```
Q: "How would you rate your libido this week?"
A: "4"
Expected: desireLevel = 4

Q: "How satisfied are you with your sexual health this week?"
A: "4"
Expected: satisfactionLevel = 4

Q: "Is stress impacting your intimacy or sexual health?"
A: "2"
Expected: stressImpact = 2, status = 'Aligned'
```

### **Test 2: Keyword Answers**
```
Q: "How would you rate your libido this week?"
A: "Pretty high this week"
Expected: desireLevel = 4

Q: "How satisfied are you with your sexual health this week?"
A: "Very satisfied"
Expected: satisfactionLevel = 5

Q: "Is stress impacting your intimacy or sexual health?"
A: "No impact at all"
Expected: stressImpact = 1, status = 'Aligned'
```

### **Test 3: Mixed Answers**
```
Q: "How would you rate your libido this week?"
A: "Low, maybe a 2"
Expected: desireLevel = 2

Q: "How satisfied are you with your sexual health this week?"
A: "Not great, dissatisfied, 2"
Expected: satisfactionLevel = 2

Q: "Is stress impacting your intimacy or sexual health?"
A: "Yeah, stress is high, significant impact, like a 4"
Expected: stressImpact = 4, status = 'Concerned'
```

---

## 🎯 **Success Criteria**

- [ ] Sexual health questions appear only on Saturdays
- [ ] All 3 questions asked in sequence
- [ ] Answers parsed correctly (>95% accuracy)
- [ ] Data saved to `sexual_health_check_ins` table
- [ ] Sexual health score updates in dashboard
- [ ] Interview duration stays under 5 minutes
- [ ] User feedback positive (natural, not awkward)

---

## 📝 **Summary**

**Adding sexual health to interview:**
- **When:** Every Saturday only
- **Questions:** 3 (desire, satisfaction, stress impact)
- **Duration:** +1 minute on Saturdays
- **Storage:** `sexual_health_check_ins` table
- **Impact:** Sexual health component (15% of overall score) gets real weekly data

**Simple, focused integration that completes the health data collection without overwhelming the daily interview.**
