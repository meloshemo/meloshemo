/**
 * Uçtan uca doğrulama.
 *
 * Üretim derlemesini başlatır ve gerçek HTTP istekleriyle ürünün savunma davranışlarını
 * sınar. Birim testleri mantığı doğrular; buradaki testler mantığın gerçekten devrede
 * olduğunu doğrular — bir güvenlik kuralının yanlışlıkla devre dışı bırakılması ancak
 * böyle yakalanır.
 */
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import process from 'node:process';

const PORT = Number(process.env.E2E_PORT ?? 3210);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_TOKEN = 'e2e-admin-token-en-az-24-karakter';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE, { redirect: 'manual' });
      if (response.status < 500) return;
    } catch { /* henüz ayakta değil */ }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error('Sunucu zamanında ayağa kalkmadı');
}

async function main() {
  const server = spawn('npx', ['next', 'start', 'apps/web', '--port', String(PORT)], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      SESSION_SECRET: 'e2e-oturum-anahtari-en-az-32-karakter-uzunlukta',
      VOTE_HASH_SALT: 'e2e-tuzu',
      ADMIN_TOKEN,
      // DATABASE_URL verilmişse gerçek Postgres'e karşı koşar (asıl üretim yolu);
      // verilmemişse bellek içi depoya açıkça izin verilir.
      ...(process.env.DATABASE_URL ? {} : { ALLOW_MEMORY_STORE: '1' }),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    // Kendi süreç grubunda başlat: npx bir sarmalayıcıdır, onu öldürmek altındaki Next
    // sunucusunu öldürmez — grubun tamamına sinyal göndermek gerekir.
    detached: true,
  });
  const logs = [];
  server.stdout.on('data', (d) => logs.push(String(d)));
  server.stderr.on('data', (d) => logs.push(String(d)));

  try {
    await waitForServer();

    const html = await (await fetch(`${BASE}/lahmacun-vs-doner`)).text();
    const pollId = html.match(/q-([0-9a-f-]{36})/)?.[1];
    if (!pollId) throw new Error('Soru kimliği sayfada bulunamadı');

    check('soru sayfası sunucuda render ediliyor', html.includes('Lahmacun') && html.includes('Döner'));
    check('metodoloji uyarısı sayfada', html.includes('Bilimsel kamuoyu araştırması değildir'));
    check('schema.org işaretlemesi var', html.includes('"@type":"QAPage"'));

    const optionsResponse = await (await fetch(`${BASE}/api/v1/polls/${pollId}/results`)).json();
    const [optionA, optionB] = optionsResponse.options.map((o) => o.optionId);

    const jar = new Map();
    const vote = async (optionId, opts = {}) => {
      const response = await fetch(`${BASE}/api/v1/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': opts.ua ?? 'Mozilla/5.0 (iPhone)',
          ...(opts.session && jar.has(opts.session) ? { cookie: jar.get(opts.session) } : {}),
        },
        body: JSON.stringify({
          optionId,
          clientToken: opts.token ?? randomUUID(),
          cityId: opts.cityId ?? 35,
          decisionMs: opts.decisionMs ?? 2400,
          hadInteraction: opts.interaction ?? true,
        }),
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie && opts.session) jar.set(opts.session, setCookie.split(';')[0]);
      return { status: response.status, body: await response.json() };
    };

    // Kalıcı bir veritabanına karşı koşarken önceki oylar durur; bu yüzden mutlak sayı
    // değil FARK ölçülür. "toplam === 1" beklentisi yalnızca boş bir depoda doğrudur.
    const baseline = (await (await fetch(`${BASE}/api/v1/polls/${pollId}/results`)).json()).total;

    const first = await vote(optionA, { session: 's1' });
    check('yeni oturum oy verebiliyor',
      first.status === 200 && first.body.results.total === baseline + 1,
      `${baseline} → ${first.body.results?.total}`);
    check('kullanıcının kendi oyu işaretleniyor', first.body.results.yourOptionId === optionA);

    const second = await vote(optionB, { session: 's1' });
    check('aynı oturum ikinci kez oy veremiyor',
      second.status === 409 && second.body.results.total === baseline + 1);
    check('mükerrer denemede de sonuç gösteriliyor', Boolean(second.body.results));

    const token = randomUUID();
    await vote(optionB, { session: 's2', token });
    const replay = await vote(optionB, { session: 's2', token });
    check('aynı token tekrarında ikinci oy yazılmıyor', replay.status === 409);
    check('idempotent tekrar sayımı artırmıyor', replay.body.results.total === baseline + 2);

    const before = (await (await fetch(`${BASE}/api/v1/polls/${pollId}/results`)).json()).total;
    await vote(optionA, { session: 'bot', decisionMs: 15, interaction: false, ua: '' });
    const afterTotal = (await (await fetch(`${BASE}/api/v1/polls/${pollId}/results`)).json()).total;
    check('şüpheli oy sayıma katılmıyor', afterTotal === before, `önce ${before}, sonra ${afterTotal}`);

    const results = await (await fetch(`${BASE}/api/v1/polls/${pollId}/results?city=izmir`)).json();
    const pctSum = results.options.reduce((sum, o) => sum + o.pct, 0);
    check('yüzdelerin toplamı tam 100', Math.abs(pctSum - 100) < 1e-9, `toplam ${pctSum}`);
    check('eşik altındaki şehir kırılımı gizli', results.city === null);

    const invalid = await fetch(`${BASE}/api/v1/polls/${pollId}/vote`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ optionId: 'bu-uuid-degil', clientToken: randomUUID() }),
    });
    check('bozuk istek 422 ile reddediliyor', invalid.status === 422);

    const og = await fetch(`${BASE}/og/lahmacun-vs-doner?variant=wa`);
    check('paylaşım kartı üretiliyor', og.ok && og.headers.get('content-type')?.includes('image/png'));

    const robots = await (await fetch(`${BASE}/robots.txt`)).text();
    check('robots.txt admin ve api yollarını kapatıyor', robots.includes('/admin') && robots.includes('/api/'));

    const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
    check('sitemap soru sayfalarını içeriyor', sitemap.includes('/lahmacun-vs-doner'));
    check('eşiği geçmeyen şehir sayfası sitemap dışında', !sitemap.includes('/sehir/izmir'));

    const adminPage = await fetch(`${BASE}/admin`, { redirect: 'manual' });
    check('admin oturumsuz erişime kapalı', adminPage.status === 307 || adminPage.status === 302);

    const adminApi = await fetch(`${BASE}/api/admin/whatever`, { method: 'POST' });
    check('admin API oturumsuz 401 veriyor', adminApi.status === 401);

    const citySet = await fetch(`${BASE}/api/v1/city`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cityId: 35 }),
    });
    check('şehir seçimi kaydediliyor',
      citySet.ok && Boolean(citySet.headers.get('set-cookie')?.includes('nb_city')));

    const badCity = await fetch(`${BASE}/api/v1/city`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cityId: 999 }),
    });
    check('geçersiz şehir reddediliyor', badCity.status === 422);

    const cityPage = await (await fetch(`${BASE}/sehir/izmir`)).text();
    check('şehir sayfası açılıyor', cityPage.includes('ne diyor?'));

    const categoryPage = await (await fetch(`${BASE}/kategori/tatli`)).text();
    check('kategori sayfası açılıyor', categoryPage.includes('Tatlı'));
  } catch (error) {
    // Sunucu logları olmadan uzaktaki bir hatayı teşhis etmek imkânsız.
    console.error('\n--- sunucu logları (son 3000 karakter) ---');
    console.error(logs.join('').slice(-3000));
    throw error;
  } finally {
    // SIGKILL: Next sunucusu SIGTERM'de her zaman kapanmıyor ve açık borular süreci ayakta
    // tutuyor — CI'da bu, tüm kontroller geçse bile takılan bir iş demektir.
    try {
      process.kill(-server.pid, 'SIGKILL');
    } catch {
      server.kill('SIGKILL');
    }
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} kontrol geçti`);
  if (failed.length > 0) {
    console.error('Başarısız:', failed.map((f) => f.name).join(', '));
  }
  // Açık soketler yüzünden olay döngüsü boşalmayabilir; sonucu netleştirip çıkıyoruz.
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
