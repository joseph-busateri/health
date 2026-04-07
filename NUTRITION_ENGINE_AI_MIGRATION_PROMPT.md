# Windsurf Prompt — Nutrition Engine AI Migration

**Copy everything below into Windsurf:**

---

You are implementing **Nutrition Engine AI Migration** for the Personal AI Health Agent.

This migration must follow the **exact same proven architecture** used for:

1. Recovery Engine
2. Stress Engine
3. Joint Engine
4. Adherence Engine
5. Workout Engine

This is **Engine #6** and critical because nutrition directly impacts recovery, performance, body composition, and goal achievement.

---

## CRITICAL RULES

- ❌ **DO NOT** break existing nutrition behavior
- ❌ **DO NOT** remove current nutrition schema
- ✅ **PRESERVE** backward compatibility
- ✅ **DETERMINISTIC** nutrition logic remains authoritative
- ✅ **AI ENRICHES** nutrition decisions, not replaces core logic
- ✅ **MIRROR** architecture used in prior engine migrations

---

## OBJECTIVE

Migrate Nutrition Engine to AI Enrichment Architecture:

```
Deterministic Nutrition Engine
  ↓
Nutrition Evidence Builder
  ↓
AI Enrichment
  ↓
Normalizer
  ↓
Validator
  ↓
RecommendationEngine
  ↓
Persistence
  ↓
Retrieval
  ↓
Fallback
```

---

## STEP 1 — Inspect Existing Nutrition Engine

Locate existing files:
- `nutritionEngineService.ts`
- `nutritionEngine.ts`
- `nutritionController.ts`
- `nutritionRoutes.ts`
- Nutrition schema files
- Nutrition tracking files

Document:
- Nutrition schema structure
- Macro tracking (protein, carbs, fats, calories)
- Meal timing logic
- Hydration tracking
- Supplement integration
- Recommendation logic
- Persistence model

**DO NOT** change behavior yet.

---

## STEP 2 — Expand Nutrition Types

Update or create `nutritionEngine.ts`:

```typescript
export type NutritionStatus = 'optimal' | 'adequate' | 'suboptimal' | 'deficient';

export interface NutritionSourceInputs {
  recoveryScore?: number;
  stressScore?: number;
  adherenceScore?: number;
  workoutStatus?: string;
  goalType?: string;
  bodyComposition?: {
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
  };
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface NutritionEvidenceSignal {
  name: string;
  value: number | string | null;
  interpretation: string;
}

export interface NutritionEvidence {
  nutritionStatus: NutritionStatus;
  sourceInputs: NutritionSourceInputs;
  signals: NutritionEvidenceSignal[];
  summary: string;
}

export type NutritionRecommendationPriority = 'critical' | 'important' | 'optimization';
export type NutritionRecommendationSource = 'deterministic' | 'ai_enriched' | 'fallback';

export interface NutritionRecommendation {
  type: 'nutrition';
  priority: NutritionRecommendationPriority;
  summary: string;
  rationale?: string;
  actions: string[];
  source?: NutritionRecommendationSource;
  macroTargets?: {
    protein?: string;
    carbs?: string;
    fats?: string;
    calories?: string;
  };
  mealTiming?: string[];
  hydration?: string;
  supplements?: string[];
}

export interface NutritionEngineRecord {
  id: string;
  userId: string;
  date: string;
  nutritionStatus: NutritionStatus;
  sourceInputs: NutritionSourceInputs;
  evidence?: NutritionEvidence;
  recommendation: NutritionRecommendation;
  createdAt: string;
}
```

Keep existing fields intact.

---

## STEP 3 — Define Nutrition Status Logic

Nutrition Status should reflect:

### Optimal
- Meeting macro targets (±5%)
- Adequate hydration
- Proper meal timing
- Supplement compliance high

### Adequate
- Meeting macro targets (±15%)
- Hydration moderate
- Meal timing acceptable

