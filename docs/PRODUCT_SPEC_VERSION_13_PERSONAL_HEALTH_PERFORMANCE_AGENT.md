# Personal Health & Performance Agent

## Unified Requirements — Version 13 (Enhanced Intelligence Architecture)

This version builds on Version 12 with:

- Document-driven architecture
- OCR + extraction pipeline for every document
- Initial workout & supplement loads
- Mobile-first dashboard
- **Enhanced conversational agent with dynamic follow-ups**
- **Structured save back system**
- Intelligence engines
- **Expanded biomarker tracking**
- **Context-aware interview system**
- Point-in-time history
- **Comprehensive validation infrastructure**
- Build-ready structure

**This is now the Primary System Specification.**

---

## System Objective

Build a Personal AI Health & Performance Agent that:

- Accepts document uploads and device data
- Extracts structured health information automatically
- Tracks trends over time
- Generates recommendations
- Adjusts workouts, supplements, and lifestyle
- Operates via mobile dashboard + conversational agent
- **Learns continuously from user interactions**
- **Adapts intelligently based on comprehensive health context**

---

## System Architecture

The system consists of 5 Core Areas:

1. Dashboard (Insights)
2. Health Data Hub (Inputs / Uploads)
3. Agent (Conversational Input)
4. Intelligence Engines
5. Trends & History

---

## Global Requirement — Document Ingestion Pipeline

Every document upload must follow this pipeline:

Upload
→ Store original document
→ Detect document type
→ Extract text
→ OCR if needed
→ Parse structured data
→ Store structured data
→ Link to document
→ Persist history

### Document Processing Requirements

Every document must store:

#### Document Metadata

- `document_id`
- `user_id`
- `document_type`
- `upload_date`
- `file_reference`
- `processing_status`
- `extraction_status`
- `extraction_method`
- `extraction_confidence`
- `processing_error`

#### Raw Extraction Storage

- `raw_extracted_text`
- `extracted_sections`
- `page_data` (optional)

#### Structured Extraction Storage

Depends on document type:

- Bloodwork
  - **Comprehensive biomarker panel (50+ markers)**
  - LDL, HDL, Total Cholesterol
  - Testosterone (Total, Free, Bioavailable)
  - A1c, Glucose, Insulin
  - ApoB, Lp(a)
  - hsCRP, Homocysteine
  - **Thyroid panel (TSH, T3, T4, rT3)**
  - **Liver enzymes (ALT, AST, GGT, ALP)**
  - **Kidney function (Creatinine, BUN, eGFR)**
  - **Complete blood count (WBC, RBC, Hemoglobin, Hematocrit, Platelets)**
  - **Vitamins (D, B12, Folate)**
  - **Minerals (Iron, Ferritin, Magnesium, Zinc)**
  - **Inflammation markers (ESR, Fibrinogen)**
  - **Metabolic markers (Uric Acid, Lactate)**
  - **Hormone panel (DHEA, Cortisol, Estradiol, SHBG)**
- Workout Schedule
  - **12-Week Training Cycle System**
  - Training cycle configuration (weeks, styles, dates)
  - Workout plan versions (user baseline + agent updates)
  - Split days (Push/Pull/Legs structure)
  - Exercises (name, description, sets, reps, weight)
  - Exercise execution details (tempo, rest, alternatives)
  - Performance tracking (RPE, form quality, adherence)
  - Version history and change audit trail
- Supplement Stack
  - **Agent-Managed Supplement Stack System**
  - Supplement stack versions (user baseline + agent updates)
  - Supplements (name, dosage, timing, goal, reason)
  - Adherence tracking (intake, side effects, effectiveness)
  - Stack change audit trail with triggers
  - Interaction checking (supplement-supplement, supplement-medication)
  - Inventory management with reorder alerts
- Baseline Profile
  - Demographics
  - Goals
  - Training context
  - Lifestyle context
- Body Composition
  - **Smart Scale & DEXA Integration**
  - Body composition scans (InBody, DEXA, other smart scales)
  - Core measurements (weight, water, lean mass, fat mass)
  - Percentages (body fat %, lean mass %, water %)
  - Muscle mass (skeletal muscle mass and %)
  - Fat distribution (visceral fat, subcutaneous fat)
  - Metabolic metrics (BMR, TDEE)
  - Segmental analysis (arms, legs, trunk muscle and fat)
  - Advanced metrics (ICW/ECW, phase angle, balance scores)
  - Goal tracking (weight loss, muscle gain, fat loss, recomp)
  - Trend tracking with automatic change calculations
  - Anomaly detection (rapid weight loss, high visceral fat, etc.)

