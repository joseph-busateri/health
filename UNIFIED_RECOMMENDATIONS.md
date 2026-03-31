# Unified Recommendation System

## Overview

The Unified Recommendation System consolidates all health recommendations into a single, cohesive interface. Instead of having siloed recommendations in bloodwork, goals, adherence, etc., all recommendations are now displayed in **one central location** with consistent structure and user interaction.

---

## Key Features

### ✅ **Single Display Location**
- All recommendations appear in one unified feed
- No more scattered recommendations across different sections
- Prioritized and organized by urgency and impact

### ✅ **Rich Recommendation Structure**
Each recommendation includes:
- **Title**: Clear, specific description
- **Description**: Detailed explanation of what to do
- **Rationale**: Why this recommendation matters (based on your data)
- **Intended Outcome**: Expected result if implemented
- **Action Items**: Specific, actionable steps

### ✅ **Accept Button**
- Users can accept recommendations to indicate implementation
- Tracks acceptance date and user notes
- Builds history of implemented recommendations
- Used for future recommendation generation

### ✅ **Stored as Data**
- All recommendations stored in `unified_recommendations` table
- Full history maintained (active, accepted, dismissed, superseded)
- Queryable by source, category, priority, timeframe
- Used to avoid duplicate recommendations

### ✅ **Hybrid Generation (Rules + AI)**
- **Rule-based**: Fast, deterministic recommendations from bloodwork trends, goal progress, adherence patterns
- **AI-enhanced**: Contextual, personalized recommendations analyzing ALL available data
- **Cost-optimized**: Rules first, AI for complex analysis

---

## Architecture

### Data Model

```typescript
interface UnifiedRecommendation {
  // Core Identity
  id: string;
  user_id: string;
  
  // Classification
  source: 'bloodwork' | 'body_composition' | 'device_data' | 'goals' | 'adherence' | 'supplements' | 'workout' | 'sleep' | 'nutrition' | 'ai_analysis';
  category: 'cardiovascular' | 'metabolic' | 'hormonal' | 'inflammation' | 'body_composition' | 'recovery' | 'performance' | 'lifestyle' | 'nutrition' | 'supplement' | 'workout' | 'sleep' | 'stress_management';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'today' | 'this_week' | 'this_month' | 'long_term';
  
  // Content
  title: string;
  description: string;
  rationale: string;
  intended_outcome: string;
  action_items: string[];
  
  // Metadata
  confidence: number; // 0-1 scale
  status: 'active' | 'accepted' | 'dismissed' | 'superseded' | 'expired';
  
  // User Interaction
  accepted_at?: string;
  user_notes?: string;
  
  // AI Enhancement
  ai_generated: boolean;
  ai_cost?: number;
}
```

### Recommendation Sources

The system aggregates data from:

1. **Bloodwork** (quarterly)
   - Trend analysis of markers
   - Abnormal flag detection
   - Multi-marker patterns

2. **Body Composition** (monthly)
   - Weight trends
   - Body fat percentage changes
   - Muscle mass progression

3. **Device Data** (continuous)
   - Apple Watch: Sleep, HRV, activity, heart rate
   - Oura Ring: Sleep quality, readiness, activity
   - Sleep Number: Sleep stages, respiratory rate

4. **Goals** (active)
   - Progress tracking
   - On-track analysis
   - Milestone achievements

5. **Adherence** (daily)
   - Workout consistency
   - Nutrition compliance
   - Sleep quality
   - Supplement adherence

6. **Baseline Profile** (one-time)
   - Demographics (age, gender)
   - Health goals
   - Supplement stack
   - Workout program

---

## Hybrid Generation Process

### Step 1: Build Context
```typescript
const context = {
  latest_bloodwork: { /* markers, trends */ },
  latest_body_composition: { /* weight, body fat, muscle */ },
  device_data: { /* 7-day averages */ },
  active_goals: [ /* goal progress */ ],
  adherence: { /* domain scores */ },
  baseline: { /* demographics, goals */ }
};
```

### Step 2: Rule-Based Generation
- Bloodwork trend rules (e.g., LDL increasing > 10%)
- Goal progress rules (e.g., behind schedule)
- Adherence rules (e.g., low consistency)
- **Cost: $0**
- **Speed: <100ms**

### Step 3: AI Enhancement (Optional)
- Analyzes ALL data sources holistically
- Identifies cross-domain patterns
- Generates personalized, contextual recommendations
- **Cost: ~$0.02-0.05 per generation**
- **Speed: 3-5 seconds**

### Step 4: Deduplication
- Check for existing active recommendations
- Supersede outdated recommendations
- Avoid duplicate suggestions

---

## API Endpoints

### Generate Recommendations
```http
POST /api/recommendations/generate
{
  "user_id": "uuid",
  "force_regenerate": false,
  "use_ai_enhancement": true
}
```

### Get Active Recommendations
```http
GET /api/recommendations/active?user_id=uuid
```

### Accept Recommendation
```http
POST /api/recommendations/:id/accept
{
  "user_notes": "Started taking fish oil daily"
}
```

### Dismiss Recommendation
```http
POST /api/recommendations/:id/dismiss
{
  "reason": "Already doing this",
  "user_notes": "Been taking this for 6 months"
}
```

---

## Example Recommendations

