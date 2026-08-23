# Nabız 🇹🇷 — nabiz.io

**Türkiye şu anda neyi seçiyor?**

Nabız, Türkiye'nin kolektif tercihlerini canlı olarak gösteren bir platformdur.
Üyelik yok, uygulama yok, form yok — tek dokunuşla oy, anında sonuç,
Türkiye geneli ve şehir kırılımı.

> Bu bir anket sitesi değildir. Kullanıcı oy vermeye değil, **sonucu görmeye** gelir.

## Durum

🟢 **MVP çalışıyor.** Strateji `docs/` altında tamamlandı; uygulama oy verilebilir hâlde.

Çalıştırmak için:

```bash
npm install
npm run dev          # DATABASE_URL yoksa bellek içi depo + seed veriyle açılır
npm test             # 52 birim testi
npm run test:e2e     # üretim derlemesini başlatıp 21 uçtan uca kontrol
                     # DATABASE_URL verilirse gerçek Postgres'e karşı koşar

# Postgres ile
npm run db:migrate && npm run seed
```

Ortam değişkenleri için `.env.example`, bilinçli sapmalar için
[`docs/21-uygulama-notlari.md`](docs/21-uygulama-notlari.md).

### MVP'de olanlar
Oy verme (idempotent, hız limitli, şüpheli oy karantinalı) · anlık sonuç + şehir kırılımı ·
SEO'lu soru sayfaları + schema.org · şehir ve kategori sayfaları · eşik kurallı sitemap ·
dinamik paylaşım kartları (WhatsApp / Story / X) · admin paneli + editoryal kontrol listesi ·
metodoloji sayfası · Postgres deposu, migration'lar, seed ve gece yeniden sayım işi ·
gizlilik/KVKK/kullanım koşulları taslakları · k6 yük testi senaryosu.

### Henüz olmayanlar
Canlı SSE akışı · turnuva/Sezon mekaniği · hesap ve rozetler · sponsorluk altyapısı.

| Faz | Doküman |
|---|---|
| Executive Summary | [`docs/00-executive-summary.md`](docs/00-executive-summary.md) |
| Market Research | [`docs/01-market-research.md`](docs/01-market-research.md) |
| Competitor Analysis | [`docs/02-competitor-analysis.md`](docs/02-competitor-analysis.md) |
| Product Strategy & MVP Scope | [`docs/03-product-strategy.md`](docs/03-product-strategy.md) |
| Brand & Naming | [`docs/04-brand.md`](docs/04-brand.md) |
| İsim kararı | [`docs/04b-isim-karari.md`](docs/04b-isim-karari.md) |
| Diğer tüm fazlar (5–16, risk, legal, 100 soru, pitch) | [`docs/`](docs/) |
| Yol haritası | [`ROADMAP.md`](ROADMAP.md) |

## İlkeler

1. Sonuç ürünün kendisidir; oy vermek sonucu görmenin bedelidir.
2. Sıfır sürtünme her şeyden önce gelir — ilk oy 3 saniyede verilmeli.
3. Paylaşılamayan ekran eksik ekrandır.
4. Şeffaflık güvendir: toplam oy, zaman damgası, metodoloji her sonuçta görünür.
5. Siyaset, nefret, kişisel saldırı ve hassas veri → asla.

## Metodoloji uyarısı

Nabız bilimsel kamuoyu araştırması değildir. Tüm sonuçlar
*"platform kullanıcılarının oylarına göre"* ifadesiyle sunulur.

## Lisans

Henüz belirlenmedi.
