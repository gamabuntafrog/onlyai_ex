import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "@config";

class AuthHelper {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly SALT_ROUNDS: number = 10;

  constructor() {
    this.accessTokenSecret = config.JWT_SECRET;
    this.refreshTokenSecret = config.REFRESH_TOKEN_SECRET;
    this.accessTokenExpiresIn = config.ACCESS_TOKEN_EXPIRES_IN;
    this.refreshTokenExpiresIn = config.REFRESH_TOKEN_EXPIRES_IN;
  }

  /**
   * Generate access token
   */
  public generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn as SignOptions["expiresIn"],
    });
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn as SignOptions["expiresIn"],
    });
  }

  /**
   * Verify access token and return decoded payload
   */
  public verifyAccessToken(token: string): { userId: string } {
    return jwt.verify(token, this.accessTokenSecret) as { userId: string };
  }

  /**
   * Verify refresh token and return decoded payload
   */
  public verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, this.refreshTokenSecret) as { userId: string };
  }

  /**
   * Hash password using bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Hash a token (refresh tokens in this case)
   */
  public async hashToken(token: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return bcrypt.hash(token, salt);
  }

  /**
   * Compare plain password with hashed password
   */
  public async comparePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Compare token with stored hash
   */
  public async compareToken(
    token: string,
    hashedToken: string
  ): Promise<boolean> {
    return bcrypt.compare(token, hashedToken);
  }
}

// Export singleton instance
export default new AuthHelper();
