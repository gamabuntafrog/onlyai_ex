import { Next } from "hono";
import { AuthContext } from "@typings/hono";
import { UnauthorizedError } from "@errors/AppError";
import authHelper from "@helpers/authHelper";
import { ERROR_CODES } from "@constants/errorCodes";

export async function authenticate(
  c: AuthContext,
  next: Next
): Promise<Response> {
  // Get token from header
  const authHeader = c.req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError(
      "No token provided or invalid format",
      ERROR_CODES.NO_TOKEN
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify token
  try {
    const decoded = authHelper.verifyAccessToken(token);

    // Set user info in context variables
    c.set("user", {
      id: decoded.userId,
      email: "", // Will be fetched from DB if needed
    });

    await next();

    return c.res;
  } catch (jwtError: unknown) {
    if (jwtError instanceof Error && jwtError.name === "JsonWebTokenError") {
      throw new UnauthorizedError("Invalid token", ERROR_CODES.INVALID_TOKEN);
    }

    if (jwtError instanceof Error && jwtError.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token expired", ERROR_CODES.TOKEN_EXPIRED);
    }

    throw jwtError;
  }
}
