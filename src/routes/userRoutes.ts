import { Router } from "express";
import UserController from "@controllers/userController";
import { authenticate } from "@middleware/authMiddleware";

export default function createUserRoutes(
  userController: UserController
): Router {
  const router = Router();

  // Protected routes
  router.get(
    "/me",
    authenticate,
    userController.getCurrentUser.bind(userController)
  );

  return router;
}
