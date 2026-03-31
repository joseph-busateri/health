# Supplement System Migration Notes

## Current Status

The codebase has **TWO supplement systems**:

### OLD System (Legacy - To Be Removed)
- `supplement_baseline` table
- `supplement_items` table
- Used by:
  - `supplementDocumentService.ts` (document upload processing)
  - `pointInTimeService.ts` (historical state reconstruction)
  - TypeScript types in `supplementDocument.ts`

### NEW System (Active - Agent-Managed)
- `supplement_stack_versions` table
- `supplements` table
- `supplement_adherence_log` table
- `supplement_stack_changes` table
- `supplement_interactions` table
- `supplement_inventory` table
- Defined in: `20260329_create_supplement_schema.sql`
- Used by:
  - `unifiedRecommendationEngine.ts` ✅ (UPDATED)

---

## Migration Required

### Files That Need Updates:

1. **`supplementDocumentService.ts`** ⚠️ CRITICAL
   - Currently creates `supplement_baseline` + `supplement_items`
   - Needs to create `supplement_stack_versions` + `supplements` instead
   - Used for initial supplement upload processing

2. **`pointInTimeService.ts`** ⚠️ CRITICAL
   - Currently reconstructs historical state from `supplement_baseline` + `supplement_items`
   - Needs to use `supplement_stack_versions` + `supplements`
   - Used for point-in-time state reconstruction

3. **`types/supplementDocument.ts`** ⚠️
   - Defines types for OLD system
   - Needs new types for `supplement_stack_versions` + `supplements`

4. **`types/database.ts`** ⚠️
   - Contains OLD system table definitions
   - May need regeneration from Supabase schema

---

## Recommendation Engine Status

✅ **UPDATED** - Now uses NEW system:
```typescript
// Get current supplement stack version
const { data: currentStackVersion } = await supabase
  .from('supplement_stack_versions')
  .select('id, version_number')
  .eq('user_id', userId)
  .eq('is_current', true)
  .single();

// Get active supplements in current version
const { data: supplementItems } = await supabase
  .from('supplements')
  .select('supplement_name, dosage_amount, dosage_unit, frequency, timing, status, goal')
  .eq('stack_version_id', currentStackVersion.id)
  .eq('status', 'active')
  .order('supplement_order');
```

---

## Next Steps

### Option 1: Full Migration (Recommended)
1. Update `supplementDocumentService.ts` to create stack versions
2. Update `pointInTimeService.ts` to use stack versions
3. Create migration script to move existing data (if any)
4. Update TypeScript types
5. Remove OLD system tables

### Option 2: Parallel Systems (Temporary)
1. Keep OLD system for document processing
2. Create sync service to copy data to NEW system
3. Gradually migrate services
4. Remove OLD system once all services migrated

### Option 3: Fresh Start (If No Production Data)
1. Drop OLD system tables
2. Update all services to use NEW system
3. No migration needed

---

## Impact Assessment

### Services Using OLD System:
- ❌ `supplementDocumentService.ts` - Document upload/processing
- ❌ `pointInTimeService.ts` - Historical state reconstruction
- ✅ `unifiedRecommendationEngine.ts` - Already migrated

### Risk Level: **MEDIUM**
- If no production data exists, migration is safe
- If production data exists, need migration script
- Document upload will break until `supplementDocumentService.ts` is updated

---

## Decision Needed

**Does production data exist in the OLD system?**
- If YES → Need migration script + parallel systems temporarily
- If NO → Can safely update services and remove OLD system

**User chose:** Update to NEW system and remove OLD system
- Implies: No critical production data in OLD system OR willing to rebuild
