# Health Intelligence App - Low Fidelity Wireframes
## Cardiovascular Health & Longevity Focus

## Navigation Structure

```
┌─────────────────────────────────────┐
│  Bottom Tab Navigation              │
│  [Home] [Health] [Nutrition] [Workout] [Data] │
└─────────────────────────────────────┘
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
│ │  � Top Recommendations         │ │
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
│ │  � Quick Stats (7 days)        │ │
│ │  • Avg Sleep: 7.2hr (+0.3)      │ │
│ │  • Avg BP: 120/78 (-2/-1)       │ │
│ │  • Workouts: 5/7 days           │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [❤️] [🥗] [�] [�]         │
└─────────────────────────────────────┘
```

---

## 2. SLEEP NUMBER - CONNECT SCREEN

```
┌─────────────────────────────────────┐
│ ← Sleep Number i10                  │
├─────────────────────────────────────┤
│                                     │
│         🛏️                          │
│                                     │
│   Connect Your Sleep Number         │
│                                     │
│  Track your sleep quality, SleepIQ, │
│  and detailed sleep metrics         │
│  automatically.                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Email                           │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ your-email@example.com      │ │ │
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
│  │   Connect Sleep Number        │  │
│  └───────────────────────────────┘  │
│                                     │
│           - OR -                    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Upload CSV File             │  │
│  └───────────────────────────────┘  │
│                                     │
│  Don't have a Sleep Number?         │
│  [Skip for now]                     │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 3. SLEEP NUMBER - CONNECTED DASHBOARD

```
┌─────────────────────────────────────┐
│ ← Sleep Number i10            ⚙️    │
├─────────────────────────────────────┤
│                                     │
│  ✅ Connected                       │
│  Bed ID: 12345678                   │
│  Last sync: 2 hours ago             │
│                                     │
│  ┌───────────────────────────────┐  │
│  │      Sync Now                 │  │
│  └───────────────────────────────┘  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Last Night's Sleep             │ │
│ │                                 │ │
│ │  SleepIQ Score: 85              │ │
│ │  ⭐⭐⭐⭐☆                        │ │
│ │                                 │ │
│ │  Total Sleep: 7h 32m            │ │
│ │  Deep Sleep:  2h 15m            │ │
│ │  Light Sleep: 4h 10m            │ │
│ │  REM Sleep:   1h 7m             │ │
│ │  Awake:       18m               │ │
│ │                                 │ │
│ │  Heart Rate: 58 avg             │ │
│ │  Respiration: 14 avg            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  7-Day Trend                    │ │
│ │  ┌─────────────────────────────┐│ │
│ │  │    📈 Sleep Quality         ││ │
│ │  │  90┤     ●                  ││ │
│ │  │  80┤   ●   ●   ●            ││ │
│ │  │  70┤ ●           ●   ●      ││ │
│ │  │    └─────────────────────   ││ │
│ │  │     M T W T F S S           ││ │
│ │  └─────────────────────────────┘│ │
│ └─────────────────────────────────┘ │
│                                     │
│  [View Full History →]              │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 4. SLEEP NUMBER - CSV UPLOAD

```
┌─────────────────────────────────────┐
│ ← Upload Sleep Data                 │
├─────────────────────────────────────┤
│                                     │
│         📄                          │
│                                     │
│   Upload Sleep Number CSV           │
│                                     │
│  Export your sleep data from the    │
│  Sleep Number app and upload it     │
│  here to import your history.       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │       📁                        │ │
│ │                                 │ │
│ │   Tap to select CSV file        │ │
│ │                                 │ │
│ │   or drag and drop              │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Selected: sleep_data_2026.csv      │
│  Size: 245 KB                       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │      Upload & Import          │  │
│  └───────────────────────────────┘  │
│                                     │
│  ℹ️ How to export from Sleep Number:│
│  1. Open Sleep Number app           │
│  2. Go to Settings → Data Export    │
│  3. Select date range               │
│  4. Export as CSV                   │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 5. VOICE INTERVIEW - START SCREEN

```
┌─────────────────────────────────────┐
│ ← Daily Check-in                    │
├─────────────────────────────────────┤
│                                     │
│         🎤                          │
│                                     │
│   Voice Interview                   │
│                                     │
│  Answer a few quick questions       │
│  about your health and wellbeing.   │
│                                     │
│  Estimated time: 2-3 minutes        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Today's Topics:                │ │
│ │  • Sleep quality                │ │
│ │  • Energy levels                │ │
│ │  • Mood & stress                │ │
│ │  • Physical symptoms            │ │
│ │  • Activity & exercise          │ │
│ └─────────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   🎤 Start Voice Interview    │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   ⌨️  Use Text Instead        │  │
│  └───────────────────────────────┘  │
│                                     │
│  Last completed: Yesterday 8:30 AM  │
│  Streak: 7 days 🔥                  │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 6. VOICE INTERVIEW - RECORDING