### Suboptimal
- Missing macro targets (±25%)
- Hydration low
- Meal timing poor
- Supplement compliance low

### Deficient
- Significantly missing macro targets (>25%)
- Severe hydration deficit
- No meal timing structure
- No supplement compliance

---

## STEP 4 — Create Nutrition Evidence Builder

Add `buildNutritionEvidence()`:

Interpret signals:
- Recovery Score
- Stress Score
- Adherence Score
- Workout Status
- Goal Type
- Body Composition
- Activity Level

**Examples:**

**Low recovery + high protein need:**
→ "Recovery is limited. Increase protein intake to 1.2-1.4g/lb for muscle repair."

**High stress + carb timing:**
→ "Stress is elevated. Focus carbs around workouts to support cortisol management."

**Fat loss goal + adequate nutrition:**
→ "Nutrition supports fat loss. Maintain current macro split and calorie deficit."

**Muscle gain + suboptimal protein:**
→ "Protein intake is below target. Increase to 1.0-1.2g/lb to support muscle growth."

---

## STEP 5 — Fallback Nutrition Builder

Create `buildNutritionFallbackRecommendation()`:

**Examples:**

### Deficient Status (Critical)
**Summary:** "Nutrition is severely deficient. Immediate macro and hydration correction needed."

**Actions:**
- Increase protein to 0.8-1.0g/lb bodyweight minimum
- Set calorie target based on goal (maintenance, deficit, surplus)
- Drink 0.5-1oz water per lb bodyweight
- Establish 3-4 meal structure
- Add basic multivitamin and protein supplement

### Suboptimal Status (Important)
**Summary:** "Nutrition needs improvement. Adjust macros and meal timing."

**Actions:**
- Adjust protein to goal-appropriate level
- Balance carbs around training
- Include healthy fats (0.3-0.4g/lb)
- Improve hydration consistency
- Time largest meals around workouts

### Adequate Status (Important)
**Summary:** "Nutrition is adequate. Minor optimizations available."

**Actions:**
- Fine-tune macro ratios for goal
- Optimize meal timing for performance
- Maintain hydration standards
- Consider targeted supplementation
- Track adherence consistency

### Optimal Status (Optimization)
**Summary:** "Nutrition is optimal. Maintain current approach."

**Actions:**
- Continue current macro targets
- Maintain meal timing structure
- Keep hydration consistent
- Monitor body composition changes
- Adjust only if goals or activity change

---

## STEP 6 — AI Enrichment Service

Create `nutritionAIEnrichment.ts`:

AI receives:
- Evidence signals
- Current nutrition status
- Goals (muscle gain, fat loss, performance, health)
- Body composition data
- Activity level

AI generates:
- Personalized macro targets
- Meal timing recommendations
- Hydration guidance
- Supplement suggestions
- Specific food recommendations

