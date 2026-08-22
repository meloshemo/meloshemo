# PHASE 11 — Anti-Abuse & Vote Integrity

Hedef: **kullanıcıyı hiç rahatsız etmeden** sonucu savunulabilir tutmak.
Tasarım ilkesi: *mükemmel engelleme imkânsız; amaç manipülasyonu pahalı ve görünür kılmak.*

## 11.1 Temel karar: "Göster" ile "Say" ayrımı
Her oy **anında gösterilir** (kullanıcı deneyimi bozulmaz), ama sayılması `trust_score`'a bağlıdır.
Şüpheli oy sessizce `is_counted=false` olur. Saldırgana asla "yakalandın" denmez —
aksi hâlde saldırgan yöntemini kalibre eder.

## 11.2 Katmanlı savunma (üstten alta, sürtünme artan sırayla)

**Katman 0 — Oturum (sürtünme: sıfır)**
İlk ziyarette `HttpOnly`, `SameSite=Lax`, imzalı bir oturum çerezi. Soru başına tek oy
(`UNIQUE (poll_id, session_hash)`). Çerezi silen kullanıcı tekrar oy verebilir — kabul edilen bir
kayıptır; kitlesel değil, bireysel bir kaçaktır.

**Katman 1 — Hız limiti (sürtünme: sıfır)**
IP hash başına 30 oy/dk ve 300 oy/saat · ASN başına anormallik eşiği · soru başına
"tek IP'den gelen oy oranı" izlenir. Veri merkezi ASN'leri (AWS, Hetzner, OVH…) otomatik olarak
düşük `trust_score` alır — engellenmez, sadece daha az güvenilir sayılır.

**Katman 2 — Davranış sinyalleri (sürtünme: sıfır)**
- Karar süresi < 400 ms → şüpheli (insan okuyup karar veremez)
- Sayfa görüntülemeden gelen oy (referrer yok + hiç scroll/pointer olayı yok)
- Aynı oturumda insanüstü tempo (10 saniyede 8 oy)
- Fare/dokunuş olayı hiç yok + mobil UA (tutarsızlık)
Bu sinyaller **cihaz parmak izi değildir** — kalıcı tanımlayıcı üretmez, sadece o isteği puanlar.

**Katman 3 — Seçici doğrulama (sürtünme: yalnız şüphelide)**
`trust_score` eşiğin altına düşerse **Cloudflare Turnstile** görünmez modda devreye girer.
Normal kullanıcı hiçbir şey görmez. Klasik CAPTCHA (resim seçme) hiçbir zaman kullanılmaz —
dönüşümü öldürür.

**Katman 4 — Sonradan temizlik (sürtünme: yok)**
Gece çalışan iş: ham oyları küme analizi ile yeniden değerlendirir (ASN patlamaları, zaman
korelasyonu, imkânsız coğrafi dağılım), agregaları düzeltir, `abuse_events` yazar.
Bir sonucun "kesin" hâli 24 saat sonra oluşur ve bu şeffaflık sayfasında açıkça yazar.

## 11.3 Fingerprinting ve hukuki sınır
Kalıcı cihaz parmak izi (canvas/WebGL/font hash) **kullanılmayacaktır.** Gerekçe: KVKK ve
GDPR açısından kalıcı tanımlayıcı üretmek açık rıza gerektirir; rıza bandı istemek ürünün
sıfır-sürtünme ilkesini yok eder. Bunun yerine **kalıcı olmayan, oturumluk davranış puanlaması**
kullanılır. Bu, biraz daha az etkili ama uyumlu ve savunulabilir bir tercihtir — bilinçli takas.

IP adresleri kişisel veridir: ham hâlde **saklanmaz**, günlük dönen tuzla HMAC'lenir.
Tuz döndüğü için 24 saat sonrasına uzanan takip teknik olarak imkânsızdır.

## 11.4 Kampanya (brigading) sorunu
Bir taraftar grubunun organize oy vermesi bot değildir — gerçek insanlardır. Engellenemez,
ama **görünür kılınır**:
- Sonuç sayfasında "son 1 saatte olağandışı oy artışı" rozeti
- Şehir kırılımı: tek bir ASN/şehirden gelen anormal yığılma dipnotta açıklanır
- Sezon turlarında oy hızının zaman grafiği herkese açık
Şeffaflık, engellemekten daha güçlü bir savunmadır: manipüle edilmiş sonucun kendisi haber olur.

## 11.5 Ölçme
Panelde takip edilen: filtrelenen oy oranı (sağlıklı aralık %2–8), Turnstile tetiklenme oranı
(< %3 olmalı; üstüne çıkarsa eşik yanlış), yanlış pozitif şikâyeti.
