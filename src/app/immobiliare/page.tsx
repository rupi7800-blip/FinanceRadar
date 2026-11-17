import { SectionLayout } from '@/components/SectionLayout';
import { QuotesByGroup } from '@/components/MarketBlocks';
import { Card } from '@/components/ui';
import { getCache } from '@/lib/db';
import type { MacroItem } from '@/lib/macro';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Immobiliare e private markets' };

export default function Immobiliare() {
  const ecb = getCache<{ items: MacroItem[] }>('macro:ecb').value?.items ?? [];
  const fred = getCache<MacroItem[]>('macro:fred').value ?? [];
  const e3 = ecb.find((i) => i.id === 'euribor3m'), e1y = ecb.find((i) => i.id === 'euribor1y'), us30 = fred.find((i) => i.id === 'MORTGAGE30US');
  const f = (v?: number | null) => (v != null ? `${v.toFixed(2).replace('.', ',')}%` : 'n.d.');
  return (
    <SectionLayout id="immobiliare" strip={['vnq', 'prologis', 'vonovia', 'blackstone', 'kkr', 'apollo']}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card px-4 py-3"><div className="text-xs text-mute">Euribor 3 mesi</div><div className="text-lg font-bold tabular-nums">{f(e3?.value)}</div><div className="text-xs text-mute">parametro dei mutui variabili · {e3?.period ?? ''}</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-mute">Euribor 12 mesi</div><div className="text-lg font-bold tabular-nums">{f(e1y?.value)}</div><div className="text-xs text-mute">{e1y?.period ?? 'BCE'}</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-mute">Mutuo USA a 30 anni</div><div className="text-lg font-bold tabular-nums">{f(us30?.value)}</div><div className="text-xs text-mute">{us30 ? `Freddie Mac via FRED · ${us30.period}` : 'richiede FRED_API_KEY'}</div></div>
      </div>
      <QuotesByGroup id="real" title="Immobiliare quotato e gestori di private markets" filter={(d) => d.cls === 'reit'} />
      <Card title="Mutuo fisso o variabile: cosa guardare">
        <ul className="list-disc space-y-1 p-4 pl-8 text-sm text-mute">
          <li>Il tasso fisso dei mutui segue i tassi swap (IRS) a lungo termine; il variabile segue l&apos;Euribor più uno spread fissato dalla banca.</li>
          <li>Confronta il TAEG (costo complessivo con spese e assicurazioni obbligatorie), non solo il TAN.</li>
          <li>La surroga (portabilità) del mutuo verso un&apos;altra banca è gratuita per legge.</li>
        </ul>
      </Card>
    </SectionLayout>
  );
}
