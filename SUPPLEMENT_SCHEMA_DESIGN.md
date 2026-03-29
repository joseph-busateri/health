# Supplement Schema Design - Complete Documentation

**Date**: March 29, 2026  
**Status**: ✅ Complete  
**Purpose**: Support agent-managed supplement stacks with version history and adherence tracking

---

## Overview

This schema supports your supplement stack requirements:
- **Excel spreadsheet uploads** for initial baseline
- **Agent-managed updates** based on performance, health data, and adherence
- **Version history** to track changes over time
- **Adherence monitoring** with side effects and effectiveness tracking
- **Interaction checking** between supplements and medications
- **Inventory management** with reorder alerts

---

## Schema Architecture

### 7 Core Tables

1. **`supplement_stack_versions`** - Stores versioned supplement stacks
2. **`supplements`** - Individual supplements with dosage/timing/purpose
3. **`supplement_adherence_log`** - Tracks actual intake vs planned
4. **`supplement_stack_changes`** - Audit trail of modifications
5. **`supplement_baseline_documents`** - Excel upload metadata
6. **`supplement_interactions`** - Known interactions database
7. **`supplement_inventory`** - Inventory tracking and reorder alerts

---

## Key Features

### ✅ Version History & Agent Updates

**Supplement Stack Versions** track:
- Version number (1, 2, 3, etc.)
- Created by (user or agent)
- Reason for change
- Effective date range
- Current vs historical versions

**Example Workflow**:
1. **Version 1**: You upload Excel baseline (created_by: 'user')
2. **Version 2**: Agent adds Vitamin D (created_by: 'agent', reason: 'Low Vitamin D in bloodwork')
3. **Version 3**: Agent removes supplement (created_by: 'agent', reason: 'Side effects reported')

**Change Tracking**: Every modification logged with:
- What changed (supplement added/removed, dosage changed, etc.)
- Old value → New value
- Why it changed
- What triggered it (bloodwork, side effects, adherence, performance)

---

### ✅ Excel Upload Processing

**Workflow**:
1. Upload Excel file via API
2. File stored in `supplement_baseline_documents`
3. OCR/parsing extracts data
4. Parsed data stored as JSON
5. New `supplement_stack_version` created
6. Supplements populated

**Your Excel Format** (from requirements):
```
Supplementation | Dosage | Timing | Goal | Reason to take
----------------|--------|--------|------|---------------
[Name]          | [#mg]  | [Time] | [#]  | [Reason]
```

**Parsed Structure**:
```typescript
{
  "supplements": [
    {
      "supplementName": "Vitamin D3",
      "dosageAmount": 5000,
      "dosageUnit": "IU",
      "timing": "morning",
      "frequency": "daily",
      "goal": "Health",
      "reasonToTake": "Support immune function and bone health",
      "order": 1
    }
  ]
}
```

---

### ✅ Comprehensive Supplement Details

**Each Supplement Stores**:
- **Basic Info**: Name, brand, form (capsule/powder/liquid)
- **Dosage**: Amount, unit (mg/g/IU/mcg)
- **Timing**: When to take (morning/evening/with meals/pre-workout)
- **Frequency**: How often (daily/twice daily/as needed)
- **Purpose**: Goal and detailed reason
- **Instructions**: Take with food/water, avoid with certain things
- **Cost**: Per serving, servings per container
- **Status**: Active/paused/discontinued

**Example**:
```json
{
  "supplementName": "Creatine Monohydrate",
  "brand": "Optimum Nutrition",
  "form": "powder",
  "dosageAmount": 5,
  "dosageUnit": "g",
  "timing": "post-workout",
  "frequency": "daily",
  "timesPerDay": 1,
  "goal": "Performance",
  "reasonToTake": "Increase strength and muscle mass",
  "takeWithFood": false,
  "takeWithWater": true,
  "avoidWith": ["caffeine"],
  "costPerServing": 0.15,
  "servingsPerContainer": 200
}
```

---

### ✅ Adherence Tracking

**Adherence Log** tracks:
- Scheduled date and time
- Whether taken (yes/no)
- Actual dosage vs planned
- Missed doses with reasons
- Side effects (description and severity 1-5)
- Perceived effectiveness (1-5)
- Notes

**Agent Uses This Data To**:
- Identify adherence patterns
- Detect side effects
- Assess effectiveness
- Adjust stack based on compliance
- Recommend timing changes

**Example Log Entry**:
```json
{
  "supplementId": "vitamin-d-uuid",
  "scheduledDate": "2026-03-29",
  "scheduledTime": "morning",
  "taken": true,
  "takenAt": "2026-03-29T08:30:00Z",
  "plannedDosageAmount": 5000,
  "actualDosageAmount": 5000,
  "dosageUnit": "IU",
  "sideEffectsReported": false,
  "perceivedEffectiveness": 4
}
```

