/**
 * Recovery AI Comparison Script
 * 
 * Compares AI-enriched recommendations vs fallback recommendations.
 * Validates that AI output differs from deterministic fallback.
 */

import path from 'path';
import fs from 'fs';

interface ValidationResult {
  scenario: any;
  response: any;
  persisted_record: any;
  retrieval_result: any;
  logs: string[];
  timestamp: string;
  success: boolean;
  errors: string[];
  ai_disabled?: boolean;
}

interface ComparisonResult {
  ai_output: any;
  fallback_output: any;
  differences: string[];
  observations: string[];
  pass: boolean;
  timestamp: string;
}

function main() {
  console.log('='.repeat(80));
  console.log('Recovery AI Comparison');
  console.log('='.repeat(80));

  // Load AI success result
  const aiSuccessPath = path.resolve(__dirname, '../../validation/recovery-ai-success.json');
  if (!fs.existsSync(aiSuccessPath)) {
    console.error(`\n❌ AI success result not found: ${aiSuccessPath}`);
    console.error('Please run: npm run validate:recovery:ai-success');
    process.exit(1);
  }

  const aiSuccess: ValidationResult = JSON.parse(fs.readFileSync(aiSuccessPath, 'utf-8'));
  console.log('\n✅ Loaded AI success result');

  // Load fallback result
  const fallbackPath = path.resolve(__dirname, '../../validation/recovery-ai-fallback.json');
  if (!fs.existsSync(fallbackPath)) {
    console.error(`\n❌ Fallback result not found: ${fallbackPath}`);
    console.error('Please run: npm run validate:recovery:fallback');
    process.exit(1);
  }

  const fallback: ValidationResult = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
  console.log('✅ Loaded fallback result');

  const differences: string[] = [];
  const observations: string[] = [];

  // Extract AI recommendation
  const aiRecommendation = aiSuccess.persisted_record;
  const fallbackRecommendation = fallback.response?.data?.recommendation;

  console.log('\n' + '='.repeat(80));
  console.log('AI OUTPUT');
  console.log('='.repeat(80));
  
  if (aiRecommendation) {
    console.log('\nTitle:', aiRecommendation.title);
    console.log('Description:', aiRecommendation.description);
    console.log('Rationale:', aiRecommendation.rationale || 'N/A');
    console.log('Reason Codes:', aiRecommendation.reasonCodes || 'N/A');
    console.log('Recommendation Group:', aiRecommendation.recommendationGroup || 'N/A');
    console.log('Supporting Metrics:', aiRecommendation.supportingMetrics || 'N/A');
    console.log('Priority:', aiRecommendation.priority);
    console.log('Urgency Score:', aiRecommendation.urgencyScore);
    console.log('Source:', aiRecommendation.sourceEngine);
    console.log('Persisted By:', 'RecommendationEngine');
  } else {
    console.log('\n❌ No AI recommendation found');
    observations.push('AI recommendation not found in persisted records');
  }

  console.log('\n' + '='.repeat(80));
  console.log('FALLBACK OUTPUT');
  console.log('='.repeat(80));
  
  if (fallbackRecommendation) {
    console.log('\nSummary:', fallbackRecommendation.summary);
    console.log('Actions:', fallbackRecommendation.actions);
    console.log('Source:', 'Direct emission (fallback)');
  } else {
    console.log('\n❌ No fallback recommendation found');
    observations.push('Fallback recommendation not found in response');
  }

  console.log('\n' + '='.repeat(80));
  console.log('DIFFERENCES');
  console.log('='.repeat(80));

  // Compare recommendation text
  if (aiRecommendation && fallbackRecommendation) {
    // 1. Text content comparison
    const aiText = (aiRecommendation.title + ' ' + aiRecommendation.description).toLowerCase();
    const fallbackText = (fallbackRecommendation.summary + ' ' + fallbackRecommendation.actions.join(' ')).toLowerCase();
    
    if (aiText !== fallbackText) {
      differences.push('Recommendation text differs between AI and fallback');
      console.log('\n✅ Recommendation text differs');
      observations.push('AI generated different text than deterministic fallback');
    } else {
      console.log('\n⚠️  Recommendation text is identical (unexpected)');
      observations.push('WARNING: AI text identical to fallback');
    }

    // 2. Metadata comparison
    if (aiRecommendation.reasonCodes && aiRecommendation.reasonCodes.length > 0) {
      differences.push('AI includes reasonCodes (fallback does not)');
      console.log('✅ AI includes reasonCodes:', aiRecommendation.reasonCodes);
      observations.push(`AI provided ${aiRecommendation.reasonCodes.length} reason codes`);
    }

    if (aiRecommendation.recommendationGroup) {
      differences.push('AI includes recommendationGroup (fallback does not)');
      console.log('✅ AI includes recommendationGroup:', aiRecommendation.recommendationGroup);
      observations.push(`AI categorized as: ${aiRecommendation.recommendationGroup}`);
    }

    if (aiRecommendation.supportingMetrics && aiRecommendation.supportingMetrics.length > 0) {
      differences.push('AI includes supportingMetrics (fallback does not)');
      console.log('✅ AI includes supportingMetrics:', aiRecommendation.supportingMetrics.length, 'metrics');
      observations.push(`AI provided ${aiRecommendation.supportingMetrics.length} supporting metrics`);
    }

    if (aiRecommendation.rationale) {
      differences.push('AI includes detailed rationale (fallback does not)');
      console.log('✅ AI includes rationale');
      observations.push('AI provided detailed rationale');
    }

    // 3. Source comparison
    if (aiRecommendation.sourceEngine === 'recovery') {
      differences.push('AI persisted through RecommendationEngine');
      console.log('✅ AI persisted through RecommendationEngine');
      observations.push('AI recommendation went through full pipeline');
    }

    // 4. Richness comparison
    const aiWordCount = (aiRecommendation.title + ' ' + aiRecommendation.description + ' ' + (aiRecommendation.rationale || '')).split(/\s+/).length;
    const fallbackWordCount = (fallbackRecommendation.summary + ' ' + fallbackRecommendation.actions.join(' ')).split(/\s+/).length;
    
    console.log(`\nAI word count: ${aiWordCount}`);
    console.log(`Fallback word count: ${fallbackWordCount}`);
    
    if (aiWordCount > fallbackWordCount) {
      differences.push(`AI output is richer (${aiWordCount} vs ${fallbackWordCount} words)`);
      observations.push('AI output contains more detail than fallback');
    } else if (aiWordCount < fallbackWordCount) {
      observations.push('WARNING: AI output is shorter than fallback');
    }

    // 5. Priority and urgency comparison
    const aiPriority = aiRecommendation.priority;
    const aiUrgency = aiRecommendation.urgencyScore;
    
    console.log(`\nAI Priority: ${aiPriority}`);
    console.log(`AI Urgency: ${aiUrgency}`);
    
    observations.push(`AI assigned priority: ${aiPriority}, urgency: ${aiUrgency}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('OBSERVATIONS');
  console.log('='.repeat(80));
  
  observations.forEach((obs, idx) => {
    console.log(`\n${idx + 1}. ${obs}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('PASS/FAIL');
  console.log('='.repeat(80));

  // Determine pass/fail
  let pass = true;
  const failReasons: string[] = [];

  // Must have AI recommendation
  if (!aiRecommendation) {
    pass = false;
    failReasons.push('AI recommendation not found');
  }

  // Must have fallback recommendation
  if (!fallbackRecommendation) {
    pass = false;
    failReasons.push('Fallback recommendation not found');
  }

  // AI must have enriched fields
  if (aiRecommendation) {
    if (!aiRecommendation.reasonCodes || aiRecommendation.reasonCodes.length === 0) {
      pass = false;
      failReasons.push('AI missing reasonCodes');
    }
    if (!aiRecommendation.recommendationGroup) {
      pass = false;
      failReasons.push('AI missing recommendationGroup');
    }
    if (!aiRecommendation.title || aiRecommendation.title.length < 5) {
      pass = false;
      failReasons.push('AI title too short or missing');
    }
    if (!aiRecommendation.description || aiRecommendation.description.length < 20) {
      pass = false;
      failReasons.push('AI description too short or missing');
    }
  }

  // AI output must differ from fallback
  if (differences.length === 0) {
    pass = false;
    failReasons.push('No differences found between AI and fallback');
  }

  // AI must be persisted through RecommendationEngine
  if (aiRecommendation && aiRecommendation.sourceEngine !== 'recovery') {
    pass = false;
    failReasons.push('AI recommendation not from recovery engine');
  }

  if (pass) {
    console.log('\n✅ PASS');
    console.log(`\nFound ${differences.length} differences between AI and fallback`);
    console.log('AI output is distinct from deterministic fallback');
  } else {
    console.log('\n❌ FAIL');
    console.log('\nReasons:');
    failReasons.forEach(reason => console.log(`  - ${reason}`));
  }

  // Build comparison result
  const result: ComparisonResult = {
    ai_output: aiRecommendation,
    fallback_output: fallbackRecommendation,
    differences,
    observations,
    pass,
    timestamp: new Date().toISOString(),
  };

  // Save markdown report
  const reportPath = path.resolve(__dirname, '../../validation/recovery-ai-comparison.md');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const markdown = generateMarkdownReport(result, aiRecommendation, fallbackRecommendation);
  fs.writeFileSync(reportPath, markdown);
  console.log(`\n✅ Report saved to: ${reportPath}`);

  if (!pass) {
    process.exitCode = 1;
  }
}

function generateMarkdownReport(
  result: ComparisonResult,
  aiRec: any,
  fallbackRec: any
): string {
  const lines: string[] = [];

  lines.push('# Recovery AI Comparison Report');
  lines.push('');
  lines.push(`**Generated**: ${result.timestamp}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## AI Output');
  lines.push('');
  if (aiRec) {
    lines.push('**Source**: RecommendationEngine (AI-enriched)');
    lines.push('');
    lines.push(`**Title**: ${aiRec.title}`);
    lines.push('');
    lines.push(`**Description**: ${aiRec.description}`);
    lines.push('');
    if (aiRec.rationale) {
      lines.push(`**Rationale**: ${aiRec.rationale}`);
      lines.push('');
    }
    lines.push(`**Priority**: ${aiRec.priority}`);
    lines.push('');
    lines.push(`**Urgency Score**: ${aiRec.urgencyScore}`);
    lines.push('');
    if (aiRec.reasonCodes) {
      lines.push(`**Reason Codes**: ${JSON.stringify(aiRec.reasonCodes)}`);
      lines.push('');
    }
    if (aiRec.recommendationGroup) {
      lines.push(`**Recommendation Group**: ${aiRec.recommendationGroup}`);
      lines.push('');
    }
    if (aiRec.supportingMetrics) {
      lines.push('**Supporting Metrics**:');
      lines.push('```json');
      lines.push(JSON.stringify(aiRec.supportingMetrics, null, 2));
      lines.push('```');
      lines.push('');
    }
  } else {
    lines.push('*No AI recommendation found*');
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  lines.push('## Fallback Output');
  lines.push('');
  if (fallbackRec) {
    lines.push('**Source**: Direct emission (deterministic)');
    lines.push('');
    lines.push(`**Summary**: ${fallbackRec.summary}`);
    lines.push('');
    lines.push('**Actions**:');
    fallbackRec.actions.forEach((action: string) => {
      lines.push(`- ${action}`);
    });
    lines.push('');
  } else {
    lines.push('*No fallback recommendation found*');
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  lines.push('## Differences');
  lines.push('');
  if (result.differences.length > 0) {
    result.differences.forEach((diff, idx) => {
      lines.push(`${idx + 1}. ${diff}`);
    });
  } else {
    lines.push('*No differences found*');
  }
  lines.push('');

  lines.push('---');
  lines.push('');

  lines.push('## Observations');
  lines.push('');
  if (result.observations.length > 0) {
    result.observations.forEach((obs, idx) => {
      lines.push(`${idx + 1}. ${obs}`);
    });
  } else {
    lines.push('*No observations*');
  }
  lines.push('');

  lines.push('---');
  lines.push('');

  lines.push('## Pass/Fail');
  lines.push('');
  lines.push(`**Result**: ${result.pass ? '✅ PASS' : '❌ FAIL'}`);
  lines.push('');
  if (result.pass) {
    lines.push('AI output successfully differs from deterministic fallback.');
    lines.push('AI enrichment is working correctly.');
  } else {
    lines.push('Validation failed. See differences and observations above.');
  }
  lines.push('');

  return lines.join('\n');
}

main();
