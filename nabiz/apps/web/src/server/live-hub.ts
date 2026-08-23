import { computeResults } from '@nabiz/core';
import { getRepository } from './context';

/**
 * Canlı yayın merkezi.
 *
 * DEĞİŞMEZ KURAL: veritabanı yükü bağlantı sayısından BAĞIMSIZDIR.
 *
 * Önceki tasarımda her SSE bağlantısı kendi zamanlayıcısıyla veritabanını yokluyordu:
 * 50.000 bağlantı × 2 saniyede bir = saniyede 25.000 sorgu. Bu, ilk viral dakikada
 * veritabanını düşürürdü — üstelik hepsi AYNI cevabı okumak için.
 *
 * Burada tek bir yoklayıcı vardır. Sonucu bir anlık görüntü olarak tutar ve bütün
 * abonelere aynı nesneyi yayar. 1 bağlantı da 50.000 bağlantı da saniyede 0.5 sorgu üretir.
 */

const TICK_MS = 2_000;
/** Kimse dinlemiyorsa yoklama durur — boşta veritabanı meşgul edilmez. */
const IDLE_STOP_MS = 30_000;

export interface PollSnapshot {
  pollId: string;
  total: number;
  options: Array<{ optionId: string; count: number; pct: number }>;
  asOf: string;
}

type Listener = (snapshot: PollSnapshot) => void;

interface Channel {
  listeners: Set<Listener>;
  last: PollSnapshot | null;
  lastPayload: string;
  emptySince: number | null;
}

const channels = new Map<string, Channel>();
let timer: ReturnType<typeof setInterval> | null = null;

function ensureTimer(): void {
  if (timer) return;
  timer = setInterval(() => void tick(), TICK_MS);
  // Zamanlayıcı sürecin kapanmasını engellemesin.
  timer.unref?.();
}

async function tick(): Promise<void> {
  if (channels.size === 0) {
    if (timer) { clearInterval(timer); timer = null; }
    return;
  }

  const repo = getRepository();
  const now = Date.now();

  for (const [pollId, channel] of channels) {
    if (channel.listeners.size === 0) {
      channel.emptySince ??= now;
      if (now - channel.emptySince > IDLE_STOP_MS) channels.delete(pollId);
      continue;
    }
    channel.emptySince = null;

    try {
      const rows = await repo.getAggregates(pollId, 0);
      const snapshot: PollSnapshot = {
        pollId,
        total: rows.reduce((sum, r) => sum + r.count, 0),
        options: computeResults(rows),
        asOf: new Date().toISOString(),
      };

      // Değişmeyen sonucu yaymak, 50.000 istemciye boşuna trafik demektir.
      const payload = JSON.stringify(snapshot);
      if (payload === channel.lastPayload) continue;

      channel.last = snapshot;
      channel.lastPayload = payload;
      for (const listener of channel.listeners) {
        try {
          listener(snapshot);
        } catch {
          /* tek bir bozuk dinleyici yayını durduramaz */
        }
      }
    } catch {
      /* geçici veritabanı hatası: bir sonraki turda yeniden denenir */
    }
  }
}

/**
 * Bir sorunun sonucuna abone olur. Dönen fonksiyon aboneliği bitirir.
 * Elde hazır bir anlık görüntü varsa hemen verilir — yeni bağlantı ilk turu beklemez.
 */
export function subscribe(pollId: string, listener: Listener): () => void {
  const channel = channels.get(pollId) ?? {
    listeners: new Set<Listener>(), last: null, lastPayload: '', emptySince: null,
  };
  channel.listeners.add(listener);
  channels.set(pollId, channel);
  ensureTimer();

  if (channel.last) listener(channel.last);

  return () => {
    channel.listeners.delete(listener);
    if (channel.listeners.size === 0) channel.emptySince = Date.now();
  };
}

/** İzleme için: kaç kanal ve kaç bağlantı açık. */
export function hubStats(): { channels: number; listeners: number } {
  let listeners = 0;
  for (const channel of channels) listeners += channel[1].listeners.size;
  return { channels: channels.size, listeners };
}