---

## Mobile Navigation

### Bottom Navigation

- Dashboard
- Health Data
- Agent
- Trends
- Settings

---

## 1) Dashboard

### Mobile-First Vertical Layout

### Dashboard Sections

#### 1. Overall Health (Control Tower)

Display:

- Overall Health Score
- Status
- Component Scores

Components:

- Cardiovascular
- Recovery
- Metabolic
- Performance
- Sexual Health

#### 2. Cardiovascular

Display:

- Risk score
- LDL
- BP
- Resting HR

#### 3. Recovery

Display:

- HRV
- Sleep
- Recovery Score

#### 4. Workout

Display:

- Full workout for the day
- Agent adjustments

#### 5. Sexual Health

Display:

- Libido
- Erectile function
- Testosterone trends

#### 6. Nutrition

Display:

- Calories
- Protein
- Macro breakdown

#### 7. Body Composition

Display:

- 3D Body Scan
- Intelligent Scale

#### 8. Supplements

Display:

- Recommendations
- Add
- Remove
- Adjust

#### 9. Stress / CNS

Display:

- Stress score

#### 10. Joint / Injury

Display:

- Joint health

#### 11. Adherence

Display:

- Adherence score

#### 12. Trends & Insights

Display:

- Cross correlations

Bottom:

- Today's Recommendations
- Long Term Recommendations

---

## 2) Health Data Hub

Primary Upload Location

### Sections

#### 1. Baseline Profile Upload

Upload document.

Extract:

- Demographics
- Goals
- Training context
- Lifestyle context

#### 2. Initial Workout Schedule Upload

**12-Week Training Cycle System**

User uploads:

- Spreadsheet (Excel format with specific structure)
- PDF
- Image

**Training Cycle Structure**:

- **Weeks 1-10**: Concentric Training (Primary hypertrophy & strength)
- **Week 11**: Eccentric Training
- **Week 12**: Isometric Training
- Then cycle repeats

**Flexible Configuration**:
- Cycle length customizable (default 12 weeks)
- Training style durations adjustable
- Week ranges can be modified per user needs

Extract:

- **Split Day** (e.g., "Day 1", "Monday", "Push Day")
- **Split Focus** (e.g., "Push", "Pull", "Legs", "Upper", "Lower")
- **Exercise Name**
- **Exercise Description** (e.g., "Barbell Bench Press - Flat")
- **Sets** (number of sets)
- **Reps** (can be range like "8-12" or specific like "10")
- **Weight** (specific weight, "bodyweight", or "progressive")
- **Rest Periods** (optional)
- **Tempo** (optional, e.g., "3-1-1-0" for eccentric-pause-concentric-pause)
- **Execution Notes** (special instructions for different training styles)
- **Alternative Exercises** (backup options)

Store:

- **Training Cycle Configuration**
  - Cycle number, current week, total weeks
  - Week ranges for each training style
  - Cycle start/end dates
  - Status (active/completed/paused)

- **Workout Plan Versions**
  - Version number (1, 2, 3...)
  - Created by (user or agent)
  - Created reason (e.g., "Initial baseline", "Adjusted for recovery")
  - Effective date range
  - Current vs historical flag

- **Workout Split Days**
  - Split structure (Push/Pull/Legs)
  - Day order in weekly rotation
  - Training style per week in cycle

- **Workout Exercises**
  - All exercise parameters
  - Order within workout
  - Execution details

- **Workout Execution Log**
  - Actual performance vs planned
  - Sets/reps/weight completed
  - RPE (Rate of Perceived Exertion 1-10)
  - Form quality (1-5)
  - Skipped workouts with reasons

- **Workout Plan Changes**
  - Audit trail of all modifications
  - What changed (exercise, sets, reps, weight)
  - Old value → New value
  - Why it changed (reason)

**Agent-Managed Updates**:

The agent can update the workout plan based on:
- Performance trends from execution logs
- Recovery data from recovery engine
- Adherence patterns
- RPE and form quality trends
- Bloodwork results
- Stress levels

**Version History**:

