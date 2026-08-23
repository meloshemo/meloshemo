import { beforeEach, describe, expect, it } from 'vitest';
import type { VoteAttempt } from '@nabiz/core';
import { MemoryStore } from './memory-store';
import { castVote, classifyUserAgent } from './vote-service';

const SALT = 'test-salt';
let repo: MemoryStore;
let pollId: string;
let optionA: string;
let optionB: string;

beforeEach(async () => {
  repo = new MemoryStore();
  const poll = await repo.getPollBySlug('lahmacun-vs-doner');
  if (!poll) throw new Error('seed poll bulunamadı');
  pollId = poll.id;
  optionA = poll.options[0]!.id;
  optionB = poll.options[1]!.id;
});

function attempt(overrides: Partial<VoteAttempt> = {}): VoteAttempt {
  return {
    pollId, optionId: optionA, cityId: 35,
    sessionId: 'session-1', clientToken: crypto.randomUUID(),
    ip: '85.100.1.1', asn: 9121, country: 'TR',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    decisionMs: 2200, hadInteraction: true,
    receivedAt: new Date(),
    ...overrides,
  };
}

describe('castVote', () => {
  it('geçerli oyu kaydeder ve sonucu döner', async () => {
    const out = await castVote(repo, attempt(), SALT);
    expect(out.kind).toBe('recorded');
    if (out.kind !== 'recorded') return;
    expect(out.results.total).toBe(1);
    expect(out.results.options.find((o) => o.optionId === optionA)?.pct).toBe(100);
    expect(out.results.yourOptionId).toBe(optionA);
  });

  it('aynı oturumun ikinci oyunu saymaz', async () => {
    await castVote(repo, attempt({ optionId: optionA }), SALT);
    const second = await castVote(repo, attempt({ optionId: optionB }), SALT);

    expect(second.kind).toBe('already_voted');
    if (second.kind !== 'already_voted') return;
    // İlk oy korunur, ikinci oy sonucu değiştirmez.
    expect(second.results.total).toBe(1);
    expect(second.results.yourOptionId).toBe(optionA);
  });

  it('aynı clientToken ile tekrar gönderimde ikinci oy yazmaz (idempotency)', async () => {
    const token = 'tekrar-eden-token';
    await castVote(repo, attempt({ clientToken: token }), SALT);
    const retry = await castVote(repo, attempt({ clientToken: token, sessionId: 'session-2' }), SALT);

    expect(retry.kind).toBe('already_voted');
    if (retry.kind !== 'already_voted') return;
    expect(retry.results.total).toBe(1);
  });

  it('farklı oturumlar ayrı sayılır', async () => {
    await castVote(repo, attempt({ sessionId: 'a', optionId: optionA }), SALT);
    await castVote(repo, attempt({ sessionId: 'b', optionId: optionB }), SALT);
    const third = await castVote(repo, attempt({ sessionId: 'c', optionId: optionA }), SALT);

    expect(third.kind).toBe('recorded');
    if (third.kind !== 'recorded') return;
    expect(third.results.total).toBe(3);
    expect(third.results.options.find((o) => o.optionId === optionA)?.count).toBe(2);
  });

  it('şüpheli oyu sayıma katmaz ama kullanıcıya sonucu yine de gösterir', async () => {
    await castVote(repo, attempt({ sessionId: 'temiz' }), SALT);
    const bot = await castVote(
      repo,
      attempt({ sessionId: 'bot', decisionMs: 20, hadInteraction: false, userAgent: null }),
      SALT,
    );

    expect(bot.kind).toBe('recorded');           // kullanıcıya engel gösterilmez
    if (bot.kind !== 'recorded') return;
    expect(bot.results.total).toBe(1);           // ama agregaya işlenmez
  });

  it('aşırı hızda 429 döner', async () => {
    const ip = '5.5.5.5';
    for (let i = 0; i < 95; i++) {
      await castVote(repo, attempt({ sessionId: `s${i}`, ip }), SALT);
    }
    const blocked = await castVote(repo, attempt({ sessionId: 'son', ip }), SALT);
    expect(blocked.kind).toBe('rate_limited');
  });

  it('geçersiz seçeneği reddeder', async () => {
    const out = await castVote(repo, attempt({ optionId: crypto.randomUUID() }), SALT);
    expect(out.kind).toBe('invalid_option');
  });

  it('bilinmeyen soruyu reddeder', async () => {
    const out = await castVote(repo, attempt({ pollId: crypto.randomUUID() }), SALT);
    expect(out.kind).toBe('not_found');
  });

  it('şehir kırılımını eşik altındayken göstermez', async () => {
    const out = await castVote(repo, attempt(), SALT);
    if (out.kind !== 'recorded') throw new Error('beklenmeyen sonuç');
    expect(out.results.city).toBeNull(); // 1 oy < 100 eşiği
  });

  it('eşik aşılınca şehir kırılımını gösterir', async () => {
    // Farklı IP'ler: 100 oyun tek IP'den gelmesi zaten hız limitine takılırdı.
    for (let i = 0; i < 100; i++) {
      await castVote(repo, attempt({ sessionId: `izmir-${i}`, ip: `85.100.${i >> 8}.${i % 256}`, cityId: 35 }), SALT);
    }
    const out = await castVote(repo, attempt({ sessionId: 'son-izmirli', ip: '85.101.0.1', cityId: 35 }), SALT);
    if (out.kind !== 'recorded') throw new Error('beklenmeyen sonuç');
    expect(out.results.city?.citySlug).toBe('izmir');
    expect(out.results.city?.total).toBeGreaterThanOrEqual(100);
  });

  it('şehir belirtmeyen kullanıcı ulusal sonuca dahil olur', async () => {
    const out = await castVote(repo, attempt({ cityId: null }), SALT);
    if (out.kind !== 'recorded') throw new Error('beklenmeyen sonuç');
    expect(out.results.total).toBe(1);
    expect(out.results.city).toBeNull();
  });
});

describe('classifyUserAgent', () => {
  it('tam UA saklamak yerine kaba sınıf üretir', () => {
    expect(classifyUserAgent('Mozilla/5.0 (iPhone)')).toBe('ios');
    expect(classifyUserAgent('Mozilla/5.0 (Linux; Android 14)')).toBe('android');
    expect(classifyUserAgent('Googlebot/2.1')).toBe('bot');
    expect(classifyUserAgent(null)).toBeNull();
  });
});

