// src/services/user.service.js
const User = require('../models/user.model');
const AiService = require('./ai.service');

async function getById(id) {
  return User.findByPk(id);
}

async function getProfile(userId) {
  return User.findByPk(userId);
}

async function updateProfile(userId, payload) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const allowed = ['username', 'goal', 'band_target', 'current_band', 'study_hours_per_day', 'reason', 'ai_recommendation'];
  const updates = {};
  allowed.forEach(k => { if (payload[k] !== undefined) updates[k] = payload[k]; });

  await user.update(updates);
  return user.reload();
}

async function submitLearningGoalGenerateAI(userId, input) {
  // input: { learningGoal, currentBand, targetBand, dailyStudyHours, learningPurpose }
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const aiResult = await AiService.generateLearningPlan({
    learningGoal: input.learningGoal || input.goal || user.goal,
    currentBand: input.currentBand || null,
    targetBand: input.targetBand || input.band_target || user.band_target,
    dailyStudyHours: input.dailyStudyHours || input.study_hours_per_day || user.study_hours_per_day,
    learningPurpose: input.learningPurpose || input.reason || user.reason
  });

  // Save stringified JSON for record
  await user.update({ ai_recommendation: typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult) });

  return aiResult;
}

async function saveAIRecommendation(userId, aiPlan) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  
  const recommendation = typeof aiPlan === 'string' ? aiPlan : JSON.stringify(aiPlan);
  
  await user.update({ ai_recommendation: recommendation });
  
  const updatedUser = await user.reload();
  
  console.log(`✅ AI recommendation saved for user ${userId}`);
  
  return updatedUser;
}


function parseBandNumber(bandString) {
  if (!bandString || typeof bandString !== 'string') return null;
  
  // Extract number từ string: "Band 5.0" -> 5.0, "5" -> 5, "Band 6.5" -> 6.5
  const match = bandString.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}


function normalizeBand(bandString) {
  return parseBandNumber(bandString);
}

/**
 * Check xem user band có match với search band không
 * 
 * @param {string} userBand - Band của user (có thể là "Band 5.0", "5", "Band 6.5", etc.)
 * @param {string} searchBand - Band để tìm kiếm
 * @param {Object} options - Options
 * @param {boolean} options.exactMatch - true = match chính xác, false = match trong khoảng ±0.5
 * @returns {boolean} - true nếu match
 */
function matchesBand(userBand, searchBand, options = {}) {
  if (!userBand || !searchBand) return false;
  
  const userBandNum = normalizeBand(userBand);
  const searchBandNum = normalizeBand(searchBand);
  
  if (userBandNum === null || searchBandNum === null) return false;
  
  if (options.exactMatch) {
    // Match chính xác (cho phép sai số 0.1 để xử lý floating point)
    return Math.abs(userBandNum - searchBandNum) < 0.1;
  } else {
    // Match trong khoảng ±0.5
    return Math.abs(userBandNum - searchBandNum) <= 0.5;
  }
}

/**
 * Tìm kiếm users theo band
 * 
 * @param {Object} filters - Filters
 * @param {string} filters.band - Band để tìm (ví dụ: "5", "5.0", "Band 5.0")
 * @param {string} filters.bandType - 'current' hoặc 'target' hoặc 'both' (mặc định: 'both')
 * @param {boolean} filters.exactMatch - true = match chính xác, false = match trong khoảng ±0.5 (mặc định: false)
 * @param {number} limit - Số lượng kết quả tối đa (mặc định: 50)
 * @param {number} offset - Offset cho pagination (mặc định: 0)
 * @returns {Promise<Object>} - Kết quả tìm kiếm
 */
