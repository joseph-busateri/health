# Body Composition Schema Design - Complete Documentation

**Date**: March 29, 2026  
**Status**: ✅ Complete  
**Purpose**: Support smart scale data (InBody S2, DEXA, etc.) with comprehensive body composition tracking

---

## Overview

This schema supports body composition data from various sources:
- **InBody scales** (S2, 570, 770, etc.)
- **DEXA scans**
- **Manual entry**
- **Other smart scales**

Based on the InBody S2 example provided, the schema captures:
- Core body composition metrics (water, lean mass, fat mass, weight)
- Segmental analysis (arms, legs, trunk)
- Metabolic metrics (BMR, TDEE)
- Health scores and ratings
- Trend tracking and anomaly detection
- Goal setting and progress monitoring

---

## InBody S2 Data Structure (From Example)

### **User Information**:
- ID: 6362816775
- Height: 6ft 03.0in
- Age: 24
- Gender: Male
- Test Date: 2025.XX.XX

### **Body Composition Analysis**:
1. **Total Body Water (lb)** - Total amount of water in body
2. **Dry Lean Mass (lb)** - For building muscles and strengthening bones
3. **Body Fat Mass (lb)** - For storing excess energy
4. **Weight (lb)** - Sum of the above

### **Muscle-Fat Analysis**:
- Visual chart showing muscle-fat balance

---

## Schema Architecture

### 3 Core Tables

1. **`body_composition_scans`** - Individual scan results
2. **`body_composition_documents`** - Uploaded scan images/PDFs
3. **`body_composition_goals`** - User/agent-defined goals

### 1 View

- **`body_composition_trends`** - Aggregated trends with change calculations

### 3 Helper Functions

- `get_latest_body_composition()` - Returns most recent scan
- `calculate_body_comp_progress()` - Calculates goal progress
- `detect_body_comp_anomalies()` - Detects health concerns

---

## Key Features

### ✅ Comprehensive Metrics Capture

**From InBody S2** (Baseline):
- Total Body Water (lb)
- Dry Lean Mass (lb)
- Body Fat Mass (lb)
- Weight (lb)

**Extended Metrics** (Full InBody/DEXA):
- Body Fat Percentage
- Skeletal Muscle Mass
- Visceral Fat Level
- BMI
- Basal Metabolic Rate (BMR)
- Bone Mineral Content
- Protein Mass
- Metabolic Age

**Segmental Analysis**:
- Right/Left Arm (muscle, fat, lean %)
- Trunk (muscle, fat, lean %)
- Right/Left Leg (muscle, fat, lean %)

**Advanced Metrics**:
- Intracellular/Extracellular Water
- ECW/ICW Ratio (edema indicator)
- Phase Angle (cellular health)
- Muscle Balance Score
- Upper/Lower Balance Score

---

### ✅ Multi-Source Support

**Scan Sources**:
- `inbody_s2` - InBody S2 scale
- `inbody_570` - InBody 570 scale
- `inbody_770` - InBody 770 scale
- `dexa` - DEXA scan
- `manual` - Manual entry
- `other_scale` - Other smart scales

**Auto-Detection**: System can detect scan source from uploaded image/PDF

---

### ✅ Trend Tracking

**Automatic Change Calculations**:
- Weight change from previous scan
- Body fat percentage change
- Muscle mass change
- Days since last scan

**View Query**:
```sql
SELECT * FROM body_composition_trends
WHERE user_id = 'default-user'
ORDER BY scan_date DESC;
```

**Returns**:
```
scan_date  | weight_lb | body_fat_% | weight_change | days_since_last
-----------|-----------|------------|---------------|----------------
2026-03-29 | 185.5     | 15.2       | -2.3          | 7
2026-03-22 | 187.8     | 15.8       | -1.5          | 7
```

---

### ✅ Goal Setting & Progress Tracking

**Goal Types**:
- `weight_loss` - Lose weight
- `muscle_gain` - Gain muscle mass
- `fat_loss` - Reduce body fat percentage
- `recomp` - Body recomposition (lose fat, gain muscle)
- `maintenance` - Maintain current composition

