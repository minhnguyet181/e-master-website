// src/routes/events.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('./middlewares/auth.middleware');
const EventsController = require('../controllers/events.controller');

router.get('/events', authenticate, EventsController.connect);

module.exports = router;

