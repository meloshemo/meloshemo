# Google Play Mağaza Metni — Dev Aynası

Bu dosya Play Console'daki alanlara **doğrudan kopyalanacak** şekilde
hazırlandı. Her başlık bir alan; kod bloğunun içi olduğu gibi yapıştırılır.
Karakter sınırları Play'in kendi sınırlarıdır ve metinler bu sınırın altında
tutuldu (`npm run magaza:denetim` sayar).

---

## 1. Uygulama bilgileri

| Alan | Değer |
| --- | --- |
| Paket adı (package name) | `com.meloshemo.devaynasi` |
| Varsayılan dil | Türkçe (tr-TR) |
| İkinci dil | İngilizce (en-US) |
| Uygulama türü | Oyun |
| Kategori | Bulmaca (Puzzle) |
| Etiketler | Bulmaca, Macera, Tek oyunculu, Çok oyunculu |
| Ücretsiz / ücretli | Ücretsiz |
| Uygulama içi satın alma | Yok |
| Reklam | Yok |

> **Paket adı değiştirilemez.** İlk yüklemeden sonra sabitlenir; `com.meloshemo.devaynasi`
> adını onaylamadan yükleme yapma.

---

## 2. Uygulama adı (en fazla 30 karakter)

```
Dev Aynası: Hall of Giants
```

---

## 3. Kısa açıklama (en fazla 80 karakter)

```
Binlerce özdeş ayna. Yalnızca biri seni dev gösteriyor. Onu bul.
```

---

## 4. Tam açıklama (en fazla 4000 karakter)

```
"Kendini dev aynasında görmek" bir Türk deyimidir: insanın kendini
gerçekte olduğundan büyük görmesi. Dev Aynası bu deyimi oynanabilir
hale getirir.

KARANLIK BİR AYNA SALONU

Elinde bir fenerle, duvarlarının tamamı ayna olan bir panayır salonundasın.
Bir aynaya yaklaştığında yansıman camın arkasında belirir — gerçek bir
yansımadır, boyun değişmez. Aynaların binlercesi seni olduğun gibi
gösterir.

Yalnızca biri seni altın renginde, panele sığmayan bir dev olarak
gösterir.

Onu bulduğunda içine yürürsün ve bir sonraki oda açılır.

YİRMİ ODA, YİRMİ KURAL

Her oda kendi kuralıyla gelir ve ilerledikçe salon büyür — ilk odada
5.000 ayna vardır, sonuncusunda 20.000.

• I · Aynalı Salon — Dev aynayı bul ve içine yürü
• II · Aynanın İçinde — Çarpık sahte devler arasından gerçeğini ayır
• III · Ters Salon — Kontroller aynalandı: sola bastığında sağa gidersin
• IV · Kayan Aynalar — Duvarlar yerinde durmuyor
• V · Yankı — Her adımını tersten tekrar eden bir ikiz peşinde
• VI · Kibir Odası — Kibrin en parlak odası
• VII–XII — Paris, Venedik, Tokyo, New York, Kahire, İstanbul
• XIII–XV — Londra sisi, Dubai cam kulesi, Rio karnavalı
• XVI · Kaçan Ayna — Dev ayna yerinde durmaz; yaklaşırsan kaçar
• XVII · Kyoto, Durgun Su — Yürürken görüntü dağılır; ancak durursan toplanır
• XVIII · Reykjavík, Buz Salonu — Zemin kaygan; durmak başlı başına bir iş
• XIX · Marrakeş, Sönen Fener — Fener sönüyor; yalnızca yeni gördüğün camlar besliyor
• XX · Sonsuzluk, Yalancı Aynalar — Bazı camlar dev gösterip yalan söyler

ÇEVRİMİÇİ YARIŞ

Aynı salonda sekiz kişiye kadar yarışın. Herkes birebir aynı salonu oynar
ve kalabalık salonu büyütür: her oyuncu salona 5.000 ayna daha ekler. Dev
aynayı en son bulan elenir, tek kişi kalana kadar sürer. Aynı anda bitiren
iki oyuncu aynı sırayı paylaşır ve aralarında beraberlik turu oynanır.

"Buldum" kararını sunucu verir, oyuncunun cihazı değil: dev aynanın yeri
oyuncuya önceden söylenmez, ancak dibine geldiğinde açıklanır. Işınlanma
hız sınırıyla engellenir.

SONSUZ SALON

Kuralların rastgele karıştığı, giderek zorlaşan bitimsiz bir salon. Tek
hedef kendi rekorunu geçmek.

İKİ KİŞİ, TEK CİHAZ

Bölünmüş ekranda karşılıklı düello: ikiniz de aynı salondasınız, aynı
dev aynayı arıyorsunuz.

DÜRÜST BİR OYUN

• Reklam yok, uygulama içi satın alma yok, abonelik yok
• Hesap açmanız gerekmiyor, e-posta istenmiyor
• Analiz paketi, izleyici, çökme raporu yok
• Tek kişilik oyun tamamen çevrimdışı çalışır
• Türkçe ve İngilizce, tam çeviri

Oyun bilinçli olarak sessizdir: ses yoktur.
```

---

## 5. Sürüm notları (en fazla 500 karakter)

```
İlk sürüm.

Yirmi oda, çevrimiçi yarış, sonsuz salon ve tek cihazda iki kişilik düello.
Reklamsız, satın almasız, tamamen çevrimdışı oynanabilir tek kişilik mod.
```

