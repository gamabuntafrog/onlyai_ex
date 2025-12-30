import { Redis } from "@upstash/redis";
import config from "@config";
import { IRedisAdapter } from "./IRedisAdapter";
import logger from "@utilities/logger";

/**
 * Redis adapter implementation wrapping Upstash Redis SDK
 * Implements IRedisAdapter interface (adapter pattern)
 */
class RedisAdapter implements IRedisAdapter {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      url: config.REDIS_URL,
      token: config.REDIS_TOKEN,
    });
  }

  /**
   * Get a value from Redis
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get<T>(key);

      return data ?? null;
    } catch (error) {
      logger.error("Redis GET operation failed", { key, error });

      throw error;
    }
  }

  /**
   * Set a value in Redis with optional expiration
   */
  public async set<T>(
    key: string,
    value: T,
    options?: { ex?: number }
  ): Promise<void> {
    try {
      if (options?.ex !== undefined) {
        await this.redis.set(key, value, { ex: options.ex });
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      logger.error("Redis SET operation failed", { key, error });
      throw error;
    }
  }

  /**
   * Set a value in Redis only if key does not exist (NX), with optional expiration
   * Returns true if key was set, false if key already exists
   */
  public async setNx(
    key: string,
    value: string,
    options?: { ex?: number }
  ): Promise<boolean> {
    try {
      let result: string | null;
      if (options?.ex !== undefined) {
        result = await this.redis.set(key, value, { ex: options.ex, nx: true });
      } else {
        result = await this.redis.set(key, value, { nx: true });
      }

      return result === "OK";
    } catch (error) {
      logger.error("Redis SETNX operation failed", { key, error });
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   */
  public async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error("Redis DEL operation failed", { key, error });

      throw error;
    }
  }

  /**
   * Get the remaining TTL of a key
   */
  public async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error("Redis TTL operation failed", { key, error });

      throw error;
    }
  }
}

export default RedisAdapter;
