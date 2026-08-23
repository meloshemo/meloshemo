import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nasıl sayıyoruz?',
  description: 'Nabız sonuçlarının nasıl toplandığı, nasıl filtrelendiği ve neyi iddia etmediği.',
};

export default function MethodologyPage() {
  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="/">NAB<span>I</span>Z</a>
      </header>
      <h1 className="question">Nasıl sayıyoruz?</h1>

      <section className="card">
        <h2 className="section-title">Ne iddia ediyoruz</h2>
        <p className="meta">
          Nabız, platforma giren kullanıcıların tercihlerini gösterir. Bu, Türkiye nüfusunu temsil
          eden bilimsel bir araştırma <b>değildir</b>. Katılım gönüllüdür, örneklem rastgele seçilmez.
        </p>

        <h2 className="section-title">Mükerrer oy</h2>
        <p className="meta">
          Her tarayıcı oturumu bir soruya bir kez oy verebilir. Aynı ağdan gelen olağandışı
          yoğunluklar hız limitleriyle sınırlanır.
        </p>

        <h2 className="section-title">Şüpheli oylar</h2>
        <p className="meta">
          Otomatik davranış işaretleri taşıyan oylar (insan tepki süresinin altında karar,
          hiç etkileşim olmaması, veri merkezi ağları) kayda geçer ama sayıma katılmaz.
          Sonuçlar 24 saat içinde yeniden değerlendirilerek kesinleşir.
        </p>

        <h2 className="section-title">Kişisel veri</h2>
        <p className="meta">
          Hesap açmıyoruz. IP adresini ham hâliyle saklamıyoruz — her gün değişen bir anahtarla
          geri döndürülemez şekilde hash’liyoruz. Kalıcı cihaz parmak izi kullanmıyoruz.
          Şehir bilgisi yalnızca senin beyanındır ve istemezsen boş bırakabilirsin.
        </p>

        <h2 className="section-title">Şehir kırılımı</h2>
        <p className="meta">
          Bir şehrin sonucu, o şehirden en az 100 oy gelmeden gösterilmez. Az sayıda oyla
          şehir yüzdesi yayınlamak yanlış bilgi üretir.
        </p>
      </section>
    </main>
  );
}
