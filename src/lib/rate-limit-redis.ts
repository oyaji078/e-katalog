// Drop-in replacement when REDIS_URL is set.
// Uses ioredis + sliding window algorithm.
// Install: npm install ioredis
// Wire up in middleware: replace memoryStore with redisStore when process.env.REDIS_URL exists.

export {};
