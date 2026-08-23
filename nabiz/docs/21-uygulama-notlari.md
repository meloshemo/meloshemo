# Uygulama Notları — Stratejiden Bilinçli Sapmalar

Kod yazılırken stratejiden ayrıldığımız her yer burada, gerekçesiyle. Sessiz sapma teknik borçtur;
yazılı sapma karardır.

## 1. Admin ayrı uygulama değil, `/admin` altında
**Doküman:** `docs/10` admin'i ayrı uygulama + 2FA olarak tanımlıyor.
**Yapılan:** Aynı Next uygulamasında `/admin`, tek anahtarla giriş, middleware ile fail-closed
koruma, `noindex` başlığı, `ADMIN_TOKEN` tanımlı değilse tamamen kapalı.
**Gerekçe:** Tek kişilik ekipte ikinci deploy hattı ve 2FA altyapısı maliyetli ve gereksiz.
**Ne zaman değişir:** İkinci editör eklendiğinde — o an ayrı uygulama + gerçek hesaplar + TOTP.

## 2. Postgres'te idempotency yalnızca oturum üzerinden
**Doküman:** `docs/09` `clientToken` ile idempotency öngörüyor.
**Yapılan:** `MemoryStore` token'ı kontrol eder; `PostgresStore` etmez, çünkü token kalıcı olarak
saklanmıyor. Aynı token'ın tekrarı zaten aynı oturumdan geldiği için
`UNIQUE (poll_id, session_hash)` kısıtına takılır ve ikinci oy yazılmaz.
**Sonuç:** Davranış aynı (409 + mevcut sonuç), mekanizma farklı. Uçtan uca test bunu doğruluyor.
**Risk:** Çerezi olmayan istemcide (çerez engelli tarayıcı) token tekrarı ikinci oy yazabilir.
Kabul edilen kayıp; kitlesel değil bireysel.

## 3. Bellek içi depo üretimde açıkça istenmeli
`DATABASE_URL` yoksa uygulama geliştirmede bellek içi depoya düşer. Üretim modunda ise hata verir
— tek istisna `ALLOW_MEMORY_STORE=1` (yalnızca uçtan uca testlerin üretim derlemesini
çalıştırması için). Varsayılan kapalı olduğu için kazara üretime bu şekilde çıkılamaz.

## 4. Şehir/kategori sayfaları soru başına ayrı agregasyon okuyor
MVP ölçeğinde (onlarca soru) kabul edilebilir. Soru sayısı üç haneye çıktığında tek sorguya
çevrilecek — `buildCityPage` içinde işaretlendi.

## 5. Canlı akış: SSE var, Durable Object henüz yok
`GET /api/v1/polls/:id/stream` çalışıyor: sunucu agregaları 2 sn'de bir yokluyor ve
**yalnızca değişiklikte** olay gönderiyor. `docs/07`'deki hedef mimari, yoklama yerine
Durable Object içinden yayın yapmaktır; bu sürüm ara adımdır ve tek fark, oy ile yayın
arasındaki en fazla 2 saniyelik gecikmedir.

Bağlantı ömrü 5 dakika ile sınırlı (serverless çalışma süresi limitleri). Arayüz akışa
bağımlı değildir: akış kurulamazsa mevcut sonuç gösterilmeye devam eder.

## 6. Yük testi bulgusu: ölçüm ortamı sonucu belirledi
Tek makinede (4 çekirdek, istemci + Next + Postgres aynı CPU) 150 istek/sn altında p95
1143 ms görünüyordu. Uç noktalar tek tek ölçüldüğünde gerçek maliyet **p50 14 ms,
p95 38 ms** çıktı: yüksek gecikme sunucudan değil, test istemcisinin kendisinden
geliyordu. Gerçek kapasite ölçümü ayrı makineden k6 ile yapılmalı.

Bu ölçüm sırasında iki gerçek iyileştirme yapıldı ve kaldı:
- Soru/kategori için 30 sn'lik süreç içi önbellek (oy başına 3 sorgu daha az)
- Hız sayaçları tek çağrıda, iki paralel **indeksli** sorgu olarak
  (`session_hash OR ip_hash` yazımı EXPLAIN'de tam tarama yapıyordu; `votes(session_hash,
  created_at)` indeksi eklendi)

## 7. Yasal metinler taslak
`/gizlilik`, `/kvkk`, `/kullanim-kosullari` sayfaları mühendislik tarafından, ürünün gerçek
veri davranışına bakılarak yazıldı ve sayfada **taslak uyarısı** taşıyor. Uyarı ancak
avukat kontrolünden sonra kaldırılmalı (`docs/18`).

## Ortam değişkenleri
| Değişken | Zorunlu | Ne işe yarar |
|---|---|---|
| `DATABASE_URL` | üretimde evet | Postgres bağlantısı |
| `SESSION_SECRET` | üretimde evet | Oturum çerezi imzası (≥32 karakter) |
| `VOTE_HASH_SALT` | üretimde evet | IP/oturum hash'lerinin taban tuzu |
| `ADMIN_TOKEN` | hayır | Tanımlıysa admin paneli açılır (≥24 karakter) |
| `NEXT_PUBLIC_SITE_URL` | önerilir | Canonical URL ve paylaşım kartları |
| `ALLOW_MEMORY_STORE` | hayır | Yalnızca test; üretimde asla |
| `DATABASE_POOL_MAX` | hayır | Bağlantı havuzu (serverless 5, sunucu 10–20; varsayılan 10) |
