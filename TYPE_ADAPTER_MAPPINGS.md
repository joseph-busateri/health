# TYPE ADAPTER MAPPINGS

**Date:** April 3, 2026  
**Purpose:** Document exact mappings between engine output types and DailyHealthSnapshot types

---

## 1. RECOVERY ENGINE ADAPTER

### Source Type: `RecoveryRecord`
```typescript
{
  id: string;
  userId: string;
  date: string;
  recoveryScore: number;
  recoveryStatus: RecoveryStatus; // 'fully_recovered' | 'moderate_recovery' | 'poor_recovery'
  readinessClassification: RecoveryReadiness; // 'ready' | 'caution' | 'recovery_focus'
  sourceInputs: RecoverySourceInputs;
  recommendation: RecoveryRecommendation;
  createdAt: string; // ✅ EXISTS (not 'timestamp')
}
```

### Target Type: `RecoverySnapshot`
```typescript
{
  score: number | null;
  status: HealthStatus; // 'optimal' | 'stable' | 'moderate' | 'at_risk' | 'critical'
  trend: TrendDirection; // 'improving' | 'stable' | 'declining'
  hrv?: number;
  sleepHours?: number;
  sleepQuality?: number;
  restingHr?: number;
  verbalRecoveryFeeling?: number;
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}
```

### Adapter Mapping
| Source Field | Target Field | Transformation | Notes |
|--------------|--------------|----------------|-------|
| `recoveryScore` | `score` | Direct | ✅ |
| `recoveryStatus` | `status` | Map: fully_recovered→optimal, moderate_recovery→stable, poor_recovery→at_risk | ✅ |
| N/A | `trend` | Default: 'stable' | ⚠️ Not available in source |
| `sourceInputs.hrv` | `hrv` | Direct | ✅ |
| `sourceInputs.sleepDurationHours` | `sleepHours` | Direct | ✅ |
| `sourceInputs.sleepQuality` | `sleepQuality` | Direct | ✅ |
| `sourceInputs.restingHr` | `restingHr` | Direct | ✅ |
| `sourceInputs.verbalRecoveryFeeling` | `verbalRecoveryFeeling` | Direct | ✅ |
| `createdAt` | `lastUpdated` | Direct | ✅ (was using 'timestamp' - ERROR) |
| N/A | `dataSource` | Default: 'interview' | ✅ |
| N/A | `confidence` | Default: 'medium' | ✅ |

---

## 2. STRESS ENGINE ADAPTER

### Source Type: `StressRecord`
```typescript
{
  id: string;
  userId: string;
  date: string;
  stressScore: number;
  stressStatus: StressStatus; // 'low' | 'moderate' | 'high'
  cnsLoadStatus: StressStatus; // 'low' | 'moderate' | 'high'
  sourceInputs: StressSourceInputs;
  recommendation: StressRecommendation;
  createdAt: string; // ✅ EXISTS (not 'timestamp')
}
```

### Target Type: `StressSnapshot`
```typescript
{
  score: number | null;
  status: HealthStatus;
  trend: TrendDirection;
  cnsLoad: CNSLoadLevel; // 'low' | 'moderate' | 'high' | 'overreached'
  interviewStressLevel?: number;
  hrvStressIndicator?: number;
  sleepDisruption?: boolean;
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}
```

### Adapter Mapping
| Source Field | Target Field | Transformation | Notes |
|--------------|--------------|----------------|-------|
| `stressScore` | `score` | Direct | ✅ |
| `stressStatus` | `status` | Map: low→optimal, moderate→stable, high→at_risk | ✅ |
| N/A | `trend` | Default: 'stable' | ⚠️ Not available in source |
| `cnsLoadStatus` | `cnsLoad` | Direct (types match) | ✅ |
| `sourceInputs.interviewStressLevel` | `interviewStressLevel` | Direct | ✅ |
| `sourceInputs.hrv` | `hrvStressIndicator` | Direct | ✅ |
| `sourceInputs.sleepDurationHours` | `sleepDisruption` | Calc: < 6 hours | ✅ |
| `createdAt` | `lastUpdated` | Direct | ✅ (was using 'timestamp' - ERROR) |
| N/A | `dataSource` | Default: 'interview' | ✅ |
| N/A | `confidence` | Default: 'medium' | ✅ |

---

## 3. JOINT HEALTH ENGINE ADAPTER

