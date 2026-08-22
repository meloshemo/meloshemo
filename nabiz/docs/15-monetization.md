# PHASE 15 — Monetization

Sıralama ilkesi: **kullanıcı güvenini bozan hiçbir gelir modeli, verdiği paranın karşılığını etmez.**
Bu ürünün tek sermayesi sonuçlarının inandırıcılığıdır.

| # | Model | Nasıl çalışır | Ne zaman | Müşteri | Gelir potansiyeli | Risk | Güven etkisi |
|---|---|---|---|---|---|---|---|
| 1 | **Sponsorlu sezon/turnuva** | Marka bir kategori sezonunu üstlenir; logo + "Sponsorlu" etiketi; **sonuçlara müdahale yok, sözleşmede yazılı** | 100K MAU'dan sonra | FMCG, banka, GSM | ₺150–800K/sezon | Sponsor sonucu beğenmezse baskı | Düşük (etiket + müdahalesizlik açıkça yazılırsa) |
| 2 | **"Türkiye'nin Seçimi" ödül programı** | Yıllık kategori şampiyonlarına doğrulanabilir dijital rozet + lisans | Ay 9+ | Kazanan marka/işletmeler | En yüksek marj | **Oy satın alma algısı** | Yüksek risk — kurallar aşağıda |
| 3 | Trend raporları | Çeyreklik ücretli PDF/veri | Ay 6+ | Ajans, medya, marka | ₺15–40K/rapor | Düşük | Nötr (hatta artırır) |
| 4 | B2B veri aboneliği / API | Agrege zaman serisine erişim | Ay 12+ | Araştırma, perakende | Orta-yüksek | Metodoloji sorgulanır | Nötr |
| 5 | Özel araştırma | Marka kendi sorusunu sordurur + rapor alır | Ay 6+ | Marka | ₺50–150K | Sponsorlu içeriğin açıklanmaması | Etiketlenirse düşük |
| 6 | Display reklam | Alt bölümlerde 2 gösterim/oturum | Trafik varsa | Programatik | **Düşük — ana gelir olamaz** | UX bozulması | Orta |
| 7 | Doğrulanmış işletme profili | "Bu işletme X kategorisinde 3. sırada" sayfası + iletişim | Ay 12+ | Yerel işletme | Uzun kuyruk | Moderasyon yükü | Düşük |
| 8 | Lisanslama | Grafik/veri kullanımı (medya) | Ay 12+ | Yayıncı | Küçük | Düşük | Artırır (atıf) |
| 9 | Beyaz etiket (Pulse) | Başka ülke/kurum için platform | Yıl 2+ | Medya grubu | Yüksek | Odak dağılması | Nötr |

**Kesinlikle yapılmayacaklar:** oy karşılığı ödül/çekiliş (hem manipülasyon hem şans oyunları
mevzuatı riski) · sponsorun sonucu etkilemesi · etiketsiz sponsorlu içerik · ham oy verisi satışı ·
interstitial/pop-up reklam.

## "Türkiye'nin Seçimi" ödül programı — kurallar (bu program ya en değerli varlık olur, ya markayı bitirir)
1. **Kazanan satın alınamaz.** Kazananı yalnızca oylar belirler; rozet lisansı kazandıktan
   *sonra* satılır. Bu ayrım sözleşmede ve halka açık kurallarda yazılıdır.
2. **Rozet doğrulanabilir.** Her rozet `nabiz.io/odul/verify/:token` sayfasına linklidir;
   sayfada oy sayısı, tarih ve metodoloji görünür. Doğrulanamayan rozet sahtedir.
3. **Kategori manipülasyonuna karşı:** ödül kategorileri yıl başında ilan edilir, sonradan
   "sponsor için kategori açma" yasaktır.
4. **Oy zirvesi denetimi:** ödül kategorilerinde son 30 günün oy hızı yayınlanır; anormallik
   varsa kategori ödülsüz kapatılır.
5. **Hukuk:** rozet kullanım koşulları, süre (1 yıl), görsel kullanım sınırları ve haksız rekabet
   riski için launch öncesi avukat incelemesi zorunlu.
