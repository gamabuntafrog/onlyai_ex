import { Context } from "hono";
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
  public async register(c: Context): Promise<Response> {
    const registerData = await mapper.toDTO(c, registerSchema);
    const result = await this.authService.register(registerData);

    return c.json(
      {
        success: true,
        message: "User registered successfully",
        data: result,
      },
      201
    );
  }

  /**
   * Login user
   */
  public async login(c: Context): Promise<Response> {
    const loginData = await mapper.toDTO(c, loginSchema);
    const result = await this.authService.login(loginData);

    return c.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }

  /**
   * Refresh tokens
   */
  public async refresh(c: Context): Promise<Response> {
    const { refreshToken } = await mapper.toDTO(c, refreshSchema);
    const result = await this.authService.refreshTokens(refreshToken);

    return c.json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  }
}

export default AuthController;
