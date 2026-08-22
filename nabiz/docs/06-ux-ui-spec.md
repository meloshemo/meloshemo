# PHASE 6 — UX/UI Specification

Mobile-first. Tasarım hedefi: **ilk oy ≤ 3 saniye**, sonuç ≤ 400 ms.

## 6.0 Tasarım dili
- Koyu zemin varsayılan (`#0B0D12`) — sonuç barları ve rakamlar üstünde parlar, OLED'de pil dostu.
- Grid: 4pt. Kenar boşluğu 16px. İçerik max-width 480px (mobil), 640px (masaüstü) — geniş ekranda
  bile tek kolon; bu ürün "feed" değil, "kart".
- Dokunma hedefi min 44×44px. Ana oy kartları ekran yüksekliğinin %30'u.
- Tipografi: başlık 24/28 semibold, seçenek 20/24 medium, yüzde 40/44 **tabular** bold.
- Hareket: 150–400 ms, `cubic-bezier(0.22, 1, 0.36, 1)`. `prefers-reduced-motion` → tüm süreler 0,
  sonuç anında görünür (animasyon bilgiyi taşımaz, sadece süsler).

## 6.1 Ekran 1 — Homepage
Scroll gerektirmeden ilk ekranda **soru vardır**. Hero, açıklama, "hoş geldiniz" metni YOKTUR.

```
┌─────────────────────────────┐
│ NABIZ            🔴 CANLI   │  ← toplam oy sayacı, saniyede artan
│ 1.284.392 oy                │
├─────────────────────────────┤
│ Türkiye'nin en sevdiği      │
│ yemek hangisi?              │
│                             │
│  ┌────────┐   ┌────────┐    │
│  │  🥙    │   │  🥩    │    │  ← iki büyük kart, yan yana (mobilde de)
│  │LAHMACUN│   │ DÖNER  │    │
│  └────────┘   └────────┘    │
│        Sen seç.             │
├─────────────────────────────┤
│ ↓ (oy sonrası açılır)       │
└─────────────────────────────┘
```
Alt bölümler (oy verdikten sonra scroll ile): 📈 Yükselenler · 🏆 Günün şampiyonu ·
🏙️ Şehrin ne diyor · 🗓️ Aktif sezon (tur ve geri sayım).

## 6.2 Ekran 2 — Poll (her sorunun kendi URL'i)
Homepage'in tek soru hâli + SEO içeriği (aşağıda görünür, oy akışını bölmez):
soru başlığı H1, sonuç tablosu, şehir kırılımı, "metodoloji" linki, ilgili sorular.

## 6.3 Ekran 3 — Result (ayrı sayfa değil, aynı kartın hâli)
Sayfa geçişi **yok**. Kart yerinde dönüşür:
```
LAHMACUN ████████████░░░░ %54.2   ✔ senin oyun
DÖNER    █████████░░░░░░░ %45.8
─────────────────────────────
🇹🇷 Türkiye  %54.2  ·  📍 İzmir  %61.3
128.402 oy · 22 Ağu 23:14 · nasıl sayıyoruz?
[ Paylaş ]        [ Sıradaki soru → ]
```
Kurallar: kendi oyun her zaman işaretli · şehir kırılımı sadece o şehirde ≥100 oy varsa
gösterilir (yoksa "İzmir'de henüz yeterli oy yok") · yüzde yanında ham sayı her zaman.

## 6.4 Ekran 4 — Trending
Son 24 saatte yüzdesi en çok değişen seçenekler. Her satır: seçenek, delta (+%12.4, yeşil),
mini sparkline, ait olduğu soru. Tıklama → o soruya oy verme.

## 6.5 Ekran 5 — City (`/sehir/izmir`)
Şehrin kimlik sayfası: "İzmir ne diyor?" · şehrin Türkiye'den **en çok ayrıştığı** 5 tercih
(en ilginç içerik bu) · şehrin katılım sırası (81 il içinde kaçıncı) · şehir vs şehir düellosu CTA.
Bu sayfa programmatic SEO'nun ana varlığıdır.

## 6.6 Ekran 6 — Category (`/kategori/yemek`)
Kategorideki tüm sorular, güncel şampiyon, kategori sezonu, arşiv.

## 6.7 Ekran 7 — Tournament / Sezon
Bracket görünümü mobilde **dikey tur listesi**, masaüstünde klasik ağaç. Her turda: geri sayım,
aktif eşleşmeler, kullanıcının tahmin skoru. Tur bitince sonuç kilitlenir ve rozetlenir.

## 6.8 Ekran 8 — Leaderboard
Kullanıcı değil, **seçenek ve şehir** sıralaması (hesap yok). "En çok oy alan 50 seçenek",
"en aktif 20 şehir (nüfusa göre normalize)". Normalizasyon şart — yoksa hep İstanbul kazanır ve
içerik sıkıcılaşır.

## 6.9 Ekran 9 — Search
Tek input, anlık sonuç: sorular, seçenekler, şehirler, kategoriler. Boş hâlde popüler aramalar.

## 6.10 Ekran 10 — Share
Modal değil, doğrudan native share sheet. Sıralama: **WhatsApp → Instagram Story → X → Kopyala**.
Otomatik üretilen görsel kart (3 format, bkz. Faz 4). Her kartta: soru, iki yüzde, kullanıcının
seçimi, toplam oy, tarih, `nabiz.io`.

## 6.11 Ekran 11 — Admin dashboard
Bkz. `docs/10-admin-panel.md`.

## 6.12 Mikro animasyonlar (oy anı)
```
0ms    dokunuş → kart %97 ölçek + haptic (10ms)
80ms   diğer kart soluklaşır
120ms  kartlar yatay bara dönüşür (shared element)
150ms  yüzdeler 0'dan gerçek değere sayar (300ms, ease-out)
300ms  senin seçimine ✔ damgası
400ms  şehir satırı aşağıdan kayarak girer
600ms  [Paylaş] ve [Sıradaki] görünür
```
Toplam 600 ms. Daha uzunu addictive değil, yorucu olur. Sayaç zıplamasın diye tabular rakam şart.

## 6.13 Accessibility (MVP'den itibaren, WCAG 2.2 AA)
- Kontrast ≥ 4.5:1; sonuç barları renk *dışında* yüzde etiketiyle de ayrışır.
- Oy kartları gerçek `<button>`; klavye ile Tab + Enter çalışır; focus ring görünür (2px).
- Sonuç `aria-live="polite"` ile duyurulur: "Lahmacun yüzde 54.2, senin seçimin".
- `prefers-reduced-motion` desteklenir. Sayfa 200% zoom'da bozulmaz.
- Emoji'ler dekoratiftir → `aria-hidden`; anlam metinde taşınır.
- Dil `lang="tr"`; Türkçe karakterler ve `İ/ı` ayrımı fontta doğrulanır.