---

## 6. Grafikler

| Varlık | Boyut | Dosya | Durum |
| --- | --- | --- | --- |
| Uygulama ikonu | 512×512, saydamsız | `basin/android/play-ikon-512.png` | ✅ üretildi |
| Özellik grafiği | 1024×500, saydamsız | `basin/android/play-ozellik-1024x500-tr.png` | ✅ üretildi |
| Özellik grafiği (EN) | 1024×500 | `basin/android/play-ozellik-1024x500-en.png` | ✅ üretildi |
| Telefon ekran görüntüsü | 1920×1080, en az 2 en çok 8 | `basin/01…11-*.png` | ✅ 11 adet var |
| 7" tablet | 1920×1080 kabul edilir | aynı dosyalar | ✅ |
| 10" tablet | 1920×1080 kabul edilir | aynı dosyalar | ✅ |
| Tanıtım videosu | YouTube bağlantısı | `fragman/` içindeki WebM yüklenecek | ⬜ YouTube'a yüklenmeli |

Ekran görüntüleri yatay (16:9). Oyun yatay yöne kilitli olduğu için dikey
görüntü gerekmiyor.

---

## 7. Veri güvenliği formu (Data safety)

Play Console → Politika → Uygulama içeriği → Veri güvenliği. Cevaplar:

| Soru | Cevap |
| --- | --- |
| Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu? | **Hayır** |
| Veriler aktarım sırasında şifreleniyor mu? | Evet (`wss://`, TLS) |
| Kullanıcı verisinin silinmesini isteyebiliyor mu? | Toplanan veri yok |
| Bağımsız güvenlik incelemesi | Hayır |

**Gerekçe (gerekirse denetime yazılacak):** Çevrimiçi modda oyuncunun
yazdığı takma ad ve salon içi konumu sunucuya gider; sunucu bunları yalnızca
yarış sürerken bellekte tutar, oda boşalınca siler. Veritabanı yoktur, IP
günlüğü tutulmaz. Play'in tanımına göre bu "toplama" değildir: veri kalıcı
olarak saklanmaz ve kimliğe bağlanmaz.

> Takma ad alanına gerçek ad yazılması oyuncunun kendi tercihidir; oyun
> gerçek ad istemez ve doğrulamaz.

---

## 8. İçerik derecelendirmesi anketi (IARC)

| Soru | Cevap |
| --- | --- |
| Şiddet | Yok |
| Cinsellik / çıplaklık | Yok |
| Küfür / kaba dil | Yok |
| Uyuşturucu, alkol, tütün | Yok |
| Kumar (gerçek veya simüle) | Yok |
| Korku / ürkütücü içerik | Yok — karanlık bir atmosfer var, ani korkutma yok |
| Kullanıcılar birbiriyle etkileşebiliyor mu? | **Evet** — çevrimiçi yarışta diğer oyuncuların takma adları görünür |
| Kullanıcılar konum paylaşıyor mu? | Hayır |
| Kullanıcı tarafından üretilen içerik paylaşılıyor mu? | Hayır — sohbet yok, yalnızca takma ad |
| Dijital satın alma | Yok |

Beklenen derecelendirme: **3+ / Everyone**.

---

## 9. Hedef kitle ve içerik

| Alan | Değer |
| --- | --- |
| Hedef yaş aralığı | 13+ (çevrimiçi etkileşim nedeniyle) |
| Çocuklara yönelik mi? | Hayır |
| Reklam içeriyor mu? | Hayır |
| Devlet uygulaması mı? | Hayır |
| Finans özellikleri | Yok |
| COVID-19 izleme | Yok |

> 13+ seçilmesinin nedeni: çevrimiçi modda oyuncular birbirinin yazdığı
> takma adı görüyor. Oyunun içeriği her yaşa uygundur; "Çocuklar ve Aileler"
> programına girilirse takma ad alanının kaldırılması gerekir.

---

## 10. İletişim ve bağlantılar

| Alan | Değer |
| --- | --- |
| E-posta | `y.osmanmelih@gmail.com` |
| Gizlilik politikası URL'si | ⬜ **doldurulacak** — `belgeler/GIZLILIK-POLITIKASI.md` bir adrese konmalı |
| Web sitesi | ⬜ isteğe bağlı |
| Destek telefonu | gerekmiyor |

> **Gizlilik politikası URL'si zorunludur.** Markdown dosyası yetmez; Play
> çalışan bir bağlantı ister. En ucuz yol GitHub Pages: depo ayarlarından
> Pages açılır, politika HTML olarak yayımlanır.

---

## 11. Yüklemeden önce son kontrol

- [ ] `com.meloshemo.devaynasi` paket adı onaylandı (sonra değişmez)
- [ ] İmza anahtarı üretildi ve **yedeklendi** (`mobil/README.md`)
- [ ] Play App Signing açıldı (Google anahtarı saklar, kaybolma riski biter)
- [ ] Gizlilik politikası bir adrese kondu ve URL girildi
- [ ] Veri güvenliği formu dolduruldu
- [ ] İçerik derecelendirme anketi dolduruldu
- [ ] Ekran görüntüleri ve özellik grafiği yüklendi
- [ ] Kapalı test (closed testing) ile en az bir cihazda denendi
- [ ] `versionCode` bir önceki yüklemeden büyük
