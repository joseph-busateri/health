# Data Source Prioritization Framework

## Overview

With **10 data sources** now integrated into the recommendation engine, we need a clear framework for prioritizing which data should have higher weight and focus when generating recommendations.

---

## All Data Sources Used (10)

1. **Bloodwork** (quarterly)
2. **Body Composition** (monthly)
3. **Device Data** (continuous - Apple Watch, Oura, Sleep Number)
4. **Active Goals** (ongoing)
5. **Adherence Scores** (daily)
6. **Baseline Profile** (one-time)
7. **Supplement Stack** (one-time baseline) ✨ NEW
8. **Workout Program** (one-time baseline) ✨ NEW
9. **Daily Logs** (manual entry) ✨ NEW
10. **Historical Recommendations** (learning from past) ✨ NEW

---

## Prioritization Tiers

### **Tier 1: Critical Health Indicators** (Highest Priority)
**Weight: 40%**

#### 1. Bloodwork (Quarterly)
**Priority Score: 10/10**

**Why Highest Priority:**
- Direct measurement of internal health
- Identifies disease risk (cardiovascular, metabolic, hormonal)
- Abnormal markers require immediate attention
- Trends indicate worsening or improving conditions
- Medical-grade data with clinical significance

**When to Prioritize:**
- Abnormal markers detected (LDL > 130, Triglycerides > 150, Glucose > 100)
- Worsening trends (>10% increase in negative markers)
- Multiple related markers abnormal (e.g., lipid panel all elevated)

**Example:**
```
Triglycerides: 479 mg/dL (HIGH)
LDL: 146 mg/dL (HIGH)
→ CRITICAL: Generate cardiovascular recommendation immediately
```

---

#### 2. Device Data - Sleep & HRV (Continuous)
**Priority Score: 9/10**

**Why High Priority:**
- Sleep affects ALL other health domains
- HRV indicates recovery and stress levels
- Daily data provides strong trend signals
- Impacts bloodwork, body composition, performance, mood

**When to Prioritize:**
- Chronic sleep deprivation (<7 hours for 7+ days)
- Low HRV (<50ms for athletes, <40ms for general population)
- Declining trends in sleep quality or HRV

**Example:**
```
Avg Sleep: 6.2 hours (7-day avg)
Avg HRV: 45 ms (declining)
→ HIGH: Sleep deprivation impacting recovery and metabolic health
```

---

### **Tier 2: Performance & Progress Indicators** (High Priority)
**Weight: 30%**

#### 3. Active Goals (Ongoing)
**Priority Score: 8/10**

**Why High Priority:**
- User's stated objectives
- Measurable progress tracking
- Behind-schedule goals need intervention
- Directly tied to user motivation

**When to Prioritize:**
- Goal >20% behind schedule
- Stalled progress (no change in 2+ weeks)
- Deadline approaching (<30 days remaining)

**Example:**
```
Goal: Lose 15 pounds
Progress: 21% (behind schedule)
Expected: 35% at this point
→ HIGH: Adjust strategy to get back on track
```

---

#### 4. Body Composition (Monthly)
**Priority Score: 7/10**

**Why High Priority:**
- Objective measurement of physical changes
- Correlates with goals (weight loss, muscle gain)
- Trends indicate effectiveness of current approach
- Visible results impact motivation

**When to Prioritize:**
- Losing muscle while losing weight (catabolic state)
- Body fat % increasing despite weight loss
- No change in 2+ months despite active goals

**Example:**
```
Weight: -5 lbs (good)
Muscle Mass: -3 lbs (bad)
Body Fat %: +1% (bad)
→ HIGH: Losing muscle, not fat - adjust nutrition/training
```

---

### **Tier 3: Consistency & Adherence Indicators** (Medium Priority)
**Weight: 20%**

#### 5. Adherence Scores (Daily)
**Priority Score: 7/10**

**Why Medium-High Priority:**
- Explains why goals may not be progressing
- Identifies which domain needs focus
- Low adherence confounds other data
- Actionable (user can improve immediately)

