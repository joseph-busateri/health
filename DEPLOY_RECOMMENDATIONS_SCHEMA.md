# Deploy Bloodwork Recommendations Database Schema

This guide shows you how to deploy the bloodwork recommendations database schema for the Bloodwork Intelligence Engine.

## 🚀 Quick Start (Recommended)

### Method 1: Automated Deployment Script
```bash
cd /Users/tammybusateri/development/health/server
npm run deploy:recommendations-schema
```

This script will:
- ✅ Read the migration file
- ✅ Execute the SQL commands
- ✅ Verify table creation
- ✅ Test basic functionality
- ✅ Clean up test data

---

## 📋 Manual Deployment Options

### Method 2: Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

3. **Execute Migration**
   - Copy the entire content from `server/src/migrations/create_bloodwork_recommendations_table.sql`
   - Paste it into the SQL editor
   - Click **"Run"**

4. **Verify Deployment**
   - Go to **"Table Editor"**
   - Look for `bloodwork_recommendations` table
   - Verify the table structure

### Method 3: Supabase CLI (Production)

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to Your Project**
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

4. **Deploy Schema**
   ```bash
   cd /Users/tammybusateri/development/health/server
   supabase db push src/migrations/create_bloodwork_recommendations_table.sql
   ```

### Method 4: Direct SQL Execution

If you have database access, you can execute the SQL directly:

```bash
# Using psql (if you have direct PostgreSQL access)
psql $DATABASE_URL -f src/migrations/create_bloodwork_recommendations_table.sql

# Or using any SQL client connected to your Supabase database
```

---

## 🔍 What Gets Created

### Table Structure
```sql
bloodwork_recommendations
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key)
├── test_name (TEXT)
├── normalized_test_name (TEXT)
├── category (TEXT)
├── recommendation_type (TEXT, Enum)
├── recommendation_title (TEXT)
├── recommendation_text (TEXT)
├── rationale (TEXT)
├── confidence (DECIMAL, 0-1)
├── severity (TEXT, Enum: low/medium/high)
├── status (TEXT, Enum: active/superseded/resolved)
├── source_document_ids (TEXT[])
├── source_result_ids (TEXT[])
├── source_trend_window (JSONB)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Performance Indexes
- `idx_bloodwork_recommendations_user_id` - User queries
- `idx_bloodwork_recommendations_status` - Status filtering
- `idx_bloodwork_recommendations_recommendation_type` - Type filtering
- `idx_bloodwork_recommendations_severity` - Severity filtering
- `idx_bloodwork_recommendations_test_name` - Marker queries
- `idx_bloodwork_recommendations_created_at` - Date ordering
- `idx_bloodwork_recommendations_user_status` - Combined user/status queries

### Security Policies (RLS)
- ✅ Users can only read their own recommendations
- ✅ Users can only insert their own recommendations
- ✅ Users can only update their own recommendations
- ✅ Users can only delete their own recommendations
- ✅ Service role has full access

### Triggers
- ✅ `updated_at` trigger for automatic timestamp updates

---

## ✅ Verification Steps

After deployment, verify everything works:

### 1. Check Table Exists
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'bloodwork_recommendations'
);
```

### 2. Check Table Structure
```sql
\d bloodwork_recommendations
```

### 3. Test with Validation Script
```bash
cd /Users/tammybusateri/development/health/server
npm run validate:intelligence:e2e
```

### 4. Test API Endpoints
```bash
# Start the server
npm run dev

# Test recommendation generation (in another terminal)
curl -X POST http://localhost:3000/bloodwork/recommendations/generate/<user_id> \
  -H "Content-Type: application/json" \
  -d '{"force_regenerate": true}'
```

---

## 🔧 Troubleshooting

### Common Issues

#### "Table already exists"
```sql
-- Drop and recreate (WARNING: This deletes all data)
DROP TABLE IF EXISTS bloodwork_recommendations CASCADE;
-- Then re-run the migration
```

#### "Permission denied"
- Ensure you're using the service role key
- Check RLS policies are correctly set
- Verify user has proper permissions

#### "Function gen_random_uuid() does not exist"
```sql
-- Alternative for older PostgreSQL versions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Replace gen_random_uuid() with:
-- uuid_generate_v4() (requires uuid-ossp extension)
```

#### "RLS policies conflict"
```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'bloodwork_recommendations';

-- Drop conflicting policies if needed
DROP POLICY IF EXISTS "policy_name" ON bloodwork_recommendations;
```

### Environment Variables Required
Make sure these are set in your `.env` file:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🚀 Next Steps

After successful deployment:

1. **Run Validation**
   ```bash
   npm run validate:intelligence:e2e
   ```

2. **Test with Real Data**
   - Upload bloodwork documents
   - Generate recommendations
   - Verify frontend display

3. **Monitor Performance**
   - Check query performance
   - Monitor recommendation generation times
   - Verify API response times

4. **Production Checklist**
   - [ ] Database schema deployed
   - [ ] Validation tests passing
   - [ ] API endpoints working
   - [ ] Frontend integration tested
   - [ ] Performance monitoring set up

---

## 📞 Support

If you encounter issues:

1. **Check the logs** for detailed error messages
2. **Verify environment variables** are correctly set
3. **Ensure Supabase project** is active and accessible
4. **Run the validation script** to diagnose issues

The deployment script includes comprehensive error handling and will guide you through any issues that arise.

---

*Deployment guide created March 27, 2026*  
*For Bloodwork Intelligence Engine - Wave 2, Part 3*
