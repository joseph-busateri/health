# VERSION CONTROL & TESTING STRATEGY
**Ensuring You Always Work with Latest Code**

Date: 2026-04-08  
Status: **ACTIVE GUIDE**

---

## 🎯 PROBLEM

You're sometimes getting older versions in testing and documentation, causing confusion about current state.

---

## ✅ SOLUTION: VERSION CONTROL WORKFLOW

### **1. ALWAYS CHECK CURRENT BRANCH**

Before starting any work or testing:

```bash
# Check which branch you're on
git branch

# Should show:
# * aprilsix-update  ← You should be here
#   main
```

**If not on `aprilsix-update`**:
```bash
git checkout aprilsix-update
```

---

### **2. ALWAYS PULL LATEST BEFORE TESTING**

```bash
# Pull latest from remote
git pull origin aprilsix-update

# This ensures you have the absolute latest code
```

---

### **3. VERSION TRACKING FILE**

Create a `CURRENT_VERSION.md` file that gets updated with each major change:

```markdown
# CURRENT VERSION

**Last Updated**: 2026-04-08 10:20am
**Branch**: aprilsix-update
**Commit**: [latest commit hash]

## Current State
- Total Screens: 51
- Accessible: 50 (98%)
- UI Coverage: 100%
- Phase 0-20: 100% complete

## Latest Changes
- 2026-04-08: GraphQL UUID fix, deprecated screens cleanup
- 2026-04-07: Wired 16 orphaned screens, created 3 new screens
- 2026-04-07: Fresh audit completed - 100% coverage achieved

## Current Audit Document
**Use this**: FRESH_AUDIT_2026_04_07.md
**Ignore**: COMPREHENSIVE_UI_UX_AUDIT.md (older)
```

---

### **4. CLEAR CACHE BEFORE TESTING**

#### **Mobile App**
```bash
cd mobile

# Clear Metro bundler cache
npx expo start --clear

# Or full reset
rm -rf node_modules
npm install
npx expo start --clear
```

#### **Backend Server**
```bash
cd server

# Restart server to pick up latest code
npm run dev
```

---

### **5. AUDIT DOCUMENT NAMING CONVENTION**

**Current Practice** (Good):
- ✅ `FRESH_AUDIT_2026_04_07.md` - Date in filename
- ✅ `GRAPHQL_UUID_FIX.md` - Specific fix documented
- ✅ `DEPRECATED_SCREENS_CLEANUP.md` - Specific change documented

**Going Forward**:
- Always include date in audit/status documents
- Mark old documents as `[ARCHIVED]` in filename
- Keep a `CURRENT_STATE.md` that always points to latest

---

## 📋 PRE-TESTING CHECKLIST

Before testing or asking questions about current state:

### **Step 1: Verify Branch**
```bash
git branch
# Should show: * aprilsix-update
```

### **Step 2: Pull Latest**
```bash
git pull origin aprilsix-update
```

### **Step 3: Check Last Commit**
```bash
git log -1 --oneline
# Should show your most recent commit
```

### **Step 4: Clear Caches**
```bash
# Mobile
cd mobile && npx expo start --clear

# Backend (in separate terminal)
cd server && npm run dev
```

### **Step 5: Verify Current State**
Check `CURRENT_VERSION.md` or latest audit document with date in filename.

---

## 🗂️ DOCUMENT ORGANIZATION

### **Current State Documents** (Always Check These)
1. **FRESH_AUDIT_2026_04_07.md** - Latest full audit
2. **FINAL_IMPLEMENTATION_COMPLETE.md** - Implementation summary
3. **QUICK_WINS_IMPLEMENTATION_COMPLETE.md** - Visual design status
4. **HUMAN_CENTERED_DESIGN_IMPLEMENTATION.md** - UX components status

### **Historical Documents** (For Reference Only)
- COMPREHENSIVE_UI_UX_AUDIT.md (pre-wiring)
- UI_UX_AUDIT_SUMMARY.md (pre-wiring)
- PHASE_4_5_6_COMPLETE.md (older phase work)

### **Specific Fix Documents** (Recent Changes)
- GRAPHQL_UUID_FIX.md (2026-04-08)
- DEPRECATED_SCREENS_CLEANUP.md (2026-04-08)
- VISUAL_DESIGN_ENHANCEMENT_PLAN.md (2026-04-07)

---

## 🔄 GIT WORKFLOW FOR LATEST CODE

### **Daily Workflow**

```bash
# 1. Start of day - ensure latest code
git checkout aprilsix-update
git pull origin aprilsix-update

# 2. Make changes
# ... edit files ...

# 3. Stage changes
git add .

# 4. Commit with descriptive message
git commit -m "feat: [description of what you did]"

# 5. Push to remote
git push origin aprilsix-update

# 6. Clear caches and test
cd mobile && npx expo start --clear
```

---

## 📊 HOW TO IDENTIFY CURRENT VERSION

### **Method 1: Git Commit Hash**
```bash
git log -1 --oneline
# Example output: 36eaba9 UI/UX removed old version
```

### **Method 2: Last Commit Date**
```bash
git log -1 --format=%cd
# Example output: Tue Apr 8 09:08:00 2026 -0500
```

### **Method 3: Check Latest Audit**
Look for audit files with most recent date:
- `FRESH_AUDIT_2026_04_07.md` ← Most recent
- `COMPREHENSIVE_UI_UX_AUDIT.md` ← Older

### **Method 4: Check Package Versions**
```bash
# Mobile
cat mobile/package.json | grep version

# Server
cat server/package.json | grep version
```

---

## 🎯 WHEN ASKING QUESTIONS

### **Always Specify**:
1. "I'm on branch: `aprilsix-update`"
2. "Last commit: [commit hash or message]"
3. "I just pulled latest code"
4. "I cleared caches"

### **Reference Current Documents**:
- "According to FRESH_AUDIT_2026_04_07.md..."
- "The latest implementation doc says..."

### **Avoid Referencing**:
- Old audit documents without dates
- Documents that don't specify when they were created
- Generic "the audit" without specifying which one

---

## 🚨 RED FLAGS (You're Looking at Old Code)

### **Warning Signs**:
1. Audit says "18 orphaned screens" (old audit)
2. Audit says "65% UI coverage" (old audit)
3. Document doesn't have a date in filename
4. ControlTowerScreen listed as "ORPHANED"
5. AutonomousAdjustmentsScreen doesn't exist
6. Only 31 accessible screens (old state)

### **Current State Indicators**:
1. ✅ 50 accessible screens (98%)
2. ✅ 100% UI coverage
3. ✅ AutonomousAdjustmentsScreen exists and is wired
4. ✅ InterviewSelectorScreen exists
5. ✅ SourceProvenanceScreen exists
6. ✅ All Phase 0-20 capabilities surfaced

---

## 📝 CREATE CURRENT_VERSION.md

Let me create this file for you:

