/**
 * Voice Interview Backend Test Script
 * Tests all voice interview functionality end-to-end
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import {
  transcribeAudio,
  generateSpeech,
  generateVoiceQuestion,
  startVoiceInterviewSession,
  processVoiceResponse,
  recordVoiceAnswer,
  completeVoiceInterviewSession,
} from './src/services/voiceInterviewService';
import { buildInterviewContext } from './src/services/interviewContextService';
import type { InterviewContext } from './src/services/hybridInterviewService';
import fs from 'fs';
import path from 'path';

console.log('🧪 Voice Interview Backend Test Suite\n');
console.log('='.repeat(70));

// Mock interview context
const mockContext: InterviewContext = {
  userId: 'test-user-voice',
  recovery: { sleepHours: 7.5, sleepQuality: 4, score: 'good', status: 'Normal' },
  stress: { level: 'low' },
  workoutAdherence: 85,
  supplementAdherence: 90,
  sexualHealth: { libido: 'normal' },
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: [] as Array<{ name: string; status: 'PASS' | 'FAIL'; message?: string }>,
};

function logTest(name: string, passed: boolean, message?: string) {
  const status = passed ? 'PASS' : 'FAIL';
  testResults.tests.push({ name, status, message });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
    if (message) console.log(`   Error: ${message}`);
  }
}

// Test 1: Text-to-Speech Generation
async function testTTS() {
  console.log('\n📊 Test 1: Text-to-Speech Generation');
  console.log('-'.repeat(70));

  try {
    const testText = "How did you sleep last night?";
    console.log(`Generating speech for: "${testText}"`);
    
    const audioBuffer = await generateSpeech(testText);
    
    const isValidAudio = audioBuffer && audioBuffer.length > 0;
    logTest('TTS generates audio buffer', isValidAudio);
    
    if (isValidAudio) {
      // Save audio file for manual listening
      const outputPath = path.join(__dirname, 'test-output-tts.mp3');
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`   Audio saved to: ${outputPath}`);
      console.log(`   Audio size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
      logTest('TTS audio file saved', true);
    }
  } catch (error) {
    logTest('TTS generates audio buffer', false, (error as Error).message);
  }
}

// Test 2: Speech-to-Text Transcription
async function testSTT() {
  console.log('\n📊 Test 2: Speech-to-Text Transcription');
  console.log('-'.repeat(70));

  try {
    // First, generate a test audio file
    const testText = "I slept about seven and a half hours last night";
    console.log(`Creating test audio: "${testText}"`);
    
    const audioBuffer = await generateSpeech(testText);
    const testAudioPath = path.join(__dirname, 'test-audio-input.mp3');
    fs.writeFileSync(testAudioPath, audioBuffer);
    
    console.log('Transcribing audio...');
    const transcript = await transcribeAudio(testAudioPath);
    
    console.log(`   Original: "${testText}"`);
    console.log(`   Transcribed: "${transcript}"`);
    
    const isAccurate = transcript.toLowerCase().includes('seven') || transcript.toLowerCase().includes('7');
    logTest('STT transcribes audio', transcript.length > 0);
    logTest('STT accuracy (contains key info)', isAccurate, 
      isAccurate ? '' : 'Transcript did not contain expected content');
    
    // Cleanup
    fs.unlinkSync(testAudioPath);
  } catch (error) {
    logTest('STT transcribes audio', false, (error as Error).message);
  }
}

// Test 3: AI Question Generation
async function testAIQuestionGeneration() {
  console.log('\n📊 Test 3: AI Question Generation for Voice');
  console.log('-'.repeat(70));

  try {
    console.log('Generating first question...');
    const question1 = await generateVoiceQuestion(mockContext, []);
    
    console.log(`   Generated: "${question1}"`);
    
    logTest('AI generates question', question1.length > 0);
    logTest('Question is conversational', 
      question1.includes('?') && question1.split(' ').length < 30,
      question1.split(' ').length >= 30 ? 'Question too long for voice' : '');
    
    // Test follow-up question
    console.log('\nGenerating follow-up question...');
    const question2 = await generateVoiceQuestion(mockContext, [
      {
        questionId: 'q1',
        question: 'How did you sleep?',
        answer: 'Not great, only got about 5 hours',
        timestamp: new Date().toISOString(),
        timeElapsed: 10,
      },
    ]);
    
    console.log(`   Generated: "${question2}"`);
    
    const isFollowUp = question2.toLowerCase().includes('sleep') || 
                       question2.toLowerCase().includes('rest') ||
                       question2.toLowerCase().includes('tired');
    logTest('AI generates contextual follow-up', isFollowUp,
      isFollowUp ? '' : 'Follow-up did not relate to poor sleep');
  } catch (error) {
    logTest('AI generates question', false, (error as Error).message);
  }
}

// Test 4: Final Question Guarantee
async function testFinalQuestion() {
  console.log('\n📊 Test 4: Final Question Guarantee');
  console.log('-'.repeat(70));

  try {
    console.log('Generating final question (isFinalQuestion=true)...');
    const finalQuestion = await generateVoiceQuestion(mockContext, [], true);
    
    console.log(`   Generated: "${finalQuestion}"`);
    
    const isFinalQuestionCorrect = finalQuestion === "Do you have anything else to share?";
    logTest('Final question is correct', isFinalQuestionCorrect,
      isFinalQuestionCorrect ? '' : `Expected "Do you have anything else to share?" but got "${finalQuestion}"`);
  } catch (error) {
    logTest('Final question is correct', false, (error as Error).message);
  }
}

// Test 5: Session Management
async function testSessionManagement() {
  console.log('\n📊 Test 5: Session Management');
  console.log('-'.repeat(70));

  try {
    console.log('Starting voice interview session...');
    const { sessionId, firstQuestion, audioBuffer } = await startVoiceInterviewSession(
      'test-user',
      mockContext
    );
    
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   First question: "${firstQuestion}"`);
    console.log(`   Audio buffer size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
    
    logTest('Session created with ID', sessionId.length > 0);
    logTest('First question generated', firstQuestion.length > 0);
    logTest('First question audio generated', audioBuffer.length > 0);
    
    // Test recording answer
    console.log('\nRecording answer...');
    recordVoiceAnswer(sessionId, 'q1', firstQuestion, 'I slept pretty well, about 7 hours');
    logTest('Answer recorded', true);
    
    // Test completing session
    console.log('\nCompleting session...');
    const completedSession = completeVoiceInterviewSession(sessionId);
    
    logTest('Session completed', completedSession.isComplete);
    logTest('Session has conversation history', completedSession.conversationHistory.length > 0);
    logTest('Session has completion timestamp', !!completedSession.completedAt);
  } catch (error) {
    logTest('Session management', false, (error as Error).message);
  }
}

// Test 6: Saturday Sexual Health Logic
async function testSaturdayLogic() {
  console.log('\n📊 Test 6: Saturday Sexual Health Questions');
  console.log('-'.repeat(70));

  try {
    // Mock Saturday
    const originalGetDay = Date.prototype.getDay;
    Date.prototype.getDay = function() { return 6; }; // Saturday
    
    console.log('Testing on Saturday (mocked)...');
    
    // Generate multiple questions to see if sexual health appears
    const questions: string[] = [];
    for (let i = 0; i < 5; i++) {
      const question = await generateVoiceQuestion(mockContext, 
        questions.map((q, idx) => ({
          questionId: `q${idx}`,
          question: q,
          answer: 'Normal',
          timestamp: new Date().toISOString(),
          timeElapsed: idx * 20,
        }))
      );
      questions.push(question);
      console.log(`   Q${i + 1}: "${question}"`);
    }
    
    const hasSexualHealthQuestion = questions.some(q => 
      q.toLowerCase().includes('libido') ||
      q.toLowerCase().includes('sexual') ||
      q.toLowerCase().includes('intimacy') ||
      q.toLowerCase().includes('satisfaction')
    );
    
    logTest('Sexual health question appears on Saturday', hasSexualHealthQuestion,
      hasSexualHealthQuestion ? '' : 'No sexual health questions detected in 5 questions');
    
    // Restore original getDay
    Date.prototype.getDay = originalGetDay;
  } catch (error) {
    logTest('Saturday sexual health logic', false, (error as Error).message);
  }
}

// Test 7: Voice Quality Check
async function testVoiceQuality() {
  console.log('\n📊 Test 7: Voice Quality & Naturalness');
  console.log('-'.repeat(70));

  try {
    const testPhrases = [
      "How did you sleep last night?",
      "That's great to hear! How are your stress levels today?",
      "I understand. What's making it challenging?",
    ];
    
    console.log('Generating audio for multiple phrases...');
    
    for (const phrase of testPhrases) {
      const audioBuffer = await generateSpeech(phrase);
      const sizeKB = (audioBuffer.length / 1024).toFixed(2);
      console.log(`   "${phrase}" → ${sizeKB} KB`);
      
      // Save for manual listening
      const filename = `test-voice-${testPhrases.indexOf(phrase) + 1}.mp3`;
      const outputPath = path.join(__dirname, filename);
      fs.writeFileSync(outputPath, audioBuffer);
    }
    
    logTest('Multiple voice samples generated', true);
    console.log('\n   ℹ️  Listen to test-voice-*.mp3 files to verify naturalness');
  } catch (error) {
    logTest('Voice quality test', false, (error as Error).message);
  }
}

// Test 8: End-to-End Interview Simulation
async function testEndToEndInterview() {
  console.log('\n📊 Test 8: End-to-End Interview Simulation');
  console.log('-'.repeat(70));

  try {
    console.log('Simulating complete interview...\n');
    
    // Start session
    const { sessionId, firstQuestion, audioBuffer } = await startVoiceInterviewSession(
      'test-user-e2e',
      mockContext
    );
    
    console.log(`[00:00] AI: "${firstQuestion}"`);
    
    // Simulate 5 Q&A exchanges
    const mockAnswers = [
      "I slept about 7 hours, pretty good",
      "I feel well recovered, maybe a 4 out of 5",
      "Stress is low today, around a 2",
      "Yes, I completed my full workout",
      "I took all my supplements this morning",
    ];
    
    let questionCount = 1;
    
    for (const answer of mockAnswers) {
      // Create audio for answer
      const answerAudio = await generateSpeech(answer);
      const answerPath = path.join(__dirname, `test-answer-${questionCount}.mp3`);
      fs.writeFileSync(answerPath, answerAudio);
      
      console.log(`[00:${questionCount * 20}] User: "${answer}"`);
      
      // Record answer
      recordVoiceAnswer(sessionId, `q${questionCount}`, firstQuestion, answer);
      
      // Generate next question (or final question if near end)
      const isFinal = questionCount >= 4;
      const nextQuestion = await generateVoiceQuestion(mockContext, [], isFinal);
      
      console.log(`[00:${(questionCount + 1) * 20}] AI: "${nextQuestion}"`);
      
      questionCount++;
      
      // Cleanup
      fs.unlinkSync(answerPath);
      
      if (isFinal && nextQuestion === "Do you have anything else to share?") {
        console.log('\n   ✅ Final question reached!');
        break;
      }
    }
    
    // Complete session
    const completedSession = completeVoiceInterviewSession(sessionId);
    
    console.log(`\n   Interview completed:`);
    console.log(`   - Total questions: ${completedSession.conversationHistory.length}`);
    console.log(`   - Duration: ${completedSession.totalTimeElapsed}s`);
    
    logTest('E2E interview completes', completedSession.isComplete);
    logTest('E2E has conversation history', completedSession.conversationHistory.length >= 3);
  } catch (error) {
    logTest('End-to-end interview', false, (error as Error).message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Voice Interview Backend Tests...\n');
  
  try {
    await testTTS();
    await testSTT();
    await testAIQuestionGeneration();
    await testFinalQuestion();
    await testSessionManagement();
    await testSaturdayLogic();
    await testVoiceQuality();
    await testEndToEndInterview();
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  
  testResults.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
    if (test.message) {
      console.log(`   ${test.message}`);
    }
  });
  
  console.log('\n' + '='.repeat(70));
  console.log(`Total: ${testResults.tests.length} tests`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log('='.repeat(70));
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Voice interview backend is ready!');
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed. Review errors above.`);
  }
  
  console.log('\n📁 Generated test files:');
  console.log('   - test-output-tts.mp3 (sample TTS output)');
  console.log('   - test-voice-1.mp3, test-voice-2.mp3, test-voice-3.mp3 (voice samples)');
  console.log('\n💡 Listen to these files to verify voice quality and naturalness.\n');
}

// Execute tests
runAllTests().catch(console.error);
