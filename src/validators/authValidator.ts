import { z } from "zod";

// Schema for user registration
export const registerSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Please provide a valid email address"),
  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(6, "Password must be at least 6 characters long"),
});

// Schema for user login
export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Please provide a valid email address"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  }),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string({
      required_error: "Refresh token is required",
      invalid_type_error: "Refresh token must be a string",
    })
    .min(1, "Refresh token cannot be empty"),
});
