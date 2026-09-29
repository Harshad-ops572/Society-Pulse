import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional().default('societypulse-jwt-secret-key-32chars-min'),
  DEMO_MODE: z.enum(['true', 'false']).optional().default('false'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_MEMBER_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
