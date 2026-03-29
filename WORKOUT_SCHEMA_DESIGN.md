# Workout Schema Design - Complete Documentation

**Date**: March 29, 2026  
**Status**: ✅ Complete  
**Purpose**: Support 12-week training cycles with agent-managed workout plans

---

## Overview

This schema supports your specific workout requirements:
- **12-week training cycles** (Weeks 1-10: Concentric, Week 11: Eccentric, Week 12: Isometric)
- **Excel spreadsheet uploads** for initial baseline
- **Agent-managed updates** based on performance and recovery
- **Version history** to track changes over time
- **Flexible cycle configuration** (can adjust durations and styles)

---

## Schema Architecture

### 7 Core Tables

1. **`training_cycles`** - Tracks 12-week cycle configuration
2. **`workout_plan_versions`** - Stores versioned workout plans
3. **`workout_split_days`** - Defines split structure (Push/Pull/Legs)
4. **`workout_exercises`** - Individual exercises with sets/reps/weight
5. **`workout_execution_log`** - Tracks actual performance
6. **`workout_plan_changes`** - Audit trail of modifications
7. **`workout_baseline_documents`** - Excel upload metadata

---

## Key Features

### ✅ 12-Week Training Cycle Support

**Training Cycle Table** tracks:
- Current week in cycle (1-12)
- Training style per week (concentric/eccentric/isometric)
- Cycle start/end dates
- Flexible week ranges (can customize)

**Example Configuration**:
```sql
{
  "cycle_number": 1,
  "total_weeks": 12,
  "current_week": 3,
  "concentric_weeks_start": 1,
  "concentric_weeks_end": 10,
  "eccentric_week": 11,
  "isometric_week": 12
}
```

**Flexibility**: You can change these values to adjust cycle length or training style distribution.

---

### ✅ Version History & Agent Updates

**Workout Plan Versions** track:
- Version number (1, 2, 3, etc.)
- Created by (user or agent)
- Reason for change
- Effective date range
- Current vs historical versions

**Example Workflow**:
1. **Version 1**: You upload Excel baseline (created_by: 'user')
2. **Version 2**: Agent adjusts for recovery (created_by: 'agent', reason: 'Reduced volume due to poor recovery')
3. **Version 3**: Agent optimizes for performance (created_by: 'agent', reason: 'Increased weight based on strength gains')

**Change Tracking**: Every modification is logged in `workout_plan_changes` table with:
- What changed (exercise, sets, reps, weight)
- Old value → New value
- Why it changed

---

### ✅ Excel Upload Processing

**Workflow**:
1. Upload Excel file via API
2. File stored in `workout_baseline_documents`
3. OCR/parsing extracts data
4. Parsed data stored as JSON
5. New `workout_plan_version` created
6. Split days and exercises populated

**Your Excel Format** (from image):
```
Day: [Day Name]
Focus: [Split Focus]

Exercise | Description | Sets | Reps | Weight
---------|-------------|------|------|-------
[Name]   | [Details]   | [#]  | [#]  | [lbs]
```

**Parsed Structure**:
```typescript
{
  "splitDays": [
    {
      "splitDay": "Day 1",
      "splitFocus": "Push",
      "dayOrder": 1,
      "exercises": [
        {
          "exerciseName": "Barbell Bench Press",
          "exerciseDescription": "Flat bench, medium grip",
          "sets": 4,
          "reps": "8-10",
          "weight": "225",
          "order": 1
        }
      ]
    }
  ]
}
```

---

### ✅ Training Style Flexibility

**Split Days** support different training styles per week:
- `week_1_10_style`: 'concentric' (default for weeks 1-10)
- `week_11_style`: 'eccentric' (default for week 11)
- `week_12_style`: 'isometric' (default for week 12)

**Helper Function** determines current style:
```sql
SELECT get_training_style_for_week(cycle_id, week_number);
-- Returns: 'concentric', 'eccentric', or 'isometric'
```

---

### ✅ Performance Tracking

**Execution Log** tracks:
- Actual sets/reps/weight performed
- RPE (Rate of Perceived Exertion 1-10)
- Form quality (1-5)
- Skipped workouts with reasons
- Date and week number

**Agent Uses This Data To**:
- Adjust volume based on RPE trends
- Modify exercises if form quality drops
- Recommend deload if adherence decreases
- Progress weight when performance improves

