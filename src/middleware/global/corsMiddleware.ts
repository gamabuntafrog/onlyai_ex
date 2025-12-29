import cors, { CorsOptions } from "cors";
import config from "@config";

const allowedOrigins = new Set(config.FRONTEND_ORIGINS);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // Disable CORS headers for disallowed origins
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);
