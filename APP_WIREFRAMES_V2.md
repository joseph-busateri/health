# Health Intelligence App - Wireframes V2
## Cardiovascular Health & Longevity Focus

---

## App Vision

**Primary Goal:** Comprehensive cardiovascular health monitoring with AI-driven insights and personalized recommendations.

**Key Features:**
- Cardiovascular risk scoring
- Body composition tracking
- Nutrition optimization
- Workout recommendations
- Bloodwork analysis
- Device auto-sync (Sleep Number, Apple Watch, Oura Ring, Blood Pressure)
- AI-powered daily conversational interviews

---

## Navigation Structure

```
┌─────────────────────────────────────┐
│  Bottom Tab Navigation              │
│  [Home] [Health] [Nutrition] [Workout] [Data] │
└─────────────────────────────────────┘

Home      = Dashboard with CV risk score & recommendations
Health    = Overall health, cardiovascular health, body composition
Nutrition = Meal tracking, macros, recommendations
Workout   = Daily workout plan, exercise tracking
Data      = All inputs (bloodwork, supplements, scans), device sync
```

---

## 1. HOME SCREEN (Dashboard)

```
┌─────────────────────────────────────┐
│ ☰  Health Intelligence        🔔   │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ❤️ Cardiovascular Risk Score   │ │
│ │                                 │ │
│ │         🎯 72/100               │ │
│ │         MODERATE RISK           │ │
│ │                                 │ │
│ │  ████████████░░░░░░░░           │ │
│ │  Last updated: Today            │ │
│ │  [View Details →]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📊 Today's Metrics             │ │
│ │  ┌──────┐ ┌──────┐ ┌──────┐    │ │
│ │  │Sleep │ │ BP   │ │Heart │    │ │
│ │  │7.5hr │ │118/76│ │ 68   │    │ │
│ │  │ ✓    │ │ ✓    │ │ ✓    │    │ │
│ │  └──────┘ └──────┘ └──────┘    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  💡 Top Recommendations         │ │
│ │  1. Complete today's workout    │ │
│ │  2. Reduce sodium intake        │ │
│ │  3. Take evening supplements    │ │
│ │  [View All (12) →]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🎤 Daily AI Interview          │ │
│ │  Last: Yesterday 8:30 AM        │ │
│ │  [Start Today's Check-in →]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📈 Quick Stats (7 days)        │ │
│ │  • Avg Sleep: 7.2hr (+0.3)      │ │
│ │  • Avg BP: 120/78 (-2/-1)       │ │
│ │  • Workouts: 5/7 days           │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 2. HEALTH TAB - OVERVIEW

```
┌─────────────────────────────────────┐
│ ← Health Overview                   │
├─────────────────────────────────────┤
│                                     │
│  📋 Health Categories               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ❤️ Cardiovascular Health       │ │
│ │  Risk Score: 72 (Moderate)      │ │
│ │  [View Details →]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🏋️ Body Composition            │ │
│ │  Last scan: 3 days ago          │ │
│ │  [View Details →]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🩸 Bloodwork                   │ │
│ │  Last test: 2 weeks ago         │ │
│ │  [View Details →]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  😴 Sleep Quality               │ │
│ │  Avg SleepIQ: 83 (Good)         │ │
│ │  [View Details →]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  💊 Supplements                 │ │
│ │  Daily stack: 8 items           │ │
│ │  [View Details →]               │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 3. CARDIOVASCULAR HEALTH DETAIL

