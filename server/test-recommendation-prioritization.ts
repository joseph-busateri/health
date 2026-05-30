import { createClient } from '@supabase/supabase-js';
import { generateUnifiedRecommendations, getUnifiedRecommendations } from './src/services/unifiedRecommendationEngine';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test user ID (replace with real user ID)
const TEST_USER_ID = 'test-user-123';

async function setupTestData() {
  console.log('Setting up test data...\n');

  // 1. Create test bloodwork with abnormal markers (HIGH PRIORITY)
  const { data: bloodworkDoc } = await supabase
    .from('bloodwork_documents')
    .insert({
      user_id: TEST_USER_ID,
      test_date: '2024-04-16',
      file_reference: 'test-bloodwork.pdf',
      processing_status: 'completed'
    })
    .select()
    .single();

  if (bloodworkDoc) {
    await supabase.from('bloodwork_results').insert([
      {
        document_id: bloodworkDoc.id,
        raw_test_name: 'Triglycerides',
        value_numeric: 479,
        unit: 'mg/dL',
        abnormal_flag: true
      },
      {
        document_id: bloodworkDoc.id,
        raw_test_name: 'LDL Cholesterol',
        value_numeric: 146,
        unit: 'mg/dL',
        abnormal_flag: true
      },
      {
        document_id: bloodworkDoc.id,
        raw_test_name: 'HDL Cholesterol',
        value_numeric: 37,
        unit: 'mg/dL',
        abnormal_flag: true
      }
    ]);
    console.log('✅ Created abnormal bloodwork (Triglycerides: 479, LDL: 146, HDL: 37)');
  }

  // 2. Create body composition data
  await supabase.from('body_composition_scans').insert({
    user_id: TEST_USER_ID,
    scan_date: '2025-08-10',
    weight: 219.9,
    body_fat_percentage: 9.0,
    skeletal_muscle_mass: 116.6
  });
  console.log('✅ Created body composition (Weight: 219.9 lb, BF: 9%, Muscle: 116.6 lb)');

  // 3. Create Apple Watch data (poor sleep - MEDIUM PRIORITY)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    
    await supabase.from('apple_watch_sleep').insert({
      user_id: TEST_USER_ID,
      sleep_date: date.toISOString().split('T')[0],
      sleep_duration_hours: 6.2 // Poor sleep
    });

    await supabase.from('apple_watch_hrv').insert({
      user_id: TEST_USER_ID,
      measurement_date: date.toISOString().split('T')[0],
      hrv_value: 45 // Low HRV
    });

    await supabase.from('apple_watch_activity').insert({
      user_id: TEST_USER_ID,
      activity_date: date.toISOString().split('T')[0],
      active_minutes: 35,
      steps: 8500
    });
  }
  console.log('✅ Created device data (Sleep: 6.2h avg, HRV: 45ms avg, Activity: 35min avg)');

  // 4. Create goal behind schedule (MEDIUM PRIORITY)
  await supabase.from('goals').insert({
    user_id: TEST_USER_ID,
    goal_name: 'Lose 15 pounds',
    goal_category: 'weight_loss',
    status: 'active',
    target_value: 15,
    current_value: 3.2
  });
  console.log('✅ Created goal (Lose 15 lbs - 21% progress, behind schedule)');

  // 5. Create baseline profile
  await supabase.from('baseline_documents').insert({
    user_id: TEST_USER_ID,
    demographics: {
      age: 45,
      gender: 'Male',
      height: 72,
      weight: 220
    },
    health_goals: {
      goals: ['Optimize cardiovascular health', 'Increase lean muscle mass', 'Improve sleep quality']
    }
  });
  console.log('✅ Created baseline profile (Age: 45, Male, Cardiovascular + Muscle + Sleep goals)');

  // 6. Create supplement stack
  const { data: stackVersion } = await supabase
    .from('supplement_stack_versions')
    .insert({
      user_id: TEST_USER_ID,
      version_number: 1,
      version_name: 'Current Stack',
      is_current: true,
      created_by: 'user',
      created_reason: 'Initial baseline',
      effective_from: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (stackVersion) {
    await supabase.from('supplements').insert([
      {
        stack_version_id: stackVersion.id,
        supplement_name: 'Berberine',
        dosage_amount: 2000,
        dosage_unit: 'mg',
        frequency: '3x daily',
        timing: 'with meals',
        status: 'active',
        goal: 'Glucose management',
        supplement_order: 1
      },
      {
        stack_version_id: stackVersion.id,
        supplement_name: 'Creatine',
        dosage_amount: 5,
        dosage_unit: 'g',
        frequency: 'daily',
        timing: 'post-workout',
        status: 'active',
        goal: 'Muscle performance',
        supplement_order: 2
      }
    ]);
    console.log('✅ Created supplement stack (Berberine 2000mg 3x/day, Creatine 5g daily)');
  }

  // 7. Create daily logs (high stress - MEDIUM PRIORITY)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(date.getDate() + i);
    
    await supabase.from('daily_logs').insert({
      user_id: TEST_USER_ID,
      log_date: date.toISOString().split('T')[0],
      sleep_hours: 6.2,
      energy_level: 4.5,
      mood: 5.0,
      stress_level: 7.8,
      workout_adherence: 85,
      nutrition_adherence: 68
    });
  }
  console.log('✅ Created daily logs (Energy: 4.5/10, Stress: 7.8/10, Workout: 85%, Nutrition: 68%)');

  console.log('\n✅ Test data setup complete!\n');
}

