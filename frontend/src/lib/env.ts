import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:5001'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000')
});

// Since Next.js exposes environment variables to the client, we validate them dynamically
const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
});

if (!parsed.success) {
  console.error('❌ Invalid frontend environment variables config:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
}

const fallback = {
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:5001',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
} as const;

export const env = parsed.success ? parsed.data : fallback;
