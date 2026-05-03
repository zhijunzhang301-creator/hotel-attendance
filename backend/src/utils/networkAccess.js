const normalizeIp = (ip = '') => ip.replace(/^::ffff:/, '').trim();
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for']?.split(',')[0];
  return normalizeIp(forwarded || req.socket.remoteAddress || '');
};
const getAllowedIps = () => (
  process.env.ALLOWED_IP || ''
)
  .split(',')
  .map(normalizeIp)
  .filter(Boolean);
const isPrivilegedRole = (role) => ['admin', 'manager'].includes(role);
const hasNetworkAccess = (req, role) => {
  return true;
};
module.exports = {
  getClientIp,
  getAllowedIps,
  hasNetworkAccess,
  isPrivilegedRole,
  normalizeIp,
};
