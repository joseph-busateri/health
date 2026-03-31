# Overall Health Section - Complete Architecture

## 🎯 **What is the Overall Health Section?**

The **Overall Health Section** is the **Control Tower Dashboard** - a comprehensive health scoring system that aggregates data from multiple sources to provide a single, holistic view of your health across 5 key domains.

**Think of it as:** Your health "credit score" - one number that tells the whole story, backed by detailed component breakdowns.

---

## 📊 **The 5 Health Components**

### **1. Recovery (REC) - Weight: 25%**
**What it measures:** Sleep quality, stress levels, and subjective recovery feeling

**Data sources:**
- Sleep hours (from daily logs)
- Sleep quality rating (1-5 scale)
- Stress level (1-5 scale)
- Recovery feeling (1-5 scale)
- Baseline sleep target (from user config)

**Scoring formula:**
```typescript
recoveryScore = (sleepNorm × sleepWeight) + 
                (recoveryNorm × recoveryWeight) + 
                (stressNorm × stressWeight)

Where:
- sleepNorm = actual sleep / target sleep (clamped 0-1)
- recoveryNorm = (feeling - 1) / 4 (clamped 0-1)
- stressNorm = 1 - (stress - tolerance) / maxDelta (clamped 0-1)
- Weights adjust based on user's recovery sensitivity
```

**Insights generated:**
- "Sleep below baseline target" (if < target)
- "Elevated stress reported" (if stress ≥ 4)
- "Recovery feeling is low" (if feeling ≤ 2)

---

### **2. Performance (PERF) - Weight: 20%**
**What it measures:** Workout adherence, intensity, and fatigue levels

**Data sources:**
- Workout adherence percentage (0-100%)
- Recovery feeling (impacts intensity calculation)
- Stress level (impacts fatigue calculation)

**Scoring formula:**
```typescript
adherence = workout adherence (0-100)
intensity = adherence × 0.7 + (recoveryFeeling - 1) × 6.25
fatigue = (1 - (stressPenalty × 0.6 + recoveryPenalty × 0.4)) × 100

performanceScore = adherence × 0.6 + intensity × 0.2 + fatigue × 0.2
```

**Insights generated:**
- "Workout adherence is below target" (if < 70%)
- "Fatigue indicators elevated" (if fatigue < 60)

---

### **3. Metabolic (MET) - Weight: 20%**
**What it measures:** Nutrition consistency and meal logging frequency

**Data sources:**
- Meal logs (last 7 days)
- Meal frequency target (7 meals/week)
- Fasting window (placeholder: 70)
- Blood sugar stability (placeholder: 70)

**Scoring formula:**
```typescript
frequencyScore = (recentMealCount / 7) × 100
compositeScore = frequencyScore × 0.7 + 
                 fastingPlaceholder × 0.15 + 
                 stabilityPlaceholder × 0.15
```

**Insights generated:**
- "Increase meal logging consistency" (if frequency < 50%)

**Note:** Currently uses meal logging as a proxy for nutrition adherence. Fasting and stability are placeholders for future CGM integration.

---

### **4. Cardiovascular (CV) - Weight: 20%**
**What it measures:** Blood pressure and resting heart rate

**Data sources:**
- Systolic blood pressure (mmHg)
- Diastolic blood pressure (mmHg)
- Resting heart rate (bpm)
- Stress levels from daily logs
- Quarterly bloodwork reminders

**Scoring formula:**
```typescript
systolicScore = (140 - systolic) / 30 (clamped 0-1)
diastolicScore = (90 - diastolic) / 20 (clamped 0-1)
bpScore = systolicScore × 0.7 + diastolicScore × 0.3

hrScore = (80 - restingHR) / 25 (clamped 0-1)

cvScore = bpScore × 0.6 + hrScore × 0.4
```

