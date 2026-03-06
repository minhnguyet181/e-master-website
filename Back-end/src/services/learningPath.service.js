// src/services/learningPath.service.js
/**
 * Learning Path Service - Tự động tạo lộ trình học tập từ current_band đến target_band
 * 
 * Features:
 * 1. Generate learning path với milestones (ví dụ: 3.0 -> 4.0 -> 5.0 -> 6.5)
 * 2. Assign resources phù hợp cho từng milestone
 * 3. Tạo activities và bài học cho từng giai đoạn
 */

const User = require('../models/user.model');
const Resource = require('../models/resource.model');
const { generateLearningPlan } = require('./ai.service');
const { Op } = require('sequelize');

/**
 * Parse band string thành số
 */
function parseBand(bandString) {
  if (!bandString) return null;
  const match = bandString.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Generate milestones từ current_band đến target_band
 * Ví dụ: 3.0 -> 6.5 sẽ tạo: [3.0, 4.0, 5.0, 5.5, 6.0, 6.5]
 * 
 * @param {string} currentBand - Band hiện tại (ví dụ: "Band 3.0")
 * @param {string} targetBand - Band mục tiêu (ví dụ: "Band 6.5")
 * @returns {Array} - Array of milestone bands
 */
function generateMilestones(currentBand, targetBand) {
  const current = parseBand(currentBand);
  const target = parseBand(targetBand);
  
  if (!current || !target || current >= target) {
    return [];
  }
  
  const milestones = [];
  let currentMilestone = current;
  
  // Tạo milestones với bước nhảy 0.5 hoặc 1.0
  while (currentMilestone < target) {
    milestones.push(currentMilestone);
    
    // Nếu gap lớn (>2.0), nhảy 1.0, nếu không nhảy 0.5
    const gap = target - currentMilestone;
    if (gap > 2.0) {
      currentMilestone += 1.0;
    } else {
      currentMilestone += 0.5;
    }
  }
  
  // Đảm bảo có target band ở cuối
  if (milestones[milestones.length - 1] !== target) {
    milestones.push(target);
  }
  
  return milestones;
}

/**
 * Get resources phù hợp cho một band cụ thể
 * 
 * @param {number} bandNumber - Band number (ví dụ: 5.0)
 * @param {string} skill - Skill filter (optional)
 * @param {number} limit - Số lượng resources
 * @returns {Promise<Array>} - Resources phù hợp
 */
async function getResourcesForBand(bandNumber, skill = null, limit = 10) {
  try {
    const allResources = await Resource.findAll({
      where: {
        is_active: true,
        ...(skill && { skill })
      },
      order: [['is_featured', 'DESC'], ['view_count', 'DESC']]
    });
  
    // Filter resources phù hợp với band
    const suitableResources = allResources.filter(resource => {
      if (!resource.level) return false;
      
      const levelLower = resource.level.toLowerCase();
      
      // Check range (ví dụ: "Band 5-6")
      const rangeMatch = levelLower.match(/band\s*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
      if (rangeMatch) {
        const minBand = parseFloat(rangeMatch[1]);
        const maxBand = parseFloat(rangeMatch[2]);
        return bandNumber >= minBand && bandNumber <= maxBand;
      }
      
      // Check single band (ví dụ: "Band 5")
      const singleMatch = levelLower.match(/band\s*(\d+\.?\d*)/);
      if (singleMatch) {
        const resourceBand = parseFloat(singleMatch[1]);
        return Math.abs(bandNumber - resourceBand) <= 0.5;
      }
      
      // Check level names
      if (levelLower.includes('beginner') || levelLower.includes('elementary')) {
        return bandNumber <= 4.5;
      }
      if (levelLower.includes('intermediate')) {
        return bandNumber >= 4.5 && bandNumber <= 6.5;
      }
      if (levelLower.includes('upper-intermediate') || levelLower.includes('advanced')) {
        return bandNumber >= 6.0;
      }
      
      return false;
    });
  
    return suitableResources.slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting resources for band:', error.message);
    return [];
  }
}

/**
 * Generate learning path với resources từ current_band đến target_band
 * 
 * @param {number} userId - User ID
 * @param {Object} options - Options
 * @param {boolean} options.autoGenerate - Tự động generate sau placement test
 * @returns {Promise<Object>} - Learning path với milestones và resources
 */
async function generateLearningPathFromBands(userId, options = {}) {
  try {
    console.log(`🎯 Generating learning path for user ${userId}...`);
    
    // Get user profile
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBand = user.current_band;
    const targetBand = user.band_target || 'Band 7.0';
    
    if (!currentBand) {
      return {
        success: false,
        error: 'User has not completed placement test. Please complete placement test first.'
      };
    }
    
    const currentBandNum = parseBand(currentBand);
    const targetBandNum = parseBand(targetBand);
    
    if (!currentBandNum || !targetBandNum) {
      return {
        success: false,
        error: 'Invalid band format'
      };
    }
    
    if (currentBandNum >= targetBandNum) {
      return {
        success: false,
        error: 'Current band must be less than target band'
      };
    }
    
    console.log(`📊 Current band: ${currentBand}, Target band: ${targetBand}`);
    
    // Generate milestones
    const milestones = generateMilestones(currentBand, targetBand);
    console.log(`🎯 Generated ${milestones.length} milestones:`, milestones);
    
    // Generate AI learning plan
    console.log('🤖 Generating AI learning plan...');
    const aiPlan = await generateLearningPlan({
      learningGoal: user.goal || 'Improve IELTS score',
      currentBand: currentBand,
      targetBand: targetBand,
      dailyStudyHours: user.study_hours_per_day || 2,
      learningPurpose: user.reason || 'General improvement'
    });
    
    // Ensure aiPlan is an object
    const planObject = typeof aiPlan === 'string' ? JSON.parse(aiPlan) : aiPlan;
    
    // Generate resources for each milestone
    console.log('📚 Generating resources for each milestone...');
    const milestonesWithResources = await Promise.all(
      milestones.map(async (milestone, index) => {
        const milestoneBand = `Band ${milestone.toFixed(1)}`;
        
        // Get resources for this milestone
        const resources = await getResourcesForBand(milestone, null, 5);
        
        // Determine focus skills based on milestone
        // Early milestones: focus on basics
        // Later milestones: focus on advanced skills
        let focusSkills = ['reading', 'listening', 'writing', 'speaking'];
        if (milestone >= 6.0) {
          focusSkills = ['writing', 'speaking', 'reading', 'listening']; // Advanced focus
        } else if (milestone >= 5.0) {
          focusSkills = ['writing', 'speaking', 'reading', 'listening']; // Balanced
        } else {
          focusSkills = ['reading', 'listening', 'vocabulary', 'grammar']; // Foundation
        }
        
        return {
          milestone_number: index + 1,
          band: milestoneBand,
          band_number: milestone,
          focus_skills: focusSkills,
          resources: resources.map(r => ({
            id: r.id,
            title: r.title,
            resource_type: r.resource_type,
            skill: r.skill,
            level: r.level,
            summary: r.summary
          })),
          estimated_weeks: milestone === milestones[0] 
            ? 4 // First milestone: 4 weeks
            : milestone === milestones[milestones.length - 1]
            ? 6 // Last milestone: 6 weeks
            : 5 // Middle milestones: 5 weeks
        };
      })
    );
    
    // Calculate total duration
    const totalWeeks = milestonesWithResources.reduce((sum, m) => sum + m.estimated_weeks, 0);
    
    // Create learning path structure
    const learningPath = {
      user_id: userId,
      current_band: currentBand,
      target_band: targetBand,
      band_gap: targetBandNum - currentBandNum,
      total_milestones: milestones.length,
      estimated_duration_weeks: totalWeeks,
      estimated_duration_months: Math.ceil(totalWeeks / 4),
      milestones: milestonesWithResources,
      ai_plan: planObject,
      generated_at: new Date()
    };
    
    // Save to user's ai_recommendation
    user.ai_recommendation = JSON.stringify(learningPath);
    await user.save();
    
    console.log(`✅ Learning path generated successfully!`);
    console.log(`   - ${milestones.length} milestones`);
    console.log(`   - ${totalWeeks} weeks estimated`);
    console.log(`   - ${milestonesWithResources.reduce((sum, m) => sum + m.resources.length, 0)} total resources`);
    
    return {
      success: true,
      learning_path: learningPath,
      message: `Learning path generated from ${currentBand} to ${targetBand}`
    };
    
  } catch (error) {
    console.error('❌ Error generating learning path:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get learning path của user
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Learning path
 */
async function getLearningPath(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.ai_recommendation) {
      return {
        success: false,
        message: 'No learning path found. Please generate learning path first.'
      };
    }
    
    const learningPath = typeof user.ai_recommendation === 'string' 
      ? JSON.parse(user.ai_recommendation)
      : user.ai_recommendation;
    
    return {
      success: true,
      learning_path: learningPath
    };
    
  } catch (error) {
    console.error('❌ Error getting learning path:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateLearningPathFromBands,
  getLearningPath,
  generateMilestones,
  getResourcesForBand
};

