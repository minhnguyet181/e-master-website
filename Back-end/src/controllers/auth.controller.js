// src/controllers/auth.controller.js
const AuthService = require('../services/auth.service');
const { handleResponse, handleError } = require('./base.controller');

exports.register = async (req, res) => {
  try {
    const user = await AuthService.register(req.body);
    handleResponse(res, user, 'User registered successfully');
  } catch (err) {
    handleError(res, err);
  }
};

exports.login = async (req, res) => {
  try {
    console.log('📋 Login request:', { email: req.body.email, username: req.body.username });
    const { user, token } = await AuthService.login(req.body);
    console.log('✅ Login successful for user:', user.id);
    handleResponse(res, { user, token }, 'Login successful');
  } catch (err) {
    console.error('❌ Login error:', err.message);
    handleError(res, err);
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { user, token } = await AuthService.googleLogin(req.body);
    handleResponse(res, { user, token }, 'Google login successful');
  } catch (err) {
    handleError(res, err);
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Missing token');
    const result = await AuthService.logout(token);
    handleResponse(res, result);
  } catch (err) {
    handleError(res, err);
  }
};
