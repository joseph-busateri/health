# API ENDPOINT TESTS

**Phase 3: Verify Broken User Journeys Fixed**  
**Backend API Validation Scripts**  
**Date**: April 16, 2026

---

## Overview

This document provides detailed API endpoint tests for all 9 newly registered backend routes.

**Base URL**: `http://localhost:3000/api`  
**Test User ID**: Replace `{userId}` with your actual user ID

---

## 1. Control Tower Routes

### Endpoint: Get Overall Health

**Route**: `GET /api/control-tower/overall-health`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/control-tower/overall-health?user_id={userId}" \
  -H "Accept: application/json"
```

**Expected Response (Success)**:
```json
{
  "success": true,
  "data": {
    "user_id": "{userId}",
    "overall_health_score": 85,
    "categories": {
      "cardiovascular": { "score": 90, "status": "good" },
      "metabolic": { "score": 80, "status": "fair" },
      "recovery": { "score": 85, "status": "good" }
    },
    "timestamp": "2026-04-16T18:00:00.000Z"
  }
}
```

**Expected Response (No Data)**:
```json
{
  "success": false,
  "error": "No health data found for user"
}
```

**Pass Criteria**:
- Status: 200 OK or 404 Not Found
- Response is valid JSON
- No 500 errors

---

## 2. Health Data Hub Routes

### Endpoint: Get Status

**Route**: `GET /api/health-data-hub/status`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/health-data-hub/status?user_id={userId}" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "baseline_complete": true,
    "bloodwork_uploaded": true,
    "workouts_logged": true,
    "supplements_tracked": true
  }
}
```

### Endpoint: Get Baseline Profile

**Route**: `GET /api/health-data-hub/baseline/profile`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/health-data-hub/baseline/profile?user_id={userId}" \
  -H "Accept: application/json"
```

### Endpoint: Update Baseline Profile

**Route**: `POST /api/health-data-hub/baseline/profile`

**Test Command**:
```bash
curl -X POST "http://localhost:3000/api/health-data-hub/baseline/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{userId}",
    "age": 35,
    "weight": 180,
    "height": 72
  }'
```

### Endpoint: Get Workout Schedule

**Route**: `GET /api/health-data-hub/workout-schedule`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/health-data-hub/workout-schedule?user_id={userId}" \
  -H "Accept: application/json"
```

### Endpoint: Get Supplement Intake

**Route**: `GET /api/health-data-hub/supplement-intake`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/health-data-hub/supplement-intake?user_id={userId}" \
  -H "Accept: application/json"
```

### Endpoint: Get Bloodwork Summary

**Route**: `GET /api/health-data-hub/bloodwork/summary`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/health-data-hub/bloodwork/summary?user_id={userId}" \
  -H "Accept: application/json"
```

**Pass Criteria (All Endpoints)**:
- Status: 200 OK or 404 Not Found
- Response is valid JSON
- No 500 errors

---

## 3. Baseline Configuration Routes

### Endpoint: Get Baseline

**Route**: `GET /api/baseline/{userId}`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/baseline/{userId}" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "{userId}",
    "age": 35,
    "weight": 180,
    "height": 72,
    "activity_level": "moderate",
    "goals": ["muscle_gain", "fat_loss"]
  }
}
```

### Endpoint: Update Baseline

**Route**: `POST /api/baseline`

**Test Command**:
```bash
curl -X POST "http://localhost:3000/api/baseline" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{userId}",
    "age": 35,
    "weight": 180,
    "height": 72,
    "activity_level": "moderate"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Baseline updated successfully",
  "data": {
    "user_id": "{userId}",
    "updated_at": "2026-04-16T18:00:00.000Z"
  }
}
```

**Pass Criteria**:
- GET: Status 200 OK or 404 Not Found
- POST: Status 200 OK or 201 Created
- Response is valid JSON
- No 500 errors

---

## 4. Meal Log Routes

### Endpoint: Get Meal Logs

**Route**: `GET /api/meal-logs/{userId}`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/meal-logs/{userId}" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "meal_123",
      "user_id": "{userId}",
      "meal_type": "breakfast",
      "timestamp": "2026-04-16T08:00:00.000Z",
      "items": [
        {
          "name": "Eggs",
          "quantity": 3,
          "calories": 210,
          "protein": 18
        }
      ]
    }
  ]
}
```

### Endpoint: Create Meal Log

