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
  if (isPrivilegedRole(role) && process.env.ADMIN_BYPASS !== 'false') {
    return true;
  }

  const clientIp = getClientIp(req);
  const allowedIps = getAllowedIps();
  const isLocalDev = ['127.0.0.1', '::1', 'localhost'].includes(clientIp);

  return isLocalDev || allowedIps.includes(clientIp);
};

module.exports = {
  getClientIp,
  getAllowedIps,
  hasNetworkAccess,
  isPrivilegedRole,
  normalizeIp,
};
