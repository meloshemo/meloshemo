# PHASE 10 — Admin Panel

Erişim: e-posta + TOTP 2FA zorunlu · roller: `owner` / `editor` / `analyst` ·
her yazma işlemi `audit_log`'a düşer · admin ayrı uygulama, ayrı subdomain, `noindex`.

## 10.1 Soru oluşturma ekranı
```
Soru (TR) *          [Türkiye'nin en sevilen tatlısı hangisi?]
Soru (EN)            [ ]
Kategori *           [Tatlı ▾]     Kapsam [Türkiye ▾ / Şehir ▾]
Seçenek A *          [Baklava]  🍯  [varlık: baklava ▾]   ← entities'e bağlanır
Seçenek B *          [Künefe]   🧀  [varlık: kunefe  ▾]
Başlangıç            [22.08.2026 20:00]   Bitiş [açık]
Slug                 [baklava-vs-kunefe]  (otomatik, düzenlenebilir)
SEO başlık/açıklama  [otomatik öneri]
Paylaşım metni       [otomatik öneri]
Sponsor              [yok ▾]  → seçilirse "Sponsorlu" etiketi ZORUNLU görünür

☑ EDİTORYAL KONTROL (hepsi işaretlenmeden yayınlanamaz)
  ☐ Siyasi parti/lider/ideoloji içermiyor
  ☐ Din, etnik köken, cinsiyet kimliği üzerinden karşılaştırma değil
  ☐ Kişiye hakaret / itibar zedeleyici iddia içermiyor
  ☐ Hassas kişisel veri talep etmiyor
  ☐ Marka karşılaştırmasında haksız rekabet riski yok
  ☐ Sponsorluk varsa açıklama etiketi eklendi
[Önizle]  [Taslak kaydet]  [Yayınla]
```
Kontrol listesi bir formalite değil; `polls.editorial_ok` alanına yazılır ve
`POST /publish` bu alan `false` iken **sunucu tarafında** reddeder.

## 10.2 İçerik motoru (AI destekli, insan onaylı)
"20 yeni viral karşılaştırma üret" → AI şunları üretir: soru, 2 seçenek, kategori, slug,
SEO metni, paylaşım metni, tahmini viralite notu. Çıktı **her zaman `draft`** olarak düşer.
Otomatik yayın yoktur, teknik olarak da mümkün değildir (publish endpoint'i insan oturumu ister).
Üretim promptu yasaklı alanları (siyaset/din/etnik/kişi) içerir; ayrıca üretilen her taslak
otomatik bir yasaklı-kelime taramasından geçer ve şüpheliler kırmızı bayrakla gelir.

## 10.3 Metrik paneli
Üst şerit: bugünkü oy · anlamlı oy oranı · DAU · oy tamamlama % · paylaşım % · D7 dönüş.
Grafikler: saatlik oy, kanal kırılımı (organik/sosyal/direkt), şehir katılım haritası
(nüfusa normalize), soru bazlı huni (görüntüleme → oy → paylaşım).
Soru tablosu: oy, tamamlama, paylaşım, şüpheli oy %, ortalama karar süresi
(**düşük karar süresi = iyi soru**; 5 sn üstü sorular sıkıcıdır, arşive alınır).

## 10.4 Şüpheli oy paneli
`abuse_events` akışı · IP hash / ASN bazlı zirve tespiti · tek tıkla karantina
(`is_counted=false`, agregalar yeniden hesaplanır) · her karantina işlemi loglanır ve
şeffaflık sayfasındaki "filtrelenen oy" sayacına yansır.

## 10.5 Sezon yönetimi
Turnuva oluştur (16/32/64 varlık seç) · eşleşme ağacını önizle · turu ilerlet (manuel onay) ·
tur bitiminde sonucu kilitle ve arşivle · şampiyona ödül rozeti üret.
