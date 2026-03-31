# Sleep Number i10 Bed Integration Guide

## 🛏️ **Overview**

Your Sleep Number i10 bed integration is **fully built and ready to use**! This integration automatically syncs your sleep data from your Sleep Number bed to your health tracking system.

---

## ✅ **What's Included**

### **Backend (Complete)**
- ✅ **Sleep Number API Client** - Direct integration with Sleep Number API
- ✅ **Automatic Sync Service** - Daily automatic data synchronization
- ✅ **Data Parser** - Handles JSON/CSV exports and API responses
- ✅ **Secure Token Storage** - Encrypted OAuth tokens
- ✅ **API Endpoints** - Connect, disconnect, sync, stats
- ✅ **Database Schema** - Complete sleep tracking tables

### **Mobile (Complete)**
- ✅ **Connect Screen** - Easy account connection
- ✅ **Upload Screen** - Manual file upload option
- ✅ **Automatic Sync** - Daily at 6 AM
- ✅ **Manual Sync** - Trigger sync anytime

---

## 🚀 **Setup Instructions**

### **Step 1: Database Setup**

Run the Sleep Number migration to create the required tables:

```sql
-- Run this migration file:
server/src/migrations/20260329_sleep_number_api_integration.sql
```

This creates:
- `sleep_number_connections` - Stores your Sleep Number account connection
- `sleep_number_sessions` - Stores sleep data
- `sleep_number_sync_history` - Tracks sync operations
- `sleep_number_sync_queue` - Manages automatic sync jobs

### **Step 2: Environment Variables**

Add to your `.env` file:

```bash
# Already exists - used for token encryption
ENCRYPTION_KEY=your-32-character-encryption-key!!
```

### **Step 3: Start the Server**

```bash
cd server
npm run dev
```

The Sleep Number routes are now available at:
- `POST /sleep-number/:userId/connect` - Connect account
- `POST /sleep-number/:userId/disconnect` - Disconnect account
- `POST /sleep-number/:userId/sync` - Manual sync
- `GET /sleep-number/:userId/sync/stats` - Sync statistics
- `GET /sleep-number/:userId/sleep/latest` - Latest sleep session
- `GET /sleep-number/:userId/sleep/trend` - Sleep trends

### **Step 4: Connect Your Sleep Number Account**

**From Mobile App:**
1. Navigate to Sleep Number Connect screen
2. Enter your Sleep Number email and password
3. Tap "Connect Account"
4. Your account is now connected!

**What Happens:**
- Your Sleep Number credentials are securely encrypted
- Initial sync fetches last 30 days of sleep data
- Automatic daily sync is enabled at 6 AM
- All sleep metrics are saved to your health database

---

## 📊 **Data Collected**

Your Sleep Number i10 bed tracks comprehensive sleep data:

### **Sleep Duration**
- Total sleep time
- Time in bed
- Awake time
- Restless time
- Restful time

### **Sleep Quality**
- Sleep IQ score (0-100)
- Sleep efficiency percentage
- Light sleep duration
- Deep sleep duration
- REM sleep duration

### **Biometrics**
- Average heart rate
- Min/max heart rate
- Average respiratory rate
- Min/max respiratory rate

### **Movement & Position**
- Total movements
- Position changes
- Time on left side
- Time on right side
- Time on back
- Time on stomach

### **Bed Settings**
- Sleep Number setting (firmness)
- Average Sleep Number throughout night
- Room temperature

---

## 🔄 **Automatic Sync**

**How it works:**
1. **Daily Schedule:** Syncs every day at 6 AM (configurable)
2. **Smart Sync:** Only fetches new data since last sync
3. **Retry Logic:** Automatically retries failed syncs
4. **Error Handling:** Logs errors and notifies you

**Sync Frequency Options:**
- Daily (default)
- Twice daily
- Hourly (for power users)

---

## 🎯 **API Endpoints**

### **Connect Account**
```bash
POST /sleep-number/:userId/connect
Content-Type: application/json

{
  "username": "your-email@example.com",
  "password": "your-password"
}

Response:
{
  "success": true,
  "message": "Sleep Number connected successfully"
}
```

### **Manual Sync**
```bash
POST /sleep-number/:userId/sync

Response:
{
  "success": true,
  "message": "Sync completed successfully"
}
```

### **Get Sync Stats**
```bash
GET /sleep-number/:userId/sync/stats?days=30

Response:
{
  "success": true,
  "data": {
    "total_syncs": 30,
    "successful_syncs": 29,
    "failed_syncs": 1,
    "total_sessions_synced": 145,
    "last_sync_date": "2026-03-31T06:00:00Z",
    "success_rate": 96.7
  }
}
```

