import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './config.js';
import { createApp } from './app.js';
import { createRepo } from './repo.js';

async function start() {
  let useMemory = false;

  if (config.mongoUri) {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');
  } else if (config.allowMemoryDb && !config.isProd) {
    useMemory = true;
    console.warn('MONGODB_URI not set — using ephemeral in-memory demo database.');
  } else {
    console.error('MONGODB_URI is required (or set ALLOW_MEMORY_DB=true for local demos).');
    process.exit(1);
  }

  const repo = createRepo({ useMemory });
  const app = createApp(repo);

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`RupeeWise API listening on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
