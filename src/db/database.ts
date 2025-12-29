import { Sequelize, Options } from "sequelize";
import config from "@config";
import logger from "@utilities/logger";

const baseOptions: Options = {
  dialect: "postgres",
  logging: config.isDevelopment()
    ? (query) => logger.debug({ query }, "sequelize.query")
    : false,
};

if (config.POSTGRES_SSL) {
  baseOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

async function connectDB(): Promise<Sequelize> {
  const sequelize = new Sequelize(config.DATABASE_URL, baseOptions);

  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL connected successfully");

    return sequelize;
  } catch (error) {
    logger.error({ error }, "PostgreSQL connection error");
    process.exit(1);
  }
}

// Connect to database and export the Sequelize instance
const sequelize = await connectDB();

export default sequelize;
