import { SectionLayout } from '@/components/SectionLayout';
import { Card } from '@/components/ui';
import { NewsList } from '@/components/NewsCard';
import { listNews } from '@/lib/news';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Regole, vigilanza e fisco' };

const TAX: [string, string][] = [
  ['Titoli di Stato italiani ed esteri "white list", buoni postali, sovranazionali', '12,5%'],
  ['Azioni, obbligazioni societarie, conti deposito, dividendi', '26%'],
  ['Fondi ed ETF', '26% (12,5% sulla quota in titoli di Stato); guadagni come redditi di capitale, non compensabili con minusvalenze pregresse'],
  ['Certificati, ETC/ETN, derivati, valute (oltre soglia)', '26% come redditi diversi, compensabili con minusvalenze'],
  ['Cripto-attività', '26% nel 2025, 33% dal 2026 (Legge di bilancio 2025)'],
  ['Fondi pensione', 'Rendimenti 20% (12,5% su titoli di Stato); prestazioni dal 15% al 9%'],
  ['Imposta di bollo su dossier titoli e prodotti finanziari', '0,2% annuo del valore'],
];

const AUTH: [string, string, string][] = [
  ['Consob', 'https://www.consob.it', 'Vigila sui mercati, sugli intermediari e sui prospetti; pubblica gli avvisi sugli abusivi.'],
  ['Banca d\'Italia', 'https://www.bancaditalia.it', 'Vigilanza su banche e finanziarie; Arbitro Bancario Finanziario (ABF).'],
  ['IVASS', 'https://www.ivass.it', 'Vigilanza su assicurazioni e polizze.'],
  ['COVIP', 'https://www.covip.it', 'Vigilanza sui fondi pensione; confronto dei costi (ISC).'],
  ['ESMA', 'https://www.esma.europa.eu', 'Autorità europea dei mercati: MiFID II, PRIIPs, MiCA.'],
  ['SEC', 'https://www.sec.gov', 'Autorità dei mercati USA.'],
  ['Agenzia delle Entrate', 'https://www.agenziaentrate.gov.it', 'Norme e circolari sulla tassazione delle rendite finanziarie.'],
];

export default function Regole() {
  const official = listNews({ sourceCategory: ['regulator'], limit: 12 });
  return (
    <SectionLayout id="regole" disclaimer="La tabella fiscale riassume regole generali per persone fisiche residenti in Italia e può non riflettere modifiche recenti o casi particolari: verifica sempre sulle fonti ufficiali o con un professionista.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Comunicazioni ufficiali delle autorità"><NewsList items={official} compact empty="Nessuna comunicazione recente." /></Card>
        <Card title="Tassazione delle rendite finanziarie in Italia (sintesi)">
          <table className="tbl"><tbody>{TAX.map(([a, b]) => <tr key={a}><td className="text-sm">{a}</td><td className="text-sm font-semibold">{b}</td></tr>)}</tbody></table>
        </Card>
      </div>
      <Card title="Chi vigila su cosa">
        <ul className="grid gap-px bg-line sm:grid-cols-2">{AUTH.map(([n, u, d]) => <li key={n} className="bg-panel px-4 py-3 text-sm"><a href={u} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">{n} ↗</a><p className="text-xs text-mute">{d}</p></li>)}</ul>
      </Card>
    </SectionLayout>
  );
}
