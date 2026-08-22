# PHASE 8 — Database Schema (PostgreSQL)

İlke: **hot path'te COUNT yok**, kişisel veri yok, her oy geri izlenebilir ama kimliklendirilemez.

```sql
-- ─── Taksonomi ────────────────────────────────────────────────
CREATE TABLE categories (
  id          smallserial PRIMARY KEY,
  slug        text UNIQUE NOT NULL,           -- 'yemek'
  name_tr     text NOT NULL,
  name_en     text,
  emoji       text,
  sort_order  smallint NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE cities (                          -- 81 il, sabit veri
  id            smallint PRIMARY KEY,          -- plaka kodu
  slug          text UNIQUE NOT NULL,          -- 'izmir'
  name          text NOT NULL,
  region        text NOT NULL,                 -- 'Ege'
  population    integer NOT NULL,              -- katılım normalizasyonu için
  lat           numeric(8,5), lon numeric(8,5)
);

-- ─── Sorular ve seçenekler ────────────────────────────────────
CREATE TYPE poll_status AS ENUM ('draft','scheduled','live','closed','archived');

CREATE TABLE polls (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,          -- 'lahmacun-vs-doner'
  question_tr   text NOT NULL,
  question_en   text,
  category_id   smallint NOT NULL REFERENCES categories(id),
  status        poll_status NOT NULL DEFAULT 'draft',
  scope_city_id smallint REFERENCES cities(id),-- NULL = Türkiye geneli
  starts_at     timestamptz,
  ends_at       timestamptz,                   -- NULL = süresiz
  match_id      uuid REFERENCES matches(id),   -- turnuva eşleşmesiyse
  sponsor_id    uuid REFERENCES sponsors(id),  -- NULL = organik
  seo_title     text, seo_description text,
  share_text    text,
  editorial_ok  boolean NOT NULL DEFAULT false,-- editoryal kontrol listesi geçti mi
  created_by    uuid REFERENCES admin_users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz
);
CREATE INDEX ON polls (status, starts_at DESC);
CREATE INDEX ON polls (category_id, status);

CREATE TABLE options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  entity_id   uuid REFERENCES entities(id),    -- 'Lahmacun' varlığı (turlar arası taşınır)
  label_tr    text NOT NULL,
  label_en    text,
  emoji       text, image_url text,
  position    smallint NOT NULL,
  UNIQUE (poll_id, position)
);

-- Seçenekler soru bazlı değil VARLIK bazlı takip edilir:
-- 'Lahmacun' 40 farklı soruda geçebilir; tarihsel gücü tek yerde birikir. Data moat burada.
CREATE TABLE entities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name_tr     text NOT NULL, name_en text,
  category_id smallint REFERENCES categories(id),
  emoji       text, image_url text,
  meta        jsonb NOT NULL DEFAULT '{}'      -- {'origin_city_id': 27, ...}
);

-- ─── Oylar ────────────────────────────────────────────────────
-- Ham oy tablosu: aya göre partition'lı, asla doğrudan okunmaz (analiz ve yeniden sayım için).
CREATE TABLE votes (
  id            bigserial,
  poll_id       uuid NOT NULL,
  option_id     uuid NOT NULL,
  city_id       smallint,                      -- kullanıcı beyanı, opsiyonel
  session_hash  bytea NOT NULL,                -- HMAC(sessionId, günlük dönen tuz)
  ip_hash       bytea NOT NULL,                -- HMAC(ip, günlük dönen tuz) — ham IP YOK
  asn           integer,
  country       char(2),
  trust_score   smallint NOT NULL DEFAULT 100, -- 0..100, anti-abuse çıktısı
  is_counted    boolean NOT NULL DEFAULT true, -- false = karantina
  ua_class      text,                          -- 'mobile-safari' gibi kaba sınıf; tam UA saklanmaz
  created_at    timestamptz NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Aynı oturum aynı soruya bir kez: idempotency + duplicate koruması
CREATE UNIQUE INDEX ON votes (poll_id, session_hash);
CREATE INDEX ON votes (poll_id, created_at DESC);
CREATE INDEX ON votes (ip_hash, created_at DESC);

-- ─── Agregasyonlar (okuma yolu — TÜM sonuçlar buradan gelir) ──
CREATE TABLE vote_aggregates (
  poll_id     uuid NOT NULL,
  option_id   uuid NOT NULL,
  city_id     smallint NOT NULL DEFAULT 0,     -- 0 = Türkiye geneli
  vote_count  bigint  NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, option_id, city_id)
);

-- Zaman serisi: trend, sparkline ve "yükselenler" bundan üretilir. Asıl veri varlığı.
CREATE TABLE vote_timeseries (
  poll_id     uuid NOT NULL,
  option_id   uuid NOT NULL,
  bucket      timestamptz NOT NULL,            -- saatlik
  vote_count  integer NOT NULL,
  PRIMARY KEY (poll_id, option_id, bucket)
);

CREATE TABLE trending (                        -- 5 dakikada bir yeniden hesaplanır
  option_id   uuid PRIMARY KEY,
  poll_id     uuid NOT NULL,
  delta_24h   numeric(5,2) NOT NULL,
  score       numeric(10,4) NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Turnuvalar / Sezonlar ────────────────────────────────────
CREATE TABLE tournaments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  name_tr      text NOT NULL,
  category_id  smallint REFERENCES categories(id),
  size         smallint NOT NULL,              -- 16 / 32 / 64
  round_hours  smallint NOT NULL DEFAULT 72,
  status       text NOT NULL DEFAULT 'draft',
  starts_at    timestamptz, ends_at timestamptz,
  sponsor_id   uuid REFERENCES sponsors(id),
  winner_entity_id uuid REFERENCES entities(id)
);

CREATE TABLE matches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id  uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round          smallint NOT NULL,            -- 1 = ilk tur
  position       smallint NOT NULL,
  entity_a_id    uuid REFERENCES entities(id),
  entity_b_id    uuid REFERENCES entities(id),
  winner_entity_id uuid REFERENCES entities(id),
  starts_at      timestamptz, ends_at timestamptz,
  UNIQUE (tournament_id, round, position)
);

CREATE TABLE predictions (                     -- sezon başı şampiyon tahmini (hesapsız)
  session_hash   bytea NOT NULL,
  tournament_id  uuid NOT NULL REFERENCES tournaments(id),
  entity_id      uuid NOT NULL REFERENCES entities(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_hash, tournament_id)
);

-- ─── Ticari ───────────────────────────────────────────────────
CREATE TABLE sponsors (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL, logo_url text, website text,
  disclosure_tr text NOT NULL DEFAULT 'Sponsorlu içerik',  -- gösterimi ZORUNLU
  contract_start date, contract_end date
);

CREATE TABLE awards (                          -- 'Türkiye'nin Seçimi 2026'
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year          smallint NOT NULL,
  category_id   smallint REFERENCES categories(id),
  entity_id     uuid REFERENCES entities(id),
  total_votes   bigint NOT NULL,
  badge_token   text UNIQUE NOT NULL,          -- doğrulama sayfası anahtarı
  awarded_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Operasyon ────────────────────────────────────────────────
CREATE TABLE admin_users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        citext UNIQUE NOT NULL,
  role         text NOT NULL DEFAULT 'editor', -- owner | editor | analyst
  totp_secret  text,                           -- 2FA zorunlu
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id         bigserial PRIMARY KEY,
  actor_id   uuid REFERENCES admin_users(id),
  action     text NOT NULL,                    -- 'poll.publish', 'vote.quarantine'
  target     text NOT NULL,
  diff       jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE abuse_events (
  id           bigserial PRIMARY KEY,
  kind         text NOT NULL,                  -- 'velocity','asn_burst','ua_anomaly'
  ip_hash      bytea, asn integer, poll_id uuid,
  detail       jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shares (
  id         bigserial PRIMARY KEY,
  poll_id    uuid NOT NULL,
  channel    text NOT NULL,                    -- 'whatsapp','instagram','x','copy'
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Tasarım notları
- **`users` tablosu yok, kasıtlı.** Hesap yok → çalınacak kişisel veri yok → KVKK yükü minimum.
  Faz 3'te hesap gelirse ayrı `accounts` tablosu eklenir, `votes` tablosuna dokunulmaz.
- **Ham IP hiçbir yerde saklanmaz.** Sadece günlük dönen tuzla HMAC. Tuz döndüğü için
  uzun vadeli takip teknik olarak imkânsız — bu bir uyum kararı, tercih değil.
- **`entities` ayrımı stratejiktir.** "Lahmacun"un 3 yıllık gücünü tek yerde biriktirir;
  data moat'ın somut hâli budur.
- **Retention politikası:** ham `votes` partition'ları 180 gün sonra düşürülür;
  `vote_aggregates` ve `vote_timeseries` süresiz kalır (kişisel veri içermez).
