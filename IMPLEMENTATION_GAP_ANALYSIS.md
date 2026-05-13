# Implementation Gap Analysis - User Requirements vs Current State

## What Was Already Implemented (Previous Session)

### ✅ COMPLETED
1. **Risk Label Scoring System** - Added 90/70/50/30 mapping to:
   - Metabolic Score (17 inputs)
   - Recovery Score (8 inputs)
   - Cardiovascular Score (18 inputs)
   - Performance/Joint Health Score (7 inputs)

2. **Backend Scoring Functions**
   - `calculateMetabolicInputScore()` - ✅ Complete
   - `calculateRecoveryInputScore()` - ✅ Complete
   - `calculateCardiovascularInputScore()` - ✅ Complete
   - `calculateJointHealthInputScore()` - ✅ Complete

3. **InputMetadata Type Extension**
   - Added `score` field to server and mobile types - ✅ Complete

4. **InputDetailsPanel Component**
   - Color-coded score badges (green/blue/orange/red) - ✅ Complete

## What User Is NOW Requesting (New Requirements)

### 🔴 NEW/DIFFERENT REQUIREMENTS

#### 1. RECOVERY SCORE
- **NEW**: Move inputs to TOP of screen (directly under main score)
- **NEW**: Must appear BEFORE recommendations/charts
- ✅ Already have: All 8 inputs with risk labels

#### 2. CARDIOVASCULAR SCORE
- **NEW**: Calculate Total Cholesterol from LDL + HDL (not from bloodwork directly)
- **NEW**: Calculate Total Cholesterol/HDL Ratio
- **NEW**: Move inputs ABOVE Recommendations section
- ✅ Already have: Risk labels on 18 inputs
- **GAP**: Need to verify if Total Cholesterol is calculated or pulled from DB

#### 3. METABOLIC SCORE
- **NEW**: Get weight from `body_composition_scan` table specifically
- ✅ Already have: Risk labels on 17 inputs
- **GAP**: Need to verify current weight source

#### 4. PERFORMANCE SCORE
- **NEW**: Move inputs to TOP of screen (directly under main score)
- **NEW**: Add missing inputs: `age`, `trainingExperience`, `weight`
- **NEW**: Currently shows 7, should show 10 total
- ✅ Already have: Risk labels on 7 inputs
- **GAP**: Need to add 3 missing inputs

#### 5. SEXUAL HEALTH SCORE
- **NEW**: Remove duplicative "Current Values" section
- **NEW**: Display all 25 available inputs (currently only shows 7)
- **NEW**: Full investigation needed
- ❌ Not implemented yet

## Critical Gaps to Address

### HIGH PRIORITY
1. **Cardiovascular Total Cholesterol Calculation**
   - User wants it CALCULATED from LDL + HDL
   - Need to check if it's currently pulled from bloodwork_results table
   - Need to add calculation logic if not present

2. **Performance Score Missing Inputs**
   - Add: age, trainingExperience, weight
   - Verify they're used in calculation
   - Add risk labels to all 3

3. **Sexual Health Score Full Implementation**
   - Identify active version (V1/V2/V3)
   - Remove "Current Values" section
   - Add all 25 inputs with risk labels
   - Verify which are used in calculation

### MEDIUM PRIORITY
4. **UI Positioning Changes**
   - Recovery: Inputs to top
   - Cardiovascular: Inputs above Recommendations
   - Performance: Inputs to top

5. **Metabolic Weight Source Verification**
   - Confirm it's from body_composition_scan
   - Update if needed

## Implementation Strategy

### Phase 1: Backend Fixes
1. Check Cardiovascular Total Cholesterol source
2. Add Total Cholesterol calculation if needed
3. Add Total Cholesterol/HDL Ratio calculation
4. Verify Metabolic weight source
5. Add Performance missing inputs (age, trainingExperience, weight)
6. Investigate Sexual Health inputs

### Phase 2: Frontend Positioning
1. Move Recovery inputs to top
2. Move Cardiovascular inputs above Recommendations
3. Move Performance inputs to top
4. Remove Sexual Health "Current Values" section

### Phase 3: Validation
1. Create validation summary table
2. Verify all calculations
3. Test all screens

