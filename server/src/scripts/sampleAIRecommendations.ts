/**
 * Sample AI Recommendations Script
 * 
 * Fetches recent Recovery Engine recommendations and displays AI-enriched fields
 * for quality review.
 */

import { supabase } from '../config/supabase';
import type { Recommendation } from '../types/recommendationEngine';

// ============================================================================
// SAMPLING CONFIGURATION
// ============================================================================

const DEFAULT_LIMIT = 10;
const DEFAULT_ENGINE = 'recovery';

// ============================================================================
// RECOMMENDATION FETCHING
// ============================================================================

async function fetchRecentRecommendations(
  sourceEngine: string = DEFAULT_ENGINE,
  limit: number = DEFAULT_LIMIT
): Promise<Recommendation[]> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('source_engine', sourceEngine)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to fetch recommendations: ${error.message}`);
  }
  
  return data || [];
}

// ============================================================================
// DISPLAY FORMATTING
// ============================================================================

function displayRecommendation(rec: Recommendation, index: number) {
  console.log('\n' + '='.repeat(80));
  console.log(`RECOMMENDATION #${index + 1}`);
  console.log('='.repeat(80));
  console.log('');
  
  // Basic Info
  console.log('📋 BASIC INFO');
  console.log('─'.repeat(80));
  console.log(`ID:               ${rec.id}`);
  console.log(`User ID:          ${rec.userId}`);
  console.log(`Source Engine:    ${rec.sourceEngine}`);
  console.log(`Priority:         ${rec.priority}`);
  console.log(`Category:         ${rec.category}`);
  console.log(`State:            ${rec.state}`);
  console.log(`Created:          ${new Date(rec.createdAt).toLocaleString()}`);
  console.log('');
  
  // Content
  console.log('📝 CONTENT');
  console.log('─'.repeat(80));
  console.log(`Title:            ${rec.title}`);
  console.log(`Description:      ${rec.description}`);
  if (rec.rationale) {
    console.log(`Rationale:        ${rec.rationale}`);
  }
  console.log('');
  
  // AI-Enriched Fields
  console.log('🤖 AI-ENRICHED FIELDS');
  console.log('─'.repeat(80));
  
  const hasAIFields = rec.reasonCodes || rec.recommendationGroup || rec.supportingMetrics || 
                      rec.isInsightOnly !== undefined || rec.requiresUserDecision !== undefined;
  
  if (!hasAIFields) {
    console.log('❌ No AI-enriched fields (direct emission or old format)');
  } else {
    console.log('✅ AI-enriched fields present');
    console.log('');
    
    if (rec.reasonCodes && rec.reasonCodes.length > 0) {
      console.log(`Reason Codes:     [${rec.reasonCodes.join(', ')}]`);
    } else {
      console.log('Reason Codes:     (none)');
    }
    
    if (rec.recommendationGroup) {
      console.log(`Group:            ${rec.recommendationGroup}`);
    } else {
      console.log('Group:            (none)');
    }
    
    if (rec.supportingMetrics && rec.supportingMetrics.length > 0) {
      console.log(`Supporting Metrics: (${rec.supportingMetrics.length} metrics)`);
      rec.supportingMetrics.forEach((metric: any, idx: number) => {
        console.log(`  ${idx + 1}. ${metric.name}: ${metric.value} (${metric.status})`);
        if (metric.target) console.log(`     Target: ${metric.target}`);
        if (metric.change) console.log(`     Change: ${metric.change}`);
      });
    } else {
      console.log('Supporting Metrics: (none)');
    }
    
    console.log(`Is Insight Only:  ${rec.isInsightOnly ?? 'not set'}`);
    console.log(`Requires Decision: ${rec.requiresUserDecision ?? 'not set'}`);
  }
  
  console.log('');
  
  // Quality Metrics
  console.log('📊 QUALITY METRICS');
  console.log('─'.repeat(80));
  console.log(`Confidence:       ${rec.confidenceLevel}`);
  console.log(`Data Quality:     ${rec.dataQualityScore ?? 'not set'}`);
  console.log(`Urgency Score:    ${rec.urgencyScore ?? 'not set'}`);
  console.log('');
}

// ============================================================================
// QUALITY ANALYSIS
// ============================================================================

