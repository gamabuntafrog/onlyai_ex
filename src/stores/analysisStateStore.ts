import type { IRedisAdapter } from "@adapters/redis/IRedisAdapter";
import { AnalysisState, AnalysisInput } from "@typings/analyze";
import logger from "@utilities/logger";

/**
 * Domain-oriented store for analysis state in Redis
 * Encapsulates Redis key naming, TTL handling, and JSON serialization
 * Depends on IRedisAdapter interface (port), not on concrete Redis implementation
 */
class AnalysisStateStore {
  private readonly stateKeyPrefix = "analysis";
  private readonly lockKeyPrefix = "analysis:lock";
  private readonly stateTtl = 3600; // 1 hour in seconds
  private readonly lockTtl = 120; // 2 minutes in seconds

  constructor(private readonly redis: IRedisAdapter) {}

  /**
   * Create a new queued analysis state
   */
  public async createQueued(
    requestId: string,
    userId: string,
    input: AnalysisInput
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      const state: AnalysisState = {
        requestId,
        userId,
        status: "queued",
        input,
        createdAt: now,
        updatedAt: now,
      };

      const key = this._buildStateKey(requestId);
      await this.redis.set(key, state, { ex: this.stateTtl });

      logger.debug("Created queued analysis state", { requestId });
    } catch (error) {
      logger.error("Failed to create queued analysis state", {
        requestId,
        error,
      });

      throw error;
    }
  }

  /**
   * Mark analysis as processing
   */
  public async markProcessing(requestId: string): Promise<void> {
    try {
      await this._updateStateStatus(requestId, "processing");

      logger.debug("Marked analysis as processing", { requestId });
    } catch (error) {
      logger.error("Failed to mark analysis as processing", {
        requestId,
        error,
      });

      throw error;
    }
  }

  /**
   * Mark analysis as done with result
   */
  public async markDone(requestId: string, result: string): Promise<void> {
    try {
      const state = await this.getState(requestId);
      if (!state) {
        throw new Error(`Analysis state not found: ${requestId}`);
      }

      const updatedState: AnalysisState = {
        ...state,
        status: "done",
        result,
        updatedAt: new Date().toISOString(),
      };

      await this._saveStateWithRemainingTtl(requestId, updatedState);
      logger.debug("Marked analysis as done", { requestId });
    } catch (error) {
      logger.error("Failed to mark analysis as done", {
        requestId,
        error,
      });

      throw error;
    }
  }

  /**
   * Mark analysis as error
   * Only stores technical errorDetails, user message is generated based on status
   */
  public async markError(
    requestId: string,
    errorDetails?: Record<string, unknown>
  ): Promise<void> {
    try {
      const state = await this.getState(requestId);

      if (!state) {
        throw new Error(`Analysis state not found: ${requestId}`);
      }

      const updatedState: AnalysisState = {
        ...state,
        status: "error",
        errorDetails,
        updatedAt: new Date().toISOString(),
      };

      await this._saveStateWithRemainingTtl(requestId, updatedState);

      logger.debug("Marked analysis as error", {
        requestId,
        hasErrorDetails: !!errorDetails,
      });
    } catch (error) {
      logger.error("Failed to mark analysis as error", {
        requestId,
        error,
      });

      throw error;
    }
  }

  /**
   * Get analysis state by request ID
   */
  public async getState(requestId: string): Promise<AnalysisState | null> {
    try {
      const key = this._buildStateKey(requestId);
      const data = await this.redis.get<AnalysisState>(key);

      if (!data) {
        return null;
      }

      return data;
    } catch (error) {
      logger.error("Failed to get analysis state", {
        requestId,
        error,
      });

      throw error;
    }
  }

  /**
   * Acquire a lock for processing (idempotency)
   * Returns true if lock was acquired, false if already locked
   */
  public async acquireLock(requestId: string): Promise<boolean> {
    try {
      const lockKey = this._buildLockKey(requestId);
      const acquired = await this.redis.setNx(lockKey, "locked", {
        ex: this.lockTtl,
      });

      if (acquired) {
        logger.debug("Acquired lock for analysis", { requestId });
      } else {
        logger.debug("Lock already exists for analysis", { requestId });
      }

      return acquired;
    } catch (error) {
      logger.error("Failed to acquire lock", {
        requestId,
        error,
      });

      throw error;
    }
  }

  /**
   * Release a lock (internal method)
   */
  public async releaseLock(requestId: string): Promise<void> {
    try {
      const lockKey = this._buildLockKey(requestId);

      await this.redis.del(lockKey);

      logger.debug("Released lock for analysis", { requestId });
    } catch (error) {
      logger.error("Failed to release lock", {
        requestId,
        error,
      });
      // Don't throw - lock will expire naturally
    }
  }

  /**
   * Build Redis key for analysis state
   */
  private _buildStateKey(requestId: string): string {
    return `${this.stateKeyPrefix}:${requestId}`;
  }

  /**
   * Build Redis key for lock
   */
  private _buildLockKey(requestId: string): string {
    return `${this.lockKeyPrefix}:${requestId}`;
  }

  /**
   * Update state status (internal helper)
   */
  private async _updateStateStatus(
    requestId: string,
    status: AnalysisState["status"]
  ): Promise<void> {
    const state = await this.getState(requestId);
    if (!state) {
      throw new Error(`Analysis state not found: ${requestId}`);
    }

    const updatedState: AnalysisState = {
      ...state,
      status,
      updatedAt: new Date().toISOString(),
    };

    await this._saveStateWithRemainingTtl(requestId, updatedState);
  }

  /**
   * Save state with remaining TTL preserved
   */
  private async _saveStateWithRemainingTtl(
    requestId: string,
    state: AnalysisState
  ): Promise<void> {
    const key = this._buildStateKey(requestId);
    const ttl = await this.redis.ttl(key);

    // If TTL is -1 (no expiry) or -2 (key doesn't exist), use default
    const remainingTtl = ttl > 0 ? ttl : this.stateTtl;

    await this.redis.set(key, state, { ex: remainingTtl });
  }
}

export default AnalysisStateStore;
