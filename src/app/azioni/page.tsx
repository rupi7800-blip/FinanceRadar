import { SectionLayout } from '@/components/SectionLayout';
import { QuotesByGroup, AnomalyCard, RankCard } from '@/components/MarketBlocks';
import { quotes, rankings } from '@/lib/market/derived';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Azioni e indici' };

export default function Azioni() {
  const eq = (quotes().value ?? []).filter((q) => q.cls === 'equity');
  const r = rankings(eq);
  return (
    <SectionLayout id="azioni" strip={['ftsemib', 'sp500', 'nasdaq100', 'eurostoxx50', 'dax', 'nikkei']}>
      <QuotesByGroup id="indici" title="Indici di borsa nel mondo" filter={(d) => d.cls === 'index'} />
      <QuotesByGroup id="titoli" title="Azioni: principali titoli per area" filter={(d) => d.cls === 'equity'} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RankCard title="Titoli migliori oggi" list={r.gainers.slice(0, 8)} f={(q) => q.ch1d} />
        <RankCard title="Titoli peggiori oggi" list={r.losers.slice(0, 8)} f={(q) => q.ch1d} />
        <RankCard title="Migliori da inizio anno" list={r.ytdBest.slice(0, 8)} f={(q) => q.chYtd} />
        <RankCard title="Peggiori da inizio anno" list={r.ytdWorst.slice(0, 8)} f={(q) => q.chYtd} />
      </div>
      <AnomalyCard filter={(q) => q.cls === 'equity' || q.cls === 'index'} title="Movimenti anomali su azioni e indici" />
    </SectionLayout>
  );
}
