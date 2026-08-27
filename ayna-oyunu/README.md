# 🪞 Ayna Oyunu

Lazer ışınını aynalarla yönlendirip hedefe ulaştırdığın, tarayıcıda çalışan
küçük bir bulmaca oyunu. Bağımlılık yok; `index.html` dosyasını tarayıcıda
açman yeterli.

## Nasıl oynanır

- Boş bir kareye tıkla: ayna `/` olur, tekrar tıkla `\` olur, bir daha tıkla kalkar.
- Her bölümde sınırlı sayıda ayna hakkın var (`Ayna: x/y`).
- Prizma (◇) üzerine düşen ışını düz devam eden ve iki dik koldan oluşan üç ışına böler.
- Tüm hedefler vurulduğunda bölüm tamamlanır; ilerleme `localStorage` içinde saklanır.
- Alttaki numaralardan istediğin bölüme atlayabilirsin; çözülenler yeşil görünür.
- **Çöz** düğmesi en az aynayı kullanan çözümü gösterir (bu bölümü çözülmüş saymaz).
- Kısayollar: `←` / `→` bölüm değiştirir, `R` tahtayı sıfırlar.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Sayfa iskeleti |
| `style.css` | Tema ve yerleşim |
| `engine.js` | Işın simülasyonu (tarayıcı ve Node ortak) |
| `levels.js` | Bölüm tanımları |
| `game.js` | Arayüz, girdi ve canvas çizimi |
| `solver.js` | En az aynalı çözümü arayan çözücü (tarayıcı ve Node ortak) |
| `solve.js` | Tüm bölümleri çözüp özet basan betik |
| `test.js` | Motor ve çözücü regresyon testleri |
| `ayna-oyunu-tek-dosya.html` | Tüm oyunun tek dosyaya paketlenmiş, paylaşılabilir sürümü |

## Bölüm eklemek

`levels.js` içine yeni bir nesne ekle. Izgara karakterleri:

| Karakter | Anlamı |
| --- | --- |
| `.` | boş kare (ayna konabilir) |
| `,` | boş kare (ayna konamaz) |
| `#` | duvar |
| `>` `<` `^` `v` | lazer kaynağı ve yönü |
| `T` | hedef |
| `/` `\` | sabit ayna |
| `X` | prizma (ışını üçe böler) |

Her bölümün ayna limiti, çözücünün bulduğu **en az ayna sayısına** eşittir;
yani fazladan ayna hakkı yok. Yeni bölüm ekledikten sonra doğrula:

```bash
node solve.js   # her bölüm için en az ayna sayısı ve çözüm
node test.js    # motor + çözücü testleri
```
