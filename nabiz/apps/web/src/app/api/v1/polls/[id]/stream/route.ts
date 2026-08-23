import { subscribe } from '@/server/live-hub';
import { getRepository } from '@/server/context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Bağlantı ömrü: sonsuz akış, serverless çalışma süresi limitine takılır. */
const MAX_LIFETIME_MS = 5 * 60_000;

/**
 * Canlı sonuç akışı (SSE).
 *
 * Bu uç nokta veritabanına HİÇ dokunmaz: yayın merkezine abone olur (live-hub).
 * Böylece açık bağlantı sayısı ne olursa olsun veritabanı yükü sabit kalır.
 *
 * Uzun ömürlü bağlantılar serverless'ta pahalıdır; çok yüksek eşzamanlılıkta istemci
 * `/api/v1/snapshot` yoklamasına düşer (CDN'den servis edilir, kaynağa yük binmez).
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const poll = await getRepository().getPollById(id);
  if (!poll) return new Response('not_found', { status: 404 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let unsubscribe = () => {};
      let deadline: ReturnType<typeof setTimeout> | undefined;

      const close = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        if (deadline) clearTimeout(deadline);
        try { controller.close(); } catch { /* zaten kapalı */ }
      };

      unsubscribe = subscribe(id, (snapshot) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: results\ndata: ${JSON.stringify(snapshot)}\n\n`));
        } catch {
          close();
        }
      });

      deadline = setTimeout(close, MAX_LIFETIME_MS);
      request.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Ters vekil sunucuların akışı tamponlamasını engeller.
      'X-Accel-Buffering': 'no',
    },
  });
}
