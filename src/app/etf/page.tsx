import { SectionLayout } from '@/components/SectionLayout';
import { QuotesByGroup } from '@/components/MarketBlocks';
import { Card } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ETF e fondi' };

const CHECK = [
  ['Indice replicato', 'Cosa contiene davvero l\'ETF: area geografica, settori, numero di titoli, peso dei primi 10.'],
  ['TER (spese correnti)', 'Costo annuo trattenuto dal patrimonio: confrontalo tra ETF sullo stesso indice.'],
  ['Accumulazione o distribuzione', 'Gli ETF ad accumulazione reinvestono i proventi; quelli a distribuzione pagano cedole/dividendi (tassati quando incassati).'],
  ['Replica fisica o sintetica', 'Fisica: acquista i titoli dell\'indice. Sintetica: usa uno swap con una banca (rischio controparte limitato dalle regole UCITS).'],
  ['Valuta e copertura', 'Un ETF su azioni USA quotato in euro resta esposto al dollaro, salvo classi "EUR hedged".'],
  ['Dimensione e liquidità', 'Patrimonio gestito e spread denaro-lettera: ETF molto piccoli possono essere chiusi dall\'emittente.'],
  ['KID e domicilio', 'In UE i risparmiatori possono comprare solo ETF con KID (in genere UCITS domiciliati in Irlanda o Lussemburgo).'],
];

export default function Etf() {
  return (
    <SectionLayout id="etf" strip={['swda', 'vwce', 'csspx', 'eimi', 'spy', 'qqq']}>
      <QuotesByGroup id="etf" title="ETF, ETC e fondi monitorati" filter={(d) => d.cls === 'etf' || d.cls === 'fund'} />
      <Card title="Come leggere un ETF prima di comprarlo">
        <dl className="grid gap-px bg-line sm:grid-cols-2">{CHECK.map(([t, d]) => <div key={t} className="bg-panel px-4 py-3 text-sm"><dt className="font-semibold">{t}</dt><dd className="text-xs text-mute">{d}</dd></div>)}</dl>
      </Card>
    </SectionLayout>
  );
}
