/**
 * Canlıya geçiş ön kontrolü.
 *
 * Deploy'dan ÖNCE çalıştırılır ve "sanırım hazırız" ile "hazırız" arasındaki farkı kapatır:
 * her maddeyi iddia etmez, gerçekten dener. Eksik bir ortam değişkenini üretimde 500 hatası
 * olarak öğrenmek, burada tek satırlık bir uyarı olarak öğrenmekten pahalıdır.
 *
 *   node scripts/preflight.mjs
 */
import { randomBytes } from 'node:crypto';
import process from 'node:process';

const checks = [];
const add = (ok, name, detail = '', fatal = true) => checks.push({ ok, name, detail, fatal });

function requireEnv(name, minLength) {
  const value = process.env[name];
  if (!value) return add(false, `${name} tanımlı`, 'eksik — üretimde zorunlu');
  if (minLength && value.length < minLength) {
    return add(false, `${name} yeterince uzun`, `${value.length} karakter, en az ${minLength} gerekli`);
  }
  add(true, `${name} tanımlı`);
}

requireEnv('DATABASE_URL');
requireEnv('SESSION_SECRET', 32);
requireEnv('VOTE_HASH_SALT', 16);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
add(Boolean(siteUrl && siteUrl.startsWith('https://')), 'NEXT_PUBLIC_SITE_URL https ile başlıyor',
  siteUrl ? `şu an: ${siteUrl}` : 'eksik — canonical URL ve paylaşım kartları buna bağlı');

const adminToken = process.env.ADMIN_TOKEN;
if (!adminToken) {
  add(true, 'ADMIN_TOKEN yok → admin paneli kapalı', 'bilinçliyse sorun değil', false);
} else {
  add(adminToken.length >= 24, 'ADMIN_TOKEN yeterince uzun', `${adminToken.length} karakter`);
}

add(process.env.ALLOW_MEMORY_STORE !== '1', 'ALLOW_MEMORY_STORE kapalı',
  'açıksa üretim bellek içi depoya düşebilir ve tüm oylar yeniden başlatmada kaybolur');

if (process.env.DATABASE_URL) {
  try {
    const { default: postgres } = await import('postgres');
    const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, idle_timeout: 5 });

    const [{ now }] = await sql`select now()`;
    add(true, 'Veritabanına bağlanılıyor', `sunucu saati ${new Date(now).toISOString()}`);

    const tables = await sql`
      select table_name from information_schema.tables
      where table_schema = 'public'
    `;
    const names = new Set(tables.map((t) => t.table_name));
    const required = ['polls', 'options', 'votes', 'vote_aggregates', 'vote_timeseries', 'cities', 'categories'];
    const missing = required.filter((t) => !names.has(t));
    add(missing.length === 0, 'Migration’lar uygulanmış',
      missing.length ? `eksik tablolar: ${missing.join(', ')} → npm run db:migrate` : `${names.size} tablo`);

    if (missing.length === 0) {
      const [{ count: cityCount }] = await sql`select count(*)::int as count from cities`;
      add(cityCount === 81, 'Şehir verisi yüklü', `${cityCount}/81 → eksikse npm run seed`);

      const [{ count: liveCount }] = await sql`select count(*)::int as count from polls where status = 'live'`;
      add(liveCount > 0, 'Yayında en az bir soru var', `${liveCount} soru → yoksa npm run seed`);

      const [{ count: unchecked }] = await sql`
        select count(*)::int as count from polls where status = 'live' and not editorial_ok
      `;
      add(unchecked === 0, 'Yayındaki her soru editoryal kontrolden geçmiş',
        unchecked ? `${unchecked} soru işaretsiz` : '');

      // Yazma yetkisi okuma yetkisinden ayrıdır: salt okunur bir bağlantı dizesiyle
      // site açılır ama hiç kimse oy veremez.
      const probe = `preflight-${randomBytes(4).toString('hex')}`;
      await sql`insert into abuse_events (kind, detail) values (${probe}, ${sql.json({ preflight: true })})`;
      await sql`delete from abuse_events where kind = ${probe}`;
      add(true, 'Veritabanına yazma yetkisi var');
    }

    await sql.end();
  } catch (error) {
    add(false, 'Veritabanı kontrolü', String(error instanceof Error ? error.message : error));
  }
}

const failed = checks.filter((c) => !c.ok);
const fatal = failed.filter((c) => c.fatal);

for (const check of checks) {
  console.log(`${check.ok ? '✓' : '✗'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} kontrol geçti`);

if (fatal.length > 0) {
  console.error(`\nCanlıya geçmeye hazır DEĞİL. Önce şunları çöz:\n${fatal.map((f) => `  · ${f.name}`).join('\n')}`);
  process.exit(1);
}
console.log('Canlıya geçmeye hazır.');
