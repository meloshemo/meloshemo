import { computeResults, describeDivergence, findDivergences, isIndexable, leaderOf } from '@nabiz/core';
import type { SeedCity } from '@nabiz/db';
import type { Repository } from './repository';

export interface CityPageData {
  city: SeedCity;
  totalVotes: number;
  distinctPolls: number;
  insights: string[];
  highlights: Array<{ question: string; slug: string; cityLeader: string; cityPct: number }>;
  indexable: boolean;
}

/**
 * Şehir sayfasının içeriği.
 *
 * Not: burada soru başına ayrı agregasyon okunuyor. MVP ölçeğinde (onlarca soru) bu kabul
 * edilebilir; Postgres uygulamasında aynı veri tek sorguda çekilecek şekilde değiştirilecek.
 */
export async function buildCityPage(repo: Repository, city: SeedCity): Promise<CityPageData> {
  const polls = await repo.listLivePolls(50);

  let totalVotes = 0;
  let distinctPolls = 0;
  const divergenceRows: Array<{ optionLabel: string; cityPct: number; nationalPct: number }> = [];
  const highlights: CityPageData['highlights'] = [];

  for (const poll of polls) {
    const cityRows = await repo.getAggregates(poll.id, city.id);
    const cityTotal = cityRows.reduce((sum, r) => sum + r.count, 0);
    if (cityTotal === 0) continue;

    totalVotes += cityTotal;
    distinctPolls += 1;

    const cityResults = computeResults(cityRows);
    const nationalResults = computeResults(await repo.getAggregates(poll.id, 0));
    const label = (id: string) => poll.options.find((o) => o.id === id)?.label ?? '';

    for (const option of cityResults) {
      const national = nationalResults.find((n) => n.optionId === option.optionId);
      if (!national) continue;
      divergenceRows.push({
        optionLabel: label(option.optionId),
        cityPct: option.pct,
        nationalPct: national.pct,
      });
    }

    const leader = leaderOf(cityResults);
    if (leader) {
      highlights.push({
        question: poll.question,
        slug: poll.slug,
        cityLeader: label(leader.optionId),
        cityPct: leader.pct,
      });
    }
  }

  const insights = findDivergences(divergenceRows)
    .slice(0, 5)
    .map((row) => describeDivergence(city.name, row));

  return {
    city,
    totalVotes,
    distinctPolls,
    insights,
    highlights,
    indexable: isIndexable({ totalVotes, distinctPolls, insights: insights.length }),
  };
}
