import { Sequelize } from "sequelize";
import { Umzug, SequelizeStorage } from "umzug";
import logger from "@utilities/logger";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createMigrator(sequelize: Sequelize) {
  return new Umzug({
    migrations: {
      glob: ["../../migrations/*.ts", { cwd: __dirname }],
      resolve: ({ name, path: migrationPath }) => {
        // Dynamically import the migration file
        // When using tsx, we can import TypeScript files directly
        return {
          name,
          up: async () => {
            // Import the migration module dynamically
            const migration = await import(migrationPath!);

            if (typeof migration.up === "function") {
              await migration.up(sequelize.getQueryInterface());
            } else {
              throw new Error(
                `Migration ${name} does not export an 'up' function`
              );
            }
          },
          down: async () => {
            // Import the migration module dynamically
            const migration = await import(migrationPath!);

            if (typeof migration.down === "function") {
              await migration.down(sequelize.getQueryInterface());
            } else {
              throw new Error(
                `Migration ${name} does not export a 'down' function`
              );
            }
          },
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: {
      info: (msg) => logger.info({ msg }, "Migration"),
      warn: (msg) => logger.warn({ msg }, "Migration"),
      error: (msg) => logger.error({ msg }, "Migration"),
      debug: (msg) => logger.debug({ msg }, "Migration"),
    },
  });
}

export type Migration = ReturnType<
  typeof createMigrator
>["_types"]["migration"];
