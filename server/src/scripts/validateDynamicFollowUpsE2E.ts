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

const testContextAwareOpening = async () => {
  console.log('\n=== Testing Context-Aware Opening Questions ===\n');

  const poorSleepContext = {
    userId: 'test-poor-sleep',
    recovery: { score: 'low', sleepHours: 5, sleepQuality: 2, recoveryFeeling: 3 },
  };

  const highStressContext = {
    userId: 'test-high-stress',
    stress: { level: 'high', sources: ['work'], trend: 'worsening' },
  };

  const jointPainContext = {
    userId: 'test-joint-pain',
    jointPain: { hasActivePain: true, location: ['knee'], severity: 7 },
  };

  const poorSleepResponse = await postJson('/interview/start', poorSleepContext);
  const firstQuestion = poorSleepResponse.data?.data?.firstQuestion;
  
  if (poorSleepResponse.ok && firstQuestion && (firstQuestion.text.toLowerCase().includes('sleep') || firstQuestion.category === 'recovery')) {
    logResult('Poor sleep context → sleep/recovery question', true, `Got: "${firstQuestion.text}"`);
  } else {
    logResult('Poor sleep context → sleep/recovery question', false, poorSleepResponse.ok ? `Got: "${firstQuestion?.text || 'none'}"` : 'Request failed');
  }

  const highStressResponse = await postJson('/interview/start', highStressContext);
  const stressQuestion = highStressResponse.data?.data?.firstQuestion;
  
  if (highStressResponse.ok && stressQuestion && (stressQuestion.text.toLowerCase().includes('stress') || stressQuestion.category === 'stress')) {
    logResult('High stress context → stress question', true, `Got: "${stressQuestion.text}"`);
  } else {
    logResult('High stress context → stress question', false, highStressResponse.ok ? `Got: "${stressQuestion?.text || 'none'}"` : 'Request failed');
  }

  const jointPainResponse = await postJson('/interview/start', jointPainContext);
  const painQuestion = jointPainResponse.data?.data?.firstQuestion;
  
  if (jointPainResponse.ok && painQuestion && (painQuestion.text.toLowerCase().includes('pain') || painQuestion.category === 'joint_health')) {
    logResult('Joint pain context → joint health question', true, `Got: "${painQuestion.text}"`);
  } else {
    logResult('Joint pain context → joint health question', false, jointPainResponse.ok ? `Got: "${painQuestion?.text || 'none'}"` : 'Request failed');
  }
};

const testFollowUpLogic = async () => {
  console.log('\n=== Testing Follow-Up Logic ===\n');

  const context = {
    userId: 'test-followup',
    recovery: { score: 'low', sleepHours: 5, sleepQuality: 2, recoveryFeeling: 3 },
  };

  const startResponse = await postJson('/interview/start', context);
  const sessionId = startResponse.data?.data?.sessionId;
  const firstQuestion = startResponse.data?.data?.firstQuestion;

  if (startResponse.ok && sessionId && firstQuestion) {
    const poorSleepAnswer = 'Terrible';
    const response1 = await postJson(`/interview/${sessionId}/response`, {
      questionId: firstQuestion.id,
      question: firstQuestion.text,
      answer: poorSleepAnswer,
      context,
    });

    const followUpDecision = response1.data?.data?.followUpDecision;
    const nextQuestion = followUpDecision?.nextQuestion;

    if (response1.ok && followUpDecision?.shouldAskFollowUp && nextQuestion) {
      logResult('Poor sleep answer → follow-up question', true, `Got follow-up: "${nextQuestion.text}"`);
      
      if (nextQuestion.text.toLowerCase().includes('interrupt') || nextQuestion.text.toLowerCase().includes('what')) {
        logResult('Follow-up is contextually relevant', true, 'Question asks about sleep issues');
      } else {
        logResult('Follow-up is contextually relevant', false, `Got: "${nextQuestion.text}"`);
      }
    } else {
      logResult('Poor sleep answer → follow-up question', false, response1.ok ? 'No follow-up generated' : 'Request failed');
      logResult('Follow-up is contextually relevant', false, response1.ok ? 'No follow-up' : 'Request failed');
    }
  } else {
    logResult('Poor sleep answer → follow-up question', false, 'Failed to start interview');
    logResult('Follow-up is contextually relevant', false, 'Failed to start interview');
  }
};

