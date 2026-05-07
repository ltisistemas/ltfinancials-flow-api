type EnvInput = Record<string, unknown>;

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function requireString(config: EnvInput, key: string): string {
  const value = asString(config[key]);

  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }

  return value;
}

export function validateEnvironment(config: EnvInput): EnvInput {
  const port = Number(config.PORT ?? 3001);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error('Environment variable PORT must be a valid number');
  }

  requireString(config, 'DATABASE_URL');
  requireString(config, 'SUPABASE_JWT_SECRET');
  requireString(config, 'GEMINI_API_KEY');

  return {
    ...config,
    PORT: port,
    NODE_ENV: asString(config.NODE_ENV) ?? 'development',
    CORS_ORIGIN: asString(config.CORS_ORIGIN) ?? 'http://localhost:3000',
    GEMINI_MODEL: asString(config.GEMINI_MODEL) ?? 'gemini-2.0-flash',
  };
}
