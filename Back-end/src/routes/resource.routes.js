// src/routes/resource.routes.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resource.controller');
const authMiddleware = require('./middlewares/auth.middleware');

router.get('/resources', authMiddleware, resourceController.getResourcesForUser);

router.get('/resources/by-band', resourceController.getResourcesByBand);

router.get('/resources/search', resourceController.searchResources);

router.get('/resources/:id', resourceController.getResourceById);

module.exports = router;

