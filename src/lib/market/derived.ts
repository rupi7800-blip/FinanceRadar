import 'server-only';
import { getCache } from '../db';
import type { Quote, Series } from './types';
import type { AssetClass } from '../instruments/catalog';

export function quotes() {
  return getCache<Quote[]>('market:quotes');
}
export function quoteMap() {
  return new Map((quotes().value ?? []).map((q) => [q.id, q]));
}
export function series(id: string) {
  return getCache<Series>(`series:${id}`);
}

/** Soglie di "movimento anomalo" per classe: ciò che è normale per una cripto è eccezionale per un indice o un cambio. */
const DAY_THRESHOLD: Record<AssetClass, number> = {
  index: 2.5, equity: 7, etf: 4, fund: 3, bond: 2, yield: 15 /* punti base */, fx: 1.5, commodity: 5, future: 3, volatility: 20, crypto: 10, reit: 6,
};
export const anomalyThreshold = (c: AssetClass) => DAY_THRESHOLD[c];

export type Anomaly = { q: Quote; reasons: string[] };

export function anomalies(): Anomaly[] {
  const out: Anomaly[] = [];
  for (const q of quotes().value ?? []) {
    if (q.error) continue;
    const r: string[] = [];
    const th = DAY_THRESHOLD[q.cls];
    const unit = q.cls === 'yield' ? ' pb' : '%';
    const f = (v: number) => `${v > 0 ? '+' : ''}${q.cls === 'yield' ? v.toFixed(0) : v.toFixed(1)}${unit}`;
    if (q.ch1d != null && Math.abs(q.ch1d) >= th) r.push(`${f(q.ch1d)} in una seduta (soglia ±${th}${unit})`);
    if (q.ch1w != null && Math.abs(q.ch1w) >= th * 2.5) r.push(`${f(q.ch1w)} in una settimana`);
    if (q.price != null && q.high52 != null && q.price >= q.high52 && q.cls !== 'yield') r.push('Nuovo massimo a 52 settimane');
    if (q.price != null && q.low52 != null && q.price <= q.low52 && q.cls !== 'yield') r.push('Nuovo minimo a 52 settimane');
    if (q.cls === 'volatility' && q.id === 'vix' && q.price != null && q.price >= 30) r.push(`VIX a ${q.price.toFixed(1)}: stress elevato sui mercati`);
    if (r.length) out.push({ q, reasons: r });
  }
  return out.sort((a, b) => b.reasons.length - a.reasons.length || Math.abs(b.q.ch1d ?? 0) - Math.abs(a.q.ch1d ?? 0)).slice(0, 20);
}

export function rankings(list: Quote[]) {
  const valid = list.filter((q) => !q.error && q.cls !== 'yield' && q.cls !== 'volatility');
  const by = (f: (q: Quote) => number | null, dir: 1 | -1, n = 10) => [...valid].filter((q) => f(q) != null).sort((a, b) => dir * ((f(b) as number) - (f(a) as number))).slice(0, n);
  return { gainers: by((q) => q.ch1d, 1), losers: by((q) => q.ch1d, -1), ytdBest: by((q) => q.chYtd, 1), ytdWorst: by((q) => q.chYtd, -1) };
}

/** Ampiezza del mercato: quota di strumenti azionari in rialzo nella seduta (indicatore calcolato, metodologia dichiarata). */
export function breadth() {
  const eq = (quotes().value ?? []).filter((q) => (q.cls === 'equity' || q.cls === 'index') && q.ch1d != null && !q.error);
  if (eq.length < 10) return null;
  const up = eq.filter((q) => (q.ch1d as number) > 0).length;
  return { up, down: eq.length - up, total: eq.length, pct: Math.round((up / eq.length) * 100) };
}

/** Spread BTP–Bund in punti base (dal rendimento a 10 anni di entrambi, stessa fonte e stessa data quando possibile). */
export function btpBundSpread() {
  const m = quoteMap();
  const b = m.get('btp10y'), d = m.get('bund10y');
  if (b?.price == null || d?.price == null) return null;
  const sb = series('btp10y').value?.points ?? [], sd = series('bund10y').value?.points ?? [];
  const dm = new Map(sd.map((p) => [new Date(p[0]).toISOString().slice(0, 10), p[1]]));
  const hist: [number, number][] = [];
  for (const p of sb) { const v = dm.get(new Date(p[0]).toISOString().slice(0, 10)); if (v != null) hist.push([p[0], Math.round((p[1] - v) * 100)]); }
  const now = Math.round((b.price - d.price) * 100);
  const prev = hist.length > 1 ? hist[hist.length - 2][1] : null;
  return { now, prev, change: prev != null ? now - prev : null, hist, btp: b.price, bund: d.price, at: b.marketTime ?? null, source: b.source };
}
