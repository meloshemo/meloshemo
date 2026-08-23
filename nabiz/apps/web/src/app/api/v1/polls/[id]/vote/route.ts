import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { castVote } from '@/server/vote-service';
import { clientAsn, clientIp, getRepository, hashSalt } from '@/server/context';
import { issueSession, readSessionId, SESSION_COOKIE, sessionCookieOptions } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  optionId: z.string().uuid(),
  clientToken: z.string().uuid(),
  cityId: z.number().int().min(1).max(81).nullable().optional(),
  decisionMs: z.number().int().min(0).max(600_000).nullable().optional(),
  hadInteraction: z.boolean().optional(),
});

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 422 });
  }

  const cookieStore = await cookies();
  const existingSession = readSessionId(cookieStore.get(SESSION_COOKIE)?.value);
  const issued = existingSession ? null : issueSession();
  const sessionId = existingSession ?? issued!.id;

  const outcome = await castVote(
    getRepository(),
    {
      pollId: id,
      optionId: parsed.optionId,
      cityId: parsed.cityId ?? null,
      sessionId,
      clientToken: parsed.clientToken,
      ip: clientIp(request.headers),
      asn: clientAsn(request.headers),
      country: request.headers.get('cf-ipcountry'),
      userAgent: request.headers.get('user-agent'),
      decisionMs: parsed.decisionMs ?? null,
      hadInteraction: parsed.hadInteraction ?? false,
      receivedAt: new Date(),
    },
    hashSalt(),
  );

  const response = buildResponse(outcome);
  if (issued) {
    response.cookies.set(SESSION_COOKIE, issued.cookieValue, sessionCookieOptions);
  }
  return response;
}

function buildResponse(outcome: Awaited<ReturnType<typeof castVote>>): NextResponse {
  switch (outcome.kind) {
    case 'recorded':
      return NextResponse.json({ recorded: true, challenge: outcome.challenge, results: outcome.results });
    case 'already_voted':
      // 409 ama sonuç yine de döner: kullanıcı merakını gidermeden ekranda bırakılmaz.
      return NextResponse.json({ recorded: false, results: outcome.results }, { status: 409 });
    case 'rate_limited':
      return NextResponse.json(
        { error: 'rate_limited', retryAfter: outcome.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(outcome.retryAfterSeconds) } },
      );
    case 'poll_closed':
      return NextResponse.json({ error: 'poll_closed' }, { status: 410 });
    case 'invalid_option':
      return NextResponse.json({ error: 'invalid_option' }, { status: 422 });
    case 'not_found':
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
}
