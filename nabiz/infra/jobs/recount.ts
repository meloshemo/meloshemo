/**
 * Gece yeniden sayım işi — komut satırı sarmalayıcısı.
 * Asıl mantık `@nabiz/db`'deki `runRecount` içindedir; zamanlanmış HTTP uç noktası
 * (`/api/cron/recount`) da aynı fonksiyonu çağırır.
 *
 *   DATABASE_URL=... npm run recount
 */
import { detectBursts, quarantineHealth } from '@nabiz/core';
import { runRecount } from '@nabiz/db/recount';

const url = process.env['DATABASE_URL'];
if (!url) {
  console.error('DATABASE_URL zorunlu');
  process.exit(1);
}

runRecount(url, { detectBursts, quarantineHealth, log: (m) => console.log(m) })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