**Insights generated:**
- "Blood pressure elevated vs. optimal range" (if systolic ≥ 130 or diastolic ≥ 85)
- "Blood pressure trending within optimal range" (if systolic ≤ 115 and diastolic ≤ 75)
- "Resting heart rate elevated—monitor recovery" (if HR ≥ 75)
- "Resting heart rate indicates strong conditioning" (if HR ≤ 62)
- "High stress levels may be impacting cardiovascular readiness" (if avg stress ≥ 4)

**Recommendations:**
- Score < 60: "Schedule consistent cardio sessions and consider breathwork"
- Score 60-80: "Maintain steady cardio cadence and monitor vitals twice this week"
- Score ≥ 80: "Cardio vitals look strong—keep your conditioning rhythm"

---

### **5. Sexual Health (SH) - Weight: 15%**
**What it measures:** Libido, satisfaction, and stress impact on intimacy

**Data sources:**
- Weekly sexual health check-ins
- Desire level (1-5 scale)
- Satisfaction level (1-5 scale)
- Stress impact (1-5 scale)
- Sexual health reminders (weekly)
- Sexual health status (Aligned/Concerned)

**Scoring formula:**
```typescript
desire = (desireLevel - 1) / 4 (clamped 0-1)
satisfaction = (satisfactionLevel - 1) / 4 (clamped 0-1)
stress = (5 - stressImpact) / 4 (clamped 0-1)

checkInScore = desire × 0.4 + satisfaction × 0.4 + stress × 0.2

reminderScore = (total - overdue) / total

blendedScore = checkInScore × 0.7 + reminderScore × 0.3
```

**Insights generated:**
- "X sexual health reminder(s) are overdue"
- "Recent check-in flagged sexual health concerns" (if status = Concerned)
- "Sexual health status aligned with goals" (if status = Aligned)
- "Stress heavily impacting sexual health" (if stress impact ≥ 4)
- "Desire score trending low" (if desire ≤ 2)

**Recommendations:**
- Score < 60: "Plan a low-pressure connection ritual and align on stress reduction"
- Score 60-80: "Maintain weekly check-ins and discuss lingering stressors"
- Score ≥ 80: "Sexual health cadence looks strong—keep intentional connection"

---

## 🎯 **Overall Health Score Calculation**

### **Weighted Average Formula:**
```typescript
overallScore = (rec × 0.25) + 
               (perf × 0.20) + 
               (met × 0.20) + 
               (cv × 0.20) + 
               (sh × 0.15)
```

### **Component Weights:**
- **Recovery:** 25% (highest priority - foundation of all health)
- **Performance:** 20% (workout adherence and capacity)
- **Metabolic:** 20% (nutrition and metabolic health)
- **Cardiovascular:** 20% (heart health and vitals)
- **Sexual Health:** 15% (hormonal and relationship health)

### **Overall Status Thresholds:**
- **Optimal:** ≥ 80 points
- **Stable:** 60-79 points
- **At Risk:** < 60 points
- **No Data:** No logs available

---

## 📈 **Trend Analysis**

### **Component Trends:**
Each component tracks trend over last 5 data points:

```typescript
trend = current - average(previous 4)

If delta ≥ 5: "Improving"
If delta ≤ -5: "Declining"
Otherwise: "Stable"
```

### **Overall Trend:**
Weighted average of component trends:

```typescript
trendScore = Σ(componentTrend × componentWeight)

If trendScore ≥ 0.15: "Improving"
If trendScore ≤ -0.15: "Declining"
Otherwise: "Stable"
```

---

## 📥 **Data Sources (Inputs)**

### **1. Daily Logs** (`daily_logs` table)
**Frequency:** Daily  
**Fields:**
- `sleep_hours` (number)
- `sleep_quality` (1-5)
- `stress_level` (1-5)
- `recovery_feeling` (1-5)
- `workout_adherence` (0-100%)
- `notes` (text)

**Used by:** Recovery, Performance

---

### **2. Meal Logs** (`meal_logs` table)
**Frequency:** Per meal  
**Fields:**
- `meal_type` (breakfast, lunch, dinner, snack)
- `taken_at` (timestamp)
- `protein_grams` (number)
- `carbs_grams` (number)
- `fats_grams` (number)
- `notes` (text)

