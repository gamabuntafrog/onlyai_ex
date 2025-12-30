import OpenAI from "openai";
import config from "@config";
import { IOpenAIClient } from "./IOpenAIClient";
import { AnalysisInput } from "@typings/analyze";
import logger from "@utilities/logger";
import {
  AppError,
  InternalServerError,
  BadRequestError,
  UnauthorizedError,
} from "@errors/AppError";
import { ERROR_CODES } from "@constants/errorCodes";

/**
 * Helper function to convert OpenAI errors to AppError instances
 */
function handleOpenAIError(
  error: unknown,
  context: { operation: string; input?: unknown }
): AppError {
  // Check if it's an OpenAI APIError
  if (error instanceof OpenAI.APIError) {
    const status = error.status;
    const errorMessage = error.message || "OpenAI API error occurred";
    const errorDetails: Record<string, unknown> = {
      operation: context.operation,
      statusCode: status,
      type: error.type,
      code: error.code,
      param: error.param,
    };

    if (context.input) {
      errorDetails.input = context.input;
    }

    // Handle specific error types
    if (error instanceof OpenAI.RateLimitError) {
      const rateLimitDetails: Record<string, unknown> = { ...errorDetails };
      if (error.headers) {
        const retryAfter = error.headers.get("retry-after");
        if (retryAfter) {
          rateLimitDetails.retryAfter = retryAfter;
        }
      }

      return new InternalServerError(
        "OpenAI API rate limit exceeded. Please try again later.",
        ERROR_CODES.OPENAI_RATE_LIMIT,
        rateLimitDetails
      );
    }

    if (error instanceof OpenAI.APIConnectionError) {
      return new InternalServerError(
        "Failed to connect to OpenAI API.",
        ERROR_CODES.OPENAI_CONNECTION_ERROR,
        errorDetails
      );
    }

    if (error instanceof OpenAI.APIConnectionTimeoutError) {
      return new InternalServerError(
        "OpenAI API request timed out. Please try again.",
        ERROR_CODES.OPENAI_TIMEOUT_ERROR,
        errorDetails
      );
    }

    if (error instanceof OpenAI.AuthenticationError) {
      return new UnauthorizedError(
        "OpenAI API authentication failed. Please check your API key.",
        ERROR_CODES.OPENAI_AUTHENTICATION_ERROR,
        errorDetails
      );
    }

    if (error instanceof OpenAI.BadRequestError) {
      return new BadRequestError(
        `Invalid request to OpenAI API: ${errorMessage}`,
        ERROR_CODES.OPENAI_API_ERROR,
        errorDetails
      );
    }

    // Generic API error
    return new InternalServerError(
      `OpenAI API error: ${errorMessage}`,
      ERROR_CODES.OPENAI_API_ERROR,
      errorDetails
    );
  }

  // Handle non-OpenAI errors
  if (error instanceof Error) {
    const errorDetails: Record<string, unknown> = {
      operation: context.operation,
      originalError: error.name,
    };

    if (context.input) {
      errorDetails.input = context.input;
    }

    return new InternalServerError(
      `Unexpected error during ${context.operation}: ${error.message}`,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      errorDetails
    );
  }

  // Unknown error type
  const unknownErrorDetails: Record<string, unknown> = {
    operation: context.operation,
  };

  if (context.input) {
    unknownErrorDetails.input = context.input;
  }

  return new InternalServerError(
    `Unknown error occurred during ${context.operation}`,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    unknownErrorDetails
  );
}

/**
 * Helper function to validate OpenAI response
 */
function validateResponse(response: unknown): string {
  if (!response || typeof response !== "object") {
    throw new InternalServerError(
      "Invalid response format from OpenAI API",
      ERROR_CODES.OPENAI_INVALID_RESPONSE,
      { response }
    );
  }

  const responseObj = response as { output_text?: unknown };

  if (!responseObj.output_text || typeof responseObj.output_text !== "string") {
    throw new InternalServerError(
      "OpenAI API returned invalid or empty response",
      ERROR_CODES.OPENAI_INVALID_RESPONSE,
      { response: responseObj }
    );
  }

  const summary = responseObj.output_text.trim();

  if (summary.length === 0) {
    throw new InternalServerError(
      "OpenAI API returned empty summary",
      ERROR_CODES.OPENAI_INVALID_RESPONSE,
      { response: responseObj }
    );
  }

  return summary;
}

/**
 * Helper function to retry an operation with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error instanceof OpenAI.APIError &&
        (error instanceof OpenAI.AuthenticationError ||
          error instanceof OpenAI.BadRequestError ||
          error instanceof OpenAI.PermissionDeniedError ||
          error instanceof OpenAI.NotFoundError)
      ) {
        throw error;
      }

      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      logger.warn(
        `OpenAI API call failed, retrying in ${delayMs}ms (attempt ${
          attempt + 1
        }/${maxRetries})`,
        { error, attempt: attempt + 1 }
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * OpenAI client implementation wrapping OpenAI SDK
 * Encapsulates OpenAI library and provides domain-specific methods
 */
class OpenAIClient implements IOpenAIClient {
  private readonly client: OpenAI;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
      timeout: 30000, // 30 seconds timeout
    });
    this.maxRetries = 3;
    this.retryBaseDelayMs = 1000;
  }

  /**
   * Generate a short personality summary based on user input
   */
  public async generatePersonalitySummary(
    input: AnalysisInput
  ): Promise<string> {
    const operation = "generatePersonalitySummary";

    try {
      const prompt = `Based on the following information, generate a short personality summary (2-3 sentences):

      Name: ${input.name}
      Age: ${input.age}
      Description: ${input.description}
      
      Instructions:
      - If the provided information is sufficient, create a personality summary based on the given details.
      - If the information is insufficient, incomplete, or too vague, generate a creative and randomized personality summary that is interesting and believable.
      - The summary should always be 2-3 sentences long, regardless of whether it's based on provided information or randomized.
      - Make the randomized summary diverse and varied each time, incorporating different personality traits, interests, and characteristics.
      
      Provide a concise, insightful personality summary:`;

      logger.debug("Calling OpenAI API for personality summary", {
        operation,
        inputName: input.name,
        inputAge: input.age,
      });

      // Execute with retry logic for transient errors
      const response = await retryWithBackoff(
        async () => {
          return await this.client.responses.create({
            model: "gpt-5-mini",
            max_output_tokens: 1000,
            input: prompt,
          });
        },
        this.maxRetries,
        this.retryBaseDelayMs
      );

      // Validate response structure
      const summary = validateResponse(response);

      logger.info("Successfully generated personality summary", {
        operation,
        summaryLength: summary.length,
        inputName: input.name,
      });

      return summary;
    } catch (error) {
      // Convert OpenAI errors to AppError instances
      const appError =
        error instanceof AppError
          ? error
          : handleOpenAIError(error, { operation, input });

      logger.error("Failed to generate personality summary from OpenAI", {
        error: {
          name: appError.name,
          code: appError.code,
          message: appError.message,
          statusCode: appError.statusCode,
          details: appError.details,
        },
        operation,
        input: {
          name: input.name,
          age: input.age,
          descriptionLength: input.description?.length,
        },
      });

      throw appError;
    }
  }
}

export default OpenAIClient;
