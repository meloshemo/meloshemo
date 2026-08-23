# Canlıya Geçiş — Senin Bilgisayarında Yapılacaklar

Kod tarafında yapılacak bir şey kalmadı. Aşağıdakiler **yalnızca senin yapabileceklerin**:
hesap açmak, domain almak, ödeme bilgisi girmek ve sırları oluşturmak. Sırayla git;
her adımın sonunda ne göreceğin yazıyor.

Toplam süre: **~30 dakika** (domain DNS yayılması hariç).

---

## 1. Domaini al (5 dk)

Bir registrar'dan (Cloudflare Registrar, Namecheap, Porkbun) al:

- **`nabiz.io`** — ana adres
- **`turkiyenediyor.com`** — arama terimi karşılığı, ileride 301 ile yönlendirilecek

> Not: Bu iki domainin boş olduğunu DNS sorgusuyla gördüm ama **DNS kaydı olmaması
> kesin boş olduğunu kanıtlamaz**. Sepete ekleyince registrar gerçeği söyleyecek.
> Doluysa `docs/04b-isim-karari.md`'deki alternatiflere bak.

## 2. Veritabanını oluştur (5 dk)

[neon.tech](https://neon.tech) → ücretsiz hesap → yeni proje:

- Proje adı: `nabiz`
- Bölge: **Frankfurt (eu-central-1)** — Türkiye'ye en yakın gecikme
- Kopyala: **Connection string** (`postgres://...`) → bu senin `DATABASE_URL`'in

## 3. Sırları üret (1 dk)

Terminalde çalıştır ve çıktıyı sakla (bir parola yöneticisine):

```bash
echo "SESSION_SECRET=$(openssl rand -base64 48)"
echo "VOTE_HASH_SALT=$(openssl rand -base64 24)"
echo "ADMIN_TOKEN=$(openssl rand -base64 24)"
echo "CRON_SECRET=$(openssl rand -base64 24)"
```

**Bunları hiçbir zaman repoya yazma.** `.gitignore` `.env` dosyalarını zaten dışarıda tutuyor.

## 4. Veritabanını hazırla (2 dk)

Kendi bilgisayarında, proje klasöründe:

```bash
cd nabiz
npm ci
export DATABASE_URL='2. adımdaki bağlantı dizesi'
npm run db:migrate     # tabloları oluşturur
npm run seed           # 81 il, kategoriler, 12 açılış sorusu
```

Beklenen çıktı: `81 il yüklendi` · `8 kategori hazır` · `12 yeni soru yayınlandı`

## 5. Hazırlık kontrolünü çalıştır (1 dk)

```bash
export SESSION_SECRET='...' VOTE_HASH_SALT='...' NEXT_PUBLIC_SITE_URL='https://nabiz.io'
npm run preflight
```

Hepsi ✓ olmadan devam etme. Bu komut iddia etmez, dener: veritabanına bağlanır,
tabloları sayar, yazma yetkisini gerçekten test eder.

## 6. Vercel'e bağla (5 dk)

[vercel.com](https://vercel.com) → GitHub ile giriş → **Add New → Project** →
`meloshemo/meloshemo` reposunu seç.

| Ayar | Değer |
|---|---|
| Root Directory | `nabiz` |
| Framework | Next.js (otomatik algılanır) |
| Build Command | `npm run build` (vercel.json'da tanımlı) |

**Environment Variables** bölümüne (Production için) gir:

```
DATABASE_URL          = 2. adımdaki bağlantı dizesi
SESSION_SECRET        = 3. adımdaki değer
VOTE_HASH_SALT        = 3. adımdaki değer
ADMIN_TOKEN           = 3. adımdaki değer
CRON_SECRET           = 3. adımdaki değer
NEXT_PUBLIC_SITE_URL  = https://nabiz.io
DATABASE_POOL_MAX     = 5
```

`DATABASE_POOL_MAX=5` serverless için: her fonksiyon örneği kendi havuzunu açar,
büyük havuz Postgres bağlantı limitini tüketir.

**Deploy**'a bas. İlk derleme ~2 dakika.

## 7. Domaini bağla (5 dk + DNS bekleme)

Vercel → Project → **Settings → Domains** → `nabiz.io` ekle → gösterdiği DNS kayıtlarını
registrar'a gir. `turkiyenediyor.com`'u da ekleyip **Redirect to `nabiz.io` (301)** işaretle.

SSL otomatik gelir. DNS yayılması 5 dk – 2 saat.

## 8. Yayın sonrası doğrulama (3 dk)

```bash
curl -s https://nabiz.io/api/v1/feed | head -c 200      # sorular geliyor mu
curl -s -o /dev/null -w '%{http_code}\n' https://nabiz.io/admin   # 307 beklenir (giriş)
curl -s https://nabiz.io/robots.txt                     # sitemap satırı var mı
```

Tarayıcıda:
- `https://nabiz.io` → oy ver, kart kayıp sıradaki soru gelmeli
- `https://nabiz.io/admin/giris` → `ADMIN_TOKEN` ile gir, panel açılmalı
- Bir soruyu WhatsApp'ta paylaş → önizleme kartı görünmeli

## 9. İzlemeyi kur (5 dk, ertelenebilir)

- **Sentry**: ücretsiz hesap → Next.js projesi → DSN'i Vercel env'e ekle
- **Plausible / Umami**: çerezsiz analitik (çerez banner'ı gerektirmez)
- **Uptime**: UptimeRobot → `https://nabiz.io/api/v1/feed` 5 dakikada bir

---

## Yayına çıkmadan önce mutlaka

- [ ] **Hukuk kontrolü.** `/gizlilik`, `/kvkk`, `/kullanim-kosullari` sayfaları taslak
      uyarısıyla yayında. Bir avukat okumadan bu uyarıyı **kaldırma**. Metinleri
      `apps/web/src/components/LegalNotice.tsx` dosyasını silerek kaldırırsın.
- [ ] **Marka tescili.** "Nabız" jenerik bir kelime; kelime + logo kombinasyonu olarak,
      35/38/42 sınıflarında başvur (`docs/18`).
- [ ] **Yedekleme denemesi.** Neon'da PITR açık; bir kez geri yükleme dene. Denenmemiş
      yedek, yedek değildir.

## İlk hafta

Günde 2–3 yeni soru (`/admin/yeni`), günde 2 TikTok/Reels, `docs/14-launch.md`'deki plan.
**Day 30'da kapı metriklerine bak** (`docs/14`): oy tamamlama ≥%60, oturum başına ≥4 oy,
paylaşım ≥%3, D7 ≥%10. Tutmuyorsa yeni özellik ekleme — soruları ve ilk ekranı düzelt.

## Maliyet

İlk aşamada **$0/ay** (Vercel Hobby + Neon Free + Cloudflare DNS), yalnızca domain ~$5/ay.
100K MAU'da ~$40/ay. Ayrıntı: `docs/22-deployment.md`.
