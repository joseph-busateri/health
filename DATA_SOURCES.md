# Data Sources Inventory

## All Data Sources Stored in the System

---

### 1. **Bloodwork Data** (Quarterly)
**Frequency**: Every 3 months  
**Storage Tables**:
- `bloodwork_documents`
- `bloodwork_results`
- `bloodwork_panels`
- `bloodwork_trends`

**Data Collected**:
- Lab test results (markers, values, units, reference ranges)
- Abnormal flags
- Test dates
- Panels (Lipid, Metabolic, Hormonal, etc.)
- Historical trends

**Sources**:
- Quest Diagnostics
- LabCorp
- HealthLab
- Generic lab reports

---

### 2. **Body Composition Data** (Monthly)
**Frequency**: Monthly  
**Storage Tables**:
- `body_composition_documents`
- `body_composition_scans`
- `body_composition_goals`
- `body_composition_trends`

**Data Collected**:
- Weight, body fat %, muscle mass
- BMI, BMR, visceral fat
- Bone mass, water content
- Segmental analysis

**Sources**:
- InBody (S2, 570, 770)
- Withings (Body+, Body Cardio)
- Renpho
- Fitbit Aria
- Eufy
- Generic smart scales

---

### 3. **Apple Watch Data** (Continuous)
**Frequency**: Daily sync, continuous data points  
**Storage Tables**:
- `apple_watch_connections`
- `apple_watch_sync_history`
- `apple_watch_heart_rate`
- `apple_watch_hrv`
- `apple_watch_activity`
- `apple_watch_sleep`
- `apple_watch_workouts`
- `apple_watch_blood_oxygen`
- `apple_watch_temperature`
- `apple_watch_mindfulness`

**Data Collected**:
- Heart rate (resting, average, max)
- HRV (heart rate variability)
- Activity (steps, active minutes, calories)
- Activity rings (move, exercise, stand)
- Sleep (duration, stages, quality)
- Workouts (type, duration, HR zones)
- Blood oxygen (SpO2)
- Wrist temperature
- Mindfulness minutes

**Source**: Apple HealthKit via iOS app

---

### 4. **Oura Ring Data** (Continuous)
**Frequency**: Daily sync  
**Storage Tables**:
- `oura_connections`
- `oura_sync_history`
- `oura_sleep_sessions`
- `oura_readiness`
- `oura_activity`
- `oura_workouts`

**Data Collected**:
- Sleep (total time, stages, efficiency, HR, HRV, respiratory rate, temperature)
- Readiness score (0-100)
- Activity (steps, calories, met minutes)
- Workouts (type, duration, intensity)
- Recovery metrics

**Source**: Oura Cloud API (OAuth)

---

### 5. **Sleep Number Data** (Continuous)
**Frequency**: Daily sync  
**Storage Tables**:
- `sleep_number_connections`
- `sleep_number_sync_history`
- `sleep_number_sessions`

**Data Collected**:
- Sleep sessions (duration, stages)
- Heart rate (average, min, max)
- Respiratory rate
- HRV
- Room temperature
- Bed temperature
- Restlessness score
- Out of bed events

**Source**: Sleep Number API

---

### 6. **Baseline Profile Data** (One-Time)
**Frequency**: One-time during onboarding, updated as needed  
**Storage Tables**:
- `baseline_documents`
- `baseline_profiles`

**Data Collected**:
- Demographics (age, height, weight, gender, activity level)
- Health goals (primary, secondary, priority order)
- Sexual health goals
- Workout goals
- Training context (experience, preferences, limitations)
- Lifestyle context (work schedule, stress, sleep patterns)

**Source**: User input via questionnaire

---

### 7. **Supplement Data** (One-Time Baseline)
**Frequency**: One-time baseline, updated when stack changes  
**Storage Tables**:
- `supplement_documents`
- `supplement_baselines`
- `supplement_items`

**Data Collected**:
- Stack name and notes
- Individual supplements (name, dosage, frequency, timing, status)
- Purpose/goals for each supplement

**Sources**:
- Spreadsheet uploads
- Text document uploads
- Manual entry

---

### 8. **Workout Program Data** (One-Time Baseline)
**Frequency**: One-time baseline, updated when program changes  
**Storage Tables**:
- `workout_documents`
- `workout_programs`