```
┌─────────────────────────────────────┐
│ ← Cardiovascular Health             │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Risk Score: 72/100             │ │
│ │  MODERATE RISK                  │ │
│ │                                 │ │
│ │  ████████████░░░░░░░░           │ │
│ │                                 │ │
│ │  Factors:                       │ │
│ │  ✓ Blood Pressure: Good         │ │
│ │  ⚠️ LDL Cholesterol: High       │ │
│ │  ✓ HDL Cholesterol: Good        │ │
│ │  ✓ Resting Heart Rate: Good     │ │
│ │  ⚠️ Body Fat %: Elevated        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📊 Key Metrics                 │ │
│ │                                 │ │
│ │  Blood Pressure: 118/76         │ │
│ │  Resting HR: 58 bpm             │ │
│ │  HRV: 65 ms                     │ │
│ │  VO2 Max: 42 ml/kg/min          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📈 30-Day Trend                │ │
│ │  ┌─────────────────────────────┐│ │
│ │  │ BP                          ││ │
│ │  │130┤                         ││ │
│ │  │120┤   ●   ●   ●   ●   ●     ││ │
│ │  │110┤                         ││ │
│ │  │   └─────────────────────    ││ │
│ │  └─────────────────────────────┘│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  💡 Recommendations             │ │
│ │  • Reduce LDL by 20 mg/dL       │ │
│ │  • Lose 2% body fat             │ │
│ │  • Increase cardio to 4x/week   │ │
│ │  [View All →]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 4. BODY COMPOSITION SCREEN

```
┌─────────────────────────────────────┐
│ ← Body Composition                  │
├─────────────────────────────────────┤
│                                     │
│  Last Scan: 3 days ago              │
│  [+ Add New Scan]                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Current Measurements           │ │
│ │                                 │ │
│ │  Weight: 185 lbs                │ │
│ │  Body Fat: 22.5%                │ │
│ │  Muscle Mass: 142 lbs           │ │
│ │  BMI: 25.1                      │ │
│ │  Visceral Fat: 8                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📊 Body Composition Chart      │ │
│ │  ┌─────────────────────────────┐│ │
│ │  │     ██████ 22.5% Fat        ││ │
│ │  │     ████████████ 76.8% Lean ││ │
│ │  │     █ 0.7% Other            ││ │
│ │  └─────────────────────────────┘│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📈 90-Day Progress             │ │
│ │  ┌─────────────────────────────┐│ │
│ │  │ Body Fat %                  ││ │
│ │  │ 25┤ ●                       ││ │
│ │  │ 24┤   ●                     ││ │
│ │  │ 23┤     ●   ●               ││ │
│ │  │ 22┤           ●   ●         ││ │
│ │  │   └─────────────────────    ││ │
│ │  └─────────────────────────────┘│ │
│ │  -2.5% in 90 days ✓             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🎯 Goals                       │ │
│ │  Target Body Fat: 18%           │ │
│ │  Target Weight: 175 lbs         │ │
│ │  Est. Time: 12 weeks            │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 5. NUTRITION TAB - OVERVIEW

```
┌─────────────────────────────────────┐
│ ☰  Nutrition                  ➕    │
├─────────────────────────────────────┤
│                                     │
│  Today's Nutrition                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📊 Macros (Target)             │ │
│ │                                 │ │
│ │  Calories: 1,850 / 2,200        │ │
│ │  ████████████░░░░░ 84%          │ │
│ │                                 │ │
│ │  Protein: 145g / 180g           │ │
│ │  ██████████░░░░░░░░ 81%         │ │
│ │                                 │ │
│ │  Carbs: 180g / 220g             │ │
│ │  ██████████░░░░░░░░ 82%         │ │
│ │                                 │ │
│ │  Fat: 65g / 75g                 │ │
│ │  ███████████░░░░░░░ 87%         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🍽️ Today's Meals              │ │
│ │                                 │ │
│ │  Breakfast (7:30 AM)            │ │
│ │  Oatmeal, eggs, berries         │ │
│ │  450 cal • 25g P • 45g C • 15g F│ │
│ │                                 │ │
│ │  Lunch (12:30 PM)               │ │
│ │  Chicken salad, quinoa          │ │
│ │  520 cal • 45g P • 50g C • 18g F│ │
│ │                                 │ │
│ │  Snack (3:00 PM)                │ │
│ │  Protein shake, apple           │ │
│ │  280 cal • 30g P • 35g C • 8g F │ │
│ │                                 │ │
│ │  Dinner (6:30 PM)               │ │
│ │  Salmon, vegetables, rice       │ │
│ │  600 cal • 45g P • 55g C • 24g F│ │
│ └─────────────────────────────────┘ │
│                                     │
│  [+ Log Meal]                       │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 6. NUTRITION - AI RECOMMENDATIONS

```
┌─────────────────────────────────────┐
│ ← Nutrition Recommendations         │
├─────────────────────────────────────┤
│                                     │
│  💡 Personalized Suggestions        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🎯 Priority Actions            │ │
│ │                                 │ │
│ │  1. Increase protein to 200g    │ │
│ │     Current: 180g avg           │ │
│ │     Impact: Better recovery     │ │
│ │                                 │ │
│ │  2. Reduce sodium to <2000mg    │ │
│ │     Current: 2800mg avg         │ │
│ │     Impact: Lower BP by 5 pts   │ │
│ │                                 │ │
│ │  3. Add omega-3 supplement      │ │
│ │     Target: 2g EPA/DHA daily    │ │
│ │     Impact: Reduce inflammation │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📊 Nutrient Analysis           │ │
│ │                                 │ │
│ │  ✓ Protein: On track            │ │
│ │  ⚠️ Fiber: Low (18g, need 30g)  │ │
│ │  ⚠️ Sodium: High (2800mg)       │ │
│ │  ✓ Potassium: Good              │ │
│ │  ⚠️ Omega-3: Low                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🍽️ Meal Suggestions            │ │
│ │                                 │ │
│ │  Breakfast Ideas:               │ │
│ │  • Greek yogurt parfait         │ │
│ │  • Egg white omelet + oats      │ │
│ │  • Protein smoothie bowl        │ │
│ │                                 │ │
│ │  [View All Suggestions →]       │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 7. WORKOUT TAB - TODAY'S WORKOUT

