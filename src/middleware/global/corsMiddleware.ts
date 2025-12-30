import { cors } from "hono/cors";
import config from "@config";

const allowedOrigins = new Set(config.FRONTEND_ORIGINS);

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) {
      return "*";
    }
    return allowedOrigins.has(origin) ? origin : null;
  },
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400,
  exposeHeaders: [],
});