async function testRecommendationGeneration() {
  console.log('='.repeat(80));
  console.log('TESTING RECOMMENDATION GENERATION');
  console.log('='.repeat(80));
  console.log();

  const startTime = Date.now();

  // Generate recommendations
  const result = await generateUnifiedRecommendations({
    user_id: TEST_USER_ID,
    force_regenerate: true,
    use_ai_enhancement: true
  });

  const endTime = Date.now();

  if (!result.success) {
    console.error('❌ Failed to generate recommendations:', result.error);
    return;
  }

  console.log('✅ Recommendations generated successfully!');
  console.log(`   Generated: ${result.data?.generated_count}`);
  console.log(`   Cost: $${result.data?.cost.toFixed(4)}`);
  console.log(`   Time: ${result.data?.processing_time_ms}ms`);
  console.log();

  // Get and display recommendations
  const recommendations = result.data?.recommendations || [];
  
  console.log('='.repeat(80));
  console.log('GENERATED RECOMMENDATIONS (Prioritized)');
  console.log('='.repeat(80));
  console.log();

  // Group by priority
  const byPriority = {
    critical: recommendations.filter(r => r.priority === 'critical'),
    high: recommendations.filter(r => r.priority === 'high'),
    medium: recommendations.filter(r => r.priority === 'medium'),
    low: recommendations.filter(r => r.priority === 'low')
  };

  // Display by priority
  for (const [priority, recs] of Object.entries(byPriority)) {
    if (recs.length === 0) continue;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`${priority.toUpperCase()} PRIORITY (${recs.length} recommendations)`);
    console.log('='.repeat(80));

    recs.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.title}`);
      console.log(`   Source: ${rec.source} | Category: ${rec.category} | Timeframe: ${rec.timeframe}`);
      console.log(`   Confidence: ${(rec.confidence * 100).toFixed(0)}% | AI-Generated: ${rec.ai_generated ? 'Yes' : 'No'}`);
      console.log(`\n   Description:`);
      console.log(`   ${rec.description}`);
      console.log(`\n   Rationale:`);
      console.log(`   ${rec.rationale}`);
      console.log(`\n   Intended Outcome:`);
      console.log(`   ${rec.intended_outcome}`);
      
      if (rec.action_items && rec.action_items.length > 0) {
        console.log(`\n   Action Items:`);
        rec.action_items.forEach((item, i) => {
          console.log(`   ${i + 1}. ${item}`);
        });
      }
      console.log(`\n   ${'─'.repeat(76)}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('PRIORITIZATION ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  console.log('Expected Prioritization:');
  console.log('  CRITICAL: Abnormal bloodwork (Triglycerides 479, LDL 146, HDL 37)');
  console.log('  HIGH:     Sleep deprivation + Low HRV (6.2h, 45ms)');
  console.log('  MEDIUM:   Goal behind schedule (21% vs expected 35%)');
  console.log('  MEDIUM:   High stress patterns (7.8/10 avg)');
  console.log();

  console.log('Actual Prioritization:');
  console.log(`  CRITICAL: ${byPriority.critical.length} recommendations`);
  console.log(`  HIGH:     ${byPriority.high.length} recommendations`);
  console.log(`  MEDIUM:   ${byPriority.medium.length} recommendations`);
  console.log(`  LOW:      ${byPriority.low.length} recommendations`);
  console.log();

  // Validate prioritization
  const hasBloodworkCritical = byPriority.critical.some(r => 
    r.source === 'bloodwork' || r.category === 'cardiovascular'
  );
  const hasSleepHigh = byPriority.high.some(r => 
    r.description.toLowerCase().includes('sleep') || r.description.toLowerCase().includes('hrv')
  );

  console.log('Validation:');
  console.log(`  ✓ Bloodwork prioritized as CRITICAL: ${hasBloodworkCritical ? '✅ YES' : '❌ NO'}`);
  console.log(`  ✓ Sleep/HRV prioritized as HIGH: ${hasSleepHigh ? '✅ YES' : '❌ NO'}`);
  console.log();

  return recommendations;
}

