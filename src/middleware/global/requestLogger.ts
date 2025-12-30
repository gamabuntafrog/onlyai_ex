import { createFactory } from "hono/factory";
import logger from "@utilities/logger";

const factory = createFactory();

/**
 * Request logging middleware using pino logger
 * Logs all requests with method, URL, status code, and duration using structured logging
 */
export const requestLogger = factory.createMiddleware(async (c, next) => {
  const startTime = Date.now();
  const method = c.req.method;
  const url = c.req.url;

  await next();

  const duration = Date.now() - startTime;
  const statusCode = c.res.status;

  const logData = {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  };

  if (statusCode >= 500) {
    logger.error(logData, `${method} ${url} ${statusCode}`);
  } else if (statusCode >= 400) {
    logger.warn(logData, `${method} ${url} ${statusCode}`);
  } else {
    logger.info(logData, `${method} ${url} ${statusCode}`);
  }
});
