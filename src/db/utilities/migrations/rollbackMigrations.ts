import sequelize from "../../database.js";
import { createMigrator } from "./migrator.js";
import logger from "@utilities/logger";

async function rollbackMigrations() {
  try {
    const step = process.argv[2] || "1";
    const steps = parseInt(step, 10);

    if (isNaN(steps) || steps < 1) {
      logger.error("Invalid step count. Please provide a positive number.");
      process.exit(1);
    }

    logger.info({ steps }, "Rolling back migrations...");

    // Create migrator with Sequelize instance
    const migrator = createMigrator(sequelize);

    // Rollback migrations
    const migrations = await migrator.down({ step: steps });

    if (migrations.length === 0) {
      logger.info("No migrations to rollback");
    } else {
      logger.info(
        { count: migrations.length, migrations: migrations.map((m) => m.name) },
        "Migrations rolled back"
      );
    }

    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Rollback failed");
    process.exit(1);
  }
}

rollbackMigrations();
