import sequelize from "../../database.js";
import { createMigrator } from "./migrator.js";
import logger from "@utilities/logger";

async function statusMigrations() {
  try {
    logger.info("Checking migration status...");

    // Create migrator with Sequelize instance
    const migrator = createMigrator(sequelize);

    // Get pending migrations
    const pending = await migrator.pending();
    // Get executed migrations
    const executed = await migrator.executed();

    logger.info(
      {
        pending: pending.map((m) => m.name),
        executed: executed.map((m) => m.name),
        pendingCount: pending.length,
        executedCount: executed.length,
      },
      "Migration status"
    );

    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Failed to check migration status");
    process.exit(1);
  }
}

statusMigrations();
