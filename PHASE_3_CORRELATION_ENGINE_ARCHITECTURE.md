# PHASE 3: CORRELATION ENGINE - ARCHITECTURE DESIGN

**Date**: April 15, 2026  
**Status**: 🏗️ **IN DESIGN**  
**Backend Phase**: Phase 24  
**UI Phase**: Phase 24 UI

---

## 🎯 OBJECTIVE

**Goal**: Enhance Phase 23's correlation detection with historical tracking, trend analysis, intelligent caching, and mobile UI for actionable health insights.

**Building On**: Phase 23 already detects 8 correlation types in real-time. Phase 3 adds:
- Historical correlation storage and retrieval
- Trend analysis (improving/worsening patterns)
- Intelligent caching for performance
- Alert system for critical correlations
- Mobile UI for visualization and action

---

## 📐 ARCHITECTURE OVERVIEW

### **Phase 24 Backend Components**

1. **Historical Correlation Storage Service**
   - Store correlation detections in database
   - Track correlation history over time
   - Enable trend analysis

2. **Correlation Trend Analysis Service**
   - Analyze correlation patterns over 7/30/90 days
   - Detect improving vs worsening trends
   - Identify recurring vs one-time correlations

3. **Correlation Caching Layer**
   - Cache unified snapshots (15 min TTL)
   - Cache correlation analysis (15 min TTL)
   - Reduce database load and improve response times

4. **Alert Detection Service**
   - Monitor for critical correlations
   - Track correlation severity changes
   - Generate actionable alerts

5. **Enhanced API Endpoints**
   - Historical correlation retrieval
   - Trend analysis endpoints
   - Alert management endpoints

### **Phase 24 UI Components**

1. **Correlation Insights Screen**
   - Display current correlations by severity
   - Show correlation trends over time
   - Provide actionable recommendations

2. **Correlation Detail View**
   - Deep dive into specific correlation
   - Historical pattern visualization
   - Related data source details

3. **Alert Banner/Notifications**
   - Critical correlation alerts
   - Trend change notifications
   - Action prompts

---

## 🗄️ DATABASE SCHEMA

### **New Table: `correlation_history`**

```sql
CREATE TABLE correlation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    detection_date DATE NOT NULL,
    
    -- Correlation details
    correlation_id TEXT NOT NULL,
    correlation_type TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    
    -- Pattern details
    pattern TEXT NOT NULL,
    insight TEXT NOT NULL,
    recommendation TEXT,
    
    -- Source tracking
    sources JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT correlation_history_user_date_idx 
        UNIQUE (user_id, detection_date, correlation_id)
);

CREATE INDEX idx_correlation_history_user_date 
    ON correlation_history(user_id, detection_date DESC);

CREATE INDEX idx_correlation_history_type 
    ON correlation_history(correlation_type, user_id, detection_date DESC);

CREATE INDEX idx_correlation_history_severity 
    ON correlation_history(severity, user_id, detection_date DESC)
    WHERE severity IN ('warning', 'critical');
```

### **New Table: `correlation_alerts`**

```sql
CREATE TABLE correlation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    correlation_history_id UUID REFERENCES correlation_history(id) ON DELETE CASCADE,
    
    -- Alert details
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'new_critical',
        'severity_increase',
        'recurring_pattern',
        'trend_worsening'
    )),
    message TEXT NOT NULL,
    action_required TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT correlation_alerts_user_status_idx 
        INDEX (user_id, status, created_at DESC)
);

CREATE INDEX idx_correlation_alerts_active 
    ON correlation_alerts(user_id, created_at DESC)
    WHERE status = 'active';
```

---

## 🔧 BACKEND SERVICES (Phase 24)

### **1. Historical Correlation Service**
**File**: `server/src/services/correlationHistoryService.ts`

**Functions**:
- `saveCorrelationHistory(userId, date, correlations)` - Store daily correlations
- `getCorrelationHistory(userId, days)` - Retrieve historical correlations
- `getCorrelationByType(userId, type, days)` - Get specific correlation type history
- `getCorrelationTrend(userId, correlationId, days)` - Track specific correlation over time

### **2. Correlation Trend Analysis Service**
**File**: `server/src/services/correlationTrendService.ts`

