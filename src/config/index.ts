import dotenv from "dotenv";
import path from "path";
import { validateEnv } from "./env.schema";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
  quiet: true,
});

const env = validateEnv();

const config = {
  node_env: env.NODE_ENV,
  ip_address: env.MACHINE_IP,
  port: env.PORT,

  database: {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    name: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    pool_max: env.DATABASE_POOL_MAX,
    pool_min: env.DATABASE_POOL_MIN,
  },

  cors: {
    prod_origins: env.PROD_ORIGINS,
    allowed_origins: env.ALLOWED_ORIGINS,
  },

  app: {
    name: env.APP_NAME,
    frontendUrl: env.FRONTEND_URL,
  },
};

export default config;
