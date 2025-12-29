import { Request, Response, NextFunction } from "express";
import AuthService from "@services/authService";
import mapper from "@mappers/mapper";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "@validators/authValidator";

class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register new user
   */
  public async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const registerData = mapper.toDTO(req, registerSchema);
      const result = await this.authService.register(registerData);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  public async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const loginData = mapper.toDTO(req, loginSchema);
      const result = await this.authService.login(loginData);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh tokens
   */
  public async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = mapper.toDTO(req, refreshSchema);
      const result = await this.authService.refreshTokens(refreshToken);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