**Used by:** Metabolic

---

### **3. Cardio Metrics** (`cardio_metrics` table)
**Frequency:** As measured (typically weekly)  
**Fields:**
- `systolic` (mmHg)
- `diastolic` (mmHg)
- `resting_heart_rate` (bpm)
- `measured_at` (timestamp)

**Used by:** Cardiovascular

---

### **4. Sexual Health Check-Ins** (`sexual_health_check_ins` table)
**Frequency:** Weekly  
**Fields:**
- `desire_level` (1-5)
- `satisfaction_level` (1-5)
- `stress_impact` (1-5)
- `notes` (text)
- `check_in_date` (date)

**Used by:** Sexual Health

---

### **5. Sexual Health Status** (`sexual_health_status` table)
**Frequency:** As updated  
**Fields:**
- `status` (Aligned, Concerned)
- `notes` (text)
- `updated_at` (timestamp)

**Used by:** Sexual Health

---

### **6. Reminders** (`reminders` table)
**Frequency:** Ongoing  
**Fields:**
- `reminder_type` (weekly_sexual_health, quarterly_bloodwork, etc.)
- `due_date` (date)
- `status` (pending, completed, overdue)

**Used by:** Cardiovascular, Sexual Health

---

### **7. Baseline Config** (`baseline_config` table)
**Frequency:** Set once, updated rarely  
**Fields:**
- `default_sleep_target` (hours)
- `recovery_sensitivity` (0-1)
- `stress_tolerance` (1-5)
- `workout_frequency_target` (days/week)

**Used by:** Recovery, Performance

---

## 📤 **Outputs**

### **1. Dashboard Summary** (`DashboardSummary`)
**API Endpoint:** `GET /dashboard/summary/:user_id`

**Response Structure:**
```typescript
{
  latestLog: DailyLogRecord | null,
  recoveryScore: 'low' | 'moderate' | 'high' | null,
  overallHealthScore: number | null,
  status: 'Optimal' | 'Stable' | 'At Risk' | 'No Data',
  dailyRecommendation: string,
  trendSummary: string,
  baselineConfig: BaselineConfig,
  controlTower: ControlTowerSummary
}
```

**Example:**
```json
{
  "latestLog": { "id": "...", "sleepHours": 7.5, ... },
  "recoveryScore": "high",
  "overallHealthScore": 78,
  "status": "Stable",
  "dailyRecommendation": "Momentum is solid across domains. Sustain current routines.",
  "trendSummary": "Sleep stable, Stress steady, Recovery strong",
  "baselineConfig": { ... },
  "controlTower": { ... }
}
```

---

### **2. Control Tower Summary** (`ControlTowerSummary`)
**Nested within Dashboard Summary**

**Structure:**
```typescript
{
  overallScore: number | null,
  overallStatus: 'Optimal' | 'Stable' | 'At Risk' | 'No Data',
  overallTrend: 'Improving' | 'Stable' | 'Declining',
  components: {
    rec: HealthComponentScore,
    perf: HealthComponentScore,
    met: HealthComponentScore,
    cv: HealthComponentScore,
    sh: HealthComponentScore
  },
  recommendationSummary: string
}
```

**Example:**
```json
{
  "overallScore": 78,
  "overallStatus": "Stable",
  "overallTrend": "Improving",
  "components": {
    "rec": {
      "key": "rec",
      "label": "Recovery",
      "score": 82,
      "status": "Optimal",
      "trend": "Improving",
      "insights": []
    },
    "perf": {
      "key": "perf",
      "label": "Performance",
      "score": 75,
      "status": "Stable",
      "trend": "Stable",
      "insights": ["Workout adherence is below target"]
    },
    ...
  },
  "recommendationSummary": "Focus today: Performance. Address highlighted insights to rebalance."
}
```

---

### **3. Health Component Score** (`HealthComponentScore`)
**Structure for each component:**