**Progress Calculation**:
```sql
SELECT calculate_body_comp_progress('goal-uuid');
-- Returns: 65.50 (65.5% progress toward goal)
```

**Example Goal**:
```json
{
  "goalName": "Cut to 12% body fat",
  "goalType": "fat_loss",
  "createdBy": "user",
  "targetBodyFatPercentage": 12.0,
  "targetDate": "2026-06-01",
  "weeklyRateOfChange": 0.5,
  "currentProgressPercentage": 65.5
}
```

---

### ✅ Anomaly Detection

**Automatic Health Checks**:
- Rapid weight loss (>2% per week)
- High visceral fat (>15)
- Low muscle mass (<35%)
- High body fat percentage
- Water retention (high ECW/ICW ratio)

**Function Call**:
```sql
SELECT * FROM detect_body_comp_anomalies('default-user', 'scan-uuid');
```

**Returns**:
```
anomaly_type      | severity | description                    | recommendation
------------------|----------|--------------------------------|------------------
high_visceral_fat | high     | Visceral fat level elevated    | Focus on cardio
low_muscle_mass   | moderate | Muscle mass below optimal      | Increase resistance training
```

---

## Database Schema Details

### Table: `body_composition_scans`

**Purpose**: Store individual body composition scan results

**Key Fields**:

**Scan Metadata**:
- `scan_date`: Date of scan
- `scan_source`: Source type (inbody_s2, dexa, etc.)
- `scan_id`: External scan ID if provided

**Demographics**:
- `height_inches`: Height at time of scan
- `age`: Age at time of scan
- `gender`: Male/female/other

**Core Measurements** (in pounds):
- `weight_lb`: Total weight
- `total_body_water_lb`: Total water
- `dry_lean_mass_lb`: Lean mass (muscle + bone + protein)
- `body_fat_mass_lb`: Fat mass

**Percentages**:
- `body_fat_percentage`: % body fat
- `lean_body_mass_percentage`: % lean mass
- `body_water_percentage`: % water

**Muscle**:
- `skeletal_muscle_mass_lb`: Skeletal muscle
- `skeletal_muscle_mass_percentage`: % skeletal muscle

**Fat Distribution**:
- `visceral_fat_level`: Visceral fat rating (1-20)
- `visceral_fat_area_cm2`: Visceral fat area
- `subcutaneous_fat_percentage`: Subcutaneous fat %

**Metabolic**:
- `basal_metabolic_rate_kcal`: BMR
- `total_energy_expenditure_kcal`: TDEE

**Body Metrics**:
- `bmi`: Body Mass Index
- `metabolic_age`: Metabolic age
- `body_type`: Athletic/standard/obese

**Segmental Analysis** (arms, legs, trunk):
- `right_arm_muscle_lb`, `left_arm_muscle_lb`, etc.
- `right_arm_fat_lb`, `left_arm_fat_lb`, etc.
- `right_arm_lean_percentage`, `left_arm_lean_percentage`, etc.

**Advanced Metrics**:
- `intracellular_water_lb`: ICW
- `extracellular_water_lb`: ECW
- `ecw_icw_ratio`: Edema indicator
- `phase_angle_degrees`: Cellular health

**Quality**:
- `scan_quality`: Excellent/good/fair/poor
- `notes`: User notes

---

### Table: `body_composition_documents`

**Purpose**: Store uploaded scan images/PDFs

**Key Fields**:
- `file_name`: "InBody_Scan_2026-03-29.jpg"
- `file_path`: Storage location
- `processing_status`: pending/processing/completed/failed
- `extracted_text`: Raw OCR text
- `parsed_scan_data`: Structured JSON
- `detected_source`: Auto-detected source type

**Processing Flow**:
1. Upload → `status='pending'`
2. OCR starts → `status='processing'`
3. Parse data → `status='completed'`
4. Create body composition scan from parsed data

---

