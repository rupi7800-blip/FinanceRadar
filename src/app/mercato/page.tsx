import Link from 'next/link';
import { Card, PageHeader, Freshness, Empty, Disclaimer } from '@/components/ui';
import { QuotesByGroup, AnomalyCard, RankCard } from '@/components/MarketBlocks';
import { quotes, rankings, breadth } from '@/lib/market/derived';
import { trendingTopics } from '@/lib/news';
import { INSTRUMENTS, INSTRUMENT_BY_ID, CLASS_LABEL, type AssetClass } from '@/lib/instruments/catalog';
import { getCache } from '@/lib/db';
import { fmtChange } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mercati' };

const CLASSES: AssetClass[] = ['index', 'equity', 'etf', 'fund', 'yield', 'bond', 'fx', 'commodity', 'future', 'volatility', 'crypto', 'reit'];

export default function Mercato() {
  const q = quotes();
  const list = q.value ?? [];
  const r = rankings(list);
  const br = breadth();
  const interest = trendingTopics().rising.filter((x) => x.growth > 0 && INSTRUMENT_BY_ID[x.id]);
  const errs = getCache<string[]>('market:quote_errors').value ?? [];
  // rendimento medio per classe nella seduta (media semplice delle variazioni disponibili)
  const perClass = CLASSES.filter((c) => c !== 'yield').map((c) => { const xs = list.filter((x) => x.cls === c && x.ch1d != null && !x.error); return { c, n: xs.length, avg: xs.length ? xs.reduce((s, x) => s + (x.ch1d as number), 0) / xs.length : null }; }).filter((x) => x.n);
  return (
    <div className="space-y-4">
      <PageHeader title="Mercati" desc={`Panoramica di ${INSTRUMENTS.length} strumenti: indici, azioni, ETF, fondi, titoli di Stato, valute, materie prime, future, volatilità, cripto e immobiliare quotato`} color="#38bdf8" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card px-4 py-3"><div className="text-xs text-mute">Strumenti aggiornati</div><div className="text-lg font-bold">{list.filter((x) => !x.error).length} / {INSTRUMENTS.length}</div><div className="text-xs text-mute">{errs.length ? `${errs.length} non aggiornati in questo ciclo` : 'tutte le fonti hanno risposto'}</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-mute">Ampiezza del mercato azionario</div><div className="text-lg font-bold">{br ? `${br.pct}% in rialzo` : 'n.d.'}</div><div className="text-xs text-mute">{br ? `${br.up} su ${br.total} titoli e indici` : ''}</div></div>
        <div className="card px-4 py-3 sm:col-span-2"><div className="mb-1 text-xs text-mute">Variazione media di oggi per classe</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">{perClass.map((x) => <span key={x.c}>{CLASS_LABEL[x.c]} <b className={x.avg == null ? '' : x.avg >= 0 ? 'up' : 'down'}>{fmtChange(x.avg, { cls: x.c })}</b></span>)}</div></div>
      </div>
      <div className="px-1"><Freshness fetchedAt={q.fetchedAt} source={q.source} error={q.error} everySec={300} /></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RankCard title="Maggiori rialzi oggi" list={r.gainers} f={(x) => x.ch1d} />
        <RankCard title="Maggiori ribassi oggi" list={r.losers} f={(x) => x.ch1d} />
        <RankCard title="Migliori da inizio anno" list={r.ytdBest} f={(x) => x.chYtd} />
        <Card title="Crescita di interesse" right={<span className="text-[10px] text-mute">citazioni nelle notizie</span>}>
          {interest.length ? <ul className="divide-y divide-line text-sm">{interest.map((x) => <li key={x.id} className="flex justify-between px-4 py-1.5"><Link href={`/strumento/${x.id}`} className="hover:underline">{INSTRUMENT_BY_ID[x.id].name}</Link><span className="text-xs text-mute">{x.prev} → {x.n} eventi</span></li>)}</ul> : <Empty>Dati insufficienti (servono 48 ore di notizie).</Empty>}
        </Card>
      </div>
      <AnomalyCard />
      <QuotesByGroup id="indici" title="Indici azionari" filter={(d) => d.cls === 'index'} />
      <QuotesByGroup id="azioni" title="Azioni" filter={(d) => d.cls === 'equity'} />
      <QuotesByGroup id="reddito-fisso" title="Titoli di Stato e obbligazioni" filter={(d) => d.cls === 'yield' || d.cls === 'bond'} />
      <QuotesByGroup id="fondi" title="ETF e fondi" filter={(d) => d.cls === 'etf' || d.cls === 'fund'} />
      <QuotesByGroup id="cambi" title="Valute" filter={(d) => d.cls === 'fx'} />
      <QuotesByGroup id="commodity" title="Materie prime" filter={(d) => d.cls === 'commodity'} />
      <QuotesByGroup id="derivati" title="Future e volatilità" filter={(d) => d.cls === 'future' || d.cls === 'volatility'} />
      <QuotesByGroup id="cripto" title="Criptovalute principali" filter={(d) => d.cls === 'crypto'} />
      <QuotesByGroup id="real" title="Immobiliare quotato e private markets" filter={(d) => d.cls === 'reit'} />
      {errs.length > 0 && <details className="card p-4 text-xs text-mute"><summary className="text-ink">Strumenti non aggiornati nell&apos;ultimo ciclo ({errs.length})</summary><ul className="mt-2 space-y-0.5">{errs.slice(0, 50).map((e) => <li key={e} data-notranslate>{e}</li>)}</ul><p className="mt-2">Per questi strumenti resta visibile l&apos;ultimo valore valido, marcato ⚠. Il catalogo si corregge in src/lib/instruments/catalog.ts.</p></details>}
      <Disclaimer />
    </div>
  );
}