---

### ✅ Interaction Checking

**Supplement Interactions Table** stores:
- Supplement name
- Interacts with (supplement/medication/food)
- Severity (mild/moderate/severe)
- Description
- Recommendation

**Helper Function**: `check_supplement_interactions()`
- Takes array of supplement names
- Returns all interactions
- Sorted by severity

**Example Interaction**:
```json
{
  "supplementName": "Calcium",
  "interactsWith": "Iron",
  "interactionType": "supplement",
  "severity": "moderate",
  "interactionDescription": "Calcium can reduce iron absorption",
  "recommendation": "Take 2 hours apart"
}
```

---

### ✅ Inventory Management

**Inventory Table** tracks:
- Current servings remaining
- Reorder threshold (days of supply)
- Needs reorder flag
- Purchase history
- Expiration dates

**Auto-Update**: Trigger decrements inventory when adherence logged

**Reorder Alerts**:
```json
{
  "supplementName": "Vitamin D3",
  "currentServings": 5,
  "daysRemaining": 5,
  "needsReorder": true,
  "lastPurchaseCost": 12.99,
  "vendor": "Amazon"
}
```

---

## Database Schema Details

### Table: `supplement_stack_versions`

**Purpose**: Store versioned supplement stacks

**Key Fields**:
- `version_number`: Sequential version (1, 2, 3...)
- `is_current`: Only one current version per user
- `created_by`: 'user' or 'agent'
- `created_reason`: Why this version was created
- `effective_from/to`: Date range for this version

**Trigger**: Automatically sets `is_current=false` for old versions

---

### Table: `supplements`

**Purpose**: Individual supplements in a stack

**Key Fields**:
- `supplement_name`: "Vitamin D3"
- `dosage_amount`: 5000
- `dosage_unit`: "IU"
- `timing`: "morning"
- `frequency`: "daily"
- `goal`: "Health"
- `reason_to_take`: Detailed explanation
- `status`: 'active', 'paused', 'discontinued'
- `supplement_order`: Order in stack

---

### Table: `supplement_adherence_log`

**Purpose**: Track actual intake vs planned

**Key Fields**:
- `scheduled_date`: When it should be taken
- `taken`: Boolean
- `missed`: Boolean with reason
- `side_effects_reported`: Boolean
- `side_effects_severity`: 1-5
- `perceived_effectiveness`: 1-5

**Indexes**: Optimized for querying by user, date, side effects

---

### Table: `supplement_stack_changes`

**Purpose**: Audit trail of modifications

**Key Fields**:
- `change_type`: 'supplement_added', 'dosage_changed', etc.
- `old_value` → `new_value`
- `reason`: Why it changed
- `triggered_by_bloodwork`: Boolean
- `triggered_by_side_effects`: Boolean
- `triggered_by_adherence`: Boolean
- `triggered_by_performance`: Boolean

**Example Change**:
```json
{
  "change_type": "supplement_added",
  "supplementName": "Magnesium",
  "newValue": "400mg before bed",
  "reason": "Low magnesium in bloodwork",
  "triggeredByBloodwork": true
}
```

---

### Table: `supplement_baseline_documents`

**Purpose**: Store uploaded Excel/document metadata

**Key Fields**:
- `file_name`: "My_Supplements.xlsx"
- `processing_status`: 'pending', 'processing', 'completed', 'failed'
- `extracted_text`: Raw OCR text
- `parsed_supplement_data`: Structured JSON

---

### Table: `supplement_interactions`

**Purpose**: Known interactions database

**Key Fields**:
- `supplement_name`: "Calcium"
- `interacts_with`: "Iron"
- `severity`: 'mild', 'moderate', 'severe'
- `recommendation`: "Take 2 hours apart"

---

### Table: `supplement_inventory`

**Purpose**: Track inventory and reorder needs

**Key Fields**:
- `current_servings`: Current amount
- `reorder_threshold`: Days before reorder
- `needs_reorder`: Boolean flag
- `expiration_date`: When it expires

**Trigger**: Auto-updates when adherence logged

---

## Helper Functions

### `get_current_supplement_stack(user_id)`

**Purpose**: Get complete current supplement stack

**Returns**: Table with all active supplements

**Example**:
```sql
SELECT * FROM get_current_supplement_stack('default-user');
```

**Returns**:
```
supplement_name | dosage_amount | dosage_unit | timing  | goal    | reason_to_take
----------------|---------------|-------------|---------|---------|----------------
Vitamin D3      | 5000          | IU          | morning | Health  | Immune support
Creatine        | 5             | g           | post-wo | Perform | Strength gains
```

---

### `calculate_supplement_adherence(supplement_id, days)`

**Purpose**: Calculate adherence rate for a supplement

**Returns**: Percentage (0-100)

