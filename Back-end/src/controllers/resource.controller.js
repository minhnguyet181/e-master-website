// src/controllers/resource.controller.js
const ResourceService = require('../services/resource.service');
const { handleResponse, handleError } = require('./base.controller');

exports.getResourcesForUser = async (req, res) => {
  try {
    const { use_target_band = 'false', skill, type, limit = 20, offset = 0 } = req.query;

    const result = await ResourceService.getResourcesForUser(req.user.id, {
      useTargetBand: use_target_band === 'true',
      skill,
      type,
      offset: parseInt(offset),
    }, parseInt(limit));

    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getResourcesByBand = async (req, res) => {
  try {
    const { band, skill, type, limit = 20, offset = 0 } = req.query;

    const result = await ResourceService.getResourcesByBand(
      { band, skill, type },
      parseInt(limit),
      parseInt(offset)
    );

    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getResourceById = async (req, res) => {
  try {
    const result = await ResourceService.getResourceById(parseInt(req.params.id));
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
};

exports.searchResources = async (req, res) => {
  try {
    const { q, band, skill, type, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Search query (q) is required' });

    const result = await ResourceService.searchResources(q, { band, skill, type }, parseInt(limit));
    return res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
};
