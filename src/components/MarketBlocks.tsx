import Link from 'next/link';
import { Card, Empty, Freshness } from './ui';
import Tabs from './Tabs';
import { QuoteTable } from './QuoteTable';
import { quotes, anomalies } from '@/lib/market/derived';
import { groupsOf, type InstrumentDef } from '@/lib/instruments/catalog';
import { fmtPrice, fmtChange } from '@/lib/format';
import type { Quote } from '@/lib/market/types';

/** Quotazioni del catalogo filtrate e divise per gruppo (una scheda per gruppo). */
export function QuotesByGroup({ title, filter, id }: { title: string; filter: (d: InstrumentDef) => boolean; id: string }) {
  const q = quotes();
  const byId = new Map((q.value ?? []).map((x) => [x.id, x]));
  const groups = groupsOf(filter).map((g) => ({ group: g.group, list: g.items.map((i) => byId.get(i.id)).filter(Boolean) as Quote[], total: g.items.length }));
  return (
    <Card id={id} title={title} right={<Freshness fetchedAt={q.fetchedAt} source={q.source} error={q.error} everySec={300} />}>
      {groups.length === 1 ? <QuoteTable quotes={groups[0].list} /> : <Tabs id={id} tabs={groups.map((g) => `${g.group} (${g.list.length}/${g.total})`)} panels={groups.map((g) => <QuoteTable key={g.group} quotes={g.list} />)} />}
      <p className="border-t border-line px-4 py-2 text-[11px] text-mute">Prezzi delle borse ritardati di circa 15–20 minuti (Yahoo Finance; riserva: Stooq). Le variazioni dei rendimenti sono in punti base (pb). Tocca il nome per la scheda completa con grafico a 5 anni e notizie.</p>
    </Card>
  );
}

export function AnomalyCard({ filter, limit = 12, title = 'Movimenti anomali' }: { filter?: (q: Quote) => boolean; limit?: number; title?: string }) {
  const list = anomalies().filter((a) => !filter || filter(a.q)).slice(0, limit);
  return (
    <Card id="anomalie" title={title} right={<span className="text-[10px] text-mute">soglie per classe di strumento</span>}>
      {list.length ? <ul className="divide-y divide-line">{list.map((a) => (
        <li key={a.q.id} className="px-4 py-2 text-sm"><Link href={`/strumento/${a.q.id}`} className="font-medium hover:underline">{a.q.name}</Link> <span className="text-xs text-mute">{fmtPrice(a.q.price, a.q)}</span><div className="text-xs text-warn">{a.reasons.join(' · ')}</div></li>
      ))}</ul> : <Empty>Nessun movimento anomalo rilevato.</Empty>}
    </Card>
  );
}

export function RankCard({ title, list, f }: { title: string; list: Quote[]; f: (q: Quote) => number | null }) {
  return (
    <Card title={title}>
      {list.length ? <ol className="divide-y divide-line text-sm">{list.map((q, i) => { const v = f(q); return (
        <li key={q.id} className="flex items-center gap-2 px-4 py-1.5"><span className="w-4 text-xs text-mute">{i + 1}</span><Link href={`/strumento/${q.id}`} className="truncate hover:underline">{q.name}</Link><span className={`ml-auto tabular-nums ${v == null ? 'text-mute' : v >= 0 ? 'up' : 'down'}`}>{fmtChange(v, q)}</span></li>); })}</ol> : <Empty>n.d.</Empty>}
    </Card>
  );
}

/** Riquadri compatti (es. intestazione di sezione). */
export function QuoteStrip({ ids }: { ids: string[] }) {
  const byId = new Map((quotes().value ?? []).map((x) => [x.id, x]));
  const list = ids.map((i) => byId.get(i)).filter(Boolean) as Quote[];
  if (!list.length) return null;
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
      {list.map((q) => (
        <Link key={q.id} href={`/strumento/${q.id}`} className="bg-panel px-3 py-2.5 hover:bg-panel2">
          <div className="truncate text-xs text-mute">{q.name}</div>
          <div className="text-base font-semibold tabular-nums">{fmtPrice(q.price, q)}</div>
          <div className={`text-xs tabular-nums ${q.ch1d == null ? 'text-mute' : q.ch1d >= 0 ? 'up' : 'down'}`}>{fmtChange(q.ch1d, q)}{q.error ? ' · ⚠' : ''}</div>
        </Link>
      ))}
    </div>
  );
}
