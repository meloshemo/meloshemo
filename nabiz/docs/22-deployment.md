# Deployment

## Hedef kurulum (MVP)
| Katman | Seçim | Aylık maliyet |
|---|---|---|
| Uygulama | Vercel (Hobby → Pro) veya Cloudflare Pages | $0 → $20 |
| Veritabanı | Neon Postgres (Free → Launch) | $0 → $19 |
| DNS / CDN / WAF | Cloudflare | $0 |
| Hata takibi | Sentry (free tier, PII kapalı) | $0 |
| Ölçümleme | Plausible/Umami (çerezsiz) | $0–9 |
| Domain | `nabiz.io` + `turkiyenediyor.com` | ~$5/ay |

## Zorunlu ortam değişkenleri (üretim)
`DATABASE_URL` · `SESSION_SECRET` (≥32) · `VOTE_HASH_SALT` · `NEXT_PUBLIC_SITE_URL`
İsteğe bağlı: `ADMIN_TOKEN` (≥24, yoksa admin kapalı) · `DATABASE_POOL_MAX`
(serverless'ta 5, uzun ömürlü sunucuda 10–20).

**Uygulama, `DATABASE_URL` olmadan üretim modunda açılmaz.** Bu bilinçli bir kapıdır:
sessizce bellek içi depoya düşen bir kurulum, tüm oyları ilk yeniden başlatmada kaybeder.

## İlk kurulum
```bash
npm ci
npm run db:migrate     # şema
npm run seed           # 81 il, kategoriler, açılış soruları
npx next build apps/web
```

## Zamanlanmış işler
| İş | Sıklık | Komut |
|---|---|---|
| Gece yeniden sayım + anormallik taraması | Günlük 04:00 TSİ | `npm run recount` |
| Yedek doğrulama (PITR dışında ayrıca döküm) | Günlük | sağlayıcı aracı |

## DNS / SSL
`nabiz.io` A/CNAME → uygulama sağlayıcısı · `turkiyenediyor.com` → 301 yönlendirme ·
SSL Cloudflare üzerinden (Full strict) · HSTS açık.

## Yedekleme
Neon PITR (7 gün) + günlük `vote_aggregates` ve `vote_timeseries` dökümü nesne depolamaya.
**Kritik ayrım:** ham `votes` tablosu 180 günde silinir; asıl değer olan toplu sayımlar
ve zaman serileri süresiz saklanır — yedekleme önceliği bunlardır.

## İzleme (ilk günden)
Uptime kontrolü (`/api/v1/feed`) · oy/sn grafiği · 5xx oranı · p95 gecikme ·
karantina oranı (sağlıklı aralık %2–8; dışına çıkarsa eşikler yanlış demektir).

## Yayın öncesi kontrol listesi
- [ ] Ortam değişkenleri tanımlı, `SESSION_SECRET` ve `VOTE_HASH_SALT` rastgele üretilmiş
- [ ] `ADMIN_TOKEN` güçlü ve yalnızca sahipte
- [ ] Migration'lar uygulanmış, seed yüklenmiş
- [ ] Yedekleme ve PITR doğrulanmış (geri yükleme bir kez denenmiş)
- [ ] Hukuki metinler avukat kontrolünden geçmiş, taslak uyarısı kaldırılmış
- [ ] Yük testi (k6, ayrı makineden) 500 oy/sn altında p95 < 300 ms
- [ ] Sentry ve uptime alarmları çalışıyor
