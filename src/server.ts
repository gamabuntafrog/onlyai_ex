import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { Variables } from "@typings/hono";
import config from "@config";
import logger from "@utilities/logger";
import sequelize from "@db/database";
import UserRepository from "@repositories/UserRepository";
import { initializeUserModel } from "@db/models/User";
import AuthService from "@services/authService";
import UserService from "@services/userService";
import AuthController from "@controllers/authController";
import UserController from "@controllers/userController";
import createAuthRoutes from "@routes/authRoutes";
import createUserRoutes from "@routes/userRoutes";
import createAnalyzeRoutes from "@routes/analyzeRoutes";
import createWebhookRoutes from "@routes/webhookRoutes";
import AnalysisStateStore from "@stores/analysisStateStore";
import RedisAdapter from "@adapters/redis";
import OpenAIClient from "@integrations/openai";
import AnalyzeService from "@services/analyzeService";
import AnalyzeController from "@controllers/analyzeController";
import WebhookController from "@controllers/webhookController";
import qstashService from "@integrations/qstash/index";
import { errorHandler } from "@middleware/global/errorHandler";
import { corsMiddleware } from "@middleware/global/corsMiddleware";
import { requestLogger } from "@middleware/global/requestLogger";
import { ERROR_CODES } from "@constants/errorCodes";

const app = new Hono<{ Variables: Variables }>();

// Middleware
app.use("*", corsMiddleware);
app.use("*", requestLogger);

// Initialize models with Sequelize instance
const UserModel = initializeUserModel(sequelize);

// Initialize repositories with injected models
const userRepository = new UserRepository(UserModel);

// Redis
const redisAdapter = new RedisAdapter();

// OpenAI
const openaiClient = new OpenAIClient();

// Initialize services with repositories
const authService = new AuthService(userRepository);
const userService = new UserService(userRepository);

// Initialize analysis state store
const analysisStateStore = new AnalysisStateStore(redisAdapter);
const analyzeService = new AnalyzeService(
  analysisStateStore,
  qstashService,
  openaiClient
);

// Initialize controllers with services
const authController = new AuthController(authService);
const userController = new UserController(userService);
const analyzeController = new AnalyzeController(analyzeService);
const webhookController = new WebhookController(analyzeService);

// Initialize routes with controllers
const authRoutes = createAuthRoutes(authController);
const userRoutes = createUserRoutes(userController);
const analyzeRoutes = createAnalyzeRoutes(analyzeController);
const webhookRoutes = createWebhookRoutes(webhookController);

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/users", userRoutes);
app.route("/api", analyzeRoutes);
app.route("", webhookRoutes);

// Health check route
app.get("/health", (c) => {
  return c.json({
    success: true,
    message: "Server is running",
  });
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      code: ERROR_CODES.NOT_FOUND,
      message: "Route not found",
    },
    404
  );
});

// Error handler
app.onError(errorHandler);

// Start server
serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    logger.info(`Server is running on port ${info.port}`);
  }
);

export default app;
