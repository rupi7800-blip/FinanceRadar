import { SectionLayout } from '@/components/SectionLayout';
import { QuotesByGroup } from '@/components/MarketBlocks';
import { Card, Empty, Freshness } from '@/components/ui';
import { getCache } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Valute' };

const NAMES: Record<string, string> = { USD: 'Dollaro USA', JPY: 'Yen giapponese', GBP: 'Sterlina britannica', CHF: 'Franco svizzero', CNY: 'Yuan cinese', CAD: 'Dollaro canadese', AUD: 'Dollaro australiano', SEK: 'Corona svedese', NOK: 'Corona norvegese', DKK: 'Corona danese', PLN: 'Zloty polacco', CZK: 'Corona ceca', HUF: 'Fiorino ungherese', RON: 'Leu rumeno', TRY: 'Lira turca', BRL: 'Real brasiliano', MXN: 'Peso messicano', INR: 'Rupia indiana', KRW: 'Won sudcoreano', ZAR: 'Rand sudafricano', HKD: 'Dollaro di Hong Kong', SGD: 'Dollaro di Singapore', NZD: 'Dollaro neozelandese', ILS: 'Nuovo shekel israeliano', IDR: 'Rupia indonesiana', THB: 'Baht thailandese', MYR: 'Ringgit malese', PHP: 'Peso filippino', ISK: 'Corona islandese' };

export default function Valute() {
  const fx = getCache<{ ccy: string; value: number; prev: number | null; date: string }[]>('macro:ecbfx');
  return (
    <SectionLayout id="valute" strip={['eurusd', 'eurgbp', 'eurchf', 'eurjpy', 'usdjpy', 'dxy']}>
      <QuotesByGroup id="cambi" title="Cambi di mercato" filter={(d) => d.cls === 'fx'} />
      <Card title="Cambi di riferimento ufficiali della BCE (1 euro = …)" right={<Freshness fetchedAt={fx.fetchedAt} source={fx.source} error={fx.error} everySec={10800} />}>
        {fx.value?.length ? (
          <div className="overflow-x-auto"><table className="tbl min-w-[420px]"><thead><tr><th>Valuta</th><th>Codice</th><th className="text-right">Cambio</th><th className="text-right">Var. giorno</th><th>Data</th></tr></thead>
            <tbody>{fx.value.map((r) => { const ch = r.prev ? ((r.value - r.prev) / r.prev) * 100 : null; return (
              <tr key={r.ccy}><td>{NAMES[r.ccy] ?? r.ccy}</td><td className="text-mute" data-notranslate>{r.ccy}</td><td className="text-right tabular-nums">{r.value.toLocaleString('it-IT', { maximumFractionDigits: 4 })}</td><td className={`text-right tabular-nums ${ch == null ? 'text-mute' : ch >= 0 ? 'up' : 'down'}`}>{ch == null ? 'n.d.' : `${ch > 0 ? '+' : ''}${ch.toFixed(2).replace('.', ',')}%`}</td><td className="text-xs text-mute">{r.date}</td></tr>); })}</tbody></table></div>
        ) : <Empty>{fx.error ? `Non disponibili: ${fx.error.slice(0, 120)}` : 'In caricamento…'}</Empty>}
        <p className="border-t border-line px-4 py-2 text-[11px] text-mute">Tassi di riferimento pubblicati dalla BCE ogni giorno lavorativo intorno alle 16:00: hanno valore informativo e sono usati per contratti, bilanci e dichiarazioni. Un aumento indica un euro più forte rispetto a quella valuta.</p>
      </Card>
    </SectionLayout>
  );
}
