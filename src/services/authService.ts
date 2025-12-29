import jwt from "jsonwebtoken";
import UserRepository from "@repositories/UserRepository";
import { ConflictError, UnauthorizedError } from "@errors/AppError";
import authHelper from "@helpers/authHelper";
import { ERROR_CODES } from "@constants/errorCodes";
import { User } from "@db/models/User";

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Helper that builds auth payload and persists the refresh token hash
   */
  private async buildAuthResult(user: User): Promise<AuthResult> {
    const userId = user.id.toString();

    const accessToken = authHelper.generateAccessToken(userId);
    const refreshToken = authHelper.generateRefreshToken(userId);
    const refreshTokenHash = await authHelper.hashToken(refreshToken);

    await this.userRepository.updateById(userId, {
      refreshTokenHash,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: user.email,
      },
    };
  }

  /**
   * Register new user
   * @throws ConflictError if user already exists
   */
  public async register(data: RegisterData): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError(
        "User with this email already exists",
        ERROR_CODES.USER_ALREADY_EXISTS
      );
    }

    // Hash password before saving
    const hashedPassword = await authHelper.hashPassword(data.password);

    // Create new user
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
    });

    return this.buildAuthResult(user);
  }

  /**
   * Login user
   * @throws UnauthorizedError if credentials are invalid
   */
  public async login(data: LoginData): Promise<AuthResult> {
    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError(
        "Invalid email or password",
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    // Check password
    const isPasswordValid = await authHelper.comparePassword(
      data.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError(
        "Invalid email or password",
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    return this.buildAuthResult(user);
  }

  /**
   * Refresh access and refresh tokens
   */
  public async refreshTokens(refreshToken: string): Promise<AuthResult> {
    let decoded: { userId: string };

    try {
      decoded = authHelper.verifyRefreshToken(refreshToken);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(
          "Refresh token expired",
          ERROR_CODES.TOKEN_EXPIRED
        );
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError(
          "Invalid refresh token",
          ERROR_CODES.INVALID_TOKEN
        );
      }

      throw error;
    }

    const user = await this.userRepository.findById(decoded.userId);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedError(
        "Invalid refresh token",
        ERROR_CODES.INVALID_TOKEN
      );
    }

    const isValidToken = await authHelper.compareToken(
      refreshToken,
      user.refreshTokenHash
    );

    if (!isValidToken) {
      throw new UnauthorizedError(
        "Invalid refresh token",
        ERROR_CODES.INVALID_TOKEN
      );
    }

    return this.buildAuthResult(user);
  }
}

export default AuthService;
