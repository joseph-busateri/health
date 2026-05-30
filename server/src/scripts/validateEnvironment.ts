/**
 * Validate Environment Configuration
 * 
 * Verifies that all required environment variables for AI-enriched
 * recommendations are properly configured.
 */

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });


interface ValidationResult {
  variable: string;
  required: boolean;
  present: boolean;
  value?: string;
  masked?: string;
  valid: boolean;
  message: string;
}

const results: ValidationResult[] = [];

function validateVariable(
  name: string,
  required: boolean = true,
  validator?: (value: string) => boolean
): void {
  const value = process.env[name];
  const present = value !== undefined && value !== '';
  
  let valid = present;
  let message = '';
  let masked: string | undefined;
  
  if (!present) {
    valid = !required;
    message = required ? 'Missing (REQUIRED)' : 'Missing (optional)';
  } else {
    // Mask sensitive values
    if (name.includes('KEY') || name.includes('SECRET')) {
      masked = value!.substring(0, 8) + '...' + value!.substring(value!.length - 4);
    } else {
      masked = value;
    }
    
    // Run custom validator if provided
    if (validator) {
      valid = validator(value!);
      message = valid ? 'Valid' : 'Invalid format';
    } else {
      valid = true;
      message = 'Present';
    }
  }
  
  results.push({
    variable: name,
    required,
    present,
    value,
    masked,
    valid,
    message,
  });
  
  const icon = valid ? '✅' : (required ? '❌' : '⚠️');
  console.log(`${icon} ${name.padEnd(35)} ${message}${masked ? ` (${masked})` : ''}`);
}

function validateBoolean(value: string): boolean {
  return value === 'true' || value === 'false';
}

function validateNumber(value: string): boolean {
  return !isNaN(parseInt(value, 10));
}

function validateOpenAIKey(value: string): boolean {
  return value.startsWith('sk-') && value.length > 20;
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function validateEnvironment() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║         ENVIRONMENT CONFIGURATION VALIDATION                               ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  // Database
  console.log('📊 DATABASE CONFIGURATION');
  console.log('─'.repeat(80));
  validateVariable('DATABASE_URL', true);
  validateVariable('SUPABASE_URL', true);
  validateVariable('SUPABASE_ANON_KEY', true);
  console.log('');
  
  // AI Enrichment - Global
  console.log('🤖 AI ENRICHMENT - GLOBAL');
  console.log('─'.repeat(80));
  validateVariable('USE_AI_ENRICHMENT', true, validateBoolean);
  console.log('');
  
  // AI Enrichment - Engine-Specific
  console.log('🎯 AI ENRICHMENT - ENGINE-SPECIFIC');
  console.log('─'.repeat(80));
  validateVariable('USE_AI_ENRICHMENT_RECOVERY', false, validateBoolean);
  validateVariable('USE_AI_ENRICHMENT_STRESS', false, validateBoolean);
  console.log('');
  
  // OpenAI Configuration
  console.log('🔑 OPENAI CONFIGURATION');
  console.log('─'.repeat(80));
  validateVariable('OPENAI_API_KEY', true, validateOpenAIKey);
  validateVariable('OPENAI_MODEL', false);
  validateVariable('OPENAI_TIMEOUT_MS', false, validateNumber);
  validateVariable('OPENAI_MAX_TOKENS', false, validateNumber);
  console.log('');
  
  // Configuration Analysis
  console.log('📋 CONFIGURATION ANALYSIS');
  console.log('─'.repeat(80));
  
  const useAIEnrichment = process.env.USE_AI_ENRICHMENT === 'true';
  const useRecoveryAI = process.env.USE_AI_ENRICHMENT_RECOVERY === 'true';
  const useStressAI = process.env.USE_AI_ENRICHMENT_STRESS === 'true';
  const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
  
  console.log(`Global AI Enrichment:         ${useAIEnrichment ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Recovery Engine AI:           ${useRecoveryAI ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Stress Engine AI:             ${useStressAI ? 'ENABLED' : 'DISABLED'}`);
  console.log(`OpenAI API Key:               ${hasOpenAIKey ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log('');
  
  // Warnings and recommendations
  console.log('⚠️  WARNINGS & RECOMMENDATIONS');
  console.log('─'.repeat(80));
  
  const warnings: string[] = [];
  
  if (useAIEnrichment && !hasOpenAIKey) {
    warnings.push('AI enrichment is enabled but OpenAI API key is not configured');
  }
  
  if (!useAIEnrichment && (useRecoveryAI || useStressAI)) {
    warnings.push('Engine-specific AI flags are set but global USE_AI_ENRICHMENT is disabled');
  }
  
  if (useStressAI && !useRecoveryAI) {
    warnings.push('Stress Engine AI is enabled but Recovery Engine AI is not (recommended to test Recovery first)');
  }
  
  if (useAIEnrichment && !useRecoveryAI && !useStressAI) {
    warnings.push('Global AI enrichment is enabled but no engine-specific flags are set');
  }
  
  const timeoutMs = parseInt(process.env.OPENAI_TIMEOUT_MS || '30000', 10);
  if (timeoutMs > 60000) {
    warnings.push(`OpenAI timeout is very high (${timeoutMs}ms) - consider reducing to 30000ms`);
  }
  
  const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10);
  if (maxTokens > 2000) {
    warnings.push(`OpenAI max tokens is very high (${maxTokens}) - consider reducing to 1000`);
  }
  
  if (warnings.length === 0) {
    console.log('✅ No warnings - configuration looks good');
  } else {
    warnings.forEach(warning => {
      console.log(`⚠️  ${warning}`);
    });
  }
  console.log('');
  
  // Production Test Mode Recommendation
  console.log('🎯 PRODUCTION TEST MODE RECOMMENDATION');
  console.log('─'.repeat(80));
  
  if (!hasOpenAIKey) {
    console.log('❌ NOT READY: OpenAI API key must be configured');
  } else if (useRecoveryAI && !useStressAI) {
    console.log('✅ READY: Recovery Engine AI enabled, Stress Engine disabled (RECOMMENDED)');
  } else if (useRecoveryAI && useStressAI) {
    console.log('⚠️  CAUTION: Both Recovery and Stress AI enabled (test Recovery first)');
  } else if (!useRecoveryAI && !useStressAI) {
    console.log('⚠️  AI enrichment disabled for all engines');
  } else {
    console.log('⚠️  Unexpected configuration - review settings');
  }
  console.log('');
  
  // Summary
  console.log('📊 VALIDATION SUMMARY');
  console.log('─'.repeat(80));
  
  const required = results.filter(r => r.required);
  const requiredValid = required.filter(r => r.valid).length;
  const optional = results.filter(r => !r.required);
  const optionalValid = optional.filter(r => r.valid).length;
  
  console.log(`Required Variables:           ${requiredValid}/${required.length} valid`);
  console.log(`Optional Variables:           ${optionalValid}/${optional.length} valid`);
  console.log(`Warnings:                     ${warnings.length}`);
  console.log('');
  
  const allRequiredValid = requiredValid === required.length;
  
  if (allRequiredValid) {
    console.log('✅ ENVIRONMENT VALIDATION: PASSED');
    console.log('✅ All required variables are configured correctly');
  } else {
    console.log('❌ ENVIRONMENT VALIDATION: FAILED');
    console.log('❌ Some required variables are missing or invalid');
  }
  
  console.log('\n');
  
  process.exit(allRequiredValid ? 0 : 1);
}

// Run validation
validateEnvironment();