**Data Collected**:
- Program name
- Split type (PPL, upper/lower, full body, etc.)
- Days per week
- Rest days
- Weekly schedule

**Sources**:
- Document uploads
- Manual entry

---

### 9. **Goals & Progress Data** (Ongoing)
**Frequency**: Created as needed, updated daily to weekly  
**Storage Tables**:
- `goal_templates`
- `goals`
- `goal_metrics`
- `goal_milestones`
- `goal_progress`
- `goal_achievements`

**Data Collected**:
- Goal details (name, category, type, dates, status)
- Metrics (starting value, current value, target value, progress %)
- Milestones (25%, 50%, 75%, 100%)
- Progress snapshots (on-track status, predicted completion)
- Achievements (badges, points, celebrations)

**Source**: User input and system calculations

---

### 10. **Adherence Data** (Daily)
**Frequency**: Calculated daily  
**Storage**: In-memory (not persisted to database yet)

**Data Collected**:
- Workout adherence score (0-100)
- Nutrition adherence score (0-100)
- Sleep adherence score (0-100)
- Supplement adherence score (0-100)
- Overall adherence score (weighted average)
- Status (low, moderate, high)
- Trend (improving, stable, declining)

**Source**: Daily logs + engine snapshots

---

### 11. **Daily Logs** (Manual Entry)
**Frequency**: Daily (optional)  
**Storage Tables**:
- `daily_logs`

**Data Collected**:
- Sleep hours
- Workout adherence and notes
- Nutrition adherence and notes
- Daily weight
- Energy level (subjective)
- Mood (subjective)
- Stress level (subjective)
- Free-form notes

**Source**: User manual entry

---

### 12. **Unified Recommendations** (Generated)
**Frequency**: Weekly or on-demand  
**Storage Tables**:
- `unified_recommendations`

**Data Collected**:
- Recommendation content (title, description, rationale, intended outcome, action items)
- Classification (source, category, priority, timeframe)
- Metadata (confidence, status, AI-generated flag, cost)
- User interaction (accepted date, dismissed date, notes)
- Source data references

**Source**: System-generated (rules + AI)

---

## Total Data Sources: **12**

---

# Data Sources Used by Recommendation Generation

The unified recommendation engine uses **6 primary data sources** to generate comprehensive, personalized recommendations:

---

## 1. **Bloodwork Data** ✅
**What's Used**:
- Latest bloodwork document (most recent test)
- Top 20 markers with values, units, and abnormal flags
- Test date

**How It's Used**:
- Identify abnormal markers (high LDL, triglycerides, glucose, etc.)
- Detect worsening trends (comparing to previous tests)
- Generate cardiovascular, metabolic, and hormonal recommendations
- Cross-reference with other data (e.g., sleep affecting glucose)

**Example**:
```
Triglycerides: 479 mg/dL (HIGH)
LDL: 146 mg/dL (HIGH)
HDL: 37 mg/dL (LOW)
→ Recommendation: "Elevated cardiovascular risk markers detected"
```

---

## 2. **Body Composition Data** ✅
**What's Used**:
- Latest scan (most recent measurement)
- Weight, body fat %, muscle mass
- Scan date

**How It's Used**:
- Track weight loss/gain progress
- Monitor body composition changes
- Correlate with goals (e.g., muscle gain goal vs actual muscle mass)
- Identify trends (losing muscle while losing weight)

**Example**:
```
Weight: 219.9 lb
Body Fat: 9.0%
Muscle Mass: 116.6 lb
→ Recommendation: "Maintain current body composition strategy"
```

---

## 3. **Device Data (Apple Watch, Oura, Sleep Number)** ✅
**What's Used**:
- **7-day averages** of:
  - Sleep hours per night
  - HRV (heart rate variability)
  - Resting heart rate
  - Activity minutes per day
  - Steps per day

**How It's Used**:
- Identify sleep deprivation (<7 hours)
- Detect low HRV (poor recovery)
- Monitor activity levels (sedentary vs active)
- Correlate with other markers (sleep affecting bloodwork, recovery affecting goals)
- Generate recovery and lifestyle recommendations

**Example**:
```
Avg Sleep: 6.2 hours (LOW)
Avg HRV: 45 ms (LOW)
Avg Activity: 35 min/day (LOW)
→ Recommendation: "Sleep deprivation impacting recovery and metabolic health"
```