**When to Prioritize:**
- Overall adherence <60% (low)
- Specific domain <50% (critical)
- Declining trend over 2+ weeks

**Example:**
```
Overall: 72%
Nutrition: 68% (moderate)
Sleep: 65% (moderate)
→ MEDIUM: Improve nutrition consistency to support goals
```

---

#### 6. Daily Logs - Subjective Patterns (Manual Entry)
**Priority Score: 6/10**

**Why Medium Priority:**
- Subjective but valuable for pattern detection
- Energy, mood, stress correlate with other metrics
- 30-day averages reveal trends
- Complements objective data

**When to Prioritize:**
- Consistent low energy (<5/10 for 2+ weeks)
- High stress (>7/10 for 2+ weeks)
- Poor mood correlating with poor adherence
- Patterns not explained by objective data

**Example:**
```
Avg Energy: 4.2/10 (30-day avg)
Avg Stress: 7.8/10 (30-day avg)
Avg Sleep: 6.2 hours
→ MEDIUM: High stress and poor sleep impacting energy
```

---

### **Tier 4: Context & Optimization Indicators** (Lower Priority)
**Weight: 10%**

#### 7. Supplement Stack (One-Time Baseline)
**Priority Score: 5/10**

**Why Lower Priority:**
- Provides context, not actionable data
- Prevents redundant recommendations
- Identifies potential interactions
- Useful for optimization, not critical issues

**When to Prioritize:**
- Bloodwork issues that supplements could address
- Avoiding duplicate supplement suggestions
- Identifying supplement-drug interactions
- Optimizing stack based on bloodwork results

**Example:**
```
Taking: Berberine 2000mg 3x/day
Bloodwork: Glucose 97 mg/dL (normal)
→ LOW: Berberine working, no change needed
```

---

#### 8. Workout Program (One-Time Baseline)
**Priority Score: 5/10**

**Why Lower Priority:**
- Provides context for recovery needs
- Explains device data patterns (HRV, sleep)
- Useful for program modifications
- Not a direct health indicator

**When to Prioritize:**
- Recovery data suggests overtraining
- Goal progress stalled despite adherence
- Program doesn't align with goals
- Injury risk indicators present

**Example:**
```
Program: PPL 6 days/week
Avg HRV: 45 ms (low)
Avg Sleep: 6.2 hours
→ MEDIUM: Volume may be too high for current recovery capacity
```

---

#### 9. Baseline Profile (One-Time)
**Priority Score: 4/10**

**Why Lower Priority:**
- Provides personalization context
- Age/gender inform normal ranges
- Health goals guide recommendation alignment
- Static data, not dynamic

**When to Use:**
- Personalizing recommendation language
- Age-appropriate guidance
- Aligning with stated health goals
- Avoiding inappropriate suggestions

**Example:**
```
Age: 45
Gender: Male
Goals: Cardiovascular health, muscle mass
→ Context: Prioritize heart health recommendations
```

---

#### 10. Historical Recommendations (Learning from Past)
**Priority Score: 6/10**

**Why Medium Priority:**
- Learns user preferences
- Avoids dismissed categories
- Focuses on accepted categories
- Improves recommendation relevance over time

**When to Prioritize:**
- User has >20 historical recommendations
- Clear acceptance/dismissal patterns
- Avoiding recommendation fatigue
- Personalizing recommendation style

**Example:**
```
Acceptance Rate: 65%
Most Accepted: cardiovascular, recovery
Most Dismissed: supplement_review, workout_review
→ Focus on cardiovascular and recovery recommendations
```

---

## Prioritization Algorithm

### Step 1: Identify Critical Issues (Tier 1)
**If ANY of these exist, generate recommendation immediately:**
- Abnormal bloodwork markers
- Chronic sleep deprivation (<7 hours for 7+ days)
- Very low HRV (declining trend)

### Step 2: Assess Performance Issues (Tier 2)
**If no critical issues, check for:**
- Goals >20% behind schedule
- Body composition trends misaligned with goals
- No progress in 2+ months

