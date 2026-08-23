import type { Metadata } from 'next';
import { LegalNotice } from '@/components/LegalNotice';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: '6698 sayılı Kanun kapsamında veri işleme esasları.',
};

export default function KvkkPage() {
  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="/">NAB<span>I</span>Z</a>
      </header>
      <h1 className="question">KVKK Aydınlatma Metni</h1>
      <LegalNotice />

      <section className="card">
        <h2 className="section-title">İşlenen veriler ve amaç</h2>
        <p className="meta">
          Platform, kimlik bilgisi toplamaz. İşlenen tek veri kategorisi, hizmetin
          güvenliğini sağlamaya yönelik teknik kayıtlardır: oturum tanımlayıcısı ve
          IP adresinin günlük değişen anahtarla üretilmiş geri döndürülemez özeti.
          Amaç, aynı kişinin aynı soruya birden çok kez oy vermesini ve otomatik
          araçlarla sonuç manipülasyonunu engellemektir.
        </p>

        <h2 className="section-title">Hukuki sebep</h2>
        <p className="meta">
          Veri işleme, hizmetin sunulabilmesi ve platformun güvenliğinin sağlanmasına
          yönelik meşru menfaat kapsamında, veri minimizasyonu ilkesine uygun olarak
          yürütülür.
        </p>

        <h2 className="section-title">Aktarım</h2>
        <p className="meta">
          Veriler pazarlama amacıyla üçüncü taraflara aktarılmaz veya satılmaz. Barındırma
          ve veritabanı hizmet sağlayıcıları yalnızca hizmetin çalışması için
          işleyen sıfatıyla yer alır.
        </p>

        <h2 className="section-title">Saklama</h2>
        <p className="meta">
          Ham oy kayıtları 180 gün sonunda silinir. Kişisel veri niteliği taşımayan toplu
          sayımlar süresiz saklanır.
        </p>

        <h2 className="section-title">Haklar</h2>
        <p className="meta">
          6698 sayılı Kanun’un 11. maddesindeki haklarına ilişkin taleplerini bize
          iletebilirsin. Kimlik verisi tutulmadığı için bir kaydın belirli bir kişiyle
          eşleştirilmesi çoğu durumda mümkün olmaz.
        </p>
      </section>
    </main>
  );
}
