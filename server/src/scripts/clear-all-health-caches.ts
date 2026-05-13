/**
 * Clear All Health Score Caches
 * 
 * This script clears the in-memory caches for all 5 health score engines:
 * - Recovery
 * - Cardiovascular
 * - Performance/Joint Health
 * - Metabolic
 * - Sexual Health
 */

import { clearRecoveryCache } from '../services/recoveryEngineService';
import { clearCardiovascularCache } from '../services/cardiovascularEngineService';
import { clearJointHealthCache } from '../services/jointHealthEngineService';
import { clearSexualHealthCacheV3 } from '../services/sexualHealthEngineServiceV3';
import { logger } from '../utils/logger';

async function clearAllHealthCaches() {
  console.log('🗑️  Clearing all health score caches...\n');

  try {
    // Clear Recovery cache
    clearRecoveryCache();
    console.log('✅ Recovery cache cleared');

    // Clear Cardiovascular cache
    clearCardiovascularCache();
    console.log('✅ Cardiovascular cache cleared');

    // Clear Performance/Joint Health cache
    clearJointHealthCache();
    console.log('✅ Performance/Joint Health cache cleared');

    // Clear Sexual Health V3 cache
    clearSexualHealthCacheV3();
    console.log('✅ Sexual Health V3 cache cleared');

    // Note: Metabolic V2 doesn't use in-memory cache (stateless)
    console.log('ℹ️  Metabolic V2 is stateless (no cache to clear)');

    console.log('\n✅ All health score caches cleared successfully!');
    console.log('\nNext API calls will recalculate fresh scores.');
    
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    process.exit(1);
  }
}

// Run the cache clearing
clearAllHealthCaches().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
