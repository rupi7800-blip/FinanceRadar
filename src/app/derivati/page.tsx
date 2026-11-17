import { SectionLayout } from '@/components/SectionLayout';
import { QuotesByGroup } from '@/components/MarketBlocks';
import { Card } from '@/components/ui';
import { quoteMap } from '@/lib/market/derived';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Derivati' };

export default function Derivati() {
  const m = quoteMap();
  const es = m.get('es'), sp = m.get('sp500'), vix = m.get('vix');
  const basis = es?.price != null && sp?.price != null ? es.price - sp.price : null;
  return (
    <SectionLayout id="derivati" strip={['es', 'nq', 'vix', 'vxn', 'move', 'btcfut']} disclaimer="I derivati e i prodotti a leva sono strumenti complessi: le autorità europee richiedono avvertenze specifiche perché la maggior parte degli investitori al dettaglio perde denaro con CFD e prodotti a leva. Le informazioni qui presenti non costituiscono consulenza.">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card px-4 py-3"><div className="text-xs text-mute">Base future S&amp;P 500</div><div className="text-lg font-bold tabular-nums">{basis != null ? basis.toFixed(1).replace('.', ',') + ' punti' : 'n.d.'}</div><div className="text-xs text-mute">future E-mini − indice a pronti (riflette tassi e dividendi attesi; orari di rilevazione possono differire)</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-mute">VIX</div><div className="text-lg font-bold tabular-nums">{vix?.price?.toFixed(1).replace('.', ',') ?? 'n.d.'}</div><div className="text-xs text-mute">sotto 15 calma · 15–20 normale · 20–30 tensione · sopra 30 stress</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-mute">Dove si negoziano</div><div className="text-xs">IDEM (Borsa Italiana), Eurex, CME, CBOE per future e opzioni; SeDeX ed EuroTLX/Cert-X per certificati e covered warrant; i CFD sono contratti con il broker, non quotati.</div></div>
      </div>
      <QuotesByGroup id="derivati" title="Future e indici di volatilità" filter={(d) => d.cls === 'future' || d.cls === 'volatility'} />
      <Card title="Le avvertenze ESMA per i prodotti a leva (in sintesi)">
        <ul className="list-disc space-y-1 p-4 pl-8 text-sm text-mute">
          <li>CFD per clienti al dettaglio: leva massima 30:1 sulle coppie di valute principali, 20:1 su indici principali, oro e valute minori, 10:1 su materie prime e indici minori, 5:1 su azioni, 2:1 su cripto.</li>
          <li>Chiusura automatica della posizione quando il margine scende al 50% del minimo richiesto e protezione dal saldo negativo.</li>
          <li>Vietati i bonus e gli incentivi al trading; obbligo di indicare la percentuale di conti al dettaglio in perdita.</li>
          <li>Le opzioni binarie non possono essere commercializzate ai clienti al dettaglio nell&apos;UE.</li>
        </ul>
      </Card>
    </SectionLayout>
  );
}