async function searchUsersByBand(filters = {}, limit = 50, offset = 0) {
  try {
    const { band, bandType = 'both', exactMatch = false } = filters;
    
    if (!band) {
      return {
        success: false,
        error: 'Band parameter is required'
      };
    }
    
    // Lấy tất cả users
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'email', 'current_band', 'band_target', 'goal', 'study_hours_per_day'],
      limit: 1000, // Lấy nhiều để filter, có thể tối ưu sau
      offset: 0
    });
    
    // Filter users theo band
    const filteredUsers = allUsers.filter(user => {
      if (bandType === 'current') {
        return user.current_band && matchesBand(user.current_band, band, { exactMatch });
      } else if (bandType === 'target') {
        return user.band_target && matchesBand(user.band_target, band, { exactMatch });
      } else {
        // 'both' - tìm trong cả current_band và band_target
        return (user.current_band && matchesBand(user.current_band, band, { exactMatch })) ||
               (user.band_target && matchesBand(user.band_target, band, { exactMatch }));
      }
    });
    
    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);
    
    // Format results
    const results = paginatedUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      current_band: user.current_band,
      band_target: user.band_target,
      goal: user.goal,
      study_hours_per_day: user.study_hours_per_day
    }));
    
    return {
      success: true,
      users: results,
      total: filteredUsers.length,
      limit,
      offset,
      hasMore: (offset + limit) < filteredUsers.length,
      filters: {
        band,
        bandType,
        exactMatch
      }
    };
    
  } catch (error) {
    console.error('❌ Error searching users by band:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tìm kiếm users trong khoảng band
 * 
 * @param {Object} filters - Filters
 * @param {string} filters.minBand - Band tối thiểu (ví dụ: "5", "5.0")
 * @param {string} filters.maxBand - Band tối đa (ví dụ: "6", "6.5")
 * @param {string} filters.bandType - 'current' hoặc 'target' hoặc 'both' (mặc định: 'both')
 * @param {number} limit - Số lượng kết quả tối đa
 * @param {number} offset - Offset cho pagination
 * @returns {Promise<Object>} - Kết quả tìm kiếm
 */
async function searchUsersByBandRange(filters = {}, limit = 50, offset = 0) {
  try {
    const { minBand, maxBand, bandType = 'both' } = filters;
    
    if (!minBand || !maxBand) {
      return {
        success: false,
        error: 'minBand and maxBand parameters are required'
      };
    }
    
    const minBandNum = normalizeBand(minBand);
    const maxBandNum = normalizeBand(maxBand);
    
    if (minBandNum === null || maxBandNum === null) {
      return {
        success: false,
        error: 'Invalid band format'
      };
    }
    
    if (minBandNum > maxBandNum) {
      return {
        success: false,
        error: 'minBand must be less than or equal to maxBand'
      };
    }
    
    // Lấy tất cả users
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'email', 'current_band', 'band_target', 'goal', 'study_hours_per_day'],
      limit: 1000,
      offset: 0
    });
    
    // Filter users trong khoảng band
    const filteredUsers = allUsers.filter(user => {
      const checkBand = (bandString) => {
        if (!bandString) return false;
        const bandNum = normalizeBand(bandString);
        return bandNum !== null && bandNum >= minBandNum && bandNum <= maxBandNum;
      };
      
      if (bandType === 'current') {
        return checkBand(user.current_band);
      } else if (bandType === 'target') {
        return checkBand(user.band_target);
      } else {
        return checkBand(user.current_band) || checkBand(user.band_target);
      }
    });
    
    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);
    
    // Format results
    const results = paginatedUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      current_band: user.current_band,
      band_target: user.band_target,
      goal: user.goal,
      study_hours_per_day: user.study_hours_per_day
    }));
    
    return {
      success: true,
      users: results,
      total: filteredUsers.length,
      limit,
      offset,
      hasMore: (offset + limit) < filteredUsers.length,
      filters: {
        minBand,
        maxBand,
        bandType
      }
    };
    
  } catch (error) {
    console.error('❌ Error searching users by band range:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getById,
  getProfile,
  updateProfile,
  submitLearningGoalGenerateAI,
  saveAIRecommendation,
  searchUsersByBand,
  searchUsersByBandRange,
  parseBandNumber,
  normalizeBand,
  matchesBand
};
