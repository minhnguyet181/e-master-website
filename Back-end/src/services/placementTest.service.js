// src/services/placementTest.service.js
/**
 * Placement Test Service - Xử lý placement test và AI phân loại band
 * 
 * Features:
 * 1. Submit placement test results
 * 2. AI phân loại band dựa trên kết quả
 * 3. Update user.current_band
 * 4. Generate recommendations
 */

const PlacementTest = require('../models/placementTest.model');
const User = require('../models/user.model');
const { callGemini } = require('./ai.service');
const { generateLearningPathFromBands } = require('./learningPath.service');

/**
 * Helper: Parse JSON from AI response
 */
function tryParseJSON(text) {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * AI phân loại band từ placement test results
 * 
 * @param {Object} testResults - Kết quả test
 * @param {Object} testResults.scores - Điểm từng skill {reading, listening, writing, speaking}
 * @param {Array} testResults.answers - Câu trả lời của user
 * @returns {Promise<Object>} - AI assessment với band và recommendations
 */
async function classifyBandWithAI(testResults) {
  try {
    console.log('🤖 AI đang phân loại band từ placement test...');

    const { scores, answers } = testResults;

    // Build prompt cho AI
    const prompt = `You are an IELTS expert examiner. Analyze this placement test result and determine the student's current band level.

TEST RESULTS:
${JSON.stringify(scores, null, 2)}

TASK:
1. Determine overall band score (average of 4 skills, rounded to nearest 0.5)
2. Classify level (Beginner, Elementary, Intermediate, Upper-Intermediate, Advanced)
3. Identify weak and strong skills
4. Provide study recommendations

Return ONLY valid JSON in this exact format:
{
  "assessed_band": "Band 5.5",
  "assessed_level": "Intermediate",
  "overall_score": 5.5,
  "weak_skills": ["writing", "speaking"],
  "strong_skills": ["reading", "listening"],
  "ai_analysis": "2-3 sentences explaining the assessment",
  "study_recommendations": [
    "Focus on Writing Task 2 structure",
    "Practice Speaking Part 2 daily",
    "Build vocabulary for common IELTS topics"
  ],
  "recommended_program": "IELTS Foundation to Band 6.0"
}

IMPORTANT: Be accurate and realistic. Band scores must be in 0.5 increments.`;

    const rawResponse = await callGemini(prompt, 1000);
    const aiResult = tryParseJSON(rawResponse);

    if (!aiResult) {
      throw new Error('Failed to parse AI response');
    }

    console.log('✅ AI đã phân loại band:', aiResult.assessed_band);

    return {
      success: true,
      assessment: aiResult
    };

  } catch (error) {
    console.error('❌ Error classifying band:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Submit placement test và phân loại band
 * 
 * @param {number} userId - ID user
 * @param {Object} testData - Dữ liệu test
 * @param {Object} testData.answers - Câu trả lời
 * @param {Object} testData.scores - Điểm từng skill (nếu đã tính)
 * @returns {Promise<Object>} - Kết quả với band được phân loại
 */
async function submitPlacementTest(userId, testData) {
  try {
    console.log(`📝 User ${userId} đang submit placement test...`);

    const { answers, scores } = testData;

    // Nếu chưa có scores, tính từ answers (giả sử có logic tính điểm)
    let calculatedScores = scores;
    if (!calculatedScores && answers) {
      // TODO: Implement logic tính điểm từ answers
      // Tạm thời giả sử có scores
      calculatedScores = {
        reading: 5.5,
        listening: 6.0,
        writing: 5.0,
        speaking: 5.5
      };
    }

    // AI phân loại band
    const aiAssessment = await classifyBandWithAI({
      scores: calculatedScores,
      answers
    });

    if (!aiAssessment.success) {
      throw new Error(aiAssessment.error);
    }

    const assessment = aiAssessment.assessment;

    // Lưu kết quả vào database
    const placementTest = await PlacementTest.create({
      user_id: userId,
      answers,
      scores: calculatedScores,
      assessed_band: assessment.assessed_band,
      assessed_level: assessment.assessed_level,
      ai_analysis: assessment.ai_analysis,
      weak_skills: assessment.weak_skills,
      strong_skills: assessment.strong_skills,
      recommended_program: assessment.recommended_program,
      study_recommendations: assessment.study_recommendations,
      is_completed: true,
      completed_at: new Date()
    });

    // Update user.current_band
    const user = await User.findByPk(userId);
    if (user) {
      user.current_band = assessment.assessed_band;
      await user.save();
      console.log(`✅ Updated user.current_band to ${assessment.assessed_band}`);
      
      // Tự động generate learning path nếu có target_band
      if (user.band_target) {
        console.log(`🎯 Auto-generating learning path from ${assessment.assessed_band} to ${user.band_target}...`);
        try {
          const pathResult = await generateLearningPathFromBands(userId, { autoGenerate: true });
          if (pathResult.success) {
            console.log(`✅ Learning path generated successfully!`);
          } else {
            console.warn(`⚠️  Learning path generation failed: ${pathResult.error}`);
          }
        } catch (pathError) {
          console.error(`❌ Error auto-generating learning path: ${pathError.message}`);
          // Không throw error, vì placement test đã thành công
        }
      } else {
        console.log(`ℹ️  No target_band set. User can set target_band and generate learning path later.`);
      }
    }

    return {
      success: true,
      placement_test: placementTest,
      message: 'Placement test completed and band assessed!',
      learning_path_generated: user && user.band_target ? true : false
    };

  } catch (error) {
    console.error('❌ Error submitting placement test:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get placement test result của user
 * 
 * @param {number} userId - ID user
 * @returns {Promise<Object>} - Kết quả placement test gần nhất
 */
async function getPlacementResult(userId) {
  try {
    const result = await PlacementTest.findOne({
      where: {
        user_id: userId,
        is_completed: true
      },
      order: [['completed_at', 'DESC']]
    });

    if (!result) {
      return {
        success: false,
        message: 'No placement test found. Please take the placement test first.'
      };
    }

    return {
      success: true,
      result
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  submitPlacementTest,
  getPlacementResult,
  classifyBandWithAI
};

