// src/controllers/resource.controller.js
/**
 * Resource Controller - Quản lý tài liệu học tập với band filtering
 */

const ResourceService = require('../services/resource.service');
const { handleResponse, handleError } = require('./base.controller');
const jwt = require('jsonwebtoken');

/**
 * Get resources for current user (filtered by current_band hoặc band_target)
 * GET /e-master/resources?use_target_band=true&skill=writing&limit=20
 */
exports.getResourcesForUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const {
      use_target_band = 'false',
      skill,
      type,
      limit = 20,
      offset = 0
    } = req.query;

    const result = await ResourceService.getResourcesForUser(userId, {
      useTargetBand: use_target_band === 'true',
      skill,
      type,
      offset: parseInt(offset)
    }, parseInt(limit));

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in getResourcesForUser:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get resources filtered by specific band
 * GET /e-master/resources/by-band?band=Band 5.0&skill=writing&limit=20
 */
exports.getResourcesByBand = async (req, res) => {
  try {
    const {
      band,
      skill,
      type,
      limit = 20,
      offset = 0
    } = req.query;

    const result = await ResourceService.getResourcesByBand(
      { band, skill, type },
      parseInt(limit),
      parseInt(offset)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in getResourcesByBand:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get resource by ID
 * GET /e-master/resources/:id
 */
exports.getResourceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await ResourceService.getResourceById(parseInt(id));

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Search resources
 * GET /e-master/resources/search?q=writing&band=Band 5.0&skill=writing
 */
exports.searchResources = async (req, res) => {
  try {
    const { q, band, skill, type, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const result = await ResourceService.searchResources(q, {
      band,
      skill,
      type
    }, parseInt(limit));

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

