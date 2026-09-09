// Centralised runtime configuration, sourced from environment variables.
export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  clientOrigin: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : true,
  allowMemoryDb: process.env.ALLOW_MEMORY_DB === 'true',
  isProd: process.env.NODE_ENV === 'production',
  version: '1.0.0',
};
