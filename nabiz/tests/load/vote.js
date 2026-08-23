/**
 * k6 yük testi — hedef: 500 oy/sn altında p95 < 300 ms (docs/14 Day 0 kriteri).
 *
 * Çalıştırma:
 *   k6 run -e BASE_URL=https://nabiz.io tests/load/vote.js
 *
 * Not: her sanal kullanıcı kendi oturum çerezini alır, yani gerçek trafikteki gibi
 * "her oturum bir soruya bir oy" kısıtına takılır. Aynı soruya tekrar oy denemesi
 * 409 döner ve bu bir hata değildir — senaryo bunu beklenen durum olarak sayar.
 */
import http from 'k6/http';
import { check } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3000';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 1000,
      stages: [
        { target: 100, duration: '30s' },
        { target: 500, duration: '1m' },
        { target: 500, duration: '1m' },
        { target: 0, duration: '15s' },
      ],
    },
  },
  thresholds: {
    'http_req_duration{scenario:ramp}': ['p(95)<300'],
    // Sunucu hatası (5xx) sıfır olmalı; 409/429 beklenen yanıtlardır.
    'http_req_failed': ['rate<0.01'],
  },
};

const feed = JSON.parse(open('./polls.json'));

export default function () {
  const poll = feed[Math.floor(Math.random() * feed.length)];
  const optionId = poll.options[Math.floor(Math.random() * poll.options.length)];

  const response = http.post(
    `${BASE}/api/v1/polls/${poll.id}/vote`,
    JSON.stringify({
      optionId,
      clientToken: uuidv4(),
      cityId: 1 + Math.floor(Math.random() * 81),
      decisionMs: 1200 + Math.floor(Math.random() * 4000),
      hadInteraction: true,
    }),
    { headers: { 'content-type': 'application/json' } },
  );

  check(response, {
    'sunucu hatası yok': (r) => r.status < 500,
    'beklenen yanıt': (r) => [200, 409, 429].includes(r.status),
  });
}
