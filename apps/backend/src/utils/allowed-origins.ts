const DEFAULT_ALLOWED_ORIGIN = "http://localhost:3000";

const parseOrigins = (origins: string): string[] =>
  origins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

export const getAllowedOrigins = (): string[] => {
  const configuredOrigins = process.env.APPLICATION_ALLOWED_ORIGINS ?? "";
  const origins = parseOrigins(configuredOrigins);

  return origins.length > 0 ? origins : [DEFAULT_ALLOWED_ORIGIN];
};

export const resolveCorsOrigin = (origin?: string): string => {
  const allowedOrigins = getAllowedOrigins();
  const fallbackOrigin = allowedOrigins[0];

  if (!origin) {
    return fallbackOrigin;
  }

  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  return fallbackOrigin;
};
