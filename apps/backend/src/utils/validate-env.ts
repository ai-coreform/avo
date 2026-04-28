import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  APPLICATION_ALLOWED_ORIGINS: z.string().optional(),
  BETTER_AUTH_URL: z.string(),
  BETTER_AUTH_COOKIE_DOMAIN: z.string().optional(),
  BETTER_AUTH_COOKIE_PREFIX: z.string().optional(),
  BASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = (error as z.ZodError).issues;
      const missingEnvVars = issues
        .map((issue) => issue.path.join("."))
        .join(", ");
      throw new Error(`Environment validation failed: ${missingEnvVars}`);
    }
    throw new Error("Failed to validate environment variables");
  }
}

export type ValidatedEnv = ReturnType<typeof validateEnv>;

declare global {
  // biome-ignore lint/style/noNamespace: Update of types
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
