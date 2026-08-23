'use client';

import { useMemo, useState } from 'react';
import { CITIES } from '@nabiz/db/seed-data';

/**
 * Şehir seçimi.
 *
 * Neden ilk ekranda değil de birkaç oydan sonra: başta sorulursa sürtünme yaratıp
 * dönüşümü düşürür, hiç sorulmazsa ürünün en değerli kırılımı boş kalır. Kullanıcı
 * birkaç oy verdikten sonra yatırım yapmış olur ve cevaplama oranı yükselir (docs/06 §3.4).
 *
 * Atlanabilir olması şart: zorunlu bir alan, konum beyanını veri toplama gibi hissettirir.
 */
export function CityPicker({ onDone }: { onDone: (cityId: number | null) => void }) {
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    if (!needle) return [];
    return CITIES
      .filter((city) => city.name.toLocaleLowerCase('tr-TR').startsWith(needle))
      .slice(0, 6);
  }, [query]);

  const choose = async (cityId: number | null) => {
    setSaving(true);
    try {
      await fetch('/api/v1/city', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cityId }),
      });
    } catch {
      /* şehir kaydedilemese bile akış durmamalı */
    }
    onDone(cityId);
  };

  return (
    <section className="card" aria-label="Şehir seçimi">
      <h2 className="question" style={{ fontSize: 20 }}>Nerelisin?</h2>
      <p className="kicker">
        Şehrini seçersen sonuçları kendi şehrin için de görürsün. Zorunlu değil.
      </p>

      <label className="meta" htmlFor="city-input">Şehir</label>
      <input
        id="city-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="İzmir"
        autoComplete="off"
        disabled={saving}
        style={{
          width: '100%', minHeight: 44, marginTop: 6, background: 'var(--card-2)', color: 'var(--ink)',
          border: '1px solid var(--line)', borderRadius: 12, padding: '0 12px', fontSize: 16,
        }}
      />

      {matches.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
          {matches.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                className="btn"
                style={{ width: '100%', marginBottom: 6, textAlign: 'left', padding: '0 12px' }}
                disabled={saving}
                onClick={() => void choose(city.id)}
              >
                {city.name} <span className="meta">· {city.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button type="button" className="btn" disabled={saving} onClick={() => onDone(null)}>
          Şimdi değil
        </button>
      </div>
    </section>
  );
}
