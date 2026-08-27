# 🪞 Ayna Oyunu

Lazer ışınını aynalarla yönlendirip hedefe ulaştırdığın, tarayıcıda çalışan
küçük bir bulmaca oyunu. Bağımlılık yok; `index.html` dosyasını tarayıcıda
açman yeterli.

## Nasıl oynanır

- Boş bir kareye tıkla: ayna `/` olur, tekrar tıkla `\` olur, bir daha tıkla kalkar.
- Her bölümde sınırlı sayıda ayna hakkın var (sağ altta `Ayna: x/y`).
- Tüm hedefler vurulduğunda bölüm tamamlanır; ilerleme `localStorage` içinde saklanır.
- Kısayollar: `←` / `→` bölüm değiştirir, `R` tahtayı sıfırlar.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Sayfa iskeleti |
| `style.css` | Tema ve yerleşim |
| `engine.js` | Işın simülasyonu (tarayıcı ve Node ortak) |
| `levels.js` | Bölüm tanımları |
| `game.js` | Arayüz, girdi ve canvas çizimi |
| `solve.js` | Bölümlerin ayna limiti içinde çözülebildiğini doğrulayan betik |

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

Sonra çözülebilirliği doğrula:

```bash
node solve.js
```