**Functions**:
- `analyzeTrends(userId, days)` - Analyze all correlation trends
- `detectRecurringPatterns(userId, type)` - Find recurring correlations
- `calculateSeverityTrend(userId, correlationId)` - Track severity changes
- `identifyImprovingPatterns(userId)` - Find positive trends
- `identifyWorseningPatterns(userId)` - Find negative trends

### **3. Correlation Cache Service**
**File**: `server/src/services/correlationCacheService.ts`

**Functions**:
- `cacheSnapshot(userId, date, snapshot)` - Cache unified snapshot
- `getCachedSnapshot(userId, date)` - Retrieve cached snapshot
- `cacheCorrelations(userId, date, analysis)` - Cache correlation analysis
- `getCachedCorrelations(userId, date)` - Retrieve cached correlations
- `invalidateCache(userId)` - Clear user cache

**Implementation**: In-memory cache with Redis-like TTL (15 minutes)

### **4. Alert Detection Service**
**File**: `server/src/services/correlationAlertService.ts`

**Functions**:
- `detectAlerts(userId, currentCorrelations, historicalCorrelations)` - Find alert conditions
- `createAlert(userId, alertType, correlation)` - Create new alert
- `getActiveAlerts(userId)` - Get unacknowledged alerts
- `acknowledgeAlert(alertId)` - Mark alert as seen
- `resolveAlert(alertId)` - Mark alert as resolved

**Alert Triggers**:
- New critical correlation detected
- Correlation severity increased
- Recurring pattern (3+ times in 30 days)
- Trend worsening (severity increasing over time)

### **5. Enhanced Unified Health Service**
**File**: `server/src/services/unifiedHealthDataService.ts` (modified)

**Enhancements**:
- Integrate caching layer
- Auto-save correlations to history
- Trigger alert detection
- Return cached data when available

---

## 🌐 API ENDPOINTS (Phase 24)

### **Historical Correlations**
```
GET /api/unified-health/:userId/correlations/history?days=30
GET /api/unified-health/:userId/correlations/type/:type/history?days=30
GET /api/unified-health/:userId/correlations/:correlationId/trend?days=90
```

### **Trend Analysis**
```
GET /api/unified-health/:userId/correlations/trends?days=30
GET /api/unified-health/:userId/correlations/recurring
GET /api/unified-health/:userId/correlations/improving
GET /api/unified-health/:userId/correlations/worsening
```

### **Alerts**
```
GET /api/unified-health/:userId/alerts
GET /api/unified-health/:userId/alerts/active
POST /api/unified-health/:userId/alerts/:alertId/acknowledge
POST /api/unified-health/:userId/alerts/:alertId/resolve
```

### **Cache Management**
```
DELETE /api/unified-health/:userId/cache (admin only)
```

---

## 📱 MOBILE UI (Phase 24 UI)

### **1. Correlation Insights Screen**
**File**: `mobile/src/screens/CorrelationInsightsScreen.tsx`

**Layout**:
```
┌─────────────────────────────────────┐
│  Correlation Insights               │
├─────────────────────────────────────┤
│  🔴 Critical (1)                    │
│  ⚠️  Warnings (2)                   │
│  ℹ️  Info (3)                       │
├─────────────────────────────────────┤
│  📊 Trends (Last 30 Days)           │
│  [Trend Chart]                      │
├─────────────────────────────────────┤
│  🔄 Recurring Patterns              │
│  - Sleep-Performance (3x)           │
│  - Stress-Recovery (5x)             │
├─────────────────────────────────────┤
│  ✅ Improving                       │
│  - Nutrition-Energy                 │
│                                     │
│  ⚠️  Worsening                      │
│  - Workout-Recovery                 │
└─────────────────────────────────────┘
```

**Features**:
- Severity-based grouping
- Expandable correlation cards
- Trend indicators (↑↓→)
- Action buttons for recommendations

### **2. Correlation Detail Screen**
**File**: `mobile/src/screens/CorrelationDetailScreen.tsx`

**Layout**:
```
┌─────────────────────────────────────┐
│  ← Sleep-Performance Correlation    │
├─────────────────────────────────────┤
│  ⚠️  Warning                        │
│  Confidence: 85%                    │
├─────────────────────────────────────┤
│  Pattern:                           │
│  Low sleep (5h) with high-intensity │
│  workout planned                    │
├─────────────────────────────────────┤
│  Insight:                           │
│  Inadequate sleep may impair        │
│  performance and increase injury    │
│  risk                               │
├─────────────────────────────────────┤
│  Recommendation:                    │
│  Consider reducing workout          │
│  intensity or prioritizing recovery │
│                                     │
│  [Take Action]                      │
├─────────────────────────────────────┤
│  📊 30-Day Trend                    │
│  [Line Chart showing frequency]     │
├─────────────────────────────────────┤
│  Data Sources:                      │
│  • Daily Logs (Sleep: 5h)          │
│  • Workouts (Intensity: 8/10)      │
│  • Apple Watch (HRV: 42ms)         │
└─────────────────────────────────────┘
```

