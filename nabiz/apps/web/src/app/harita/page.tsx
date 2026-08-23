import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  computeResults, describeDivergence, findDivergences, leanToFill, leaderOf,
  MAP_MIN_VOTES, participationScore,
} from '@nabiz/core';
import { CITIES } from '@nabiz/db/seed-data';
import { MapLegend } from '@/components/MapLegend';
import { TurkeyMap, type ProvinceState } from '@/components/TurkeyMap';
import { getRepository } from '@/server/context';
import { readCityId } from '@/server/session';

interface Params {
  searchParams: Promise<{ soru?: string; il?: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Türkiye tercih haritası',
  description:
    'Hangi şehir neyi seçiyor? Soruyu seç, Türkiye haritasında illerin tercihini canlı olarak gör.',
  alternates: { canonical: '/harita' },
};

export default async function MapPage({ searchParams }: Params) {
  const { soru, il } = await searchParams;
  const repo = getRepository();

  const livePolls = await repo.listLivePolls(24);
  if (livePolls.length === 0) notFound();

  // Sorular yayın tarihine göre değil OY HACMİNE göre sıralanır: haritanın anlamlı
  // olduğu sorular en çok oy alanlardır, en son eklenenler değil.
  // (Aday soru sayısı düşük tutulduğu için bu, birkaç indeksli sorgu demektir.)
  const withVolume = await Promise.all(livePolls.map(async (candidate) => ({
    poll: candidate,
    votes: (await repo.getAggregates(candidate.id, 0)).reduce((sum, r) => sum + r.count, 0),
  })));
  const polls = withVolume.sort((a, b) => b.votes - a.votes).map((row) => row.poll);

  // Adresle istenen soru, aday listesinde olmasa bile gösterilir: liste yalnızca
  // öneri şeridi içindir. Aksi hâlde eski bir soruya verilen bağlantı sessizce
  // başka bir soruyu açar — kullanıcı yanlış haritaya bakar ve bunu fark etmez.
  const requested = soru
    ? polls.find((p) => p.slug === soru) ?? await repo.getPollBySlug(soru)
    : undefined;
  const poll = requested && requested.status === 'live' ? requested : polls[0]!;
  const [optionA, optionB] = poll.options;
  if (!optionA || !optionB) notFound();

  const [national, breakdown] = await Promise.all([
    repo.getAggregates(poll.id, 0),
    repo.getCityBreakdown(poll.id),
  ]);
  const nationalResults = computeResults(national);

  // İl → seçenek → oy
  const byCity = new Map<number, Map<string, number>>();
  for (const row of breakdown) {
    const bucket = byCity.get(row.cityId) ?? new Map<string, number>();
    bucket.set(row.optionId, row.count);
    byCity.set(row.cityId, bucket);
  }

  const cookieCityId = await readCityId();
  const selectedCity = il
    ? CITIES.find((c) => c.slug === il)
    : cookieCityId
      ? CITIES.find((c) => c.id === cookieCityId)
      : undefined;

  const states = new Map<number, ProvinceState>();
  const ranked: Array<{ id: number; slug: string; name: string; votes: number; score: number }> = [];

  for (const city of CITIES) {
    const bucket = byCity.get(city.id);
    const aVotes = bucket?.get(optionA.id) ?? 0;
    const bVotes = bucket?.get(optionB.id) ?? 0;
    const lean = leanToFill(aVotes, bVotes);

    states.set(city.id, {
      fill: lean.fill,
      href: `/harita?soru=${poll.slug}&il=${city.slug}`,
      selected: selectedCity?.id === city.id,
      title: lean.aPct === null
        ? `${city.name}: yeterli oy yok`
        : `${city.name}: ${optionA.label} %${lean.aPct.toFixed(1)} · ${optionB.label} %${(100 - lean.aPct).toFixed(1)}`,
    });

    if (lean.votes > 0) {
      ranked.push({
        id: city.id, slug: city.slug, name: city.name, votes: lean.votes,
        score: participationScore(lean.votes, city.population),
      });
    }
  }

  const painted = [...states.values()].filter((s) => s.fill !== 'transparent').length;
  const mostEngaged = [...ranked].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <main className="wide">
      <header className="topbar">
        <a className="wordmark" href="/">NAB<span>I</span>Z</a>
        <div className="live"><span className="dot" aria-hidden="true" /> CANLI</div>
      </header>

      <h1 className="question">Türkiye ne seçiyor?</h1>
      <p className="kicker">
        Soruyu değiştir, harita yeniden boyansın. Bir ile tıkla, o ilin sonucunu gör.
      </p>

      {/* Soru seçici: bağlantı olarak — JavaScript olmadan da çalışır. */}
      <nav className="chips" aria-label="Soru seç">
        {/* Aktif soru şeritte yoksa başa eklenir: seçili olan şey her zaman görünür olmalı. */}
        {(polls.slice(0, 6).some((p) => p.slug === poll.slug)
          ? polls.slice(0, 6)
          : [poll, ...polls.slice(0, 5)]
        ).map((item) => (
          <a
            key={item.slug}
            className={item.slug === poll.slug ? 'chip on' : 'chip'}
            href={`/harita?soru=${item.slug}${selectedCity ? `&il=${selectedCity.slug}` : ''}`}
          >
            {item.options[0]?.label} / {item.options[1]?.label}
          </a>
        ))}
      </nav>

      <section className="map-wrap">
        <TurkeyMap states={states} />
        <MapLegend aLabel={optionA.label} bLabel={optionB.label} />
        <p className="meta">
          {painted === 0
            ? `Henüz hiçbir ilde ${MAP_MIN_VOTES} oy birikmedi. Boyalı iller, eşiği geçtikçe belirecek.`
            : `${painted} ilde yeterli oy var. Eşiğin (${MAP_MIN_VOTES} oy) altındaki iller boş bırakılır — az oyla il boyamak, olmayan bir sonucu haritada gerçekmiş gibi göstermektir.`}
        </p>
      </section>

      <div className="split">
        <section className="panel">
          <h2 className="section-title">{selectedCity ? selectedCity.name : 'Türkiye geneli'}</h2>
          {selectedCity
            ? <CityPanel
                cityId={selectedCity.id}
                cityName={selectedCity.name}
                citySlug={selectedCity.slug}
                bucket={byCity.get(selectedCity.id)}
                optionA={optionA}
                optionB={optionB}
                national={nationalResults}
              />
            : <NationalPanel poll={poll} results={nationalResults} />}
        </section>

        <section className="panel">
          <h2 className="section-title">Nüfusa göre en katılımcı iller</h2>
          {mostEngaged.length === 0 ? (
            <p className="meta">Henüz il kırılımı yok. İlk oylar geldikçe burası dolacak.</p>
          ) : (
            <ol className="rank">
              {mostEngaged.map((city, index) => (
                <li key={city.id}>
                  <span className="rank-no">{index + 1}</span>
                  <a href={`/harita?soru=${poll.slug}&il=${city.slug}`}>{city.name}</a>
                  <span className="rank-val">{city.votes.toLocaleString('tr-TR')} oy</span>
                </li>
              ))}
            </ol>
          )}
          <p className="meta">
            Sıralama nüfusa göre normalize edilir; aksi hâlde listeyi her zaman İstanbul kazanır
            ve sıralama hiçbir şey anlatmaz.
          </p>
        </section>
      </div>

      {/* Renk körlüğü ve ekran okuyucu için: haritanın tablo karşılığı. */}
      <details className="table-view">
        <summary>Haritayı tablo olarak gör</summary>
        <div className="table-scroll">
          <table>
            <caption>{poll.question} — il kırılımı</caption>
            <thead>
              <tr>
                <th scope="col">İl</th>
                <th scope="col">{optionA.label}</th>
                <th scope="col">{optionB.label}</th>
                <th scope="col">Oy</th>
              </tr>
            </thead>
            <tbody>
              {CITIES.map((city) => {
                const bucket = byCity.get(city.id);
                const aVotes = bucket?.get(optionA.id) ?? 0;
                const bVotes = bucket?.get(optionB.id) ?? 0;
                const lean = leanToFill(aVotes, bVotes);
                return (
                  <tr key={city.id}>
                    <th scope="row"><a href={`/sehir/${city.slug}`}>{city.name}</a></th>
                    <td>{lean.aPct === null ? '—' : `%${lean.aPct.toFixed(1)}`}</td>
                    <td>{lean.aPct === null ? '—' : `%${(100 - lean.aPct).toFixed(1)}`}</td>
                    <td>{lean.votes.toLocaleString('tr-TR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      <p className="disclaimer">
        Harita, kullanıcıların kendi beyan ettiği şehre göre çizilir; konum verisi toplanmaz.
        Sınırlar idari referans değil görsel temsildir (kaynak: Natural Earth, kamu malı).
      </p>
    </main>
  );
}

function NationalPanel({
  poll, results,
}: {
  poll: { question: string; slug: string; options: Array<{ id: string; label: string; emoji: string | null }> };
  results: Array<{ optionId: string; count: number; pct: number }>;
}) {
  const total = results.reduce((sum, r) => sum + r.count, 0);
  const leader = leaderOf(results);

  return (
    <>
      <p className="panel-q">{poll.question}</p>
      {total === 0 ? (
        <p className="meta">Bu soruda henüz oy yok. <a href={`/${poll.slug}`}>İlk oyu sen ver.</a></p>
      ) : (
        <>
          <p className="panel-lead">
            {poll.options.find((o) => o.id === leader?.optionId)?.label}{' '}
            <b>%{leader?.pct.toFixed(1)}</b>
          </p>
          <p className="meta">{total.toLocaleString('tr-TR')} oy · bir il seç, kırılımı gör</p>
        </>
      )}
    </>
  );
}

function CityPanel({
  cityId, cityName, citySlug, bucket, optionA, optionB, national,
}: {
  cityId: number;
  cityName: string;
  citySlug: string;
  bucket: Map<string, number> | undefined;
  optionA: { id: string; label: string; emoji: string | null };
  optionB: { id: string; label: string; emoji: string | null };
  national: Array<{ optionId: string; count: number; pct: number }>;
}) {
  const aVotes = bucket?.get(optionA.id) ?? 0;
  const bVotes = bucket?.get(optionB.id) ?? 0;
  const total = aVotes + bVotes;

  if (total < MAP_MIN_VOTES) {
    return (
      <>
        <p className="meta">
          {cityName}’den {total.toLocaleString('tr-TR')} oy geldi; sonuç yayınlamak için en az{' '}
          {MAP_MIN_VOTES} gerekiyor.
        </p>
        <p className="meta"><a href={`/sehir/${citySlug}`}>{cityName} sayfası</a></p>
      </>
    );
  }

  const cityResults = computeResults([
    { optionId: optionA.id, count: aVotes },
    { optionId: optionB.id, count: bVotes },
  ]);

  const divergences = findDivergences(
    cityResults.map((row) => ({
      optionLabel: row.optionId === optionA.id ? optionA.label : optionB.label,
      cityPct: row.pct,
      nationalPct: national.find((n) => n.optionId === row.optionId)?.pct ?? row.pct,
    })),
    5,
  );

  return (
    <>
      {cityResults.map((row) => {
        const meta = row.optionId === optionA.id ? optionA : optionB;
        const isLeader = row.pct >= 50;
        return (
          <div className="panel-row" key={row.optionId}>
            <span>{meta.emoji} {meta.label}</span>
            <b className={isLeader ? 'lead' : undefined}>%{row.pct.toFixed(1)}</b>
          </div>
        );
      })}
      <p className="meta">{total.toLocaleString('tr-TR')} oy · plaka {cityId}</p>
      {divergences[0] && (
        <p className="insight">{describeDivergence(cityName, divergences[0])}</p>
      )}
      <p className="meta"><a href={`/sehir/${citySlug}`}>{cityName} sayfasının tamamı →</a></p>
    </>
  );
}
