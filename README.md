# Full-Stack Mobile App

A React Native + Expo frontend with Node.js + Express backend.

## Structure
- `/mobile` - React Native Expo app with TypeScript
- `/server` - Node.js Express API with TypeScript

## Prerequisites
1. Install Xcode Command Line Tools (should be done automatically)
2. Install Node.js:
   ```bash
   # Via Homebrew (recommended)
   brew install node
   
   # Or via nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install node
   ```

## Quick Setup
```bash
./setup.sh
```

## Manual Setup

### Server Setup
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Mobile App Setup
```bash
cd mobile
npm install
cp .env.example .env
npm start
```

## Running the App
1. Start the server: `cd server && npm run dev`
2. Start the mobile app: `cd mobile && npm start`
3. Press 'i' to open iOS simulator
4. Press 'a' to open Android emulator

## Features
- ✅ React Navigation for mobile navigation
- ✅ Axios for API calls
- ✅ CORS enabled on backend
- ✅ Environment variables configured
- ✅ TypeScript throughout
- ✅ iOS simulator support
- ✅ Health dashboard with mock data
- ✅ Detailed health metrics view

## API Endpoints
- `GET /health` - Get all health metrics
- `GET /health/:id` - Get specific health metric details
- `POST /daily-logs` - Store a daily log entry (vector embedding)
- `GET /daily-logs/:userId/recent` - Fetch recent logs for a user
- `POST /daily-logs/:userId/search` - Similarity search across a user's logs

## Vector Database Integration

### Requirements
- Supabase project with the `pgvector` extension enabled
- Table `daily_logs` containing:
  - `id uuid primary key`
  - `user_id text`
  - `date date`
  - `sleep_hours numeric`
  - `recovery_feeling text`
  - `stress_level numeric`
  - `workout_adherence numeric`
  - `notes text`
  - `embedding vector(1536)` (adjust dimension if using a different embedding model)
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- Supabase RPC function `match_daily_logs` leveraging cosine similarity:
  ```sql
  create or replace function match_daily_logs(
    query_embedding vector(1536),
    match_count int,
    similarity_threshold float,
    match_user_id text
  )
  returns table (
    id uuid,
    similarity float,
    log daily_logs
  )
  language sql stable
  as $$
    select
      dl.id,
      1 - (dl.embedding <=> query_embedding) as similarity,
      dl
    from daily_logs dl
    where dl.user_id = match_user_id
      and 1 - (dl.embedding <=> query_embedding) >= similarity_threshold
    order by dl.embedding <=> query_embedding
    limit match_count;
  $$;
  ```

### Environment Variables (`/server/.env`)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
SUPABASE_DAILY_LOGS_TABLE=daily_logs
OPENAI_API_KEY=sk-your-openai-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Testing the Integration
1. Install dependencies: `cd server && npm install`
2. Run the test script:
   ```bash
   cd server
   npm run test:daily-logs
   ```
   The script performs:
   - **Storage Test** – inserts three sample logs, prints embeddings & metadata
   - **Ordering Test** – ensures `getRecentLogs` returns logs by descending date
   - **Similarity Test** – queries "low sleep high stress" and prints matches
   - **Failure Test** – lists common issues and mitigations

> **Note:** The script requires valid Supabase/OpenAI credentials and the `match_daily_logs` function. It will fail locally until those resources are provisioned.

## Project Structure
```
health/
├── mobile/
│   ├── src/
│   │   ├── screens/     # React Native screens
│   │   ├── services/    # API service
│   │   └── types/       # TypeScript types
│   ├── App.tsx
│   ├── package.json
│   └── tsconfig.json
├── server/
│   ├── src/
│   │   ├── routes/      # Express routes
│   │   ├── middleware/  # Express middleware
│   │   └── types/       # TypeScript types
│   ├── package.json
│   └── tsconfig.json
└── setup.sh
```



# terminal 1
cd server
npm run dev

# terminal 2
cd mobile
npx expo start



with sample_embedding as (
  select array_agg((g - 1)::double precision / 100)::vector(1536) as embedding
  from generate_series(1, 1536) as g
)
insert into public.daily_logs (
  id,
  user_id,
  date,
  sleep_hours,
  recovery_feeling,
  stress_level,
  workout_adherence,
  notes,
  embedding,
  created_at,
  updated_at
)
select
  '5e8a18b2-3c4f-4b7c-9b6b-6c3c5f3b2d1e'::uuid,
  'user_123',
  date '2026-03-23',
  7.5,
  'rested and ready',
  2.0,
  0.9,
  'Crushed the workout and kept nutrition tight.',
  embedding,
  now(),
  now()
from sample_embedding;


Phase 1 completion checkpoint document has been created with summaries of completed modules, current API endpoints, screen inventory, data models, and deferred initiatives. Location: @docs/phase-1-completion.md#1-70.


Created developer status doc [docs/phase-2-control-tower-status.md](cci:7://file:///Users/tammybusateri/development/health/docs/phase-2-control-tower-status.md:0:0-0:0) outlining completed modules, current screens/endpoints/models, scoring engines, prompt logic, validation scripts, deferred items, placeholders, and recommended Phase 3 focus areas @docs/phase-2-control-tower-status.md#1-82.


CV/SH end-to-end validation is still failing overall: only 5/8 scenarios pass. Scenario 4 “Low cardiovascular readiness” now correctly flags the prompt focus but still reports perf & met bands as moderate, whereas the expectation is low—tighten log inputs or adjust expectations. Scenario 6 “Low sexual health cadence” passes. Scenario 7 “Strong sexual health cadence” still triggers a generic steady-state prompt because cardio scores are optimal; revise expectation to accept empty focus/steady prompt. Scenario 8 “Mixed CV/SH” now passes after moderating vitals. No plan updates yet—the validation suite needs further tuning before we can mark the task complete.