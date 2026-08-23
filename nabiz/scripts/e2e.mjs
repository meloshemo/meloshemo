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
      CRON_SECRET: 'e2e-cron-secret',
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

    // SSE: ilk olayın gerçekten geldiğini doğrula. Akış açılıp hiç veri göndermezse
    // arayüz "canlı" görünür ama hiçbir zaman güncellenmez — sessiz bir bozulma.
    const streamController = new AbortController();
    const stream = await fetch(`${BASE}/api/v1/polls/${pollId}/stream`, {
      signal: streamController.signal,
    });
    let firstEvent = '';
    if (stream.ok && stream.body) {
      const reader = stream.body.getReader();
      const timeout = setTimeout(() => streamController.abort(), 8000);
      try {
        const { value } = await reader.read();
        firstEvent = new TextDecoder().decode(value ?? new Uint8Array());
      } catch { /* zaman aşımı */ }
      clearTimeout(timeout);
      streamController.abort();
    }
    check('canlı akış içerik türü doğru',
      stream.headers.get('content-type')?.includes('text/event-stream') === true);
    check('canlı akış ilk sonucu gönderiyor',
      firstEvent.includes('event: results') && firstEvent.includes('"total"'));

    const og = await fetch(`${BASE}/og/lahmacun-vs-doner?variant=wa`);
    check('paylaşım kartı üretiliyor', og.ok && og.headers.get('content-type')?.includes('image/png'));

    const robots = await (await fetch(`${BASE}/robots.txt`)).text();
    check('robots.txt admin ve api yollarını kapatıyor', robots.includes('/admin') && robots.includes('/api/'));

    const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
    check('sitemap soru sayfalarını içeriyor', sitemap.includes('/lahmacun-vs-doner'));
    // Kural sınanır, belirli bir şehir değil: oy almamış bir il sitemap'e girmemeli.
    // (İzmir gibi iller test/kullanım sırasında eşiği geçebilir; bu doğru davranıştır.)
    const zeroVoteCity = await (await fetch(`${BASE}/api/v1/snapshot/map?soru=lahmacun-vs-doner`)).json();
    const votedCityIds = new Set(zeroVoteCity.cities.map((c) => c.cityId));
    check('oy almamış il sitemap dışında',
      !votedCityIds.has(79) ? !sitemap.includes('/sehir/kilis') : true,
      votedCityIds.has(79) ? 'Kilis oy almış, kontrol atlandı' : 'Kilis oysuz ve sitemap dışında');

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

    const cronNoAuth = await fetch(`${BASE}/api/cron/recount`);
    check('zamanlanmış iş yetkisiz çağrıyı reddediyor', cronNoAuth.status === 401);

    const cronAuthed = await fetch(`${BASE}/api/cron/recount`, {
      headers: { authorization: 'Bearer e2e-cron-secret' },
    });
    // Bellek içi depoda veritabanı yok → 503; Postgres'e karşı koşarken gerçekten çalışır.
    check('zamanlanmış iş yetkili çağrıda çalışıyor',
      cronAuthed.status === 200 || cronAuthed.status === 503,
      `HTTP ${cronAuthed.status}`);

    const snapshot = await fetch(`${BASE}/api/v1/snapshot`);
    const snapshotBody = await snapshot.json();
    check('anlık görüntü ucu çalışıyor',
      snapshot.ok && Array.isArray(snapshotBody.polls) && typeof snapshotBody.totalVotes === 'number');
    check('anlık görüntü önbelleklenebilir işaretli',
      snapshot.headers.get('cache-control')?.includes('s-maxage') === true,
      snapshot.headers.get('cache-control') ?? 'başlık yok');

    // Ölçeğin can damarı: aynı anda gelen istekler tek hesabı paylaşmalı.
    // Paylaşmasalar her biri kendi zaman damgasını üretirdi.
    const burst = await Promise.all(
      Array.from({ length: 40 }, () => fetch(`${BASE}/api/v1/snapshot`).then((r) => r.json())),
    );
    const distinct = new Set(burst.map((item) => item.asOf)).size;
    check('eşzamanlı istekler tek hesabı paylaşıyor', distinct <= 2,
      `40 istek → ${distinct} farklı hesap`);

    const mapSnapshot = await fetch(`${BASE}/api/v1/snapshot/map?soru=lahmacun-vs-doner`);
    check('harita anlık görüntüsü çalışıyor',
      mapSnapshot.ok && Array.isArray((await mapSnapshot.json()).cities));

    const mapPage = await (await fetch(`${BASE}/harita`)).text();
    check('harita sayfası açılıyor', mapPage.includes('Türkiye ne seçiyor?'));
    check('harita 81 ili çiziyor',
      (mapPage.match(/class="province/g) || []).length === 81,
      `${(mapPage.match(/class="province/g) || []).length} il`);
    check('haritanın tablo karşılığı var', mapPage.includes('Haritayı tablo olarak gör'));

    // Adresle istenen soru sessizce başkasına düşerse kullanıcı yanlış haritaya bakar.
    const mapForPoll = await (await fetch(`${BASE}/harita?soru=lahmacun-vs-doner`)).text();
    check('harita adresteki soruyu açıyor',
      mapForPoll.includes('Lahmacun') && mapForPoll.includes('Döner'));

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