```typescript
{
  key: 'rec' | 'perf' | 'met' | 'cv' | 'sh',
  label: string,
  score: number | null,
  status: 'Optimal' | 'Stable' | 'At Risk',
  trend: 'Improving' | 'Stable' | 'Declining',
  insights?: string[],
  recommendation?: string
}
```

---

## 🔄 **Data Flow**

```
User Inputs
    ↓
┌─────────────────────────────────────────────────┐
│ Daily Logs, Meal Logs, Cardio Metrics, etc.    │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ Supabase Database Tables                        │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ getDashboardSummary(userId)                     │
│ - Fetches all data sources in parallel          │
│ - Last 7 daily logs                              │
│ - All meal logs                                  │
│ - Last 10 cardio metrics                         │
│ - Last 6 sexual health check-ins                 │
│ - Reminders                                      │
│ - Baseline config                                │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ buildControlTowerSummary()                      │
│ - Computes 5 component scores                    │
│ - Evaluates trends (last 5 data points)          │
│ - Generates insights per component               │
│ - Calculates weighted overall score              │
│ - Determines overall status & trend              │
│ - Builds recommendation summary                  │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ DashboardSummary Output                         │
│ - Overall health score (0-100)                   │
│ - Status (Optimal/Stable/At Risk)                │
│ - Trend (Improving/Stable/Declining)             │
│ - 5 component breakdowns                         │
│ - Actionable insights                            │
│ - Daily recommendation                           │
└─────────────────────────────────────────────────┘
    ↓
Frontend Display
```

---

## 🎨 **Visual Representation**

### **Dashboard Layout:**

```
┌─────────────────────────────────────────────────┐
│  OVERALL HEALTH SCORE: 78                       │
│  Status: Stable  |  Trend: ↗ Improving          │
│                                                  │
│  "Momentum is solid across domains. Sustain     │
│   current routines and monitor for subtle       │
│   trends."                                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  RECOVERY (25%)                    82  Optimal   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Trend: ↗ Improving                              │
│  • No insights                                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  PERFORMANCE (20%)                 75  Stable    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│  Trend: → Stable                                 │
│  • Workout adherence is below target             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  METABOLIC (20%)                   70  Stable    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│  Trend: → Stable                                 │
│  • Increase meal logging consistency             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  CARDIOVASCULAR (20%)              85  Optimal   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Trend: ↗ Improving                              │
│  • Blood pressure trending within optimal range  │
│  • Resting heart rate indicates strong           │
│    conditioning                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  SEXUAL HEALTH (15%)               72  Stable    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│  Trend: → Stable                                 │
│  • Sexual health status aligned with goals       │
└─────────────────────────────────────────────────┘
```

---

## 🧠 **Data Interpretation Logic**

### **Scoring Philosophy:**

1. **Normalization:** All inputs normalized to 0-1 scale
2. **Weighted Combination:** Components weighted by importance
3. **Threshold-Based Status:** Clear thresholds for Optimal/Stable/At Risk
4. **Trend Detection:** Compares current vs. historical average
5. **Insight Generation:** Rule-based flags for specific conditions

### **Key Thresholds:**

**Recovery:**
- Low: Sleep < 6h OR recovery feeling ≤ 2 OR stress ≥ 4
- Moderate: Borderline on 1+ metrics
- High: All metrics in healthy range

**Performance:**
- At Risk: Score < 60
- Stable: Score 60-79
- Optimal: Score ≥ 80

**Cardiovascular:**
- Optimal BP: Systolic ≤ 115, Diastolic ≤ 75
- Elevated BP: Systolic ≥ 130, Diastolic ≥ 85
- Optimal HR: ≤ 62 bpm
- Elevated HR: ≥ 75 bpm

**Sexual Health:**
- Low desire: ≤ 2/5
- High stress impact: ≥ 4/5
- Concerned status: Flagged in latest check-in

---

## 🎯 **Recommendation Generation**

### **Overall Recommendation Logic:**

