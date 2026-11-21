import 'server-only';
import { fetchJson } from '../http';
import { getCache, setCache } from '../db';
import type { InstrumentDef } from '../instruments/catalog';
import type { Bar, Series } from './alt';

/**
 * Fonti ufficiali con chiave gratuita (da inserire nei Secrets di GitHub o nel file .env):
 *  - FRED (Federal Reserve di St. Louis, FRED_API_KEY): indici USA, VIX e petrolio/gas, senza limiti stretti
 *  - Twelve Data (TWELVEDATA_API_KEY): azioni ed ETF USA e metalli preziosi. Il piano gratuito concede 800 crediti al giorno
 *    e 8 al minuto: gli strumenti vengono aggiornati a rotazione (i meno recenti per primi), con un tetto giornaliero.
 */

/** Strumento non aggiornato in questa esecuzione (rotazione): si tiene l'ultimo valore valido, senza segnalare errore. */
export class NotScheduled extends Error {
  constructor() { super('non in programma in questa esecuzione'); }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ---------------- FRED ---------------- */
const FRED_ID: Record<string, string> = {
  sp500: 'SP500', dowjones: 'DJIA', nasdaq: 'NASDAQCOM', nasdaq100: 'NASDAQ100', vix: 'VIXCLS',
  wti: 'DCOILWTICO', brent: 'DCOILBRENTEU', natgas: 'DHHNGSP',
};
const fredCache = new Map<string, { at: number; s: Series }>();

export const fredCovers = (def: InstrumentDef) => !!process.env.FRED_API_KEY && !!FRED_ID[def.id];

export async function fredSeries(def: InstrumentDef): Promise<Series> {
  const key = process.env.FRED_API_KEY;
  const id = FRED_ID[def.id];
  if (!key || !id) throw new Error('FRED non configurata o serie non prevista');
  const hit = fredCache.get(id);
  if (hit && Date.now() - hit.at < 30 * 60e3) return hit.s;
  const start = new Date(Date.now() - 400 * 86400e3).toISOString().slice(0, 10);
  const r = await fetchJson<{ observations?: { date: string; value: string }[]; error_message?: string }>(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${encodeURIComponent(key)}&file_type=json&observation_start=${start}`,
    { sourceId: 'fred', timeoutMs: 20000, retries: 1 },
  );
  if (!r.observations) throw new Error('FRED: ' + (r.error_message ?? 'risposta non valida').slice(0, 120));
  const points = r.observations.filter((o) => o.value !== '.').map((o) => [Date.parse(o.date + 'T21:00:00Z'), Number(o.value)] as Bar).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!points.length) throw new Error('FRED: serie vuota');
  const s: Series = { points, source: 'FRED (chiusura giornaliera)' };
  fredCache.set(id, { at: Date.now(), s });
  return s;
}

/* ---------------- Twelve Data ---------------- */
const TD_SYMBOL: Record<string, string> = { gold: 'XAU/USD', silver: 'XAG/USD', platinum: 'XPT/USD', palladium: 'XPD/USD', brk: 'BRK.B' };

/** Simbolo Twelve Data, se lo strumento è coperto dal piano gratuito (titoli ed ETF USA, metalli preziosi); altrimenti null. */
export function tdSymbol(def: InstrumentDef): string | null {
  if (TD_SYMBOL[def.id]) return TD_SYMBOL[def.id];
  if ((def.cls === 'equity' || def.cls === 'etf' || def.cls === 'reit') && def.y && /^[A-Z]{1,5}$/.test(def.y)) return def.y;
  return null;
}
export const tdCovers = (def: InstrumentDef) => !!process.env.TWELVEDATA_API_KEY && !!tdSymbol(def);

type TdState = { last: Record<string, number>; bad: Record<string, number>; day: string; used: number };
const tdState = (): TdState => getCache<TdState>('td:state').value ?? { last: {}, bad: {}, day: '', used: 0 };
const today = () => new Date().toISOString().slice(0, 10);
let plan = new Set<string>();
let lastCall = 0;

/** Sceglie gli strumenti da aggiornare in questa esecuzione: i meno recenti, nel rispetto del tetto per esecuzione e giornaliero. */
export function planTwelveData(defs: InstrumentDef[]) {
  plan = new Set();
  if (!process.env.TWELVEDATA_API_KEY) return;
  const st = tdState();
  if (st.day !== today()) { st.day = today(); st.used = 0; }
  const perRun = Number(process.env.TWELVEDATA_PER_RUN || 12);
  const left = Math.max(0, Number(process.env.TWELVEDATA_DAILY_MAX || 700) - st.used);
  const n = Math.min(perRun, left);
  const now = Date.now();
  const cands = defs
    .filter((d) => tdSymbol(d) && !(st.bad[d.id] && now - st.bad[d.id] < 7 * 86400e3))
    .sort((a, b) => (st.last[a.id] ?? 0) - (st.last[b.id] ?? 0));
  for (const d of cands) {
    if (plan.size >= n) break;
    if (now - (st.last[d.id] ?? 0) < 20 * 60e3) continue; // niente ripetizioni troppo ravvicinate (modalità server)
    plan.add(d.id);
  }
  setCache('td:state', st, 'Twelve Data');
}

export async function tdSeries(def: InstrumentDef): Promise<Series> {
  const key = process.env.TWELVEDATA_API_KEY;
  const sym = tdSymbol(def);
  if (!key || !sym) throw new Error('Twelve Data non configurata o strumento non coperto');
  if (!plan.has(def.id)) throw new NotScheduled();
  const st = tdState();
  if (st.day !== today()) { st.day = today(); st.used = 0; }
  st.used++; // il credito si conta prima della richiesta, così un errore non lo fa dimenticare
  st.last[def.id] = Date.now();
  setCache('td:state', st, 'Twelve Data');
  const wait = lastCall + 7500 - Date.now(); // limite gratuito: 8 richieste al minuto
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const r = await fetchJson<{ status?: string; code?: number; message?: string; values?: { datetime: string; close: string }[] }>(
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(sym)}&interval=1day&outputsize=260&apikey=${encodeURIComponent(key)}`,
    { sourceId: 'twelvedata', timeoutMs: 20000, retries: 0 },
  );
  if (r.status === 'error' || !Array.isArray(r.values)) {
    if (r.code === 429) { plan = new Set(); throw new Error('Twelve Data: limite di richieste raggiunto'); }
    if (r.code === 400 || r.code === 403 || r.code === 404) {
      const s2 = tdState();
      s2.bad[def.id] = Date.now(); // non coperto dal piano gratuito: non si riprova per 7 giorni
      setCache('td:state', s2, 'Twelve Data');
    }
    throw new Error(`Twelve Data: ${String(r.message ?? 'risposta non valida').slice(0, 120)} (${sym})`);
  }
  const points = r.values
    .map((v) => [Date.parse(v.datetime.slice(0, 10) + 'T21:00:00Z'), Number(v.close)] as Bar)
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[1] > 0)
    .sort((a, b) => a[0] - b[0]);
  if (!points.length) throw new Error(`Twelve Data: serie vuota (${sym})`);
  return { points, source: 'Twelve Data (chiusura giornaliera)' };
}
