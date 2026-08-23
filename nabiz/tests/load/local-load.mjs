/**
 * Bağımlılıksız yerel yük koşucusu.
 *
 * k6'nın yerini tutmaz — tek makinede, istemci ve sunucu aynı CPU'yu paylaşarak koşar.
 * Amacı mutlak kapasiteyi ölçmek değil, DARBOĞAZIN NEREDE olduğunu görmek:
 * veritabanı bağlantı havuzu mu, hız limiti mi, uygulama mı.
 *
 * Her istek farklı bir x-real-ip taşır; aksi hâlde hepsi tek IP'den gelmiş sayılır ve
 * hız limiti daha ilk saniyede devreye girerek testi anlamsızlaştırır.
 *
 *   node tests/load/local-load.mjs --url http://127.0.0.1:3000 --rps 200 --seconds 20
 */
import { randomUUID } from 'node:crypto';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
}
const BASE = args.get('url') ?? 'http://127.0.0.1:3000';
const RPS = Number(args.get('rps') ?? 100);
const SECONDS = Number(args.get('seconds') ?? 15);

const feed = await (await fetch(`${BASE}/api/v1/feed?limit=50`)).json();
if (!feed.items?.length) throw new Error('Akışta soru yok — önce seed çalıştır');

const latencies = [];
const statuses = new Map();
let inFlight = 0;
let peakInFlight = 0;

async function fire(i) {
  const poll = feed.items[i % feed.items.length];
  const option = poll.options[i % poll.options.length];
  const started = performance.now();
  inFlight += 1;
  peakInFlight = Math.max(peakInFlight, inFlight);

  try {
    const response = await fetch(`${BASE}/api/v1/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (iPhone)',
        'x-real-ip': `85.${(i >> 16) % 256}.${(i >> 8) % 256}.${i % 256}`,
      },
      body: JSON.stringify({
        optionId: option.id,
        clientToken: randomUUID(),
        cityId: 1 + (i % 81),
        decisionMs: 1200 + (i % 4000),
        hadInteraction: true,
      }),
    });
    statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
    await response.arrayBuffer();
  } catch (error) {
    statuses.set(String(error.message), (statuses.get(String(error.message)) ?? 0) + 1);
  } finally {
    inFlight -= 1;
    latencies.push(performance.now() - started);
  }
}

console.log(`${RPS} istek/sn × ${SECONDS} sn → ${BASE}`);
const pending = [];
const started = performance.now();
let counter = 0;

for (let second = 0; second < SECONDS; second++) {
  const tickStart = performance.now();
  for (let i = 0; i < RPS; i++) pending.push(fire(counter++));
  const elapsed = performance.now() - tickStart;
  if (elapsed < 1000) await new Promise((r) => setTimeout(r, 1000 - elapsed));
}
await Promise.all(pending);

const wall = (performance.now() - started) / 1000;
latencies.sort((a, b) => a - b);
const pct = (p) => latencies[Math.floor((latencies.length - 1) * p)].toFixed(0);

console.log(`\ntoplam istek: ${latencies.length} · süre: ${wall.toFixed(1)} sn · gerçekleşen: ${(latencies.length / wall).toFixed(0)} istek/sn`);
console.log(`gecikme  p50 ${pct(0.5)} ms · p95 ${pct(0.95)} ms · p99 ${pct(0.99)} ms · max ${pct(1)} ms`);
console.log(`eş zamanlı tepe: ${peakInFlight}`);
console.log('yanıtlar:', Object.fromEntries([...statuses].sort((a, b) => b[1] - a[1])));
