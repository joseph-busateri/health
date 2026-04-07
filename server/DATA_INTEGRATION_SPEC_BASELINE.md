# Data Integration Spec Baseline — Version 11.1

**Purpose**: Canonical inventory of all data domains and fields required by the product specification

---

## 1. BASELINE PROFILE

### Demographics
- `age` (number)
- `sex` (string: male/female)
- `height` (number, inches)
- `weight` (number, lbs)
- `bodyType` (string)
- `trainingHistory` (string/years)

### Medical Context
- `medicalConditions` (array of strings)
- `medications` (array of strings)
- `injuries` (array of strings)
- `surgeries` (array of strings)
- `limitations` (array of strings)
- `trtUsage` (boolean)
- `diabetesStatus` (string)
- `bloodPressureHistory` (string)

### Lifestyle Context
- `travelSchedule` (string)
- `sleepSchedule` (string)
- `stressEnvironment` (string)
- `trainingAvailability` (string)
- `recoveryAvailability` (string)

### Baseline Plans
- `workoutBaseline` (document reference)
- `supplementBaseline` (document reference)

---

## 2. STRUCTURED GOALS

### Body Composition Goals
- `targetBodyFatPercent` (number)
- `targetWeight` (number, lbs)

### Metabolic Goals
- `targetA1c` (number)

### Vitals Goals
- `targetRestingHeartRate` (number, bpm)
- `targetSystolicBP` (number, mmHg)
- `targetDiastolicBP` (number, mmHg)

### Performance Goals
- `targetSleepHours` (number)

### Sexual Performance Goals
- `targetErectileFunctionScore` (number, 1-10)
- `targetLibidoScore` (number, 1-10)

### Circumference Goals
- `targetChest` (number, inches)
- `targetBicepLeftFlexed` (number, inches)
- `targetBicepRightFlexed` (number, inches)
- `targetForearmLeft` (number, inches)
- `targetForearmRight` (number, inches)
- `targetNeck` (number, inches)
- `targetShoulders` (number, inches)

### Strength Goals
- `targetBenchPress1RM` (number, lbs)
- `targetSquat1RM` (number, lbs)
- `targetPushupsMaxReps` (number)

### Performance Goals
- `targetGripStrengthLeft` (number, lbs)
- `targetGripStrengthRight` (number, lbs)

### Nutrition Goals
- `targetDailyWaterIntake` (number, oz)
- `targetDailyProteinIntake` (number, g)
- `targetDailyCalories` (number)

### Longevity Goals
- `targetGripStrength` (number, lbs)

---

## 3. DAILY INTERVIEW

### Recovery Signals
- `energy` (number, 1-10)
- `fatigue` (number, 1-10)
- `sleepQuality` (number, 1-10)
- `muscleSoreness` (number, 1-10)
- `perceivedRecovery` (number, 1-10)

### Stress Signals
- `mentalStress` (number, 1-10)
- `workload` (number, 1-10)
- `emotionalStress` (number, 1-10)

### Joint Health Signals
- `shoulderPain` (number, 0-10)
- `kneePain` (number, 0-10)
- `backPain` (number, 0-10)
- `elbowPain` (number, 0-10)

### Sexual Health Signals
- `libido` (number, 1-10)
- `erectileFunction` (number, 1-10)
- `morningErections` (number, 0-7 days)

### Workout Feedback
- `yesterdayWorkoutDifficulty` (number, 1-10)
- `strengthPerception` (string)
- `workoutFatigue` (number, 1-10)
- `readinessToTrain` (number, 1-10)

### Adherence Signals
- `workoutAdherence` (boolean)
- `supplementAdherence` (boolean)
- `nutritionAdherence` (boolean)
- `sleepAdherence` (boolean)

### Context Signals
- `travel` (boolean)
- `illness` (boolean)
- `poorSleep` (boolean)
- `scheduleDisruption` (boolean)

---

## 4. BLOODWORK

### Complete Blood Count (CBC)
- `wbc` (number, K/uL)
- `rbc` (number, M/uL)
- `hemoglobin` (number, g/dL)
- `hematocrit` (number, %)
- `platelets` (number, K/uL)

### Comprehensive Metabolic Panel (CMP)
- `glucose` (number, mg/dL)
- `bun` (number, mg/dL)
- `creatinine` (number, mg/dL)
- `sodium` (number, mmol/L)
- `potassium` (number, mmol/L)
- `chloride` (number, mmol/L)
- `co2` (number, mmol/L)
- `calcium` (number, mg/dL)
- `albumin` (number, g/dL)
- `totalProtein` (number, g/dL)
- `alt` (number, U/L)
- `ast` (number, U/L)
- `alkalinePhosphatase` (number, U/L)
- `totalBilirubin` (number, mg/dL)

