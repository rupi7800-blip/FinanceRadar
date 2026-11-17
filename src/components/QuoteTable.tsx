import Link from 'next/link';
import type { Quote } from '@/lib/market/types';
import { Sparkline } from './Charts';
import { fmtPrice, fmtChange } from '@/lib/format';
import WatchButton from './WatchButton';
import Ago from './Ago';

function Ch({ v, q }: { v: number | null; q: Quote }) {
  const cls = v == null ? 'text-mute' : v > 0 ? 'up' : v < 0 ? 'down' : 'text-mute';
  return <span className={`tabular-nums ${cls}`}>{fmtChange(v, q)}</span>;
}

/** Barra del range a 52 settimane: posizione del prezzo tra minimo e massimo. */
function Range({ q }: { q: Quote }) {
  if (q.price == null || q.low52 == null || q.high52 == null || q.high52 === q.low52) return <span className="text-[10px] text-mute">—</span>;
  const p = Math.max(0, Math.min(1, (q.price - q.low52) / (q.high52 - q.low52)));
  return (
    <span className="inline-flex w-24 flex-col" title={`Min ${fmtPrice(q.low52, q)} · Max ${fmtPrice(q.high52, q)}`}>
      <span className="relative h-1.5 rounded bg-panel2"><span className="absolute top-[-2px] h-2.5 w-1 rounded bg-accent" style={{ left: `calc(${(p * 100).toFixed(0)}% - 2px)` }} /></span>
    </span>
  );
}

export function QuoteTable({ quotes, showGroup = false, compact = false }: { quotes: Quote[]; showGroup?: boolean; compact?: boolean }) {
  if (!quotes.length) return <div className="px-4 py-6 text-center text-sm text-mute">Quotazioni non ancora disponibili: il primo aggiornamento arriva pochi minuti dopo l&apos;avvio.</div>;
  return (
    <div className="overflow-x-auto">
      <table className={`tbl ${compact ? 'min-w-[480px]' : 'min-w-[760px]'}`}>
        <thead><tr><th className="w-6"></th><th>Strumento</th><th className="text-right">Ultimo</th><th className="text-right">Oggi</th>{!compact && <><th className="text-right">1 sett.</th><th className="text-right">1 mese</th><th className="text-right">Da inizio anno</th><th className="text-right">1 anno</th><th>Range 52 sett.</th><th className="text-right">3 mesi</th></>}</tr></thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.id} className={`hover:bg-panel2/50 ${q.error ? 'opacity-70' : ''}`}>
              <td><WatchButton type="instrument" id={q.id} label={q.name} small /></td>
              <td className="max-w-[260px]">
                <Link href={`/strumento/${q.id}`} className="block truncate font-medium hover:underline">{q.name}</Link>
                <span className="text-[11px] text-mute" data-notranslate>{q.symbol}{showGroup ? ` · ${q.group}` : ''}{q.error ? ' · ⚠ non aggiornato' : ''}</span>
              </td>
              <td className="text-right tabular-nums">{fmtPrice(q.price, q)}<div className="text-[10px] text-mute">{q.marketTime ? <Ago iso={q.marketTime} /> : ''}</div></td>
              <td className="text-right"><Ch v={q.ch1d} q={q} /></td>
              {!compact && <>
                <td className="text-right"><Ch v={q.ch1w} q={q} /></td>
                <td className="text-right"><Ch v={q.ch1m} q={q} /></td>
                <td className="text-right"><Ch v={q.chYtd} q={q} /></td>
                <td className="text-right"><Ch v={q.ch1y} q={q} /></td>
                <td><Range q={q} /></td>
                <td className="text-right"><Sparkline data={q.sparkline} /></td>
              </>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
