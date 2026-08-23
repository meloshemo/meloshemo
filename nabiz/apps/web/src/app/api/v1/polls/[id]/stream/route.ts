import { computeResults } from '@nabiz/core';
import { getRepository } from '@/server/context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Sunucu tarafı yoklama aralığı. */
const TICK_MS = 2_000;
/** Bağlantı ömrü: sonsuz akış, serverless ortamda çalışma süresi limitine takılır. */
const MAX_LIFETIME_MS = 5 * 60_000;

/**
 * Canlı sonuç akışı (SSE).
 *
 * Mimarideki hedef (docs/07) Durable Object içinden yayın yapmak; bu sürüm ara adımdır:
 * sunucu agregaları yokluyor ve YALNIZCA değişiklik olduğunda olay gönderiyor. Değişmeyen
 * sonucu saniyede bir göndermek, hem bağlantı başına boşuna trafik hem de istemcide
 * gereksiz render demektir.
 *
 * İstemci tarafı buna bağımlı değildir: akış kurulamazsa arayüz mevcut sonucu göstermeye
 * devam eder (aşamalı iyileştirme).
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const repo = getRepository();

  const poll = await repo.getPollById(id);
  if (!poll) return new Response('not_found', { status: 404 });

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      let lastPayload = '';
      let closed = false;

      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) clearInterval(timer);
        if (deadline) clearTimeout(deadline);
        try {
          controller.close();
        } catch {
          /* bağlantı zaten kapanmış */
        }
      };

      const push = async () => {
        if (closed) return;
        try {
          const rows = await repo.getAggregates(id, 0);
          const payload = JSON.stringify({
            total: rows.reduce((sum, r) => sum + r.count, 0),
            options: computeResults(rows),
            asOf: new Date().toISOString(),
          });

          // Sadece değişiklikte yayın yap.
          if (payload === lastPayload) return;
          lastPayload = payload;
          controller.enqueue(encoder.encode(`event: results\ndata: ${payload}\n\n`));
        } catch {
          close();
        }
      };

      await push();
      timer = setInterval(() => void push(), TICK_MS);
      deadline = setTimeout(close, MAX_LIFETIME_MS);
      request.signal.addEventListener('abort', close);
    },
    cancel() {
      if (timer) clearInterval(timer);
      if (deadline) clearTimeout(deadline);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Ters vekil sunucuların akışı tamponlamasını engeller; olmazsa olaylar
      // istemciye ancak bağlantı kapanınca ulaşır.
      'X-Accel-Buffering': 'no',
    },
  });
}
