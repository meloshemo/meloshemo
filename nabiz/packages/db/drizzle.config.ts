import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env['DATABASE_URL'] ?? '' },
  // Migration'lar ileriye uyumlu ve iki aşamalı yazılır (expand/contract): deploy'u bloke
  // eden bir şema değişikliği, canlı bir oylama sırasında oy kaybı demektir.
  strict: true,
} satisfies Config;