```typescript
if (atRiskComponents.length > 0) {
  focus = atRiskComponents
} else if (decliningComponents.length > 0) {
  focus = decliningComponents
} else {
  return "Momentum is solid across domains. Sustain current routines."
}

return `Focus today: ${focus.join(', ')}. Address highlighted insights to rebalance.`
```

### **Component-Specific Recommendations:**

Each component has its own recommendation logic based on:
- Current score
- Trend direction
- Specific insights flagged
- Historical patterns

---

## 📊 **Example Scenarios**

### **Scenario 1: Healthy User**
```
Inputs:
- Sleep: 8h, Quality: 4/5, Stress: 2/5, Recovery: 4/5
- Workout adherence: 85%
- 6 meals logged this week
- BP: 115/72, HR: 60 bpm
- Sexual health: Desire 4/5, Satisfaction 4/5, Stress impact 2/5

Output:
- Overall Score: 85 (Optimal)
- Recovery: 88 (Optimal, Improving)
- Performance: 82 (Optimal, Stable)
- Metabolic: 86 (Optimal, Stable)
- Cardiovascular: 90 (Optimal, Improving)
- Sexual Health: 80 (Optimal, Stable)
- Recommendation: "Momentum is solid across domains. Sustain current routines."
```

### **Scenario 2: Poor Sleep, High Stress**
```
Inputs:
- Sleep: 5.5h, Quality: 2/5, Stress: 5/5, Recovery: 2/5
- Workout adherence: 60%
- 3 meals logged this week
- BP: 135/88, HR: 78 bpm
- Sexual health: Desire 2/5, Satisfaction 3/5, Stress impact 4/5

Output:
- Overall Score: 52 (At Risk)
- Recovery: 45 (At Risk, Declining)
- Performance: 58 (At Risk, Declining)
- Metabolic: 55 (At Risk, Stable)
- Cardiovascular: 62 (Stable, Stable)
- Sexual Health: 48 (At Risk, Declining)
- Recommendation: "Focus today: Recovery, Performance, Sexual Health. Address highlighted insights to rebalance."
- Insights:
  - Recovery: "Sleep below baseline target", "Elevated stress reported", "Recovery feeling is low"
  - Performance: "Workout adherence is below target", "Fatigue indicators elevated"
  - Metabolic: "Increase meal logging consistency"
  - Cardiovascular: "Blood pressure elevated vs. optimal range", "High stress levels may be impacting cardiovascular readiness"
  - Sexual Health: "Stress heavily impacting sexual health", "Desire score trending low"
```

---

## 🔧 **Technical Implementation**

### **Main Service:** `structuredDailyLogService.ts`

**Key Functions:**
- `getDashboardSummary(userId)` - Main entry point
- `buildControlTowerSummary()` - Aggregates all components
- `buildRecoveryComponent()` - Computes recovery score
- `buildPerformanceComponent()` - Computes performance score
- `buildMetabolicComponent()` - Computes metabolic score
- `buildCardioComponent()` - Computes cardiovascular score
- `buildSexualHealthComponent()` - Computes sexual health score
- `evaluateTrend()` - Determines trend direction
- `buildRecommendationSummary()` - Generates daily recommendation

### **Database Tables Used:**
- `daily_logs`
- `meal_logs`
- `cardio_metrics`
- `sexual_health_check_ins`
- `sexual_health_status`
- `reminders`
- `baseline_config`

### **API Endpoint:**
```
GET /dashboard/summary/:user_id
```

---

## 🎯 **Summary**

**The Overall Health Section is:**
- A **weighted scoring system** across 5 health domains
- Fed by **7 different data sources** (daily logs, meals, vitals, etc.)
- Interpreted using **normalization, thresholds, and trend analysis**
- Output as a **single score (0-100)** with detailed component breakdowns
- Designed to provide **actionable insights** and **daily recommendations**

**It answers the question:** *"How healthy am I right now, and what should I focus on today?"*

**Key Innovation:** Instead of looking at metrics in isolation, it provides a holistic, weighted view that prioritizes what matters most (recovery) while tracking all critical health domains.
