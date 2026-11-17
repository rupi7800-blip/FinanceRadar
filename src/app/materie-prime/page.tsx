import { SectionLayout } from '@/components/SectionLayout';
import { QuotesByGroup } from '@/components/MarketBlocks';
import { Card } from '@/components/ui';
import { quoteMap } from '@/lib/market/derived';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Materie prime' };

export default function Materie() {
  const m = quoteMap();
  const gold = m.get('gold')?.price, silver = m.get('silver')?.price, wti = m.get('wti')?.price, brent = m.get('brent')?.price;
  return (
    <SectionLayout id="materie" strip={['gold', 'silver', 'brent', 'wti', 'ttf', 'copper']}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card px-4 py-3"><div className="text-xs text-mute">Rapporto oro/argento</div><div className="text-lg font-bold tabular-nums">{gold && silver ? (gold / silver).toFixed(1).replace('.', ',') : 'n.d.'}</div><div className="text-xs text-mute">once d&apos;argento per un&apos;oncia d&apos;oro</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-mute">Differenziale Brent − WTI</div><div className="text-lg font-bold tabular-nums">{brent && wti ? `$${(brent - wti).toFixed(2).replace('.', ',')}` : 'n.d.'}</div><div className="text-xs text-mute">al barile, contratti future più vicini</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-mute">Unità di misura</div><div className="text-xs">Oro e argento: $/oncia troy · Petrolio: $/barile · Gas Henry Hub: $/MMBtu · TTF: €/MWh · Rame: $/libbra · Grano e mais: centesimi di $/bushel</div></div>
      </div>
      <QuotesByGroup id="commodity" title="Materie prime (contratti future più vicini)" filter={(d) => d.cls === 'commodity'} />
      <Card title="Da sapere"><ul className="list-disc space-y-1 p-4 pl-8 text-sm text-mute">
        <li>I prezzi sono quelli del contratto future con scadenza più vicina: al cambio di scadenza ("roll") il grafico può mostrare un salto che non è un vero movimento di mercato.</li>
        <li>Gli ETC che replicano i future possono rendere molto diversamente dal prezzo "spot" a causa di contango e backwardation.</li>
        <li>Per l&apos;investitore italiano conta anche il cambio euro/dollaro: la maggior parte delle materie prime è quotata in dollari.</li>
      </ul></Card>
    </SectionLayout>
  );
}
