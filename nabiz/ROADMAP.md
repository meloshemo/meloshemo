# Nabız — Çalışma Planı

Strateji önce, kod sonra. Faz 1–4 tamamlandı (`docs/`). Sıradaki fazlar aşağıda,
her biri ayrı doküman + onay adımı ile ilerler.

## Sırada (strateji)
- [ ] **PHASE 5 — Business Model & Unit Economics**: 3 senaryo (10K / 100K / 1M MAU), CAC/ARPU/LTV, sponsorlu sezon fiyatlandırması, "Türkiye'nin Seçimi" ödül programının ticari + hukuki modeli.
- [ ] **PHASE 6 — UX/UI Spec**: 11 ekran (home, poll, result, trending, city, category, tournament, leaderboard, search, share, admin), mobile-first, mikro animasyonlar, WCAG 2.2 AA, reduced-motion.
- [ ] **PHASE 7 — Technical Architecture**: stack karşılaştırması (Next.js+Supabase+Vercel vs Firebase vs Cloudflare-native), realtime yolu, cache katmanları, $0–20/ay hedefi ve 10K/100K/1M ölçek maliyetleri.
- [ ] **PHASE 8 — Database Schema**: PostgreSQL şema + ilişkiler + agregasyon tabloları (hot path'te COUNT yok).
- [ ] **PHASE 9 — API Spec**: endpointler, oy idempotency, hız limitleri, hata sözleşmesi.
- [ ] **PHASE 10 — Admin Panel**: soru CRUD, zamanlama, editoryal kontrol listesi (siyaset/nefret filtresi), şüpheli oy paneli, metrikler.
- [ ] **PHASE 11 — Anti-Abuse**: katmanlı savunma (cookie → IP/ASN hız limiti → davranış sinyalleri → seçici CAPTCHA), fingerprint'in KVKK sınırları, "gösterilen sonuç" vs "kayda geçen sonuç" ayrımı.
- [ ] **PHASE 12 — SEO & Programmatic SEO**: soru sayfaları, şehir×kategori kombinasyonları, spam'e dönüşmeden ölçekleme kuralları (her sayfa gerçek veri eşiği geçmeden index'lenmez).
- [ ] **PHASE 13 — Growth**: 100 / 1K / 10K / 100K / 1M için ayrı planlar; TikTok–Reels–WhatsApp odaklı.
- [ ] **PHASE 14 — Launch Plan**: Day 0 / 1 / 7 / 30 ve ilk viral sorular.
- [ ] **PHASE 15 — Monetization uygulaması**
- [ ] **PHASE 16 — Scaling & Global (Pulse)**
- [ ] **EK** — 100 başlangıç sorusu, risk analizi (20 risk + çözüm), KVKK/GDPR kontrol listesi, pitch deck.

## Sonra (kod — strateji onaylanınca)
- [ ] Monorepo iskeleti (`apps/web`, `apps/admin`, `packages/*`, `infra/`)
- [ ] Şema + migration'lar
- [ ] Vote API + anti-abuse v1
- [ ] Realtime sonuç
- [ ] OG paylaşım kartı üretimi
- [ ] Admin panel
- [ ] Test + CI + deploy

## Kod standardı (kodlamaya geçildiğinde bağlayıcı)
TypeScript strict · modüler · test edilebilir · secret repo'ya girmez ·
MVP diye güvenlikten ödün verilmez · gereksiz enterprise karmaşıklık yok.
