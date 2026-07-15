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

  app: {
    name: env.APP_NAME,
    frontendUrl: env.FRONTEND_URL,
  },
};

export default config;
