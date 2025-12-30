import { cors } from "hono/cors";
import config from "@config";

const allowedOrigins = new Set(config.FRONTEND_ORIGINS);

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) {
      return true;
    }
    return allowedOrigins.has(origin);
  },
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400,
  exposeHeaders: [],
});