### Lipid Panel
- `totalCholesterol` (number, mg/dL)
- `ldl` (number, mg/dL)
- `hdl` (number, mg/dL)
- `triglycerides` (number, mg/dL)
- `vldl` (number, mg/dL)

### Hormones
- `testosterone` (number, ng/dL)
- `freeTestosterone` (number, pg/mL)
- `estradiol` (number, pg/mL)
- `shbg` (number, nmol/L)
- `lh` (number, mIU/mL)
- `fsh` (number, mIU/mL)
- `prolactin` (number, ng/mL)
- `dhea` (number, ug/dL)
- `cortisol` (number, ug/dL)
- `tsh` (number, uIU/mL)
- `freeT3` (number, pg/mL)
- `freeT4` (number, ng/dL)

### Metabolic Markers
- `hba1c` (number, %)
- `insulin` (number, uIU/mL)
- `homair` (number, calculated)

### Inflammation
- `crp` (number, mg/L)
- `hscrp` (number, mg/L)

### Vitamins & Minerals
- `vitaminD` (number, ng/mL)
- `vitaminB12` (number, pg/mL)
- `folate` (number, ng/mL)
- `iron` (number, ug/dL)
- `ferritin` (number, ng/mL)
- `magnesium` (number, mg/dL)
- `zinc` (number, ug/dL)

### Other
- `psa` (number, ng/mL)
- `uricAcid` (number, mg/dL)

---

## 5. BODY COMPOSITION

### Weight & Body Fat
- `weight` (number, lbs)
- `bodyFatPercent` (number, %)
- `leanMass` (number, lbs)
- `fatMass` (number, lbs)

### Circumferences
- `chest` (number, inches)
- `waist` (number, inches)
- `hips` (number, inches)
- `bicepLeftFlexed` (number, inches)
- `bicepRightFlexed` (number, inches)
- `bicepLeftRelaxed` (number, inches)
- `bicepRightRelaxed` (number, inches)
- `forearmLeft` (number, inches)
- `forearmRight` (number, inches)
- `thighLeft` (number, inches)
- `thighRight` (number, inches)
- `calfLeft` (number, inches)
- `calfRight` (number, inches)
- `neck` (number, inches)
- `shoulders` (number, inches)

### Skinfolds (if used)
- `tricep` (number, mm)
- `subscapular` (number, mm)
- `suprailiac` (number, mm)
- `abdominal` (number, mm)
- `thigh` (number, mm)
- `chest` (number, mm)

---

## 6. DEVICE DATA

### Apple Watch / Wearables
- `restingHeartRate` (number, bpm)
- `hrv` (number, ms)
- `sleepDuration` (number, hours)
- `deepSleep` (number, hours)
- `remSleep` (number, hours)
- `sleepScore` (number, 0-100)
- `activeCalories` (number)
- `totalCalories` (number)
- `steps` (number)
- `standHours` (number)
- `exerciseMinutes` (number)
- `vo2Max` (number, mL/kg/min)

### Blood Pressure Monitor
- `systolicBP` (number, mmHg)
- `diastolicBP` (number, mmHg)
- `heartRate` (number, bpm)

### Continuous Glucose Monitor (if applicable)
- `averageGlucose` (number, mg/dL)
- `glucoseVariability` (number, %)
- `timeInRange` (number, %)

### Sleep Number / Sleep Tracker
- `sleepIQ` (number, 0-100)
- `avgHeartRate` (number, bpm)
- `avgRespirationRate` (number, breaths/min)
- `restfulnessScore` (number, 0-100)

---

## 7. SUPPLEMENTS

### Supplement Stack
- `supplementName` (string)
- `dosage` (string)
- `frequency` (string: daily, twice daily, as needed)
- `timing` (string: morning, evening, pre-workout, post-workout)
- `purpose` (string)
- `startDate` (date)

### Adherence Tracking
- `supplementTaken` (boolean, per day)
- `missedDoses` (number)
- `adherenceRate` (number, %)

---

## 8. WORKOUT

### Baseline Workout Plan
- `workoutType` (string: push, pull, legs, upper, lower, full body)
- `exercises` (array)
  - `name` (string)
  - `sets` (number)
  - `reps` (string)
  - `load` (number, lbs)
  - `restPeriod` (number, seconds)
  - `notes` (string)
- `weeklySchedule` (object: monday, tuesday, etc.)
- `cycleWeek` (number)
- `phase` (string: hypertrophy, strength, deload)

### Workout Execution Tracking
- `workoutCompleted` (boolean)
- `exercisesCompleted` (array)
  - `name` (string)
  - `setsCompleted` (number)
  - `repsCompleted` (array of numbers)
  - `loadUsed` (array of numbers)
  - `rpe` (number, 1-10)
  - `notes` (string)