---

## Database Schema Details

### Table: `training_cycles`

**Purpose**: Track 12-week cycle configuration and progress

**Key Fields**:
- `cycle_number`: Which cycle (1, 2, 3...)
- `current_week`: Current week in cycle (1-12)
- `total_weeks`: Cycle length (default 12, customizable)
- `concentric_weeks_start/end`: Week range for concentric training
- `eccentric_week`: Which week is eccentric
- `isometric_week`: Which week is isometric
- `status`: 'active', 'completed', 'paused'

**Unique Constraint**: One active cycle per user

---

### Table: `workout_plan_versions`

**Purpose**: Store versioned workout plans

**Key Fields**:
- `version_number`: Sequential version (1, 2, 3...)
- `is_current`: Only one current version per user
- `created_by`: 'user' or 'agent'
- `created_reason`: Why this version was created
- `effective_from/to`: Date range for this version

**Trigger**: Automatically sets `is_current=false` for old versions when new version created

---

### Table: `workout_split_days`

**Purpose**: Define workout split structure

**Key Fields**:
- `split_day`: "Day 1", "Monday", "Push Day"
- `split_focus`: "Push", "Pull", "Legs", "Upper", "Lower"
- `day_order`: Order in weekly rotation (1, 2, 3...)
- `week_1_10_style`: Training style for weeks 1-10
- `week_11_style`: Training style for week 11
- `week_12_style`: Training style for week 12

**Example**: Push/Pull/Legs split
- Day 1: Push (Chest/Shoulders/Triceps)
- Day 2: Pull (Back/Biceps)
- Day 3: Legs (Quads/Hamstrings/Calves)

---

### Table: `workout_exercises`

**Purpose**: Individual exercises with parameters

**Key Fields**:
- `exercise_name`: "Barbell Bench Press"
- `exercise_description`: "Flat bench, medium grip"
- `sets`: Number of sets (4)
- `reps`: Rep range ("8-10") or specific ("10")
- `weight`: Weight ("225") or "bodyweight", "progressive"
- `rest_seconds`: Rest between sets (90)
- `tempo`: Execution tempo ("3-1-1-0")
- `execution_notes`: Special instructions for different styles
- `alternative_exercises`: Array of alternatives

**Unique Constraint**: One exercise per order per split day

---

### Table: `workout_execution_log`

**Purpose**: Track actual workout performance

**Key Fields**:
- `executed_date`: When workout was performed
- `week_number`: Which week of cycle
- `training_style`: 'concentric', 'eccentric', 'isometric'
- `sets_completed`: Actual sets done
- `reps_completed`: Actual reps ("10,10,8,8")
- `weight_used`: Actual weight used
- `rpe`: Rate of Perceived Exertion (1-10)
- `form_quality`: Form rating (1-5)
- `skipped`: Boolean if workout was skipped
- `skip_reason`: Why it was skipped

**Indexes**: Optimized for querying by user, date, exercise

---

### Table: `workout_plan_changes`

**Purpose**: Audit trail of plan modifications

**Key Fields**:
- `from_version_id`: Previous version
- `to_version_id`: New version
- `change_type`: 'exercise_added', 'sets_changed', etc.
- `change_description`: Human-readable description
- `old_value` → `new_value`: What changed
- `reason`: Why it changed

**Example Change**:
```json
{
  "change_type": "sets_changed",
  "exercise_name": "Barbell Bench Press",
  "split_day": "Push Day",
  "old_value": "4",
  "new_value": "3",
  "reason": "Reduced volume due to poor recovery scores"
}
```

---

### Table: `workout_baseline_documents`

**Purpose**: Store uploaded Excel/document metadata

**Key Fields**:
- `file_name`: "My_Workout_Plan.xlsx"
- `file_path`: Storage location
- `processing_status`: 'pending', 'processing', 'completed', 'failed'
- `extracted_text`: Raw OCR text
- `parsed_workout_data`: Structured JSON data
- `processed_at`: When processing completed

**Processing Flow**:
1. Upload → `status='pending'`
2. OCR starts → `status='processing'`
3. Parse data → `status='completed'`
4. Create workout plan version from parsed data

---

## Helper Functions

### `get_training_style_for_week(cycle_id, week_number)`

