import sequelize from "../../database.js";
import { createMigrator } from "./migrator.js";
import logger from "@utilities/logger";

async function runMigrations() {
  try {
    logger.info("Running migrations...");

    // Create migrator with Sequelize instance
    const migrator = createMigrator(sequelize);

    // Run pending migrations
    const migrations = await migrator.up();

    if (migrations.length === 0) {
      logger.info("No pending migrations");
    } else {
      logger.info(
        { count: migrations.length, migrations: migrations.map((m) => m.name) },
        "Migrations completed"
      );
    }

    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Migration failed");
    process.exit(1);
  }
}

runMigrations();
