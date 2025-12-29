import { Response, NextFunction } from "express";
import { AuthRequest } from "@typings/express";
import UserService from "@services/userService";
import { UnauthorizedError } from "@errors/AppError";
import { ERROR_CODES } from "@constants/errorCodes";

class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current authenticated user
   */
  public async getCurrentUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError(
          "User not authenticated",
          ERROR_CODES.NOT_AUTHENTICATED
        );
      }

      const user = await this.userService.getUserById(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
