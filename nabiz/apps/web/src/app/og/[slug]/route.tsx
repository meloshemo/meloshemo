import { ImageResponse } from 'next/og';
import { computeResults } from '@nabiz/core';
import { DEFAULT_VARIANT, isShareVariant, VARIANTS } from '@nabiz/share';
import { getRepository } from '@/server/context';

export const runtime = 'nodejs';

/**
 * Dinamik paylaşım kartı. Değişmez kural: her kartta yüzdeler, toplam oy, tarih ve
 * site adresi bulunur — kaynağı belirsiz bir ekran görüntüsü markaya zarar verir.
 *
 * Satori notu: birden fazla çocuğu olan her <div> explicit `display` taşımak zorundadır ve
 * metinler tek parça olmalıdır (JSX'te "%" ile değişkeni yan yana yazmak iki çocuk demektir).
 *
 * Cache: sonuç dakikada bir değişse yeter; kart URL'i sonucun kendisinden türetilmez,
 * bu yüzden kısa TTL ile edge'de tutulur.
 */
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const repo = getRepository();
  const poll = await repo.getPollBySlug(slug);
  if (!poll) return new Response('not_found', { status: 404 });

  const variantParam = new URL(request.url).searchParams.get('variant');
  const variant = isShareVariant(variantParam) ? variantParam : DEFAULT_VARIANT;
  const spec = VARIANTS[variant];

  const rows = await repo.getAggregates(poll.id, 0);
  const results = computeResults(rows);
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const leader = [...results].sort((a, b) => b.pct - a.pct)[0];

  const label = (optionId: string) => poll.options.find((o) => o.id === optionId)?.label ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: spec.width, height: spec.height, display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: spec.padding,
          background: '#0b0d12', color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, letterSpacing: 2 }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: '#e30a17' }} />
          <div style={{ fontWeight: 800 }}>NABIZ</div>
          <div style={{ color: '#9aa4b2' }}>· CANLI</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ fontSize: spec.questionSize, fontWeight: 700, lineHeight: 1.15 }}>
            {poll.question}
          </div>

          {results.map((option) => (
            <div key={option.optionId} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                {/*
                  Emoji bilerek yok: Satori'nin gömülü fontunda emoji glifi bulunmuyor ve
                  harici emoji fontu yüklemek her kart üretiminde ağ isteği demek. Boş kare
                  gösteren bir kart, emojisiz temiz bir karttan daha kötüdür.
                */}
                <div style={{ fontSize: spec.questionSize * 0.72 }}>
                  {label(option.optionId)}
                </div>
                <div style={{ fontSize: spec.pctSize, fontWeight: 800, lineHeight: 1 }}>
                  {`%${option.pct.toFixed(1)}`}
                </div>
              </div>
              <div style={{ display: 'flex', height: 18, background: '#1e2430', borderRadius: 9 }}>
                <div
                  style={{
                    width: `${Math.max(option.pct, 0.5)}%`, height: 18, borderRadius: 9,
                    background: option.optionId === leader?.optionId ? '#e30a17' : '#4a5568',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: '#9aa4b2' }}>
          <div>{`${total.toLocaleString('tr-TR')} oy · ${new Date().toLocaleDateString('tr-TR')}`}</div>
          <div style={{ color: '#ffffff', fontWeight: 700 }}>nabiz.io</div>
        </div>
      </div>
    ),
    {
      width: spec.width,
      height: spec.height,
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' },
    },
  );
}