Every plan modification creates a new version with:
- Change description
- Reason for change
- Effective date
- Link to recommendation that triggered change

**Always-Available Current Plan**:

At any time, the system can provide:
- Current workout plan
- Changes from prior versions
- Recommended adjustments
- Performance trends

#### 3. Initial Supplement Intake Upload

**Agent-Managed Supplement Stack System**

User uploads:

- Supplement list (Excel format with specific structure)
- Spreadsheet
- Screenshot

Extract:

- **Supplementation** (supplement name)
- **Dosage** (amount and unit: mg/g/IU/mcg/ml)
- **Timing** (when to take: morning/evening/with meals/pre-workout/post-workout)
- **Goal** (purpose: Recovery/Performance/Health/Sleep/Cardiovascular)
- **Reason to take** (detailed explanation)
- **Frequency** (daily/twice daily/as needed)
- **Brand** (optional)
- **Form** (capsule/powder/liquid/tablet)
- **Instructions** (take with food/water, avoid with certain things)
- **Cost tracking** (per serving, servings per container)

Store:

- **Supplement Stack Versions**
  - Version number (1, 2, 3...)
  - Created by (user or agent)
  - Created reason (e.g., "Initial baseline", "Added for recovery", "Removed due to side effects")
  - Effective date range
  - Current vs historical flag

- **Supplements**
  - All supplement parameters
  - Dosage and timing details
  - Purpose and reasoning
  - Status (active/paused/discontinued)
  - Order in stack

- **Supplement Adherence Log**
  - Actual intake vs planned
  - Missed doses with reasons
  - Side effects (description and severity 1-5)
  - Perceived effectiveness (1-5)
  - Notes

- **Supplement Stack Changes**
  - Audit trail of all modifications
  - What changed (supplement added/removed, dosage changed, etc.)
  - Old value → New value
  - Why it changed (reason)
  - What triggered it (bloodwork/side effects/adherence/performance)

- **Supplement Interactions**
  - Known interactions database
  - Supplement-supplement interactions
  - Supplement-medication interactions
  - Severity classification (mild/moderate/severe)
  - Recommendations

- **Supplement Inventory**
  - Current servings remaining
  - Reorder threshold and alerts
  - Purchase history and costs
  - Expiration dates

**Agent-Managed Updates**:

The agent can update the supplement stack based on:
- Bloodwork results (deficiencies, optimal levels)
- Side effects reported in adherence logs
- Adherence patterns and compliance
- Performance trends
- Recovery data
- Sleep quality
- Stress levels
- All available health data

**Version History**:

Every stack modification creates a new version with:
- Change description
- Reason for change
- Effective date
- Link to recommendation that triggered change
- Trigger identification (bloodwork/side effects/adherence/performance)

**Always-Available Current Stack**:

At any time, the system can provide:
- Current supplement stack
- Changes from prior versions
- Recommended adjustments
- Adherence metrics
- Side effects history
- Effectiveness ratings
- Interaction warnings
- Reorder alerts

#### 4. Bloodwork Upload

Upload:

- PDF
- Image

Extract:

- **Comprehensive biomarker panel (50+ markers)**
- All standard and advanced markers

#### 5. Body Composition Upload

**Smart Scale & DEXA Integration**

User uploads:

- Smart scale data (InBody S2, InBody 570, InBody 770, etc.)
- DEXA scan results
- 3D body scan
- Paper form upload
- Manual entry

**Scan Sources Supported**:
- InBody S2, 570, 770
- DEXA scans
- Other smart scales
- Manual entry

Extract:

- **User Demographics** (height, age, gender, test date)
- **Core Measurements** (weight in pounds)
- **Body Composition Breakdown**:
  - Total Body Water (lb)
  - Dry Lean Mass (lb) - for building muscles and strengthening bones
  - Body Fat Mass (lb) - for storing excess energy
- **Percentages**:
  - Body Fat Percentage
  - Lean Body Mass Percentage
  - Body Water Percentage
- **Muscle Mass**:
  - Skeletal Muscle Mass (lb and %)
- **Fat Distribution**:
  - Visceral Fat Level (1-20 scale)
  - Visceral Fat Area (cm²)
  - Subcutaneous Fat Percentage
- **Bone and Protein**:
  - Bone Mineral Content (lb)
  - Protein Mass (lb and %)