const testStoppingLogic = async () => {
  console.log('\n=== Testing Stopping Logic ===\n');

  const context = {
    userId: 'test-stopping',
    recovery: { score: 'low', sleepHours: 5, sleepQuality: 2, recoveryFeeling: 3 },
    stress: { level: 'high', sources: ['work'], trend: 'stable' },
    workoutAdherence: 30,
  };

  const startResponse = await postJson('/interview/start', context);
  const sessionId = startResponse.data?.data?.sessionId;
  let currentQuestion = startResponse.data?.data?.firstQuestion;

  if (startResponse.ok && sessionId && currentQuestion) {
    let questionCount = 1;
    let stopped = false;

    const answers = ['Poor', 'Woke up multiple times', 'High', 'Work', 'Skipped', 'Too tired', 'Nothing else'];
    let sawFinalQuestion = false;

    for (let i = 0; i < answers.length && !stopped; i++) {
      const response = await postJson(`/interview/${sessionId}/response`, {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer: answers[i],
        context,
      });

      const followUpDecision = response.data?.data?.followUpDecision;
      
      if (currentQuestion.text.toLowerCase().includes('anything else')) {
        sawFinalQuestion = true;
      }
      
      if (response.ok && !followUpDecision?.shouldAskFollowUp) {
        stopped = true;
        if (sawFinalQuestion) {
          logResult('Interview stops when sufficient signal collected', true, `Stopped after ${questionCount} questions (including final question)`);
        } else {
          logResult('Interview stops when sufficient signal collected', false, `Stopped without asking final question`);
        }
        
        if (followUpDecision.reason.toLowerCase().includes('sufficient') || followUpDecision.reason.toLowerCase().includes('signal') || followUpDecision.reason.toLowerCase().includes('final')) {
          logResult('Stop reason is signal-based', true, `Reason: ${followUpDecision.reason}`);
        } else {
          logResult('Stop reason is signal-based', false, `Reason: ${followUpDecision.reason}`);
        }
        break;
      } else if (response.ok && followUpDecision?.nextQuestion) {
        currentQuestion = followUpDecision.nextQuestion;
        questionCount++;
      } else {
        logResult('Interview stops when sufficient signal collected', false, 'Request failed');
        logResult('Stop reason is signal-based', false, 'Request failed');
        break;
      }
    }

    if (!stopped) {
      logResult('Interview stops when sufficient signal collected', false, 'Did not stop after 7 questions');
      logResult('Stop reason is signal-based', false, 'Did not stop');
    }
  } else {
    logResult('Interview stops when sufficient signal collected', false, 'Failed to start interview');
    logResult('Stop reason is signal-based', false, 'Failed to start interview');
  }
};

const testFinalOpenQuestion = async () => {
  console.log('\n=== Testing Final Open-Ended Question ===\n');

  const context = {
    userId: 'test-final',
    recovery: { score: 'low', sleepHours: 5, sleepQuality: 2, recoveryFeeling: 2 },
    stress: { level: 'high', sources: ['work'], trend: 'stable' },
  };

  const startResponse = await postJson('/interview/start', context);
  const sessionId = startResponse.data?.data?.sessionId;
  let currentQuestion = startResponse.data?.data?.firstQuestion;

  if (startResponse.ok && sessionId && currentQuestion) {
    const answers = ['Poor', 'Woke up multiple times', 'High', 'Work', 'Skipped', 'Too tired', 'Nothing else'];
    let sawFinalQuestion = false;

    for (const answer of answers) {
      if (currentQuestion.text.toLowerCase().includes('anything else')) {
        sawFinalQuestion = true;
      }

      const response = await postJson(`/interview/${sessionId}/response`, {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer,
        context,
      });

      const followUpDecision = response.data?.data?.followUpDecision;
      
      if (!followUpDecision?.shouldAskFollowUp) {
        break;
      }
      currentQuestion = followUpDecision.nextQuestion;
    }

    if (sawFinalQuestion) {
      logResult('Final question is open-ended', true, 'Final "anything else?" question was asked');
    } else {
      logResult('Final question is open-ended', false, 'Did not see "anything else" question');
    }
  } else {
    logResult('Final question is open-ended', false, 'Failed to start interview');
  }
};

const testScenarios = async () => {
  console.log('\n=== Testing Specific Scenarios ===\n');

  const scenarios = [
    {
      name: 'Poor sleep scenario',
      context: {
        userId: 'scenario-poor-sleep',
        recovery: { score: 'low', sleepHours: 4, sleepQuality: 1, recoveryFeeling: 2 },
      },
      expectedCategory: 'recovery',
    },
    {
      name: 'High stress scenario',
      context: {
        userId: 'scenario-high-stress',
        stress: { level: 'high', sources: ['work', 'relationships'], trend: 'worsening' },
      },
      expectedCategory: 'stress',
    },
    {
      name: 'Joint pain scenario',
      context: {
        userId: 'scenario-joint-pain',
        jointPain: { hasActivePain: true, location: ['knee', 'shoulder'], severity: 8 },
      },
      expectedCategory: 'joint_health',
    },
    {
      name: 'Sexual health scenario',
      context: {
        userId: 'scenario-sexual-health',
        sexualHealth: { libido: 'low', performance: 'poor', concerns: ['low energy'] },
      },
      expectedCategory: 'sexual_health',
    },
    {
      name: 'Stable day scenario',
      context: {
        userId: 'scenario-stable',
        recovery: { score: 'high', sleepHours: 8, sleepQuality: 4, recoveryFeeling: 4 },
        stress: { level: 'low', sources: [], trend: 'stable' },
        workoutAdherence: 100,
      },
      expectedCategory: 'any',
    },
  ];

  for (const scenario of scenarios) {
    const response = await postJson('/interview/start', scenario.context);
    const firstQuestion = response.data?.data?.firstQuestion;
    
    if (response.ok && firstQuestion) {
      if (scenario.expectedCategory === 'any' || firstQuestion.category === scenario.expectedCategory) {
        logResult(scenario.name, true, `First question category: ${firstQuestion.category}`);
      } else {
        logResult(scenario.name, false, `Expected ${scenario.expectedCategory}, got ${firstQuestion.category}`);
      }
    } else {
      logResult(scenario.name, false, response.ok ? 'No first question generated' : 'Request failed');
    }
  }
};

