// Admin-only middleware — must be used AFTER auth.middleware
module.exports = function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
  next();
};
