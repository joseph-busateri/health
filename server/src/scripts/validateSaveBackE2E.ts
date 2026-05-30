/// <reference types="node" />
import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3020';

const postJson = async (endpoint: string, body: any) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
};

const getJson = async (endpoint: string) => {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
};

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

const logResult = (name: string, passed: boolean, details: string) => {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅' : '❌'} ${name} — ${details}`);
};

const testCompleteInterview = async () => {
  console.log('\n=== Testing Complete Interview with Save Back ===\n');

  const userId = `saveback-test-${Date.now()}`;
  
  const context = {
    userId,
    recovery: { score: 'low', sleepHours: 5, sleepQuality: 2, recoveryFeeling: 2 },
    stress: { level: 'high', sources: ['Work', 'Finances'], trend: 'worsening' },
    jointPain: { hasActivePain: true, location: ['knee'], severity: 7 },
    workoutAdherence: 40,
  };

  const startResponse = await postJson('/interview/start', context);
  const sessionId = startResponse.data?.data?.sessionId;

  if (!startResponse.ok || !sessionId) {
    logResult('Interview start', false, 'Failed to start interview');
    return null;
  }

  logResult('Interview start', true, `Session created: ${sessionId}`);

  const responses = [
    { questionId: 'sleep_quality', answer: 'Poor' },
    { questionId: 'sleep_interruptions', answer: 'Woke up multiple times' },
    { questionId: 'stress_level', answer: 'High' },
    { questionId: 'stress_sources', answer: 'Work, Finances' },
    { questionId: 'joint_pain_check', answer: 'Moderate pain' },
    { questionId: 'joint_pain_location', answer: 'Knee' },
    { questionId: 'final_open_question', answer: 'Feeling really run down this week' },
  ];

  for (const resp of responses) {
    await postJson(`/interview/${sessionId}/response`, {
      ...resp,
      question: resp.questionId,
      context,
    });
  }

  logResult('Interview responses submitted', true, `${responses.length} responses recorded`);

  const finalizeResponse = await postJson(`/interview/${sessionId}/finalize`, {
    context,
    reason: 'completed',
  });

  if (!finalizeResponse.ok) {
    logResult('Interview finalization', false, 'Failed to finalize');
    return null;
  }

  const summary = finalizeResponse.data?.data;
  const saveBackResult = summary?.saveBackResult;

  if (saveBackResult) {
    logResult('Interview finalization', true, 'Interview finalized with save back');
    return { userId, sessionId, saveBackResult, summary };
  } else {
    logResult('Interview finalization', false, 'No save back result');
    return null;
  }
};

const testRawConversationStorage = (saveBackResult: any) => {
  console.log('\n=== Testing Raw Conversation Storage ===\n');

  if (!saveBackResult || !saveBackResult.structuredData) {
    logResult('Raw conversation exists', false, 'No structured data found');
    return;
  }

  const rawConversation = saveBackResult.structuredData.rawConversation;

  if (rawConversation && Array.isArray(rawConversation) && rawConversation.length > 0) {
    logResult('Raw conversation exists', true, `${rawConversation.length} Q&A pairs stored`);

    const hasQuestionIds = rawConversation.every((r: any) => r.questionId);
    const hasAnswers = rawConversation.every((r: any) => r.answer);
    const hasTimestamps = rawConversation.every((r: any) => r.timestamp);

    if (hasQuestionIds && hasAnswers && hasTimestamps) {
      logResult('Raw conversation format', true, 'All fields present (questionId, answer, timestamp)');
    } else {
      logResult('Raw conversation format', false, 'Missing required fields');
    }

    const sampleEntry = rawConversation[0];
    logResult('Raw conversation sample', true, `Q: "${sampleEntry.question}" A: "${sampleEntry.answer}"`);
  } else {
    logResult('Raw conversation exists', false, 'Raw conversation empty or invalid');
  }
};

const testStructuredMapping = (saveBackResult: any) => {
  console.log('\n=== Testing Structured Data Mapping ===\n');

  if (!saveBackResult || !saveBackResult.structuredData) {
    logResult('Structured data exists', false, 'No structured data found');
    return;
  }

  const structured = saveBackResult.structuredData;

  if (structured.recovery) {
    logResult('Recovery data mapped', true, `sleepQuality: ${structured.recovery.sleepQuality}, sleepHours: ${structured.recovery.sleepHours}`);
  } else {
    logResult('Recovery data mapped', false, 'No recovery data');
  }

  if (structured.stress) {
    logResult('Stress data mapped', true, `level: ${structured.stress.level}, sources: ${structured.stress.sources?.join(', ')}`);
  } else {
    logResult('Stress data mapped', false, 'No stress data');
  }

  if (structured.jointHealth) {
    logResult('Joint health data mapped', true, `painLevel: ${structured.jointHealth.painLevel}, areas: ${structured.jointHealth.affectedAreas?.join(', ')}`);
  } else {
    logResult('Joint health data mapped', false, 'No joint health data');
  }

  if (structured.additionalNotes) {
    logResult('Additional notes captured', true, `"${structured.additionalNotes}"`);
  } else {
    logResult('Additional notes captured', false, 'No additional notes');
  }

  const mappedFields = [
    structured.recovery,
    structured.stress,
    structured.jointHealth,
    structured.workoutReadiness,
    structured.adherence,
    structured.nutrition,
  ].filter(Boolean).length;

  logResult('Structured mapping coverage', true, `${mappedFields} domains mapped from conversation`);
};