```
┌─────────────────────────────────────┐
│ ← Daily Check-in            ⏸️ Pause│
├─────────────────────────────────────┤
│                                     │
│  Question 2 of 5                    │
│  ████████░░░░░░░░░░░░ 40%          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  "How did you sleep last        │ │
│ │   night?"                       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│         🔴 Recording                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  ▂▃▅▇█▇▅▃▂▃▅▇█▇▅▃▂▃▅▇█▇▅▃▂     │ │
│ │  Audio waveform                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│         00:08 / 01:00               │
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │         🎤                      ││
│  │                                 ││
│  │    Hold to Record               ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  Transcription:                     │
│  "I slept pretty well, got about    │
│   7 hours..."                       │
│                                     │
│  [← Previous]        [Skip →]      │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 7. HYBRID INTERVIEW - TEXT MODE

```
┌─────────────────────────────────────┐
│ ← Daily Check-in            ⏸️ Pause│
├─────────────────────────────────────┤
│                                     │
│  Question 3 of 5                    │
│  ████████████░░░░░░░ 60%           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  "How is your energy level      │ │
│ │   today?"                       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Response Mode:                     │
│  ○ Voice    ● Text                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  My energy is pretty good       │ │
│ │  today. I feel more alert       │ │
│ │  than yesterday.                │ │
│ │                                 │ │
│ │  ┃                              │ │
│ └─────────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐  │
│  │      Submit Answer            │  │
│  └───────────────────────────────┘  │
│                                     │
│  [← Previous]        [Skip →]      │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 8. INTERVIEW - COMPLETION

```
┌─────────────────────────────────────┐
│ ← Daily Check-in                    │
├─────────────────────────────────────┤
│                                     │
│         ✅                          │
│                                     │
│   Interview Complete!               │
│                                     │
│  Great job! Your responses have     │
│  been saved.                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Summary                        │ │
│ │                                 │ │
│ │  Sleep Quality: Good            │ │
│ │  Energy Level: 7/10             │ │
│ │  Mood: Positive                 │ │
│ │  Symptoms: None reported        │ │
│ │  Activity: Moderate             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  💡 Quick Insight               │ │
│ │                                 │ │
│ │  Your sleep quality has been    │ │
│ │  consistently good this week.   │ │
│ │  Keep up the great routine!     │ │
│ └─────────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   View Full Analysis          │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Done                        │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 9. JOURNAL SCREEN (Daily Logs)

```
┌─────────────────────────────────────┐
│ ☰  Journal                    ➕    │
├─────────────────────────────────────┤
│                                     │
│  📅 April 2026                      │
│  [< March] [April >]                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Tuesday, April 1               │ │
│ │  😊 Good mood • Energy: 8/10    │ │
│ │  "Feeling productive today..."  │ │
│ │  🏃 Exercise • 💊 Medication    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Monday, March 31               │ │
│ │  😐 Fair mood • Energy: 6/10    │ │
│ │  "Bit tired, but okay..."       │ │
│ │  💤 Sleep issues                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Sunday, March 30               │ │
│ │  😃 Great mood • Energy: 9/10   │ │
│ │  "Best day this week!"          │ │
│ │  🏃 Exercise • 🥗 Healthy eating│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Saturday, March 29             │ │
│ │  😊 Good mood • Energy: 7/10    │ │
│ │  "Relaxing weekend..."          │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Load More...]                     │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 10. JOURNAL - NEW ENTRY