### **Get Latest Sleep Session**
```bash
GET /sleep-number/:userId/sleep/latest

Response:
{
  "success": true,
  "data": {
    "session_date": "2026-03-30",
    "total_sleep_time_minutes": 456,
    "sleep_iq_score": 82,
    "avg_heart_rate": 58,
    "deep_sleep_minutes": 120,
    "light_sleep_minutes": 240,
    "rem_sleep_minutes": 96
  }
}
```

### **Get Sleep Trend**
```bash
GET /sleep-number/:userId/sleep/trend?days=7

Response:
{
  "success": true,
  "data": [
    {
      "date": "2026-03-30",
      "sleep_duration": 7.6,
      "sleep_iq": 82,
      "deep_sleep_percent": 26.3
    },
    ...
  ]
}
```

---

## 🔐 **Security**

**Your data is secure:**
- ✅ OAuth tokens encrypted with AES-256
- ✅ Passwords never stored (only used for initial auth)
- ✅ Tokens automatically refreshed
- ✅ Secure HTTPS communication with Sleep Number API
- ✅ Database connection encrypted

---

## 🧪 **Testing**

### **Test Connection**
```bash
# From mobile app
1. Open Sleep Number Connect screen
2. Enter credentials
3. Tap "Connect Account"
4. Should see "Connected!" message
```

### **Test Manual Sync**
```bash
# From mobile app (after connecting)
1. Tap "Sync Now" button
2. Should see "Sync Complete" message
3. Check your sleep data in the app
```

### **Test API Directly**
```bash
# Connect account
curl -X POST http://localhost:3000/sleep-number/default-user/connect \
  -H "Content-Type: application/json" \
  -d '{"username":"your-email@example.com","password":"your-password"}'

# Trigger sync
curl -X POST http://localhost:3000/sleep-number/default-user/sync

# Get stats
curl http://localhost:3000/sleep-number/default-user/sync/stats?days=30
```

---

## 📱 **Mobile Screens**

### **Sleep Number Connect Screen**
**Location:** `mobile/src/screens/SleepNumberConnectScreen.tsx`

**Features:**
- Account connection form
- Connection status display
- Auto-sync toggle
- Sync frequency selector
- Manual sync button
- Disconnect option

### **Sleep Number Upload Screen**
**Location:** `mobile/src/screens/SleepNumberUploadScreen.tsx`

**Features:**
- Manual file upload (CSV/JSON)
- Sleep Number app export support
- Bulk data import
- Upload history

---

## 🔧 **Troubleshooting**

### **Connection Failed**
**Problem:** Can't connect Sleep Number account  
**Solutions:**
- Verify email and password are correct
- Check Sleep Number account is active
- Ensure server is running
- Check network connectivity

### **Sync Failed**
**Problem:** Automatic sync not working  
**Solutions:**
- Check connection status
- Verify tokens haven't expired
- Check sync queue table
- Review error logs

### **No Data Appearing**
**Problem:** Sleep data not showing in app  
**Solutions:**
- Trigger manual sync
- Check database for sessions
- Verify date range
- Check Sleep Number bed is recording data

### **Token Expired**
**Problem:** "Token expired" error  
**Solutions:**
- Reconnect account
- Check token expiration date
- Verify refresh token is valid

---

## 📊 **Data Flow**

```
Sleep Number i10 Bed
        ↓
Sleep Number API
        ↓
Your Backend (API Client)
        ↓
Sync Service (Parse & Transform)
        ↓
Database (Encrypted Storage)
        ↓
Mobile App (Display & Analysis)
```

---

## 🎯 **Integration with Health System**

Your Sleep Number data integrates with:

✅ **Recovery Engine** - Sleep quality affects recovery score  
✅ **Daily Logs** - Sleep hours tracked automatically  
✅ **Voice Interview** - AI asks about sleep quality  
✅ **Control Tower** - Sleep metrics in dashboard  
✅ **Trends** - Long-term sleep pattern analysis  

---

## 💡 **Pro Tips**

1. **Enable Auto-Sync:** Let the system automatically fetch your sleep data daily
2. **Check Sync Stats:** Monitor sync success rate to catch issues early
3. **Manual Sync:** Trigger sync after waking up for immediate data
4. **Review Trends:** Use 7-day and 30-day trends to optimize sleep
5. **Set Goals:** Create sleep goals based on your Sleep IQ scores

---

## 🚀 **Next Steps**

1. ✅ **Connect your Sleep Number account** (from mobile app)
2. ✅ **Wait for first sync** (or trigger manually)
3. ✅ **Review your sleep data** in the app
4. ✅ **Set sleep goals** based on your baseline
5. ✅ **Monitor trends** to improve sleep quality

---

## 📞 **Support**

**Sleep Number API Documentation:**
https://www.sleepnumber.com/pages/sleepiq-technology

**Your Integration Status:**
- Backend: ✅ Complete
- Mobile: ✅ Complete
- Database: ✅ Schema ready
- API: ✅ Routes connected

**Everything is ready to use!** 🎉

---

**Your Sleep Number i10 bed is now fully integrated with your health tracking system!**
