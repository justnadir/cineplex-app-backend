import { Client } from "pg";
import config from "../config";
import logger from "../shared/logger";

const createDatabase = async () => {
  const dbName = config.app.name;
  if (!dbName) {
    throw new Error("DB_NAME is not set in .env");
  }

  const client = new Client({
    host: config.database.host,
    port: Number(config.database.port),
    user: config.database.user,
    password: config.database.password,
    database: "postgres", // maintenance DB
  });

  await client.connect();

  const { rows } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );

  if (rows.length > 0) {
    logger.info(`⏭️  Database ${dbName} already exists.`);
  } else {
    // DB name can't be parameterized; quote it safely as an identifier.
    const safeName = '"' + dbName.replace(/"/g, '""') + '"';
    await client.query(`CREATE DATABASE ${safeName}`);
    logger.info(`✅ Database "${dbName}" created.`);
  }

  await client.end();
};
createDatabase().catch((err) => {
  logger.error({ err }, "❌ Database creation failed:");
  process.exit(1);
});
