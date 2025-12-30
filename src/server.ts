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

// Initialize services with repositories
const authService = new AuthService(userRepository);
const userService = new UserService(userRepository);

// Initialize controllers with services
const authController = new AuthController(authService);
const userController = new UserController(userService);

// Initialize routes with controllers
const authRoutes = createAuthRoutes(authController);
const userRoutes = createUserRoutes(userController);

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/users", userRoutes);

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
