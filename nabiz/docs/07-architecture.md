# PHASE 7 — Technical Architecture

## 7.1 Stack karşılaştırması

| | A: Next.js + Supabase + Vercel | B: Next.js + Firebase | C: **Next.js + Postgres(Neon) + Cloudflare** |
|---|---|---|---|
| Realtime | Supabase Realtime (hazır) | Firestore listener (hazır) | Durable Object + SSE (yazman gerek) |
| Yazma maliyeti (oy) | ucuz (Postgres) | **pahalı — doküman yazımı başına ücret** | en ucuz (DO içinde toplama) |
| Analitik sorgu | ✔ SQL | ✘ zayıf | ✔ SQL |
| Ölçek tepe anı (viral) | orta (connection limit) | ✔ | ✔✔ (edge) |
| Vendor lock | orta | yüksek | düşük |
| Kurulum hızı | **en hızlı** | hızlı | orta |
| $0–20/ay hedefi | ✔ | ✘ (oy hacmi patlarsa fatura patlar) | ✔✔ |

**Karar: A ile başla, sıcak yolu C'ye taşı.**
Gerekçe: MVP'de hız > mükemmellik; Supabase ile 1 haftada canlıya çıkılır. Ama **oy yazma yolu**
en riskli yer (viral tepe anında saniyede binlerce yazma). O yüzden oy yolu ilk günden
**Cloudflare Worker + Durable Object** üzerinde tamponlanır, Postgres'e toplu yazılır.
Firebase reddedildi: oy başına yazma ücreti bu ürünün maliyet eğrisini yıkar.

## 7.2 Mimari

```
 Kullanıcı (mobil web)
   │  POST /api/vote            GET /api/results (SSE)
   ▼
 Cloudflare Worker  ── rate limit (IP+ASN), bot skoru, idempotency ──┐
   │                                                                 │
   ▼                                                                 │
 Durable Object (soru başına bir tane)                               │
   ├─ bellekte sayaç (+ şehir kırılımı)                              │
   ├─ bağlı istemcilere SSE broadcast (anlık sonuç)                   │
   └─ her 5 sn / 500 oy → toplu yazma ────────────────────────────►  │
                                                                     ▼
                                             Postgres (Neon/Supabase)
                                             ├─ votes (ham, partitioned)
                                             ├─ vote_aggregates (okuma yolu)
                                             └─ suspicious_votes (karantina)
                                                     │
                                       ┌─────────────┴─────────────┐
                                       ▼                           ▼
                              Next.js (Vercel/Pages)          Admin panel
                              ISR + edge cache                  (ayrı app)
                              OG kart üretimi (Satori)
```

**Kritik kural:** okuma yolu asla `COUNT(*)` yapmaz. Sonuçlar her zaman `vote_aggregates`
tablosundan veya DO belleğinden gelir. Bu tek kural, ürünün 1M oyda da 100M oyda da
aynı hızda kalmasını sağlar.

**Anlık sonuç vs kesin sonuç:** Kullanıcıya DO belleğindeki sayı gösterilir (anlık, optimistic).
Gece çalışan bir iş, ham oyları anti-abuse kurallarıyla yeniden değerlendirir ve
`vote_aggregates`'i düzeltir. Gösterilen ile arşivlenen sayının farkı şeffaflık sayfasında açıklanır.

## 7.3 Cache stratejisi
| İçerik | Strateji | TTL |
|---|---|---|
| Soru sayfası HTML | ISR + edge cache | 60 sn |
| Sonuç verisi | SSE canlı; ilk yükte edge cache | 5 sn |
| Şehir/kategori sayfaları | ISR | 5 dk |
| OG paylaşım kartı | edge cache, immutable key (soru+tur+dakika) | 1 saat |
| Arşiv/kapanmış sorular | tam statik | 1 gün |

## 7.4 Maliyet projeksiyonu

| Aşama | Aylık oy | Altyapı | Maliyet/ay |
|---|---|---|---|
| Başlangıç | < 500K | Vercel Hobby + Neon free + CF free | **$0** |
| 10K MAU | ~1M | + domain | **$0–5** |
| 100K MAU | ~10M | Vercel Pro veya CF Pages + Neon Launch | **$25–45** |
| 1M MAU | ~120M | CF Workers paid + Neon Scale + R2 (kart cache) | **$150–300** |

$0–20/ay hedefi 10K MAU'ya kadar gerçekçi; 100K MAU'da ~$40. Bu, Base senaryodaki gelirle
rahatlıkla karşılanır.

## 7.5 Repo yapısı
```
nabiz/
├── apps/
│   ├── web/          # Next.js — public site (App Router, RSC)
│   ├── admin/        # Next.js — admin panel (auth zorunlu)
│   └── edge/         # Cloudflare Worker + Durable Objects (vote hot path)
├── packages/
│   ├── db/           # Drizzle şema + migration'lar
│   ├── core/         # domain mantığı (oylama, agregasyon, sezon kuralları)
│   ├── abuse/        # anti-abuse kuralları (saf fonksiyonlar, test edilebilir)
│   ├── share/        # OG kart üretimi (Satori)
│   ├── ui/           # paylaşılan bileşenler + tasarım token'ları
│   └── config/       # tsconfig, eslint, tailwind preset
├── infra/            # migration runner, cron job'lar, IaC
├── docs/
└── tests/            # e2e (Playwright), yük testleri (k6)
```

## 7.6 Deployment & operasyon
- **Domain/DNS/SSL:** Cloudflare (DNS + WAF + SSL). `nabiz.io` ana, `turkiyenediyor.com` 301.
- **CI/CD:** GitHub Actions → lint + typecheck + unit + e2e → preview deploy → main'e merge'de prod.
- **Migration:** ileriye uyumlu, iki aşamalı (expand/contract); deploy'u bloke etmez.
- **Backup:** Neon PITR (7 gün) + günlük `vote_aggregates` dökümü R2'ye.
- **Monitoring:** uptime (health endpoint), oy/sn grafiği, hata oranı, p95 gecikme.
- **Error tracking:** Sentry (free tier), PII gönderimi kapalı.
- **Analytics:** Plausible/Umami — **çerezsiz**, KVKK dostu, çerez banner'ı gerektirmez.
- **Loglama:** oy loglarında ham IP saklanmaz; sadece tuzlanmış hash (bkz. Faz 11).
- **Secrets:** yalnızca platform env store'da; repoda `.env.example` dışında hiçbir şey yok.
