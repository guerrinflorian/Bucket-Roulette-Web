const buildAllowedOrigins = () => {
  const origins = new Set();

  const addOrigin = (value) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      origins.add(trimmed);
    } else {
      origins.add(`https://${trimmed}`);
    }
  };

  addOrigin(process.env.FRONTEND_URL);
  addOrigin(process.env.VERCEL_URL);
  addOrigin(process.env.CORS_ORIGIN);
  origins.add('http://localhost:5173');
  origins.add('http://localhost:3000');

  return origins;
};

export const getCorsOriginValidator = () => {
  const allowedOrigins = buildAllowedOrigins();

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
};