### Source Type: `JointHealthRecord`
```typescript
{
  id: string;
  userId: string;
  date: string;
  affectedArea: JointArea; // 'shoulder' | 'knee' | 'back' | 'elbow' | 'other'
  jointHealthStatus: JointHealthStatus; // 'stable' | 'caution' | 'aggravated'
  riskLevel: JointRiskLevel; // 'low' | 'moderate' | 'high'
  inputs: JointHealthInputs;
  recommendation: JointWorkoutModificationRecommendation; // ⚠️ OBJECT, not string
  createdAt: string; // ✅ EXISTS (not 'timestamp')
}
```

### Target Type: `JointHealthSnapshot`
```typescript
{
  status: JointStatus; // 'stable' | 'caution' | 'aggravated'
  riskLevel: RiskLevel; // 'low' | 'moderate' | 'high' | 'critical'
  affectedAreas?: string[];
  painLevel?: number;
  tightness?: number;
  soreness?: number;
  workoutModifications?: string[];
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}
```

### Adapter Mapping
| Source Field | Target Field | Transformation | Notes |
|--------------|--------------|----------------|-------|
| `jointHealthStatus` | `status` | Direct (types match) | ✅ |
| `riskLevel` | `riskLevel` | Direct (types compatible) | ✅ |
| `affectedArea` | `affectedAreas` | Wrap in array: [affectedArea] | ✅ |
| `inputs.painLevel` | `painLevel` | Direct | ✅ |
| `inputs.tightnessLevel` | `tightness` | Direct | ✅ |
| `inputs.sorenessLevel` | `soreness` | Direct | ✅ |
| `recommendation.modifications` | `workoutModifications` | Direct (already string[]) | ✅ (was using recommendation directly - ERROR) |
| `createdAt` | `lastUpdated` | Direct | ✅ (was using 'timestamp' - ERROR) |
| N/A | `dataSource` | Default: 'interview' | ✅ |
| N/A | `confidence` | Default: 'medium' | ✅ |

---

## 4. ADHERENCE ENGINE ADAPTER

### Source Type: `AdherenceRecord`
```typescript
{
  id: string;
  userId: string;
  date: string;
  adherenceScore: number;
  status: AdherenceStatus; // 'low' | 'moderate' | 'high'
  breakdown: AdherenceDomainBreakdown;
  trend: AdherenceTrend; // 'improving' | 'stable' | 'declining'
  recommendation: AdherenceRecommendation;
  sourceInputs: AdherenceInputs;
  createdAt: string; // ✅ EXISTS (not 'timestamp')
}
```

### Target Type: `AdherenceSnapshot`
```typescript
{
  overallScore: number | null;
  status: HealthStatus;
  trend: TrendDirection;
  breakdown: {
    workout: number;
    nutrition: number;
    sleep: number;
    supplement: number;
  };
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}
```

### Adapter Mapping
| Source Field | Target Field | Transformation | Notes |
|--------------|--------------|----------------|-------|
| `adherenceScore` | `overallScore` | Direct | ✅ |
| `status` | `status` | Map: low→at_risk, moderate→stable, high→optimal | ✅ (was using 'adherenceStatus' - ERROR) |
| `trend` | `trend` | Direct (types match) | ✅ |
| `breakdown` | `breakdown` | Direct (structure matches) | ✅ |
| `createdAt` | `lastUpdated` | Direct | ✅ (was using 'timestamp' - ERROR) |
| N/A | `dataSource` | Default: 'interview' | ✅ |
| N/A | `confidence` | Default: 'medium' | ✅ |

---

## 5. WORKOUT TODAY ADAPTER

### Source Type: `WorkoutTodayRecord`
```typescript
{
  id: string;
  userId: string;
  date: string;
  baselineWorkout: WorkoutTodayPlan;
  adjustedWorkout: WorkoutTodayPlan;
  readinessStatus: WorkoutReadinessStatus; // 'ready' | 'moderate' | 'low'
  rationale: string;
  adjustments: WorkoutAdjustment[];
  baselineSnapshot: WorkoutBaseline;
  createdAt: string; // ✅ EXISTS (not 'generatedAt')
}
```

### Target Type: `WorkoutSnapshot`
```typescript
{
  readinessScore: number | null;
  readinessStatus: ReadinessLevel; // 'low' | 'moderate' | 'high'
  todayWorkoutPlan?: {
    day: string;
    focus: string;
    exercises: number;
    adjustments: string[];
  };
  workoutLoad?: number;
  targetedFocus?: string[];
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
}
```