**Example**:
```sql
SELECT calculate_supplement_adherence('vitamin-d-uuid', 30);
-- Returns: 85.71 (30 out of 35 scheduled doses taken)
```

---

### `check_supplement_interactions(supplement_names[])`

**Purpose**: Check for interactions in a stack

**Returns**: Table of interactions sorted by severity

**Example**:
```sql
SELECT * FROM check_supplement_interactions(ARRAY['Calcium', 'Iron', 'Vitamin D']);
```

**Returns**:
```
supplement1 | supplement2 | severity | description              | recommendation
------------|-------------|----------|--------------------------|----------------
Calcium     | Iron        | moderate | Reduces iron absorption  | Take 2h apart
```

---

## Views

### `supplement_adherence_summary`

**Purpose**: Aggregated adherence metrics per supplement

**Columns**:
- `total_scheduled`: Total doses scheduled
- `total_taken`: Total doses taken
- `adherence_percentage`: Adherence rate
- `side_effects_count`: Number of side effect reports
- `avg_effectiveness`: Average effectiveness rating

---

## API Endpoints (To Be Built)

### Upload Supplement Baseline
```
POST /supplement/baseline/upload
Body: { file, userId }
Response: { success, stackVersionId }
```

### Get Current Supplement Stack
```
GET /supplement/stack/current/:userId
Response: { success, data: CompleteSupplementStack }
```

### Get Supplement History
```
GET /supplement/stack/history/:userId
Response: { success, data: { versions, changes } }
```

### Log Supplement Adherence
```
POST /supplement/adherence/log
Body: { userId, supplementId, date, taken, sideEffects }
Response: { success, logId }
```

### Update Supplement Stack (Agent)
```
POST /supplement/stack/update
Body: { userId, createdBy: 'agent', changes, reason }
Response: { success, newVersionId }
```

### Check Interactions
```
POST /supplement/interactions/check
Body: { supplementNames: ['Calcium', 'Iron'] }
Response: { success, interactions, hasInteractions }
```

---

## Example Workflows

### Workflow 1: Initial Baseline Upload

1. **User uploads Excel file**
   ```
   POST /supplement/baseline/upload
   ```

2. **System processes file**
   - Extracts text via OCR
   - Parses supplement structure
   - Creates `supplement_baseline_document` record

3. **System creates supplement stack**
   - Creates `supplement_stack_version` (version 1, created_by: 'user')
   - Creates `supplement` records for each supplement
   - Checks for interactions

4. **User can now view current stack**
   ```
   GET /supplement/stack/current/default-user
   ```

---

### Workflow 2: Agent Updates Stack

1. **Agent analyzes bloodwork results**
   - Detects low Vitamin D (15 ng/mL)
   - Recommends Vitamin D supplementation

2. **Agent creates new version**
   ```
   POST /supplement/stack/update
   {
     "userId": "default-user",
     "createdBy": "agent",
     "createdReason": "Low Vitamin D in bloodwork",
     "changes": [
       {
         "changeType": "supplement_added",
         "supplementName": "Vitamin D3",
         "newValue": {
           "dosageAmount": 5000,
           "dosageUnit": "IU",
           "timing": "morning",
           "goal": "Health",
           "reasonToTake": "Vitamin D level at 15 ng/mL (optimal: 40-60)"
         },
         "triggeredByBloodwork": true
       }
     ]
   }
   ```

3. **System creates new version**
   - Creates `supplement_stack_version` (version 2, created_by: 'agent')
   - Copies all supplements from version 1
   - Adds new Vitamin D3 supplement
   - Logs change in `supplement_stack_changes`
   - Checks for interactions
   - Sets version 2 as current

4. **User sees updated stack**
   - Dashboard shows "Your supplement stack was updated"
   - Can view changes: "Added Vitamin D3 5000 IU"
   - Can see reason: "Low Vitamin D in bloodwork (15 ng/mL)"

---

### Workflow 3: Track Adherence with Side Effects

1. **User takes supplement**
   - Takes Creatine as scheduled
   - Experiences mild stomach discomfort

2. **User logs adherence**
   ```
   POST /supplement/adherence/log
   {
     "userId": "default-user",
     "supplementId": "creatine-uuid",
     "scheduledDate": "2026-03-29",
     "scheduledTime": "post-workout",
     "taken": true,
     "takenAt": "2026-03-29T15:30:00Z",
     "plannedDosageAmount": 5,
     "actualDosageAmount": 5,
     "dosageUnit": "g",
     "sideEffectsReported": true,
     "sideEffectsDescription": "Mild stomach discomfort",
     "sideEffectsSeverity": 2
   }
   ```

3. **System stores log**
   - Creates `supplement_adherence_log` record
   - Updates inventory (decrements servings)
   - Flags side effect for agent review