**AI Prompt Guidelines:**
1. Focus on practical, sustainable nutrition changes
2. Be specific about macro targets (protein, carbs, fats, calories)
3. Consider goal type (muscle gain, fat loss, performance, health)
4. Account for recovery and stress signals
5. Provide meal timing guidance around training
6. Include hydration targets
7. Suggest evidence-based supplements when appropriate
8. Avoid extreme or unsustainable recommendations
9. Consider adherence capacity (don't overcomplicate)
10. Provide actionable food examples

---

## STEP 7 — Nutrition Normalizer

Create `nutritionRecommendationNormalizer.ts`:

Ensure:
- Summary exists
- Actions array exists
- Valid priority
- Source field
- Macro targets are reasonable
- Meal timing is practical

---

## STEP 8 — Nutrition Validator

Create `nutritionRecommendationValidator.ts`:

Validate:
- Summary exists
- Actions length > 0
- Valid priority
- Macro targets within reasonable ranges
- Meal timing is logical

Fallback if invalid.

---

## STEP 9 — Integrate AI Enrichment

Modify nutrition engine flow:

1. Compute deterministic nutrition status
2. Build evidence
3. Build fallback
4. Run AI enrichment
5. Normalize
6. Validate
7. Persist

---

## STEP 10 — Feature Flags

Add:
```bash
USE_AI_ENRICHMENT_NUTRITION=true
```

AI triggers when:
- Adequate
- Suboptimal
- Deficient

(Optimal uses fallback - deterministic is sufficient)

---

## STEP 11 — Logging

Add logs:
- `🔵 [NUTRITION AI PATH] Attempting AI enrichment`
- `✅ [NUTRITION AI PATH] AI enrichment succeeded`
- `⚠️ [NUTRITION AI PATH] Validation failed, using fallback`
- `🔴 [NUTRITION AI PATH] AI enrichment error, using fallback`
- `🟡 [NUTRITION FALLBACK PATH] Using fallback recommendation`
- `✅ Nutrition recommendation persisted to RecommendationEngine`

---

## STEP 12 — Integration Points

Nutrition engine must consider:

### Input Engines
- **Recovery Engine** → Protein needs for recovery
- **Stress Engine** → Carb timing for cortisol management
- **Adherence Engine** → Plan complexity tolerance
- **Workout Engine** → Nutrient timing around training

### Control Tower Layers
- **Predictive Intelligence** → Anticipate nutrition needs
- **Adaptive Intelligence** → Learn from nutrition outcomes
- **Autonomous Optimization** → Autonomous nutrition adjustments
- **Goal-Driven Optimization** → Nutrition aligned with goals

### Body Composition
- **Weight trends** → Calorie adjustment
- **Body fat trends** → Macro adjustment
- **Muscle mass trends** → Protein adjustment

---

## STEP 13 — Validation Scripts

Create:
- `validate-nutrition-e2e.ts`
- `validate-nutrition-ai-success.ts`
- `validate-nutrition-fallback.ts`

---

## STEP 14 — Test Scenarios

### Optimal Scenario
- Meeting all macro targets
- Good hydration
- Proper meal timing

**Expect:**
- Maintain current approach

### Adequate Scenario
- Meeting most macro targets
- Moderate hydration

**Expect:**
- Minor optimizations

### Suboptimal Scenario
- Missing protein target
- Poor meal timing

**Expect:**
- Macro adjustments
- Meal timing guidance

### Deficient Scenario
- Severely low calories
- No protein structure
- Poor hydration

**Expect:**
- Immediate correction
- Basic nutrition structure

---

## STEP 15 — API Endpoints

Ensure:
- `GET /nutrition-engine/:userId/today`
- `GET /nutrition-engine/:userId/history`

---

## SUCCESS CRITERIA

- ✅ Nutrition recommendations generated
- ✅ AI enrichment working
- ✅ Fallback working
- ✅ Persistence working
- ✅ Integration working
- ✅ Macro targets calculated
- ✅ Meal timing guidance provided
- ✅ Hydration targets set
- ✅ Supplement recommendations appropriate

---

## EXPECTED OUTCOME

User opens app:

**Today's Nutrition Plan**

**Status:** Suboptimal

**Macro Targets:**
- Protein: 180-200g (1.0-1.1g/lb)
- Carbs: 250-300g (focus around training)
- Fats: 60-70g
- Calories: 2,400-2,600

**Meal Timing:**
- Pre-workout: 40-50g carbs, 20-30g protein (1-2 hours before)
- Post-workout: 50-60g carbs, 30-40g protein (within 1 hour)
- Remaining meals: Balanced protein and fats

**Hydration:**
- Target: 100-120oz water daily
- Extra 16-20oz around training

**Supplements:**
- Whey protein (post-workout)
- Creatine monohydrate (5g daily)
- Vitamin D (2000 IU)

**Actions:**
- Increase protein by 30-40g daily
- Time largest carb meals around training
- Add protein shake post-workout
- Track water intake consistently

---

## FINAL GOAL

Nutrition becomes:

**Personalized Nutrition Engine**

Not just macro tracking, but:
- Goal-aligned nutrition
- Recovery-optimized nutrition
- Performance-optimized nutrition
- Body composition-optimized nutrition

---

## ARCHITECTURE PATTERN

Follow **EXACT** pattern from:
- Recovery Engine ✅
- Stress Engine ✅
- Joint Engine ✅
- Adherence Engine ✅
- Workout Engine ✅

Now apply to:
- **Nutrition Engine** ← YOU ARE HERE

---

## FILES TO CREATE

1. `src/types/nutritionEngine.ts`
2. `src/services/nutritionEngineService.ts`
3. `src/services/nutritionAIEnrichment.ts`
4. `src/services/nutritionRecommendationNormalizer.ts`
5. `src/services/nutritionRecommendationValidator.ts`
6. `src/controllers/nutritionEngineController.ts`
7. `src/routes/nutritionEngineRoutes.ts`
8. `src/scripts/validate-nutrition-e2e.ts`
9. `src/scripts/validate-nutrition-ai-success.ts`
10. `src/scripts/validate-nutrition-fallback.ts`

---

## FILES TO MODIFY

1. `src/index.ts` - Add nutrition engine routes
2. `package.json` - Add npm scripts
3. `.env` - Add `USE_AI_ENRICHMENT_NUTRITION=true`

---

## NPM SCRIPTS TO ADD

```json
"validate:nutrition:e2e": "ts-node src/scripts/validate-nutrition-e2e.ts",
"validate:nutrition:ai-success": "ts-node src/scripts/validate-nutrition-ai-success.ts",
"validate:nutrition:fallback": "ts-node src/scripts/validate-nutrition-fallback.ts"
```

---

## VALIDATION COMMANDS

```bash
npm run validate:nutrition:e2e
npm run validate:nutrition:ai-success
npm run validate:nutrition:fallback
```

---

## CHECKPOINT STATEMENT

> **Nutrition Engine AI Migration is complete and validated. Six engines (Recovery, Stress, Joint, Adherence, Workout, Nutrition) now operate with AI enrichment, normalization, validation, and RecommendationEngine persistence. The Personal AI Health Agent now provides personalized, goal-aligned, recovery-optimized nutrition guidance with macro targets, meal timing, hydration, and supplement recommendations.**

---

## IMPORTANT NOTES

### Macro Calculation Guidelines
- **Protein:** 0.8-1.4g/lb bodyweight (goal-dependent)
- **Fats:** 0.3-0.5g/lb bodyweight
- **Carbs:** Remaining calories after protein/fat
- **Calories:** Based on goal (deficit, maintenance, surplus)

### Goal-Specific Adjustments
- **Muscle Gain:** Higher protein (1.0-1.2g/lb), calorie surplus (+300-500)
- **Fat Loss:** High protein (1.0-1.4g/lb), calorie deficit (-300-500)
- **Performance:** Moderate protein (0.8-1.0g/lb), carbs around training
- **Health/Maintenance:** Balanced macros, maintenance calories

### Meal Timing Priorities
1. **Pre-workout:** Carbs + moderate protein (1-2 hours before)
2. **Post-workout:** Carbs + protein (within 1 hour)
3. **Remaining meals:** Balanced protein, fats, carbs

### Hydration Guidelines
- **Baseline:** 0.5-1oz per lb bodyweight
- **Training days:** +16-24oz
- **Hot weather:** +20-30oz
- **High stress:** +10-15oz

### Supplement Recommendations
**Evidence-based only:**
- Protein powder (convenience)
- Creatine monohydrate (5g daily)
- Vitamin D (if deficient)
- Omega-3 (if low fish intake)
- Multivitamin (if diet gaps)

**Avoid:**
- Proprietary blends
- Unproven supplements
- Excessive supplementation

---

**BEGIN IMPLEMENTATION**

Follow the 15-step process above, mirroring the exact architecture from Recovery, Stress, Joint, Adherence, and Workout engines.

This is Engine #6 in the AI migration series.

Good luck! 🚀
