const { hasNetworkAccess } = require('../utils/networkAccess');

module.exports = (req, res, next) => {
  if (hasNetworkAccess(req, req.user?.role)) return next();
  return res.status(403).json({ error: 'Please connect to the hotel staff network before using attendance features.' });
};