```
┌─────────────────────────────────────┐
│ ← New Journal Entry          ✓ Save │
├─────────────────────────────────────┤
│                                     │
│  Tuesday, April 1, 2026             │
│  8:45 PM                            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  How are you feeling?           │ │
│ │  😢  😐  😊  😃  🤩            │ │
│ │           ●                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Energy Level                   │ │
│ │  ●────────○──────────── 8/10    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Notes                          │ │
│ │  ┌─────────────────────────────┐│ │
│ │  │ Had a productive day at     ││ │
│ │  │ work. Feeling good overall. ││ │
│ │  │                             ││ │
│ │  │ ┃                           ││ │
│ │  └─────────────────────────────┘│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Symptoms (optional)            │ │
│ │  ☐ Headache    ☐ Fatigue       │ │
│ │  ☐ Nausea      ☐ Pain          │ │
│ │  ☐ Anxiety     ☐ Other         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Activities                     │ │
│ │  ☑ Exercise    ☐ Meditation    │ │
│ │  ☑ Medication  ☐ Therapy       │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 11. JOURNAL - ENTRY DETAIL

```
┌─────────────────────────────────────┐
│ ← Journal Entry            ✏️ Edit  │
├─────────────────────────────────────┤
│                                     │
│  Tuesday, April 1, 2026             │
│  8:45 PM                            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Mood & Energy                  │ │
│ │  😊 Good mood                   │ │
│ │  Energy: 8/10                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Notes                          │ │
│ │                                 │ │
│ │  Had a productive day at work.  │ │
│ │  Feeling good overall. Got      │ │
│ │  enough sleep last night which  │ │
│ │  helped a lot.                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Health Data                    │ │
│ │  Steps: 8,500                   │ │
│ │  Sleep: 7h 32m (SleepIQ: 85)    │ │
│ │  Heart Rate: 68 avg             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Activities                     │ │
│ │  • Exercise (30 min walk)       │ │
│ │  • Medication taken             │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [🗑️ Delete Entry]                 │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 12. INSIGHTS SCREEN

```
┌─────────────────────────────────────┐
│ ☰  Insights                   🔍    │
├─────────────────────────────────────┤
│                                     │
│  📊 Your Health Analytics           │
│                                     │
│  Time Period: [7 Days ▼]            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🛏️ Sleep Quality Trend         │ │
│ │  ┌─────────────────────────────┐│ │
│ │  │ 90┤         ●               ││ │
│ │  │ 85┤     ●       ●           ││ │
│ │  │ 80┤   ●           ●   ●     ││ │
│ │  │ 75┤ ●                   ●   ││ │
│ │  │   └─────────────────────    ││ │
│ │  │    M  T  W  T  F  S  S      ││ │
│ │  └─────────────────────────────┘│ │
│ │  Avg: 83 (+5% vs last week)     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  😊 Mood & Energy               │ │
│ │  ┌─────────────────────────────┐│ │
│ │  │ 10┤                         ││ │
│ │  │  8┤   ●   ●       ●   ●     ││ │
│ │  │  6┤       ●   ●       ●     ││ │
│ │  │  4┤                         ││ │
│ │  │   └─────────────────────    ││ │
│ │  │    M  T  W  T  F  S  S      ││ │
│ │  └─────────────────────────────┘│ │
│ │  Avg Energy: 7.4/10             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  💡 AI-Generated Insights       │ │
│ │                                 │ │
│ │  • Your sleep quality improves  │ │
│ │    when you exercise            │ │
│ │                                 │ │
│ │  • Best energy levels occur     │ │
│ │    after 7+ hours of sleep      │ │
│ │                                 │ │
│ │  • Mood correlates with sleep   │ │
│ │    quality (r=0.78)             │ │
│ │                                 │ │
│ │  [View Detailed Analysis →]     │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 13. INSIGHTS - CORRELATIONS

```
┌─────────────────────────────────────┐
│ ← Correlations & Patterns           │
├─────────────────────────────────────┤
│                                     │
│  🔗 Health Correlations             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Sleep Quality ↔ Mood           │ │
│ │  ┌─────────────────────────────┐│ │
│ │  │ Mood                        ││ │
│ │  │ 10┤           ●             ││ │
│ │  │  8┤       ●       ●         ││ │
│ │  │  6┤   ●               ●     ││ │
│ │  │  4┤ ●                       ││ │
│ │  │   └─────────────────────    ││ │
│ │  │    70  75  80  85  90       ││ │
│ │  │         Sleep Quality       ││ │
│ │  └─────────────────────────────┘│ │
│ │  Correlation: Strong (r=0.78)   │ │
│ │                                 │ │
│ │  💡 Better sleep = better mood  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Exercise ↔ Energy              │ │
│ │  Correlation: Moderate (r=0.65) │ │
│ │                                 │ │
│ │  💡 Exercise days show 20%      │ │
│ │     higher energy levels        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Sleep Duration ↔ SleepIQ       │ │
│ │  Correlation: Strong (r=0.82)   │ │
│ │                                 │ │
│ │  💡 Optimal sleep: 7-8 hours    │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Explore More Patterns →]          │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 14. INSIGHTS - RECOMMENDATIONS

