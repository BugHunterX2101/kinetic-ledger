const { z } = require("zod");

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(16).default("kinetic-ledger-dev-secret-2026"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  DB_PATH: z.string().default("./data/kinetic_ledger.db"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast on invalid environment configuration.
  throw new Error(`Invalid environment variables: ${JSON.stringify(parsed.error.flatten())}`);
}

module.exports = parsed.data;