- **Metabolic Metrics**:
  - Basal Metabolic Rate (BMR) in kcal
  - Total Energy Expenditure (TDEE) in kcal
- **Body Metrics**:
  - BMI
  - Metabolic Age
  - Body Type (athletic/standard/obese)
- **Segmental Analysis** (arms, legs, trunk):
  - Right/Left Arm Muscle (lb)
  - Trunk Muscle (lb)
  - Right/Left Leg Muscle (lb)
  - Right/Left Arm Fat (lb)
  - Trunk Fat (lb)
  - Right/Left Leg Fat (lb)
  - Lean percentages for each segment
- **Advanced Metrics**:
  - Intracellular/Extracellular Water
  - ECW/ICW Ratio (edema indicator)
  - Phase Angle (cellular health indicator)
  - Muscle Balance Score
  - Upper/Lower Balance Score

Store:

- **Body Composition Scans**
  - All extracted metrics
  - Scan metadata (date, source, quality)
  - Document reference
  
- **Body Composition Documents**
  - Uploaded images/PDFs
  - Processing status
  - Extracted text and parsed data
  - Auto-detected scan source

- **Body Composition Goals**
  - User or agent-defined goals
  - Target metrics (weight, body fat %, lean mass, muscle mass)
  - Timeline and progress tracking
  - Goal status (active/completed/paused)

- **Trend Tracking**
  - Automatic change calculations
  - Weight change from previous scan
  - Body fat percentage change
  - Muscle mass change
  - Days since last scan

- **Anomaly Detection**
  - Rapid weight loss detection (>2% per week)
  - High visceral fat alerts (>15)
  - Low muscle mass warnings (<35%)
  - High body fat alerts
  - Water retention indicators

**Agent Integration**:

The agent uses body composition data to:
- Adjust workout intensity based on muscle mass trends
- Recommend caloric intake based on BMR and goals
- Suggest supplements based on body composition
- Modify training volume based on recovery and body fat trends
- Alert on health concerns (high visceral fat, rapid weight loss, etc.)
- Track progress toward body composition goals

**Goal Types**:
- Weight loss
- Muscle gain
- Fat loss
- Body recomposition (lose fat, gain muscle)
- Maintenance

#### 6. Strength Tracking Upload

- Bench press
- Pushups
- Grip strength

#### 7. Tape Measurements Upload

- Chest
- Shoulders
- Arms
- Forearms

#### 8. Nutrition Upload

- Meal photos

#### 9. Device Connections

- Apple Watch
- Whoop
- Sleep Number
- BP Monitor

---

## 3) Agent

### Daily Interview System

**Enhanced Conversational Intelligence**

#### Interview Flow

1. **Context Aggregation**
   - Automatically gather context from all intelligence engines
   - Pull recent trends, anomalies, and gaps
   - Identify areas requiring user input
   - Build comprehensive user health snapshot

2. **Dynamic Question Selection**
   - Priority-based question ranking
   - Context-aware question filtering
   - Adaptive question ordering
   - Intelligent follow-up generation

3. **Interview Execution**
   - Agent sends notification
   - User responds to questions
   - System adapts based on responses
   - Stops when sufficient signal captured

4. **Structured Save Back**
   - Convert conversational responses to structured data
   - Update relevant engine inputs
   - Create point-in-time records
   - Trigger dashboard refresh

#### Question Categories

Core Questions:

- Sleep quality
- Recovery feeling
- Stress levels
- Sexual health
- Workout readiness

Extended Questions:

- Energy levels
- Supplement adherence
- Bloodwork concerns
- Body composition changes
- Mental health
- Medication changes
- Nutrition patterns

Final Question:

- "Anything else I should know?"

#### Dynamic Follow-Ups

**Adaptive Questioning Logic**:

- If user reports poor sleep → Ask about sleep environment, stress, caffeine
- If user reports low energy → Ask about nutrition, hydration, supplements
- If user reports high stress → Ask about workload, relationships, recovery
- If user reports joint pain → Ask about location, severity, workout modifications
- If user reports sexual health issues → Ask about libido, function, relationship factors

**Stopping Criteria**:

- Sufficient signal captured across domains
- User indicates no additional concerns
- Maximum question limit reached (prevents fatigue)

#### Structured Save Back System

**Automatic Data Extraction**:

- Parse conversational responses
- Map to structured engine inputs
- Handle partial answers gracefully
- Validate data before storage

