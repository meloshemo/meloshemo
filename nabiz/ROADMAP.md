# Nabız — Çalışma Planı

## ✅ Strateji fazı tamamlandı
| Faz | Doküman |
|---|---|
| 0 Executive Summary | `docs/00-executive-summary.md` |
| 1 Market Research | `docs/01-market-research.md` |
| 2 Competitor Analysis | `docs/02-competitor-analysis.md` |
| 3 Product Strategy & MVP Scope | `docs/03-product-strategy.md` |
| 4 Brand & Naming | `docs/04-brand.md` |
| 4b İsim kararı (nihai) | `docs/04b-isim-karari.md` |
| 5 Business Model & Unit Economics | `docs/05-business-model.md` |
| 6 UX/UI Specification | `docs/06-ux-ui-spec.md` |
| 7 Technical Architecture | `docs/07-architecture.md` |
| 8 Database Schema | `docs/08-database.md` |
| 9 API Specification | `docs/09-api-spec.md` |
| 10 Admin Panel | `docs/10-admin-panel.md` |
| 11 Anti-Abuse | `docs/11-anti-abuse.md` |
| 12 SEO & Programmatic SEO | `docs/12-seo.md` |
| 13 Growth Strategy | `docs/13-growth.md` |
| 14 Launch Plan | `docs/14-launch.md` |
| 15 Monetization | `docs/15-monetization.md` |
| 16 Scaling & Global | `docs/16-scaling-and-global.md` |
| — Risk Analizi (20 risk) | `docs/17-risks.md` |
| — Legal / KVKK | `docs/18-legal-kvkk.md` |
| — İlk 100 soru | `docs/19-ilk-100-soru.md` |
| — Pitch Deck | `docs/20-pitch-deck.md` |

## ✅ Uygulama (MVP)
- [x] **H1** Monorepo · alan mantığı (`packages/core`) · Drizzle şema · 81 il + açılış soruları seed
- [x] **H1** Oy yolu: idempotency, hız limiti, güven puanlaması, karantina
- [x] **H2** Web: ana akış, oy kartı, sonuç geçişi, şehir kırılımı
- [x] **H2** OG paylaşım kartı üretimi (WhatsApp / Story / X)
- [x] **H3** SEO: soru/şehir/kategori sayfaları, sitemap eşik kuralı, robots, schema.org
- [x] **H3** Admin panel: soru oluşturma, editoryal kontrol listesi (sunucu tarafında zorunlu), metrikler
- [x] **H4** Postgres deposu · gece yeniden sayım işi · küme anormalliği tespiti
- [x] **H4** 52 birim testi + 20 uçtan uca kontrol + CI iş akışı

- [x] Migration dosyaları + gerçek Postgres üzerinde doğrulama (21/21 uçtan uca)
- [x] Seed işi (81 il, kategoriler, açılış soruları) — idempotent
- [x] Yasal metin taslakları: gizlilik, KVKK aydınlatma, kullanım koşulları
- [x] Yük testi altyapısı (k6 senaryosu + bağımlılıksız yerel koşucu) ve ilk profilleme
- [x] Deployment planı (`docs/22-deployment.md`)
- [x] CI artık gerçek Postgres servisiyle koşuyor
- [x] Şehir seçimi arayüzü (kapsam boşluğuydu: çerez okunuyor ama hiçbir yerde yazılmıyordu)
- [x] Yükselenler (pay değişimine göre) ve günün şampiyonu bölümleri

## 🔜 Sırada
- [ ] Canlı SSE akışı (Durable Object) — trafik paralelleşince
- [ ] Sezon / turnuva mekaniği — **MVP retention verisi gelmeden başlanmaz**
- [ ] Yasal metinlerin avukat kontrolü ve taslak uyarısının kaldırılması
- [ ] k6 ile ayrı makineden gerçek kapasite ölçümü (hedef: 500 oy/sn'de p95 < 300 ms)
- [ ] Prod deploy (`docs/22` kontrol listesi)
- [ ] **Day 30** kapı metrikleri değerlendirmesi (bkz. `docs/14-launch.md`)

**Sezon/turnuva Ay 2'de** — MVP retention verisi gelmeden yapılmaz.

## Kod standardı (bağlayıcı)
TypeScript strict · modüler · test edilebilir · secret repoya girmez ·
MVP diye güvenlikten ödün verilmez · gereksiz enterprise karmaşıklık yok.
