const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://cinelog-two.vercel.app',
  ...(process.env.CLIENT_ORIGIN || '').split(','),
].map(origin => origin.trim().replace(/\/+$/, '')).filter(Boolean);

module.exports = {
  origin: [...new Set(allowedOrigins)],
  credentials: true,
  optionsSuccessStatus: 200,
};
