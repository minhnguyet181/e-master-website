/**
 * Test file for AI Services
 * 
 * This file tests all AI services with detailed logging:
 * - generateLearningPlan
 * - gradeWriting
 * - gradeSpeaking
 * - chatAssistant
 * 
 * Usage: node test-ai-services.js
 */

require('dotenv').config();
const AIService = require('./src/services/ai.service');
const UserService = require('./src/services/user.service');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logData(label, data) {
  console.log(`\n${colors.yellow}${label}:${colors.reset}`);
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Test 1: Generate Learning Plan
 */
async function testGenerateLearningPlan() {
  logSection('TEST 1: Generate Learning Plan');

  try {
    const userData = {
      learningGoal: 'Improve IELTS Writing and Speaking to Band 7.0',
      currentBand: 'Band 5.5',
      targetBand: 'Band 7.0',
      dailyStudyHours: 2,
      learningPurpose: 'Study abroad'
    };

    logInfo('Input Data:');
    logData('User Data', userData);

    logInfo('Calling AI Service...');
    const startTime = Date.now();
    
    const result = await AIService.generateLearningPlan(userData);
    
    const duration = Date.now() - startTime;
    logSuccess(`AI Service completed in ${duration}ms`);

    logInfo('Output Data:');
    logData('AI Result', result);

    // Validate result structure
    if (typeof result === 'object' && result !== null) {
      logSuccess('Result is a valid object');
      
      if (result.summary) logSuccess(`✓ Summary: ${result.summary.substring(0, 100)}...`);
      if (result.duration_weeks) logSuccess(`✓ Duration: ${result.duration_weeks} weeks`);
      if (result.weekly_plan && Array.isArray(result.weekly_plan)) {
        logSuccess(`✓ Weekly Plan: ${result.weekly_plan.length} weeks`);
      }
      if (result.recommended_materials && Array.isArray(result.recommended_materials)) {
        logSuccess(`✓ Recommended Materials: ${result.recommended_materials.length} items`);
      }
    } else {
      logError('Result is not a valid object');
      logData('Raw Result', result);
    }

    // Test saving to database (if user exists)
    logInfo('\nTesting database save...');
    try {
      // Try to get first user from database
      const User = require('./src/models/user.model');
      const testUser = await User.findOne();
      
      if (testUser) {
        logInfo(`Found test user: ID ${testUser.id}`);
        await UserService.saveAIRecommendation(testUser.id, result);
        logSuccess('Successfully saved to database');
        
        // Verify save
        const updatedUser = await User.findByPk(testUser.id);
        if (updatedUser.ai_recommendation) {
          logSuccess('Verified: AI recommendation saved in database');
          const savedPlan = JSON.parse(updatedUser.ai_recommendation);
          logData('Saved Plan (first 200 chars)', JSON.stringify(savedPlan).substring(0, 200));
        }
      } else {
        logInfo('No test user found in database. Skipping database save test.');
      }
    } catch (dbError) {
      logError(`Database save test failed: ${dbError.message}`);
      logInfo('This is OK if database is not configured');
    }

    return { success: true, result, duration };

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Grade Writing
 */
async function testGradeWriting() {
  logSection('TEST 2: Grade Writing');

  try {
    const sampleEssay = `Some people believe that technology has made our lives more complicated, while others argue that it has simplified our daily routines. In my opinion, technology has both positive and negative impacts on our lives.

On one hand, technology has undoubtedly made many tasks easier and more efficient. For example, smartphones allow us to communicate instantly with people around the world, and the internet provides us with access to vast amounts of information. Additionally, automation in various industries has reduced the need for manual labor, making production faster and more cost-effective.

On the other hand, technology can also create complications. The constant connectivity can lead to information overload and stress. Moreover, people may become overly dependent on technology, losing important skills like face-to-face communication or basic problem-solving abilities.

In conclusion, while technology offers many benefits, it is important to use it wisely and maintain a balance between digital and real-world interactions.`;

    logInfo('Input Essay:');
    console.log(`"${sampleEssay.substring(0, 200)}..."`);

    logInfo('Calling AI Service...');
    const startTime = Date.now();
    
    const result = await AIService.gradeWriting(sampleEssay);
    
    const duration = Date.now() - startTime;
    logSuccess(`AI Service completed in ${duration}ms`);

    logInfo('Output Data:');
    logData('Grading Result', result);

    // Validate result structure
    if (typeof result === 'object' && result !== null) {
      logSuccess('Result is a valid object');
      
      if (typeof result.task_response === 'number') {
        logSuccess(`✓ Task Response: ${result.task_response}`);
      }
      if (typeof result.coherence_cohesion === 'number') {
        logSuccess(`✓ Coherence & Cohesion: ${result.coherence_cohesion}`);
      }
      if (typeof result.lexical_resource === 'number') {
        logSuccess(`✓ Lexical Resource: ${result.lexical_resource}`);
      }
      if (typeof result.grammar === 'number') {
        logSuccess(`✓ Grammar: ${result.grammar}`);
      }
      if (typeof result.overall === 'number') {
        logSuccess(`✓ Overall Score: ${result.overall}`);
      }
      if (result.feedback) {
        logSuccess(`✓ Feedback: ${result.feedback.substring(0, 100)}...`);
      }
      if (result.suggestions && Array.isArray(result.suggestions)) {
        logSuccess(`✓ Suggestions: ${result.suggestions.length} items`);
        result.suggestions.forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion}`);
        });
      }
    } else {
      logError('Result is not a valid object');
      logData('Raw Result', result);
    }

    return { success: true, result, duration };

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Grade Speaking
 */
async function testGradeSpeaking() {
  logSection('TEST 3: Grade Speaking');

  try {
    const sampleTranscript = `Well, I think social media has both positive and negative effects on young people. On the positive side, it helps them stay connected with friends and family, especially those who live far away. They can share photos, videos, and updates about their lives easily. Also, social media can be a great source of information and learning opportunities.

However, there are also some negative aspects. For example, spending too much time on social media can lead to addiction and affect their studies. Moreover, young people might compare themselves to others and feel insecure about their own lives. There's also the risk of cyberbullying and privacy issues.

Overall, I believe that social media itself is not bad, but it depends on how young people use it. Parents and teachers should guide them to use it responsibly and in moderation.`;

    logInfo('Input Transcript:');
    console.log(`"${sampleTranscript.substring(0, 200)}..."`);

    logInfo('Calling AI Service...');
    const startTime = Date.now();
    
    const result = await AIService.gradeSpeaking(sampleTranscript);
    
    const duration = Date.now() - startTime;
    logSuccess(`AI Service completed in ${duration}ms`);

    logInfo('Output Data:');
    logData('Grading Result', result);

    // Validate result structure
    if (typeof result === 'object' && result !== null) {
      logSuccess('Result is a valid object');
      
      if (typeof result.fluency_and_coherence === 'number') {
        logSuccess(`✓ Fluency & Coherence: ${result.fluency_and_coherence}`);
      }
      if (typeof result.pronunciation === 'number') {
        logSuccess(`✓ Pronunciation: ${result.pronunciation}`);
      }
      if (typeof result.lexical_resource === 'number') {
        logSuccess(`✓ Lexical Resource: ${result.lexical_resource}`);
      }
      if (typeof result.grammar === 'number') {
        logSuccess(`✓ Grammar: ${result.grammar}`);
      }
      if (typeof result.overall === 'number') {
        logSuccess(`✓ Overall Score: ${result.overall}`);
      }
      if (result.feedback) {
        logSuccess(`✓ Feedback: ${result.feedback.substring(0, 100)}...`);
      }
      if (result.suggestions && Array.isArray(result.suggestions)) {
        logSuccess(`✓ Suggestions: ${result.suggestions.length} items`);
        result.suggestions.forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion}`);
        });
      }
    } else {
      logError('Result is not a valid object');
      logData('Raw Result', result);
    }

    return { success: true, result, duration };

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Chat Assistant
 */
async function testChatAssistant() {
  logSection('TEST 4: Chat Assistant');

  try {
    const testMessages = [
      'How can I improve my IELTS Writing score?',
      'What is the difference between IELTS and TOEIC?',
      'Can you explain the present perfect tense?'
    ];

    const results = [];

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      
      logInfo(`\nTest Message ${i + 1}: "${message}"`);
      
      const startTime = Date.now();
      const result = await AIService.chatAssistant(message);
      const duration = Date.now() - startTime;
      
      logSuccess(`Response received in ${duration}ms`);
      logInfo('Response:');
      console.log(`"${result}"`);
      
      results.push({
        message,
        response: result,
        duration,
        length: result.length
      });

      // Small delay between requests
      if (i < testMessages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logInfo('\nSummary:');
    results.forEach((r, index) => {
      console.log(`  ${index + 1}. Message: "${r.message.substring(0, 50)}..."`);
      console.log(`     Response Length: ${r.length} characters`);
      console.log(`     Duration: ${r.duration}ms`);
    });

    return { success: true, results };

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    AI SERVICES TEST SUITE                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Check environment
  logInfo('Checking environment configuration...');
  
  if (!process.env.GEMINI_API_KEY && !process.env.HF_TOKEN) {
    logError('No AI provider configured!');
    console.log(`\n${colors.yellow}Please set one of the following in your .env file:${colors.reset}`);
    console.log(`  ${colors.cyan}GEMINI_API_KEY=your_gemini_api_key_here${colors.reset}`);
    console.log(`  ${colors.cyan}HF_TOKEN=your_huggingface_token_here${colors.reset}`);
    console.log(`\n${colors.yellow}To get Gemini API key:${colors.reset}`);
    console.log(`  1. Go to https://makersuite.google.com/app/apikey`);
    console.log(`  2. Create a new API key`);
    console.log(`  3. Add it to your .env file: GEMINI_API_KEY=your_key_here`);
    console.log(`\n${colors.yellow}Note:${colors.reset} Make sure your .env file is in the e-master directory`);
    process.exit(1);
  }

  if (process.env.GEMINI_API_KEY) {
    const keyPreview = process.env.GEMINI_API_KEY.substring(0, 10) + '...';
    logSuccess(`Using Google Gemini AI (Key: ${keyPreview})`);
  } else if (process.env.HF_TOKEN) {
    const tokenPreview = process.env.HF_TOKEN.substring(0, 10) + '...';
    logInfo(`Using HuggingFace API (Token: ${tokenPreview})`);
  }

  const results = {
    generateLearningPlan: null,
    gradeWriting: null,
    gradeSpeaking: null,
    chatAssistant: null
  };

  // Run tests
  try {
    results.generateLearningPlan = await testGenerateLearningPlan();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between tests

    results.gradeWriting = await testGradeWriting();
    await new Promise(resolve => setTimeout(resolve, 2000));

    results.gradeSpeaking = await testGradeSpeaking();
    await new Promise(resolve => setTimeout(resolve, 2000));

    results.chatAssistant = await testChatAssistant();

  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
  }

  // Summary
  logSection('TEST SUMMARY');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r && r.success).length;
  const failedTests = totalTests - passedTests;

  console.log(`\n${colors.bright}Total Tests: ${totalTests}${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

  Object.entries(results).forEach(([testName, result]) => {
    if (result && result.success) {
      logSuccess(`${testName}: PASSED`);
      if (result.duration) {
        console.log(`  Duration: ${result.duration}ms`);
      }
    } else {
      logError(`${testName}: FAILED`);
      if (result && result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
  });

  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testGenerateLearningPlan,
  testGradeWriting,
  testGradeSpeaking,
  testChatAssistant,
  runAllTests
};

