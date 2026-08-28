# Steam Mağaza Sayfası Metni — Dev Aynası

Bu dosya doğrudan Steamworks alanlarına kopyalanacak şekilde hazırlandı.

## Oyun adı
```
Dev Aynası: Hall of Giants
```

## Kısa açıklama (Short Description — en fazla 300 karakter)
```
Binlerce özdeş aynanın olduğu karanlık bir salondasın. Hepsi seni olduğun gibi
gösteriyor; yalnızca biri seni devasa gösteriyor. Onu bul, içine yürü. Altı
oda, altı kural — ve sonunda kendine dönmen gerekiyor.
```

## Uzun açıklama (About This Game)
```
[h2]Kendini dev aynasında gör[/h2]
"Kendini dev aynasında görmek" bir Türk deyimidir: insanın kendini gerçekte
olduğundan büyük görmesi. Dev Aynası bu deyimi oynanabilir hale getirir.

Elinde bir fenerle, duvarlarının tamamı ayna olan bir panayır salonundasın.
Bir aynaya yaklaştığında yansıman camın arkasında belirir — gerçek bir
yansımadır. Aynaların hepsi seni olduğun gibi gösterir. Yalnızca biri seni
altın renginde, panele sığmayan bir dev olarak gösterir.

Onu bulduğunda içine yürürsün ve bir sonraki oda açılır.

[h2]Altı oda, altı kural[/h2]
[list]
[*][b]I · Aynalı Salon[/b] — Dev aynayı bul ve içine yürü
[*][b]II · Aynanın İçinde[/b] — Çarpık sahte devler arasından gerçeğini ayır
[*][b]III · Ters Salon[/b] — Kontroller aynalandı: sola bastığında sağa gidersin
[*][b]IV · Kayan Aynalar[/b] — Duvarlar yerinde durmuyor
[*][b]V · Yankı[/b] — Her adımını tersten tekrar eden bir ikiz peşinde
[*][b]VI · Kibir Odası[/b] — Aynayı bul, sonra sönen ışıkla kapıya dön
[/list]

[h2]Yalnız ya da karşılıklı[/h2]
[list]
[*]Tek klavyede iki kişi, bölünmüş ekran, aynı salonda yarış
[*]Salon kodu: aynı kodu giren herkes birebir aynı salonu oynar
[*]Çevrimiçi yarış yolda: kalabalık arttıkça salon büyür, 26.000 aynaya kadar
[/list]

[h2]Detaylar[/h2]
[list]
[*]Her ayna gerçek bir yansıma çizer
[*]Sessiz tasarım: ses ve müzik yok, dikkat tamamen aramada
[*]Kurulum gerektirmez, hafiftir, düşük donanımda da 60 FPS
[/list]
```

## Etiketler (Tags)
```
Puzzle, Exploration, Atmospheric, Singleplayer, Local Multiplayer,
Split Screen, Minimalist, Short, Casual, Indie, Psychological
```

## Sistem gereksinimleri
```
MINIMUM:
  İşletim Sistemi: Windows 10 / macOS 12 / Linux (modern tarayıcı)
  İşlemci: 2 çekirdek, 1.6 GHz
  Bellek: 2 GB RAM
  Ekran Kartı: Tümleşik (WebGL/Canvas 2D destekli)
  Depolama: 50 MB
  Ek not: Klavye gerekir. Oyun sessizdir.

ÖNERİLEN:
  İşletim Sistemi: Windows 11 / macOS 14
  İşlemci: 4 çekirdek, 2.4 GHz
  Bellek: 4 GB RAM
  Ekran Kartı: Tümleşik veya üstü
  Depolama: 50 MB
```

## Kontroller
```
W A S D / yön tuşları — yürü
Shift — koş
H — sezgi (dev aynanın yönünü bir an gösterir)
R — yeni salon
Düello: 2. oyuncu yön tuşları + M
```

## Gerekli görseller ve durumu
| Alan | Boyut | Dosya |
| --- | --- | --- |
| Header capsule | 460×215 | `basin/steam-header-460x215.png` ✅ |
| Main capsule | 616×353 | `basin/steam-kapsul-616x353.png` ✅ |
| Library capsule | 600×900 | `basin/steam-kutuphane-600x900.png` ✅ |
| Page background | 1438×810 | `basin/steam-arkaplan-1438x810.png` ✅ |
| Ekran görüntüleri | 1920×1080 | `basin/01…07` ✅ |
| Küçük capsule | 231×87 | üretilecek |
| Fragman videosu | — | çekilecek |

## Yayın öncesi kontrol listesi
- [ ] Steamworks hesabı ve 100 USD ücret
- [ ] Vergi ve banka bilgileri (Steam ödeme onayı 30 güne kadar sürebilir)
- [ ] Mağaza sayfası incelemesi (Valve onayı ~1-5 iş günü)
- [ ] Gizlilik politikası bağlantısı (`belgeler/GIZLILIK-POLITIKASI.md`)
- [ ] Fragman videosu (30-60 sn: karanlık salon → dev ayna → geçiş)
- [ ] Oyunun masaüstü paketi (Electron/Tauri ile tek çalıştırılabilir dosya)
- [ ] Çevrimiçi yarış sunucusu (isteğe bağlı, yayın sonrasına bırakılabilir)