### Table: `body_composition_goals`

**Purpose**: User/agent-defined body composition goals

**Key Fields**:
- `goal_name`: "Cut to 12% body fat"
- `goal_type`: weight_loss/muscle_gain/fat_loss/recomp/maintenance
- `created_by`: user/agent
- `target_weight_lb`: Target weight
- `target_body_fat_percentage`: Target body fat %
- `target_date`: Goal deadline
- `weekly_rate_of_change`: Expected rate (lbs/week)
- `status`: active/completed/paused/abandoned
- `current_progress_percentage`: Auto-calculated progress

---

### View: `body_composition_trends`

**Purpose**: Aggregated trends with automatic change calculations

**Columns**:
- Current scan metrics
- Previous scan metrics
- Change calculations (weight, body fat %, muscle)
- Days since last scan

**Auto-calculated**:
- `weight_change_lb`: Current - Previous
- `body_fat_change_percentage`: Current - Previous
- `muscle_change_lb`: Current - Previous

---

## Helper Functions

### `get_latest_body_composition(user_id)`

**Purpose**: Get most recent scan for user

**Returns**:
```sql
SELECT * FROM get_latest_body_composition('default-user');
```

**Result**:
```
scan_id | scan_date  | weight_lb | body_fat_% | lean_mass_lb | muscle_mass_lb | visceral_fat | bmi
--------|------------|-----------|------------|--------------|----------------|--------------|-----
uuid-1  | 2026-03-29 | 185.5     | 15.2       | 157.3        | 95.2           | 8            | 23.5
```

---

### `calculate_body_comp_progress(goal_id)`

**Purpose**: Calculate progress toward goal

**Logic**:
- Weight loss: `(starting - current) / (starting - target) * 100`
- Fat loss: `(starting% - current%) / (starting% - target%) * 100`
- Muscle gain: `(current - starting) / (target - starting) * 100`

**Returns**: Percentage (0-100)

---

### `detect_body_comp_anomalies(user_id, scan_id)`

**Purpose**: Detect health concerns

**Checks**:
1. **Rapid weight loss** (>2% per week) → Moderate severity
2. **High visceral fat** (>15) → High severity
3. **Low muscle mass** (<35%) → Moderate severity
4. **High body fat** (>25% male, >32% female) → Moderate severity
5. **Water retention** (ECW/ICW >0.40) → Moderate severity

**Returns**: Table of anomalies with recommendations

---

## API Endpoints (To Be Built)

### Upload Body Composition Scan
```
POST /body-composition/upload
Body: { file, userId }
Response: { success, scanId, documentId }
```

### Get Latest Scan
```
GET /body-composition/latest/:userId
Response: { success, data: BodyCompositionScan }
```

### Get Trends
```
GET /body-composition/trends/:userId?days=30
Response: { success, data: { trends, summary } }
```

### Create Goal
```
POST /body-composition/goal
Body: { userId, goalName, goalType, targets }
Response: { success, goalId }
```

### Get Goal Progress
```
GET /body-composition/goal/:goalId/progress
Response: { success, data: { goal, progress, onTrack } }
```

### Detect Anomalies
```
GET /body-composition/anomalies/:userId/:scanId
Response: { success, data: { anomalies, hasAnomalies } }
```

---

## Example Workflows

### Workflow 1: Upload InBody Scan

1. **User uploads InBody S2 image**
   ```
   POST /body-composition/upload
   ```

2. **System processes image**
   - Extracts text via OCR
   - Detects source: "inbody_s2"
   - Parses body composition data
   - Creates `body_composition_document` record

3. **System creates scan record**
   ```json
   {
     "userId": "default-user",
     "scanDate": "2026-03-29",
     "scanSource": "inbody_s2",
     "scanId": "6362816775",
     "heightInches": 75,
     "age": 24,
     "gender": "male",
     "weightLb": 185.5,
     "totalBodyWaterLb": 115.2,
     "dryLeanMassLb": 42.1,
     "bodyFatMassLb": 28.2
   }
   ```

