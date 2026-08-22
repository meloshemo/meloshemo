# PHASE 3 — Product Strategy & Positioning

## 3.1 Orijinallik: dürüst cevap

**Fikir yeni değil.** Bileşenlerin hepsi mevcut: ikili oylama (StrawPoll), bracket (March Madness türevleri), coğrafi kırılım (YouGov Ratings, seçim haritaları), canlı sayaç (her realtime dashboard).

**Yeni olan şey kombinasyon değil, kombinasyonun *yerelliği*:** "Türkiye'nin kolektif tercih arşivi" diye bir varlık yok. Bu, ürün yeniliği değil **kategori sahiplenme** oyunudur. Kazanan, en iyi kodu yazan değil, insanların kafasında "Türkiye ne diyor?" sorusuyla eşleşen ilk marka olur.

Bunun sonucu net: **teknoloji değil, dağıtım ve marka yatırımı yapılmalı.** Eğer 6 ay mühendislik yapıp 1 ay pazarlama yaparsan proje ölür.

### Bu haliyle başarısız olacağı senaryo
Master prompt'taki haliyle ürün, **"tek seferlik eğlence"** kapanına düşer: kullanıcı gelir, 3 soru oylar, gider, bir daha dönmez. Sebep: kullanıcının geri dönmek için hiçbir *bekleyen sonucu* yoktur.

### Güçlü hale getiren değişiklik (asıl öneri)
Ürünün merkezine tekil anketi değil, **"Sezon"** kavramını koy:

> Her ay bir **Sezon** açılır: örn. *"Türkiye'nin Yemek Şampiyonası — Eylül 2026"*, 32 yemek, 5 tur, her tur 3 gün.
> Turlar bitince sonuç kilitlenir, arşive girer, şehir haritası yayınlanır.
> Sezon dışı zamanda "Günün Sorusu" akışı devam eder.

Neden bu daha güçlü:
- **Geri dönüş sebebi ürünün içinde:** tur bitiyor, favorin elenebilir → yarın gel.
- **Kıtlık ve olay hissi:** "son 6 saat" sayacı paylaşımı tetikler.
- **Medya yem:** Her tur bir haber. Gazeteler bedava dağıtım yapar.
- **Ödül programının doğal altyapısı:** Sezon şampiyonu = "Türkiye'nin Seçimi" rozeti.

Bracket'in dezavantajları da dürüstçe: ilk turda 32 seçenek → kullanıcının umursamadığı eşleşmeler, oy dağılımının seyrelmesi, ve "favorim erken elendi → ilgim bitti" riski. Çözüm: **kullanıcıya sezon başında "şampiyonun kim olacak?" tahmini yaptır** — böylece favorisi elense de skorunu takip etmek için döner.

## 3.2 Konumlandırma

- **Kategori:** Live public choice platform (anket sitesi DEĞİL)
- **One-liner:** Türkiye'nin neyi seçtiğini canlı olarak gösteren yer.
- **Konum ifadesi:** *Meraklı bir insan için, sosyal medya anketlerinin aksine, X kalıcı, şehir kırılımlı ve canlı bir kolektif tercih arşividir.*
- **Anti-konum:** Bilimsel araştırma değiliz, bahis değiliz, siyasi anket kurumu değiliz, form aracı değiliz.

## 3.3 Ürün ilkeleri (karar verirken bunlara bak)
1. **Sonuç ürünün kendisidir.** Oy vermek, sonucu görmenin bedelidir.
2. **Sıfır sürtünme > her şey.** Login yok. İlk oy 3 saniyede verilmeli.
3. **Her ekranın bir paylaşım çıktısı vardır.** Paylaşılamayan ekran eksik ekrandır.
4. **Şeffaflık güvendir.** Her sonuçta: toplam oy, zaman damgası, filtrelenen şüpheli oy sayısı, metodoloji linki.
5. **Tarafsızlık editoryal kuraldır.** Siyaset, din, etnik köken, kişiye hakaret → asla. Yazılı politika, admin panelde zorunlu kontrol listesi.

## 3.4 Kullanıcı yolculuğu (hedef: ilk oy < 3 sn)

