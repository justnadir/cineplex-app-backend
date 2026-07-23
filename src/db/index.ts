import { Pool, QueryConfig, QueryResultRow } from "pg";
import config from "../config";
import logger from "../shared/logger";

const pool = new Pool({
  host: config.database.host,
  port: Number(config.database.port),
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: Number(config.database.pool_max) || 20,
  min: Number(config.database.pool_min) || 2,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
  statement_timeout: 5_000,
  query_timeout: 5_000,
  application_name: config.app.name,
  keepAlive: true,
});

pool.on("error", (err: Error) => {
  logger.error({ err }, "PostgreSQL pool error (idle client)");
});

type QueryArgs =
  [string, ...unknown[]] | [QueryConfig<QueryResultRow>, ...unknown[]];
type QueryError = Error & { sql?: string; origin?: string };

type QueryPromise = Promise<unknown>;

const rawQuery = pool.query.bind(pool);
pool.query = function patchedQuery(...args: QueryArgs): QueryPromise {
  // Only enrich the Promise form (no trailing callback).
  if (typeof args[args.length - 1] === "function") {
    return rawQuery(
      ...(args as Parameters<typeof rawQuery>)
    ) as unknown as QueryPromise;
  }

  const callSite = new Error();
  return (
    rawQuery(
      ...(args as Parameters<typeof rawQuery>)
    ) as unknown as QueryPromise
  ).catch((err: unknown) => {
    if (err && typeof err === "object") {
      const error = err as QueryError;
      const text =
        typeof args[0] === "string"
          ? args[0]
          : args[0] && typeof args[0] === "object" && "text" in args[0]
            ? args[0].text
            : undefined;

      if (text && !error.sql) error.sql = text;

      const frame = callSite.stack
        ?.split("\n")
        .slice(1)
        .find((l) => /[\\/]src[\\/]/.test(l) && !/[\\/]db[\\/]index\./.test(l));
      if (frame && !error.origin) error.origin = frame.trim();
    }
    throw err;
  });
} as typeof pool.query;

export default pool;