```
┌─────────────────────────────────────┐
│ ← AI Recommendations                │
├─────────────────────────────────────┤
│                                     │
│  💡 Personalized Suggestions        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🛏️ Sleep Optimization          │ │
│ │                                 │ │
│ │  Based on your data:            │ │
│ │  • Go to bed by 10:30 PM        │ │
│ │  • Aim for 7.5-8 hours          │ │
│ │  • Avoid caffeine after 2 PM    │ │
│ │                                 │ │
│ │  Expected impact: +10% SleepIQ  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🏃 Activity Goals              │ │
│ │                                 │ │
│ │  Your exercise pattern shows:   │ │
│ │  • Best results with morning    │ │
│ │    workouts                     │ │
│ │  • 30 min daily is optimal      │ │
│ │                                 │ │
│ │  Try: Morning walk routine      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  😊 Mood Management             │ │
│ │                                 │ │
│ │  Mood improves when you:        │ │
│ │  • Get 7+ hours sleep           │ │
│ │  • Exercise regularly           │ │
│ │  • Journal daily                │ │
│ │                                 │ │
│ │  Keep up these habits! 🎯       │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Updated: Today at 8:00 AM          │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 15. PROFILE SCREEN

```
┌─────────────────────────────────────┐
│ ☰  Profile                    ⚙️    │
├─────────────────────────────────────┤
│                                     │
│         👤                          │
│                                     │
│      Joseph Busateri                │
│   joseph@example.com                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Account                        │ │
│ │  • Edit Profile              →  │ │
│ │  • Change Password           →  │ │
│ │  • Notification Settings     →  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Connected Devices              │ │
│ │  • Sleep Number i10          ✓  │ │
│ │  • Apple Health              ✓  │ │
│ │  • Add Device                →  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Data & Privacy                 │ │
│ │  • Export My Data            →  │ │
│ │  • Privacy Settings          →  │ │
│ │  • Delete Account            →  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Support                        │ │
│ │  • Help Center               →  │ │
│ │  • Contact Support           →  │ │
│ │  • About                     →  │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Sign Out]                         │
│                                     │
│  Version 1.0.0                      │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 16. PROFILE - EDIT PROFILE

```
┌─────────────────────────────────────┐
│ ← Edit Profile              ✓ Save  │
├─────────────────────────────────────┤
│                                     │
│         👤                          │
│      [Change Photo]                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ First Name                      │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Joseph                      │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Last Name                       │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Busateri                    │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Email                           │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ joseph@example.com          │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Date of Birth                   │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 01/15/1985                  │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Time Zone                       │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Eastern Time (US & Canada)  │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 17. SETTINGS - NOTIFICATIONS

```
┌─────────────────────────────────────┐
│ ← Notification Settings             │
├─────────────────────────────────────┤
│                                     │
│  🔔 Manage Notifications            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Daily Reminders                │ │
│ │                                 │ │
│ │  Daily Check-in        [ON  ●]  │ │
│ │  Time: 9:00 AM                  │ │
│ │                                 │ │
│ │  Evening Journal       [ON  ●]  │ │
│ │  Time: 8:00 PM                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Health Alerts                  │ │
│ │                                 │ │
│ │  Sleep Quality Alerts  [ON  ●]  │ │
│ │  Notify when SleepIQ < 70       │ │
│ │                                 │ │
│ │  Activity Reminders    [OFF ○]  │ │
│ │                                 │ │
│ │  Medication Reminders  [ON  ●]  │ │
│ │  Time: 8:00 AM, 8:00 PM         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Insights & Reports             │ │
│ │                                 │ │
│ │  Weekly Summary        [ON  ●]  │ │
│ │  Every Monday at 9:00 AM        │ │
│ │                                 │ │
│ │  Monthly Report        [ON  ●]  │ │
│ │  1st of each month              │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Test Notification]                │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 18. DATA EXPORT SCREEN