### Step 3: Evaluate Consistency (Tier 3)
**If no performance issues, check for:**
- Low adherence (<60% overall)
- Declining adherence trends
- Subjective pattern concerns (energy, stress, mood)

### Step 4: Optimize & Personalize (Tier 4)
**Use context data to:**
- Avoid redundant supplement suggestions
- Align with workout program
- Personalize based on age/gender/goals
- Learn from historical acceptance patterns

---

## Weighting Formula

```
Recommendation Priority Score = 
  (Bloodwork Severity × 0.25) +
  (Device Data Severity × 0.15) +
  (Goal Progress × 0.15) +
  (Body Comp Trend × 0.15) +
  (Adherence Score × 0.10) +
  (Daily Log Patterns × 0.10) +
  (Historical Learning × 0.10)

Where severity/score ranges from 0-100
```

---

## Example Prioritization Scenarios

### Scenario 1: Critical Bloodwork
```
Bloodwork: Triglycerides 479 (CRITICAL)
Device Data: Sleep 6.2 hours (moderate concern)
Goals: Weight loss 21% (behind)
Adherence: 72% (moderate)

Priority Score = (100 × 0.25) + (60 × 0.15) + (40 × 0.15) + (50 × 0.15) + (72 × 0.10) + (50 × 0.10) + (50 × 0.10)
= 25 + 9 + 6 + 7.5 + 7.2 + 5 + 5
= 64.7/100

→ Generate CRITICAL cardiovascular recommendation
→ Mention sleep as contributing factor
→ Note goal progress may improve with intervention
```

### Scenario 2: Performance Issue
```
Bloodwork: All normal
Device Data: Sleep 7.5 hours, HRV 65 (good)
Goals: Muscle gain 5% (behind schedule)
Body Comp: Muscle mass +0.5 lb in 2 months (slow)
Adherence: 85% (good)

Priority Score = (0 × 0.25) + (20 × 0.15) + (60 × 0.15) + (70 × 0.15) + (85 × 0.10) + (70 × 0.10) + (50 × 0.10)
= 0 + 3 + 9 + 10.5 + 8.5 + 7 + 5
= 43/100

→ Generate HIGH performance recommendation
→ Focus on nutrition/training optimization
→ Leverage good adherence and recovery
```

### Scenario 3: Consistency Issue
```
Bloodwork: All normal
Device Data: Sleep 7 hours, HRV 55 (moderate)
Goals: On track
Body Comp: Progressing well
Adherence: 58% (low)
Daily Logs: Energy 4.5/10, Stress 7.5/10

Priority Score = (0 × 0.25) + (40 × 0.15) + (20 × 0.15) + (20 × 0.15) + (58 × 0.10) + (80 × 0.10) + (50 × 0.10)
= 0 + 6 + 3 + 3 + 5.8 + 8 + 5
= 30.8/100

→ Generate MEDIUM adherence recommendation
→ Focus on improving consistency
→ Address stress and energy patterns
```

---

## AI Prompt Guidance

When generating recommendations, the AI should:

1. **Prioritize by tier** - Address Tier 1 issues first
2. **Cross-reference data** - Look for correlations (e.g., sleep affecting bloodwork)
3. **Learn from history** - Avoid dismissed categories, focus on accepted ones
4. **Use context wisely** - Supplements/workout for context, not primary focus
5. **Be specific** - Use actual data values in recommendations
6. **Explain connections** - Show how data sources relate

---

## Summary

### **Highest Priority (40% weight):**
1. Bloodwork abnormalities
2. Sleep & HRV issues

### **High Priority (30% weight):**
3. Goal progress problems
4. Body composition trends

### **Medium Priority (20% weight):**
5. Adherence consistency
6. Daily log patterns

### **Context Priority (10% weight):**
7. Supplement stack (avoid redundancy)
8. Workout program (recovery context)
9. Baseline profile (personalization)
10. Historical recommendations (learning)

---

**The framework ensures critical health issues are addressed first, while using context data to personalize and optimize recommendations without overwhelming the user.**
