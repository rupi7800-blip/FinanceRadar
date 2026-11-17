import 'server-only';
import { setCache, setCacheError } from '../db';
import { fetchJson, fetchText } from '../http';

/**
 * Dati macroeconomici e di politica monetaria da fonti ufficiali gratuite:
 *  - BCE (ECB Data Portal, senza chiave): tassi ufficiali, €STR, Euribor, inflazione HICP, curva dei rendimenti dell'area euro, cambi di riferimento
 *  - Tesoro USA (home.treasury.gov, senza chiave): curva ufficiale dei rendimenti Treasury
 *  - Banca Mondiale (senza chiave): crescita del PIL, inflazione e disoccupazione per Paese (annuali)
 *  - FRED / Federal Reserve di St. Louis (chiave gratuita, facoltativa): tassi Fed, inflazione e lavoro USA, spread creditizi
 */

const ECB = 'https://data-api.ecb.europa.eu/service/data';

type Obs = { key: string; period: string; value: number };

function parseCsv(csv: string): Obs[] {
  const lines = csv.trim().split(/\r?\n/);
  const split = (l: string) => {
    const out: string[] = [];
    let cur = '', q = false;
    for (const ch of l) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const head = split(lines[0] ?? '');
  const iK = head.indexOf('KEY'), iT = head.indexOf('TIME_PERIOD'), iV = head.indexOf('OBS_VALUE');
  if (iT < 0 || iV < 0) throw new Error('BCE: formato CSV inatteso');
  return lines.slice(1).map(split).map((c) => ({ key: c[iK] ?? '', period: c[iT], value: Number(c[iV]) })).filter((o) => o.period && Number.isFinite(o.value));
}

async function ecb(flow: string, key: string, last = 1, extra = '') {
  const csv = await fetchText(`${ECB}/${flow}/${key}?lastNObservations=${last}&format=csvdata${extra}`, { sourceId: 'ecb-data', timeoutMs: 25000, retries: 1 });
  return parseCsv(csv);
}

const lastOf = (obs: Obs[], keyPart: string) => obs.filter((o) => o.key.includes(keyPart)).sort((a, b) => a.period.localeCompare(b.period));

export type MacroItem = { id: string; label: string; value: number | null; prev: number | null; period: string | null; unit: string; note?: string; source: string };

export async function refreshEcb() {
  const items: MacroItem[] = [];
  const errors: string[] = [];
  const add = (id: string, label: string, obs: Obs[], unit: string, note?: string) => {
    const s = obs.sort((a, b) => a.period.localeCompare(b.period));
    const l = s[s.length - 1], p = s[s.length - 2];
    items.push({ id, label, value: l?.value ?? null, prev: p?.value ?? null, period: l?.period ?? null, unit, note, source: 'BCE' });
  };
  const tryAdd = async (id: string, label: string, flow: string, key: string, unit: string, last = 2, note?: string) => {
    try { add(id, label, await ecb(flow, key, last), unit, note); } catch (e) { errors.push(`${id}: ${(e as Error).message}`); }
  };
  await tryAdd('dfr', 'Tasso sui depositi BCE', 'FM', 'B.U2.EUR.4F.KR.DFR.LEV', '%', 2, 'Tasso di riferimento effettivo della politica monetaria BCE');
  await tryAdd('mro', 'Tasso operazioni di rifinanziamento principali', 'FM', 'B.U2.EUR.4F.KR.MRR_FR.LEV', '%');
  await tryAdd('mlf', 'Tasso operazioni di rifinanziamento marginale', 'FM', 'B.U2.EUR.4F.KR.MLFR.LEV', '%');
  await tryAdd('estr', '€STR (tasso overnight dell\'area euro)', 'EST', 'B.EU000A2X2A25.WT', '%');
  await tryAdd('euribor3m', 'Euribor 3 mesi (media mensile)', 'FM', 'M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA', '%', 2, 'Parametro di molti mutui a tasso variabile');
  await tryAdd('euribor6m', 'Euribor 6 mesi (media mensile)', 'FM', 'M.U2.EUR.RT.MM.EURIBOR6MD_.HSTA', '%');
  await tryAdd('euribor1y', 'Euribor 12 mesi (media mensile)', 'FM', 'M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA', '%');
  await tryAdd('hicp_ea', 'Inflazione area euro (HICP, annua)', 'ICP', 'M.U2.N.000000.4.ANR', '%', 13);
  await tryAdd('hicp_core', 'Inflazione di fondo area euro (escl. energia e alimentari)', 'ICP', 'M.U2.N.XEF000.4.ANR', '%', 2);
  await tryAdd('hicp_it', 'Inflazione Italia (HICP, annua)', 'ICP', 'M.IT.N.000000.4.ANR', '%', 13);
  await tryAdd('hicp_de', 'Inflazione Germania (HICP, annua)', 'ICP', 'M.DE.N.000000.4.ANR', '%', 2);
  await tryAdd('hicp_fr', 'Inflazione Francia (HICP, annua)', 'ICP', 'M.FR.N.000000.4.ANR', '%', 2);
  await tryAdd('hicp_es', 'Inflazione Spagna (HICP, annua)', 'ICP', 'M.ES.N.000000.4.ANR', '%', 2);
  if (!items.some((i) => i.value != null)) {
    setCacheError('macro:ecb', errors.join(' | '));
    throw new Error(errors.slice(0, 3).join(' | '));
  }
  setCache('macro:ecb', { items, errors }, 'BCE — ECB Data Portal');

  // curva dei rendimenti dei titoli di Stato dell'area euro con rating AAA (stima BCE, Svensson)
  try {
    const tenors = ['3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '15Y', '20Y', '30Y'];
    const obs = await ecb('YC', `B.U2.EUR.4F.G_N_A.SV_C_YM.${tenors.map((t) => 'SR_' + t).join('+')}`, 1);
    const pts = tenors.map((t) => ({ tenor: t, value: lastOf(obs, `SR_${t}`).pop()?.value ?? null, period: lastOf(obs, `SR_${t}`).pop()?.period ?? null }));
    setCache('macro:eucurve', { points: pts, date: pts.find((p) => p.period)?.period ?? null }, 'BCE — curva AAA area euro');
  } catch (e) {
    setCacheError('macro:eucurve', (e as Error).message);
  }

  // cambi di riferimento BCE (tutte le valute contro euro), ultime due rilevazioni
  try {
    const obs = await ecb('EXR', 'D..EUR.SP00.A', 2);
    const by = new Map<string, Obs[]>();
    for (const o of obs) { const ccy = o.key.split('.')[2]; if (!by.has(ccy)) by.set(ccy, []); by.get(ccy)!.push(o); }
    const rates = [...by.entries()].map(([ccy, l]) => { l.sort((a, b) => a.period.localeCompare(b.period)); const last = l[l.length - 1], prev = l[l.length - 2]; return { ccy, value: last.value, prev: prev?.value ?? null, date: last.period }; }).sort((a, b) => a.ccy.localeCompare(b.ccy));
    setCache('macro:ecbfx', rates, 'BCE — cambi di riferimento');
  } catch (e) {
    setCacheError('macro:ecbfx', (e as Error).message);
  }
  return items.length;
}

/** Curva ufficiale dei rendimenti Treasury (Dipartimento del Tesoro USA). */
export async function refreshTreasuryCurve() {
  const y = new Date().getUTCFullYear();
  const get = (year: number) => fetchText(`https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`, { sourceId: 'ustreasury', timeoutMs: 25000 });
  let csv = await get(y);
  if (csv.trim().split(/\r?\n/).length < 2) csv = await get(y - 1); // primi giorni di gennaio
  const lines = csv.trim().split(/\r?\n/);
  const head = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
  const rows = lines.slice(1).map((l) => l.split(',').map((c) => c.replace(/"/g, '').trim()));
  if (!rows.length) throw new Error('Tesoro USA: nessun dato');
  const toPoints = (r: string[]) => head.slice(1).map((h, i) => ({ tenor: h.replace(' Mo', 'M').replace(' Month', 'M').replace(' Yr', 'Y').replace(/\s+/g, ''), value: r[i + 1] === '' ? null : Number(r[i + 1]) })).filter((p) => p.value != null && Number.isFinite(p.value));
  const latest = rows[0], monthAgo = rows[Math.min(rows.length - 1, 21)];
  setCache('macro:uscurve', { date: latest[0], points: toPoints(latest), compareDate: monthAgo[0], compare: toPoints(monthAgo) }, 'U.S. Department of the Treasury');
  return 1;
}

/** Indicatori annuali per Paese (Banca Mondiale). */
export async function refreshWorldBank() {
  const countries = 'US;CN;JP;DE;IN;GB;FR;IT;BR;CA;ES;KR';
  const ind: [string, string][] = [['NY.GDP.MKTP.KD.ZG', 'gdp'], ['FP.CPI.TOTL.ZG', 'cpi'], ['SL.UEM.TOTL.ZS', 'unemp'], ['GC.DOD.TOTL.GD.ZS', 'debt']];
  const table: Record<string, { name: string; gdp?: [number, string]; cpi?: [number, string]; unemp?: [number, string]; debt?: [number, string] }> = {};
  for (const [code, k] of ind) {
    const r = await fetchJson<[unknown, { country: { id: string; value: string }; countryiso3code: string; date: string; value: number | null }[] | null]>(
      `https://api.worldbank.org/v2/country/${countries}/indicator/${code}?format=json&mrv=1&per_page=100`, { sourceId: 'worldbank', timeoutMs: 25000 },
    );
    for (const o of r[1] ?? []) {
      if (o.value == null) continue;
      const id = o.country.id;
      table[id] ??= { name: o.country.value };
      (table[id] as Record<string, unknown>)[k] = [o.value, o.date];
    }
  }
  if (!Object.keys(table).length) throw new Error('Banca Mondiale: nessun dato');
  setCache('macro:worldbank', table, 'Banca Mondiale (World Development Indicators)');
  return Object.keys(table).length;
}

/** FRED (chiave gratuita): dati USA ufficiali. */
export async function refreshFred() {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    setCacheError('macro:fred', 'FRED_API_KEY non configurata');
    return 0;
  }
  const series: [string, string, string, 'level' | 'yoy'][] = [
    ['FEDFUNDS', 'Tasso Fed Funds effettivo', '%', 'level'],
    ['CPIAUCSL', 'Inflazione USA (CPI, annua)', '%', 'yoy'],
    ['CPILFESL', 'Inflazione di fondo USA (core CPI, annua)', '%', 'yoy'],
    ['PCEPILFE', 'Inflazione core PCE (obiettivo Fed), annua', '%', 'yoy'],
    ['UNRATE', 'Tasso di disoccupazione USA', '%', 'level'],
    ['PAYEMS', 'Occupati non agricoli USA (migliaia)', 'k', 'level'],
    ['A191RL1Q225SBAR', 'PIL USA reale (trimestrale annualizzato)', '%', 'level'],
    ['T10Y2Y', 'Differenziale Treasury 10 anni − 2 anni', 'pp', 'level'],
    ['BAMLH0A0HYM2', 'Spread obbligazioni high yield USA', 'pp', 'level'],
    ['MORTGAGE30US', 'Mutuo USA 30 anni (tasso medio)', '%', 'level'],
    ['DTWEXBGS', 'Indice del dollaro (ampio, Fed)', 'indice', 'level'],
    ['M2SL', 'Massa monetaria M2 USA (variazione annua)', '%', 'yoy'],
  ];
  const out: MacroItem[] = [];
  for (const [id, label, unit, mode] of series) {
    try {
      const r = await fetchJson<{ observations: { date: string; value: string }[] }>(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${encodeURIComponent(key)}&file_type=json&sort_order=desc&limit=14`, { sourceId: 'fred' },
      );
      const obs = r.observations.filter((o) => o.value !== '.').map((o) => ({ date: o.date, v: Number(o.value) }));
      if (!obs.length) continue;
      if (mode === 'yoy') {
        const yoy = (i: number) => (obs[i] && obs[i + 12] ? (obs[i].v / obs[i + 12].v - 1) * 100 : null);
        out.push({ id, label, unit, value: yoy(0), prev: yoy(1), period: obs[0].date, source: 'FRED' });
      } else out.push({ id, label, unit, value: obs[0].v, prev: obs[1]?.v ?? null, period: obs[0].date, source: 'FRED' });
    } catch { /* serie singola non disponibile: le altre proseguono */ }
  }
  if (!out.length) throw new Error('FRED: nessuna serie disponibile');
  setCache('macro:fred', out, 'FRED (Federal Reserve Bank of St. Louis)');
  return out.length;
}
