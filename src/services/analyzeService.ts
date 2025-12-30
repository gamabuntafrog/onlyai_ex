import { v4 as uuidv4 } from "uuid";
import analysisStateStore from "@stores/analysisStateStore";
import qstashClient from "@integrations/qstash/index";
import type { IOpenAIClient } from "@integrations/openai/IOpenAIClient";
import { AnalysisInput, AnalysisState } from "@typings/analyze";
import logger from "@utilities/logger";
import config from "@config";
import { AppError } from "@errors/AppError";

class AnalyzeService {
  constructor(
    private readonly stateStore: analysisStateStore,
    private readonly qstash: typeof qstashClient,
    private readonly openai: IOpenAIClient
  ) {}

  /**
   * Create a new analysis request
   * Saves initial state and publishes delayed job to QStash
   */
  public async createAnalysis(
    userId: string,
    input: AnalysisInput
  ): Promise<{ requestId: string }> {
    const requestId = uuidv4();

    // Create queued state in Redis
    await this.stateStore.createQueued(requestId, userId, input);

    // Build webhook URL
    const baseUrl = process.env.BASE_URL || `http://localhost:${config.PORT}`;
    const webhookUrl = `${baseUrl}/webhooks/qstash/analyze`;

    // Publish delayed job to QStash (60 seconds delay)
    await this.qstash.publishDelayedJob(webhookUrl, { requestId }, 10);

    logger.info("Created analysis request", {
      requestId,
      userId,
    });

    return { requestId };
  }

  /**
   * Get analysis state by request ID
   * Returns user-friendly state without errorDetails, with error message if status is error
   */
  public async getAnalysis(
    requestId: string
  ): Promise<
    (Omit<AnalysisState, "errorDetails"> & { error?: string }) | null
  > {
    const state = await this.stateStore.getState(requestId);

    if (!state) {
      return null;
    }

    // Remove errorDetails before returning to user
    const { errorDetails: _errorDetails, ...userState } = state;

    // Add user-friendly error message if status is error
    if (state.status === "error") {
      return {
        ...userState,
        error:
          "An error occurred while processing your analysis request. Please try again later.",
      };
    }

    return userState;
  }

  /**
   * Process analysis (called by webhook worker)
   * Must be idempotent
   */
  public async processAnalysis(requestId: string): Promise<void> {
    // Acquire lock for idempotency
    const lockAcquired = await this.stateStore.acquireLock(requestId);

    if (!lockAcquired) {
      logger.info("Analysis already being processed (lock exists)", {
        requestId,
      });
      return;
    }

    try {
      // Load current state
      const state = await this.stateStore.getState(requestId);

      if (!state) {
        logger.warn("Analysis state not found", { requestId });
        return;
      }

      // If already done or error, skip processing
      if (state.status === "done" || state.status === "error") {
        logger.info("Analysis already completed", {
          requestId,
          status: state.status,
        });
        return;
      }

      // Mark as processing
      await this.stateStore.markProcessing(requestId);

      logger.info("Starting analysis processing", { requestId });

      // Call OpenAI API
      try {
        const result = await this.openai.generatePersonalitySummary(
          state.input
        );

        // Mark as done with result
        await this.stateStore.markDone(requestId, result);

        logger.info("Analysis completed successfully", {
          requestId,
          summaryLength: result.length,
        });
      } catch (error) {
        // Extract technical details for developers
        let errorDetails: Record<string, unknown> | undefined;

        if (error instanceof AppError) {
          errorDetails = {
            code: error.code,
            statusCode: error.statusCode,
            technicalMessage: error.message,
            ...error.details,
          };
        } else if (error instanceof Error) {
          errorDetails = {
            originalError: error.name,
            technicalMessage: error.message,
            stack: config.NODE_ENV === "development" ? error.stack : undefined,
          };
        } else {
          errorDetails = {
            originalError: String(error),
          };
        }

        // Mark as error (user message will be generated based on status)
        await this.stateStore.markError(requestId, errorDetails);

        logger.error("Analysis failed", {
          requestId,
          ...(errorDetails && { errorDetails }),
        });
      }
    } finally {
      // Release lock
      await this.stateStore.releaseLock(requestId);
    }
  }
}

export default AnalyzeService;