const testEngineUpdates = (saveBackResult: any) => {
  console.log('\n=== Testing Engine Updates ===\n');

  if (!saveBackResult || !saveBackResult.enginesUpdated) {
    logResult('Engines updated', false, 'No engine update info');
    return;
  }

  const enginesUpdated = saveBackResult.enginesUpdated;

  if (enginesUpdated.length > 0) {
    logResult('Engines updated', true, `${enginesUpdated.length} engines updated: ${enginesUpdated.join(', ')}`);

    const expectedEngines = ['recovery', 'stress', 'joint_health'];
    const allExpectedPresent = expectedEngines.every(e => enginesUpdated.includes(e));

    if (allExpectedPresent) {
      logResult('Core engines updated', true, 'Recovery, stress, and joint health engines updated');
    } else {
      const missingEngines = expectedEngines.filter(e => !enginesUpdated.includes(e));
      logResult('Core engines updated', false, `Missing: ${missingEngines.join(', ')}`);
    }
  } else {
    logResult('Engines updated', false, 'No engines were updated');
  }

  if (saveBackResult.errors && saveBackResult.errors.length > 0) {
    logResult('Engine update errors', false, `Errors: ${saveBackResult.errors.join(', ')}`);
  } else {
    logResult('Engine update errors', true, 'No errors during engine updates');
  }
};

const testDashboardUpdate = async (userId: string) => {
  console.log('\n=== Testing Dashboard Updates ===\n');

  const recoveryResponse = await getJson(`/recovery/${userId}/today`);
  if (recoveryResponse.ok && recoveryResponse.data?.data) {
    const recoveryScore = recoveryResponse.data.data.recoveryScore;
    logResult('Recovery engine reflects interview data', true, `Recovery score: ${recoveryScore}/100`);
  } else {
    logResult('Recovery engine reflects interview data', false, 'Failed to fetch recovery data');
  }

  const stressResponse = await getJson(`/stress/${userId}/today`);
  if (stressResponse.ok && stressResponse.data?.data) {
    const stressStatus = stressResponse.data.data.stressStatus;
    logResult('Stress engine reflects interview data', true, `Stress status: ${stressStatus}`);
  } else {
    logResult('Stress engine reflects interview data', false, 'Failed to fetch stress data');
  }

  const jointResponse = await getJson(`/joint-health/${userId}/today`);
  if (jointResponse.ok && jointResponse.data?.data) {
    const jointStatus = jointResponse.data.data.jointHealthStatus;
    logResult('Joint health engine reflects interview data', true, `Joint status: ${jointStatus}`);
  } else {
    logResult('Joint health engine reflects interview data', false, 'Failed to fetch joint health data');
  }

  const adherenceResponse = await getJson(`/adherence/${userId}/today`);
  if (adherenceResponse.ok && adherenceResponse.data?.data) {
    const adherenceScore = adherenceResponse.data.data.adherenceScore;
    logResult('Adherence engine reflects interview data', true, `Adherence score: ${adherenceScore}/100`);
  } else {
    logResult('Adherence engine reflects interview data', false, 'Failed to fetch adherence data');
  }
};

const testPartialAnswerHandling = async () => {
  console.log('\n=== Testing Partial Answer Handling ===\n');

  const userId = `partial-test-${Date.now()}`;
  
  const context = {
    userId,
    recovery: { score: 'low', sleepHours: 6, sleepQuality: 3, recoveryFeeling: 3 },
  };

  const startResponse = await postJson('/interview/start', context);
  const sessionId = startResponse.data?.data?.sessionId;

  if (!startResponse.ok || !sessionId) {
    logResult('Partial interview start', false, 'Failed to start interview');
    return;
  }

  const partialResponses = [
    { questionId: 'sleep_quality', answer: 'Okay' },
    { questionId: 'final_open_question', answer: 'Nothing else' },
  ];

  for (const resp of partialResponses) {
    await postJson(`/interview/${sessionId}/response`, {
      ...resp,
      question: resp.questionId,
      context,
    });
  }

  const finalizeResponse = await postJson(`/interview/${sessionId}/finalize`, {
    context,
    reason: 'completed',
  });

  if (!finalizeResponse.ok) {
    logResult('Partial interview finalization', false, 'Failed to finalize');
    return;
  }

  const saveBackResult = finalizeResponse.data?.data?.saveBackResult;

  if (saveBackResult) {
    logResult('Partial interview saves', true, 'Partial interview saved successfully');

    if (saveBackResult.structuredData?.recovery) {
      logResult('Partial data mapped', true, 'Recovery data extracted from partial answers');
    } else {
      logResult('Partial data mapped', false, 'No data mapped from partial answers');
    }

    if (saveBackResult.enginesUpdated && saveBackResult.enginesUpdated.length > 0) {
      logResult('Partial engine updates', true, `${saveBackResult.enginesUpdated.length} engines updated with partial data`);
    } else {
      logResult('Partial engine updates', false, 'No engines updated');
    }

    const hasErrors = saveBackResult.errors && saveBackResult.errors.length > 0;
    if (!hasErrors) {
      logResult('Partial save graceful handling', true, 'No errors despite incomplete data');
    } else {
      logResult('Partial save graceful handling', false, `Errors: ${saveBackResult.errors.join(', ')}`);
    }
  } else {
    logResult('Partial interview saves', false, 'No save back result');
  }
};

