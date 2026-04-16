// src/services/resource.service.js
/**
 * Resource Service - Quản lý tài liệu học tập với band filtering
 * 
 * Features:
 * 1. Filter resources theo band level (current hoặc target)
 * 2. Get resources phù hợp với user's band
 * 3. Recommend resources dựa trên user profile
 */

const Resource = require('../models/resource.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');
const { profileOperation } = require('../utils/queryProfiler');

/**
 * Parse band string thành số để so sánh
 * Ví dụ: "Band 5.0" -> 5.0, "Band 6.5" -> 6.5
 */
function parseBandNumber(bandString) {
  if (!bandString) return null;
  const match = bandString.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Check xem resource có phù hợp với band không
 * 
 * @param {string} resourceLevel - Level của resource (ví dụ: "Band 5-6", "Band 6-7", "Intermediate")
 * @param {string} userBand - Band của user (ví dụ: "Band 5.0", "Band 6.5")
 * @returns {boolean} - true nếu phù hợp
 */
function isResourceSuitableForBand(resourceLevel, userBand) {
  if (!resourceLevel || !userBand) return true; // Nếu không có level, hiển thị tất cả

  const userBandNum = parseBandNumber(userBand);
  if (!userBandNum) return true;

  // Parse resource level
  // Format có thể là: "Band 5-6", "Band 5.0-6.0", "Band 5", "Intermediate"
  const levelLower = resourceLevel.toLowerCase();

  // Check nếu là range (ví dụ: "Band 5-6")
  const rangeMatch = levelLower.match(/band\s*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
  if (rangeMatch) {
    const minBand = parseFloat(rangeMatch[1]);
    const maxBand = parseFloat(rangeMatch[2]);
    return userBandNum >= minBand && userBandNum <= maxBand;
  }

  // Check nếu là single band (ví dụ: "Band 5")
  const singleMatch = levelLower.match(/band\s*(\d+\.?\d*)/);
  if (singleMatch) {
    const resourceBand = parseFloat(singleMatch[1]);
    // Phù hợp nếu user band trong khoảng ±0.5 của resource band
    return Math.abs(userBandNum - resourceBand) <= 0.5;
  }

  // Check level names
  if (levelLower.includes('beginner') || levelLower.includes('elementary')) {
    return userBandNum <= 4.5;
  }
  if (levelLower.includes('intermediate')) {
    return userBandNum >= 4.5 && userBandNum <= 6.5;
  }
  if (levelLower.includes('upper-intermediate') || levelLower.includes('advanced')) {
    return userBandNum >= 6.0;
  }

  // Nếu không match, return true (hiển thị tất cả)
  return true;
}

/**
 * Get resources filtered by band
 * 
 * @param {Object} filters - Filters
 * @param {string} filters.band - Band để filter (current_band hoặc band_target)
 * @param {string} filters.skill - Skill filter (optional)
 * @param {string} filters.type - Resource type filter (optional)
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 * @returns {Promise<Object>} - Filtered resources
 */
function sanitizeSort(sortBy = 'featured') {
  const sortMap = {
    featured: [['is_featured', 'DESC'], ['view_count', 'DESC'], ['created_at', 'DESC']],
    newest: [['created_at', 'DESC']],
    oldest: [['created_at', 'ASC']],
    popular: [['view_count', 'DESC'], ['created_at', 'DESC']],
    rating: [['average_rating', 'DESC'], ['view_count', 'DESC']],
  };
  return sortMap[sortBy] || sortMap.featured;
}

async function getResourcesByBand(filters = {}, pagination = {}) {
  try {
    const { band, skill, type, examType, topic } = filters;
    const page = Math.max(parseInt(pagination.page || 1, 10), 1);
    const limit = Math.min(Math.max(parseInt(pagination.limit || 20, 10), 1), 100);
    const offset = (page - 1) * limit;
    const order = sanitizeSort(pagination.sortBy);

    const whereClause = {
      is_active: true
    };

    // Skill filter
    if (skill) {
      whereClause.skill = skill;
    }

    // Type filter
    if (type) {
      whereClause.resource_type = type;
    }

    if (examType) whereClause.exam_type = examType;
    if (topic) whereClause.topic = topic;

    if (!band) {
      const result = await profileOperation(
        'resource.findAndCountAll',
        () => Resource.findAndCountAll({
          where: whereClause,
          order,
          limit,
          offset,
        }),
        { page, limit, sort: pagination.sortBy || 'featured', hasBandFilter: false }
      );

      return {
        success: true,
        resources: result.rows,
        total: result.count,
        page,
        limit,
        hasMore: page * limit < result.count,
        filter_applied: {
          band: 'all',
          skill: skill || 'all',
          type: type || 'all',
          examType: examType || 'all',
          topic: topic || 'all',
          sort: pagination.sortBy || 'featured',
        }
      };
    }

    // Band filter currently relies on application logic. Keep memory bounded by scanning in chunks.
    const chunkSize = 200;
    let scanOffset = 0;
    let matchedTotal = 0;
    const pagedRows = [];
    let hasMoreRows = true;

    while (hasMoreRows) {
      const chunk = await profileOperation(
        'resource.findAll.bandChunk',
        () => Resource.findAll({
          where: whereClause,
          order,
          limit: chunkSize,
          offset: scanOffset,
        }),
        { scanOffset, chunkSize, band }
      );

      if (!chunk.length) break;
      scanOffset += chunk.length;
      hasMoreRows = chunk.length === chunkSize;

      for (const resource of chunk) {
        if (!isResourceSuitableForBand(resource.level, band)) continue;
        matchedTotal += 1;

        if (matchedTotal > offset && pagedRows.length < limit) {
          pagedRows.push(resource);
        }
      }
    }

    return {
      success: true,
      resources: pagedRows,
      total: matchedTotal,
      page,
      limit,
      hasMore: page * limit < matchedTotal,
      filter_applied: {
        band: band || 'all',
        skill: skill || 'all',
        type: type || 'all',
        examType: examType || 'all',
        topic: topic || 'all',
        sort: pagination.sortBy || 'featured',
      }
    };

  } catch (error) {
    console.error('❌ Error getting resources by band:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get resources phù hợp với user (dựa trên current_band hoặc band_target)
 * 
 * @param {number} userId - ID user
 * @param {Object} options - Options
 * @param {boolean} options.useTargetBand - true = dùng band_target, false = dùng current_band
 * @param {string} options.skill - Skill filter
 * @param {number} limit - Limit
 * @returns {Promise<Object>} - Resources
 */
async function getResourcesForUser(userId, options = {}, pagination = {}) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Determine which band to use
    let bandToUse = null;
    if (options.useTargetBand && user.band_target) {
      bandToUse = user.band_target;
    } else if (user.current_band) {
      bandToUse = user.current_band;
    } else if (user.band_target) {
      // Fallback to target band nếu không có current_band
      bandToUse = user.band_target;
    }

    console.log(`📚 Getting resources for user ${userId}, band: ${bandToUse || 'all'}`);

    return await getResourcesByBand(
      {
        band: bandToUse,
        skill: options.skill,
        type: options.type,
        examType: options.examType,
        topic: options.topic,
      },
      {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
      }
    );

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get resource by ID
 */
async function getResourceById(resourceId, incrementView = true) {
  try {
    const resource = await Resource.findByPk(resourceId);

    if (!resource) {
      throw new Error('Resource not found');
    }

    if (incrementView && resource.is_active) {
      resource.view_count += 1;
      await resource.save();
    }

    return {
      success: true,
      resource
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Search resources với band filtering
 */
async function searchResources(query, filters = {}, pagination = {}) {
  try {
    const { band, skill, type, examType, topic } = filters;
    const page = Math.max(parseInt(pagination.page || 1, 10), 1);
    const limit = Math.min(Math.max(parseInt(pagination.limit || 20, 10), 1), 100);
    const offset = (page - 1) * limit;
    const order = sanitizeSort(pagination.sortBy);

    const whereClause = {
      is_active: true,
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { content: { [Op.like]: `%${query}%` } }
      ]
    };

    if (skill) whereClause.skill = skill;
    if (type) whereClause.resource_type = type;
    if (examType) whereClause.exam_type = examType;
    if (topic) whereClause.topic = topic;

    const result = await profileOperation(
      'resource.search.findAndCountAll',
      () => Resource.findAndCountAll({
        where: whereClause,
        order,
        limit: band ? 500 : limit,
        offset: band ? 0 : offset,
      }),
      { queryLength: query.length, page, limit, band: !!band }
    );

    let rows = result.rows;
    let total = result.count;
    if (band) {
      const bandFiltered = rows.filter((r) => isResourceSuitableForBand(r.level, band));
      total = bandFiltered.length;
      rows = bandFiltered.slice(offset, offset + limit);
    }

    return {
      success: true,
      resources: rows,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getResourcesByBand,
  getResourcesForUser,
  getResourceById,
  searchResources,
  isResourceSuitableForBand
};

