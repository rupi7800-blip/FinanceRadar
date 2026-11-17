import Link from 'next/link';
import { notFound } from 'next/navigation';
import Ago from '@/components/Ago';
import { Card, PageHeader, Disclaimer, Empty } from '@/components/ui';
import { NewsList } from '@/components/NewsCard';
import InstrumentChart from '@/components/InstrumentChart';
import WatchButton from '@/components/WatchButton';
import { INSTRUMENTS, INSTRUMENT_BY_ID, CLASS_LABEL, CLASS_SECTION } from '@/lib/instruments/catalog';
import { GUIDE } from '@/lib/instruments/guide';
import { SECTION_BY_ID } from '@/lib/sections';
import { quoteMap, series, anomalyThreshold } from '@/lib/market/derived';
import { getCache } from '@/lib/db';
import { listNews } from '@/lib/news';
import { fmtPrice, fmtChange } from '@/lib/format';
import { fmtDateTime } from '@/lib/text';
import type { Series } from '@/lib/market/types';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  if (process.env.STATIC_EXPORT !== '1') return [];
  return INSTRUMENTS.map((i) => ({ id: i.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: INSTRUMENT_BY_ID[id]?.name ?? 'Strumento' };
}

/** Volatilità annualizzata dai rendimenti giornalieri (deviazione standard × √252). */
function volatility(points: [number, number][]) {
  if (points.length < 30) return null;
  const r = points.slice(1).map((p, i) => Math.log(p[1] / points[i][1])).filter(Number.isFinite);
  const m = r.reduce((s, x) => s + x, 0) / r.length;
  const v = r.reduce((s, x) => s + (x - m) ** 2, 0) / (r.length - 1);
  return Math.sqrt(v) * Math.sqrt(252) * 100;
}
/** Massimo ribasso dal picco nel periodo. */
function maxDrawdown(points: [number, number][]) {
  let peak = -Infinity, mdd = 0;
  for (const [, v] of points) { peak = Math.max(peak, v); if (peak > 0) mdd = Math.min(mdd, (v - peak) / peak); }
  return points.length > 10 ? mdd * 100 : null;
}

export default async function StrumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const def = INSTRUMENT_BY_ID[id];
  if (!def) notFound();
  const q = quoteMap().get(id);
  const daily = series(id).value?.points ?? [];
  const weekly = getCache<Series>(`series5y:${id}`).value?.points ?? [];
  const isYield = def.cls === 'yield';
  const vol = isYield ? null : volatility(daily);
  const mdd = isYield ? null : maxDrawdown(daily);
  const news = listNews({ coin: id, limit: 20 });
  const section = SECTION_BY_ID[CLASS_SECTION[def.cls]];
  const guide = GUIDE.filter((g) => g.related?.includes(id));
  const peers = INSTRUMENTS.filter((i) => i.group === def.group && i.id !== id).slice(0, 8);
  const Box = ({ l, v, s }: { l: string; v: React.ReactNode; s?: React.ReactNode }) => <div className="card px-4 py-3"><div className="text-xs text-mute">{l}</div><div className="text-lg font-bold tabular-nums">{v}</div>{s && <div className="text-xs">{s}</div>}</div>;
  const C = ({ v }: { v: number | null | undefined }) => <span className={`tabular-nums ${v == null ? 'text-mute' : v >= 0 ? 'up' : 'down'}`}>{fmtChange(v ?? null, def)}</span>;
  return (
    <div className="space-y-4">
      <nav className="text-xs text-mute"><Link href="/mercato" className="hover:text-ink">Mercati</Link> › <Link href={section.href} className="hover:text-ink">{section.label}</Link> › {def.group}</nav>
      <PageHeader title={def.name} desc={`${CLASS_LABEL[def.cls]} · ${def.group} · ${def.region} · ${isYield ? 'rendimento in %' : `valuta ${def.ccy}`}`} color={section.color}>
        <WatchButton type="instrument" id={id} label={def.name} />
      </PageHeader>
      {q?.error && <p className="text-xs text-warn">⚠ Dato NON aggiornato nell&apos;ultimo ciclo ({q.error.slice(0, 160)}). Mostrato l&apos;ultimo valore valido.</p>}
      {!q && <Card title="Quotazione non disponibile"><Empty>Nessun dato ancora acquisito per questo strumento. Il primo aggiornamento avviene pochi minuti dopo l&apos;avvio; se persiste, il simbolo potrebbe non essere più supportato dalle fonti gratuite.</Empty></Card>}
      {q && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Box l="Ultimo" v={fmtPrice(q.price, q)} s={<><C v={q.ch1d} /> oggi{q.prevClose != null && <span className="text-mute"> · prec. {fmtPrice(q.prevClose, q)}</span>}</>} />
            <Box l="Variazioni" v="" s={<span className="flex flex-wrap gap-x-2">1 sett. <C v={q.ch1w} /> 1 mese <C v={q.ch1m} /> YTD <C v={q.chYtd} /> 1 anno <C v={q.ch1y} /></span>} />
            <Box l="Range 52 settimane" v={<span className="text-base">{fmtPrice(q.low52, q)} – {fmtPrice(q.high52, q)}</span>} s={q.price != null && q.high52 ? <span className="text-mute">{isYield ? `${Math.round((q.price - q.high52) * 100)} pb dal massimo` : `${(((q.price - q.high52) / q.high52) * 100).toFixed(1).replace('.', ',')}% dal massimo`}</span> : null} />
            <Box l={isYield ? 'Soglia di anomalia' : 'Rischio (ultimo anno)'} v={isYield ? `±${anomalyThreshold(def.cls)} pb/giorno` : vol != null ? `Volatilità ${vol.toFixed(1).replace('.', ',')}%` : 'n.d.'} s={!isYield && mdd != null ? <span className="text-mute">Massimo ribasso: <span className="down">{mdd.toFixed(1).replace('.', ',')}%</span></span> : null} />
          </div>
          <p className="px-1 text-[11px] text-mute">Fonte: {q.source} ({q.symbol}){q.exchange ? ` · mercato: ${q.exchange}` : ''} · ultimo prezzo {q.marketTime ? <><Ago iso={q.marketTime} /> ({fmtDateTime(q.marketTime)})</> : 'n.d.'} · {q.delayed ? 'dato ritardato, non in tempo reale' : 'dato periodico'}{q.volume ? ` · volume ${q.volume.toLocaleString('it-IT')}` : ''}</p>
        </>
      )}
      <Card title="Andamento storico"><InstrumentChart daily={daily} weekly={weekly} isYield={isYield} source={series(id).source ?? getCache<Series>(`series5y:${id}`).source} /></Card>
      {def.note && <p className="rounded-lg border border-info/40 bg-info/10 px-3 py-2 text-xs text-info">{def.note}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><Card title={`Notizie su ${def.name}`}><NewsList items={news} empty="Nessuna notizia recente associata a questo strumento." /></Card></div>
        <div className="space-y-4">
          {guide.length > 0 && <Card title="Capire lo strumento"><ul className="divide-y divide-line text-sm">{guide.map((g) => <li key={g.id} className="px-4 py-2"><Link href={`/strumenti#${g.id}`} className="font-medium hover:underline">{g.name}</Link><p className="line-clamp-2 text-xs text-mute">{g.what}</p></li>)}</ul></Card>}
          {peers.length > 0 && <Card title={`Altri in "${def.group}"`}><ul className="divide-y divide-line text-sm">{peers.map((p) => { const pq = quoteMap().get(p.id); return <li key={p.id} className="flex justify-between px-4 py-1.5"><Link href={`/strumento/${p.id}`} className="truncate hover:underline">{p.name}</Link><span className={`tabular-nums ${pq?.ch1d == null ? 'text-mute' : pq.ch1d >= 0 ? 'up' : 'down'}`}>{pq ? fmtChange(pq.ch1d, pq) : 'n.d.'}</span></li>; })}</ul></Card>}
          <p className="text-xs text-mute"><Link href="/alert" className="text-accent">Crea un avviso</Link> su livello, variazione o notizie di {def.name}.</p>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
