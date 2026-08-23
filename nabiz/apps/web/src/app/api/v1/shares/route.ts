import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/server/context';

export const runtime = 'nodejs';

const bodySchema = z.object({
  pollId: z.string().uuid(),
  channel: z.enum(['native', 'copy', 'whatsapp', 'instagram', 'x', 'telegram']),
});

/** Paylaşım sayacı. Kişisel veri taşımaz; yalnızca kanal kırılımı için. */
export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 422 });
  }

  const repo = getRepository();
  if (!(await repo.getPollById(parsed.pollId))) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  await repo.recordShare(parsed.pollId, parsed.channel);
  return new NextResponse(null, { status: 204 });
}