### Adapter Mapping
| Source Field | Target Field | Transformation | Notes |
|--------------|--------------|----------------|-------|
| N/A | `readinessScore` | Derive from readinessStatus: ready→85, moderate→65, low→40 | ⚠️ Not available in source (was using 'readinessScore' - ERROR) |
| `readinessStatus` | `readinessStatus` | Map: ready→high, moderate→moderate, low→low | ✅ (types don't match exactly) |
| `adjustedWorkout.day` | `todayWorkoutPlan.day` | Direct | ✅ (was using 'workout' - ERROR) |
| `adjustedWorkout.dayPlan` | `todayWorkoutPlan.focus` | Direct (default to 'General') | ✅ |
| `adjustedWorkout.exercises.length` | `todayWorkoutPlan.exercises` | Count | ✅ |
| `adjustments[].description` | `todayWorkoutPlan.adjustments` | Map array | ✅ |
| N/A | `workoutLoad` | Not available | ⚠️ Not in source (was using 'sourceContext.workoutLoad' - ERROR) |
| N/A | `targetedFocus` | Not available | ⚠️ Not in source (was using 'targetedFocus' - ERROR) |
| `createdAt` | `lastUpdated` | Direct | ✅ (was using 'generatedAt' - ERROR) |
| N/A | `dataSource` | Default: 'derived' | ✅ |
| N/A | `confidence` | Default: 'high' | ✅ |

---

## SUMMARY OF ERRORS FIXED

### Timestamp Field Errors (5 instances)
- ❌ `recovery.timestamp` → ✅ `recovery.createdAt`
- ❌ `stress.timestamp` → ✅ `stress.createdAt`
- ❌ `joint.timestamp` → ✅ `joint.createdAt`
- ❌ `adherence.timestamp` → ✅ `adherence.createdAt`
- ❌ `workout.generatedAt` → ✅ `workout.createdAt`

### Status Field Errors (1 instance)
- ❌ `adherence.adherenceStatus` → ✅ `adherence.status`

### Recommendation Field Errors (1 instance)
- ❌ `joint.recommendation` (object) → ✅ `joint.recommendation.modifications` (string[])

### Workout Field Errors (7 instances)
- ❌ `workout.readinessScore` → ✅ Derived from `readinessStatus`
- ❌ `workout.workout.day` → ✅ `workout.adjustedWorkout.day`
- ❌ `workout.workout.dayPlan` → ✅ `workout.adjustedWorkout.dayPlan`
- ❌ `workout.workout.exercises` → ✅ `workout.adjustedWorkout.exercises`
- ❌ `workout.sourceContext.workoutLoad` → ⚠️ Not available (set to undefined)
- ❌ `workout.targetedFocus` → ⚠️ Not available (set to undefined)
- ❌ `readinessStatus: 'ready'` → ✅ Map to `'high'` for ReadinessLevel

---

## DATA LOSS / ASSUMPTIONS

### 1. Trend Data (All Engines)
**Issue:** No engine provides historical trend data  
**Assumption:** Default to `'stable'` for all trends  
**Impact:** Trend visualization will not work until historical data tracking is implemented

### 2. Readiness Score (Workout Engine)
**Issue:** `WorkoutTodayRecord` has `readinessStatus` but no numeric `readinessScore`  
**Assumption:** Derive score from status: ready→85, moderate→65, low→40  
**Impact:** Score is estimated, not calculated by engine

### 3. Workout Load (Workout Engine)
**Issue:** `WorkoutTodayRecord` does not expose `workoutLoad`  
**Assumption:** Set to `undefined`  
**Impact:** Workout load not available in snapshot

### 4. Targeted Focus (Workout Engine)
**Issue:** `WorkoutTodayRecord` does not expose `targetedFocus` or lagging muscle groups  
**Assumption:** Set to `undefined`  
**Impact:** Lagging muscle group targeting not visible in snapshot

### 5. Readiness Status Enum Mismatch
**Issue:** `WorkoutReadinessStatus` uses `'ready'` but `ReadinessLevel` uses `'high'`  
**Mapping:** ready→high, moderate→moderate, low→low  
**Impact:** Semantic difference but functionally equivalent

---

## RECOMMENDATIONS

### Short-term (Phase 1)
1. ✅ Use explicit adapters to fix all type errors
2. ✅ Accept data loss for fields not available in source
3. ✅ Document all assumptions clearly

### Medium-term (Phase 2-3)
1. Add historical trend tracking to all engines
2. Add `readinessScore` calculation to Workout Today Service
3. Expose `workoutLoad` and `targetedFocus` in WorkoutTodayRecord
4. Standardize enum values across engines (ready vs high)

### Long-term (Phase 4+)
1. Consider adding `timestamp` field to all engine records for consistency
2. Consider renaming `createdAt` to `timestamp` across all engines
3. Add schema versioning to engine records
