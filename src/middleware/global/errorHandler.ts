import { Context } from "hono";
import { AppError } from "@errors/AppError";
import config from "@config";
import logger from "@utilities/logger";
import { ERROR_CODES } from "@constants/errorCodes";

export function errorHandler(err: Error, c: Context): Response {
  // Prepare error context for logging
  const errorContext = {
    error: {
      name: err.name,
      message: err.message,
      code: err instanceof AppError ? err.code : undefined,
      statusCode: err instanceof AppError ? err.statusCode : 500,
      stack: config.isDevelopment() ? err.stack : undefined,
    },
    request: {
      url: c.req.url,
      method: c.req.method,
      ip: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent") || "unknown",
    },
  };

  // Log error based on type and severity
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(errorContext, `AppError [${err.code}]: ${err.message}`);
    } else if (err.statusCode >= 400) {
      logger.warn(errorContext, `AppError [${err.code}]: ${err.message}`);
    } else {
      logger.info(errorContext, `AppError [${err.code}]: ${err.message}`);
    }
  } else {
    logger.error(errorContext, "Unexpected error occurred");
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    const errorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
      ...(config.isDevelopment() && {
        meta: {
          timestamp: err.timestamp.toISOString(),
          path: c.req.url,
          method: c.req.method,
        },
      }),
    };

    return c.json(errorResponse, err.statusCode);
  }

  // Handle unexpected errors
  const errorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred",
    },
    ...(config.isDevelopment() && {
      meta: {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        path: c.req.url,
        method: c.req.method,
      },
    }),
  };

  return c.json(errorResponse, 500);
}
