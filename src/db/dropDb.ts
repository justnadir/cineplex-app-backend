import { Client } from "pg";
import config from "../config";
import logger from "../shared/logger";

const dropDatabase = async () => {
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

  if (rows.length === 0) {
    logger.info(`⏭️  Database ${dbName} does not exist.`);
  } else {
    // Terminate any other open connections so the drop is not blocked.
    await client.query(
      `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName]
    );

    // DB name can't be parameterized; quote it safely as an identifier.
    const safeName = '"' + dbName.replace(/"/g, '""') + '"';
    await client.query(`DROP DATABASE ${safeName}`);
    logger.info(`🗑️  Database ${dbName} dropped.`);
  }

  await client.end();
};

dropDatabase().catch((err) => {
  logger.error({ err }, "❌ Database drop failed:");
  process.exit(1);
});
