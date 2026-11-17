import Link from 'next/link';
import { SectionLayout } from '@/components/SectionLayout';
import { Card, Empty } from '@/components/ui';
import { getCache } from '@/lib/db';
import { quoteMap } from '@/lib/market/derived';
import type { MacroItem } from '@/lib/macro';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Risparmio e previdenza' };

export default function Risparmio() {
  const ecb = getCache<{ items: MacroItem[] }>('macro:ecb').value?.items ?? [];
  const by = (id: string) => ecb.find((i) => i.id === id);
  const m = quoteMap();
  const infl = by('hicp_it')?.value ?? null;
  const rows: [string, number | null | undefined, string][] = [
    ['€STR (tasso overnight)', by('estr')?.value, 'Riferimento per conti deposito e ETF monetari'],
    ['Tasso BCE sui depositi', by('dfr')?.value, 'Guida i tassi offerti da banche e conti deposito'],
    ['Euribor 3 mesi', by('euribor3m')?.value, 'Parametro dei mutui a tasso variabile'],
    ['BTP 2 anni (rendimento lordo)', m.get('btp2y')?.price, 'Fonte Stooq, mercato secondario'],
    ['BTP 10 anni (rendimento lordo)', m.get('btp10y')?.price, 'Fonte Stooq, mercato secondario'],
    ['Treasury USA 3 mesi', m.get('ust3m')?.price, 'In dollari: esposto al cambio'],
  ];
  return (
    <SectionLayout id="risparmio" strip={['btp2y', 'btp10y', 'ftsemib', 'swda', 'gold', 'eurusd']} disclaimer="Le informazioni hanno scopo educativo e non costituiscono consulenza. I rendimenti indicati sono lordi e di mercato: le offerte effettive di banche, Poste e assicurazioni possono differire. Per i dati ufficiali su costi e rendimenti dei fondi pensione consulta il sito COVIP.">
      <Card title="Rendimenti di riferimento a confronto con l'inflazione">
        {rows.some((r) => r[1] != null) ? (
          <table className="tbl"><thead><tr><th>Riferimento</th><th className="text-right">Tasso lordo</th><th className="text-right">Reale (− inflazione Italia)</th><th>Nota</th></tr></thead>
            <tbody>{rows.map(([l, v, n]) => <tr key={l}><td>{l}</td><td className="text-right tabular-nums">{v != null ? `${v.toFixed(2).replace('.', ',')}%` : 'n.d.'}</td><td className={`text-right tabular-nums ${v == null || infl == null ? 'text-mute' : v - infl >= 0 ? 'up' : 'down'}`}>{v != null && infl != null ? `${(v - infl).toFixed(2).replace('.', ',')}%` : 'n.d.'}</td><td className="text-xs text-mute">{n}</td></tr>)}</tbody></table>
        ) : <Empty>Dati in caricamento.</Empty>}
        <p className="border-t border-line px-4 py-2 text-[11px] text-mute">Inflazione Italia (HICP annua, BCE): {infl != null ? `${infl.toFixed(1).replace('.', ',')}%` : 'n.d.'}. Il rendimento reale è un&apos;approssimazione (tasso lordo meno inflazione corrente) e non tiene conto di tasse e costi: sui titoli di Stato si paga il 12,5%, su conti deposito e la maggior parte degli altri strumenti il 26%, più l&apos;imposta di bollo.</p>
      </Card>
      <Card title="Le basi in cinque punti">
        <ol className="list-decimal space-y-1.5 p-4 pl-8 text-sm text-mute">
          <li><b className="text-ink">Prima il fondo di emergenza</b>: qualche mese di spese in strumenti liquidi e sicuri (conto deposito libero, buoni postali, ETF monetari).</li>
          <li><b className="text-ink">Orizzonte temporale</b>: denaro che serve entro pochi anni non va su strumenti volatili come le azioni.</li>
          <li><b className="text-ink">Diversificazione</b>: molti titoli, aree e classi di attività riducono il rischio specifico; un solo titolo o un solo settore no.</li>
          <li><b className="text-ink">Costi</b>: con un rendimento lordo del 6% annuo, 2 punti di costi in più riducono il capitale finale dopo 30 anni di circa il 40% rispetto a un prodotto quasi senza costi.</li>
          <li><b className="text-ink">Previdenza</b>: per i dipendenti il fondo pensione negoziale di categoria aggiunge spesso il contributo del datore di lavoro e la deducibilità fiscale.</li>
        </ol>
        <p className="px-4 pb-3 text-xs"><Link href="/strumenti" className="text-accent">Tutti gli strumenti spiegati: rischi, costi e tasse →</Link></p>
      </Card>
    </SectionLayout>
  );
}
