import { SectionLayout } from '@/components/SectionLayout';
import { Card, Empty, Freshness } from '@/components/ui';
import { getCache } from '@/lib/db';
import type { MacroItem } from '@/lib/macro';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Macroeconomia e banche centrali' };

type WB = Record<string, { name: string; gdp?: [number, string]; cpi?: [number, string]; unemp?: [number, string]; debt?: [number, string] }>;
const NAME_IT: Record<string, string> = { US: 'Stati Uniti', CN: 'Cina', JP: 'Giappone', DE: 'Germania', IN: 'India', GB: 'Regno Unito', FR: 'Francia', IT: 'Italia', BR: 'Brasile', CA: 'Canada', ES: 'Spagna', KR: 'Corea del Sud' };

function MacroTable({ items }: { items: MacroItem[] }) {
  return (
    <table className="tbl"><thead><tr><th>Indicatore</th><th className="text-right">Ultimo</th><th className="text-right">Precedente</th><th>Periodo</th></tr></thead>
      <tbody>{items.map((i) => {
        const fmt = (v: number | null) => (v == null ? 'n.d.' : i.unit === 'k' ? v.toLocaleString('it-IT', { maximumFractionDigits: 0 }) : i.unit === 'indice' ? v.toLocaleString('it-IT', { maximumFractionDigits: 2 }) : `${v.toLocaleString('it-IT', { maximumFractionDigits: 2 })}${i.unit === 'pp' ? ' pp' : '%'}`);
        const d = i.value != null && i.prev != null ? i.value - i.prev : null;
        return (<tr key={i.id}><td>{i.label}{i.note && <div className="text-[11px] text-mute">{i.note}</div>}</td><td className="text-right font-semibold tabular-nums">{fmt(i.value)}</td><td className={`text-right tabular-nums ${d == null || d === 0 ? 'text-mute' : d > 0 ? 'text-warn' : 'text-info'}`}>{fmt(i.prev)}</td><td className="text-xs text-mute">{i.period ?? ''}</td></tr>);
      })}</tbody></table>
  );
}

export default function Macro() {
  const ecb = getCache<{ items: MacroItem[]; errors: string[] }>('macro:ecb');
  const fred = getCache<MacroItem[]>('macro:fred');
  const wb = getCache<WB>('macro:worldbank');
  const items = ecb.value?.items ?? [];
  const rates = items.filter((i) => ['dfr', 'mro', 'mlf', 'estr', 'euribor3m', 'euribor6m', 'euribor1y'].includes(i.id));
  const infl = items.filter((i) => i.id.startsWith('hicp'));
  const pct = (x?: [number, string]) => (x ? `${x[0].toFixed(1).replace('.', ',')}%` : 'n.d.');
  return (
    <SectionLayout id="macro" strip={['ust10y', 'bund10y', 'eurusd', 'dxy', 'gold', 'brent']}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Tassi BCE, €STR ed Euribor" right={<Freshness fetchedAt={ecb.fetchedAt} source={ecb.source} error={ecb.error} everySec={10800} />}>
          {rates.length ? <MacroTable items={rates} /> : <Empty>{ecb.error ? `Non disponibili: ${ecb.error.slice(0, 120)}` : 'In caricamento…'}</Empty>}
        </Card>
        <Card title="Inflazione armonizzata (HICP)" right={<span className="text-[11px] text-mute">BCE / Eurostat · obiettivo BCE 2%</span>}>
          {infl.length ? <MacroTable items={infl} /> : <Empty>In caricamento…</Empty>}
        </Card>
      </div>
      <Card title="Stati Uniti: Fed, inflazione, lavoro, credito" right={<Freshness fetchedAt={fred.fetchedAt} source={fred.source} error={fred.error} everySec={21600} />}>
        {fred.value?.length ? <MacroTable items={fred.value} /> : <Empty>{fred.error?.includes('non configurata') ? 'Per i dati USA aggiungi la chiave gratuita FRED_API_KEY (vedi README). I rendimenti Treasury sono comunque disponibili nella sezione Obbligazioni.' : fred.error ? `Non disponibili: ${fred.error.slice(0, 120)}` : 'In caricamento…'}</Empty>}
      </Card>
      <Card title="Economie a confronto (dati annuali)" right={<Freshness fetchedAt={wb.fetchedAt} source={wb.source} error={wb.error} everySec={86400} />}>
        {wb.value ? (
          <div className="overflow-x-auto"><table className="tbl min-w-[560px]"><thead><tr><th>Paese</th><th className="text-right">Crescita PIL reale</th><th className="text-right">Inflazione</th><th className="text-right">Disoccupazione</th><th className="text-right">Debito pubblico / PIL</th><th>Anno</th></tr></thead>
            <tbody>{Object.entries(wb.value).map(([k, c]) => (
              <tr key={k}><td>{NAME_IT[k] ?? c.name}</td><td className="text-right tabular-nums">{pct(c.gdp)}</td><td className="text-right tabular-nums">{pct(c.cpi)}</td><td className="text-right tabular-nums">{pct(c.unemp)}</td><td className="text-right tabular-nums">{pct(c.debt)}</td><td className="text-xs text-mute">{c.gdp?.[1] ?? c.cpi?.[1] ?? ''}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty>{wb.error ? `Non disponibili: ${wb.error.slice(0, 120)}` : 'In caricamento…'}</Empty>}
        <p className="border-t border-line px-4 py-2 text-[11px] text-mute">Banca Mondiale: ultimo anno disponibile per ciascun indicatore (pubblicazione con mesi di ritardo; il debito pubblico non è disponibile per tutti i Paesi).</p>
      </Card>
    </SectionLayout>
  );
}
