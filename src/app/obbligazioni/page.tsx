import { SectionLayout } from '@/components/SectionLayout';
import { QuotesByGroup } from '@/components/MarketBlocks';
import { Card, Empty, Freshness } from '@/components/ui';
import { LineChart, YieldCurve } from '@/components/Charts';
import { btpBundSpread, quoteMap } from '@/lib/market/derived';
import { getCache } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Obbligazioni e titoli di Stato' };

type Curve = { points: { tenor: string; value: number | null }[]; date: string | null };
type UsCurve = { date: string; points: { tenor: string; value: number | null }[]; compareDate: string; compare: { tenor: string; value: number | null }[] };

export default function Obbligazioni() {
  const sp = btpBundSpread();
  const m = quoteMap();
  const eu = getCache<Curve>('macro:eucurve');
  const us = getCache<UsCurve>('macro:uscurve');
  const usPts = us.value?.points ?? [];
  const u2 = usPts.find((p) => p.tenor === '2Y')?.value, u10 = usPts.find((p) => p.tenor === '10Y')?.value;
  const spreads = [['oat10y', 'Francia'], ['bono10y', 'Spagna'], ['btp10y', 'Italia'], ['gilt10y', 'Regno Unito'], ['ust10y', 'USA']] as const;
  const bund = m.get('bund10y')?.price;
  return (
    <SectionLayout id="obbligazioni" strip={['btp10y', 'bund10y', 'oat10y', 'bono10y', 'ust10y', 'jgb10y']}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Spread BTP–Bund (10 anni)" right={sp ? <span className="text-[11px] text-mute">{sp.source}</span> : null} className="lg:col-span-2">
          {sp ? (
            <div className="p-4">
              <div className="flex flex-wrap items-baseline gap-3"><span className="text-3xl font-bold tabular-nums">{sp.now} pb</span>{sp.change != null && <span className={sp.change > 0 ? 'down' : 'up'}>{sp.change > 0 ? '+' : ''}{sp.change} pb</span>}<span className="text-xs text-mute">BTP {sp.btp.toFixed(2)}% − Bund {sp.bund.toFixed(2)}%</span></div>
              <LineChart points={sp.hist} height={160} />
              <p className="mt-1 text-[11px] text-mute">Differenza tra i rendimenti a 10 anni di Italia e Germania (1 punto base = 0,01%). Misura il premio chiesto dal mercato per il rischio Italia. Ultimo anno, chiusure giornaliere.</p>
            </div>
          ) : <Empty>Spread non disponibile: servono i rendimenti di BTP e Bund (fonte Stooq).</Empty>}
        </Card>
        <Card title="Spread verso il Bund (10 anni)">
          {bund != null ? <ul className="divide-y divide-line text-sm">{spreads.map(([id, l]) => { const v = m.get(id)?.price; return <li key={id} className="flex justify-between px-4 py-2"><span>{l}</span><span className="tabular-nums">{v != null ? `${Math.round((v - bund) * 100)} pb` : 'n.d.'}</span></li>; })}</ul> : <Empty>n.d.</Empty>}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Curva dei rendimenti — titoli di Stato USA" right={<Freshness fetchedAt={us.fetchedAt} source={us.source} error={us.error} everySec={10800} />}>
          {us.value ? <div className="p-4"><YieldCurve points={us.value.points} compare={us.value.compare} /><p className="text-[11px] text-mute">Linea continua: {us.value.date}; tratteggiata: {us.value.compareDate}. {u2 != null && u10 != null && <>Differenziale 10 anni − 2 anni: <b className={u10 - u2 < 0 ? 'text-down' : 'text-up'}>{Math.round((u10 - u2) * 100)} pb</b>{u10 - u2 < 0 ? ' (curva invertita: storicamente associata a rischi di recessione)' : ''}.</>}</p></div> : <Empty>{us.error ? `Non disponibile: ${us.error.slice(0, 120)}` : 'In caricamento…'}</Empty>}
        </Card>
        <Card title="Curva dei rendimenti — area euro (titoli AAA)" right={<Freshness fetchedAt={eu.fetchedAt} source={eu.source} error={eu.error} everySec={10800} />}>
          {eu.value ? <div className="p-4"><YieldCurve points={eu.value.points} /><p className="text-[11px] text-mute">Stima BCE dei rendimenti a scadenza costante dei titoli di Stato dell&apos;area euro con rating AAA, dati del {eu.value.date ?? 'n.d.'}.</p></div> : <Empty>{eu.error ? `Non disponibile: ${eu.error.slice(0, 120)}` : 'In caricamento…'}</Empty>}
        </Card>
      </div>
      <QuotesByGroup id="rendimenti" title="Rendimenti, ETF obbligazionari e future" filter={(d) => d.cls === 'yield' || d.cls === 'bond'} />
    </SectionLayout>
  );
}
