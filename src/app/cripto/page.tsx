import { SectionLayout } from '@/components/SectionLayout';
import { QuotesByGroup } from '@/components/MarketBlocks';
import { Card, Empty, Freshness, Pct } from '@/components/ui';
import { Gauge } from '@/components/Charts';
import { getCache } from '@/lib/db';
import { fmtCompact } from '@/lib/format';
import { fmtUsd } from '@/lib/text';
import type { CryptoCoin, CryptoGlobal } from '@/lib/market/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Criptovalute' };

export default function Cripto() {
  const top = getCache<CryptoCoin[]>('crypto:top');
  const g = getCache<CryptoGlobal>('crypto:global').value;
  const fg = getCache<{ value: number; label: string; at: string }[]>('crypto:feargreed').value?.[0];
  return (
    <SectionLayout id="cripto" strip={['btc', 'eth', 'sol', 'xrp', 'ibit', 'coin']} disclaimer="Le cripto-attività sono strumenti ad altissimo rischio e molto volatili: puoi perdere tutto il capitale. In UE i servizi su cripto-attività possono essere offerti solo da prestatori autorizzati ai sensi del regolamento MiCA.">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card px-4 py-3"><div className="text-xs text-mute">Capitalizzazione totale</div><div className="text-lg font-bold tabular-nums">{fmtCompact(g?.totalMarketCap)}</div><Pct v={g?.marketCapChange24h} className="text-xs" /></div>
        <div className="card px-4 py-3"><div className="text-xs text-mute">Volume 24h</div><div className="text-lg font-bold tabular-nums">{fmtCompact(g?.totalVolume)}</div></div>
        <div className="card px-4 py-3"><div className="text-xs text-mute">Dominance Bitcoin</div><div className="text-lg font-bold tabular-nums">{g?.btcDominance != null ? `${g.btcDominance.toFixed(1).replace('.', ',')}%` : 'n.d.'}</div></div>
        <div className="card flex items-center gap-2 px-4 py-3">{fg ? <Gauge value={fg.value} label={fg.label} /> : <span className="text-sm text-mute">n.d.</span>}<div className="text-xs"><div className="text-mute">Crypto Fear &amp; Greed</div><div className="font-semibold">{fg?.label ?? 'n.d.'}</div></div></div>
      </div>
      <QuotesByGroup id="principali" title="Principali criptovalute, ETF e future" filter={(d) => d.cls === 'crypto' || d.id === 'ibit' || d.id === 'btcfut'} />
      <Card title={`Prime ${top.value?.length ?? 0} criptovalute per capitalizzazione`} right={<Freshness fetchedAt={top.fetchedAt} source={top.source} error={top.error} everySec={600} />}>
        {top.value?.length ? (
          <div className="overflow-x-auto"><table className="tbl min-w-[640px]"><thead><tr><th>#</th><th>Nome</th><th className="text-right">Prezzo</th><th className="text-right">1h</th><th className="text-right">24h</th><th className="text-right">7g</th><th className="text-right">Capitalizzazione</th><th className="text-right">Volume 24h</th></tr></thead>
            <tbody>{top.value.map((c) => (
              <tr key={c.id}><td className="text-mute">{c.rank}</td><td><span className="font-medium">{c.name}</span> <span className="text-xs text-mute">{c.symbol}</span></td><td className="text-right tabular-nums">{fmtUsd(c.price)}</td><td className="text-right"><Pct v={c.ch1h} /></td><td className="text-right"><Pct v={c.ch24h} /></td><td className="text-right"><Pct v={c.ch7d} /></td><td className="text-right tabular-nums">{fmtCompact(c.marketCap)}</td><td className="text-right tabular-nums">{fmtCompact(c.volume24h)}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty>{top.error ? `Non disponibile: ${top.error.slice(0, 120)}` : 'In caricamento…'}</Empty>}
      </Card>
    </SectionLayout>
  );
}
