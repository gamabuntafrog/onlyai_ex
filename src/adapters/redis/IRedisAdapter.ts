/**
 * Redis adapter interface (port)
 * Defines the contract for Redis operations
 */
export interface IRedisAdapter {
  /**
   * Get a value from Redis
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in Redis with optional expiration
   * @param key - Redis key
   * @param value - Value to store
   * @param options - Options including expiration in seconds
   */
  set<T>(key: string, value: T, options?: { ex?: number }): Promise<void>;

  /**
   * Set a value in Redis only if key does not exist (NX), with optional expiration
   * @param key - Redis key
   * @param value - Value to store
   * @param options - Options including expiration in seconds
   * @returns true if key was set, false if key already exists
   */
  setNx(
    key: string,
    value: string,
    options?: { ex?: number }
  ): Promise<boolean>;

  /**
   * Delete a key from Redis
   */
  del(key: string): Promise<void>;

  /**
   * Get the remaining TTL of a key
   * @returns TTL in seconds, -1 if key exists but has no expiry, -2 if key doesn't exist
   */
  ttl(key: string): Promise<number>;
}
