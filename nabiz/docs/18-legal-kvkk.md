# Legal & Compliance Checklist

> Bu bir hukuk danışmanlığı değildir. Aşağıdakiler **launch öncesi avukata sorulacak
> maddelerin listesidir**, cevapların kendisi değil.

## Ürün tasarımıyla azaltılan riskler (uyum ilk günden mimaride)
- **Hesap yok** → kimlik verisi yok
- **Ham IP saklanmıyor** → günlük dönen tuzla HMAC, 24 saat sonrası takip imkânsız
- **Kalıcı fingerprint yok** → açık rıza gerektiren işleme yok
- **Çerezsiz analytics** (Plausible/Umami) → çerez rıza bandı gereksiz; tek çerez teknik zorunlu
  oturum çerezi (rıza gerektirmeyen kategori — yine de teyit ettir)
- **Şehir bilgisi kullanıcı beyanı, opsiyonel, atlanabilir** → konum verisi toplanmıyor

## Launch öncesi zorunlu kontroller
1. **KVKK:** aydınlatma metni · veri envanteri · VERBİS yükümlülüğü var mı (muhtemelen yok ama teyit) · saklama süreleri (ham oy 180 gün)
2. **GDPR:** AB'den erişim varsa uygulanır — aynı mimari çoğunu karşılıyor; DPA'lar (Vercel/Cloudflare/Neon) imzalı
3. **Çerez politikası** ve teknik çerez sınıflandırması
4. **Kullanım Koşulları:** oy manipülasyonu yasağı, scraping sınırları, sorumluluk reddi
5. **Gizlilik Politikası** (Türkçe + İngilizce)
6. **Metodoloji/sorumluluk reddi:** "bilimsel kamuoyu araştırması değildir" ifadesi her sonuçta
7. **Sponsorlu içerik açıklaması:** Reklam Kurulu ve TKHK kapsamında etiketleme zorunluluğu
8. **Şans oyunları riski:** oy karşılığı ödül/çekiliş **yapılmayacak** (mevzuat riski)
9. **Marka tescili:** "Nabız" kelime+logo, sınıf 35/38/42; ayrıca "Türkiye'nin Seçimi" ödül markası
10. **"Türkiye" ibaresi kullanımı:** marka adında ülke adı kullanımına ilişkin sınırlar teyit edilmeli
11. **Haksız rekabet:** marka vs marka karşılaştırmalarında TTK 55 çerçevesi
12. **Veri ticarileştirme:** agrege veri satışının sözleşmesel çerçevesi; ham veri asla satılmaz
13. **İçerik sorumluluğu:** 5651 sayılı kanun kapsamında yer sağlayıcı/içerik sağlayıcı statüsü
    (UGC olmadığı için içerik sağlayıcıyız — yükümlülük bizde, bu yüzden editoryal politika kritik)
