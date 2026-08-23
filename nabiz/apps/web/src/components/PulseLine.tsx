/**
 * Nabız çizgisi — bir seçeneğin son saatlerdeki pay eğrisi.
 *
 * Markanın adı "Nabız"; trend göstergesinin de bir nabız çizgisi olması tesadüf değil.
 * Yeşil bir "+%12" etiketi bir sayıdır; yükselen bir çizgi ise bir HAREKET gösterir —
 * ve bakan kişi hareketi sayıdan önce okur.
 *
 * Ölçek bilerek serinin kendi min/max aralığına göre normalize edilir: 0–100 sabit
 * ekseninde çizilen bir pay eğrisi neredeyse düz görünür ve hiçbir şey anlatmaz.
 */
export function PulseLine({
  series,
  rising,
  width = 96,
  height = 28,
}: {
  series: number[];
  rising: boolean;
  width?: number;
  height?: number;
}) {
  if (series.length < 2) return null;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(max - min, 1); // düz seri için sıfıra bölmeyi engeller
  const pad = 3;

  const points = series.map((value, index) => {
    const x = (index / (series.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${path} L${(width - pad).toFixed(1)},${height} L${pad},${height} Z`;
  const last = points[points.length - 1]!;
  const color = rising ? 'var(--up)' : 'var(--muted)';
  const gradientId = `pulse-${rising ? 'up' : 'flat'}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}
