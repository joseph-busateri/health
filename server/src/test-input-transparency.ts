/**
 * Test script to verify input transparency feature
 * Run with: npx ts-node src/test-input-transparency.ts
 */

import { getCardiovascularToday } from './services/cardiovascularEngineService';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testInputTransparency() {
  console.log('\n🧪 Testing Input Transparency Feature\n');
  console.log('Feature Flag:', process.env.SHOW_DETAIL_SCREEN_INPUTS);
  console.log('User ID:', TEST_USER_ID);
  console.log('\n---\n');

  try {
    const result = await getCardiovascularToday(TEST_USER_ID, { regenerate: true });
    
    if (!result) {
      console.error('❌ No cardiovascular data returned');
      return;
    }

    console.log('✅ Cardiovascular data retrieved');
    console.log('\nRecord keys:', Object.keys(result));
    console.log('\nHas detailedInputs:', !!result.detailedInputs);
    console.log('DetailedInputs count:', result.detailedInputs?.length || 0);

    if (result.detailedInputs && result.detailedInputs.length > 0) {
      console.log('\n📊 Sample Inputs:');
      result.detailedInputs.slice(0, 5).forEach(input => {
        console.log(`  - ${input.name}: ${input.value} (${input.source})`);
      });

      console.log('\n📈 Source Distribution:');
      const sourceCounts = result.detailedInputs.reduce((acc, input) => {
        acc[input.source] = (acc[input.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });

      console.log('\n✅ INPUT TRANSPARENCY WORKING!');
    } else {
      console.error('\n❌ No detailedInputs in response');
      console.error('Check:');
      console.error('  1. SHOW_DETAIL_SCREEN_INPUTS=true in .env file');
      console.error('  2. Server restarted after adding flag');
      console.error('  3. Check server logs for feature flag initialization');
    }
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    console.error((error as Error).stack);
  }
}

testInputTransparency();
