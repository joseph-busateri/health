/**
 * Recommendation Monitoring Script
 * 
 * Displays real-time metrics for AI-enriched recommendation system.
 * Monitors success rates, latency, fallback rates, and failure reasons.
 */

import { getRecommendationMetrics } from '../services/recommendationMetricsService';

// ============================================================================
// MONITORING DISPLAY
// ============================================================================

function displayMetrics() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║         RECOMMENDATION SYSTEM MONITORING                                   ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const metrics = getRecommendationMetrics();
  
  // AI Enrichment Metrics
  console.log('📊 AI ENRICHMENT METRICS');
  console.log('─'.repeat(80));
  console.log(`Attempted:        ${metrics.aiEnrichmentAttempted}`);
  console.log(`Succeeded:        ${metrics.aiEnrichmentSucceeded}`);
  console.log(`Failed:           ${metrics.aiEnrichmentFailed}`);
  console.log(`Timeouts:         ${metrics.aiEnrichmentTimeouts}`);
  console.log(`Parse Errors:     ${metrics.aiEnrichmentParseErrors}`);
  console.log(`Success Rate:     ${metrics.aiSuccessRate.toFixed(1)}%`);
  console.log(`Avg Latency:      ${metrics.avgAIResponseLatencyMs}ms`);
  console.log('');
  
  // Status indicator
  if (metrics.aiSuccessRate >= 90) {
    console.log('✅ AI Success Rate: HEALTHY (≥90%)');
  } else if (metrics.aiSuccessRate >= 80) {
    console.log('⚠️  AI Success Rate: WARNING (80-90%)');
  } else {
    console.log('❌ AI Success Rate: CRITICAL (<80%)');
  }
  
  if (metrics.avgAIResponseLatencyMs <= 5000) {
    console.log('✅ Avg Latency: HEALTHY (≤5s)');
  } else if (metrics.avgAIResponseLatencyMs <= 10000) {
    console.log('⚠️  Avg Latency: WARNING (5-10s)');
  } else {
    console.log('❌ Avg Latency: CRITICAL (>10s)');
  }
  console.log('');
  
  // Fallback Metrics
  console.log('🔄 FALLBACK METRICS');
  console.log('─'.repeat(80));
  console.log(`Fallback Used:    ${metrics.fallbackUsed}`);
  console.log(`Fallback Rate:    ${metrics.aiFallbackRate.toFixed(1)}%`);
  console.log('');
  
  if (Object.keys(metrics.fallbackReasons).length > 0) {
    console.log('Top Fallback Reasons:');
    const sortedReasons = Object.entries(metrics.fallbackReasons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    sortedReasons.forEach(([reason, count]) => {
      console.log(`  • ${reason}: ${count}`);
    });
    console.log('');
  }
  
  // Status indicator
  if (metrics.aiFallbackRate <= 10) {
    console.log('✅ Fallback Rate: HEALTHY (≤10%)');
  } else if (metrics.aiFallbackRate <= 20) {
    console.log('⚠️  Fallback Rate: WARNING (10-20%)');
  } else {
    console.log('❌ Fallback Rate: CRITICAL (>20%)');
  }
  console.log('');
  
  // Validation Metrics
  console.log('✓ VALIDATION METRICS');
  console.log('─'.repeat(80));
  console.log(`Attempted:        ${metrics.validationAttempted}`);
  console.log(`Passed:           ${metrics.validationPassed}`);
  console.log(`Failed:           ${metrics.validationFailed}`);
  console.log(`Success Rate:     ${metrics.validationSuccessRate.toFixed(1)}%`);
  console.log('');
  
  if (Object.keys(metrics.validationErrors).length > 0) {
    console.log('Top Validation Errors:');
    const sortedErrors = Object.entries(metrics.validationErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    sortedErrors.forEach(([error, count]) => {
      console.log(`  • ${error}: ${count}`);
    });
    console.log('');
  }
  
  // Status indicator
  if (metrics.validationSuccessRate >= 95) {
    console.log('✅ Validation Success Rate: HEALTHY (≥95%)');
  } else if (metrics.validationSuccessRate >= 90) {
    console.log('⚠️  Validation Success Rate: WARNING (90-95%)');
  } else {
    console.log('❌ Validation Success Rate: CRITICAL (<90%)');
  }
  console.log('');
  
  // Normalization Metrics
  console.log('🔧 NORMALIZATION METRICS');
  console.log('─'.repeat(80));
  console.log(`Attempted:        ${metrics.normalizationAttempted}`);
  console.log(`Succeeded:        ${metrics.normalizationSucceeded}`);
  console.log(`Failed:           ${metrics.normalizationFailed}`);
  console.log(`Success Rate:     ${metrics.normalizationSuccessRate.toFixed(1)}%`);
  console.log('');
  
  // Overall Health
  console.log('🏥 OVERALL HEALTH');
  console.log('─'.repeat(80));
  
  const healthChecks = [
    { name: 'AI Success Rate', healthy: metrics.aiSuccessRate >= 90 },
    { name: 'Fallback Rate', healthy: metrics.aiFallbackRate <= 10 },
    { name: 'Avg Latency', healthy: metrics.avgAIResponseLatencyMs <= 5000 },
    { name: 'Validation Success', healthy: metrics.validationSuccessRate >= 95 },
    { name: 'Normalization Success', healthy: metrics.normalizationSuccessRate >= 95 },
  ];
  
  const healthyCount = healthChecks.filter(c => c.healthy).length;
  const totalChecks = healthChecks.length;
  
  healthChecks.forEach(check => {
    const icon = check.healthy ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
  });
  
  console.log('');
  console.log(`Overall Health: ${healthyCount}/${totalChecks} checks passing`);
  
  if (healthyCount === totalChecks) {
    console.log('✅ SYSTEM STATUS: HEALTHY');
  } else if (healthyCount >= totalChecks * 0.8) {
    console.log('⚠️  SYSTEM STATUS: WARNING');
  } else {
    console.log('❌ SYSTEM STATUS: CRITICAL');
  }
  
  // Timestamps
  console.log('');
  console.log('⏰ TIMESTAMPS');
  console.log('─'.repeat(80));
  console.log(`Last Reset:       ${new Date(metrics.lastReset).toLocaleString()}`);
  console.log(`Last Update:      ${new Date(metrics.lastUpdate).toLocaleString()}`);
  
  console.log('\n');
}

// ============================================================================
// CONTINUOUS MONITORING
// ============================================================================

function startContinuousMonitoring(intervalSeconds: number = 30) {
  console.log(`Starting continuous monitoring (refresh every ${intervalSeconds}s)...`);
  console.log('Press Ctrl+C to stop\n');
  
  // Initial display
  displayMetrics();
  
  // Refresh periodically
  setInterval(() => {
    console.clear();
    displayMetrics();
  }, intervalSeconds * 1000);
}

// ============================================================================
// MAIN
// ============================================================================

const args = process.argv.slice(2);
const continuous = args.includes('--continuous') || args.includes('-c');
const intervalArg = args.find(arg => arg.startsWith('--interval='));
const interval = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 30;

if (continuous) {
  startContinuousMonitoring(interval);
} else {
  displayMetrics();
}
