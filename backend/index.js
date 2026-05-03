const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const hasFrontendBuild = fs.existsSync(frontendDistPath);

app.use(cors({
  origin(origin, callback) {
    const allowedOrigin = process.env.CORS_ORIGIN;
    const isLocalhost = !origin || /^http:\/\/localhost:\d+$/.test(origin);
    const isLanOrigin = /^http:\/\/(?:127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}):\d+$/.test(origin || '');

    if (!allowedOrigin || origin === allowedOrigin || isLocalhost || isLanOrigin) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    port,
    frontend_built: hasFrontendBuild,
  });
});

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/export', require('./src/routes/export'));

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/') && req.method === 'GET') {
      return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    return next();
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      message: 'Backend is running. Frontend build not found yet.',
      next_step: 'Run "npm run build" in /frontend before starting the production server.',
    });
  });
}

const server = app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});

module.exports = app;

