import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  APP_NAME: z.string().default("node-pg-api"),

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
    console.error("❌ Invalid environment variables:");
    for (const issue of parsed.error.issues) {
      console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}
