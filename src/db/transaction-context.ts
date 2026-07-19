import { AsyncLocalStorage } from "async_hooks";
import { Pool, PoolClient } from "pg";

export type DbClient = Pool | PoolClient;
const als = new AsyncLocalStorage<PoolClient>();

// service layer eta diye transaction wrap korbe
export const runInTransaction = async <T>(
  pool: Pool,
  fn: () => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await als.run(client, fn);

    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getClient = (fallback: DbClient): DbClient => {
  return als.getStore() ?? fallback;
};
