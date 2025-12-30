import { Hono } from "hono";
import { Variables } from "@typings/hono";
import AuthController from "@controllers/authController";

export default function createAuthRoutes(
  authController: AuthController
): Hono<{ Variables: Variables }> {
  const app = new Hono<{ Variables: Variables }>();

  // Public routes
  app.post("/register", ...authController.register);
  app.post("/login", ...authController.login);
  app.post("/refresh", ...authController.refresh);

  return app;
}
