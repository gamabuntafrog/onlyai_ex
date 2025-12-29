export interface ErrorDetails {
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;
  public readonly timestamp: Date;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    isOperational = true,
    details?: ErrorDetails
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON format
   */
  public toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...(this.details && { details: this.details }),
    };
  }
}

// Specific error classes
export class BadRequestError extends AppError {
  constructor(message: string, code = "BAD_REQUEST", details?: ErrorDetails) {
    super(400, code, message, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code = "UNAUTHORIZED", details?: ErrorDetails) {
    super(401, code, message, true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code = "FORBIDDEN", details?: ErrorDetails) {
    super(403, code, message, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = "NOT_FOUND", details?: ErrorDetails) {
    super(404, code, message, true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT", details?: ErrorDetails) {
    super(409, code, message, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    code = "VALIDATION_ERROR",
    details?: ErrorDetails
  ) {
    super(422, code, message, true, details);
  }
}

export class InternalServerError extends AppError {
  constructor(
    message: string = "Internal server error",
    code = "INTERNAL_SERVER_ERROR",
    details?: ErrorDetails
  ) {
    super(500, code, message, false, details);
  }
}