**Route**: `POST /api/meal-logs`

**Test Command**:
```bash
curl -X POST "http://localhost:3000/api/meal-logs" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{userId}",
    "meal_type": "breakfast",
    "items": [
      {
        "name": "Eggs",
        "quantity": 3,
        "calories": 210,
        "protein": 18
      }
    ]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Meal logged successfully",
  "data": {
    "id": "meal_123",
    "user_id": "{userId}",
    "created_at": "2026-04-16T18:00:00.000Z"
  }
}
```

**Pass Criteria**:
- GET: Status 200 OK or 404 Not Found
- POST: Status 200 OK or 201 Created
- Response is valid JSON
- No 500 errors

---

## 5. Nutrition Extraction Routes

### Endpoint: Get Nutrition Entries

**Route**: `GET /api/nutrition/entries/{userId}`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/nutrition/entries/{userId}" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "nutrition_123",
      "user_id": "{userId}",
      "extracted_at": "2026-04-16T18:00:00.000Z",
      "source": "photo",
      "nutrition": {
        "calories": 500,
        "protein": 30,
        "carbs": 50,
        "fat": 20
      }
    }
  ]
}
```

### Endpoint: Get Latest Nutrition Entry

**Route**: `GET /api/nutrition/entry/latest/{userId}`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/nutrition/entry/latest/{userId}" \
  -H "Accept: application/json"
```

### Endpoint: Extract Nutrition

**Route**: `POST /api/nutrition/extract`

**Test Command**:
```bash
curl -X POST "http://localhost:3000/api/nutrition/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{userId}",
    "source": "text",
    "content": "3 eggs, 2 slices of toast, 1 cup of coffee"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Nutrition extracted successfully",
  "data": {
    "id": "nutrition_123",
    "nutrition": {
      "calories": 400,
      "protein": 25,
      "carbs": 30,
      "fat": 15
    }
  }
}
```

**Pass Criteria**:
- GET: Status 200 OK or 404 Not Found
- POST: Status 200 OK or 201 Created
- Response is valid JSON
- No 500 errors

---

## 6. Bloodwork Recommendations Routes

### Endpoint: Get Recommendations

**Route**: `GET /api/bloodwork-recommendations/{userId}`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/bloodwork-recommendations/{userId}" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "rec_123",
      "user_id": "{userId}",
      "category": "vitamin_d",
      "recommendation": "Increase Vitamin D supplementation",
      "priority": "high",
      "status": "active"
    }
  ]
}
```

### Endpoint: Get Active Recommendations

**Route**: `GET /api/bloodwork-recommendations/{userId}/active`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/bloodwork-recommendations/{userId}/active" \
  -H "Accept: application/json"
```

### Endpoint: Generate Recommendations

**Route**: `POST /api/bloodwork-recommendations/generate/{userId}`

**Test Command**:
```bash
curl -X POST "http://localhost:3000/api/bloodwork-recommendations/generate/{userId}" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Recommendations generated successfully",
  "data": {
    "count": 5,
    "recommendations": [...]
  }
}
```

**Pass Criteria**:
- GET: Status 200 OK or 404 Not Found
- POST: Status 200 OK or 201 Created
- Response is valid JSON
- No 500 errors

---

## 7. Bloodwork Trends Routes

### Endpoint: Get Trends

**Route**: `GET /api/bloodwork-trends/{userId}`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/bloodwork-trends/{userId}" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "{userId}",
    "trends": [
      {
        "marker": "vitamin_d",
        "values": [
          { "date": "2026-01-01", "value": 30 },
          { "date": "2026-04-01", "value": 45 }
        ],
        "trend": "improving"
      }
    ]
  }
}
```

### Endpoint: Get Trend Summary

**Route**: `GET /api/bloodwork-trends/{userId}/summary`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/bloodwork-trends/{userId}/summary" \
  -H "Accept: application/json"
```

### Endpoint: Get Supported Markers

**Route**: `GET /api/bloodwork-trends/supported-markers`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/bloodwork-trends/supported-markers" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "markers": [
      "vitamin_d",
      "testosterone",
      "cholesterol",
      "glucose"
    ]
  }
}
```

### Endpoint: Get Categories

**Route**: `GET /api/bloodwork-trends/categories`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/bloodwork-trends/categories" \
  -H "Accept: application/json"
```

**Pass Criteria**:
- Status: 200 OK or 404 Not Found
- Response is valid JSON
- No 500 errors

