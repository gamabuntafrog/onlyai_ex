import { Hono } from "hono";
import { Variables } from "@typings/hono";
import AuthController from "@controllers/authController";

export default function createAuthRoutes(
  authController: AuthController
): Hono<{ Variables: Variables }> {
  const app = new Hono<{ Variables: Variables }>();

  // Public routes
  app.post("/register", (c) => authController.register(c));
  app.post("/login", (c) => authController.login(c));
  app.post("/refresh", (c) => authController.refresh(c));

  return app;
}