**Engine Updates**:

- Recovery Engine: Sleep quality, HRV trends, fatigue levels
- Stress Engine: Stress levels, workload, mental state
- Joint Health Engine: Pain reports, injury concerns
- Adherence Engine: Workout completion, supplement adherence
- Sexual Health: Libido, function, concerns
- Nutrition: Meal patterns, calorie estimates

**Resilience Features**:

- Retry logic for failed updates
- Partial answer handling
- Confidence scoring
- Audit trail creation

**Point-in-Time Records**:

- Create change event for each update
- Link to conversation
- Store rationale and confidence
- Enable historical tracking

---

## 4) Intelligence Engines

### Control Tower

- CV (Cardiovascular)
- REC (Recovery)
- MET (Metabolic)
- PERF (Performance)
- SH (Sexual Health)

### Engine Specifications

#### Workout Engine

Uses:

- Recovery score
- Body composition
- Strength tracking
- Joint health status
- **Stress levels**
- **Adherence history**

Outputs:

- Workout adjustments
- Volume modifications
- Exercise substitutions
- Rest day recommendations

#### Supplement Engine

Uses:

- **Comprehensive bloodwork (50+ markers)**
- Recovery score
- Sexual health metrics
- Stress levels
- **Adherence patterns**
- **Baseline supplement stack**

Outputs:

- Supplement additions
- Supplement removals
- Dosage adjustments
- Timing recommendations
- Severity classification

#### Recovery Engine

Uses:

- HRV trends
- Sleep quality
- Sleep duration
- **Stress levels**
- **Workout load**
- **Agent interview data**

Outputs:

- Recovery score
- Recovery status
- Recommendations

#### Stress Engine

Uses:

- HRV variability
- Workload tracking
- **Agent interview responses**
- **Sleep quality**
- **Recovery trends**

Outputs:

- Stress score
- Stress level
- Recommendations

#### Joint Health Engine

Uses:

- **Agent verbal input**
- Pain reports
- Injury history
- Workout patterns
- **Recovery status**

Outputs:

- Joint health score
- Injury risk assessment
- Workout modifications
- Recovery recommendations

#### Adherence Engine

Uses:

- Workout completion logs
- Nutrition tracking
- Supplement adherence
- **Agent interview data**
- **Device data**

Outputs:

- Adherence scores by domain
- Trend analysis
- Intervention recommendations

### Engine Integration

**Context Sharing**:

- All engines share data via unified context
- Cross-engine insights enabled
- Holistic health assessment

**Continuous Learning**:

- Agent interviews update engine inputs
- Engines adapt recommendations based on adherence
- System learns user patterns over time

---

## 5) Trends & History

Track:

- Bloodwork (**50+ markers**)
- Body composition
- Strength
- Supplements
- Workouts
- **Recovery metrics**
- **Stress levels**
- **Adherence patterns**

### Point-in-Time History

User can view:

- Workout history
- Supplement history
- Body composition history
- Bloodwork history
- **Recommendation history**
- **Agent conversation history**
- **Engine state changes**

### Change Event Tracking

**Every change must be recorded**:

- Entity type (baseline_profile, workout_baseline, supplement_baseline, etc.)
- Change source (document_upload, agent_adjustment, user_confirmation, system_update)
- Timestamp
- Rationale
- Confidence score
- Link to source (document, conversation, etc.)

**Auditability**:

- Full history of all changes
- Ability to rollback changes
- Understanding of system decisions
- Compliance and safety

---

## 6) Validation & Quality Assurance

### End-to-End Validation

**Required Validation Scripts**:

- Health Data Hub validation
- Dynamic follow-ups validation
- Structured save back validation
- Bloodwork extraction validation
- Engine validation (all 6 engines)
- Notification flow validation
- Interview loop validation

**Validation Coverage**:

- API endpoint functionality
- Data persistence
- Error handling
- Edge cases
- Integration points
- User workflows

**Quality Metrics**:

- Test pass rate (target: 100%)
- Code coverage
- Performance benchmarks
- User experience validation

### Continuous Testing

**Automated Testing**:

- Run validation scripts on every deployment
- Catch regressions early
- Document expected behavior
- Speed up development

**Manual Testing**:

- User acceptance testing
- Mobile UI validation
- End-to-end workflow testing
- Performance testing

---

