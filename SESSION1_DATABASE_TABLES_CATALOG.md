# SESSION 1: DATABASE TABLES CATALOG - Phase 0-21

**Analysis Date**: 2026-04-14  
**Source**: Actual migration files in `server/src/migrations/`  
**Status**: Complete

---

## COMPREHENSIVE DATABASE TABLE INVENTORY

### **WORKOUT DOMAIN**

**From**: `20260329_create_workout_schema.sql`
- `training_cycles` - 12-week training cycle configuration
- `workout_plan_versions` - Different versions of workout plans
- `workout_split_days` - Split structure (Push, Pull, Legs)
- `workout_exercises` - Exercises for each split day
- `workout_execution_log` - Actual workout performance tracking
- `workout_plan_changes` - Version change tracking
- `workout_baseline_documents` - Uploaded Excel/document metadata

**From**: Supabase `001_create_workout_baseline_tables.sql`
- `workout_documents` - Uploaded workout document metadata
- `workout_baselines` - Structured workout context from documents
- `workout_extracted_sections` - Raw extracted text segments
- `workout_change_log` - Baseline changes audit trail

**From**: Supabase `002_create_workout_progression_tables.sql` (Phase 21)
- `workout_daily_progressions` - Daily progression tracking with AI
- `workout_weekly_progressions` - Weekly progression summaries

### **SUPPLEMENT DOMAIN**

**From**: `20260329_create_supplement_schema.sql`
- `supplement_stack_versions` - Different versions of supplement stacks
- `supplements` - Individual supplements in a stack
- `supplement_adherence_log` - Actual intake vs planned
- `supplement_stack_changes` - Version change tracking
- `supplement_baseline_documents` - Uploaded document metadata
- `supplement_interactions` - Known interactions between supplements
- `supplement_inventory` - Inventory and reorder tracking

### **BODY COMPOSITION DOMAIN**

**From**: `20260329_create_body_composition_schema.sql`
- `body_composition_scans` - Individual scan results
- `body_composition_documents` - Uploaded scan images/PDFs
- `body_composition_goals` - User-defined or agent-recommended goals

### **NUTRITION DOMAIN**

**From**: `20260403_create_phase2_engine_tables.sql` (Phase 2)
- `nutrition_records` - Daily nutrition engine calculations (calorie/macro targets, adherence)

**NOTE**: No tables found for:
- `meal_logs` - NOT IN MIGRATIONS
- `nutrition_extractions` - NOT IN MIGRATIONS
- `nutrition_today_integrated` - NOT IN MIGRATIONS (likely calculated view)

### **CARDIOVASCULAR DOMAIN**

**From**: `20260403_create_phase2_engine_tables.sql` (Phase 2)
- `cardiovascular_records` - Daily cardiovascular risk assessments (HR, BP, HRV, lipids)

### **METABOLIC DOMAIN**

**From**: `20260403_create_phase2_engine_tables.sql` (Phase 2)
- `metabolic_records` - Daily metabolic health assessments (glucose, insulin, metabolic risk)

### **SEXUAL HEALTH DOMAIN**

**From**: `20260403_create_phase2_engine_tables.sql` (Phase 2)
- `sexual_health_records` - Daily sexual health assessments (testosterone, libido, erectile function)

### **GOALS DOMAIN**

**From**: `create_goals_schema.sql` and `20260329_goal_management_schema.sql`
- `goal_templates` - Pre-defined goal templates
- `goals` - User goals
- `goal_metrics` - Metrics for tracking goals
- `goal_milestones` - Goal milestones
- `goal_progress` - Progress tracking
- `goal_achievements` - Completed achievements
- `goal_recommendations` - AI-powered goal recommendations

### **BLOODWORK DOMAIN**

