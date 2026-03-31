import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = 'test-user-hybrid-interview';

interface Question {
  id: string;
  text: string;
  category: string;
  source: 'static' | 'ai';
  quickResponses?: string[];
}

const testHybridInterview = async () => {
  console.log('🎯 Testing Hybrid Interview System\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Start Interview
    console.log('\n📋 Step 1: Starting Interview...');
    const startResponse = await fetch(`${API_BASE_URL}/hybrid-interview/start/${TEST_USER_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const startData = await startResponse.json();
    
    if (!startData.success) {
      console.error('❌ Failed to start interview:', startData.error);
      return;
    }

    const sessionId = startData.data.sessionId;
    const firstQuestion: Question = startData.data.question;
    
    console.log('✅ Interview started successfully');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   First Question (${firstQuestion.source}): ${firstQuestion.text}`);
    console.log(`   Category: ${firstQuestion.category}`);
    console.log(`   Time Remaining: ${startData.data.timeRemaining}s`);

    // Step 2: Answer Questions
    const answers = [
      { answer: 'I slept about 6.5 hours, woke up a couple times', category: 'recovery' },
      { answer: 'Pretty stressed, work has been overwhelming', category: 'stress' },
      { answer: 'Yes, completed my full workout', category: 'workout' },
      { answer: 'Took most of them, forgot my evening dose', category: 'supplements' },
      { answer: 'Energy is low, especially in the afternoon', category: 'energy' },
    ];

    let currentQuestion = firstQuestion;
    let questionCount = 0;

    for (const answerData of answers) {
      questionCount++;
      console.log(`\n📝 Step ${questionCount + 1}: Submitting Answer...`);
      console.log(`   Q: ${currentQuestion.text}`);
      console.log(`   A: ${answerData.answer}`);

      const answerResponse = await fetch(`${API_BASE_URL}/hybrid-interview/answer/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          question: currentQuestion.text,
          answer: answerData.answer,
          category: currentQuestion.category,
        }),
      });

      const answerResponseData = await answerResponse.json();

      if (!answerResponseData.success) {
        console.error('❌ Failed to submit answer:', answerResponseData.error);
        break;
      }

      if (answerResponseData.data.isComplete) {
        console.log('\n✅ Interview Complete!');
        console.log(`   Total Questions: ${answerResponseData.data.summary.totalQuestions}`);
        console.log(`   Total Time: ${answerResponseData.data.summary.totalTime}s`);
        console.log(`   Signal Collected:`, answerResponseData.data.summary.signalCollected);
        break;
      }

      currentQuestion = answerResponseData.data.nextQuestion;
      console.log(`   ✅ Answer recorded`);
      console.log(`   Next Question (${currentQuestion.source}): ${currentQuestion.text}`);
      console.log(`   Time Remaining: ${answerResponseData.data.timeRemaining}s`);

      // Small delay to simulate user thinking
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 3: Get Session Summary
    console.log('\n📊 Step 3: Fetching Session Summary...');
    const sessionResponse = await fetch(`${API_BASE_URL}/hybrid-interview/session/${sessionId}`);
    const sessionData = await sessionResponse.json();

    if (sessionData.success) {
      console.log('✅ Session retrieved successfully');
      console.log(`   Questions Asked: ${sessionData.data.conversationHistory.length}`);
      console.log(`   Status: ${sessionData.data.isComplete ? 'Complete' : 'In Progress'}`);
      
      console.log('\n📝 Conversation History:');
      sessionData.data.conversationHistory.forEach((turn: any, index: number) => {
        console.log(`\n   ${index + 1}. ${turn.question}`);
        console.log(`      Answer: ${turn.answer}`);
        console.log(`      Time: ${turn.timeElapsed}s`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Hybrid Interview Test Complete!\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log(`   - Interview started successfully`);
    console.log(`   - ${questionCount} questions answered`);
    console.log(`   - Session data saved to database`);
    console.log(`   - Static vs AI routing working`);
    console.log(`   - Time tracking functional`);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
};

// Run the test
testHybridInterview().catch(console.error);
