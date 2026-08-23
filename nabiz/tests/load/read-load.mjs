/**
 * Okuma yolu yük ölçümü — 50.000 eşzamanlı kullanıcı senaryosunun kritik sorusu:
 * kullanıcı sayısı arttıkça VERİTABANI yükü artıyor mu?
 *
 * Bu koşu tek makinede yapılır; mutlak kapasite değil, ÖLÇEKLENME DAVRANIŞI ölçülür:
 * istek sayısı iki katına çıkınca kaynak sorgu sayısı da iki katına çıkıyor mu?
 *
 *   node tests/load/read-load.mjs --url http://127.0.0.1:3000 --rps 200 --seconds 10
 */
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);

const BASE = args.get('url') ?? 'http://127.0.0.1:3000';
const RPS = Number(args.get('rps') ?? 100);
const SECONDS = Number(args.get('seconds') ?? 10);
const PATH = args.get('path') ?? '/api/v1/snapshot';

const latencies = [];
const statuses = new Map();
const ages = new Set();

async function hit() {
  const started = performance.now();
  try {
    const response = await fetch(`${BASE}${PATH}`);
    statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
    const body = await response.json();
    // Aynı 'asOf' değerini gören istekler, kaynağa GİTMEYEN isteklerdir.
    if (body.asOf) ages.add(body.asOf);
  } catch (error) {
    statuses.set(error.message, (statuses.get(error.message) ?? 0) + 1);
  }
  latencies.push(performance.now() - started);
}

console.log(`${PATH} · ${RPS} istek/sn × ${SECONDS} sn`);
const pending = [];
const started = performance.now();
for (let second = 0; second < SECONDS; second++) {
  const tick = performance.now();
  for (let i = 0; i < RPS; i++) pending.push(hit());
  const elapsed = performance.now() - tick;
  if (elapsed < 1000) await new Promise((r) => setTimeout(r, 1000 - elapsed));
}
await Promise.all(pending);

latencies.sort((a, b) => a - b);
const pct = (p) => latencies[Math.floor((latencies.length - 1) * p)].toFixed(0);
const wall = (performance.now() - started) / 1000;

console.log(`istek: ${latencies.length} · gerçekleşen: ${(latencies.length / wall).toFixed(0)}/sn`);
console.log(`gecikme p50 ${pct(0.5)} ms · p95 ${pct(0.95)} ms · p99 ${pct(0.99)} ms`);
console.log(`farklı anlık görüntü sayısı: ${ages.size} (bu kadar kez taze veri üretildi)`);
console.log('yanıtlar:', Object.fromEntries(statuses));
