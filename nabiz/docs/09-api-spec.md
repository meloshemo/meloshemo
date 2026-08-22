# PHASE 9 — API Specification

Taban: `https://nabiz.io/api/v1` · JSON · Tüm yanıtlar `Cache-Control` başlığı taşır.

## Public

### `GET /feed?cursor=&city=`
Ana akış: sıradaki sorular (kullanıcının oy vermedikleri önce). Oturumun oy geçmişi
çerezdeki imzalı `voted_ids` listesinden okunur (sunucuda profil tutulmaz).
```json
{ "items":[{"id":"...","slug":"lahmacun-vs-doner","question":"...","category":"yemek",
  "options":[{"id":"...","label":"Lahmacun","emoji":"🥙"}],
  "sponsor":null,"endsAt":null}], "nextCursor":"..." }
```

### `GET /polls/:slug`
Soru + (varsa) sonuç. `?city=izmir` ile şehir kırılımı.

### `POST /polls/:id/vote`
```json
// istek
{ "optionId":"uuid", "cityId":35, "clientToken":"uuid-v4", "ts":1755900000 }
// yanıt 200
{ "recorded":true, "results":{ "total":128402,
    "options":[{"id":"...","count":69594,"pct":54.2}],
    "city":{"id":35,"total":8120,"options":[{"id":"...","pct":61.3}]},
    "yourOptionId":"...", "asOf":"2026-08-22T23:14:02Z" } }
```
- **Idempotent:** `clientToken` tekrar gelirse yeni oy yazılmaz, mevcut sonuç döner.
- **Hız limiti:** oturum başına 1 oy/soru · IP başına 30 oy/dk · ASN başına eşik (Faz 11).
- **Hata sözleşmesi:** `409 already_voted` · `429 rate_limited` (`retryAfter`) ·
  `410 poll_closed` · `422 invalid_option` · `403 abuse_blocked`.
- **Önemli:** `403` ve karantina durumunda bile kullanıcıya sonuç gösterilir — saldırgana
  yakalandığını söylemeyiz, oyu sessizce sayılmaz (`is_counted=false`).

### `GET /polls/:id/results?city=&since=`
Sonuç + isteğe bağlı saatlik zaman serisi.

### `GET /polls/:id/stream` *(SSE)*
`event: results` her 1–2 sn, sadece değişiklik olduğunda. Bağlantı yoksa istemci 5 sn polling'e düşer.

### `GET /trending?window=24h&limit=20`
### `GET /cities/:slug` — şehir profili + en çok ayrışan tercihler
### `GET /categories/:slug`
### `GET /tournaments/:slug` · `GET /tournaments/:slug/bracket`
### `POST /tournaments/:id/predict` — şampiyon tahmini (oturum bazlı, idempotent)
### `GET /leaderboards?type=entities|cities`
### `GET /search?q=`
### `POST /shares` — `{pollId, channel}` (analitik; PII yok, best-effort)
### `GET /og/:pollSlug.png?variant=wa|story|x` — dinamik paylaşım kartı (edge cache)
### `GET /methodology` · `GET /awards/verify/:badgeToken` — rozet doğrulama (halka açık)

## Admin (`/api/admin/*`, 2FA + rol zorunlu, tüm yazmalar `audit_log`'a düşer)
```
POST   /polls            PATCH /polls/:id        POST /polls/:id/publish
POST   /polls/bulk       (AI üretimi taslak içe aktarma — otomatik yayın YOK)
GET    /metrics          ?range=7d   (DAU, oy, tamamlama, paylaşım, retention)
GET    /abuse/events     POST /abuse/quarantine  { pollId, ipHash|asn }
POST   /tournaments      POST /tournaments/:id/advance-round
GET    /export/aggregates.csv     (yalnız agrege; ham oy dışa aktarılamaz)
```

## Genel kurallar
- Versiyonlama URL'de (`/v1`). Kırıcı değişiklik = yeni versiyon, 6 ay çift yayın.
- Tüm listeler cursor tabanlı sayfalama.
- `Retry-After`, `X-RateLimit-Remaining` başlıkları her zaman.
- Public API başlangıçta **okuma-yalnız ve limitli**; ticari kullanım için ayrı anahtar (Faz 15).
