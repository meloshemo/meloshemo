import { redirect } from 'next/navigation';
import { EDITORIAL_CHECKLIST, scanEditorial, slugify, versusSlug } from '@nabiz/core';
import { CATEGORIES } from '@nabiz/db';
import { getRepository } from '@/server/context';

export const metadata = { robots: { index: false, follow: false } };

async function createPoll(formData: FormData) {
  'use server';

  const question = String(formData.get('question') ?? '').trim();
  const labelA = String(formData.get('labelA') ?? '').trim();
  const labelB = String(formData.get('labelB') ?? '').trim();
  const categorySlug = String(formData.get('category') ?? '');
  const publish = formData.get('publish') === 'on';

  // Kontrol listesinin TAMAMI işaretlenmeden yayın yapılamaz — sunucu tarafında zorlanır.
  const checkedAll = EDITORIAL_CHECKLIST.every((_, index) => formData.get(`check-${index}`) === 'on');

  if (!question || !labelA || !labelB) redirect('/admin/yeni?hata=eksik');
  if (publish && !checkedAll) redirect('/admin/yeni?hata=kontrol');

  const flags = scanEditorial(question, labelA, labelB);
  if (flags.length > 0) redirect(`/admin/yeni?hata=editoryal&konu=${encodeURIComponent(flags[0]!.kind)}`);

  const repo = getRepository();
  const slugCandidate = String(formData.get('slug') ?? '').trim();
  const poll = await repo.createPoll({
    slug: slugCandidate ? slugify(slugCandidate) : versusSlug(labelA, labelB),
    question,
    categorySlug,
    options: [
      { label: labelA, emoji: String(formData.get('emojiA') ?? '') },
      { label: labelB, emoji: String(formData.get('emojiB') ?? '') },
    ],
    editorialOk: checkedAll,
  });

  if (publish) await repo.publishPoll(poll.id);
  redirect('/admin');
}

export default async function NewPollPage({
  searchParams,
}: { searchParams: Promise<{ hata?: string; konu?: string }> }) {
  const { hata, konu } = await searchParams;

  const input = {
    width: '100%', minHeight: 44, marginTop: 6, marginBottom: 12, background: 'var(--card-2)',
    color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 12, padding: '0 12px',
  } as const;

  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="/admin">NAB<span>I</span>Z · admin</a>
      </header>
      <h1 className="question">Yeni soru</h1>

      {hata && (
        <p className="meta" role="alert" style={{ color: '#f79009' }}>
          {hata === 'eksik' && 'Soru ve iki seçenek zorunlu.'}
          {hata === 'kontrol' && 'Yayın için editoryal kontrol listesinin tamamı işaretlenmeli.'}
          {hata === 'editoryal' && `Otomatik tarama şüpheli içerik buldu (${konu}). Soruyu değiştir.`}
        </p>
      )}

      <form action={createPoll} className="card">
        <label className="meta" htmlFor="question">Soru</label>
        <input id="question" name="question" style={input} placeholder="Türkiye'nin en sevilen tatlısı hangisi?" />

        <label className="meta" htmlFor="labelA">Seçenek A</label>
        <input id="labelA" name="labelA" style={input} placeholder="Baklava" />
        <input name="emojiA" style={input} placeholder="🍯" aria-label="A seçeneği emoji" />

        <label className="meta" htmlFor="labelB">Seçenek B</label>
        <input id="labelB" name="labelB" style={input} placeholder="Künefe" />
        <input name="emojiB" style={input} placeholder="🧀" aria-label="B seçeneği emoji" />

        <label className="meta" htmlFor="category">Kategori</label>
        <select id="category" name="category" style={input}>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.nameTr}</option>)}
        </select>

        <label className="meta" htmlFor="slug">Slug (boş bırakılırsa üretilir)</label>
        <input id="slug" name="slug" style={input} placeholder="baklava-vs-kunefe" />

        <h2 className="section-title">Editoryal kontrol</h2>
        {EDITORIAL_CHECKLIST.map((item, index) => (
          <label key={item} className="meta" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="checkbox" name={`check-${index}`} />
            <span>{item}</span>
          </label>
        ))}

        <label className="meta" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input type="checkbox" name="publish" />
          <span>Hemen yayınla</span>
        </label>

        <div className="actions"><button className="btn primary" type="submit">Kaydet</button></div>
      </form>
    </main>
  );
}
