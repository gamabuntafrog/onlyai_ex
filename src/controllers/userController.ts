import { AuthContext } from "@typings/hono";
import UserService from "@services/userService";
import { UnauthorizedError } from "@errors/AppError";
import { ERROR_CODES } from "@constants/errorCodes";

class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current authenticated user
   */
  public async getCurrentUser(c: AuthContext): Promise<Response> {
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
  }
}

export default UserController;
