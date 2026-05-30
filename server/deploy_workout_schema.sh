#!/bin/bash

# Deploy Workout Baseline Schema to Supabase
# This script deploys the workout baseline tables to Supabase

SUPABASE_URL="https://awzovfxfzsburnlkqjcx.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3em92ZnhmenNidXJubGtxamN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMxMDE3NSwiZXhwIjoyMDg5ODg2MTc1fQ.ukxLYaxRNCmsNsdbR66y1xTdksRipHvKtYzaEMF53Go"

echo "🚀 Deploying Workout Baseline Schema to Supabase..."

# Read the SQL file and execute it via curl
SQL_FILE="supabase/migrations/001_create_workout_baseline_tables.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL file not found: $SQL_FILE"
    exit 1
fi

echo "📋 Reading SQL migration file..."
SQL_CONTENT=$(cat "$SQL_FILE")

echo "🔗 Connecting to Supabase and executing schema deployment..."

# Execute the SQL using Supabase's REST API
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

echo "📊 Deployment response:"
echo "$RESPONSE"

# Check if deployment was successful
if echo "$RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo "❌ Schema deployment failed"
    echo "$RESPONSE"
    exit 1
else
    echo "✅ Schema deployment completed successfully"
fi

echo "🔍 Verifying table creation..."

# Verify tables were created
VERIFY_RESPONSE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/workout_documents?select=count&limit=1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")

if echo "$VERIFY_RESPONSE" | grep -q "count\|data"; then
    echo "✅ Tables are accessible via PostgREST"
else
    echo "⚠️  Tables may need to be refreshed in PostgREST cache"
fi

echo "🎉 Workout Baseline Schema deployment complete!"
