import { createFactory } from "hono/factory";
import { Variables } from "@typings/hono";
import UserService from "@services/userService";

const factory = createFactory<{ Variables: Variables }>();

class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current authenticated user
   */
  public getCurrentUser = factory.createHandlers(async (c) => {
    const user = c.get("user")!;

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
