import Link from 'next/link';
import { PageHeader, Card, Disclaimer } from '@/components/ui';
import { RISK_CLS } from '@/components/SectionLayout';
import { GUIDE, FAMILIES } from '@/lib/instruments/guide';
import { INSTRUMENT_BY_ID } from '@/lib/instruments/catalog';
import { SECTION_BY_ID } from '@/lib/sections';

export const metadata = { title: 'Guida agli strumenti finanziari' };

export default function Strumenti() {
  return (
    <div className="space-y-4">
      <PageHeader title="Guida agli strumenti finanziari" desc={`${GUIDE.length} strumenti spiegati: cos'è, come funziona, rischi, costi, tasse in Italia e dove si compra`} color="#e5e7eb" />
      <nav className="card flex flex-wrap gap-1.5 p-3 text-sm" aria-label="Famiglie di strumenti">
        {FAMILIES.map((f) => <a key={f.id} href={`#fam-${encodeURIComponent(f.id)}`} className="chip border-line text-ink hover:border-accent">{f.label} · {GUIDE.filter((g) => g.family === f.id).length}</a>)}
      </nav>
      <div className="rounded-xl border border-line bg-panel2 p-3 text-xs text-mute">
        Il livello di rischio è indicativo e riferito allo strumento in generale (scala: basso, medio-basso, medio, alto, molto alto); per un prodotto specifico fa fede l&apos;indicatore sintetico di rischio (SRI, da 1 a 7) del suo KID. La fiscalità riassume le regole generali per persone fisiche residenti in Italia: verifica sempre le norme vigenti.
      </div>
      {FAMILIES.map((f) => (
        <section key={f.id} id={`fam-${encodeURIComponent(f.id)}`} className="space-y-3">
          <h2 className="text-lg font-bold">{f.label} <span className="text-sm font-normal text-mute">— {f.desc}</span></h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {GUIDE.filter((g) => g.family === f.id).map((g) => (
              <Card key={g.id} id={g.id} title={<span>{g.name}</span>} right={<span className={`chip ${RISK_CLS[g.risk]}`}>rischio {g.risk.toLowerCase()}</span>}>
                <dl className="space-y-2 p-4 text-sm">
                  <Row t="Cos'è" d={g.what} />
                  <Row t="Come funziona" d={g.how} />
                  <Row t="Rischi" d={g.risks} />
                  <Row t="Costi" d={g.costs} />
                  <Row t="Tasse (Italia)" d={g.tax} />
                  <Row t="Dove si compra" d={g.where} />
                  {g.watch && <Row t="Attenzione" d={g.watch} warn />}
                </dl>
                <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-2 text-xs">
                  <Link href={SECTION_BY_ID[g.section]?.href ?? '/'} className="chip border-line text-mute hover:text-ink">Sezione {SECTION_BY_ID[g.section]?.label}</Link>
                  {(g.related ?? []).filter((r) => INSTRUMENT_BY_ID[r]).map((r) => <Link key={r} href={`/strumento/${r}`} className="chip border-accent/30 text-accent">{INSTRUMENT_BY_ID[r].name}</Link>)}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
      <Disclaimer />
    </div>
  );
}
function Row({ t, d, warn }: { t: string; d: string; warn?: boolean }) {
  return <div><dt className="text-[11px] uppercase tracking-wide text-mute">{t}</dt><dd className={warn ? 'text-warn' : ''}>{d}</dd></div>;
}
