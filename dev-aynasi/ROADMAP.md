# Yayına kalanlar

> **Durum (1.9.3):** oyunun kendisi bitti — tek kişilik, düello, sonsuz salon
> ve çevrimiçi turnuva çalışıyor, hepsi ölçülü. Kalan işlerin tamamı
> **dağıtım**: barındırma, imzalama ve mağaza hesapları. Hiçbiri oyun kodu
> değil.

## Ölçülen durum

| Ne | Nasıl ölçüldü | Sonuç |
| --- | --- | --- |
| Kural matematiği | `npm test` | 18/18 |
| Oyun (20 oda, fizik, kare bütçesi, ağ sessizliği) | `npm run denetim` | 6/6 |
| Çevrimiçi turnuva (gerçek sunucu + botlar) | `npm run denetim:cevrimici` | 5/5 |
| Kare süresi (en büyük oda) | denetim | ortanca 8,9 ms · bütçe aşımı %0,6 |
| Akıcılık | 1.9.2 ölçümleri | DPR 1/2/3 → 60 fps |

## 1. Yayına alma — kalan işler

### 1.1 Çevrimiçi sunucu barındırma — **tek gerçek engel**
Şu an oyuncu sunucu adresini elle yazıyor (`ws://localhost:8787`). Yani
çevrimiçi yarış ancak kendi sunucusunu kuran biri için çalışıyor.

- [ ] Sunucuyu bir yere koy (Fly.io, Railway, Hetzner — WebSocket destekleyen
      herhangi bir Node ortamı yeter)
- [ ] `wss://` (TLS) sertifikası — https sayfadan `ws://` bağlantısı tarayıcı
      tarafından reddedilir, bu zorunlu
- [ ] Varsayılan adresi oyuna gömmek, adres alanını "gelişmiş" altına almak
- [ ] `?kod=1234` ile tek linkle davet

**Neden ben yapamıyorum:** barındırma hesabı, ödeme yöntemi ve alan adı senin
adına açılır; sertifika senin alan adına kesilir.

### 1.2 Masaüstü paketleri
- [x] Linux `.AppImage` ve Windows `.exe` üretildi (1.8.0 sürümünde, Wine ile)
- [ ] Paketleri 1.9.3 ile yeniden üret (`masaustu/cikti` hâlâ 1.8.0)
- [ ] macOS `.dmg` — yalnızca macOS'ta üretilir; `.github/workflows/`
      içindeki iş akışı bunu GitHub'ın makinelerinde yapıyor, tek gereken
      Actions'tan çalıştırmak
- [ ] Kod imzalama: Windows sertifikası (~100–400 $/yıl), Apple Developer
      kimliği (99 $/yıl). İmzasız paketlerde "geliştirici doğrulanamadı"
      uyarısı çıkar. Ayrıntı: `masaustu/README.md`

**Neden ben yapamıyorum:** imzalama özel anahtar ister; o anahtar senin
kimliğin, bana verilmez.

### 1.3 Mağaza
- [x] Mağaza metni, basın kiti, sistem gereksinimleri (`belgeler/`)
- [x] Kapsül görselleri, 11 ekran görüntüsü, ikon (`basin/`, `ikon/`)
- [x] Fragman (TR + EN, WebM)
- [ ] Fragmanı MP4'e çevir — Steam WebM kabul etmiyor
- [ ] Steamworks hesabı + 100 $ sayfa ücreti
- [ ] Gizlilik politikasını ve kullanım koşullarını bir adrese koy — mağazalar
      markdown dosyası değil, çalışan bir bağlantı ister. Çevrimiçi mod takma
      ad topladığı için bu zorunlu.

## 2. Bitti

Oyun tarafında açık iş yok.

- [x] 20 oda, hepsi geçilebilir (denetimle doğrulandı)
- [x] Çevrimiçi turnuva: oda kodu, renkler, sunucu kararlı "buldum", sezgi,
      eleme, beraberlik turu, sıralama tablosu, tek kazanana inme
- [x] Oyuncu başına +5.000 ayna (4 kişi → 20.133 ayna ölçüldü)
- [x] Sonsuz salon modu, rekor
- [x] Düello (tek ekran, iki oyuncu)
- [x] Fare ile oynama (basılı tut-yönlendir; hız avantajı yok, ölçüldü)
- [x] Tam İngilizce sürüm
- [x] Tek dosyalık sürüm (`dev-aynasi-tek-dosya.html`, yazı tipleri gömülü)
- [x] Hiçbir dış siteye istek gitmiyor (denetimle doğrulandı)

## 3. Yapılmayacak / beklemede

- [ ] Müzik — telifsiz ya da sipariş edilmiş bir parça bulunursa. Oyun şu an
      bilinçli olarak sessiz (bkz. `CLAUDE.md`, değişmez kural 1).
- [ ] Sahte aynada kısa süre cezası
- [ ] Günlük salon: herkesin aynı salonu oynadığı günlük kod ve sıralama
- Başka deyimler için ayrı oyun yapılmayacak. Oyun tek bir deyimin oyunu
  olarak kalıyor: **kendini dev aynasında görmek**.
