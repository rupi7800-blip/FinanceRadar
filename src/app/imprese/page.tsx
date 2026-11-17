import { SectionLayout } from '@/components/SectionLayout';
import { Card } from '@/components/ui';
import { NewsList } from '@/components/NewsCard';
import { listNews } from '@/lib/news';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Imprese e bilanci' };

export default function Imprese() {
  const earnings = listNews({ q: 'earnings OR results OR trimestrale OR conti OR utile OR ricavi OR guidance', limit: 10 });
  const deals = listNews({ q: 'acquisition OR merger OR takeover OR acquisizione OR fusione OR OPA OR OPS OR offerta', limit: 10 });
  const ipo = listNews({ q: 'IPO OR listing OR quotazione OR debutto', limit: 8 });
  const div = listNews({ q: 'dividend OR dividendo OR buyback OR riacquisto OR cedola', limit: 8 });
  return (
    <SectionLayout id="imprese" strip={['aapl', 'nvda', 'msft', 'intesa', 'eni', 'stellantis']}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Risultati e trimestrali"><NewsList items={earnings} compact empty="Nessuna notizia recente." /></Card>
        <Card title="Fusioni, acquisizioni e offerte pubbliche"><NewsList items={deals} compact empty="Nessuna notizia recente." /></Card>
        <Card title="IPO e nuove quotazioni"><NewsList items={ipo} compact empty="Nessuna notizia recente." /></Card>
        <Card title="Dividendi e riacquisti di azioni"><NewsList items={div} compact empty="Nessuna notizia recente." /></Card>
      </div>
    </SectionLayout>
  );
}