4. **Agent analyzes side effects**
   - Detects pattern of stomach discomfort
   - Recommends taking with food
   - Creates new version with updated instructions

---

### Workflow 4: Inventory Reorder Alert

1. **User logs daily adherence**
   - System auto-decrements inventory

2. **Inventory reaches threshold**
   - `current_servings` = 7
   - `reorder_threshold` = 7
   - System sets `needs_reorder` = true

3. **User receives alert**
   ```
   GET /supplement/inventory/reorder-alerts/:userId
   ```
   
   **Response**:
   ```json
   {
     "alerts": [
       {
         "supplementName": "Vitamin D3",
         "currentServings": 7,
         "daysRemaining": 7,
         "lastPurchaseCost": 12.99,
         "vendor": "Amazon"
       }
     ]
   }
   ```

4. **User reorders supplement**
   - Updates inventory with new purchase
   - System resets `needs_reorder` flag

---

## Data Flow Diagram

```
Excel Upload
    ↓
supplement_baseline_documents (processing)
    ↓
Parsed JSON Data
    ↓
supplement_stack_versions (v1, user)
    ↓
supplements (Vitamin D, Creatine, etc.)
    ↓
User takes supplements
    ↓
supplement_adherence_log (actual intake)
    ↓
supplement_inventory (auto-update)
    ↓
Agent analyzes data
    ↓
supplement_stack_versions (v2, agent)
    ↓
supplement_stack_changes (audit trail)
```

---

## Agent Intelligence Integration

### How Agent Uses This Schema

1. **Reads Current Stack**
   - Queries `get_current_supplement_stack()`
   - Knows what user is taking

2. **Analyzes Adherence**
   - Reviews `supplement_adherence_log`
   - Calculates adherence rates
   - Identifies patterns

3. **Detects Issues**
   - Side effects reported
   - Low adherence
   - Interactions detected
   - Bloodwork indicates deficiency

4. **Makes Recommendations**
   - "Add Magnesium for sleep"
   - "Reduce Creatine dosage due to stomach issues"
   - "Take Calcium 2 hours apart from Iron"

5. **Updates Stack**
   - Creates new `supplement_stack_version`
   - Logs changes with reasons
   - User sees updated stack with explanations

6. **Tracks Results**
   - Monitors if changes improved adherence
   - Tracks effectiveness ratings
   - Adjusts future recommendations

---

## Migration File

**Location**: `server/src/migrations/20260329_create_supplement_schema.sql`

**To Run**:
```sql
-- Execute the migration file in your Supabase SQL editor
```

**What It Creates**:
- 7 tables
- 4 helper functions
- 3 triggers
- 1 view
- Multiple indexes for performance
- Comments and documentation

---

## TypeScript Types

**Location**: `server/src/types/supplementBaseline.ts`

**Key Types**:
- `SupplementStackVersion`
- `Supplement`
- `SupplementAdherenceLog`
- `SupplementStackChange`
- `SupplementBaselineDocument`
- `SupplementInteraction`
- `SupplementInventory`
- `CompleteSupplementStack` (with nested data)

**API Types**:
- `UploadSupplementBaselineRequest`
- `GetCurrentSupplementStackResponse`
- `LogSupplementAdherenceRequest`
- `UpdateSupplementStackRequest`
- `CheckInteractionsRequest`

---

## Next Steps

### To Complete Supplement System:

1. **Create Supplement Service** (`supplementBaselineService.ts`)
   - Upload processing logic
   - Excel parsing
   - Version management
   - Interaction checking

2. **Create Supplement Controller** (`supplementBaselineController.ts`)
   - API endpoint handlers
   - Request validation

3. **Create Supplement Routes** (`supplementBaselineRoutes.ts`)
   - Define API endpoints
   - Connect to controller

4. **Excel Parser** (`excelSupplementParser.ts`)
   - Parse your specific Excel format
   - Extract supplements
   - Handle variations

5. **Agent Integration**
   - Connect to recommendation engine
   - Implement stack update logic
   - Add change tracking

---

## Summary

### ✅ Schema Supports All Requirements

1. **Excel Upload** ✅
   - Document storage
   - OCR/parsing support
   - Structured data extraction

2. **Agent Management** ✅
   - Version history
   - Change tracking
   - Reason logging
   - Trigger identification

3. **Always-Available Stack** ✅
   - Current stack query
   - Historical versions
   - Change comparison

4. **Adherence Tracking** ✅
   - Intake logging
   - Side effects monitoring
   - Effectiveness ratings
   - Miss reasons

5. **Interaction Checking** ✅
   - Supplement-supplement interactions
   - Supplement-medication interactions
   - Severity classification
   - Recommendations

6. **Inventory Management** ✅
   - Auto-tracking
   - Reorder alerts
   - Cost tracking
   - Expiration monitoring

---

**The supplement schema is complete and ready for implementation!** 🎉