**Purpose**: Determine training style for a given week

**Returns**: 'concentric', 'eccentric', or 'isometric'

**Example**:
```sql
SELECT get_training_style_for_week('cycle-uuid', 5);
-- Returns: 'concentric' (week 5 is in weeks 1-10)

SELECT get_training_style_for_week('cycle-uuid', 11);
-- Returns: 'eccentric' (week 11)
```

---

### `get_current_workout_plan(user_id)`

**Purpose**: Get complete current workout plan

**Returns**: Table with all exercises for current plan

**Example**:
```sql
SELECT * FROM get_current_workout_plan('default-user');
```

**Returns**:
```
plan_version_id | version_number | split_day | split_focus | exercise_name        | sets | reps  | weight
----------------|----------------|-----------|-------------|----------------------|------|-------|-------
uuid-123        | 1              | Day 1     | Push        | Barbell Bench Press  | 4    | 8-10  | 225
uuid-123        | 1              | Day 1     | Push        | Incline DB Press     | 3    | 10-12 | 70
```

---

## API Endpoints (To Be Built)

### Upload Workout Baseline
```
POST /workout/baseline/upload
Body: { file, userId, cycleName }
Response: { success, planVersionId }
```

### Get Current Workout Plan
```
GET /workout/plan/current/:userId
Response: { success, data: CompleteWorkoutPlan }
```

### Get Workout History
```
GET /workout/plan/history/:userId
Response: { success, data: { versions, changes } }
```

### Log Workout Execution
```
POST /workout/execution/log
Body: { userId, exerciseId, date, sets, reps, weight, rpe }
Response: { success, logId }
```

### Update Workout Plan (Agent)
```
POST /workout/plan/update
Body: { userId, createdBy: 'agent', changes, reason }
Response: { success, newVersionId }
```

---

## Example Workflows

### Workflow 1: Initial Baseline Upload

1. **User uploads Excel file**
   ```
   POST /workout/baseline/upload
   ```

2. **System processes file**
   - Extracts text via OCR
   - Parses workout structure
   - Creates `workout_baseline_document` record

3. **System creates workout plan**
   - Creates `workout_plan_version` (version 1, created_by: 'user')
   - Creates `workout_split_days` for each day
   - Creates `workout_exercises` for each exercise

4. **User can now view current plan**
   ```
   GET /workout/plan/current/default-user
   ```

---

### Workflow 2: Agent Updates Plan

1. **Agent analyzes performance data**
   - Reviews `workout_execution_log`
   - Detects high RPE (8-9) consistently
   - Detects poor recovery scores

2. **Agent creates new version**
   ```
   POST /workout/plan/update
   {
     "userId": "default-user",
     "createdBy": "agent",
     "createdReason": "Reduced volume due to poor recovery",
     "changes": [
       {
         "splitDay": "Push Day",
         "exerciseName": "Barbell Bench Press",
         "changeType": "sets_changed",
         "newValue": 3,
         "reason": "High RPE trend"
       }
     ]
   }
   ```

3. **System creates new version**
   - Creates `workout_plan_version` (version 2, created_by: 'agent')
   - Copies all split days and exercises from version 1
   - Applies changes
   - Logs changes in `workout_plan_changes`
   - Sets version 2 as current

4. **User sees updated plan**
   - Dashboard shows "Your workout plan was updated"
   - Can view changes: "Bench Press sets reduced from 4 to 3"
   - Can see reason: "High RPE trend detected"

---

### Workflow 3: Track Workout Performance

1. **User completes workout**
   - Performs exercises
   - Logs actual performance

2. **User logs execution**
   ```
   POST /workout/execution/log
   {
     "userId": "default-user",
     "exerciseId": "bench-press-uuid",
     "executedDate": "2026-03-29",
     "setsCompleted": 4,
     "repsCompleted": "10,10,8,8",
     "weightUsed": "225",
     "rpe": 8,
     "formQuality": 4
   }
   ```

3. **System stores log**
   - Creates `workout_execution_log` record
   - Links to current training cycle
   - Records week number and training style

4. **Agent uses data for future recommendations**
   - Analyzes RPE trends
   - Tracks volume progression
   - Adjusts plan accordingly

---

## Data Flow Diagram

