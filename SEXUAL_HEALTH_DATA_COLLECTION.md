# Sexual Health Data Collection - How It Works

## 🎯 **Overview**

Sexual Health Check-Ins are **weekly self-reported assessments** that track libido, satisfaction, and stress impact on intimacy. This data feeds into the Sexual Health component (15% weight) of the Overall Health Score.

---

## 📊 **What Data is Collected**

### **Sexual Health Check-In Record:**
```typescript
{
  userId: string,
  takenAt: string,              // ISO timestamp
  desireLevel: number,          // 1-5 scale
  satisfactionLevel: number,    // 1-5 scale
  stressImpact: number,         // 1-5 scale (higher = more stress)
  status: 'Aligned' | 'Monitoring' | 'Concerned',
  notes?: string                // Optional free text
}
```

### **Sexual Health Status Record:**
```typescript
{
  userId: string,
  takenAt: string,              // ISO timestamp
  status: 'Aligned' | 'Monitoring' | 'Concerned',
  confidence?: number,          // 0-1 (AI confidence if auto-generated)
  summary?: string              // Optional summary text
}
```

---

## 📥 **How Data is Collected**

### **Current Implementation: MANUAL ENTRY ONLY**

**Status:** ⚠️ **No dedicated UI currently exists**

The system is designed to accept sexual health check-ins, but there's **no mobile screen or form built yet** for users to submit this data.

### **Expected Collection Method:**

#### **1. Weekly Reminder System**
- Reminder type: `weekly_sexual_health`
- Frequency: Once per week
- Stored in `reminders` table
- Triggers notification to user

#### **2. User Completes Check-In** (UI NOT YET BUILT)
Expected form would collect:
- **Desire Level** (1-5 scale)
  - 1 = Very low/Non-existent
  - 2 = Lower than usual
  - 3 = Normal
  - 4 = Higher than usual
  - 5 = Very high
  
- **Satisfaction Level** (1-5 scale)
  - 1 = Very dissatisfied
  - 2 = Somewhat dissatisfied
  - 3 = Neutral
  - 4 = Satisfied
  - 5 = Very satisfied
  
- **Stress Impact** (1-5 scale)
  - 1 = No impact
  - 2 = Minimal impact
  - 3 = Moderate impact
  - 4 = Significant impact
  - 5 = Severe impact
  
- **Status** (Auto-selected or manual)
  - Aligned: Goals and reality match
  - Monitoring: Watching for changes
  - Concerned: Issues need attention
  
- **Notes** (Optional free text)

#### **3. Data Saved to Database**
- Table: `sexual_health_check_ins`
- Service: `healthMetricsService.ts`
- Function: Would be `createSexualHealthCheckIn()` (NOT YET IMPLEMENTED)

---

## 🗄️ **Database Schema**

### **Table: `sexual_health_check_ins`**
```sql
CREATE TABLE sexual_health_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  desire_level INTEGER CHECK (desire_level BETWEEN 1 AND 5),
  satisfaction_level INTEGER CHECK (satisfaction_level BETWEEN 1 AND 5),
  stress_impact INTEGER CHECK (stress_impact BETWEEN 1 AND 5),
  status TEXT CHECK (status IN ('Aligned', 'Monitoring', 'Concerned')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sexual_check_ins_user_taken 
  ON sexual_health_check_ins(user_id, taken_at DESC);
```

### **Table: `sexual_health_status`**
```sql
CREATE TABLE sexual_health_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT CHECK (status IN ('Aligned', 'Monitoring', 'Concerned')),
  confidence DECIMAL(3,2) CHECK (confidence BETWEEN 0 AND 1),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sexual_status_user_taken 
  ON sexual_health_status(user_id, taken_at DESC);
```

---

## 🔄 **Data Flow (Current State)**

### **Reading Data (Works):**
```
Dashboard Request
    ↓
getDashboardSummary(userId)
    ↓
getRecentSexualHealthCheckIns(userId, 6)
    ↓
SELECT * FROM sexual_health_check_ins
WHERE user_id = ?
ORDER BY taken_at DESC
LIMIT 6
    ↓
Returns: SexualHealthCheckInRecord[]
    ↓
buildSexualHealthComponent()
    ↓
Computes score, trend, insights
    ↓
Included in Control Tower Summary
```

### **Writing Data (Missing):**
```
❌ No UI Screen
❌ No API Endpoint
❌ No Controller
❌ No Service Function

Expected flow would be:
User fills form
    ↓
POST /sexual-health/check-in
    ↓
createSexualHealthCheckIn(data)
    ↓
INSERT INTO sexual_health_check_ins
    ↓
Return success
```

---

## 🚧 **What's Missing**

### **Backend (Partially Missing):**
- ✅ Database tables exist (assumed from service code)
- ✅ Read functions exist (`getRecentSexualHealthCheckIns`)
- ❌ **Create/Insert functions missing**
- ❌ **API endpoints missing**
- ❌ **Controllers missing**
- ❌ **Routes missing**

### **Frontend (Completely Missing):**
- ❌ **No Sexual Health Check-In screen**
- ❌ **No form UI**
- ❌ **No reminder notification handling**
- ❌ **No data submission logic**

---

## 📱 **How It SHOULD Work (Ideal Flow)**

### **1. Weekly Reminder Triggers**
```
Reminder Service
    ↓
Checks: weekly_sexual_health reminder due
    ↓
Sends push notification
    ↓
"Time for your weekly sexual health check-in"
```

### **2. User Opens App**
```
Tap notification
    ↓
Opens SexualHealthCheckInScreen
    ↓
Shows form with 3 sliders + status selector + notes
```

