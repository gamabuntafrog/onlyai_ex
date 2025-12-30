import { z } from "zod";

// Schema for POST /analyze request body
export const analyzeRequestSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .min(1, "Name cannot be empty"),
  age: z
    .number({
      required_error: "Age is required",
      invalid_type_error: "Age must be a number",
    })
    .int("Age must be an integer")
    .positive("Age must be positive"),
  description: z
    .string({
      required_error: "Description is required",
      invalid_type_error: "Description must be a string",
    })
    .min(1, "Description cannot be empty"),
});

// Schema for GET /analyze/:requestId params
export const getAnalysisSchema = z.object({
  requestId: z
    .string({
      required_error: "Request ID is required",
      invalid_type_error: "Request ID must be a string",
    })
    .uuid("Request ID must be a valid UUID"),
});

// Schema for QStash webhook payload
export const qstashWebhookSchema = z.object({
  requestId: z
    .string({
      required_error: "Request ID is required",
      invalid_type_error: "Request ID must be a string",
    })
    .uuid("Request ID must be a valid UUID"),
});
