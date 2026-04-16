# Personal Health Performance Agent

AI-powered health optimization platform with backend API and mobile app.

## Tech Stack

**Backend**: Node.js, Express, TypeScript, Supabase, OpenAI, Tesseract.js (OCR)

**Frontend**: React Native, Expo, TypeScript, React Navigation

## Backend Functionality

### Health Data Management
- Health metrics tracking and monitoring
- Daily logs and reminders
- Meal logging and nutrition extraction
- Physique scans and body composition tracking
- Point-in-time state tracking
- Strength and tape measurements

### Baseline Management
- Baseline profile configuration
- Baseline document management
- Workout and supplement baselines

### Bloodwork System
- Bloodwork upload and OCR extraction
- Bloodwork results and trends analysis
- AI-powered bloodwork recommendations

### Workout & Exercise
- Workout document management
- Workout engine for exercise planning
- Workout baseline tracking

### Supplement Management
- Supplement document management
- Supplement baseline tracking
- Supplement engine for recommendations
- Bulk supplement upload

### AI Health Engines
- **Supplement Engine**: AI-powered supplement recommendations
- **Recovery Engine**: Recovery optimization and tracking
- **Stress Engine**: Stress management and monitoring
- **Joint Health Engine**: Joint health assessment
- **Metabolic Engine**: Metabolic health analysis
- **Cardiovascular Engine**: Cardiovascular health monitoring
- **Sexual Health Engine**: Sexual health tracking
- **Workout Engine**: Exercise planning and optimization
- **Adherence Engine**: Adherence tracking and interventions

### AI Intelligence
- Interview agent for health data collection
- Cross-engine intelligence correlation
- Predictive analytics
- Adaptive recommendations
- Autonomous adjustments
- Prioritization engine
- Control tower for centralized health oversight

### Data Integration
- Health data hub for unified data management
- Apple Health integration
- Apple Watch integration
- Oura Ring integration
- Sleep Number integration

### Interview Systems
- Hybrid interview (text + voice)
- Voice interview system
- Dynamic interview with follow-ups
- AI agent interactions

### Notifications & Follow-ups
- Notification state management
- Dynamic follow-up system
- Daily AI plan generation

### Goals & Progression
- Goal management and tracking
- Progression history
- Actuarial risk assessment

## Frontend Functionality

### Dashboards
- **Dashboard V13**: Main health overview
- **Control Tower**: Centralized health oversight
- **Analytics Dashboard**: Health analytics and insights
- **Connected Dashboard**: Connected device overview
- **Correlation Insights**: Cross-data correlation analysis
- **Health Data Hub**: Unified health data view

### Health Engine Dashboards
- **Recovery Dashboard**: Recovery status and recommendations
- **Stress Dashboard**: Stress monitoring and management
- **Joint Health Status**: Joint health assessment
- **Metabolic Health Dashboard**: Metabolic health tracking
- **Cardiovascular Dashboard**: Cardiovascular health monitoring
- **Sexual Health Dashboard**: Sexual health tracking
- **Nutrition Dashboard**: Nutrition planning and tracking
- **Workout Dashboard**: Exercise planning and progress
- **Injury Prevention**: Injury risk assessment

### Baseline & Data Entry
- **Baseline Profile**: Profile configuration and editing
- **Baseline Summary**: Baseline overview
- **Baseline Upload**: Document upload for baselines
- **Daily Logs**: Daily health logging
- **Meal Log**: Meal and nutrition logging
- **Body Composition Upload**: Body composition data entry
- **Point In Time State**: State tracking at specific times
- **Tape Measurements**: Measurement tracking

### Bloodwork
- **Bloodwork Upload**: Upload bloodwork documents
- **Bloodwork Results**: View bloodwork results
- **Bloodwork Timeline**: Historical bloodwork data
- **Bloodwork Trends**: Trend analysis
- **Bloodwork Recommendations**: AI-powered recommendations

### Device Integration
- **Devices Screen**: Manage connected devices
- **Apple Watch Connect**: Connect Apple Watch
- **Oura Connect**: Connect Oura Ring
- **Sleep Number Connect**: Connect Sleep Number

### AI & Interviews
- **AI Assistant**: AI health assistant
- **AI Chat**: Chat with AI agent
- **Agent Interview**: AI-driven health interview
- **Hybrid Interview**: Text + voice interview
- **Voice Interview**: Voice-based health interview
- **Dynamic Interview**: Adaptive interview system
- **Interview Selector**: Choose interview type

### Goals & Recommendations
- **Goal Management**: Set and track health goals
- **Recommendations Screen**: View health recommendations
- **Overload Recommendations**: Training load recommendations
- **Autonomous Adjustments**: AI-suggested adjustments
- **Adherence Status**: View adherence to plans

### Progress & Analytics
- **Progression History**: View health progression over time
- **Actuarial Risk Dashboard**: Risk assessment overview

### Settings
- **Notification Settings**: Configure notifications

### Nutrition
- **Nutrition Extraction**: Extract nutrition from images/documents
- **Supplement Management**: Manage supplements

### Workout
- **Workout Today**: Today's workout plan

## Setup

### Backend
```bash
cd server
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npm start
```

## Environment Variables

Backend requires `.env` file with database and API credentials.

Mobile requires `EXPO_PUBLIC_API_URL` pointing to backend server.
