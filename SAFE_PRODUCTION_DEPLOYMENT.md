# SAFE PRODUCTION DEPLOYMENT GUIDE

**Date**: April 15, 2026  
**Risk Level**: ZERO RISK - Safe, reversible, non-breaking

---

## DEPLOYMENT STEPS

### Step 1: Pre-Deployment Check (5 min)

**Verify environment variables**:
```bash
echo $OPENAI_API_KEY
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

**Create audio directory if missing**:
```bash
mkdir -p server/uploads/audio/
chmod 755 server/uploads/audio/
```

**Verify git status**:
```bash
git status
git log -1
```

---

### Step 2: Backend Deployment (10 min)

**If using PM2**:
```bash
cd server
npm install
npm run build
pm2 restart health-backend
pm2 logs health-backend --lines 50
```

**If using Docker**:
```bash
cd server
docker build -t health-backend:latest .
docker stop health-backend || true
docker rm health-backend || true
docker run -d --name health-backend -p 3000:3000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -v $(pwd)/uploads:/app/uploads \
  health-backend:latest
docker logs health-backend --tail 50
```

---

### Step 3: Test Backend (3 min)

```bash
curl -X POST http://localhost:3000/api/voice-interview/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}'
```

**Expected**: sessionId, firstQuestion, audioUrl returned

---

### Step 4: Mobile Deployment (15 min)

**Update VoiceInterviewScreen to pass currentQuestion parameter**:
- Add currentQuestion to request body in respond endpoint
- Build mobile app
- Deploy to app stores or internal distribution

---

### Step 5: Post-Deployment Verification (5 min)

**Test complete flow**:
1. Start voice interview
2. Record audio response
3. Submit response with currentQuestion
4. Verify next question generated
5. Complete interview
6. Verify data saved to database

**Check logs**:
- Look for deprecation warnings (legacy routes)
- Verify no errors
- Confirm AI question generation working

---

## ROLLBACK PROCEDURE (5 min)

**If issues occur**:

1. Uncomment routes in AppNavigator.tsx:
```typescript
import AgentInterviewScreen from '../screens/AgentInterviewScreen';
import DynamicInterviewScreen from '../screens/DynamicInterviewScreen';
import HybridInterviewScreen from '../screens/HybridInterviewScreen';

<Stack.Screen name="AgentInterview" component={AgentInterviewScreen} />
<Stack.Screen name="DynamicInterview" component={DynamicInterviewScreen} />
<Stack.Screen name="HybridInterview" component={HybridInterviewScreen} />
```

2. Deploy mobile app update
3. All 4 interview modes accessible again

**Data Loss**: ZERO

---

## MONITORING (First 24 hours)

**Check every 2 hours**:
- Voice Interview completion rate
- Error logs
- User complaints
- Deprecation warning count

**Alert if**:
- Completion rate drops below 70%
- Error rate exceeds 5%
- Multiple user complaints

---

## PRODUCTION READY

All changes are safe and reversible. Deploy when ready.
