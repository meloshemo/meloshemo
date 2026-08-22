# Risk Analizi — 20 Risk ve Çözümleri

| # | Risk | Olasılık | Etki | Çözüm |
|---|---|---|---|---|
| 1 | **Kimse gelmez** (en büyük risk) | Yüksek | Ölümcül | 30 günlük kapı metrikleri; ürün değil dağıtım işi yap; içerik günde 2 video |
| 2 | Gelenler geri dönmez | Yüksek | Yüksek | Sezon mekaniği + tahmin + geri sayım; D7 <%10 ise özellik ekleme, hook düzelt |
| 3 | Bot/sahte oy | Yüksek | Yüksek | Faz 11 katmanlı savunma + "göster/say" ayrımı + gece temizliği + şeffaf filtre sayacı |
| 4 | Organize kampanya (brigading) | Yüksek | Orta | Engelleme değil görünürlük: anomali rozeti, oy hızı grafiği herkese açık |
| 5 | Siyasi içerik baskısı | Orta | Ölümcül | Yazılı editoryal politika + sunucu tarafında zorunlu kontrol listesi; istisna yok |
| 6 | Reklam geliri beklenenden düşük | **Kesin** | Orta | Zaten planda değil; gelir sponsorluk + ödül programında |
| 7 | Copycat | Yüksek | Orta | Kod moat değil; SEO + arşiv + marka + ödül ilişkileri ile savun; hızlı ol |
| 8 | Yanlış soru seçimi (sıkıcı) | Orta | Orta | Karar süresi ve tamamlama metriği ile ölç; 5 sn üstü soruları arşivle |
| 9 | Toksik kullanıcı davranışı | Orta | Orta | UGC yok (kullanıcı soru/yorum yazmıyor) → yüzey neredeyse sıfır |
| 10 | Sonuçların güvenilirliği sorgulanır | Orta | Yüksek | "Bilimsel araştırma değildir" her sayfada; metodoloji sayfası; ham sayı + zaman damgası |
| 11 | KVKK ihlali iddiası | Düşük | Yüksek | Hesap yok, ham IP yok, fingerprint yok, çerezsiz analytics; launch öncesi hukuk incelemesi |
| 12 | Marka/ticari marka çakışması | Orta | Orta | "Nabız" jenerik → kelime+logo tescili; ödül rozetinde marka kullanım koşulları |
| 13 | Sponsor sonuca müdahale ister | Yüksek | Yüksek | Sözleşmede müdahalesizlik maddesi; reddedilirse anlaşma yapılmaz (ilk seferde taviz verilirse marka biter) |
| 14 | Ödül programı "oy satılıyor" algısı | Orta | Yüksek | Kazanan satın alınamaz kuralı + doğrulanabilir rozet + halka açık kurallar |
| 15 | Viral tepede site çöker | Orta | Yüksek | Edge + DO tamponu + snapshot'a düşüş; 500 oy/sn yük testi launch öncesi |
| 16 | Maliyet patlaması | Düşük | Orta | Firebase reddedildi; oy başına maliyet sabit; bütçe alarmı |
| 17 | Kurucu tükenmesi (tek kişi, günlük içerik) | **Yüksek** | Yüksek | İçerik motorunu AI ile toplu üret, haftada bir gün toplu çek/planla; günlük operasyonu 30 dk'ya indir |
| 18 | Hukuki: marka karşılaştırması (haksız rekabet) | Düşük | Orta | Marka vs marka sorularında hukuk onayı; "tüketici tercihi" çerçevesi |
| 19 | Veri kazıma (scraping) | Yüksek | Düşük | Agrege veri zaten halka açık; rate limit + kaynak gösterme şartı; asıl değer zaman serisinde |
| 20 | Novelty ölümü (6. ayda ilgi biter) | Orta | Yüksek | Sezon takvimi + yıllık ödüller + şehir ligleri: takvimsel ritim novelty'yi kuruma dönüştürür |

**En büyük üç risk tek cümlede:** kimse gelmez (1), gelenler dönmez (2), kurucu tükenir (17).
Üçü de teknik değil; üçünün de çözümü dağıtım disiplini.
