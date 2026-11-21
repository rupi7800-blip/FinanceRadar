import Link from 'next/link';
import Ago from '@/components/Ago';
import { Card, Freshness, Empty, Disclaimer } from '@/components/ui';
import { NewsList, NewsCard } from '@/components/NewsCard';
import LivePrices from '@/components/LivePrices';
import { AnomalyCard, RankCard } from '@/components/MarketBlocks';
import { Gauge } from '@/components/Charts';
import { topNews, listNews, mostRead, officialUpdates, trendingTopics, tickerNews } from '@/lib/news';
import { quotes, rankings, breadth, btpBundSpread, quoteMap } from '@/lib/market/derived';
import { getCache } from '@/lib/db';
import { SECTIONS, SECTION_LABEL } from '@/lib/sections';
import { INSTRUMENT_BY_ID } from '@/lib/instruments/catalog';
import { DISCLAIMER } from '@/lib/ai';
import { STATIC } from '@/lib/mode';
import type { MacroItem } from '@/lib/macro';

export const dynamic = 'force-dynamic';

const HEAD = ['ftsemib', 'sp500', 'eurostoxx50', 'nasdaq100', 'dax', 'nikkei', 'btp10y', 'ust10y', 'eurusd', 'gold', 'brent', 'btc'];

export default function Home() {
  const q = quotes();
  const m = quoteMap();
  const head = HEAD.map((id) => m.get(id)).filter(Boolean).map((x) => { const { sparkline, ...r } = x!; return r; });
  const r = rankings(q.value ?? []);
  const br = breadth();
  const spread = btpBundSpread();
  const vix = m.get('vix');
  const ecb = getCache<{ items: MacroItem[] }>('macro:ecb').value?.items ?? [];
  const dfr = ecb.find((i) => i.id === 'dfr'), hicp = ecb.find((i) => i.id === 'hicp_ea');
  const briefing = getCache<{ titolo: string; punti_chiave: string[]; rischi: string[]; da_monitorare: string[]; argomenti_emergenti: string[]; _model: string }>('ai:briefing');
  const breaking = tickerNews(30).filter((n) => n.isBreaking || n.flags.includes('urgent')).slice(0, 4);
  const important = topNews(8, 24);
  const latest = listNews({ limit: 15 });
  const read = mostRead(5, 'reads');
  const official = officialUpdates(6);
  const topics = trendingTopics();

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Finance Radar — i mercati finanziari, sotto controllo</h1>
      {breaking.length > 0 && (
        <section className="rounded-xl border border-down/50 bg-down/10 p-3" aria-label="Notizie urgenti">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold text-down"><span className="pulse-dot">●</span> IN EVIDENZA ORA</div>
          <ul className="space-y-1">
            {breaking.map((n) => (
              <li key={n.id} className="text-sm"><Link href={`/notizia/${n.id}`} className="font-semibold hover:underline"><span className="t-it">{n.titleIt || n.title}</span><span className="t-orig">{n.title}</span></Link> <span className="text-xs text-mute">· {n.sourceName} · <Ago iso={n.publishedAt} /> · {n.status.toLowerCase()}</span></li>
            ))}
          </ul>
        </section>
      )}

      <Card title="Mercati in sintesi" right={<Link href="/mercato" className="text-xs text-accent">Tutti i mercati →</Link>}>
        {head.length ? <LivePrices initial={head} fetchedAt={q.fetchedAt} source={q.source} /> : <Empty>Quotazioni in caricamento (primo aggiornamento entro pochi minuti dall&apos;avvio).{q.error && <span className="block text-warn">Ultimo errore: {q.error}</span>}</Empty>}
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Spread BTP–Bund 10 anni" value={spread ? `${spread.now} pb` : 'n.d.'} sub={spread?.change != null ? <span className={spread.change > 0 ? 'down' : 'up'}>{spread.change > 0 ? '+' : ''}{spread.change} pb dal giorno prima</span> : <span className="text-mute">in attesa dei dati</span>} href="/obbligazioni" />
        <Stat label="Tasso BCE sui depositi" value={dfr?.value != null ? `${dfr.value.toFixed(2).replace('.', ',')}%` : 'n.d.'} sub={<span className="text-mute">{dfr?.period ? `dal dato del ${dfr.period}` : 'BCE'}</span>} href="/macro" />
        <Stat label="Inflazione area euro" value={hicp?.value != null ? `${hicp.value.toFixed(1).replace('.', ',')}%` : 'n.d.'} sub={<span className="text-mute">{hicp?.period ? `HICP ${hicp.period}` : 'BCE'}</span>} href="/macro" />
        <Stat label="Ampiezza (titoli e indici in rialzo)" value={br ? `${br.pct}%` : 'n.d.'} sub={br ? <span className="text-mute">{br.up} su {br.total} oggi</span> : null} href="/mercato" />
        <div className="card col-span-2 flex items-center gap-3 px-4 py-3 lg:col-span-1">
          {vix?.price != null ? <Gauge value={Math.min(100, Math.round(vix.price * 2))} label={`VIX ${vix.price.toFixed(1)}`} /> : <span className="text-sm text-mute">n.d.</span>}
          <div className="text-xs"><div className="text-mute">Volatilità attesa (VIX)</div><div className="font-semibold">{vix?.price == null ? 'n.d.' : vix.price < 15 ? 'Bassa' : vix.price < 20 ? 'Normale' : vix.price < 30 ? 'Elevata' : 'Stress'}</div><div className="text-mute">{vix?.price != null ? `${vix.price.toFixed(1)} punti` : ''}</div></div>
        </div>
      </div>
      <div className="-mt-2 px-1"><Freshness fetchedAt={q.fetchedAt} source={q.source} error={q.error} everySec={300} /></div>

      {briefing.value && (
        <Card title={<span>✦ Briefing AI · <span className="font-normal text-mute">{briefing.value.titolo}</span></span>} right={<span className="text-[11px] text-mute"><Ago iso={briefing.fetchedAt} /></span>}>
          <div className="grid gap-4 p-4 text-sm md:grid-cols-3">
            <div className="md:col-span-2"><ul className="list-disc space-y-1 pl-5">{briefing.value.punti_chiave.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
            <div className="space-y-3 text-xs">
              {briefing.value.rischi.length > 0 && <div><div className="mb-1 font-semibold text-warn">Rischi</div><ul className="list-disc pl-4 text-mute">{briefing.value.rischi.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
              {briefing.value.da_monitorare.length > 0 && <div><div className="mb-1 font-semibold text-info">Da monitorare</div><ul className="list-disc pl-4 text-mute">{briefing.value.da_monitorare.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
            </div>
            <p className="text-[11px] text-mute md:col-span-3">⚠ {DISCLAIMER}</p>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Notizie più importanti di oggi" right={<span className="text-[11px] text-mute">per importanza, conferme e attualità</span>}>
            <NewsList items={important} empty="Raccolta in corso: le prime notizie arrivano entro qualche minuto dall'avvio." />
          </Card>
          <Card title="Ultime notizie" right={<Link href="/archivio" className="text-xs text-accent">Archivio →</Link>}>
            <NewsList items={latest} compact />
          </Card>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <RankCard title="Migliori di oggi" list={r.gainers.slice(0, 6)} f={(x) => x.ch1d} />
            <RankCard title="Peggiori di oggi" list={r.losers.slice(0, 6)} f={(x) => x.ch1d} />
          </div>
          <AnomalyCard limit={6} />
          <Card title="Argomenti di tendenza (24h)">
            <div className="flex flex-wrap gap-1.5 p-4">
              {topics.categories.slice(0, 8).map(([c, n]) => <Link key={c} href={SECTIONS.find((s) => s.id === c)?.href ?? `/cerca?section=${c}`} className="chip border-line text-mute hover:text-ink">{SECTION_LABEL[c] ?? c} · {n}</Link>)}
              {topics.coins.slice(0, 8).map((c) => <Link key={c.id} href={`/strumento/${c.id}`} className="chip border-accent/30 text-accent">{INSTRUMENT_BY_ID[c.id]?.name ?? c.id} · {c.n}{c.growth > 0 ? ' ↑' : ''}</Link>)}
              {topics.phrases.slice(0, 8).map((p) => <Link key={p.phrase} href={`/cerca?q=${encodeURIComponent(p.phrase)}`} className="chip border-line text-ink">“{p.phrase}”</Link>)}
              {!topics.categories.length && <span className="text-sm text-mute">Dati insufficienti.</span>}
            </div>
          </Card>
          <Card title="Comunicazioni ufficiali" right={<span className="text-[11px] text-mute">banche centrali, autorità, statistiche</span>}>
            {official.length ? official.map((n) => <NewsCard key={n.id} n={n} compact />) : <Empty>Nessuna comunicazione ufficiale recente.</Empty>}
          </Card>
          {!STATIC && <Card title="Più lette su Finance Radar">{read.length ? read.map((n) => <NewsCard key={n.id} n={n} compact />) : <Empty>Ancora nessuna lettura registrata.</Empty>}</Card>}
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: React.ReactNode; href?: string }) {
  const body = (<><div className="text-xs text-mute">{label}</div><div className="mt-0.5 text-lg font-bold tabular-nums">{value}</div>{sub && <div className="text-xs">{sub}</div>}</>);
  return href ? <Link href={href} className="card block px-4 py-3 hover:bg-panel2">{body}</Link> : <div className="card px-4 py-3">{body}</div>;
}
