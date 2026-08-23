/**
 * Drizzle şeması — docs/08-database.md ile birebir uyumludur.
 *
 * Tasarımın iki değişmez kuralı:
 *  1. Okuma yolu asla ham `votes` tablosunu saymaz; sonuçlar `voteAggregates`'ten gelir.
 *  2. Kişisel veri saklanmaz: ham IP yok, hesap yok, kalıcı cihaz tanımlayıcısı yok.
 */
import {
  bigint, bigserial, boolean, char, customType, index, integer, jsonb, numeric,
  pgEnum, pgTable, primaryKey, smallint, text, timestamp, unique, uuid,
} from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});

export const pollStatus = pgEnum('poll_status', ['draft', 'scheduled', 'live', 'closed', 'archived']);

export const categories = pgTable('categories', {
  id: smallint('id').primaryKey().generatedAlwaysAsIdentity(),
  slug: text('slug').notNull().unique(),
  nameTr: text('name_tr').notNull(),
  nameEn: text('name_en'),
  emoji: text('emoji'),
  sortOrder: smallint('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

export const cities = pgTable('cities', {
  id: smallint('id').primaryKey(), // plaka kodu
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  region: text('region').notNull(),
  population: integer('population').notNull(),
});

export const entities = pgTable('entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  nameTr: text('name_tr').notNull(),
  nameEn: text('name_en'),
  categoryId: smallint('category_id').references(() => categories.id),
  emoji: text('emoji'),
  meta: jsonb('meta').notNull().default({}),
});

export const sponsors = pgTable('sponsors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  website: text('website'),
  // Gösterimi zorunludur — etiketsiz sponsorlu içerik yayınlanamaz.
  disclosureTr: text('disclosure_tr').notNull().default('Sponsorlu içerik'),
});

export const polls = pgTable('polls', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  questionTr: text('question_tr').notNull(),
  questionEn: text('question_en'),
  categoryId: smallint('category_id').notNull().references(() => categories.id),
  status: pollStatus('status').notNull().default('draft'),
  scopeCityId: smallint('scope_city_id').references(() => cities.id),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  shareText: text('share_text'),
  // Editoryal kontrol listesi geçilmeden yayın API'si reddeder.
  editorialOk: boolean('editorial_ok').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
}, (t) => ({
  statusIdx: index('polls_status_starts_idx').on(t.status, t.startsAt),
  categoryIdx: index('polls_category_idx').on(t.categoryId, t.status),
}));

export const options = pgTable('options', {
  id: uuid('id').primaryKey().defaultRandom(),
  pollId: uuid('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  entityId: uuid('entity_id').references(() => entities.id),
  labelTr: text('label_tr').notNull(),
  labelEn: text('label_en'),
  emoji: text('emoji'),
  position: smallint('position').notNull(),
}, (t) => ({
  posUq: unique('options_poll_position_uq').on(t.pollId, t.position),
}));

/**
 * Ham oylar. Analiz ve yeniden sayım içindir; sonuç ekranı buradan OKUMAZ.
 * Üretimde `created_at` üzerinden aylık partition'lanır (bkz. infra/migrations).
 */
export const votes = pgTable('votes', {
  id: bigserial('id', { mode: 'bigint' }),
  pollId: uuid('poll_id').notNull(),
  optionId: uuid('option_id').notNull(),
  cityId: smallint('city_id'),
  sessionHash: bytea('session_hash').notNull(),
  ipHash: bytea('ip_hash').notNull(),
  asn: integer('asn'),
  country: char('country', { length: 2 }),
  trustScore: smallint('trust_score').notNull().default(100),
  isCounted: boolean('is_counted').notNull().default(true),
  uaClass: text('ua_class'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // Bir oturum bir soruya bir kez oy verir — mükerrer oyun birincil savunması.
  sessionUq: unique('votes_poll_session_uq').on(t.pollId, t.sessionHash),
  pollTimeIdx: index('votes_poll_created_idx').on(t.pollId, t.createdAt),
  ipIdx: index('votes_ip_created_idx').on(t.ipHash, t.createdAt),
  // Hız kontrolü oturum bazında da sorgulanır. Bu indeks olmadan sorgu tam tarama yapar;
  // milyonlarca satırda oy yolunu tıkayan tek şey bu olurdu.
  sessionTimeIdx: index('votes_session_created_idx').on(t.sessionHash, t.createdAt),
}));

/** Okuma yolu. cityId = 0 → Türkiye geneli. */
export const voteAggregates = pgTable('vote_aggregates', {
  pollId: uuid('poll_id').notNull(),
  optionId: uuid('option_id').notNull(),
  cityId: smallint('city_id').notNull().default(0),
  voteCount: bigint('vote_count', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.pollId, t.optionId, t.cityId] }),
}));

/** Zaman serisi — trend, sparkline ve veri moat'ının kaynağı. */
export const voteTimeseries = pgTable('vote_timeseries', {
  pollId: uuid('poll_id').notNull(),
  optionId: uuid('option_id').notNull(),
  bucket: timestamp('bucket', { withTimezone: true }).notNull(),
  voteCount: integer('vote_count').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.pollId, t.optionId, t.bucket] }),
}));

export const trending = pgTable('trending', {
  optionId: uuid('option_id').primaryKey(),
  pollId: uuid('poll_id').notNull(),
  delta24h: numeric('delta_24h', { precision: 5, scale: 2 }).notNull(),
  score: numeric('score', { precision: 10, scale: 4 }).notNull(),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const abuseEvents = pgTable('abuse_events', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  kind: text('kind').notNull(),
  ipHash: bytea('ip_hash'),
  asn: integer('asn'),
  pollId: uuid('poll_id'),
  detail: jsonb('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const shares = pgTable('shares', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  pollId: uuid('poll_id').notNull(),
  channel: text('channel').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  actorId: uuid('actor_id'),
  action: text('action').notNull(),
  target: text('target').notNull(),
  diff: jsonb('diff'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