```
┌─────────────────────────────────────┐
│ ☰  Workout                          │
├─────────────────────────────────────┤
│                                     │
│  💪 Today's Workout                 │
│  Strength Training - Upper Body     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Workout Summary                │ │
│ │  Duration: 45 min               │ │
│ │  Exercises: 6                   │ │
│ │  Sets: 18 total                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Exercise List                  │ │
│ │                                 │ │
│ │  1. Bench Press                 │ │
│ │     3 sets × 8-10 reps          │ │
│ │     185 lbs                     │ │
│ │     ☐ ☐ ☐                       │ │
│ │                                 │ │
│ │  2. Dumbbell Rows               │ │
│ │     3 sets × 10-12 reps         │ │
│ │     70 lbs each                 │ │
│ │     ☐ ☐ ☐                       │ │
│ │                                 │ │
│ │  3. Overhead Press              │ │
│ │     3 sets × 8-10 reps          │ │
│ │     115 lbs                     │ │
│ │     ☐ ☐ ☐                       │ │
│ │                                 │ │
│ │  4. Pull-ups                    │ │
│ │     3 sets × max reps           │ │
│ │     Bodyweight                  │ │
│ │     ☐ ☐ ☐                       │ │
│ │                                 │ │
│ │  [View All 6 Exercises →]       │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [▶️ Start Workout]                 │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 8. WORKOUT - ACTIVE SESSION

```
┌─────────────────────────────────────┐
│ ← Bench Press              ⏸️ Pause │
├─────────────────────────────────────┤
│                                     │
│  Exercise 1 of 6                    │
│  ██████░░░░░░░░░░░░░░░░░░ 17%      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Bench Press                    │ │
│ │  Set 2 of 3                     │ │
│ │                                 │ │
│ │  Target: 8-10 reps @ 185 lbs    │ │
│ │                                 │ │
│ │  Last set: 9 reps ✓             │ │
│ └─────────────────────────────────┘ │
│                                     │
│         ⏱️ Rest Timer                │
│            1:15                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Log This Set                   │ │
│ │                                 │ │
│ │  Weight: [185] lbs              │ │
│ │  Reps:   [  ] reps              │ │
│ │                                 │ │
│ │  ┌───────────────────────────┐  │ │
│ │  │   Complete Set            │  │ │
│ │  └───────────────────────────┘  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  💡 Form Tips                   │ │
│ │  • Keep shoulder blades back    │ │
│ │  • Lower bar to mid-chest       │ │
│ │  • Drive through heels          │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Skip Exercise]    [Next →]        │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 9. DATA TAB - INPUT & SYNC

