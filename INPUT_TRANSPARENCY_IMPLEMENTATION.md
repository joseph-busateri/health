# Input Transparency Feature - Implementation Guide

## Overview
This feature adds complete transparency to all health engine detail screens, showing users exactly what data drives their health scores, where that data comes from, and whether it's real, calculated, or missing.

## Feature Flag
```bash
SHOW_DETAIL_SCREEN_INPUTS=true
```
- **Location**: `server/.env.example`
- **Default**: `true`
- **Purpose**: Controls whether detailed input metadata is included in API responses and displayed in UI

## Architecture

### Backend Components

#### 1. Type Definitions (`server/src/types/inputMetadata.ts`)
```typescript
export type InputSource = 
  | 'ACTUAL'        // Real data from database/integrations
  | 'MOCK'          // Mock/demo data for testing
  | 'HARDCODED'     // Hardcoded fallback values
  | 'DERIVED'       // Calculated from other inputs
  | 'NOT_AVAILABLE'; // Data not available

export interface InputMetadata {
  name: string;                      // Display name
  value: any;                        // Actual value
  source: InputSource;               // Source classification
  sourceDetails?: {
    table?: string;                  // Database table
    field?: string;                  // Database field
    integration?: string;            // Integration source
    derivedFrom?: string[];          // Derived from inputs
    formula?: string;                // Derivation formula
  };
  lastUpdated?: string;              // ISO timestamp
  unit?: string;                     // Unit of measurement
  category?: string;                 // Grouping category
}
```

#### 2. Cardiovascular Engine Implementation

**File**: `server/src/services/cardiovascularEngineService.ts`

**Key Functions**:
- `buildCardiovascularInputMetadata()`: Builds detailed metadata for all 16 cardiovascular inputs
- `getCardiovascularRecommendation()`: Extended to accept `contextData` parameter and build `detailedInputs` when feature flag enabled

**Inputs Tracked** (16 total):
1. Systolic Blood Pressure (mmHg) - ACTUAL from blood_pressure_readings
2. Diastolic Blood Pressure (mmHg) - ACTUAL from blood_pressure_readings
3. Resting Heart Rate (bpm) - ACTUAL from heart_rate_readings
4. Heart Rate Variability (ms) - ACTUAL from hrv_readings
5. Total Cholesterol (mg/dL) - ACTUAL from bloodwork_results
6. LDL Cholesterol (mg/dL) - ACTUAL from bloodwork_results
7. HDL Cholesterol (mg/dL) - ACTUAL from bloodwork_results
8. Triglycerides (mg/dL) - ACTUAL from bloodwork_results
9. VO2 Max (mL/kg/min) - ACTUAL from fitness_assessments
10. Age (years) - ACTUAL from baseline_profile
11. Smoking Status - ACTUAL from baseline_profile
12. Apolipoprotein B (mg/dL) - ACTUAL from bloodwork_results
13. Lipoprotein(a) (mg/dL) - ACTUAL from bloodwork_results
14. hs-CRP (mg/L) - ACTUAL from bloodwork_results
15. Body Fat % - ACTUAL from body_composition_scans
16. Stress Score - DERIVED from hrv, sleep_quality, activity_level
17. Recovery Score - DERIVED from hrv, sleep_duration, sleep_quality, resting_hr

**Categories**:
- `vitals`: Blood pressure, heart rate, HRV
- `bloodwork`: Cholesterol, lipids, inflammatory markers
- `fitness`: VO2 Max
- `demographics`: Age, smoking status
- `body_composition`: Body fat percentage
- `derived_metrics`: Stress score, recovery score

### Frontend Components

#### 1. Type Definitions (`mobile/src/types/inputMetadata.ts`)
Mirror of backend types for TypeScript consistency.

#### 2. InputDetailsPanel Component (`mobile/src/components/InputDetailsPanel.tsx`)

**Features**:
- ✅ Collapsible panel with expand/collapse toggle
- ✅ Color-coded source badges:
  - 🟢 Green: Real Data (ACTUAL)
  - 🔵 Blue: Calculated (DERIVED)
  - 🟡 Yellow: Mock Data (MOCK)
  - 🟠 Orange: Default (HARDCODED)
  - 🔴 Red: No Data (NOT_AVAILABLE)
- ✅ Category grouping (Vitals, Lab Results, Fitness, etc.)
- ✅ Formatted values with units
- ✅ Relative timestamps ("2 days ago", "Today", etc.)
- ✅ Integration source display ("via oura", "via apple_watch")
- ✅ Data source legend
- ✅ Scrollable content (max 400px height)
- ✅ Clean, minimal design matching app UX

**Props**:
```typescript
interface InputDetailsPanelProps {
  inputs: InputMetadata[];
  title?: string; // Default: "Underlying Inputs"
}
```

**Usage Example**:
```tsx
import { InputDetailsPanel } from '../components/InputDetailsPanel';

// In your screen component:
{cardioData?.detailedInputs && (
  <InputDetailsPanel 
    inputs={cardioData.detailedInputs}
    title="Cardiovascular Inputs"
  />
)}
```

