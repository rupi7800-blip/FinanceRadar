import 'server-only';
import { fetchJson, fetchText } from '../http';
import type { InstrumentDef } from '../instruments/catalog';
import type { Quote } from './types';

/**
 * Fornitori di quotazioni gratuiti e senza chiave.
 *  - Yahoo Finance (endpoint pubblico dei grafici v8): copertura mondiale di azioni, indici, ETF, fondi, cambi, future, cripto.
 *    Dati generalmente ritardati di 15–20 minuti per le borse; endpoint non documentato ufficialmente: se cambia, scatta la riserva.
 *  - Stooq (CSV pubblici): riserva per indici, azioni USA, cambi, metalli e unica fonte per i rendimenti dei titoli di Stato europei.
 */

const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

type Bar = [number, number]; // [ms, close]

const DAY = 86400e3;
function changeFrom(points: Bar[], price: number, msAgo: number): number | null {
  if (!points.length) return null;
  const target = Date.now() - msAgo;
  let ref: Bar | null = null;
  for (const p of points) {
    if (p[0] <= target) ref = p;
    else break;
  }
  if (!ref || !ref[1]) return null;
  return ((price - ref[1]) / ref[1]) * 100;
}
function ytdRef(points: Bar[]): number | null {
  const y0 = Date.UTC(new Date().getUTCFullYear(), 0, 1);
  let ref: number | null = null;
  for (const p of points) {
    if (p[0] < y0) ref = p[1];
    else break;
  }
  return ref;
}
function downsample(a: number[], n: number) {
  if (a.length <= n) return a;
  const step = (a.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => a[Math.round(i * step)]);
}

/** Calcola variazioni e statistiche dalla serie giornaliera (comune a tutte le fonti). Per i rendimenti le variazioni sono in punti base. */
export function quoteFromSeries(def: InstrumentDef, points: Bar[], o: { price?: number | null; time?: number | null; volume?: number | null; exchange?: string | null; source: string; symbol: string; prevClose?: number | null }): Quote {
  const pts = points.filter((p) => Number.isFinite(p[1]) && p[1] > -1000);
  const last = pts[pts.length - 1];
  const price = o.price ?? last?.[1] ?? null;
  const time = o.time ?? last?.[0] ?? null;
  // chiusura precedente: l'ultima barra di un giorno diverso da quello del prezzo corrente
  let prev = o.prevClose ?? null;
  if (prev == null && time != null) {
    const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    for (let i = pts.length - 1; i >= 0; i--) if (dayOf(pts[i][0]) < dayOf(time)) { prev = pts[i][1]; break; }
  }
  const isYield = def.cls === 'yield';
  const delta = (ref: number | null) => (price == null || ref == null ? null : isYield ? (price - ref) * 100 : ref ? ((price - ref) / ref) * 100 : null);
  const refAt = (ms: number) => { const t = Date.now() - ms; let r: number | null = null; for (const p of pts) { if (p[0] <= t) r = p[1]; else break; } return r; };
  const pctAt = (ms: number) => (isYield ? delta(refAt(ms)) : price != null ? changeFrom(pts, price, ms) : null);
  const yr = pts.filter((p) => p[0] >= Date.now() - 365 * DAY).map((p) => p[1]);
  return {
    id: def.id, symbol: o.symbol, name: def.name, cls: def.cls, group: def.group, region: def.region, ccy: def.ccy,
    price, prevClose: prev, ch1d: delta(prev),
    ch1w: pctAt(7 * DAY),
    ch1m: pctAt(30 * DAY),
    chYtd: delta(ytdRef(pts)),
    ch1y: pctAt(365 * DAY),
    high52: yr.length ? Math.max(...yr, price ?? -Infinity) : null,
    low52: yr.length ? Math.min(...yr, price ?? Infinity) : null,
    volume: o.volume ?? null, exchange: o.exchange ?? null,
    marketTime: time != null ? new Date(time).toISOString() : null,
    sparkline: pts.length > 2 ? downsample(pts.slice(-66).map((p) => p[1]), 40) : null,
    source: o.source, delayed: def.cls !== 'crypto' && def.cls !== 'fx',
  };
}

/* ---------------- Yahoo Finance ---------------- */
type YMeta = { regularMarketPrice?: number; regularMarketTime?: number; regularMarketVolume?: number; fullExchangeName?: string; exchangeName?: string; currency?: string };
type YChart = {
  chart: {
    result: {
      meta: YMeta;
      timestamp?: number[];
      indicators: { quote: { close: (number | null)[] }[]; adjclose?: { adjclose: (number | null)[] }[] };
    }[] | null;
    error: { code: string; description: string } | null;
  };
};