- `workoutDuration` (number, minutes)
- `perceivedDifficulty` (number, 1-10)

### Strength Tracking
- `benchPress1RM` (number, lbs)
- `squat1RM` (number, lbs)
- `deadlift1RM` (number, lbs)
- `overheadPress1RM` (number, lbs)
- `pushups` (number, max reps)
- `pullups` (number, max reps)
- `gripStrengthLeft` (number, lbs)
- `gripStrengthRight` (number, lbs)

---

## 9. NUTRITION

### Baseline Nutrition Plan
- `dailyCalories` (number)
- `dailyProtein` (number, g)
- `dailyCarbs` (number, g)
- `dailyFats` (number, g)
- `dailyHydration` (number, oz)
- `mealTiming` (object)
  - `breakfast` (string)
  - `lunch` (string)
  - `dinner` (string)
  - `snacks` (array of strings)
  - `preWorkout` (string)
  - `postWorkout` (string)

### Daily Nutrition Tracking
- `caloriesConsumed` (number)
- `proteinConsumed` (number, g)
- `carbsConsumed` (number, g)
- `fatsConsumed` (number, g)
- `hydrationConsumed` (number, oz)
- `meals` (array)
  - `mealType` (string)
  - `foods` (array of strings)
  - `calories` (number)
  - `protein` (number, g)
  - `carbs` (number, g)
  - `fats` (number, g)

---

## 10. ADHERENCE

### Workout Adherence
- `plannedWorkouts` (number, per week)
- `completedWorkouts` (number, per week)
- `adherenceRate` (number, %)
- `missedWorkoutReasons` (array of strings)

### Supplement Adherence
- `plannedDoses` (number, per day)
- `takenDoses` (number, per day)
- `adherenceRate` (number, %)

### Nutrition Adherence
- `targetCalories` (number)
- `actualCalories` (number)
- `proteinTarget` (number, g)
- `proteinActual` (number, g)
- `adherenceRate` (number, %)

### Sleep Adherence
- `targetSleepHours` (number)
- `actualSleepHours` (number)
- `adherenceRate` (number, %)

---

## 11. DERIVED INTELLIGENCE INPUTS

### Recovery Engine Inputs
- HRV (from devices)
- Sleep quality (from interview + devices)
- Muscle soreness (from interview)
- Fatigue (from interview)
- Resting heart rate (from devices)

### Stress Engine Inputs
- Mental stress (from interview)
- Workload (from interview)
- HRV trends (from devices)
- Sleep disruption (from interview + devices)

### Joint Health Engine Inputs
- Pain scores (from interview)
- Workout load (from workout tracking)
- Age (from baseline)
- Injury history (from baseline)

### Metabolic Engine Inputs
- Bloodwork: glucose, HbA1c, insulin, HOMA-IR
- Body composition: body fat %, weight
- Nutrition tracking
- Activity level (from devices)

### Cardiovascular Engine Inputs
- Bloodwork: lipid panel, blood pressure
- Resting heart rate (from devices)
- VO2 max (from devices)
- Age, sex (from baseline)

### Sexual Health Engine Inputs
- Bloodwork: testosterone, free testosterone, estradiol
- Interview: libido, erectile function, morning erections
- Age (from baseline)
- TRT usage (from baseline)

### Supplement Engine Inputs
- Current supplement stack (from supplement baseline)
- Bloodwork deficiencies
- Goals (from goals profile)
- Adherence tracking

### Workout Engine Inputs
- Workout baseline plan
- Recovery score
- Stress score
- Joint risk
- Strength tracking
- Adherence

### Nutrition Engine Inputs
- Nutrition baseline plan
- Body composition
- Workout intensity
- Recovery needs
- Goals
- Metabolic markers

---

## SUMMARY

**Total Data Domains**: 11  
**Total Data Points**: 200+

**Critical Dependencies**:
- Daily Interview → All engines
- Bloodwork → Metabolic, Cardiovascular, Sexual Health, Supplement
- Devices → Recovery, Stress, Cardiovascular
- Body Composition → Metabolic, Nutrition, Goals
- Workout Tracking → Workout Engine, Adherence, Recovery
- Supplement Tracking → Supplement Engine, Adherence
- Goals → All optimization engines

**Data Flow Requirements**:
1. Baseline profile must be established first
2. Daily interview must run daily and feed all engines
3. Bloodwork must be uploaded and normalized
4. Device data must sync continuously
5. Body composition must be tracked regularly
6. Workout execution must be logged
7. Nutrition must be tracked
8. Adherence must be calculated from tracking data
9. All data must flow into engine state for snapshot generation
10. Engine outputs must feed Daily AI Plan and Control Tower
