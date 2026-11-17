'use client';
import { useEffect, useMemo, useState } from 'react';
import { LineChart } from './Charts';

type P = [number, number][];
const RANGES: [string, number][] = [['1M', 30], ['3M', 91], ['6M', 182], ['YTD', -1], ['1A', 365], ['5A', 1826]];

/** Grafico storico: serie giornaliera di 1 anno + settimanale di 5 anni, già incluse nella pagina (nessuna chiamata dal browser). */
export default function InstrumentChart({ daily, weekly, isYield, source }: { daily: P; weekly: P; isYield: boolean; source: string | null }) {
  const [r, setR] = useState('1A');
  // riferimento temporale fissato all'ultimo dato disponibile: identico su server e browser (niente errori di idratazione)
  const [now, setNow] = useState(() => Math.max(daily[daily.length - 1]?.[0] ?? 0, weekly[weekly.length - 1]?.[0] ?? 0));
  useEffect(() => setNow(Date.now()), []);
  const pts = useMemo(() => {
    const days = RANGES.find((x) => x[0] === r)?.[1] ?? 365;
    const from = days === -1 ? Date.UTC(new Date(now).getUTCFullYear(), 0, 1) : now - days * 86400e3;
    const base = days > 365 ? weekly : daily;
    return base.filter((p) => p[0] >= from);
  }, [r, daily, weekly, now]);
  const first = pts[0]?.[1], last = pts[pts.length - 1]?.[1];
  const ch = first != null && last != null ? (isYield ? (last - first) * 100 : first ? ((last - first) / first) * 100 : null) : null;
  return (
    <div className="p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {RANGES.map(([k, d]) => <button key={k} onClick={() => setR(k)} disabled={d > 365 && weekly.length < 3} className={`btn px-2 py-0.5 text-xs ${r === k ? 'btn-primary' : ''} disabled:opacity-40`}>{k}</button>)}
        {ch != null && <span className={`ml-auto text-sm tabular-nums ${ch >= 0 ? 'up' : 'down'}`}>{ch >= 0 ? '+' : ''}{isYield ? `${Math.round(ch)} pb` : `${ch.toFixed(2).replace('.', ',')}%`} nel periodo</span>}
      </div>
      <LineChart points={pts} />
      {pts.length > 1 && <div className="mt-1 flex justify-between text-[11px] text-mute tabular-nums"><span>{new Date(pts[0][0]).toLocaleDateString('it-IT')}</span><span>min {Math.min(...pts.map((p) => p[1])).toLocaleString('it-IT', { maximumFractionDigits: 4 })} · max {Math.max(...pts.map((p) => p[1])).toLocaleString('it-IT', { maximumFractionDigits: 4 })}</span><span>{new Date(pts[pts.length - 1][0]).toLocaleDateString('it-IT')}</span></div>}
      <div className="mt-1 text-[11px] text-mute">{source ? `Fonte: ${source} · chiusure ${r === '5A' ? 'settimanali' : 'giornaliere'}` : 'Serie storica non ancora disponibile.'}</div>
    </div>
  );
}