### **3. Alert Banner Component**
**File**: `mobile/src/components/CorrelationAlertBanner.tsx`

**Features**:
- Appears at top of relevant screens
- Dismissible
- Links to correlation detail
- Badge count for multiple alerts

---

## 🔄 DATA FLOW

### **Real-Time Correlation Detection**
```
User Request
    ↓
Check Cache (15 min TTL)
    ↓ (cache miss)
Fetch Unified Snapshot (Phase 23)
    ↓
Analyze Correlations (Phase 23)
    ↓
Save to History (Phase 24)
    ↓
Detect Alerts (Phase 24)
    ↓
Analyze Trends (Phase 24)
    ↓
Cache Results (Phase 24)
    ↓
Return to User
```

### **Historical Trend Analysis**
```
User Request (30-day trends)
    ↓
Fetch Correlation History (Phase 24)
    ↓
Group by Type
    ↓
Calculate Frequency
    ↓
Detect Patterns (recurring, improving, worsening)
    ↓
Return Trend Analysis
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### **Caching Strategy**
- **Unified Snapshots**: 15 min TTL (reduce DB queries)
- **Correlation Analysis**: 15 min TTL (reduce computation)
- **Trend Analysis**: 1 hour TTL (expensive calculation)
- **Cache Invalidation**: On new data entry (workout, nutrition, etc.)

### **Database Optimizations**
- Indexed queries on user_id + date
- Partial indexes on severity (critical/warning only)
- JSONB indexes on sources array
- Materialized views for trend calculations (future)

### **API Optimizations**
- Pagination for historical data (limit 100)
- Lazy loading for trend charts
- Batch alert retrieval
- Compressed responses

---

## 🔒 PRODUCTION SAFETY

### **Backward Compatibility**
- ✅ All Phase 23 endpoints unchanged
- ✅ New endpoints are additive only
- ✅ Existing correlation detection unaffected
- ✅ Cache layer is transparent (fallback to live data)

### **Graceful Degradation**
- ✅ Cache failures don't block requests
- ✅ History storage failures don't block correlation detection
- ✅ Alert failures don't block main flow
- ✅ Trend analysis failures return empty arrays

### **Error Handling**
- ✅ Comprehensive try-catch blocks
- ✅ Detailed error logging
- ✅ Fallback to non-cached data
- ✅ User-friendly error messages

---

## 📊 SUCCESS METRICS

### **Performance**
- Cache hit rate: >70%
- API response time: <500ms (cached), <2s (uncached)
- Database query time: <200ms

### **User Engagement**
- Correlation screen views per user per week: >3
- Alert acknowledgment rate: >80%
- Action taken on recommendations: >30%

### **Data Quality**
- Correlation detection rate: 2-5 per user per day
- False positive rate: <10%
- Trend accuracy: >85%

---

## 🚀 IMPLEMENTATION PHASES

### **Phase 24 Backend (Week 5)**
1. Database schema migration
2. Historical correlation service
3. Trend analysis service
4. Caching layer
5. Alert detection service
6. Enhanced API endpoints
7. Testing and deployment

### **Phase 24 UI (Week 6)**
1. Correlation Insights Screen
2. Correlation Detail Screen
3. Alert Banner Component
4. Trend Chart Components
5. Navigation integration
6. Testing and deployment

---

## 📝 DELIVERABLES

### **Backend (Phase 24)**
- Database migration SQL
- 4 new services (history, trends, cache, alerts)
- Enhanced unified health service
- 10+ new API endpoints
- Comprehensive tests
- Deployment guide

### **UI (Phase 24 UI)**
- 2 new screens (Insights, Detail)
- 3 new components (Alert Banner, Trend Chart, Correlation Card)
- Navigation integration
- API integration
- UI tests
- User guide

---

**Phase 3: Correlation Engine - Ready for Implementation** 🚀