```
┌─────────────────────────────────────┐
│ ← Export My Data                    │
├─────────────────────────────────────┤
│                                     │
│  📦 Download Your Health Data       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Date Range                     │ │
│ │  ┌─────────────┬─────────────┐  │ │
│ │  │ Start Date  │  End Date   │  │ │
│ │  │ 01/01/2026  │  04/01/2026 │  │ │
│ │  └─────────────┴─────────────┘  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Data to Include                │ │
│ │  ☑ Sleep Number data            │ │
│ │  ☑ Health metrics               │ │
│ │  ☑ Journal entries              │ │
│ │  ☑ Voice interview responses    │ │
│ │  ☑ AI insights                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Export Format                  │ │
│ │  ● CSV (Spreadsheet)            │ │
│ │  ○ JSON (Raw data)              │ │
│ │  ○ PDF (Report)                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Generate Export             │  │
│  └───────────────────────────────┘  │
│                                     │
│  ℹ️ Your data will be prepared and │
│  sent to your email within a few    │
│  minutes.                           │
│                                     │
│  Last export: March 1, 2026         │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 19. HEALTH DATA SYNC SCREEN

```
┌─────────────────────────────────────┐
│ ← Health Data Sync                  │
├─────────────────────────────────────┤
│                                     │
│  📱 Apple Health Integration        │
│                                     │
│  Status: ✅ Connected               │
│  Last sync: 5 minutes ago           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │      Sync Now                 │  │
│  └───────────────────────────────┘  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Synced Data Types              │ │
│ │                                 │ │
│ │  ☑ Steps                        │ │
│ │    Today: 8,500 steps           │ │
│ │                                 │ │
│ │  ☑ Heart Rate                   │ │
│ │    Current: 68 bpm              │ │
│ │                                 │ │
│ │  ☑ Sleep Analysis               │ │
│ │    Last night: 7h 32m           │ │
│ │                                 │ │
│ │  ☑ Active Energy                │ │
│ │    Today: 450 cal               │ │
│ │                                 │ │
│ │  ☑ Workouts                     │ │
│ │    This week: 3 sessions        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Sync Settings                  │ │
│ │  Auto-sync          [ON  ●]     │ │
│ │  Sync frequency: Every hour     │ │
│ │                                 │ │
│ │  [Manage Permissions →]         │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
│ [🏠] [📔] [📊] [👤]               │
└─────────────────────────────────────┘
```

---

## 20. ONBOARDING - WELCOME

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         🏥                          │
│                                     │
│   Welcome to                        │
│   Health Intelligence               │
│                                     │
│  Your personal health companion     │
│  powered by AI                      │
│                                     │
│                                     │
│  • Track sleep & health metrics     │
│  • Voice-powered daily check-ins    │
│  • AI-driven insights               │
│  • Personalized recommendations     │
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Get Started                 │  │
│  └───────────────────────────────┘  │
│                                     │
│  Already have an account?           │
│  [Sign In]                          │
│                                     │
│                                     │
│  ●○○○                               │
│                                     │
└─────────────────────────────────────┘
```

---

## 21. ONBOARDING - PERMISSIONS