## Implementation Status

### ✅ Completed
1. Feature flag added to `.env.example`
2. Backend type system created (`InputMetadata`, `InputSource`)
3. Cardiovascular engine fully implemented with detailed input metadata
4. Frontend `InputDetailsPanel` component created
5. Mobile type definitions created
6. README documentation updated

### 🚧 In Progress
1. Integration of `InputDetailsPanel` into `CardiovascularDashboardScreenV2`

### ⏳ Pending
1. Extend Recovery Engine with detailed input metadata
2. Extend Metabolic Engine with detailed input metadata
3. Extend Performance Engine with detailed input metadata
4. Extend Sexual Health Engine with detailed input metadata
5. Integrate `InputDetailsPanel` into all detail screens:
   - RecoveryDashboardScreen
   - MetabolicHealthDashboardScreen
   - PerformanceDashboardScreen
   - SexualHealthDashboardScreen

## Next Steps

### Step 1: Integrate into CardiovascularDashboardScreenV2
```tsx
// Add import
import { InputDetailsPanel } from '../components/InputDetailsPanel';

// Add to render (before closing ScrollView)
{cardioData?.detailedInputs && (
  <InputDetailsPanel 
    inputs={cardioData.detailedInputs}
    title="Cardiovascular Inputs"
  />
)}
```

### Step 2: Extend Recovery Engine
Create `buildRecoveryInputMetadata()` function similar to cardiovascular implementation.

**Inputs to Track**:
- Sleep Duration (hours)
- Sleep Quality Score
- Deep Sleep (hours)
- REM Sleep (hours)
- Sleep Efficiency (%)
- HRV (ms)
- Resting Heart Rate (bpm)
- Activity Strain
- Previous Day Workout Intensity
- Stress Score

### Step 3: Extend Metabolic Engine
Create `buildMetabolicInputMetadata()` function.

**Inputs to Track**:
- Fasting Glucose (mg/dL)
- HbA1c (%)
- Fasting Insulin (μIU/mL)
- HOMA-IR (calculated)
- Body Fat %
- Waist Circumference (inches)
- Weight Trend
- LDL Cholesterol (mg/dL)
- HDL Cholesterol (mg/dL)
- Triglycerides (mg/dL)

### Step 4: Extend Performance Engine
Create `buildPerformanceInputMetadata()` function.

**Inputs to Track**:
- VO2 Max (mL/kg/min)
- Recovery Score
- Training Load (7-day average)
- Workout Frequency
- Progressive Overload Adherence
- Sleep Quality
- Nutrition Adherence
- Supplement Adherence

### Step 5: Extend Sexual Health Engine
Create `buildSexualHealthInputMetadata()` function.

**Inputs to Track**:
- Total Testosterone (ng/dL)
- Free Testosterone (pg/mL)
- SHBG (nmol/L)
- Estradiol (pg/mL)
- LH (mIU/mL)
- FSH (mIU/mL)
- Prolactin (ng/mL)
- DHT (pg/mL)
- Age
- Body Fat %
- Sleep Quality
- Stress Score

## Testing Checklist

### Backend Testing
- [ ] Feature flag OFF: `detailedInputs` field not included in response
- [ ] Feature flag ON: `detailedInputs` field included with all inputs
- [ ] All input sources correctly classified (ACTUAL, DERIVED, NOT_AVAILABLE)
- [ ] Source details populated (table, field, integration)
- [ ] Timestamps formatted correctly
- [ ] Units included for all numeric values
- [ ] Categories assigned correctly

### Frontend Testing
- [ ] Panel collapses/expands correctly
- [ ] Source badges display correct colors
- [ ] Values formatted with units
- [ ] Timestamps display relative format
- [ ] Categories grouped correctly
- [ ] Scrolling works for long lists
- [ ] Legend displays correctly
- [ ] No UI regressions on detail screens

## Performance Considerations

1. **Lazy Loading**: Panel content only rendered when expanded
2. **Memoization**: Consider memoizing input metadata building if performance issues arise
3. **Caching**: Input metadata built once per API call, cached with record
4. **Feature Flag**: Can be disabled in production if needed

## Backward Compatibility

- ✅ `detailedInputs` field is optional in all record types
- ✅ Existing API contracts unchanged
- ✅ Feature flag controlled - no breaking changes
- ✅ Frontend gracefully handles missing `detailedInputs`

## Benefits

1. **Transparency**: Users see exactly what drives their scores
2. **Data Quality**: Easy to identify missing or mock data
3. **Debugging**: Developers can quickly diagnose data issues
4. **Trust**: Clear indication of real vs calculated vs missing data
5. **Education**: Users learn what metrics matter for their health

## Future Enhancements

1. **Sorting/Filtering**: Add ability to sort by source type or filter by category
2. **Search**: Add search bar for finding specific inputs
3. **Copy to Clipboard**: Add button to copy all input data for debugging
4. **Export**: Export input data as JSON or CSV
5. **Trends**: Show historical changes in input availability
6. **Alerts**: Notify when critical inputs become unavailable
