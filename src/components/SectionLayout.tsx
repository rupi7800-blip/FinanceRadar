import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageHeader, Disclaimer, Card } from './ui';
import { SectionNews } from './SectionNews';
import { QuoteStrip } from './MarketBlocks';
import { SECTION_BY_ID } from '@/lib/sections';
import { GUIDE } from '@/lib/instruments/guide';

/** Struttura comune delle sezioni tematiche: intestazione, quotazioni chiave, contenuti specifici, guida e notizie. */
export function SectionLayout({ id, strip, children, newsTitle, disclaimer }: { id: string; strip?: string[]; children?: ReactNode; newsTitle?: string; disclaimer?: string }) {
  const s = SECTION_BY_ID[id];
  const guide = GUIDE.filter((g) => g.section === id);
  return (
    <div className="space-y-4">
      <PageHeader title={s.label} desc={s.desc} color={s.color} />
      {strip && <QuoteStrip ids={strip} />}
      {children}
      {guide.length > 0 && (
        <Card title="Strumenti di questa sezione: guida rapida" right={<Link href="/strumenti" className="text-xs text-accent">Guida completa →</Link>}>
          <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {guide.map((g) => (
              <li key={g.id} className="bg-panel px-4 py-3 text-sm">
                <Link href={`/strumenti#${g.id}`} className="font-medium hover:underline">{g.name}</Link>
                <span className={`chip ml-2 ${RISK_CLS[g.risk]}`}>rischio {g.risk.toLowerCase()}</span>
                <p className="mt-1 line-clamp-2 text-xs text-mute">{g.what}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <SectionNews title={newsTitle ?? `Notizie — ${s.label}`} filter={{ section: id }} />
      <Disclaimer text={disclaimer} />
    </div>
  );
}

export const RISK_CLS: Record<string, string> = {
  Basso: 'border-up/40 text-up', 'Medio-basso': 'border-info/40 text-info', Medio: 'border-warn/40 text-warn', Alto: 'border-orange-500/50 text-orange-400', 'Molto alto': 'border-down/50 text-down',
};
