# Health Optimization Platform - System Architecture

**Last Updated:** March 30, 2026  
**Status:** ✅ Hybrid Approach Approved - Implementation Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Bloodwork System](#bloodwork-system)
3. [Workout System](#workout-system)
4. [Supplement System](#supplement-system)
5. [Recovery System](#recovery-system)
6. [Body Composition System](#body-composition-system)
7. [Joint Health System](#joint-health-system)
8. [Stress Management System](#stress-management-system)
9. [Architecture Decisions](#architecture-decisions)
10. [Implementation Status](#implementation-status)

---

## Overview

### Platform Purpose
AI-powered health optimization platform that tracks, analyzes, and provides personalized recommendations across multiple health domains.

### Core Philosophy
- **Data-driven**: Decisions based on actual measurements, not guesses
- **Trend-focused**: Track changes over time, not just snapshots
- **Actionable**: Provide specific recommendations, not just data
- **Integrated**: Systems work together for holistic health view

### Technology Stack
- **Backend**: Node.js + TypeScript + Express
- **Database**: Supabase (PostgreSQL)
- **Mobile**: React Native + Expo
- **AI**: OpenAI GPT-4 (for parsing/recommendations)
- **Storage**: Supabase Storage (documents/images)

---

## Bloodwork System

### Purpose
Upload lab results, extract biomarkers, track trends, generate recommendations.

### Data Flow - ✅ HYBRID APPROACH (APPROVED)

```
1. USER UPLOADS LAB DOCUMENT (PDF/Image)
   ↓
2. STORE FILE → Supabase Storage
   ↓
3. CREATE RECORD → bloodwork_documents table
   Status: 'uploaded'
   ↓
4. AUTOMATIC PROCESSING PIPELINE BEGINS
   ↓
5. OCR TEXT EXTRACTION (Traditional Computer Vision)
   - Extract text from PDF/image
   - Tool: Tesseract OCR or cloud OCR service
   - No AI needed - fast, free, deterministic
   - Service: ocrService.ts
   Status: 'parsing' (10%)
   ↓
6. PATTERN MATCHING (Rule-Based)
   - Try regex patterns for common lab formats
   - Quest Diagnostics format
   - LabCorp format  
   - Standard table layouts
   - Fast path: If confidence > 0.8, skip AI parsing
   - Service: bloodworkExtractionService.ts
   Status: 'parsing' (25%)
   ↓
7. AI PARSING (Fallback/Enhancement)
   - If patterns fail or confidence is low
   - Send text to OpenAI GPT-4
   - Extract structured data (markers, values, ranges, panels)
   - One-shot API call (not an agent)
   - Cost: $0.01-0.05 per document
   - Service: bloodworkExtractionService.ts (AI fallback)
   Status: 'extracting' (45%)
   ↓
8. NORMALIZATION (Rule-Based)
   - Standardize test names (LDL-C → LDL)
   - Map to categories (Cardiovascular, Metabolic, Hormonal)
   - Hard-coded dictionary lookups
   - Service: bloodworkNormalizationService.ts
   Status: 'extracting' (60%)
   ↓
9. SAVE RESULTS → bloodwork_results table
   - One row per biomarker
   - Includes: value, unit, range, confidence
   Status: 'extracting' (70%)
   ↓
10. TREND CALCULATION (Rule-Based)
    - Compare to historical data
    - Calculate percent change
    - Determine direction: improving/worsening/stable
    - Mathematical formulas, no AI
    - Service: bloodworkTrendService.ts
    Status: 'generating_trends' (85%)
    ↓
11. RECOMMENDATION GENERATION (Hybrid: Rules + AI)
    - STEP A: Rule-based trigger logic
      * Evaluate trends against clinical rules
      * Check thresholds (LDL > 100, HbA1c > 5.7, etc.)
      * Determine IF recommendation is needed
      * Assign severity (low/medium/high)
    - STEP B: AI-enhanced text generation
      * Send context to OpenAI GPT-4
      * Generate personalized recommendation text
      * Consider: user age, activity level, goals, history
      * Cost: $0.01-0.02 per recommendation
    - Service: bloodworkRecommendationService.ts
    Status: 'generating_recommendations' (95%)
    ↓
12. NOTIFY USER
    Status: 'complete' (100%)
    - Send notification: "Your bloodwork is ready"
    - Service: notificationService.ts
```

### Hybrid Architecture Benefits

**Cost-Effective:**
- OCR: Free (Tesseract) or $0.001 (cloud)
- Pattern matching: Free (80% of documents)
- AI parsing: $0.01-0.05 (only when needed)
- Trend calculation: Free (math)
- AI recommendations: $0.01-0.02 per recommendation
- **Total: $0.02-0.10 per document** (vs $0.30-0.75 for full AI agent)

**Fast:**
- Pattern matching: <1 second
- AI parsing: 2-5 seconds (only when needed)
- Trend calculation: <1 second
- AI recommendations: 2-3 seconds
- **Total: 5-10 seconds** (vs 30-60 seconds for AI agent)

**Reliable:**
- Rules provide consistent baseline behavior
- AI adds flexibility for edge cases
- Explainable results (can show which rule triggered)
- Predictable costs and performance

### Database Schema

#### bloodwork_documents
```
- id (uuid)
- user_id (uuid)
- file_url (text) - URL in Supabase Storage
- file_name (text)
- file_size (integer)
- mime_type (text)
- document_type (enum) - lipid, hormone, metabolic, comprehensive, etc.
- source (enum) - manual_upload, quest, labcorp, etc.
- test_date (date) - When labs were drawn
- upload_date (timestamp)
- parse_status (enum) - pending, processing, parsed, failed
- extraction_confidence (float) - 0.0-1.0
- processing_status (enum) - uploaded, parsing, extracting, generating_trends, generating_recommendations, complete, failed
- processing_progress (integer) - 0-100%
- processing_error (text)
- processing_started_at (timestamp)
- processing_completed_at (timestamp)
- notes (text)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

#### bloodwork_results
```
- id (uuid)
- document_id (uuid) - FK to bloodwork_documents
- panel_id (uuid) - FK to bloodwork_panels
- user_id (uuid)
- panel_name (text) - e.g., "Lipid Panel"
- raw_test_name (text) - Original name from lab
- normalized_test_name (text) - Standardized name
- category (text) - Cardiovascular, Metabolic, Hormonal, etc.
- sub_category (text)
- value_text (text) - Original value as text
- value_numeric (float) - Parsed numeric value
- unit (text) - mg/dL, ng/dL, %, etc.
- reference_range_low (float)
- reference_range_high (float)
- reference_range_text (text)
- abnormal_flag (text) - Normal, High, Low, Critical
- abnormal_flag_source (text) - lab or calculated
- confidence (float) - 0.0-1.0 extraction confidence
- test_date (date)
- lab_timestamp (timestamp)
- source (text)
- source_lab (text)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### bloodwork_trends
```
- id (uuid)
- user_id (uuid)
- marker_name (text)
- category (text)
- data_points (integer) - Number of historical readings
- trend_direction (enum) - improving, worsening, stable, insufficient_data
- percent_change (float)
- latest_value (text)
- latest_value_numeric (float)
- previous_value (text)
- previous_value_numeric (float)
- first_test_date (date)
- latest_test_date (date)
- unit (text)
- target_range_status (enum) - within, above, below
- trend_summary (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### bloodwork_recommendations
```
- id (uuid)
- user_id (uuid)
- recommendation_type (enum) - cardiovascular, metabolic, hormonal, inflammation, lifestyle
- severity (enum) - low, medium, high, critical
- title (text)
- message (text) - User-friendly explanation
- rationale (text) - Clinical reasoning
- related_markers (text[]) - Array of marker names
- status (enum) - active, acknowledged, dismissed, expired
- confidence (float) - 0.0-1.0
- expires_at (timestamp)
- acknowledged_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

### API Endpoints

#### Document Management
- `POST /bloodwork/upload` - Upload lab document
- `GET /bloodwork/documents/:user_id` - List all documents
- `GET /bloodwork/documents/:document_id` - Get specific document
- `PUT /bloodwork/documents/:document_id` - Update document metadata
- `DELETE /bloodwork/documents/:document_id` - Delete document

#### Results
- `POST /bloodwork/parse/:document_id` - Trigger parsing
- `GET /bloodwork/results/:user_id` - All results for user
- `GET /bloodwork/results/document/:document_id` - Results from specific document
- `GET /bloodwork/results/:user_id/timeline` - Chronological view
- `PUT /bloodwork/results/:id` - Update result
- `DELETE /bloodwork/results/document/:document_id` - Delete results

#### Trends
- `GET /bloodwork/trends/:user_id` - All trends
- `GET /bloodwork/trends/:user_id/summary` - High-level overview
- `GET /bloodwork/trends/supported-markers` - List of tracked markers
- `GET /bloodwork/trends/categories` - Available categories

#### Recommendations
- `POST /bloodwork/recommendations/generate/:user_id` - Generate recommendations
- `GET /bloodwork/recommendations/:user_id` - All recommendations
- `GET /bloodwork/recommendations/:user_id/active` - Active recommendations only
- `POST /bloodwork/recommendations` - Create manual recommendation
- `PUT /bloodwork/recommendations/:id/status` - Update status

### Services

#### bloodworkDocumentService.ts
**Purpose:** CRUD operations for bloodwork documents  
**Functions:**
- `uploadBloodworkDocument()` - Create document record
- `getBloodworkDocuments()` - List with filters
- `getBloodworkDocument()` - Get single document
- `updateBloodworkDocument()` - Update metadata
- `deleteBloodworkDocument()` - Delete document
- `getBloodworkTimeline()` - Chronological view
- `getBloodworkStats()` - Statistics

#### bloodworkProcessingService.ts
**Purpose:** Orchestrate the processing pipeline  
**Functions:**
- `processBloodworkDocument()` - Main pipeline orchestrator
- `getDocumentProcessingStatus()` - Check progress
- `resetProcessingForRetry()` - Retry failed processing

**Pipeline Steps:**
1. Update status to 'parsing'
2. Call OCR service
3. Update status to 'extracting'
4. Call extraction service
5. Update status to 'generating_trends'
6. Call trend service
7. Update status to 'generating_recommendations'
8. Call recommendation service
9. Update status to 'complete'
10. Send notification

#### bloodworkExtractionService.ts
**Purpose:** Extract structured data from text  
**Functions:**
- `parseBloodworkDocument()` - Main extraction function
- `extractTextFromBuffer()` - OCR wrapper
- `parseReferenceRange()` - Parse range strings
- `detectPanels()` - Identify panel types
- `extractMarkers()` - Find individual markers

**Extraction Logic:**
- Uses regex patterns for common formats
- Falls back to AI parsing for complex documents
- Assigns confidence scores
- Handles multiple panel types

#### bloodworkNormalizationService.ts
**Purpose:** Standardize test names and categorize  
**Functions:**
- `normalizeBloodworkMarker()` - Standardize marker name
- `categorizeMarker()` - Assign category
- `mapToStandardUnit()` - Convert units

**Normalization Rules:**
- LDL-C, LDL Cholesterol, Low Density Lipoprotein → "LDL"
- HDL-C, HDL Cholesterol, High Density Lipoprotein → "HDL"
- HbA1c, A1c, Hemoglobin A1c → "HbA1c"
- etc.

#### bloodworkTrendService.ts
**Purpose:** Calculate trends over time  
**Architecture:** **RULE-BASED** (not AI)  
**Functions:**
- `getBloodworkTrendsByUser()` - Calculate all trends
- `getBloodworkTrendSummary()` - Summary view
- `getSupportedMarkers()` - List tracked markers
- `getMarkersByCategory()` - Group by category

**Trend Calculation Logic:**
```typescript
1. Fetch historical data for marker
2. Look up marker rule (direction, target range, threshold)
3. Calculate percent change
4. Determine trend direction:
   - If change < threshold → 'stable'
   - If 'lower_is_better' and decreasing → 'improving'
   - If 'higher_is_better' and increasing → 'improving'
   - If 'target_range' → check if moving toward range
5. Compare to target ranges
6. Generate summary text
```

**Marker Rules (Hard-coded):**
- LDL: lower_is_better, max 100 mg/dL, threshold 5%
- HDL: higher_is_better, min 40 mg/dL, threshold 5%
- Triglycerides: lower_is_better, max 150 mg/dL, threshold 10%
- HbA1c: lower_is_better, max 5.7%, threshold 3%
- Testosterone: higher_is_better, min 300 ng/dL, threshold 10%
- etc. (15+ markers defined)

#### bloodworkRecommendationService.ts
**Purpose:** Generate personalized recommendations  
**Architecture:** **RULE-BASED** (could be AI-enhanced)  
**Functions:**
- `generateBloodworkRecommendationsForUser()` - Generate all recommendations
- `getBloodworkRecommendationsByUser()` - Fetch recommendations
- `getActiveBloodworkRecommendationsByUser()` - Active only
- `createBloodworkRecommendation()` - Manual creation
- `markBloodworkRecommendationStatus()` - Update status

**Recommendation Logic:**
```typescript
1. Fetch trends for user
2. For each trend, evaluate against recommendation rules
3. Rules check:
   - Trend direction (worsening?)
   - Value threshold (above/below target?)
   - Minimum data points (enough history?)
   - Percent change threshold
4. If rule matches:
   - Generate recommendation from template
   - Assign severity
   - Calculate confidence
   - Set expiration
5. Save to database
```

**Recommendation Rules (Hard-coded):**
- LDL > 100 + worsening → "LDL Cholesterol Increasing" (medium severity)
- LDL > 130 + worsening → "High LDL Detected" (high severity)
- HbA1c > 5.7 + worsening → "HbA1c Rising" (medium severity)
- HbA1c > 6.5 + worsening → "High HbA1c Detected" (high severity)
- etc. (20+ rules defined)

### Implementation Status

#### ✅ Fully Implemented
- Document upload and storage
- Database schema and tables
- Processing pipeline orchestration
- Trend calculation (rule-based)
- Recommendation generation (rule-based)
- All API endpoints
- All controllers
- All services (except AI components)

#### ⚠️ Stubbed (Needs Implementation)
- **OCR Service** - Text extraction from PDFs/images
- **AI Parsing** - Structured data extraction from text
- **Notification Service** - User alerts

#### ❌ Not Implemented
- Mobile UI screens
- Database seeding with sample data
- Integration tests
- AI-enhanced recommendations (optional)

### Architecture Decisions

#### Decision 1: Trend Calculation
**Status:** ✅ DECIDED - Rule-Based  
**Rationale:**
- Predictable and explainable
- Based on clinical guidelines
- Fast and free
- Easy to debug and maintain

**Alternative Considered:** AI-based trend analysis  
**Why Not:** Adds complexity, cost, and unpredictability without clear benefit for simple trend calculations

#### Decision 2: Document Parsing
**Status:** ⚠️ NEEDS DECISION  
**Options:**
1. **Pure AI** - Send entire document to GPT-4 Vision
   - Pros: Handles any format, very flexible
   - Cons: Expensive ($0.01-0.10 per document), slower
2. **Hybrid** - OCR + regex patterns + AI fallback
   - Pros: Fast for common formats, cost-effective
   - Cons: More complex, needs maintenance
3. **Pure Rules** - Regex patterns only
   - Pros: Free, fast, predictable
   - Cons: Brittle, won't handle variations

**Recommendation:** Hybrid approach

#### Decision 3: Recommendations
**Status:** ⚠️ NEEDS DECISION  
**Current:** Rule-based templates  
**Options:**
1. **Keep rule-based** - Simple, predictable
2. **AI-enhanced** - Personalized, contextual
3. **Hybrid** - Rules trigger, AI generates text

**Recommendation:** Start with rules, add AI enhancement later

---

## Workout System

### Purpose
Track workout plans, log executions, analyze progress, optimize training.

### Data Flow

```
1. USER UPLOADS WORKOUT DOCUMENT (PDF/Image)
   - Training program from coach
   - Workout template
   ↓
2. STORE FILE → Supabase Storage
   ↓
3. CREATE RECORD → workout_documents table
   ↓
4. AI PARSING
   - Extract exercises, sets, reps, weights
   - Identify training split (Push/Pull/Legs, Upper/Lower, etc.)
   - Parse progression scheme
   ↓
5. CREATE TRAINING CYCLE
   - Define cycle duration (e.g., 12 weeks)
   - Set goals (strength, hypertrophy, endurance)
   ↓
6. CREATE WORKOUT PLAN VERSION
   - Current active plan
   - Split days (e.g., Day 1: Upper, Day 2: Lower)
   - Exercises per day
   ↓
7. USER LOGS WORKOUT EXECUTION
   - Actual sets, reps, weights performed
   - RPE (Rate of Perceived Exertion)
   - Notes
   ↓
8. ANALYZE PERFORMANCE
   - Compare to plan
   - Track volume (sets × reps × weight)
   - Identify PRs (Personal Records)
   ↓
9. GENERATE RECOMMENDATIONS
   - Deload suggestions
   - Exercise substitutions
   - Progression adjustments
```

### Database Schema

#### workout_documents
```
- id (uuid)
- user_id (uuid)
- file_url (text)
- file_name (text)
- document_type (enum) - program, template, log
- upload_date (timestamp)
- parse_status (enum)
- metadata (jsonb)
```

#### training_cycles
```
- id (uuid)
- user_id (uuid)
- name (text) - e.g., "Spring 2026 Strength Block"
- start_date (date)
- end_date (date)
- goal (enum) - strength, hypertrophy, endurance, power
- status (enum) - active, completed, paused
- notes (text)
```

#### workout_plan_versions
```
- id (uuid)
- user_id (uuid)
- cycle_id (uuid)
- version_number (integer)
- is_current (boolean)
- split_type (text) - e.g., "Upper/Lower", "PPL"
- frequency (integer) - days per week
- created_at (timestamp)
```

#### workout_split_days
```
- id (uuid)
- plan_version_id (uuid)
- day_name (text) - e.g., "Upper A", "Push Day"
- day_order (integer)
- description (text)
```

#### workout_exercises
```
- id (uuid)
- split_day_id (uuid)
- exercise_name (text)
- exercise_order (integer)
- sets (integer)
- reps_min (integer)
- reps_max (integer)
- rest_seconds (integer)
- rpe_target (float) - 1-10 scale
- notes (text)
```

#### workout_executions
```
- id (uuid)
- user_id (uuid)
- split_day_id (uuid)
- execution_date (date)
- duration_minutes (integer)
- overall_rpe (float)
- notes (text)
```

#### workout_execution_sets
```
- id (uuid)
- execution_id (uuid)
- exercise_id (uuid)
- set_number (integer)
- reps (integer)
- weight (float)
- rpe (float)
- notes (text)
```

### API Endpoints

- `POST /workout/upload` - Upload workout document
- `POST /workout/cycle` - Create training cycle
- `GET /workout/cycle/:user_id` - Get current cycle
- `POST /workout/plan` - Create workout plan version
- `GET /workout/plan/:user_id` - Get current plan
- `POST /workout/execution` - Log workout
- `GET /workout/execution/:user_id` - Get execution history
- `GET /workout/test/:user_id` - Test endpoint with mock data

### Services

#### workoutBaselineService.ts
**Purpose:** Manage workout plans and executions  
**Architecture:** **RULE-BASED** + **AI PARSING**

#### workoutTrackingEngine.ts (Stub)
**Purpose:** Track progress, identify PRs, calculate volume  
**Status:** ⚠️ Needs Implementation

### Implementation Status

#### ✅ Implemented
- Document upload
- Database schema
- API endpoints
- Basic CRUD operations
- Test endpoint with mock data

#### ⚠️ Stubbed
- AI document parsing
- Progress tracking
- Recommendation engine

#### ❌ Not Implemented
- Mobile UI
- Volume calculations
- PR detection
- Deload recommendations

### Architecture Decisions

#### Decision 1: Workout Parsing
**Status:** ⚠️ NEEDS DECISION  
**Options:**
1. AI parsing (flexible, handles any format)
2. Manual entry (simple, no parsing needed)
3. Hybrid (templates + AI for custom programs)

---

## Supplement System

### Purpose
Track supplement intake, generate recommendations, monitor adherence.

### Data Flow

```
1. USER UPLOADS SUPPLEMENT DOCUMENT
   - Current supplement stack
   - Bloodwork-based recommendations
   ↓
2. CREATE SUPPLEMENT BASELINE
   - Current supplements
   - Dosages, timing, purpose
   ↓
3. ANALYZE BLOODWORK + GOALS
   - Identify deficiencies
   - Consider training goals
   - Check interactions
   ↓
4. GENERATE RECOMMENDATIONS
   - Suggest additions/removals
   - Optimize dosages
   - Timing recommendations
   ↓
5. USER LOGS ADHERENCE
   - Daily check-ins
   - Track consistency
   ↓
6. EVALUATE EFFECTIVENESS
   - Compare bloodwork trends
   - Assess goal progress
   - Adjust recommendations
```

### Database Schema

#### supplement_baseline
```
- id (uuid)
- user_id (uuid)
- supplement_name (text)
- dosage (text)
- unit (text)
- frequency (text)
- timing (text) - morning, evening, pre-workout, etc.
- purpose (text)
- start_date (date)
- end_date (date)
- status (enum) - active, paused, discontinued
```

#### supplement_recommendations
```
- id (uuid)
- user_id (uuid)
- supplement_name (text)
- recommendation_type (enum) - add, remove, adjust_dosage, change_timing
- rationale (text)
- priority (enum) - low, medium, high
- status (enum) - pending, accepted, rejected
- created_at (timestamp)
```

#### supplement_logs
```
- id (uuid)
- user_id (uuid)
- supplement_id (uuid)
- log_date (date)
- taken (boolean)
- dosage_actual (text)
- notes (text)
```

### API Endpoints

- `POST /supplements/seed/:user_id` - Seed baseline
- `POST /supplements/recommendations/generate/:user_id` - Generate recommendations
- `GET /supplements/recommendations/:user_id` - Get recommendations
- `GET /supplements/current/:user_id` - Get current stack

### Implementation Status

#### ✅ Implemented
- Database schema
- API endpoints
- Basic CRUD operations

#### ⚠️ Stubbed
- Recommendation engine
- Interaction checking
- Effectiveness analysis

---

## Recovery System

### Purpose
Track recovery metrics, predict readiness, optimize training load.

### Data Flow

```
1. COLLECT RECOVERY DATA
   - Sleep (hours, quality, HRV)
   - Soreness levels
   - Stress levels
   - Workout adherence
   ↓
2. CALCULATE RECOVERY SCORE
   - Weight factors (sleep 40%, HRV 30%, soreness 20%, stress 10%)
   - Normalize to 0-100 scale
   ↓
3. GENERATE RECOMMENDATIONS
   - Deload suggestions
   - Rest day recommendations
   - Training intensity adjustments
   ↓
4. TRACK TRENDS
   - Recovery patterns
   - Overtraining indicators
   - Optimal training windows
```

### Database Schema

#### recovery_logs
```
- id (uuid)
- user_id (uuid)
- log_date (date)
- sleep_hours (float)
- sleep_quality (integer) - 1-10
- hrv (float) - Heart Rate Variability
- resting_hr (integer)
- soreness_level (integer) - 1-10
- stress_level (integer) - 1-10
- recovery_score (float) - 0-100
- notes (text)
```

### API Endpoints

- `GET /recovery/:user_id/today` - Today's recovery state
- `GET /recovery/:user_id/history` - Historical recovery data

### Implementation Status

#### ✅ Implemented
- Database schema
- API endpoints
- Basic recovery score calculation

#### ⚠️ Stubbed
- HRV integration
- Deload recommendations
- Overtraining detection

---

## Body Composition System

### Purpose
Track body composition scans (InBody, DEXA), analyze trends, set goals.

### Data Flow

```
1. USER UPLOADS BODY COMP SCAN
   - InBody scan PDF
   - DEXA scan results
   ↓
2. PARSE SCAN DATA
   - Weight, body fat %, muscle mass
   - Segmental analysis
   - Metabolic rate
   ↓
3. CALCULATE TRENDS
   - Weight change
   - Body fat change
   - Muscle gain/loss
   ↓
4. COMPARE TO GOALS
   - Target body fat %
   - Target muscle mass
   - Progress tracking
   ↓
5. GENERATE RECOMMENDATIONS
   - Nutrition adjustments
   - Training modifications
   - Timeline projections
```

### Database Schema

#### body_composition_scans
```
- id (uuid)
- user_id (uuid)
- scan_date (date)
- scan_type (enum) - inbody, dexa, bioimpedance
- weight_lb (float)
- body_fat_percentage (float)
- muscle_mass_lb (float)
- visceral_fat_level (integer)
- bmr (integer) - Basal Metabolic Rate
- metabolic_age (integer)
- notes (text)
```

#### body_composition_goals
```
- id (uuid)
- user_id (uuid)
- goal_type (enum) - lose_fat, gain_muscle, recomp
- target_weight_lb (float)
- target_body_fat_percentage (float)
- target_muscle_mass_lb (float)
- target_date (date)
- status (enum) - active, achieved, abandoned
```

### API Endpoints

- `POST /body-composition/upload` - Upload scan document
- `POST /body-composition/scan` - Create scan record
- `GET /body-composition/latest/:user_id` - Latest scan
- `GET /body-composition/history/:user_id` - Scan history
- `GET /body-composition/trends/:user_id` - Trend analysis
- `GET /body-composition/test/:user_id` - Test endpoint with mock data

### Implementation Status

#### ✅ Implemented
- Database schema
- API endpoints
- Basic CRUD operations
- Test endpoint with mock data

#### ⚠️ Stubbed
- InBody PDF parsing
- DEXA scan parsing
- Goal progress tracking
- Anomaly detection

---

## Joint Health System

### Purpose
Track joint pain/mobility, identify patterns, prevent injuries.

### Data Flow

```
1. USER LOGS JOINT STATUS
   - Pain levels per joint
   - Mobility/ROM
   - Swelling/inflammation
   ↓
2. ANALYZE PATTERNS
   - Correlate with workouts
   - Identify triggers
   - Track improvements
   ↓
3. GENERATE RECOMMENDATIONS
   - Exercise modifications
   - Mobility work suggestions
   - Recovery protocols
```

### Database Schema

#### joint_health_logs
```
- id (uuid)
- user_id (uuid)
- log_date (date)
- joint_name (text) - knee, shoulder, elbow, etc.
- pain_level (integer) - 0-10
- mobility_rating (integer) - 1-10
- swelling (boolean)
- notes (text)
```

### API Endpoints

- `GET /joint-health/:user_id/today` - Today's joint health
- `GET /joint-health/:user_id/history` - Historical data

### Implementation Status

#### ✅ Implemented
- Database schema
- API endpoints
- Basic CRUD operations

#### ⚠️ Stubbed
- Pattern analysis
- Workout correlation
- Injury prevention recommendations

---

## Stress Management System

### Purpose
Track stress levels, identify triggers, provide coping strategies.

### Data Flow

```
1. USER LOGS STRESS DATA
   - Stress level (1-10)
   - Triggers/sources
   - Coping strategies used
   ↓
2. ANALYZE PATTERNS
   - Identify chronic stressors
   - Track effectiveness of coping strategies
   - Correlate with other health metrics
   ↓
3. GENERATE RECOMMENDATIONS
   - Stress management techniques
   - Lifestyle modifications
   - Professional help suggestions
```

### Database Schema

#### stress_logs
```
- id (uuid)
- user_id (uuid)
- log_date (date)
- stress_level (integer) - 1-10
- triggers (text[])
- coping_strategies (text[])
- effectiveness_rating (integer) - 1-10
- notes (text)
```

### API Endpoints

- `GET /stress/:user_id/today` - Today's stress data
- `GET /stress/:user_id/history` - Historical data

### Implementation Status

#### ✅ Implemented
- Database schema
- API endpoints
- Basic CRUD operations

#### ⚠️ Stubbed
- Pattern analysis
- Trigger identification
- Recommendation engine

---

## Architecture Decisions

### Global Decisions

#### Decision 1: Rule-Based vs AI-Driven
**Status:** ⚠️ NEEDS DECISION PER SYSTEM

**Systems Requiring Decision:**
1. **Bloodwork Parsing** - AI needed (complex, unstructured)
2. **Bloodwork Trends** - Rules sufficient (mathematical)
3. **Bloodwork Recommendations** - Rules + optional AI enhancement
4. **Workout Parsing** - AI needed (complex, unstructured)
5. **Workout Recommendations** - Rules + optional AI
6. **Supplement Recommendations** - Rules + optional AI
7. **Recovery Analysis** - Rules sufficient
8. **Body Comp Analysis** - Rules sufficient

**Recommendation Framework:**
- **Use Rules For:** Mathematical calculations, threshold checks, trend analysis
- **Use AI For:** Document parsing, natural language generation, complex pattern recognition
- **Hybrid:** Rules for logic, AI for presentation/personalization

#### Decision 2: Real-time vs Batch Processing
**Status:** ⚠️ NEEDS DECISION

**Options:**
1. **Real-time** - Process immediately on upload
   - Pros: Instant feedback
   - Cons: Slower uploads, higher costs
2. **Batch** - Queue for background processing
   - Pros: Faster uploads, cost-effective
   - Cons: Delayed results
3. **Hybrid** - Quick parse + detailed batch
   - Pros: Best of both
   - Cons: More complex

**Current Implementation:** Async fire-and-forget (hybrid approach)

#### Decision 3: Mobile-First vs Web-First
**Status:** ✅ DECIDED - Mobile-First

**Rationale:**
- Health tracking is mobile-native
- Camera for document uploads
- Daily logging requires mobile convenience
- Web dashboard as secondary view

---

## Implementation Status

### Overall Progress

#### ✅ Complete (Backend)
- Database schema for all systems
- API routes for all systems
- Controllers for all systems
- Basic CRUD services
- Authentication structure
- File upload handling

#### ⚠️ In Progress
- AI parsing services (stubbed)
- Recommendation engines (rule-based, needs enhancement)
- Notification services (stubbed)
- Integration between systems

#### ❌ Not Started
- Mobile UI (all screens)
- Web dashboard
- Integration tests
- Database seeding
- Deployment configuration

### Priority Order (Recommended)

1. **Bloodwork System** - Most complex, highest value
   - Implement OCR/AI parsing
   - Test with real lab documents
   - Validate trend calculations
   - Refine recommendation rules

2. **Body Composition System** - Second priority
   - Implement InBody parsing
   - Test with real scans
   - Validate trend calculations

3. **Workout System** - Third priority
   - Implement workout parsing
   - Build progress tracking
   - Test with real programs

4. **Recovery/Supplement/Joint Health** - Lower priority
   - Simpler systems
   - Less parsing complexity
   - Can use manual entry initially

---

## Next Steps

### Immediate Actions Needed

1. **Architecture Decisions**
   - [ ] Decide on AI vs Rules for each system
   - [ ] Choose document parsing approach
   - [ ] Define recommendation enhancement strategy

2. **Implementation Priorities**
   - [ ] Which system to build first?
   - [ ] Which features are MVP vs nice-to-have?
   - [ ] Mobile UI or backend completion first?

3. **Technical Decisions**
   - [ ] OpenAI API usage patterns
   - [ ] Cost optimization strategies
   - [ ] Error handling and retry logic
   - [ ] Testing strategy

### Questions to Answer

1. **Budget:** What's acceptable for AI API costs?
2. **Timeline:** When do you need MVP ready?
3. **Users:** Just you, or planning to share?
4. **Data:** Do you have real documents to test with?
5. **Focus:** Which health metric matters most to you?

---

**Document Status:** Living document - update as decisions are made and implementation progresses.