---

## 8. Adherence Engine Routes

### Endpoint: Get Today's Adherence

**Route**: `GET /api/adherence/{userId}/today`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/adherence/{userId}/today" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "{userId}",
    "date": "2026-04-16",
    "adherence_score": 85,
    "categories": {
      "workouts": { "completed": 1, "planned": 1, "score": 100 },
      "supplements": { "completed": 3, "planned": 4, "score": 75 },
      "nutrition": { "completed": 3, "planned": 3, "score": 100 }
    }
  }
}
```

### Endpoint: Get Adherence History

**Route**: `GET /api/adherence/{userId}/history`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/adherence/{userId}/history" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-04-16",
      "adherence_score": 85
    },
    {
      "date": "2026-04-15",
      "adherence_score": 90
    }
  ]
}
```

**Pass Criteria**:
- Status: 200 OK or 404 Not Found
- Response is valid JSON
- No 500 errors

---

## 9. Autonomous Adjustments Routes

### Endpoint: Get Today's Autonomous

**Route**: `GET /api/autonomous/{userId}/today`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/autonomous/{userId}/today" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "{userId}",
    "date": "2026-04-16",
    "adjustments": [
      {
        "category": "workout_volume",
        "adjustment": "decrease",
        "amount": 10,
        "reason": "Recovery score low"
      }
    ]
  }
}
```

### Endpoint: Get Autonomous History

**Route**: `GET /api/autonomous/{userId}/history`

**Test Command**:
```bash
curl -X GET "http://localhost:3000/api/autonomous/{userId}/history" \
  -H "Accept: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-04-16",
      "adjustments_count": 3
    },
    {
      "date": "2026-04-15",
      "adjustments_count": 2
    }
  ]
}
```

**Pass Criteria**:
- Status: 200 OK or 404 Not Found
- Response is valid JSON
- No 500 errors

---

## Batch Test Script

**Run all tests at once**:

```bash
#!/bin/bash

USER_ID="your_user_id_here"
BASE_URL="http://localhost:3000/api"

echo "Testing Control Tower..."
curl -s "$BASE_URL/control-tower/overall-health?user_id=$USER_ID" | jq .

echo "Testing Health Data Hub..."
curl -s "$BASE_URL/health-data-hub/status?user_id=$USER_ID" | jq .

echo "Testing Baseline..."
curl -s "$BASE_URL/baseline/$USER_ID" | jq .

echo "Testing Meal Logs..."
curl -s "$BASE_URL/meal-logs/$USER_ID" | jq .

echo "Testing Nutrition..."
curl -s "$BASE_URL/nutrition/entries/$USER_ID" | jq .

echo "Testing Bloodwork Recommendations..."
curl -s "$BASE_URL/bloodwork-recommendations/$USER_ID" | jq .

echo "Testing Bloodwork Trends..."
curl -s "$BASE_URL/bloodwork-trends/$USER_ID" | jq .

echo "Testing Adherence..."
curl -s "$BASE_URL/adherence/$USER_ID/today" | jq .

echo "Testing Autonomous..."
curl -s "$BASE_URL/autonomous/$USER_ID/today" | jq .

echo "All tests complete!"
```

**Save as**: `test-api-endpoints.sh`  
**Make executable**: `chmod +x test-api-endpoints.sh`  
**Run**: `./test-api-endpoints.sh`

---

## Validation Checklist

- [ ] All 9 route groups respond
- [ ] No 500 server errors
- [ ] All responses are valid JSON
- [ ] GET endpoints return 200 or 404
- [ ] POST endpoints return 200 or 201
- [ ] Error messages are meaningful
- [ ] Response formats match expectations

---

## Troubleshooting

**500 Errors**:
- Check server logs for stack traces
- Verify controllers exist
- Verify database connections

**404 Errors**:
- Verify routes registered in `server/src/routes/index.ts`
- Check route paths match exactly
- Verify base URL correct

**CORS Errors**:
- Check CORS middleware configuration
- Verify frontend origin allowed

**Timeout Errors**:
- Check database connectivity
- Check for slow queries
- Verify server not overloaded

---

## Production Deployment

After all tests pass:

1. Document any 404s (acceptable if no data)
2. Document any edge cases
3. Verify no 500 errors
4. Mark ready for production

**Status**: [ ] PASS [ ] FAIL  
**Notes**: _______________
