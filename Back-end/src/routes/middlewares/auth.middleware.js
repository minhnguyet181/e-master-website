// src/routes/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const AuthService = require('../../services/auth.service');

module.exports = async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied: No token provided' });

    // Check blacklist
    const blacklisted = await AuthService.isBlacklisted(token);
    if (blacklisted) return res.status(401).json({ message: 'Token is revoked' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ JWT verification failed:', err.message);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};