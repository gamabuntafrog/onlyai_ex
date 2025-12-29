import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function createMigrationFile(migrationName: string): void {
  // Ensure migration name is kebab-case
  const kebabCaseName = migrationName
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

  const timestamp = generateTimestamp();
  const fileName = `${timestamp}-${kebabCaseName}.ts`;

  // Path to migrations directory
  const migrationsDir = path.resolve(__dirname, "../../migrations");
  const filePath = path.join(migrationsDir, fileName);

  // Ensure migrations directory exists
  mkdirSync(migrationsDir, { recursive: true });

  // Migration template
  const template = `import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add your migration logic here
  // Example:
  // await queryInterface.createTable("table_name", {
  //   id: {
  //     type: DataTypes.UUID,
  //     defaultValue: DataTypes.UUIDV4,
  //     primaryKey: true,
  //     allowNull: false,
  //   },
  //   created_at: {
  //     type: DataTypes.DATE,
  //     allowNull: false,
  //     defaultValue: DataTypes.NOW,
  //   },
  //   updated_at: {
  //     type: DataTypes.DATE,
  //     allowNull: false,
  //     defaultValue: DataTypes.NOW,
  //   },
  // });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Add your rollback logic here
  // Example:
  // await queryInterface.dropTable("table_name");
}
`;

  // Write the migration file
  writeFileSync(filePath, template, "utf-8");

  console.log(`✅ Migration file created: ${fileName}`);
  console.log(`📁 Location: ${filePath}`);
}

// Get migration name from command line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.error("❌ Error: Migration name is required");
  console.log("Usage: npm run migrate:create <migration-name>");
  console.log("Example: npm run migrate:create add-posts-table");
  process.exit(1);
}

createMigrationFile(migrationName);