async function testAcceptDismiss(recommendations: any[]) {
  if (recommendations.length === 0) return;

  console.log('='.repeat(80));
  console.log('TESTING ACCEPT/DISMISS FUNCTIONALITY');
  console.log('='.repeat(80));
  console.log();

  // Accept first recommendation
  const firstRec = recommendations[0];
  console.log(`Accepting recommendation: "${firstRec.title}"`);
  
  const { error: acceptError } = await supabase
    .from('unified_recommendations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      user_notes: 'Test acceptance - will implement immediately'
    })
    .eq('id', firstRec.id);

  if (acceptError) {
    console.log(`❌ Failed to accept: ${acceptError.message}`);
  } else {
    console.log('✅ Recommendation accepted successfully');
  }

  // Dismiss second recommendation
  if (recommendations.length > 1) {
    const secondRec = recommendations[1];
    console.log(`\nDismissing recommendation: "${secondRec.title}"`);
    
    const { error: dismissError } = await supabase
      .from('unified_recommendations')
      .update({
        status: 'dismissed',
        dismissed_at: new Date().toISOString(),
        dismissal_reason: 'Already doing this',
        user_notes: 'Test dismissal - not applicable'
      })
      .eq('id', secondRec.id);

    if (dismissError) {
      console.log(`❌ Failed to dismiss: ${dismissError.message}`);
    } else {
      console.log('✅ Recommendation dismissed successfully');
    }
  }

  console.log();
}

async function analyzeHistoricalPatterns() {
  console.log('='.repeat(80));
  console.log('ANALYZING HISTORICAL RECOMMENDATION PATTERNS');
  console.log('='.repeat(80));
  console.log();

  const { data: allRecs } = await supabase
    .from('unified_recommendations')
    .select('*')
    .eq('user_id', TEST_USER_ID);

  if (!allRecs || allRecs.length === 0) {
    console.log('No historical recommendations found');
    return;
  }

  const accepted = allRecs.filter(r => r.status === 'accepted');
  const dismissed = allRecs.filter(r => r.status === 'dismissed');
  const active = allRecs.filter(r => r.status === 'active');

  console.log(`Total Recommendations: ${allRecs.length}`);
  console.log(`  Active:    ${active.length} (${((active.length / allRecs.length) * 100).toFixed(0)}%)`);
  console.log(`  Accepted:  ${accepted.length} (${((accepted.length / allRecs.length) * 100).toFixed(0)}%)`);
  console.log(`  Dismissed: ${dismissed.length} (${((dismissed.length / allRecs.length) * 100).toFixed(0)}%)`);
  console.log();

  if (accepted.length > 0) {
    console.log('Most Accepted Categories:');
    const acceptedByCategory: Record<string, number> = {};
    accepted.forEach(r => {
      acceptedByCategory[r.category] = (acceptedByCategory[r.category] || 0) + 1;
    });
    Object.entries(acceptedByCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });
    console.log();
  }

  if (dismissed.length > 0) {
    console.log('Most Dismissed Categories:');
    const dismissedByCategory: Record<string, number> = {};
    dismissed.forEach(r => {
      dismissedByCategory[r.category] = (dismissedByCategory[r.category] || 0) + 1;
    });
    Object.entries(dismissedByCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });
    console.log();
  }
}

async function cleanup() {
  console.log('='.repeat(80));
  console.log('CLEANUP');
  console.log('='.repeat(80));
  console.log();

  console.log('Cleaning up test data...');
  
  // Delete in reverse order of dependencies
  await supabase.from('unified_recommendations').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('daily_logs').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('supplements').delete().in('stack_version_id', 
    (await supabase.from('supplement_stack_versions').select('id').eq('user_id', TEST_USER_ID)).data?.map(s => s.id) || []
  );
  await supabase.from('supplement_stack_versions').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('baseline_documents').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('goals').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('apple_watch_activity').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('apple_watch_hrv').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('apple_watch_sleep').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('body_composition_scans').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('bloodwork_results').delete().in('document_id',
    (await supabase.from('bloodwork_documents').select('id').eq('user_id', TEST_USER_ID)).data?.map(d => d.id) || []
  );
  await supabase.from('bloodwork_documents').delete().eq('user_id', TEST_USER_ID);

  console.log('✅ Cleanup complete');
  console.log();
}

async function main() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('UNIFIED RECOMMENDATION SYSTEM - PRIORITIZATION TEST');
    console.log('='.repeat(80));
    console.log();

    // Setup test data
    await setupTestData();

    // Generate and test recommendations
    const recommendations = await testRecommendationGeneration();

    // Test accept/dismiss
    if (recommendations) {
      await testAcceptDismiss(recommendations);
      await analyzeHistoricalPatterns();
    }

    // Cleanup
    await cleanup();

    console.log('='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80));
    console.log();

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
