import { NextResponse } from 'next/server';
import { detectBursts, quarantineHealth } from '@nabiz/core';
import { runRecount } from '@nabiz/db/recount';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Zamanlanmış gece temizliği (vercel.json → crons).
 *
 * Kimlik doğrulaması olmadan açık bırakılırsa herkes tetikleyebilir; işin kendisi yıkıcı
 * olmasa da veritabanını meşgul eder. `CRON_SECRET` tanımlı değilse uç nokta tamamen
 * kapalıdır (fail-closed) — "geçici olarak açık bıraktım" hâli üretimde kalıcı olur.
 */
export async function GET(request: Request) {
  const secret = process.env['CRON_SECRET'];
  if (!secret) {
    return NextResponse.json({ error: 'cron_disabled' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  try {
    const result = await runRecount(databaseUrl, { detectBursts, quarantineHealth });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('recount failed', error);
    return NextResponse.json({ error: 'recount_failed' }, { status: 500 });
  }
}
