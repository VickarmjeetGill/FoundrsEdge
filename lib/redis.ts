import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  redisDisabled: boolean | undefined;
};

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisInstance: Redis;

if (globalForRedis.redis) {
  redisInstance = globalForRedis.redis;
} else {
  redisInstance = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true, // Only connect when a command is executed
    retryStrategy(times) {
      // Reconnect after 30 seconds, up to 3 times, then stop retrying to prevent spam
      if (times > 3) {
        return null;
      }
      return 30000;
    },
  });

  redisInstance.on('error', (err) => {
    // Silence connection errors to keep the development terminal completely clean
    globalForRedis.redisDisabled = true;
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redisInstance;
  }
}

// Use a Proxy wrapper to intercept command invocations if Redis is disabled.
// This prevents ioredis from triggering new connection attempts when a query is run.
const PASSTHROUGH_PROPS = new Set(['on', 'once', 'off', 'addListener', 'removeListener', 'emit', 'quit', 'disconnect']);

const redisProxy = new Proxy(redisInstance, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);

    if (globalForRedis.redisDisabled && typeof value === 'function' && !PASSTHROUGH_PROPS.has(prop as string)) {
      return () => Promise.reject(new Error('Redis is disabled due to connection failure'));
    }

    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  }
});

export const redis = redisProxy as unknown as Redis;

export async function invalidateCache() {
  if (globalForRedis.redisDisabled) {
    return;
  }
  try {
    // Delete the dashboard aggregate key
    await redis.del('dashboard:overview');

    // Scan and delete all feed:page:* keys
    let cursor = '0';
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'feed:page:*', 'COUNT', 100);
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    console.error('Failed to invalidate Redis cache:', error);
  }
}
