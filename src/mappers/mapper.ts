import { Request } from "express";
import { z } from "zod";
import { ValidationError } from "@errors/AppError";
import { ERROR_CODES } from "@constants/errorCodes";

class Mapper {
  /**
   * Map request data to DTO using Zod schema for validation and sanitization
   * Combines body, params, and query into one object for validation
   * @param req - Express request object
   * @param schema - Zod validation schema
   */
  public toDTO<T = unknown>(req: Request, schema: z.ZodType<T>): T {
    // Combine all request data into one object
    const dataToValidate = {
      ...req.body,
      ...req.params,
      ...req.query,
    };

    // Use safeParse to handle errors gracefully
    const result = schema.safeParse(dataToValidate, {
      errorMap: (issue, ctx) => {
        // Return custom error messages
        return { message: ctx.defaultError };
      },
    });

    if (!result.success) {
      // Get message from first error issue
      const firstErrorMessage =
        result.error.errors[0]?.message || "Validation failed";

      throw new ValidationError(
        firstErrorMessage,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const value = result.data;

    // Update request object with normalized values
    // Separate back into body, params, and query based on what was in original request
    const normalizedBody: Record<string, unknown> = {};
    const normalizedParams: Record<string, unknown> = {};
    const normalizedQuery: Record<string, unknown> = {};

    // Check original keys to determine where to put normalized values
    const valueAsRecord = value as Record<string, unknown>;
    Object.keys(valueAsRecord).forEach(function (key) {
      const keyValue = valueAsRecord[key];
      if (key in req.params) {
        normalizedParams[key] = keyValue;
      } else if (key in req.query) {
        normalizedQuery[key] = keyValue;
      } else {
        normalizedBody[key] = keyValue;
      }
    });

    // Update request object
    Object.assign(req.body, normalizedBody);
    Object.assign(req.params, normalizedParams);
    Object.assign(req.query, normalizedQuery);

    return value;
  }
}

// Export singleton instance
export default new Mapper();
