# Yük testi

`vote.js` k6 senaryosudur; `polls.json` dosyasına ihtiyaç duyar (soru ve seçenek kimlikleri):

```bash
curl -s "$BASE/api/v1/feed" | jq '[.items[] | {id, options: [.options[].id]}]' > tests/load/polls.json
k6 run -e BASE_URL=$BASE tests/load/vote.js
```

k6 kurulu değilse `node tests/load/local-load.mjs` aynı senaryonun küçük ölçekli
(tek makine, bağımlılıksız) sürümünü çalıştırır — mutlak sayıları değil, darboğazın
nerede olduğunu görmek içindir.