```
Landing (soru zaten ekranda, scroll yok)
 → tek dokunuş oy
 → 400ms sonuç animasyonu + "Türkiye %54 / Senin şehrin %61"
 → [Paylaş] + [Sıradaki soru]  (aynı ekranda, sayfa geçişi yok)
 → 3. sorudan sonra: "Şehrini seç" (opsiyonel, tek dokunuş, atlanabilir)
 → 5. sorudan sonra: "Sezonu takip et" (push/e-posta değil, sadece bookmark CTA'sı; hesap ileride)
```

Şehir sorusu neden 3. sorudan sonra? Çünkü başta sorarsan sürtünme, hiç sormazsan ürünün en değerli kırılımı yok. 3 oy verdikten sonra kullanıcı yatırım yapmıştır, cevap verme oranı yükselir.

## 3.5 MVP scope (kesin sınır)

**MVP'de VAR:**
- Ana sayfa: aktif soru + canlı sonuç + trend + günün şampiyonu
- Tekil soru sayfaları (SEO'lu, her soru kendi URL'i: `/lahmacun-vs-doner`)
- Oy verme + anlık sonuç (Türkiye + şehir kırılımı)
- Opsiyonel şehir seçimi (cookie'de, PII yok)
- Otomatik OG paylaşım kartı (dinamik görsel)
- Anti-abuse v1: cookie + IP rate limit + davranışsal hız kontrolü
- Admin panel: soru CRUD, zamanlama, temel metrikler
- Metodoloji/şeffaflık sayfası, KVKK/çerez metinleri
- Analytics (privacy-friendly, çerezsiz)

**MVP'de YOK (bilinçli olarak ertelendi):**
- Bracket/Sezon (Ay 2 — MVP'nin retention verisi gelmeden yapılmaz)
- Hesap, profil, rozet, leaderboard (Ay 3+; kanıt gelmeden asla)
- Kullanıcı tarafından soru oluşturma (spam ve moderasyon maliyeti; belki hiç)
- Sponsorluk altyapısı (trafik olmadan satılamaz)
- İngilizce/global sürüm (mimari hazır, içerik yok)

**MVP başarı kriteri (4 hafta sonunda, gerçek eşikler):**
- Oy tamamlama oranı ≥ %60 (ziyaret → en az 1 oy)
- Oturum başına ortalama oy ≥ 4
- Paylaşım oranı ≥ %3
- D7 dönüş ≥ %10
Bu eşikler tutmuyorsa **bracket yapma, içerik/hook'u düzelt.**

## 3.6 North Star Metric

**Haftalık "anlamlı oy" sayısı** = anti-abuse filtresini geçmiş, tekil oturumlardan gelen oylar.
Neden: hem talebi (kullanıcı), hem katılımı (derinlik), hem veri varlığının büyümesini (moat) tek sayıda ölçer. DAU tek başına yanıltır (viral tepe), toplam oy tek başına yanıltır (bot).

Destekleyici: viral katsayı (k), D7 retention, şehir kapsama oranı (81 ilin kaçında ≥100 oy).

## 3.7 En önemli soru: kendi param olsa yapar mıydım?

**Evet — ama master prompt'taki haliyle değil.**

Evet, çünkü: maliyeti neredeyse sıfır ($0–20/ay), test süresi kısa (4 hafta), viral tavanı yüksek, ve kaybedilirse kayıp sadece zamandır. Asimetrik bahis.

Ama şu üç değişiklikle:
1. **Sezon/turnuva çekirdek olmalı**, tekil anket değil (retention).
2. **Gelir modeli reklam değil, "Türkiye'nin Seçimi" ödül/sponsorluk programı olmalı** — display reklam bu trafikte anlamlı para üretmez.
3. **Kurucu, mühendislik değil dağıtım işi yapmalı.** Ürün 3 haftada yazılır; marka 12 ayda kurulur.

Yapmazdım diyeceğim tek senaryo: kurucunun TikTok/Reels içerik üretme kapasitesi yoksa. Bu ürün pazarlama ürünüdür; kod ikincil.
