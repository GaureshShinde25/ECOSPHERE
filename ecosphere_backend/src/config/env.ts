import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  DB_SERVER: z.string().min(1, 'DB_SERVER environment variable is required'),
  DB_PORT: z.string().transform((val) => parseInt(val, 10)).default('1433'),
  DB_DATABASE: z.string().default('ECOSPHERE'),
  DB_WINDOWS_AUTH: z.string().transform((val) => val === 'true').default('true'),
  DB_USER: z.string().optional().default(''),
  DB_PASSWORD: z.string().optional().default(''),
  DB_ENCRYPT: z.string().transform((val) => val === 'true').default('false'),
  DB_TRUST_SERVER_CERTIFICATE: z.string().transform((val) => val === 'true').default('true'),

  JWT_SECRET: z.string().default('ecosphere_jwt_secret_dev_2026_default_key'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('*'),

  AI_PROVIDER: z.string().optional().default('none'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().optional().default('gemini-1.5-flash'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment configuration error:');
  console.error(parsedEnv.error.format());
  console.error('\nPlease verify your .env file in ecosphere_backend directory.');
  process.exit(1);
}

export const env = parsedEnv.data;
