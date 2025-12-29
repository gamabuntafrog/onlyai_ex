import { Request, Response, NextFunction } from "express";
import logger from "@utilities/logger";

/**
 * Request logging middleware using pino logger
 * Logs all requests with method, URL, status code, and duration using structured logging
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const { method, originalUrl } = req;

  // Capture response finish event
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const logData = {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
    };

    if (statusCode >= 500) {
      logger.error(logData, `${method} ${originalUrl} ${statusCode}`);
    } else if (statusCode >= 400) {
      logger.warn(logData, `${method} ${originalUrl} ${statusCode}`);
    } else {
      logger.info(logData, `${method} ${originalUrl} ${statusCode}`);
    }
  });

  next();
}
