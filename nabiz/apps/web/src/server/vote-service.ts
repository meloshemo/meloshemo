import {
  assessTrust, computeResults, hashIdentifier, isCityBreakdownPublishable, isHardRateLimited,
  type PollResults, type VoteAttempt,
} from '@nabiz/core';
import { CITIES } from '@nabiz/db';
import type { Repository } from './repository';

export type VoteOutcome =
  | { kind: 'recorded'; results: PollResults; challenge: boolean }
  | { kind: 'already_voted'; results: PollResults }
  | { kind: 'rate_limited'; retryAfterSeconds: number }
  | { kind: 'poll_closed' }
  | { kind: 'invalid_option' }
  | { kind: 'not_found' };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * Oy kaydetme akışının tamamı. Bilerek HTTP'den bağımsız tutulmuştur:
 * route yalnızca istek/yanıt çevirisi yapar, karar burada verilir ve burada test edilir.
 */
export async function castVote(
  repo: Repository,
  attempt: VoteAttempt,
  hashSalt: string,
): Promise<VoteOutcome> {
  const poll = await repo.getPollById(attempt.pollId);
  if (!poll) return { kind: 'not_found' };
  if (poll.status !== 'live') return { kind: 'poll_closed' };
  if (poll.endsAt && poll.endsAt.getTime() <= attempt.receivedAt.getTime()) {
    return { kind: 'poll_closed' };
  }
  if (!poll.options.some((o) => o.id === attempt.optionId)) return { kind: 'invalid_option' };

  const sessionHash = hashIdentifier(attempt.sessionId, hashSalt, attempt.receivedAt).toString('hex');
  const ipHash = hashIdentifier(attempt.ip, hashSalt, attempt.receivedAt).toString('hex');

  // Idempotency: ağ tekrarı veya çift dokunuş ikinci bir oy yazmaz.
  const byToken = await repo.findVoteByClientToken(attempt.pollId, attempt.clientToken);
  if (byToken) {
    return { kind: 'already_voted', results: await buildResults(repo, attempt, byToken.optionId) };
  }

  const existing = await repo.findVote(attempt.pollId, sessionHash);
  if (existing) {
    return { kind: 'already_voted', results: await buildResults(repo, attempt, existing.optionId) };
  }

  const signals = {
    sessionVotesLastMinute: await repo.countRecentVotesBySession(sessionHash, MINUTE),
    ipVotesLastMinute: await repo.countRecentVotesByIp(ipHash, MINUTE),
    ipVotesLastHour: await repo.countRecentVotesByIp(ipHash, HOUR),
  };

  if (isHardRateLimited(signals)) {
    await repo.logAbuseEvent('hard_rate_limit', { pollId: attempt.pollId, ...signals });
    return { kind: 'rate_limited', retryAfterSeconds: 60 };
  }

  const trust = assessTrust(attempt, signals);

  // Karantinaya alınan oy da YAZILIR ve kullanıcıya normal sonuç gösterilir.
  // Saldırgana yakalandığını söylemek, yalnızca yöntemini kalibre etmesine yarar.
  const written = await repo.recordVote({
    pollId: attempt.pollId,
    optionId: attempt.optionId,
    cityId: attempt.cityId,
    sessionHash,
    ipHash,
    clientToken: attempt.clientToken,
    asn: attempt.asn,
    country: attempt.country,
    trustScore: trust.score,
    counted: trust.counted,
    uaClass: classifyUserAgent(attempt.userAgent),
    at: attempt.receivedAt,
  });

  if (!trust.counted) {
    await repo.logAbuseEvent('quarantined_vote', {
      pollId: attempt.pollId, score: trust.score, reasons: trust.reasons,
    });
  }

  if (!written) {
    const existingNow = await repo.findVote(attempt.pollId, sessionHash);
    return {
      kind: 'already_voted',
      results: await buildResults(repo, attempt, existingNow?.optionId ?? null),
    };
  }

  return {
    kind: 'recorded',
    results: await buildResults(repo, attempt, attempt.optionId),
    challenge: trust.challenge,
  };
}

async function buildResults(
  repo: Repository,
  attempt: VoteAttempt,
  yourOptionId: string | null,
): Promise<PollResults> {
  const national = await repo.getAggregates(attempt.pollId, 0);
  const nationalTotal = national.reduce((sum, c) => sum + c.count, 0);

  let city: PollResults['city'] = null;
  if (attempt.cityId !== null) {
    const rows = await repo.getAggregates(attempt.pollId, attempt.cityId);
    const cityTotal = rows.reduce((sum, c) => sum + c.count, 0);
    const meta = CITIES.find((c) => c.id === attempt.cityId);
    // Eşik altındaki kırılım gösterilmez: 7 oyla "İzmir'in %71'i" demek yanlış bilgidir.
    if (meta && isCityBreakdownPublishable(cityTotal)) {
      city = {
        cityId: meta.id,
        citySlug: meta.slug,
        total: cityTotal,
        options: computeResults(rows),
      };
    }
  }

  return {
    pollId: attempt.pollId,
    total: nationalTotal,
    options: computeResults(national),
    city,
    yourOptionId,
    asOf: attempt.receivedAt,
  };
}

/** Tam User-Agent saklanmaz; yalnızca kaba bir sınıf. */
export function classifyUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  const lower = ua.toLowerCase();
  if (lower.includes('bot') || lower.includes('crawler') || lower.includes('spider')) return 'bot';
  if (lower.includes('iphone') || lower.includes('ipad')) return 'ios';
  if (lower.includes('android')) return 'android';
  if (lower.includes('windows') || lower.includes('macintosh') || lower.includes('linux')) return 'desktop';
  return 'other';
}