4. **System calculates derived metrics**
   - Body fat percentage: (28.2 / 185.5) * 100 = 15.2%
   - Lean body mass percentage: 84.8%
   - BMI: weight / (height^2) * 703

5. **System checks for anomalies**
   - Runs `detect_body_comp_anomalies()`
   - Returns any health concerns

6. **User sees results**
   - Dashboard shows latest scan
   - Trends show changes from previous scan
   - Anomalies displayed if any

---

### Workflow 2: Track Progress Toward Goal

1. **User sets goal**
   ```
   POST /body-composition/goal
   {
     "userId": "default-user",
     "goalName": "Cut to 12% body fat",
     "goalType": "fat_loss",
     "createdBy": "user",
     "targetBodyFatPercentage": 12.0,
     "targetDate": "2026-06-01",
     "startingScanId": "current-scan-uuid"
   }
   ```

2. **System creates goal**
   - Links to starting scan (15.2% body fat)
   - Calculates weekly rate needed: (15.2 - 12.0) / 10 weeks = 0.32% per week

3. **User uploads new scan weekly**
   - Week 1: 14.9% body fat
   - Week 2: 14.5% body fat
   - Week 3: 14.2% body fat

4. **System calculates progress**
   ```sql
   SELECT calculate_body_comp_progress('goal-uuid');
   -- Returns: 31.25% (1.0% lost out of 3.2% target)
   ```

5. **System determines if on track**
   - Expected: 0.96% lost (3 weeks * 0.32%)
   - Actual: 1.0% lost
   - **On track!** ✅

6. **Dashboard shows**
   - Progress bar: 31.25%
   - Trend chart: Downward trajectory
   - Estimated completion: May 25, 2026

---

### Workflow 3: Agent Detects Anomaly

1. **User uploads scan**
   - Visceral fat level: 18
   - Body fat percentage: 28%

2. **System runs anomaly detection**
   ```sql
   SELECT * FROM detect_body_comp_anomalies('default-user', 'scan-uuid');
   ```

3. **Anomalies detected**
   ```
   high_visceral_fat | high     | Visceral fat level is elevated (>15)
   high_body_fat     | moderate | Body fat percentage is above healthy range
   ```

4. **Agent creates recommendations**
   - "Increase cardiovascular exercise to 150 min/week"
   - "Reduce caloric intake by 300 kcal/day"
   - "Focus on whole foods, reduce processed foods"

5. **User receives alert**
   - Dashboard shows health warning
   - Recommendations displayed
   - Option to create goal to address issues

---

## Data Flow Diagram

```
Image Upload (InBody S2)
    ↓
body_composition_documents (processing)
    ↓
OCR Extraction
    ↓
Parsed JSON Data
    ↓
body_composition_scans (new record)
    ↓
Automatic Calculations
    ↓
body_composition_trends (view updated)
    ↓
Anomaly Detection
    ↓
Agent Recommendations
    ↓
User Dashboard Update
```

---

## Parsed Data Structure (InBody S2)

**From Image**:
```json
{
  "scanId": "6362816775",
  "height": "6ft 03.0in",
  "age": 24,
  "gender": "male",
  "testDate": "2025.03.29",
  "weight": 185.5,
  "weightUnit": "lb",
  "totalBodyWater": 115.2,
  "dryLeanMass": 42.1,
  "bodyFatMass": 28.2,
  "rawFields": {
    "id": "6362816775",
    "height_ft": 6,
    "height_in": 3.0,
    "age": 24,
    "gender": "Male"
  }
}
```

**Stored in Database**:
```sql
INSERT INTO body_composition_scans (
  user_id,
  scan_date,
  scan_source,
  scan_id,
  height_inches,
  age,
  gender,
  weight_lb,
  total_body_water_lb,
  dry_lean_mass_lb,
  body_fat_mass_lb
) VALUES (
  'default-user',
  '2026-03-29',
  'inbody_s2',
  '6362816775',
  75,
  24,
  'male',
  185.5,
  115.2,
  42.1,
  28.2
);
```

