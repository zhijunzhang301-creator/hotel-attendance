module.exports = (req, res, next) => {
  // 只有 admin 角色跳过 WiFi 检查，但不跳过打卡功能本身
  const clientIP =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress;

  const allowedIPs = process.env.ALLOWED_IP.split(',');

  // 本地开发时 127.0.0.1 和 ::1 都放行
  const isLocal = clientIP === '127.0.0.1' || clientIP === '::1';
  const isAllowed = allowedIPs.includes(clientIP);
  const isAdmin = req.user?.role === 'admin';

  if (isLocal || isAllowed || isAdmin) return next();

  return res.status(403).json({ error: 'Please connect to the hotel staff WiFi before checking in!' });
};

/*
module.exports = (req, res, next) => {
  const clientIP =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress;

  console.log('收到的IP:', clientIP); // 临时调试用

  const allowedIPs = process.env.ALLOWED_IP.split(',');

  const isLocal = clientIP === '127.0.0.1' || clientIP === '::1';
  const isAllowed = allowedIPs.includes(clientIP);
  const isAdmin = req.user?.role === 'admin';

  if (isLocal || isAllowed || isAdmin) return next();

  return res.status(403).json({ error: '请连接酒店员工WiFi后再打卡' });
};
*/