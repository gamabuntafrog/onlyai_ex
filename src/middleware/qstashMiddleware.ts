import { createFactory } from "hono/factory";
import { Variables } from "@typings/hono";
import { Receiver } from "@upstash/qstash";
import config from "@config";
import { UnauthorizedError } from "@errors/AppError";
import { ERROR_CODES } from "@constants/errorCodes";
import logger from "@utilities/logger";

const factory = createFactory<{ Variables: Variables }>();

// Initialize QStash receiver for signature verification
const receiver = new Receiver({
  currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
});

/**
 * Middleware to verify QStash webhook signature
 * Must use raw request body for verification
 */
export const verifyQStashSignature = factory.createMiddleware(
  async (c, next) => {
    try {
      // Get raw body for signature verification
      const rawBody = await c.req.raw.clone().text();
      const signature =
        c.req.header("upstash-signature") || c.req.header("Upstash-Signature");

      if (!signature) {
        throw new UnauthorizedError(
          "Missing QStash signature",
          ERROR_CODES.INVALID_TOKEN
        );
      }

      // Verify signature
      const isValid = await receiver.verify({
        body: rawBody,
        signature,
      });

      if (!isValid) {
        throw new UnauthorizedError(
          "Invalid QStash signature",
          ERROR_CODES.INVALID_TOKEN
        );
      }

      // Store raw body in context for later use
      c.set("rawBody", rawBody);

      await next();
    } catch (error) {
      logger.error("QStash signature verification failed", { error });
      throw new UnauthorizedError(
        "QStash signature verification failed",
        ERROR_CODES.INVALID_TOKEN
      );
    }
  }
);