### **3. User Completes Form**
```
Desire: 4/5 ⭐⭐⭐⭐☆
Satisfaction: 4/5 ⭐⭐⭐⭐☆
Stress Impact: 2/5 ⭐⭐☆☆☆
Status: Aligned ✅
Notes: "Feeling good this week"
    ↓
Tap "Submit"
```

### **4. Data Saved**
```
POST /api/sexual-health/check-in
{
  "user_id": "user123",
  "desire_level": 4,
  "satisfaction_level": 4,
  "stress_impact": 2,
  "status": "Aligned",
  "notes": "Feeling good this week"
}
    ↓
Saved to sexual_health_check_ins table
    ↓
Reminder marked complete
    ↓
Success message shown
```

### **5. Data Used in Dashboard**
```
Next dashboard load
    ↓
Fetches last 6 check-ins
    ↓
Computes sexual health score
    ↓
Shows in Control Tower
```

---

## 🎯 **Current Workaround**

Since there's no UI, data would need to be entered:

### **Option 1: Direct Database Insert**
```sql
INSERT INTO sexual_health_check_ins (
  user_id,
  taken_at,
  desire_level,
  satisfaction_level,
  stress_impact,
  status,
  notes
) VALUES (
  'user123',
  NOW(),
  4,
  4,
  2,
  'Aligned',
  'Feeling good this week'
);
```

### **Option 2: API Call (if endpoint existed)**
```bash
curl -X POST http://localhost:3000/api/sexual-health/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "desire_level": 4,
    "satisfaction_level": 4,
    "stress_impact": 2,
    "status": "Aligned",
    "notes": "Feeling good this week"
  }'
```

---

## 🔧 **What Needs to be Built**

### **Backend (Estimated: 2-3 hours):**

1. **Service Function:**
```typescript
// In healthMetricsService.ts
export const createSexualHealthCheckIn = async (
  data: {
    userId: string;
    desireLevel: number;
    satisfactionLevel: number;
    stressImpact: number;
    status: SexualHealthStatusLevel;
    notes?: string;
  }
): Promise<SexualHealthCheckInRecord> => {
  const { data: result, error } = await supabase
    .from(SEXUAL_CHECK_INS_TABLE)
    .insert({
      user_id: data.userId,
      taken_at: new Date().toISOString(),
      desire_level: data.desireLevel,
      satisfaction_level: data.satisfactionLevel,
      stress_impact: data.stressImpact,
      status: data.status,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSexualCheckInRow(result);
};
```

2. **Controller:**
```typescript
// New file: sexualHealthController.ts
export const createCheckIn = async (req, res) => {
  const { user_id, desire_level, satisfaction_level, stress_impact, status, notes } = req.body;
  
  const checkIn = await createSexualHealthCheckIn({
    userId: user_id,
    desireLevel: desire_level,
    satisfactionLevel: satisfaction_level,
    stressImpact: stress_impact,
    status,
    notes,
  });
  
  res.status(201).json({ success: true, data: checkIn });
};
```

3. **Routes:**
```typescript
// New file: sexualHealth.routes.ts
router.post('/check-in', createCheckIn);
router.get('/check-ins/:user_id', getCheckIns);
router.get('/status/:user_id', getStatus);
```

### **Frontend (Estimated: 4-6 hours):**

1. **Screen: `SexualHealthCheckInScreen.tsx`**
   - 3 slider inputs (1-5 scale)
   - Status selector (Aligned/Monitoring/Concerned)
   - Notes text area
   - Submit button
   - Success/error handling

2. **Navigation:**
   - Add to app navigation
   - Link from reminders
   - Link from dashboard

3. **API Integration:**
   - Fetch function for submission
   - Loading states
   - Error handling

---

## 📊 **How the Data is Used**

Once collected, the data feeds into:

### **Sexual Health Score Calculation:**
```typescript
desire = (desireLevel - 1) / 4        // Normalize to 0-1
satisfaction = (satisfactionLevel - 1) / 4
stress = (5 - stressImpact) / 4       // Invert (lower stress = better)

checkInScore = (desire × 0.4) + (satisfaction × 0.4) + (stress × 0.2)

reminderScore = (total - overdue) / total

blendedScore = (checkInScore × 0.7) + (reminderScore × 0.3)
```

### **Trend Analysis:**
- Compares last 5 check-ins
- Delta ≥5 → Improving
- Delta ≤-5 → Declining
- Otherwise → Stable

### **Insights Generated:**
- "X sexual health reminder(s) are overdue"
- "Stress heavily impacting sexual health" (if stress ≥ 4)
- "Desire score trending low" (if desire ≤ 2)
- "Sexual health status aligned with goals" (if status = Aligned)

### **Recommendations:**
- Score < 60: "Plan a low-pressure connection ritual"
- Score 60-80: "Maintain weekly check-ins"
- Score ≥ 80: "Sexual health cadence looks strong"

---

## ✅ **Summary**

**Current State:**
- ✅ Database schema exists
- ✅ Read functions work
- ✅ Scoring logic works
- ✅ Dashboard integration works
- ❌ **No way for users to submit data**

**Collection Method:**
- **Intended:** Weekly self-reported check-in via mobile app
- **Reality:** Manual database inserts or API calls (no UI)

**What's Needed:**
- Backend: Create/insert functions + API endpoints (~2-3 hours)
- Frontend: Check-in screen + form UI (~4-6 hours)
- Total: ~6-9 hours of development

**Why It Matters:**
- Sexual health is 15% of overall health score
- Weekly tracking helps identify hormonal/stress patterns
- Early detection of libido/satisfaction issues
- Guides recommendations for connection rituals and stress management
