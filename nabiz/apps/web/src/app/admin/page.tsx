import { getRepository } from '@/server/context';

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const metrics = await getRepository().getAdminMetrics();
  const quarantineRate = metrics.totalVotes === 0
    ? 0
    : (metrics.quarantinedVotes / metrics.totalVotes) * 100;

  return (
    <main>
      <header className="topbar">
        <div className="wordmark">NAB<span>I</span>Z · admin</div>
        <a className="live" href="/admin/yeni">+ Yeni soru</a>
      </header>

      <section className="card">
        <h2 className="section-title">Özet</h2>
        <p className="meta">
          Toplam oy: <b>{metrics.totalVotes.toLocaleString('tr-TR')}</b> ·
          {' '}Sayılan: <b>{metrics.countedVotes.toLocaleString('tr-TR')}</b> ·
          {' '}Karantina: <b>{metrics.quarantinedVotes.toLocaleString('tr-TR')}</b>
          {' '}(%{quarantineRate.toFixed(1)})
        </p>
        <p className="meta">
          Yayında {metrics.livePolls} soru · {metrics.draftPolls} taslak · {metrics.shares} paylaşım
        </p>
        {/* Sağlıklı aralık %2–8 (docs/11). Dışına çıkarsa eşikler yanlış demektir. */}
        {metrics.totalVotes > 100 && (quarantineRate > 8 || quarantineRate < 2) && (
          <p className="meta" style={{ color: 'var(--down)' }}>
            ⚠ Karantina oranı sağlıklı aralığın ({'%2–8'}) dışında — anti-abuse eşiklerini gözden geçir.
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">Sorular</h2>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--muted)', textAlign: 'left' }}>
              <th>Soru</th><th>Durum</th><th style={{ textAlign: 'right' }}>Oy</th><th style={{ textAlign: 'right' }}>Önde</th>
            </tr>
          </thead>
          <tbody>
            {metrics.perPoll.map((row) => (
              <tr key={row.slug} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: '8px 0' }}><a href={`/${row.slug}`}>{row.question}</a></td>
                <td>{row.status}</td>
                <td style={{ textAlign: 'right' }}>{row.votes.toLocaleString('tr-TR')}</td>
                {/* %80 üstü çekişmesiz sorudur: içerik değildir, arşive alınmalı (docs/19). */}
                <td style={{ textAlign: 'right', color: row.leaderPct > 80 ? '#f79009' : undefined }}>
                  %{row.leaderPct.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
