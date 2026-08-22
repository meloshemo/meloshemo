# PHASE 5 — Business Model, Unit Economics & Financial Model

Tüm rakamlar **[T] tahmindir** ve varsayımları açıkça yazılmıştır. Bunlar plan değil, karar aracıdır.

## 5.1 Temel varsayımlar

| Varsayım | Değer | Gerekçe |
|---|---|---|
| TR display CPM (programatik, mobil web) | $0.80 | TR envanteri düşük fiyatlı; iyimser değil |
| Doldurma oranı (fill rate) | %70 | Ad blocker + eşleşmeyen envanter |
| Oturum başına sayfa görüntüleme | 3.5 | Tek sayfa uygulaması; reklam gösterimi az |
| Oturum başına reklam gösterimi | 2 | Kullanıcıyı boğmama kararı (ilkeye bağlı) |
| Aylık oturum / MAU | 2.5 | Casual eğlence ürünü |
| Sponsorlu sezon fiyatı | ₺150K–750K | Trafik bandına göre (aşağıda) |
| Değişken altyapı maliyeti / 1M oy | ~$3 | Edge + Postgres; ölçekte |

## 5.2 Üç senaryo (yıllık gelir, ₺ ve $ karışık — $1 ≈ ₺45 **[T]**)

### Conservative — 10K MAU
| Kalem | Yıllık | Not |
|---|---|---|
| Display reklam | ~$170 | 10K × 2.5 × 2 × 12 × $0.8/1000 × 0.7 |
| Sponsorlu anket | $0 | Bu trafikte satılamaz |
| Diğer | $0 | |
| **Toplam** | **~$170** | **Altyapı maliyeti bunun üstünde. Zarar.** |

**Karar kuralı:** 10K MAU'da para kazanma girişimi yapma. Bu aşama ürün-pazar uyumu testidir.

### Base — 100K MAU
| Kalem | Yıllık | Not |
|---|---|---|
| Display reklam | ~$1.7K | Anlamsız derecede küçük |
| Sponsorlu sezon (3 adet × ₺200K) | ~$13K | Asıl gelir |
| Trend raporu / basın lisansı | ~$4K | 4 çeyreklik rapor |
| **Toplam** | **~$19K/yıl** | Tek kişilik operasyonu döndürür, ekip döndürmez |

### Aggressive — 1M MAU
| Kalem | Yıllık | Not |
|---|---|---|
| Display reklam | ~$17K | Hâlâ küçük |
| Sponsorlu sezon (8 × ₺600K) | ~$107K | |
| "Türkiye'nin Seçimi" ödül programı | ~$130K | 40 marka × ₺150K rozet+lisans |
| B2B veri / trend aboneliği | ~$60K | 10–15 kurumsal müşteri |
| Özel araştırma (marka sorusu + rapor) | ~$45K | |
| **Toplam** | **~$360K/yıl** | |

**Sonuç, tek cümlede:** *Bu iş 1M MAU'da bile reklamla yaşamaz; ödül programı + sponsorlu sezon
gelirin %65'ini üretir.* Bu yüzden ürün yol haritası bu iki mekaniği erken inşa etmeli.

## 5.3 Unit economics

- **CAC:** Ödemeli kanal kullanılmıyor → hedef CAC ≈ **$0**. İçerik üretim maliyeti (kurucunun
  zamanı) ayda ~40 saat. Ödemeli test yapılırsa TR'de mobil web CPC ~₺1.5 **[T]**, dönüşüm %25 →
  CAC ≈ ₺6/kullanıcı — **ARPU'nun çok üstünde, yani ödemeli büyüme yasak.**
- **ARPU (yıllık):** Conservative $0.02 · Base $0.19 · Aggressive $0.36
- **LTV:** Ortalama kullanıcı ömrü ~4 ay **[T]**, LTV ≈ $0.06–0.12.
- **LTV:CAC:** Ödemeli reklamla **0.02:1** → felaket. Organikle tanımsız (CAC≈0) → tek uygun model.
- **Sponsorlu sezon fiyatlandırması:** Erişim başına ₺0.4–0.8 CPM eşdeğeri değil; **kampanya
  paketi** olarak satılır: özel turnuva + 3 sosyal kart + sonuç raporu + logo yerleşimi.
  100K MAU'da ₺150–250K, 1M MAU'da ₺500–800K.
- **Retention hedefleri:** D1 %20, D7 %10, D30 %5 **[T hedef]**. Sezon mekaniği devreye girince
  D7 hedefi %18'e çıkarılmalı; çıkmıyorsa mekanik çalışmıyor demektir.

## 5.4 Yatırım gerekiyor mu?

**Hayır — ilk 100K kullanıcıya kadar gerekmiyor.** Gerekçe:
- Altyapı $0–20/ay (Faz 7'de kanıtlanıyor)
- Domain + marka ~$150/yıl
- İçerik üretimi kurucunun zamanı
- Ödemeli pazarlama zaten yasak (yukarıdaki LTV:CAC)

Toplam 12 aylık nakit ihtiyacı: **< $1.000.** Bu proje bootstrapped yapılır; yatırım almak
gereksiz seyreltmedir. Yatırım ancak şu üç durumdan biri olursa anlamlıdır:
(a) ödül programı satış ekibi kurulacaksa, (b) global (Pulse) eşzamanlı 5 pazara açılacaksa,
(c) bir medya grubu ile eşzamanlı dağıtım anlaşması yapılacaksa.

## 5.5 Başabaş
Aylık sabit maliyet ~$20 → **tek bir ₺15.000'lık küçük sponsorlu anket** yılın maliyetini karşılar.
Yani finansal risk pratik olarak sıfır; risk **zaman riskidir**, para riski değil.