**From**: `create_bloodwork_results_table.sql`, `create_bloodwork_recommendations_table.sql`, `20260328_expand_bloodwork_schema.sql`
- `bloodwork_documents` - Uploaded bloodwork documents
- `bloodwork_results` - Parsed bloodwork results
- `bloodwork_recommendations` - AI-powered recommendations

### **BASELINE PROFILE DOMAIN**

**From**: `20260413_create_baseline_document_schema.sql`, `20260406_baseline_profile_preferences_schema.sql`
- `baseline_documents` - Uploaded baseline documents
- `baseline_profiles` - Document-derived snapshots
- `baseline_extracted_sections` - OCR/parsing audit trail
- `baseline_change_log` - Manual/agent refinements
- `baseline_profile` - User baseline profile
- `user_preferences` - User preferences

### **DEMOGRAPHICS DOMAIN**

**From**: `20260412_enhance_demographics_schema.sql`
- `demographics_audit_log` - Changes to demographic data
- `demographics_validation_rules` - Validation rules for fields
- `demographics_collection_progress` - Completion status tracking

### **RECOMMENDATIONS DOMAIN**

**From**: `20260403_create_recommendations_table.sql`
- `recommendations` - Unified recommendations
- `recommendation_history` - Historical recommendations
- `recommendation_conflicts` - Conflicting recommendations
- `recommendation_learning_metrics` - Learning patterns tracking

### **RECOVERY DOMAIN**

**From**: `20260329_recovery_optimization_schema.sql`
- Recovery-related tables (need to examine file for details)

### **INJURY PREVENTION DOMAIN**

**From**: `20260329_injury_prevention_schema.sql`
- Injury-related tables (need to examine file for details)

### **STRENGTH TRACKING DOMAIN**

**From**: `20260329_strength_tracking_schema.sql`
- Strength-related tables (need to examine file for details)

### **TAPE MEASUREMENTS DOMAIN**

**From**: `20260329_tape_measurements_schema.sql`
- Tape measurement tables (need to examine file for details)

### **DEVICE INTEGRATIONS**

**From**: `20260329_apple_watch_integration_schema.sql`, `20260331_apple_health_integration.sql`
- Apple Watch integration tables

**From**: `20260329_oura_ring_integration_schema.sql`
- Oura Ring integration tables

**From**: `20260329_sleep_number_schema.sql`, `20260329_sleep_number_api_integration.sql`
- Sleep Number integration tables

### **ANALYTICS DOMAIN**

**From**: `20260329_advanced_analytics_schema.sql`
- Advanced analytics tables (need to examine file for details)

---

## KEY FINDINGS

### **Phase 2 Nutrition - CRITICAL DISCOVERY**

❌ **MISSING TABLES**: The Phase 2 nutrition screens I built use these endpoints:
- `POST /api/meal-log` → expects `meal_logs` table → **NOT FOUND IN MIGRATIONS**
- `POST /api/nutrition/extract` → expects `nutrition_extractions` table → **NOT FOUND IN MIGRATIONS**
- `GET /api/nutrition-today/:userId/today` → uses `nutrition_records` table → ✅ **EXISTS**

**Implication**: 
- `NutritionDashboardScreen` ✅ Has database support (`nutrition_records`)
- `MealLogScreen` ❌ NO database table (backend will fail)
- `NutritionExtractionScreen` ❌ NO database table (backend will fail)

### **Phase 21 Progressive Overload**

✅ **CONFIRMED**: Both tables exist:
- `workout_daily_progressions`
- `workout_weekly_progressions`

### **Phase 3 Metabolic Health**

✅ **CONFIRMED**: Table exists:
- `metabolic_records`

---

## NEXT STEPS

**Session 2**: Analyze backend routes to verify:
1. Which routes actually have service implementations
2. Which routes expect tables that don't exist
3. Map actual API endpoints to database tables

**Session 3**: Verify UI screens and their actual backend calls

**Session 4**: Generate accurate alignment table with evidence

---

**Status**: Session 1 Complete - Database catalog extracted from actual migration files
