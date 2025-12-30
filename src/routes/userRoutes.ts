import { Hono } from "hono";
import { Variables } from "@typings/hono";
import UserController from "@controllers/userController";
import { authenticate } from "@middleware/authMiddleware";

export default function createUserRoutes(
  userController: UserController
): Hono<{ Variables: Variables }> {
  const app = new Hono<{ Variables: Variables }>();

  // Protected routes
  app.get("/me", authenticate, (c) => userController.getCurrentUser(c));

  return app;
}