```
┌─────────────────────────────────────┐
│ ☰  Data & Inputs              ➕    │
├─────────────────────────────────────┤
│                                     │
│  📊 Data Sources                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🔄 Auto-Sync Devices           │ │
│ │                                 │ │
│ │  Sleep Number i10        ✓      │ │
│ │  Last sync: 2 hours ago         │ │
│ │                                 │ │
│ │  Apple Watch             ✓      │ │
│ │  Last sync: 5 minutes ago       │ │
│ │                                 │ │
│ │  Oura Ring               ✓      │ │
│ │  Last sync: 1 hour ago          │ │
│ │                                 │ │
│ │  Blood Pressure Monitor  ✓      │ │
│ │  Last sync: This morning        │ │
│ │                                 │ │
│ │  [+ Add Device]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📝 Manual Inputs               │ │
│ │                                 │ │
│ │  🩸 Bloodwork                   │ │
│ │  Last: 2 weeks ago              │ │
│ │  [+ Add New Results →]          │ │
│ │                                 │ │
│ │  🏋️ Body Composition Scan       │ │
│ │  Last: 3 days ago               │ │
│ │  [+ Add New Scan →]             │ │
│ │                                 │ │
│ │  💊 Supplements                 │ │
│ │  Daily stack configured         │ │
│ │  [View/Edit →]                  │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 10. BLOODWORK INPUT SCREEN

```
┌─────────────────────────────────────┐
│ ← Add Bloodwork Results             │
├─────────────────────────────────────┤
│                                     │
│  Test Date: [04/01/2026]            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Lipid Panel                    │ │
│ │                                 │ │
│ │  Total Cholesterol              │ │
│ │  [195] mg/dL                    │ │
│ │  Reference: <200                │ │
│ │                                 │ │
│ │  LDL Cholesterol                │ │
│ │  [125] mg/dL                    │ │
│ │  Reference: <100                │ │
│ │                                 │ │
│ │  HDL Cholesterol                │ │
│ │  [55] mg/dL                     │ │
│ │  Reference: >40                 │ │
│ │                                 │ │
│ │  Triglycerides                  │ │
│ │  [110] mg/dL                    │ │
│ │  Reference: <150                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Metabolic Panel                │ │
│ │                                 │ │
│ │  Glucose (Fasting)              │ │
│ │  [92] mg/dL                     │ │
│ │                                 │ │
│ │  HbA1c                          │ │
│ │  [5.4] %                        │ │
│ │                                 │ │
│ │  [+ Add More Tests]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Save Results]                     │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 11. AI INTERVIEW - CONVERSATIONAL MODE

```
┌─────────────────────────────────────┐
│ ← Daily Check-in            ✕ Close │
├─────────────────────────────────────┤
│                                     │
│  🎤 AI Health Interview             │
│  🔴 Listening...                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  AI: "Good morning! How did you │ │
│ │  sleep last night?"             │ │
│ │                                 │ │
│ │  You: "Pretty well, got about   │ │
│ │  7 hours. Felt rested."         │ │
│ │                                 │ │
│ │  AI: "That's great! I see your  │ │
│ │  Sleep Number data shows a      │ │
│ │  SleepIQ of 85. How's your      │ │
│ │  energy level this morning?"    │ │
│ │                                 │ │
│ │  You: "Energy is good, about    │ │
│ │  8 out of 10."                  │ │
│ │                                 │ │
│ │  AI: "Excellent. Any physical   │ │
│ │  symptoms or discomfort today?" │ │
│ │                                 │ │
│ │  You: [Speaking...]             │ │
│ │                                 │ │
│ │  ▂▃▅▇█▇▅▃▂▃▅▇█▇▅▃▂             │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [🎤 Voice] [⌨️ Text]               │
│                                     │
│  Progress: Question 3 of ~8         │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 12. ALL RECOMMENDATIONS SCREEN

```
┌─────────────────────────────────────┐
│ ← All Recommendations               │
├─────────────────────────────────────┤
│                                     │
│  💡 Personalized Action Plan        │
│  Updated: Today 8:00 AM             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🔴 High Priority (3)           │ │
│ │                                 │ │
│ │  1. Reduce LDL cholesterol      │ │
│ │     Current: 125 mg/dL          │ │
│ │     Target: <100 mg/dL          │ │
│ │     Actions:                    │ │
│ │     • Increase fiber to 30g     │ │
│ │     • Add plant sterols         │ │
│ │     • Reduce saturated fat      │ │
│ │                                 │ │
│ │  2. Lose 2% body fat            │ │
│ │     Current: 22.5%              │ │
│ │     Target: 20.5%               │ │
│ │     Actions:                    │ │
│ │     • 300 cal deficit daily     │ │
│ │     • 4x cardio per week        │ │
│ │     • Increase protein to 200g  │ │
│ │                                 │ │
│ │  3. Improve sleep consistency   │ │
│ │     Variance: ±45 min           │ │
│ │     Target: ±15 min             │ │
│ │     Actions:                    │ │
│ │     • Bed by 10:30 PM daily     │ │
│ │     • No screens after 9:30 PM  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🟡 Medium Priority (5)         │ │
│ │  [Expand →]                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🟢 Maintenance (4)             │ │
│ │  [Expand →]                     │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 13. DEVICE SETUP - SLEEP NUMBER

