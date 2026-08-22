# PHASE 1 — Market Research

> Kaynak notu: Bu dokümanda **[D]** = doğrulanmış (web kaynağı ile), **[T]** = tahmin/varsayım.
> Varsayımlar açıkça yazılmıştır; kimse bunları veri gibi kullanmasın.

## 1.1 Pazarın tanımı

Bu ürün üç ayrı pazarın kesişiminde duruyor:

| Pazar | Ne satar | Bizim ilgimiz |
|---|---|---|
| Polling / survey SaaS (StrawPoll, SurveyMonkey, Typeform) | Araç: anket *oluşturma* | Düşük — biz araç satmıyoruz |
| Casual social content / eğlence (buzzfeed-vari quiz, bracket siteleri) | Dikkat, reklam envanteri | Yüksek — asıl rakip dikkat ekonomisi |
| Market intelligence / trend data (YouGov, Ipsos, Nielsen) | Veri, rapor, panel | Uzun vade — data moat burada paraya döner |

Kritik ayrım: **anket araçları arz tarafını (anket yapan kişi) satar, biz talep tarafını (merak eden kişi) topluyoruz.** İş modeli, viral mekanik ve ürün kararlarının hepsi bu ayrımdan çıkıyor.

## 1.2 Türkiye pazar büyüklüğü (aşağıdan yukarı)

Varsayımlar:
- Türkiye internet kullanıcısı ~ 70M **[T, TÜİK/We Are Social mertebesi]**
- Bunun sosyal medyada aktif, "eğlencelik içerik tüketen" kısmı ~ 50M **[T]**
- Bu tip "hafif eğlence + kültürel kimlik" içeriğine ulaşılabilir tavan: %10–15 → **5–7M erişilebilir kitle (SAM)** **[T]**
- Gerçekçi 24 ay hedefi: SAM'in %5–10'u → **300K–700K MAU** **[T]**

Reklam tarafı: Türkiye'de display CPM'ler düşük (programatik ~ $0.5–2 CPM aralığı, TR trafiği için) **[T]**. Yani **sadece reklamla** bu iş küçük kalır — 1M MAU bile ayda ~$3–8K civarı üretir. Bu, projenin en önemli finansal gerçeği: **para reklamda değil, sponsorluk + ödül programı + veride.**

## 1.3 Neden Türkiye özelinde çalışır (davranışsal temel)

1. **Hemşehrilik kimliği güçlü ve kamusal.** Şehir/memleket, Türkiye'de kişilik göstergesi gibi kullanılıyor. Bu, "takım tutma" enerjisinin coğrafyaya taşınmış hali.
2. **Yemek milliyetçiliği.** Lahmacun/döner, Antep vs Adana, kuru fasulye tartışmaları zaten organik olarak sosyal medyada dönüyor — biz sadece ona bir skor tabelası koyuyoruz.
3. **WhatsApp grup kültürü.** Türkiye'de viral yayılım Instagram'dan çok WhatsApp grupları üzerinden gerçekleşiyor **[T ama güçlü sinyal]**. Paylaşım kartı tasarımı bu yüzden *önce WhatsApp*, sonra Instagram Story olmalı.
4. **Düşük sürtünme beklentisi.** Üyelik isteyen her ürün TR'de dönüşüm kaybeder. Login yok kararı doğru.

## 1.4 Neden çalışmayabilir (dürüst taraf)

- **Novelty riski:** "Hangisi daha iyi" formatı doyuma ulaşır. 3. ziyarette kullanıcı sıkılır. Retention, içerik motorunun *tazeliğine* bağlı — ürüne değil.
- **Sıfır veri değeri riski:** Anonim, self-selected, botlanabilir oylar ticari olarak "araştırma verisi" sayılmaz. Data moat iddiası, ancak ölçek + temizlik + zaman serisi ile gerçek olur. İlk 12 ay bu veri **satılamaz**.
- **Reklam geliri düşüklüğü:** Yukarıda hesaplandı. Tek gelir modeli olarak yetersiz.
- **Siyasallaşma riski:** Türkiye'de herhangi bir "Türkiye ne düşünüyor" markası, istemesen de siyasi soru baskısı alır. Editoryal politika gün 0'da yazılı olmalı.

## 1.5 Zamanlama (Why now)

- Realtime altyapı artık bedava mertebesinde (edge KV + WebSocket/SSE, aylık $0–20).
- Kısa video platformları "ekran görüntüsü paylaşılabilir içerik"i ödüllendiriyor; skor kartı formatı Reels/Shorts için doğal hammadde.
- Klasik anket şirketlerine güven düşük; "bilimsel değil ama şeffaf ve canlı" konumlandırması boş bir alan.

**Sonuç:** Pazar var, ama "anket sitesi" olarak değil. Ürün bir **medya markası + veri varlığı** olarak kurulursa anlamlı; SaaS olarak kurulursa StrawPoll'un zayıf bir kopyası olur.
