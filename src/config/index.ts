import dotenv from "dotenv";

// Load environment variables
dotenv.config();

class Config {
  // Server configuration
  public readonly PORT: number;
  public readonly NODE_ENV: string;

  // Database configuration
  public readonly DATABASE_URL: string;
  public readonly POSTGRES_SSL: boolean;

  // JWT configuration
  public readonly JWT_SECRET: string;
  public readonly ACCESS_TOKEN_EXPIRES_IN: string;
  public readonly REFRESH_TOKEN_EXPIRES_IN: string;
  public readonly REFRESH_TOKEN_SECRET: string;

  // Logger configuration
  public readonly LOG_LEVEL: string;

  // CORS configuration
  public readonly FRONTEND_ORIGINS: string[];

  // Redis configuration
  public readonly REDIS_URL: string;
  public readonly REDIS_TOKEN: string;

  // QStash configuration
  public readonly QSTASH_URL: string;
  public readonly QSTASH_CURRENT_SIGNING_KEY: string;
  public readonly QSTASH_NEXT_SIGNING_KEY: string;

  // OpenAI configuration
  public readonly OPENAI_API_KEY: string;

  private static instance: Config;

  private constructor() {
    // Server
    this.PORT = parseInt(process.env.PORT || "3000", 10);
    this.NODE_ENV = process.env.NODE_ENV || "development";

    // Database (PostgreSQL + Sequelize)
    this.DATABASE_URL =
      process.env.DATABASE_URL || this.buildDefaultDatabaseUrl();
    this.POSTGRES_SSL =
      (process.env.POSTGRES_SSL || "false").toLowerCase() === "true";

    // JWT
    this.JWT_SECRET =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";
    this.ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "1h";
    this.REFRESH_TOKEN_EXPIRES_IN =
      process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
    this.REFRESH_TOKEN_SECRET =
      process.env.REFRESH_TOKEN_SECRET ||
      "your-secret-refresh-key-change-in-production";

    // Logger
    this.LOG_LEVEL =
      process.env.LOG_LEVEL ||
      (this.NODE_ENV === "development" ? "debug" : "info");

    // CORS - Parse comma-separated origins or use default
    const frontendOriginsEnv =
      process.env.FRONTEND_ORIGIN || "http://localhost:3001";
    this.FRONTEND_ORIGINS = frontendOriginsEnv
      .split(",")
      .map((origin) => origin.trim());

    // Redis
    this.REDIS_URL = process.env.REDIS_URL || "";
    this.REDIS_TOKEN = process.env.REDIS_TOKEN || "";

    // QStash
    this.QSTASH_URL = process.env.QSTASH_URL || "https://qstash.upstash.io";
    this.QSTASH_CURRENT_SIGNING_KEY =
      process.env.QSTASH_CURRENT_SIGNING_KEY || "";
    this.QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY || "";

    // OpenAI
    this.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

    // Validate required environment variables
    this.validate();
  }

  /**
   * Get singleton instance of Config
   */
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * Validate required environment variables
   */
  private validate(): void {
    const required: string[] = [];

    // Add validation for required env vars if needed
    // For example:
    // if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    //   required.push('JWT_SECRET');
    // }

    if (required.length > 0) {
      throw new Error(
        `Missing required environment variables: ${required.join(", ")}`
      );
    }
  }

  /**
   * Build a default PostgreSQL connection string using individual env vars
   */
  private buildDefaultDatabaseUrl(): string {
    const user = process.env.POSTGRES_USER || "postgres";
    const password = process.env.POSTGRES_PASSWORD || "postgres";
    const host = process.env.POSTGRES_HOST || "localhost";
    const port = process.env.POSTGRES_PORT || "5432";
    const database = process.env.POSTGRES_DB || "palz";

    return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(
      password
    )}@${host}:${port}/${database}`;
  }

  /**
   * Check if running in development mode
   */
  public isDevelopment(): boolean {
    return this.NODE_ENV === "development";
  }

  /**
   * Check if running in production mode
   */
  public isProduction(): boolean {
    return this.NODE_ENV === "production";
  }
}

// Export singleton instance
export default Config.getInstance();