```
┌─────────────────────────────────────┐
│ ← Connect Sleep Number              │
├─────────────────────────────────────┤
│                                     │
│         🛏️                          │
│                                     │
│   One-Time Setup                    │
│                                     │
│  Connect your Sleep Number account  │
│  for automatic daily sleep data     │
│  sync.                              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Email                           │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │                             │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Password                        │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ ••••••••••                  │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Connect & Auto-Sync         │  │
│  └───────────────────────────────┘  │
│                                     │
│  ℹ️ After connecting, sleep data    │
│  will sync automatically every      │
│  morning. You won't need to log     │
│  in again.                          │
│                                     │
│           - OR -                    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Upload CSV File             │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 14. SETTINGS SCREEN

```
┌─────────────────────────────────────┐
│ ← Settings                          │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🔔 Notifications               │ │
│ │  Daily interview reminder       │ │
│ │  [Manage →]                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🔄 Connected Devices           │ │
│ │  4 devices connected            │ │
│ │  [Manage →]                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🎯 Goals & Targets             │ │
│ │  Set your health goals          │ │
│ │  [Edit →]                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📊 Data Export                 │ │
│ │  Download all your data         │ │
│ │  [Export →]                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ℹ️ About                       │ │
│ │  Version 1.0.0                  │ │
│ │  [View →]                       │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [💪] [📊]         │
└─────────────────────────────────────┘
```

---

## 15. INITIAL SETUP - BASELINE DATA

```
┌─────────────────────────────────────┐
│   Welcome to Health Intelligence    │
├─────────────────────────────────────┤
│                                     │
│  Let's set up your baseline         │
│                                     │
│  Step 1 of 4: Demographics          │
│  ●○○○                               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Age                             │ │
│ │ [41] years                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Height                          │ │
│ │ [5] ft [11] in                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Current Weight                  │ │
│ │ [185] lbs                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Sex                             │ │
│ │ ● Male  ○ Female                │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Continue →]                       │
│                                     │
└─────────────────────────────────────┘
```

---

## 16. INITIAL SETUP - GOALS

```
┌─────────────────────────────────────┐
│   Welcome to Health Intelligence    │
├─────────────────────────────────────┤
│                                     │
│  Step 2 of 4: Health Goals          │
│  ○●○○                               │
│                                     │
│  What are your primary goals?       │
│  (Select all that apply)            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ☑ Improve cardiovascular health│ │
│ │  ☑ Lose body fat                │ │
│ │  ☑ Build muscle                 │ │
│ │  ☑ Better sleep quality         │ │
│ │  ☐ Manage stress                │ │
│ │  ☐ Increase energy              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Target Weight                   │ │
│ │ [175] lbs                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Target Body Fat %               │ │
│ │ [18] %                          │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [← Back]            [Continue →]   │
│                                     │
└─────────────────────────────────────┘
```

---

## 17. INITIAL SETUP - SUPPLEMENTS

```
┌─────────────────────────────────────┐
│   Welcome to Health Intelligence    │
├─────────────────────────────────────┤
│                                     │
│  Step 3 of 4: Current Supplements   │
│  ○○●○                               │
│                                     │
│  What supplements do you take?      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Daily Supplements              │ │
│ │                                 │ │
│ │  1. Vitamin D3                  │ │
│ │     5000 IU • Morning           │ │
│ │     [Edit] [Remove]             │ │
│ │                                 │ │
│ │  2. Omega-3 Fish Oil            │ │
│ │     2000mg • Morning            │ │
│ │     [Edit] [Remove]             │ │
│ │                                 │ │
│ │  3. Magnesium                   │ │
│ │     400mg • Evening             │ │
│ │     [Edit] [Remove]             │ │
│ │                                 │ │
│ │  [+ Add Supplement]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Skip]              [Continue →]   │
│                                     │
└─────────────────────────────────────┘
```

---

## 18. INITIAL SETUP - DEVICES

```
┌─────────────────────────────────────┐
│   Welcome to Health Intelligence    │
├─────────────────────────────────────┤
│                                     │
│  Step 4 of 4: Connect Devices       │
│  ○○○●                               │
│                                     │
│  Connect your health devices        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🛏️ Sleep Number                │ │
│ │  Auto-sync sleep data           │ │
│ │  [Connect →]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ⌚ Apple Watch                  │ │
│ │  Activity, heart rate, workouts │ │
│ │  [Connect →]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  💍 Oura Ring                   │ │
│ │  Sleep, HRV, readiness          │ │
│ │  [Connect →]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🩺 Blood Pressure Monitor      │ │
│ │  Daily BP readings              │ │
│ │  [Connect →]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Skip]              [Finish Setup] │
│                                     │
└─────────────────────────────────────┘
```

---

## Navigation Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATION STRUCTURE                     │
└─────────────────────────────────────────────────────────────┘

HOME (Dashboard)
├── Cardiovascular Risk Score → Detail View
├── Top Recommendations → All Recommendations
├── Daily AI Interview → Conversational Interface
└── Quick Stats

HEALTH TAB
├── Cardiovascular Health
│   ├── Risk Score Detail
│   ├── Key Metrics
│   ├── Trends
│   └── Recommendations
├── Body Composition
│   ├── Current Measurements
│   ├── Progress Charts
│   └── Goals
├── Bloodwork
│   ├── Latest Results
│   ├── Trends
│   └── Add New Results
├── Sleep Quality
│   └── Sleep Number Data (auto-synced)
└── Supplements
    └── Daily Stack

NUTRITION TAB
├── Today's Nutrition
│   ├── Macro Tracking
│   └── Meal Log
├── AI Recommendations
│   ├── Priority Actions
│   ├── Nutrient Analysis
│   └── Meal Suggestions
└── Add Meal

WORKOUT TAB
├── Today's Workout
│   ├── Exercise List
│   └── Start Workout
├── Active Session
│   ├── Exercise Tracking
│   ├── Rest Timer
│   └── Form Tips
└── Workout History

DATA TAB
├── Auto-Sync Devices
│   ├── Sleep Number
│   ├── Apple Watch
│   ├── Oura Ring
│   └── Blood Pressure Monitor
├── Manual Inputs
│   ├── Bloodwork
│   ├── Body Composition Scan
│   └── Supplements
└── Settings
    ├── Notifications
    ├── Goals & Targets
    └── Data Export
```

