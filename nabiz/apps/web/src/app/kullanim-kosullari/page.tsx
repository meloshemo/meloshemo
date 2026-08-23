import type { Metadata } from 'next';
import { LegalNotice } from '@/components/LegalNotice';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: 'Nabız kullanımına ilişkin koşullar.',
};

export default function TermsPage() {
  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="/">NAB<span>I</span>Z</a>
      </header>
      <h1 className="question">Kullanım Koşulları</h1>
      <LegalNotice />

      <section className="card">
        <h2 className="section-title">Hizmetin niteliği</h2>
        <p className="meta">
          Nabız bir eğlence ve kamuya açık tercih platformudur. Bilimsel kamuoyu araştırması
          değildir; sonuçlar temsili örnekleme dayanmaz ve karar alma süreçlerinde
          araştırma verisi olarak kullanılmamalıdır.
        </p>

        <h2 className="section-title">Oy manipülasyonu</h2>
        <p className="meta">
          Otomatik araçlarla oy vermek, birden fazla oturum üreterek sonucu etkilemeye
          çalışmak veya oy karşılığı teşvik sunmak yasaktır. Bu tür oylar sayımdan çıkarılır.
        </p>

        <h2 className="section-title">Veri kullanımı</h2>
        <p className="meta">
          Yayınlanan toplu sonuçları kaynak göstererek paylaşabilirsin. Otomatik toplu
          veri çekme (scraping) hız sınırlarına tabidir; ticari kullanım için bize ulaş.
        </p>

        <h2 className="section-title">İçerik</h2>
        <p className="meta">
          Sorular editoryal olarak seçilir. Siyasi propaganda, nefret söylemi, kişilere
          yönelik saldırı ve hassas kişisel veri talebi içeren sorular yayınlanmaz.
        </p>

        <h2 className="section-title">Sorumluluk</h2>
        <p className="meta">
          Hizmet “olduğu gibi” sunulur. Sonuçların kesintisizliği veya belirli bir amaca
          uygunluğu konusunda taahhüt verilmez.
        </p>
      </section>
    </main>
  );
}