const testFrontendFlow = async () => {
  console.log('\n=== Testing Frontend Flow Simulation ===\n');

  const context = {
    userId: 'test-frontend',
    recovery: { score: 'low', sleepHours: 5, sleepQuality: 2, recoveryFeeling: 3 },
  };

  const startResponse = await postJson('/interview/start', context);
  const sessionId = startResponse.data?.data?.sessionId;
  const firstQuestion = startResponse.data?.data?.firstQuestion;

  if (startResponse.ok && sessionId && firstQuestion) {
    logResult('Start interview returns session and question', true, 'Session created');

    if (firstQuestion.quickResponses && firstQuestion.quickResponses.length > 0) {
      logResult('Questions include quick responses', true, `${firstQuestion.quickResponses.length} quick responses`);
    } else {
      logResult('Questions include quick responses', false, 'No quick responses');
    }

    const response1 = await postJson(`/interview/${sessionId}/response`, {
      questionId: firstQuestion.id,
      question: firstQuestion.text,
      answer: 'Poor',
      context,
    });

    if (response1.ok && response1.data?.data?.followUpDecision && response1.data?.data?.state) {
      logResult('Response submission returns follow-up decision', true, 'Follow-up decision included');
    } else {
      logResult('Response submission returns follow-up decision', false, response1.ok ? 'Missing follow-up decision' : 'Request failed');
    }

    const stateResponse = await getJson(`/interview/${sessionId}/state`);
    const state = stateResponse.data?.data;

    if (stateResponse.ok && state?.responsesCollected?.length === 1 && state?.questionsAsked?.length === 1) {
      logResult('State tracking works correctly', true, '1 question asked, 1 response collected');
    } else {
      logResult('State tracking works correctly', false, stateResponse.ok ? `Questions: ${state?.questionsAsked?.length}, Responses: ${state?.responsesCollected?.length}` : 'Request failed');
    }

    const finalizeResponse = await postJson(`/interview/${sessionId}/finalize`, {
      context,
      reason: 'user_ended',
    });

    const summary = finalizeResponse.data?.data;
    if (finalizeResponse.ok && summary?.totalQuestions && summary?.signalQuality && summary?.areasExplored) {
      logResult('Finalize returns complete summary', true, `Signal quality: ${summary.signalQuality}`);
    } else {
      logResult('Finalize returns complete summary', false, finalizeResponse.ok ? 'Incomplete summary' : 'Request failed');
    }
  } else {
    logResult('Start interview returns session and question', false, startResponse.ok ? 'Missing data' : 'Request failed');
    logResult('Questions include quick responses', false, 'Failed to start');
    logResult('Response submission returns follow-up decision', false, 'Failed to start');
    logResult('State tracking works correctly', false, 'Failed to start');
    logResult('Finalize returns complete summary', false, 'Failed to start');
  }
};

const printSummary = () => {
  console.log('\n\nPass/Fail Summary');
  console.log('=================');

  const categories = {
    'context-aware opening': results.filter(r => 
      r.name.includes('context') && r.name.includes('question') || 
      r.name.includes('scenario')
    ),
    'follow-up logic': results.filter(r => 
      r.name.includes('follow-up') || r.name.includes('Follow-up')
    ),
    'stopping logic': results.filter(r => 
      r.name.includes('stop') || r.name.includes('Stop')
    ),
    'final open question': results.filter(r => 
      r.name.includes('Final') || r.name.includes('open-ended')
    ),
    'frontend flow': results.filter(r => 
      r.name.includes('Frontend') || r.name.includes('session') || 
      r.name.includes('State') || r.name.includes('summary')
    ),
  };

  for (const [category, tests] of Object.entries(categories)) {
    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    const status = passed === total ? 'PASS' : 'FAIL';
    console.log(`${category}: ${status}`);
  }

  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const overallStatus = totalPassed === totalTests ? '✅ PASS' : '❌ FAIL';
  
  console.log(`\nOverall: ${overallStatus}`);
  console.log(`${totalPassed}/${totalTests} tests passed`);
};

const main = async () => {
  console.log('Dynamic Follow-Ups E2E Validation');
  console.log('==================================\n');

  await testContextAwareOpening();
  await testFollowUpLogic();
  await testStoppingLogic();
  await testFinalOpenQuestion();
  await testScenarios();
  await testFrontendFlow();

  printSummary();

  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
};

main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