## Reminders

### Daily

- Agent interview

### Monthly

- Body scan
- Strength tracking

### Quarterly

- Bloodwork

---

## Build Priority

### Phase 1 ✅ (Complete)

- Health Data Hub
- Document ingestion pipeline (partial - missing OCR)
- Intelligence Engines (all 6)
- Agent system with dynamic follow-ups
- Structured save back system
- Point-in-time history
- Notification system
- Validation infrastructure

### Phase 2 (Current Priority)

- Mobile Dashboard (12 sections)
- Bottom tab navigation
- OCR pipeline integration
- Workout baseline extraction
- Supplement baseline extraction

### Phase 3

- Body composition extraction
- Strength tracking
- Tape measurements
- Trends & History UI

### Phase 4

- Nutrition extraction (meal photos)
- Device connections (Apple Watch, Whoop, etc.)
- Advanced analytics
- Cross-correlation insights

---

## Key Enhancements in Version 13

### 1. Dynamic Follow-Ups System

**What Changed**: Formalized the adaptive questioning system

**Why**: Dramatically improves interview quality and reduces user fatigue

**Features**:
- Context-aware question selection
- Priority-based ranking
- Adaptive follow-up logic
- Stopping criteria to prevent over-questioning

### 2. Structured Save Back System

**What Changed**: Added automatic conversion of conversational data to structured engine inputs

**Why**: Closes the loop between agent and engines, enables continuous learning

**Features**:
- Automatic data extraction from conversations
- Engine input updates
- Partial answer handling
- Retry logic for resilience
- Audit trail creation

### 3. Expanded Biomarker Tracking

**What Changed**: Increased from 5 to 50+ biomarkers

**Why**: Enables comprehensive health tracking and better recommendations

**Markers Added**:
- Complete thyroid panel
- Liver and kidney function
- Complete blood count
- Vitamins and minerals
- Advanced inflammation markers
- Comprehensive hormone panel

### 4. Interview Context Aggregation

**What Changed**: Added automatic context gathering from all engines before interviews

**Why**: Enables intelligent question selection and reduces redundant questions

**Features**:
- Pull data from all engines
- Identify gaps and anomalies
- Build comprehensive health snapshot
- Inform question prioritization

### 5. Validation Infrastructure

**What Changed**: Formalized comprehensive E2E testing requirements

**Why**: Ensures system reliability and catches regressions early

**Features**:
- Validation scripts for all major systems
- Automated testing on deployment
- Quality metrics and benchmarks
- Documentation of expected behavior

---

## Technical Requirements

### Backend

- Node.js + Express API
- TypeScript for type safety
- Supabase for data persistence
- OpenAI for AI-powered features
- Comprehensive error handling
- Retry logic for resilience

### Frontend

- React Native + Expo
- TypeScript for type safety
- Mobile-first design
- Offline support (future)
- Push notifications
- Biometric authentication (future)

### Data Architecture

- Normalized database schema
- Point-in-time history for all changes
- Document-driven with structured extraction
- Cross-engine data sharing
- Audit trails for compliance

### Security & Privacy

- User data encryption
- Secure document storage
- HIPAA compliance considerations
- Audit logging
- Access controls

---

## Success Metrics

### User Engagement

- Daily interview completion rate
- Health Data Hub usage
- Dashboard views
- Recommendation adherence

### System Performance

- Document processing time
- Extraction accuracy
- API response times
- Validation test pass rates

### Health Outcomes

- Biomarker improvements
- Adherence to recommendations
- User-reported health improvements
- Goal achievement rates

---

## Version History

- **Version 12**: Document-driven architecture baseline
- **Version 13**: Enhanced intelligence with dynamic follow-ups, structured save back, expanded biomarkers, context aggregation, and validation infrastructure

---

## Conclusion

Version 13 represents a significant enhancement to the Personal Health & Performance Agent, formalizing the intelligent systems that enable continuous learning and adaptation. The addition of dynamic follow-ups, structured save back, and comprehensive biomarker tracking creates a truly intelligent health assistant that learns from every interaction and provides increasingly personalized recommendations over time.

The system now has a complete feedback loop: data flows from users through the Health Data Hub and Agent, gets processed by Intelligence Engines, generates recommendations displayed on the Dashboard, and user responses feed back into the engines through the structured save back system. This creates a continuously improving health management platform.
