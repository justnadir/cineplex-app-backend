import { z } from "zod";
import logger from "../shared/logger";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  APP_NAME: z.string().default("node-pg-api"),

  // those are database config
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_USER: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_POOL_MAX: z.coerce.number().default(20),
  DATABASE_POOL_MIN: z.coerce.number().default(20),

  // cors
  PROD_ORIGINS: z.string(),
  ALLOWED_ORIGINS: z.string(),
  // those for the device
  PORT: z.coerce.number().default(3000),
  MACHINE_IP: z.string(),
  FRONTEND_URL: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    logger.error("❌ Invalid environment variables:");
    for (const issue of parsed.error.issues) {
      logger.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}
