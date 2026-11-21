import 'server-only';
import { fetchJson, fetchText } from '../http';
import type { InstrumentDef } from '../instruments/catalog';

/**
 * Fonti alternative gratuite e senza chiave per le classi che Yahoo non copre in modo affidabile:
 *  - cambi: tassi di riferimento giornalieri della BCE (EXR), unità di valuta per 1 euro
 *  - cripto: storico giornaliero di CoinPaprika (piano gratuito: circa 12 mesi)
 *  - rendimenti USA: curva ufficiale del Tesoro USA (Treasury Par Yield Curve)
 */

export type Bar = [number, number];
export type Series = { points: Bar[]; source: string };

/** Memorizza il risultato per un tempo limitato, così più richieste della stessa esecuzione usano un solo download. */
function memo<T>(ttl: number, fn: () => Promise<T>): () => Promise<T> {
  let v: Promise<T> | null = null;
  let at = 0;
  return () => {
    if (!v || Date.now() - at > ttl) {
      at = Date.now();
      v = fn().catch((e) => { v = null; throw e; });
    }
    return v;
  };
}

/* ---------------- BCE: cambi di riferimento ---------------- */
const ecbAll = memo(30 * 60e3, async () => {
  const csv = await fetchText('https://data-api.ecb.europa.eu/service/data/EXR/D..EUR.SP00.A?lastNObservations=400&format=csvdata', { sourceId: 'ecb-data', timeoutMs: 40000, retries: 1 });
  const lines = csv.trim().split(/\r?\n/);
  const head = lines[0].split(',');
  const iK = head.indexOf('KEY'), iT = head.indexOf('TIME_PERIOD'), iV = head.indexOf('OBS_VALUE');
  if (iK < 0 || iT < 0 || iV < 0) throw new Error('BCE: formato CSV inatteso');
  const m = new Map<string, Map<string, number>>();
  for (const l of lines.slice(1)) {
    const c = l.split(',');
    const ccy = c[iK]?.split('.')[2];
    const v = Number(c[iV]);
    if (!ccy || !Number.isFinite(v)) continue;
    if (!m.has(ccy)) m.set(ccy, new Map());
    m.get(ccy)!.set(c[iT], v);
  }
  if (!m.size) throw new Error('BCE: nessun cambio');
  return m;
});

/** Coppie: valore = tasso(a) / tasso(b), dove tasso(EUR) = 1 (unità di valuta per 1 euro). */
const FX_PAIR: Record<string, [string, string]> = {
  eurusd: ['USD', 'EUR'], gbpusd: ['USD', 'GBP'], usdjpy: ['JPY', 'USD'], usdchf: ['CHF', 'USD'], audusd: ['USD', 'AUD'],
  usdcad: ['CAD', 'USD'], nzdusd: ['USD', 'NZD'], eurgbp: ['GBP', 'EUR'], eurchf: ['CHF', 'EUR'], eurjpy: ['JPY', 'EUR'],
  usdcny: ['CNY', 'USD'], usdinr: ['INR', 'USD'], usdbrl: ['BRL', 'USD'], usdtry: ['TRY', 'USD'], usdmxn: ['MXN', 'USD'], usdzar: ['ZAR', 'USD'],
};

export async function ecbFxSeries(def: InstrumentDef): Promise<Series> {
  const pair = FX_PAIR[def.id];
  if (!pair) throw new Error('nessuna serie BCE per questo cambio');
  const m = await ecbAll();
  const [a, b] = pair;
  const ra = a === 'EUR' ? null : m.get(a);
  const rb = b === 'EUR' ? null : m.get(b);
  if ((a !== 'EUR' && !ra) || (b !== 'EUR' && !rb)) throw new Error(`BCE: valuta non disponibile (${a}/${b})`);
  const dates = [...(ra ?? rb)!.keys()].sort();
  const points: Bar[] = [];
  for (const d of dates) {
    const va = a === 'EUR' ? 1 : ra!.get(d);
    const vb = b === 'EUR' ? 1 : rb?.get(d);
    if (va && vb) points.push([Date.parse(d + 'T14:15:00Z'), va / vb]);
  }
  if (!points.length) throw new Error('BCE: serie vuota');
  return { points, source: 'BCE (cambi di riferimento)' };
}

/* ---------------- CoinPaprika: cripto ---------------- */
const CP_ID: Record<string, string> = { btc: 'btc-bitcoin', eth: 'eth-ethereum', sol: 'sol-solana', xrp: 'xrp-xrp', bnb: 'bnb-binance-coin', ada: 'ada-cardano', doge: 'doge-dogecoin' };

export async function cpSeries(def: InstrumentDef): Promise<Series> {
  const id = CP_ID[def.id];
  if (!id) throw new Error('nessun identificativo CoinPaprika');
  const start = new Date(Date.now() - 360 * 86400e3).toISOString().slice(0, 10);
  const r = await fetchJson<unknown>(`https://api.coinpaprika.com/v1/tickers/${id}/historical?start=${start}&interval=1d&limit=360`, { sourceId: 'coinpaprika', timeoutMs: 20000, retries: 1 });
  if (!Array.isArray(r)) throw new Error('CoinPaprika: ' + ((r as { error?: string })?.error ?? 'risposta non valida').slice(0, 120));
  const points = (r as { timestamp: string; price: number }[])
    .map((x) => [Date.parse(x.timestamp), Number(x.price)] as Bar)
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[1] > 0);
  if (!points.length) throw new Error('CoinPaprika: serie vuota');
  return { points, source: 'CoinPaprika' };
}

/* ---------------- Tesoro USA: curva dei rendimenti ---------------- */
const ustRows = memo(30 * 60e3, async () => {
  const y = new Date().getUTCFullYear();
  const rows: { date: number; vals: Record<string, number> }[] = [];
  for (const year of [y - 1, y]) {
    const csv = await fetchText(`https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`, { sourceId: 'ustreasury', timeoutMs: 30000, retries: 1 });
    const lines = csv.trim().split(/\r?\n/);
    const head = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
    for (const l of lines.slice(1)) {
      const c = l.split(',').map((x) => x.replace(/"/g, '').trim());
      const [mm, dd, yy] = (c[0] ?? '').split('/').map(Number);
      if (!yy || !mm || !dd) continue;
      const vals: Record<string, number> = {};
      head.slice(1).forEach((h, i) => { const v = Number(c[i + 1]); if (c[i + 1] && Number.isFinite(v)) vals[h] = v; });
      rows.push({ date: Date.UTC(yy, mm - 1, dd, 21), vals });
    }
  }
  if (!rows.length) throw new Error('Tesoro USA: nessun dato');
  return rows.sort((a, b) => a.date - b.date);
});

const UST_LABEL: Record<string, string> = { ust3m: '3 Mo', ust5y: '5 Yr', ust10y: '10 Yr', ust30y: '30 Yr' };

export async function ustSeries(def: InstrumentDef): Promise<Series> {
  const label = UST_LABEL[def.id];
  if (!label) throw new Error('scadenza non presente nella curva del Tesoro');
  const rows = await ustRows();
  const points = rows.filter((r) => r.vals[label] != null).map((r) => [r.date, r.vals[label]] as Bar);
  if (!points.length) throw new Error('Tesoro USA: serie vuota');
  return { points, source: 'Tesoro USA' };
}
