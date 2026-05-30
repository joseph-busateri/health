import { tryPatternMatching, shouldSkipAIParsing } from './src/services/bloodworkPatternMatching';

// Sample lab report texts in different formats

const QUEST_SAMPLE = `
LIPID PANEL
Test Date: 03/15/2026

LDL Cholesterol    95 mg/dL    0-129
HDL Cholesterol    55 mg/dL    >40
Triglycerides      120 mg/dL   <150
Total Cholesterol  180 mg/dL   <200
VLDL Cholesterol   24 mg/dL    5-40
`;

const LABCORP_SAMPLE = `
COMPREHENSIVE METABOLIC PANEL
Collection Date: 03/15/2026

Glucose | 92 | mg/dL | 70-100
BUN | 15 | mg/dL | 7-20
Creatinine | 1.0 | mg/dL | 0.7-1.3
Sodium | 140 | mmol/L | 136-145
Potassium | 4.2 | mmol/L | 3.5-5.1
Chloride | 102 | mmol/L | 98-107
CO2 | 26 | mmol/L | 22-30
Calcium | 9.5 | mg/dL | 8.5-10.5
`;

const GENERIC_TABLE_SAMPLE = `
HORMONE PANEL
Test Date: 03/15/2026

Testosterone    450 ng/dL    300-1000
Free Testosterone    12.5 ng/dL    9-30
SHBG    35 nmol/L    10-80
Estradiol    25 pg/mL    10-40
`;

const MIXED_FORMAT_SAMPLE = `
COMPLETE BLOOD COUNT
Test Date: 03/15/2026

WBC    7.2 K/uL    4.0-11.0
RBC    5.1 M/uL    4.5-5.9
Hemoglobin    15.2 g/dL    13.5-17.5
Hematocrit    45.5 %    40-52
MCV    89 fL    80-100
MCH    29.8 pg    27-33
MCHC    33.4 g/dL    32-36
Platelets    250 K/uL    150-400
`;

const UNSTRUCTURED_SAMPLE = `
Patient: John Doe
DOB: 01/01/1980
Test Date: 03/15/2026

Results:
Your cholesterol is a bit high. LDL was 130 which is above normal.
HDL looks good at 48. Triglycerides are 165, slightly elevated.
Overall lipid panel shows room for improvement.
`;

async function runTest(name: string, text: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${name}`);
  console.log('='.repeat(80));
  
  const result = await tryPatternMatching(text);
  
  console.log(`\n📊 RESULTS:`);
  console.log(`  Format Detected: ${result.format}`);
  console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`  Panels Found: ${result.panels.length}`);
  console.log(`  Markers Found: ${result.markers.length}`);
  console.log(`  Match Rate: ${result.matchedLines}/${result.totalLines} lines`);
  console.log(`  Skip AI Parsing: ${shouldSkipAIParsing(result) ? '✅ YES' : '❌ NO'}`);
  
  if (result.panels.length > 0) {
    console.log(`\n🧪 PANELS:`);
    result.panels.forEach(panel => {
      console.log(`  - ${panel.panel_name} (${panel.panel_category})`);
    });
  }
  
  if (result.markers.length > 0) {
    console.log(`\n🔬 MARKERS:`);
    result.markers.forEach((marker, idx) => {
      console.log(`  ${idx + 1}. ${marker.raw_test_name}`);
      console.log(`     Value: ${marker.value_text}`);
      console.log(`     Range: ${marker.reference_range_text || 'N/A'}`);
      console.log(`     Flag: ${marker.abnormal_flag || 'Normal'}`);
      console.log(`     Confidence: ${((marker.confidence || 0) * 100).toFixed(1)}%`);
    });
  } else {
    console.log(`\n❌ NO MARKERS EXTRACTED`);
  }
  
  return result;
}

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   BLOODWORK PATTERN MATCHING TEST SUITE                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
  
  const results = [];
  
  // Test 1: Quest Diagnostics format
  results.push(await runTest('Quest Diagnostics Format', QUEST_SAMPLE));
  
  // Test 2: LabCorp format
  results.push(await runTest('LabCorp Format', LABCORP_SAMPLE));
  
  // Test 3: Generic table format
  results.push(await runTest('Generic Table Format', GENERIC_TABLE_SAMPLE));
  
  // Test 4: Mixed format
  results.push(await runTest('Mixed Format (CBC)', MIXED_FORMAT_SAMPLE));
  
  // Test 5: Unstructured text (should fail gracefully)
  results.push(await runTest('Unstructured Text (Expected to Fail)', UNSTRUCTURED_SAMPLE));
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const totalTests = results.length;
  const highConfidence = results.filter(r => r.confidence >= 0.8).length;
  const mediumConfidence = results.filter(r => r.confidence >= 0.5 && r.confidence < 0.8).length;
  const lowConfidence = results.filter(r => r.confidence < 0.5).length;
  const totalMarkers = results.reduce((sum, r) => sum + r.markers.length, 0);
  const wouldSkipAI = results.filter(r => shouldSkipAIParsing(r)).length;
  
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`High Confidence (≥80%): ${highConfidence} tests`);
  console.log(`Medium Confidence (50-79%): ${mediumConfidence} tests`);
  console.log(`Low Confidence (<50%): ${lowConfidence} tests`);
  console.log(`Total Markers Extracted: ${totalMarkers}`);
  console.log(`Would Skip AI Parsing: ${wouldSkipAI}/${totalTests} tests`);
  
  console.log('\n✅ EXPECTED BEHAVIOR:');
  console.log('  - Tests 1-4 should have high confidence (≥80%)');
  console.log('  - Tests 1-4 should skip AI parsing');
  console.log('  - Test 5 should have low confidence (<50%)');
  console.log('  - Test 5 should NOT skip AI parsing (would use AI fallback)');
  
  console.log('\n📊 COST ANALYSIS:');
  console.log(`  - ${wouldSkipAI} documents would use pattern matching ($0 cost)`);
  console.log(`  - ${totalTests - wouldSkipAI} documents would need AI parsing ($0.01-0.05 each)`);
  console.log(`  - Estimated cost per 100 documents: $${((totalTests - wouldSkipAI) / totalTests * 100 * 0.03).toFixed(2)}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUITE COMPLETE');
  console.log('='.repeat(80) + '\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