```
┌─────────────────────────────────────┐
│                                     │
│         🔐                          │
│                                     │
│   Grant Permissions                 │
│                                     │
│  To provide the best experience,    │
│  we need a few permissions:         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🎤 Microphone                  │ │
│ │  For voice interviews           │ │
│ │  [Grant Access]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📱 Apple Health                │ │
│ │  Sync health & fitness data     │ │
│ │  [Grant Access]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🔔 Notifications               │ │
│ │  Daily reminders & insights     │ │
│ │  [Grant Access]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│  You can change these later in      │
│  Settings.                          │
│                                     │
│  [Skip for Now]      [Continue]     │
│                                     │
│  ○●○○                               │
│                                     │
└─────────────────────────────────────┘
```

---

## 22. ONBOARDING - PROFILE SETUP

```
┌─────────────────────────────────────┐
│                                     │
│         👤                          │
│                                     │
│   Create Your Profile               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ First Name                      │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │                             │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Last Name                       │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │                             │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Email                           │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │                             │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Date of Birth                   │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ MM / DD / YYYY              │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Back]              [Continue]     │
│                                     │
│  ○○●○                               │
│                                     │
└─────────────────────────────────────┘
```

---

## 23. ONBOARDING - COMPLETE

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         ✅                          │
│                                     │
│   You're All Set!                   │
│                                     │
│  Your Health Intelligence app is    │
│  ready to use.                      │
│                                     │
│                                     │
│  Next steps:                        │
│                                     │
│  1. Connect your Sleep Number       │
│  2. Complete your first check-in    │
│  3. Explore your dashboard          │
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Start Using the App         │  │
│  └───────────────────────────────┘  │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│  ○○○●                               │
│                                     │
└─────────────────────────────────────┘
```

---

## Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATION STRUCTURE                     │
└─────────────────────────────────────────────────────────────┘

HOME (Dashboard)
├── Sleep Number i10
│   ├── Connect Screen
│   ├── Connected Dashboard
│   ├── CSV Upload
│   └── Sleep History
│
├── Daily Check-in
│   ├── Voice Interview Start
│   ├── Recording Screen
│   ├── Hybrid Interview (Text)
│   └── Completion Screen
│
└── Quick Actions
    ├── View Health Summary
    └── Recent Journal

JOURNAL
├── Journal List
├── New Entry
└── Entry Detail
    └── Edit Entry

INSIGHTS
├── Analytics Dashboard
├── Correlations
├── Recommendations
└── Detailed Reports

PROFILE
├── Edit Profile
├── Notification Settings
├── Connected Devices
│   ├── Sleep Number
│   ├── Apple Health
│   └── Add Device
├── Data Export
└── Settings
    ├── Privacy
    ├── Help
    └── Sign Out
```

---

## Screen Dimensions & Guidelines

**Mobile Screen Size:** 375 x 812 (iPhone standard)

**Design Principles:**
- Clean, minimal interface
- Large touch targets (44x44 minimum)
- Clear visual hierarchy
- Consistent spacing (8px grid)
- Accessible color contrast
- Bottom navigation for primary actions
- Top navigation for context/actions

**Color Palette (Suggested):**
- Primary: Blue (#007AFF)
- Success: Green (#34C759)
- Warning: Yellow (#FFCC00)
- Error: Red (#FF3B30)
- Background: White (#FFFFFF)
- Secondary BG: Light Gray (#F2F2F7)
- Text: Dark Gray (#1C1C1E)

**Typography:**
- Headers: SF Pro Display (iOS) / Roboto (Android)
- Body: SF Pro Text / Roboto
- Sizes: 28pt (H1), 22pt (H2), 17pt (Body), 13pt (Caption)

---

## Key Features Summary

1. **Home Dashboard** - Central hub with quick access to all features
2. **Sleep Number Integration** - Direct API connection or CSV upload
3. **Voice Interviews** - AI-powered daily health check-ins
4. **Hybrid Interviews** - Voice or text input flexibility
5. **Journal** - Manual health logging with mood, energy, symptoms
6. **Insights** - AI-generated analytics and correlations
7. **Health Data Sync** - Apple Health integration
8. **Profile & Settings** - Account management and preferences
9. **Data Export** - Full data portability
10. **Onboarding** - Smooth first-time user experience

---

**Total Screens:** 23+ unique screens
**Navigation Depth:** Maximum 3 levels
**Primary User Flows:** 5 main flows (Sleep, Interview, Journal, Insights, Profile)