---

## Integration with Existing System

### **Dashboard Integration**

**Body Composition Section**:
```typescript
const latestScan = await getLatestBodyComposition(userId);

// Display on dashboard
<BodyCompositionCard>
  <Weight>{latestScan.weightLb} lb</Weight>
  <BodyFat>{latestScan.bodyFatPercentage}%</BodyFat>
  <LeanMass>{latestScan.dryLeanMassLb} lb</LeanMass>
  <VisceralFat>Level {latestScan.visceralFatLevel}</VisceralFat>
</BodyCompositionCard>
```

---

### **Trends Integration**

**Trends Screen**:
```typescript
const trends = await getBodyCompositionTrends(userId, 30);

// Display chart
<LineChart data={trends.map(t => ({
  date: t.scanDate,
  weight: t.weightLb,
  bodyFat: t.bodyFatPercentage
}))} />
```

---

### **Agent Integration**

**Agent uses body composition data to**:
- Adjust workout intensity based on muscle mass trends
- Recommend caloric intake based on BMR and goals
- Suggest supplements based on body composition
- Modify training volume based on recovery and body fat trends

**Example**:
```typescript
if (latestScan.bodyFatPercentage > 20 && goal.goalType === 'fat_loss') {
  agent.recommend({
    type: 'nutrition',
    message: 'Increase protein to 1g/lb bodyweight',
    reason: 'Support muscle retention during fat loss'
  });
}
```

---

## Migration File

**Location**: `server/src/migrations/20260329_create_body_composition_schema.sql`

**To Run**:
```sql
-- Execute the migration file in your Supabase SQL editor
```

**What It Creates**:
- 3 tables
- 1 view
- 3 helper functions
- 2 triggers
- Multiple indexes for performance
- Comments and documentation

---

## TypeScript Types

**Location**: `server/src/types/bodyComposition.ts`

**Key Types**:
- `BodyCompositionScan`
- `BodyCompositionDocument`
- `BodyCompositionGoal`
- `BodyCompositionTrend`
- `BodyCompositionAnomaly`
- `ParsedScanData`

**API Types**:
- `UploadBodyCompositionDocumentRequest`
- `GetLatestBodyCompositionResponse`
- `GetBodyCompositionTrendsResponse`
- `GetBodyCompositionGoalProgressResponse`
- `DetectAnomaliesResponse`

---

## Next Steps

### To Complete Body Composition System:

1. **Create Body Composition Service** (`bodyCompositionService.ts`)
   - Upload processing logic
   - InBody image parsing
   - Scan data extraction

2. **Create Body Composition Controller** (`bodyCompositionController.ts`)
   - API endpoint handlers
   - Request validation

3. **Create Body Composition Routes** (`bodyCompositionRoutes.ts`)
   - Define API endpoints
   - Connect to controller

4. **InBody Parser** (`inbodyParser.ts`)
   - Parse InBody S2 format
   - Extract all metrics
   - Handle variations

5. **Agent Integration**
   - Connect to recommendation engine
   - Implement anomaly alerts
   - Add goal tracking

---

## Summary

### ✅ Schema Supports All Requirements

1. **InBody S2 Data** ✅
   - Total Body Water
   - Dry Lean Mass
   - Body Fat Mass
   - Weight
   - User demographics

2. **Extended Metrics** ✅
   - Segmental analysis
   - Metabolic metrics
   - Advanced health indicators

3. **Trend Tracking** ✅
   - Automatic change calculations
   - Historical comparisons
   - Progress visualization

4. **Goal Setting** ✅
   - Multiple goal types
   - Progress tracking
   - On-track indicators

5. **Anomaly Detection** ✅
   - Health concern identification
   - Severity classification
   - Recommendations

6. **Multi-Source Support** ✅
   - InBody scales (S2, 570, 770)
   - DEXA scans
   - Manual entry
   - Other smart scales

---

**The body composition schema is complete and ready for implementation!** 🎉