---

## Key Features Summary

1. **Cardiovascular Risk Scoring** - AI-calculated risk score based on all health data
2. **Body Composition Tracking** - Regular scans with progress visualization
3. **Nutrition Optimization** - Macro tracking with AI recommendations
4. **Workout Planning** - Personalized daily workouts with tracking
5. **Bloodwork Analysis** - Manual input with trend analysis
6. **Device Auto-Sync** - Daily automatic data collection from 4+ devices
7. **AI Conversational Interviews** - Natural voice/text health check-ins
8. **Comprehensive Recommendations** - Prioritized action items across all health areas
9. **Supplement Management** - One-time setup, ongoing tracking
10. **Data Export** - Full data portability

---

## Design Principles

- **Single-user focus** - No profile management, no multi-user features
- **Auto-sync first** - Devices connect once, sync automatically
- **AI-driven** - Conversational interviews, intelligent recommendations
- **Cardiovascular focus** - Risk scoring as primary health metric
- **Minimal input** - Automate everything possible
- **Action-oriented** - Clear recommendations, not just data display
- **Long-term tracking** - Trends and progress over time

---

**Total Core Screens:** 18 screens
**Navigation Depth:** Maximum 2-3 levels
**Primary User Flows:** 5 main tabs (Home, Health, Nutrition, Workout, Data)