---

## 4. **Active Goals** ✅
**What's Used**:
- All active goals
- Goal name, category
- Progress percentage
- On-track status

**How It's Used**:
- Identify goals behind schedule
- Detect stalled progress
- Generate goal-specific recommendations
- Correlate goal progress with adherence and device data

**Example**:
```
Goal: "Lose 15 pounds"
Progress: 21% (behind schedule)
On Track: No
→ Recommendation: "Increase calorie deficit to get back on track"
```

---

## 5. **Adherence Scores** ✅
**What's Used**:
- Overall adherence score (0-100)
- Domain scores:
  - Workout adherence
  - Nutrition adherence
  - Sleep adherence
  - Supplement adherence

**How It's Used**:
- Identify consistency issues
- Detect which domain is lacking
- Generate adherence-focused recommendations
- Explain why goals may not be progressing

**Example**:
```
Overall: 72
Workout: 85 (good)
Nutrition: 68 (moderate)
Sleep: 65 (moderate)
Supplement: 70 (moderate)
→ Recommendation: "Improve nutrition consistency to support goals"
```

---

## 6. **Baseline Profile** ✅
**What's Used**:
- Age
- Gender
- Health goals (array)
- Supplement stack (array)

**How It's Used**:
- Personalize recommendations based on age/gender
- Align recommendations with stated health goals
- Consider current supplement stack (avoid redundant suggestions)
- Provide age-appropriate guidance

**Example**:
```
Age: 45
Gender: Male
Goals: ["Optimize cardiovascular health", "Increase muscle mass"]
Supplements: ["Berberine 2000mg 3x/day", "Creatine 5g daily"]
→ Recommendation: "Given your age and cardiovascular goals, prioritize sleep and stress management"
```

---

## Data Sources NOT Used (Yet)

### ❌ **Workout Program Data**
- **Why**: Not yet integrated into recommendation engine
- **Future**: Could suggest program modifications based on progress/recovery

### ❌ **Daily Logs**
- **Why**: Used indirectly via adherence calculation, not directly in recommendations
- **Future**: Could analyze patterns in subjective ratings (energy, mood, stress)

### ❌ **Historical Recommendations**
- **Why**: Not yet using past recommendations to inform future ones
- **Future**: Could learn from accepted vs dismissed recommendations

---

## Summary

### **Data Sources Stored**: 12
1. Bloodwork
2. Body Composition
3. Apple Watch
4. Oura Ring
5. Sleep Number
6. Baseline Profile
7. Supplements
8. Workout Program
9. Goals & Progress
10. Adherence
11. Daily Logs
12. Unified Recommendations

### **Data Sources Used by Recommendations**: 6
1. ✅ Bloodwork (latest test, top 20 markers)
2. ✅ Body Composition (latest scan)
3. ✅ Device Data (7-day averages from Apple Watch, Oura, Sleep Number)
4. ✅ Active Goals (progress, on-track status)
5. ✅ Adherence Scores (domain breakdown)
6. ✅ Baseline Profile (demographics, goals, supplements)

---

## Recommendation Generation Flow

```
User Data Collection
    ↓
6 Data Sources Aggregated
    ├── Bloodwork (latest)
    ├── Body Composition (latest)
    ├── Device Data (7-day avg)
    ├── Goals (active)
    ├── Adherence (current)
    └── Baseline (profile)
    ↓
Context Builder
    ↓
Hybrid Generation
    ├── Rule-Based (bloodwork trends, goal progress, adherence patterns)
    └── AI-Enhanced (cross-domain analysis, personalized insights)
    ↓
Unified Recommendations
    ├── Title, Description, Rationale
    ├── Intended Outcome, Action Items
    ├── Priority, Timeframe, Category
    └── Accept/Dismiss Tracking
```

---

## Key Insight

The recommendation engine uses **50% of stored data sources** (6 out of 12), focusing on:
- **Ongoing/continuous data** (bloodwork, body comp, devices, goals, adherence)
- **Contextual data** (baseline profile)

**Not yet used**:
- One-time baseline data (supplements, workout program)
- Manual logs (daily entries)
- Historical recommendations

This provides a strong foundation while leaving room for future enhancement by incorporating the remaining data sources.
