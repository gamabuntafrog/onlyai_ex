import { createFactory } from "hono/factory";
import { Variables } from "@typings/hono";
import UserService from "@services/userService";
import { UnauthorizedError } from "@errors/AppError";
import { ERROR_CODES } from "@constants/errorCodes";

const factory = createFactory<{ Variables: Variables }>();

class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current authenticated user
   */
  public getCurrentUser = factory.createHandlers(async (c) => {
    const user = c.get("user");

    if (!user?.id) {
      throw new UnauthorizedError(
        "User not authenticated",
        ERROR_CODES.NOT_AUTHENTICATED
      );
    }

    const userData = await this.userService.getUserById(user.id);

    return c.json({
      success: true,
      data: {
        user: userData,
      },
    });
  });
}

export default UserController;
