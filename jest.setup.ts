import { afterAll } from "@jest/globals";
import { redisClient } from "./src/config/redis";
import pool from "./src/db";

afterAll(async () => {
  await pool.end();
  await redisClient.quit();
});