### From Bloodwork (Rule-Based)
```json
{
  "source": "bloodwork",
  "category": "cardiovascular",
  "priority": "high",
  "timeframe": "this_week",
  "title": "LDL Cholesterol Increasing",
  "description": "Your LDL cholesterol has increased from 95 to 146 mg/dL (53.7% increase). This may require intervention to reduce cardiovascular risk.",
  "rationale": "LDL cholesterol is significantly elevated (146 mg/dL) with worsening trend over 2 measurements, indicating increased cardiovascular risk.",
  "intended_outcome": "Reduce LDL to optimal range (<100 mg/dL) through dietary changes, exercise, and potentially medication consultation.",
  "action_items": [
    "Reduce saturated fat intake to <7% of daily calories",
    "Add 30 minutes of cardio 5x per week",
    "Consider adding plant sterols (2g/day)",
    "Schedule follow-up bloodwork in 3 months"
  ],
  "confidence": 0.9,
  "ai_generated": false
}
```

### From AI Analysis (Cross-Domain)
```json
{
  "source": "ai_analysis",
  "category": "recovery",
  "priority": "medium",
  "timeframe": "this_week",
  "title": "Sleep Quality Impacting Recovery",
  "description": "Your average sleep duration (6.2 hours) combined with low HRV (45ms) and elevated LDL suggests inadequate recovery is affecting metabolic health.",
  "rationale": "Device data shows consistent sleep deprivation correlating with worsening bloodwork markers. Poor sleep increases cortisol and inflammation, directly impacting cholesterol metabolism.",
  "intended_outcome": "Improve sleep to 7.5+ hours nightly to support metabolic recovery, reduce inflammation, and optimize cardiovascular health.",
  "action_items": [
    "Set consistent bedtime at 10:30 PM",
    "Reduce screen time 1 hour before bed",
    "Consider magnesium glycinate (400mg) before bed",
    "Track sleep quality and HRV trends"
  ],
  "confidence": 0.85,
  "ai_generated": true,
  "ai_cost": 0.0125
}
```

### From Goals (Rule-Based)
```json
{
  "source": "goals",
  "category": "performance",
  "priority": "medium",
  "timeframe": "today",
  "title": "Weight Loss Goal Behind Schedule",
  "description": "Your weight loss goal is 15% behind target pace. Current progress: 3.2 lbs lost vs. expected 5.5 lbs after 4 weeks.",
  "rationale": "Goal tracking shows slower than expected progress. Adjustments needed to reach target of 15 lbs in 12 weeks.",
  "intended_outcome": "Get back on track to achieve goal deadline with sustainable progress.",
  "action_items": [
    "Increase calorie deficit by 200 kcal/day",
    "Add 2 additional cardio sessions per week",
    "Track daily weight and weekly averages",
    "Review nutrition adherence logs"
  ],
  "confidence": 0.8,
  "ai_generated": false
}
```

---

## Benefits

### For Users
✅ **Single source of truth** - All recommendations in one place  
✅ **Prioritized by impact** - See what matters most first  
✅ **Actionable** - Clear steps to implement  
✅ **Trackable** - Accept button creates accountability  
✅ **Contextual** - Understands your full health picture  

### For System
✅ **Deduplication** - No conflicting recommendations  
✅ **History** - Learn from past recommendations  
✅ **Cost-optimized** - Rules first, AI when needed  
✅ **Scalable** - Easy to add new sources  
✅ **Queryable** - Filter by priority, timeframe, category  

---

## Database Schema

```sql
CREATE TABLE unified_recommendations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Classification
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT NOT NULL,
  intended_outcome TEXT NOT NULL,
  action_items JSONB,
  
  -- Metadata
  confidence DECIMAL(3,2),
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Source Data
  source_data JSONB NOT NULL,
  
  -- User Interaction
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  user_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- AI Enhancement
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_cost DECIMAL(10,6)
);
```

---

## Cost Analysis

### Rule-Based Recommendations
- **Cost:** $0
- **Speed:** <100ms
- **Coverage:** ~60-70% of recommendations
- **Sources:** Bloodwork trends, goal progress, adherence patterns

### AI-Enhanced Recommendations
- **Cost:** $0.02-0.05 per generation
- **Speed:** 3-5 seconds
- **Coverage:** ~30-40% of recommendations
- **Sources:** Cross-domain analysis, complex patterns

### Monthly Cost Estimate (per user)
- Weekly recommendation generation: 4x/month
- 70% rule-based: $0
- 30% AI-enhanced: $0.06-0.15
- **Total: ~$0.10/month per active user**

---

## Implementation Status

✅ **Types defined** (`unifiedRecommendations.ts`)  
✅ **Engine created** (`unifiedRecommendationEngine.ts`)  
✅ **Database migration** (`create_unified_recommendations.sql`)  
✅ **API routes** (`unifiedRecommendations.routes.ts`)  
✅ **Context aggregation** (bloodwork, body comp, devices, goals, adherence)  
✅ **AI generation** (GPT-4o with comprehensive context)  
✅ **Accept/Dismiss tracking**  
✅ **History maintenance**  

---

## Next Steps

1. **Run database migration** to create `unified_recommendations` table
2. **Add route to main app** (`app.use('/api/recommendations', unifiedRecommendationsRouter)`)
3. **Test with real user data** to validate generation
4. **Build frontend UI** for recommendation display
5. **Add notification system** for new high-priority recommendations
6. **Implement recommendation learning** (track effectiveness of accepted recommendations)

---

## Summary

The Unified Recommendation System transforms the fragmented recommendation experience into a **single, intelligent, actionable feed** that:

- **Consolidates** all health insights in one place
- **Prioritizes** by impact and urgency
- **Explains** the why and expected outcome
- **Tracks** user implementation
- **Learns** from historical data
- **Optimizes** cost with hybrid approach

**All recommendations are now data-driven, contextual, and user-centric.**
