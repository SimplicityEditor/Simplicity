import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function initializeRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    await redisClient.connect();
    logger.info('Redis connected');
  } catch (error) {
    logger.warn('Redis not available. Caching disabled.', error);
    redisClient = null;
  }
}

export async function cacheGet(key: string): Promise<any> {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: any,
  ttl?: number
): Promise<void> {
  if (!redisClient) return;

  try {
    if (ttl) {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } else {
      await redisClient.set(key, JSON.stringify(value));
    }
  } catch (error) {
    logger.error('Cache set error:', error);
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redisClient) return;

  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
}

export async function cacheFlush(): Promise<void> {
  if (!redisClient) return;

  try {
    await redisClient.flushDb();
  } catch (error) {
    logger.error('Cache flush error:', error);
  }
}

export function getRedisClient() {
  return redisClient;
}
