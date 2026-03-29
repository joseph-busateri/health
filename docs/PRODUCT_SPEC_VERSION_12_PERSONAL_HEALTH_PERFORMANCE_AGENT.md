# Personal Health & Performance Agent

## Unified Requirements — Version 12 (Document-Driven + OCR-Integrated Architecture)

This version restarts the requirements with:

- Document-driven architecture
- OCR + extraction pipeline for every document
- Initial workout & supplement loads
- Mobile-first dashboard
- Verbal agent
- Intelligence engines
- Point-in-time history
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
  - LDL
  - Testosterone
  - A1c
  - ApoB
  - hsCRP
- Workout Schedule
  - Workout days
  - Exercises
  - Sets
  - Reps
  - Notes
- Supplement Stack
  - Supplement name
  - Dosage
  - Timing
  - Frequency
- Baseline Profile
  - Demographics
  - Goals
  - Training context
  - Lifestyle context
- Body Composition
  - Measurements
  - Weight
  - Body fat
  - Lean mass

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

User uploads:

- Spreadsheet
- PDF
- Image

Extract:

- Workout schedule
- Exercises
- Sets
- Reps

Store:

- Workout baseline

#### 3. Initial Supplement Intake Upload

User uploads:

- Supplement list
- Spreadsheet
- Screenshot

Extract:

- Supplements
- Dosage
- Timing

Store:

- Supplement baseline

#### 4. Bloodwork Upload

Upload:

- PDF
- Image

Extract:

- Markers

#### 5. Body Composition Upload

- 3D Scan Upload
- Scale Upload
- Paper form upload

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

### Daily Interview

- Agent sends notification

Questions:

- Sleep
- Recovery
- Stress
- Sexual health
- Workout readiness

Final question:

- Anything else?

Dynamic follow-ups.

---

## 4) Intelligence Engines

### Control Tower

- CV
- REC
- MET
- PERF
- SH

### Built

#### Workout Engine

Uses:

- Recovery
- Body composition
- Strength

Outputs:

- Workout adjustments

#### Supplement Engine

Uses:

- Bloodwork
- Recovery
- Sexual health

Outputs:

- Supplement adjustments

#### Recovery Engine

Uses:

- HRV
- Sleep

#### Stress Engine

Uses:

- HRV
- Workload

#### Joint Engine

Uses:

- Verbal input

#### Adherence Engine

Tracks:

- Workout adherence
- Nutrition adherence

---

## 5) Trends & History

Track:

- Bloodwork
- Body composition
- Strength
- Supplements
- Workouts

### Point-in-Time History

User can view:

- Workout history
- Supplement history
- Body composition history
- Bloodwork history

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

### Phase 1

- Health Data Hub
- Document ingestion pipeline

### Phase 2

- Workout baseline
- Supplement baseline

### Phase 3

- Body composition
- Strength tracking

### Phase 4

- Engines