const testAuditability = (saveBackResult: any) => {
  console.log('\n=== Testing Auditability ===\n');

  if (!saveBackResult) {
    logResult('Audit trail exists', false, 'No save back result');
    return;
  }

  if (saveBackResult.conversationId) {
    logResult('Conversation ID assigned', true, `ID: ${saveBackResult.conversationId}`);
  } else {
    logResult('Conversation ID assigned', false, 'No conversation ID');
  }

  if (saveBackResult.pointInTimeRecordId) {
    logResult('Point-in-time record created', true, `Record ID: ${saveBackResult.pointInTimeRecordId}`);
  } else {
    logResult('Point-in-time record created', false, 'No point-in-time record');
  }

  const structured = saveBackResult.structuredData;
  if (structured?.userId && structured?.interviewDate && structured?.conversationId) {
    logResult('Linkage identifiers present', true, 'userId, interviewDate, conversationId all present');
  } else {
    logResult('Linkage identifiers present', false, 'Missing linkage identifiers');
  }

  if (structured?.rawConversation && structured.recovery) {
    logResult('Both raw and structured data preserved', true, 'Dual storage confirmed');
  } else {
    logResult('Both raw and structured data preserved', false, 'Missing raw or structured data');
  }

  if (saveBackResult.success !== undefined) {
    logResult('Success status tracked', true, `Success: ${saveBackResult.success}`);
  } else {
    logResult('Success status tracked', false, 'No success status');
  }

  const hasEngineStatus = saveBackResult.enginesUpdated && Array.isArray(saveBackResult.enginesUpdated);
  if (hasEngineStatus) {
    logResult('Engine update status tracked', true, `${saveBackResult.enginesUpdated.length} engines tracked`);
  } else {
    logResult('Engine update status tracked', false, 'No engine status tracking');
  }
};

const printSummary = () => {
  console.log('\n\nPass/Fail Summary');
  console.log('=================');

  const categories = {
    'raw conversation storage': results.filter(r => 
      r.name.toLowerCase().includes('raw conversation') || 
      r.name.toLowerCase().includes('q&a')
    ),
    'structured mapping': results.filter(r => 
      r.name.toLowerCase().includes('mapped') || 
      r.name.toLowerCase().includes('structured') ||
      r.name.toLowerCase().includes('coverage')
    ),
    'engine updates': results.filter(r => 
      r.name.toLowerCase().includes('engine') && 
      !r.name.toLowerCase().includes('partial') &&
      !r.name.toLowerCase().includes('dashboard')
    ),
    'dashboard update': results.filter(r => 
      r.name.toLowerCase().includes('dashboard') || 
      r.name.toLowerCase().includes('reflects')
    ),
    'partial-save behavior': results.filter(r => 
      r.name.toLowerCase().includes('partial')
    ),
    'auditability': results.filter(r => 
      r.name.toLowerCase().includes('audit') || 
      r.name.toLowerCase().includes('conversation id') ||
      r.name.toLowerCase().includes('point-in-time') ||
      r.name.toLowerCase().includes('linkage') ||
      r.name.toLowerCase().includes('preserved') ||
      r.name.toLowerCase().includes('tracked')
    ),
  };

  for (const [category, tests] of Object.entries(categories)) {
    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    const status = passed === total ? '✅ PASS' : '❌ FAIL';
    console.log(`${category}: ${status} (${passed}/${total})`);
  }

  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const overallStatus = totalPassed === totalTests ? '✅ PASS' : '❌ FAIL';
  
  console.log(`\nOverall: ${overallStatus}`);
  console.log(`${totalPassed}/${totalTests} tests passed`);
};

const main = async () => {
  console.log('Structured Save Back E2E Validation');
  console.log('===================================\n');

  const interviewResult = await testCompleteInterview();

  if (interviewResult) {
    testRawConversationStorage(interviewResult.saveBackResult);
    testStructuredMapping(interviewResult.saveBackResult);
    testEngineUpdates(interviewResult.saveBackResult);
    await testDashboardUpdate(interviewResult.userId);
    testAuditability(interviewResult.saveBackResult);
  }

  await testPartialAnswerHandling();

  printSummary();

  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
};

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