export async function yahooChart(symbol: string, range: string, interval: string): Promise<{ points: Bar[]; meta: YMeta }> {
  const host = Math.random() < 0.5 ? 'query1' : 'query2';
  const r = await fetchJson<YChart>(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false&events=div%2Csplit`, {
    sourceId: 'yahoo', headers: { 'User-Agent': BROWSER_UA }, timeoutMs: 15000, retries: 1,
  });
  const res = r.chart?.result?.[0];
  if (!res) throw new Error(`Yahoo: ${r.chart?.error?.description ?? 'nessun dato'} (${symbol})`);
  const ts = res.timestamp ?? [];
  const cl = res.indicators.quote?.[0]?.close ?? [];
  const points: Bar[] = [];
  ts.forEach((t, i) => { const c = cl[i]; if (c != null && Number.isFinite(c)) points.push([t * 1000, c]); });
  return { points, meta: res.meta };
}

export async function yahooQuote(def: InstrumentDef): Promise<{ quote: Quote; points: Bar[] }> {
  if (!def.y) throw new Error('nessun simbolo Yahoo');
  const { points, meta } = await yahooChart(def.y, '1y', '1d');
  if (!points.length && meta.regularMarketPrice == null) throw new Error(`Yahoo: serie vuota (${def.y})`);
  const quote = quoteFromSeries(def, points, {
    price: meta.regularMarketPrice ?? null, time: meta.regularMarketTime ? meta.regularMarketTime * 1000 : null, volume: meta.regularMarketVolume ?? null,
    exchange: meta.fullExchangeName ?? meta.exchangeName ?? null, source: 'Yahoo Finance', symbol: def.y,
  });
  return { quote, points };
}

/* ---------------- Stooq (CSV) ---------------- */
function parseStooqDaily(csv: string): Bar[] {
  const lines = csv.trim().split(/\r?\n/);
  if (!/^date/i.test(lines[0] ?? '')) throw new Error('Stooq: formato inatteso' + (/no data|n\/d/i.test(csv) ? ' (nessun dato)' : ''));
  const out: Bar[] = [];
  for (const l of lines.slice(1)) {
    const [d, , , , c] = l.split(',');
    const v = Number(c);
    const t = Date.parse(d + 'T21:00:00Z');
    if (Number.isFinite(v) && Number.isFinite(t)) out.push([t, v]);
  }
  return out;
}

export async function stooqDaily(symbol: string, fromDays = 400): Promise<Bar[]> {
  const d1 = new Date(Date.now() - fromDays * DAY).toISOString().slice(0, 10).replace(/-/g, '');
  const csv = await fetchText(`https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d&d1=${d1}`, { sourceId: 'stooq', timeoutMs: 15000, retries: 1 });
  const pts = parseStooqDaily(csv);
  if (!pts.length) throw new Error(`Stooq: serie vuota (${symbol})`);
  return pts;
}

export async function stooqQuote(def: InstrumentDef): Promise<{ quote: Quote; points: Bar[] }> {
  if (!def.s) throw new Error('nessun simbolo Stooq');
  const points = await stooqDaily(def.s);
  return { quote: quoteFromSeries(def, points, { source: 'Stooq', symbol: def.s.toUpperCase() }), points };
}

/** Prova Yahoo, poi Stooq. Ritorna anche la serie giornaliera di un anno (per grafici e calcoli). */
export async function fetchQuote(def: InstrumentDef): Promise<{ quote: Quote; points: Bar[] }> {
  const errors: string[] = [];
  if (def.y) {
    try { return await yahooQuote(def); } catch (e) { errors.push((e as Error).message); }
  }
  if (def.s) {
    try { return await stooqQuote(def); } catch (e) { errors.push((e as Error).message); }
  }
  throw new Error(errors.join(' | ') || 'nessuna fonte disponibile');
}

/** Serie lunga (5 anni, settimanale) per la scheda strumento. */
export async function fetchLongSeries(def: InstrumentDef): Promise<{ points: Bar[]; source: string }> {
  if (def.y) {
    try {
      const { points } = await yahooChart(def.y, '5y', '1wk');
      if (points.length > 10) return { points, source: 'Yahoo Finance' };
    } catch { /* riserva */ }
  }
  if (def.s) {
    const pts = await stooqDaily(def.s, 5 * 366);
    return { points: pts.filter((_, i) => i % 5 === 0 || i === pts.length - 1), source: 'Stooq' };
  }
  throw new Error('serie lunga non disponibile');
}
