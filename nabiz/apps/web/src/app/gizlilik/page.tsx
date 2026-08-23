import type { Metadata } from 'next';
import { LegalNotice } from '@/components/LegalNotice';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'Nabız hangi verileri topluyor, hangilerini toplamıyor.',
};

export default function PrivacyPage() {
  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="/">NAB<span>I</span>Z</a>
      </header>
      <h1 className="question">Gizlilik Politikası</h1>
      <LegalNotice />

      <section className="card">
        <h2 className="section-title">Toplamadıklarımız</h2>
        <p className="meta">
          Hesap açmıyoruz: ad, e-posta, telefon ya da kimlik bilgisi istemiyoruz.
          Konum verisi toplamıyoruz. Kalıcı cihaz parmak izi (canvas, WebGL, font imzası)
          kullanmıyoruz. Reklam takip çerezi yerleştirmiyoruz.
        </p>

        <h2 className="section-title">Topladıklarımız</h2>
        <p className="meta">
          <b>Oturum tanımlayıcısı:</b> tarayıcında rastgele üretilmiş, imzalı bir çerez.
          Amacı yalnızca aynı soruya iki kez oy verilmesini engellemektir.
        </p>
        <p className="meta">
          <b>IP adresi:</b> ham hâlde saklanmaz. Her gün değişen bir anahtarla geri
          döndürülemez şekilde hash’lenir ve yalnızca kötüye kullanım tespiti için tutulur.
          Anahtar günlük değiştiği için 24 saati aşan bir takip teknik olarak mümkün değildir.
        </p>
        <p className="meta">
          <b>Şehir:</b> yalnızca senin beyanına dayanır, seçmek zorunda değilsin ve
          istediğin zaman değiştirebilirsin.
        </p>
        <p className="meta">
          <b>Oy kaydı:</b> hangi soruya hangi seçeneği işaretlediğin, oturum tanımlayıcısıyla
          birlikte tutulur. Bu kayıt seni kişi olarak tanımlamaz.
        </p>

        <h2 className="section-title">Saklama süreleri</h2>
        <p className="meta">
          Ham oy kayıtları 180 gün sonra silinir. Kişisel veri içermeyen toplu sayımlar
          ve zaman serileri süresiz saklanır.
        </p>

        <h2 className="section-title">Ölçümleme</h2>
        <p className="meta">
          Ziyaret istatistikleri için çerez kullanmayan, kişi bazlı takip yapmayan bir
          analitik aracı kullanıyoruz.
        </p>

        <h2 className="section-title">Haklarınız</h2>
        <p className="meta">
          KVKK kapsamındaki taleplerin için bize ulaşabilirsin. Hesap tutmadığımız için
          bir kaydı kişiyle eşleştirebilmemiz çoğu durumda mümkün olmaz; bu, tasarımın
          sonucudur.
        </p>
      </section>
    </main>
  );
}
