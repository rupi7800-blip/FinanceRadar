import { json, handler } from '@/lib/api';
import { getCache } from '@/lib/db';
import type { Quote } from '@/lib/market/types';
export const dynamic = 'force-dynamic';
/** Quotazioni correnti (senza sparkline). ?ids=a,b,c per un sottoinsieme. */
export const GET = handler(async (req) => {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '').split(',').filter(Boolean).slice(0, 300);
  const q = getCache<Quote[]>('market:quotes');
  const list = (q.value ?? []).filter((x) => !ids.length || ids.includes(x.id)).map(({ sparkline, ...x }) => x);
  return json({ quotes: list, source: q.source, fetchedAt: q.fetchedAt, error: q.error });
});