```
Excel Upload
    ↓
workout_baseline_documents (processing)
    ↓
Parsed JSON Data
    ↓
workout_plan_versions (v1, user)
    ↓
workout_split_days (Push/Pull/Legs)
    ↓
workout_exercises (Bench Press, Squats, etc.)
    ↓
User performs workouts
    ↓
workout_execution_log (actual performance)
    ↓
Agent analyzes data
    ↓
workout_plan_versions (v2, agent)
    ↓
workout_plan_changes (audit trail)
```

---

## Schema Flexibility

### Customizable Cycle Length

**Default**: 12 weeks (10 concentric, 1 eccentric, 1 isometric)

**Can Customize**:
```sql
UPDATE training_cycles
SET 
  total_weeks = 16,
  concentric_weeks_end = 13,
  eccentric_week = 14,
  isometric_week = 15
WHERE user_id = 'default-user';
```

**Result**: 16-week cycle (13 concentric, 1 eccentric, 1 isometric, 1 deload)

---

### Multiple Training Styles Per Cycle

**Example**: Add a deload week
```sql
-- Week 13 could be a deload week
-- Just adjust the cycle configuration
```

**Example**: Different styles for different days
```sql
-- Day 1 (Push): Always concentric
-- Day 2 (Pull): Varies by week
-- Day 3 (Legs): Always eccentric
```

---

## Agent Intelligence Integration

### How Agent Uses This Schema

1. **Reads Current Plan**
   - Queries `get_current_workout_plan()`
   - Knows what user should be doing

2. **Analyzes Performance**
   - Reviews `workout_execution_log`
   - Calculates adherence, RPE trends, volume progression

3. **Makes Recommendations**
   - "Increase weight on bench press"
   - "Reduce volume on squats"
   - "Add deload week"

4. **Updates Plan**
   - Creates new `workout_plan_version`
   - Logs changes in `workout_plan_changes`
   - User sees updated plan with explanations

5. **Tracks Results**
   - Monitors if changes improved performance
   - Adjusts future recommendations

---

## Migration File

**Location**: `server/src/migrations/20260329_create_workout_schema.sql`

**To Run**:
```sql
-- Execute the migration file in your Supabase SQL editor
-- Or run via migration tool when available
```

**What It Creates**:
- 7 tables
- 2 helper functions
- 3 triggers
- Multiple indexes for performance
- Comments and documentation

---

## TypeScript Types

**Location**: `server/src/types/workoutBaseline.ts`

**Key Types**:
- `TrainingCycle`
- `WorkoutPlanVersion`
- `WorkoutSplitDay`
- `WorkoutExercise`
- `WorkoutExecutionLog`
- `WorkoutPlanChange`
- `WorkoutBaselineDocument`
- `CompleteWorkoutPlan` (with nested data)

**API Types**:
- `UploadWorkoutBaselineRequest`
- `GetCurrentWorkoutPlanResponse`
- `LogWorkoutExecutionRequest`
- `UpdateWorkoutPlanRequest`

---

## Next Steps

### To Complete Workout System:

1. **Create Workout Service** (`workoutBaselineService.ts`)
   - Upload processing logic
   - Excel parsing
   - Version management

2. **Create Workout Controller** (`workoutBaselineController.ts`)
   - API endpoint handlers
   - Request validation

3. **Create Workout Routes** (`workoutBaselineRoutes.ts`)
   - Define API endpoints
   - Connect to controller

4. **Excel Parser** (`excelWorkoutParser.ts`)
   - Parse your specific Excel format
   - Extract split days and exercises
   - Handle variations in format

5. **Agent Integration**
   - Connect to recommendation engine
   - Implement plan update logic
   - Add change tracking

---

## Summary

### ✅ Schema Supports All Requirements

1. **12-Week Training Cycle** ✅
   - Flexible week configuration
   - Different training styles per week
   - Automatic style determination

2. **Excel Upload** ✅
   - Document storage
   - OCR/parsing support
   - Structured data extraction

3. **Agent Management** ✅
   - Version history
   - Change tracking
   - Reason logging

4. **Always-Available Plan** ✅
   - Current plan query
   - Historical versions
   - Change comparison

5. **Performance Tracking** ✅
   - Execution logging
   - RPE and form quality
   - Adherence metrics

---

**The workout schema is complete and ready for implementation!** 🎉