function analyzeQuality(recommendations: Recommendation[]) {
  console.log('\n' + '='.repeat(80));
  console.log('QUALITY ANALYSIS');
  console.log('='.repeat(80));
  console.log('');
  
  const total = recommendations.length;
  const withAI = recommendations.filter(r => 
    r.reasonCodes || r.recommendationGroup || r.supportingMetrics
  ).length;
  const withoutAI = total - withAI;
  
  console.log(`Total Recommendations:        ${total}`);
  console.log(`With AI-Enriched Fields:      ${withAI} (${((withAI / total) * 100).toFixed(1)}%)`);
  console.log(`Without AI-Enriched Fields:   ${withoutAI} (${((withoutAI / total) * 100).toFixed(1)}%)`);
  console.log('');
  
  if (withAI > 0) {
    const aiRecs = recommendations.filter(r => r.reasonCodes || r.recommendationGroup);
    
    // Reason codes analysis
    const withReasonCodes = aiRecs.filter(r => r.reasonCodes && r.reasonCodes.length > 0).length;
    const avgReasonCodes = aiRecs
      .filter(r => r.reasonCodes)
      .reduce((sum, r) => sum + (r.reasonCodes?.length || 0), 0) / withReasonCodes || 0;
    
    console.log('AI-Enriched Field Coverage:');
    console.log(`  Reason Codes:               ${withReasonCodes}/${withAI} (${((withReasonCodes / withAI) * 100).toFixed(1)}%)`);
    console.log(`  Avg Reason Codes:           ${avgReasonCodes.toFixed(1)}`);
    
    // Group analysis
    const withGroup = aiRecs.filter(r => r.recommendationGroup).length;
    console.log(`  Recommendation Group:       ${withGroup}/${withAI} (${((withGroup / withAI) * 100).toFixed(1)}%)`);
    
    // Metrics analysis
    const withMetrics = aiRecs.filter(r => r.supportingMetrics && r.supportingMetrics.length > 0).length;
    const avgMetrics = aiRecs
      .filter(r => r.supportingMetrics)
      .reduce((sum, r) => sum + (r.supportingMetrics?.length || 0), 0) / withMetrics || 0;
    
    console.log(`  Supporting Metrics:         ${withMetrics}/${withAI} (${((withMetrics / withAI) * 100).toFixed(1)}%)`);
    console.log(`  Avg Supporting Metrics:     ${avgMetrics.toFixed(1)}`);
    
    // Flags analysis
    const insightOnly = aiRecs.filter(r => r.isInsightOnly === true).length;
    const requiresDecision = aiRecs.filter(r => r.requiresUserDecision === true).length;
    
    console.log(`  Is Insight Only:            ${insightOnly}/${withAI} (${((insightOnly / withAI) * 100).toFixed(1)}%)`);
    console.log(`  Requires User Decision:     ${requiresDecision}/${withAI} (${((requiresDecision / withAI) * 100).toFixed(1)}%)`);
    console.log('');
    
    // Most common reason codes
    const allReasonCodes = aiRecs
      .filter(r => r.reasonCodes)
      .flatMap(r => r.reasonCodes || []);
    
    if (allReasonCodes.length > 0) {
      const reasonCodeCounts = allReasonCodes.reduce((acc, code) => {
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topReasonCodes = Object.entries(reasonCodeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      
      console.log('Top Reason Codes:');
      topReasonCodes.forEach(([code, count]) => {
        console.log(`  • ${code}: ${count}`);
      });
      console.log('');
    }
    
    // Most common groups
    const allGroups = aiRecs
      .filter(r => r.recommendationGroup)
      .map(r => r.recommendationGroup!);
    
    if (allGroups.length > 0) {
      const groupCounts = allGroups.reduce((acc, group) => {
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topGroups = Object.entries(groupCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      
      console.log('Top Recommendation Groups:');
      topGroups.forEach(([group, count]) => {
        console.log(`  • ${group}: ${count}`);
      });
      console.log('');
    }
  }
  
  // Content quality analysis
  console.log('Content Quality:');
  const avgTitleLength = recommendations.reduce((sum, r) => sum + r.title.length, 0) / total;
  const avgDescLength = recommendations.reduce((sum, r) => sum + r.description.length, 0) / total;
  const withRationale = recommendations.filter(r => r.rationale && r.rationale.length > 0).length;
  const avgRationaleLength = recommendations
    .filter(r => r.rationale)
    .reduce((sum, r) => sum + (r.rationale?.length || 0), 0) / withRationale || 0;
  
  console.log(`  Avg Title Length:           ${avgTitleLength.toFixed(0)} chars`);
  console.log(`  Avg Description Length:     ${avgDescLength.toFixed(0)} chars`);
  console.log(`  With Rationale:             ${withRationale}/${total} (${((withRationale / total) * 100).toFixed(1)}%)`);
  console.log(`  Avg Rationale Length:       ${avgRationaleLength.toFixed(0)} chars`);
  console.log('');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║         AI RECOMMENDATION QUALITY REVIEW                                   ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const args = process.argv.slice(2);
  const engineArg = args.find(arg => arg.startsWith('--engine='));
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const detailArg = args.includes('--detail') || args.includes('-d');
  
  const engine = engineArg ? engineArg.split('=')[1] : DEFAULT_ENGINE;
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : DEFAULT_LIMIT;
  
  console.log(`Fetching ${limit} most recent recommendations from ${engine} engine...\n`);
  
  try {
    const recommendations = await fetchRecentRecommendations(engine, limit);
    
    if (recommendations.length === 0) {
      console.log('❌ No recommendations found');
      console.log(`   Try generating some recommendations first or check a different engine`);
      return;
    }
    
    console.log(`✅ Found ${recommendations.length} recommendations\n`);
    
    // Display detailed view if requested
    if (detailArg) {
      recommendations.forEach((rec, idx) => displayRecommendation(rec, idx));
    }
    
    // Always show quality analysis
    analyzeQuality(recommendations);
    
    console.log('');
    console.log('Usage:');
    console.log('  npm run sample-ai-recs                    # Default: 10 recovery recommendations');
    console.log('  npm run sample-ai-recs --limit=20         # Fetch 20 recommendations');
    console.log('  npm run sample-ai-recs --engine=stress    # Fetch from stress engine');
    console.log('  npm run sample-ai-recs --detail           # Show detailed view');
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
