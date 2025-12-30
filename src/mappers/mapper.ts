import { Context } from "hono";
import { z } from "zod";
import { ValidationError } from "@errors/AppError";
import { ERROR_CODES } from "@constants/errorCodes";

class Mapper {
  /**
   * Map request data to DTO using Zod schema for validation and sanitization
   * Combines body, params, and query into one object for validation
   * @param c - Hono Context object
   * @param schema - Zod validation schema
   */
  public async toDTO<T = unknown>(
    c: Context,
    schema: z.ZodType<T>
  ): Promise<T> {
    // Get body, params, and query from Hono Context
    const body = await c.req.json().catch(() => ({}));
    const params = c.req.param() || {};
    const query = c.req.query() || {};

    // Combine all request data into one object
    const dataToValidate = {
      ...body,
      ...params,
      ...query,
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

    return result.data;
  }
}

// Export singleton instance
export default new Mapper();
