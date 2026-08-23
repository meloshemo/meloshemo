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

## 5. Canlı akış (SSE) henüz yok
Sonuçlar oy sonrası yanıtla ve 5 sn cache'li `results` uç noktasıyla geliyor. Durable Object
tabanlı SSE yayını, `docs/07`'deki mimaride tanımlı ama MVP kapsamı dışında: tek kullanıcının
kendi oyundan sonra gördüğü anlık sonuç, ürünün vaadini zaten karşılıyor. Eşzamanlı canlı
akış, trafik gerçekten paralelleşince değerli olur.

## Ortam değişkenleri
| Değişken | Zorunlu | Ne işe yarar |
|---|---|---|
| `DATABASE_URL` | üretimde evet | Postgres bağlantısı |
| `SESSION_SECRET` | üretimde evet | Oturum çerezi imzası (≥32 karakter) |
| `VOTE_HASH_SALT` | üretimde evet | IP/oturum hash'lerinin taban tuzu |
| `ADMIN_TOKEN` | hayır | Tanımlıysa admin paneli açılır (≥24 karakter) |
| `NEXT_PUBLIC_SITE_URL` | önerilir | Canonical URL ve paylaşım kartları |
| `ALLOW_MEMORY_STORE` | hayır | Yalnızca test; üretimde asla |
