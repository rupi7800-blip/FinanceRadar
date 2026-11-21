import 'server-only';
import { setCache, setCacheError, getCache } from '../db';
import { fetchJson } from '../http';
import { INSTRUMENTS, type InstrumentDef } from '../instruments/catalog';
import { fetchQuote, fetchLongSeries, resetYahoo, yahooState, YAHOO_TRIP } from './providers';
import type { Quote, Series, CryptoCoin, CryptoGlobal } from './types';
import { markSuccess, markFailure, getSource } from '../sources/registry';

function mark(id: string, ok: boolean, err?: string) {
  if (!getSource(id)) return;
  if (ok) markSuccess(id, 0);
  else markFailure(id, err ?? 'errore');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PAUSE_MS = 800; // pausa tra due richieste: Yahoo limita le raffiche

/**
 * Aggiorna le quotazioni di tutto il catalogo, una alla volta (Yahoo blocca le raffiche).
 * Per ogni strumento si usa la fonte della sua classe (vedi chainFor in providers.ts).
 * Se tutte falliscono resta l'ultima quotazione valida, marcata con l'errore: mai valori inventati.
 */
export async function refreshQuotes(filter: (d: InstrumentDef) => boolean = () => true) {
  resetYahoo();
  const prev = new Map((getCache<Quote[]>('market:quotes').value ?? []).map((q) => [q.id, q]));
  const defs = INSTRUMENTS.filter(filter);
  const byId = new Map<string, Quote>();
  const errors: string[] = [];
  const okBy: Record<string, number> = {};
  for (const def of defs) {
    try {
      const { quote, points } = await fetchQuote(def);
      setCache(`series:${def.id}`, { points, source: quote.source } satisfies Series, quote.source);
      byId.set(def.id, quote);
      okBy[quote.source] = (okBy[quote.source] ?? 0) + 1;
    } catch (e) {
      const msg = (e as Error).message;
      errors.push(`${def.id}: ${msg}`);
      const old = prev.get(def.id);
      if (old) byId.set(def.id, { ...old, error: msg });
    }
    if (yahooState.consec429 < YAHOO_TRIP) await sleep(PAUSE_MS);
  }
  const ok = Object.values(okBy).reduce((x, y) => x + y, 0);
  mark('yahoo', (okBy['Yahoo Finance'] ?? 0) > 0, errors.find((e) => /yahoo/i.test(e)));
  mark('ecb-data', (okBy['BCE (cambi di riferimento)'] ?? 0) > 0);
  mark('coinpaprika', (okBy['CoinPaprika'] ?? 0) > 0);
  mark('ustreasury', (okBy['Tesoro USA'] ?? 0) > 0);
  const order = new Map(INSTRUMENTS.map((d, i) => [d.id, i]));
  const list = [...byId.values()].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  // quotazioni non più presenti nel catalogo vengono scartate; quelle non richieste in questa esecuzione restano
  const kept = [...prev.values()].filter((q) => !byId.has(q.id) && order.has(q.id));
  const all = [...kept, ...list].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  setCache('market:quote_errors', errors.slice(0, 120), 'sistema');
  if (!ok) {
    setCacheError('market:quotes', errors.slice(0, 5).join(' | '));
    throw new Error(`Nessuna quotazione aggiornata: ${errors.slice(0, 3).join(' | ')}`);
  }
  const sources = Object.keys(okBy).join(' + ');
  setCache('market:quotes', all, sources);
  return ok;
}

/** Serie a 5 anni (settimanali, solo Yahoo) per le schede strumento. Ha un tempo massimo, così non blocca la pubblicazione. */
export async function refreshLongSeries(maxMs = 6 * 60e3) {
  resetYahoo();
  const t0 = Date.now();
  let ok = 0;
  for (const def of INSTRUMENTS) {
    if (Date.now() - t0 > maxMs || yahooState.consec429 >= YAHOO_TRIP) break;
    try {
      const s = await fetchLongSeries(def);
      setCache(`series5y:${def.id}`, s, s.source);
      ok++;
    } catch (e) {
      setCacheError(`series5y:${def.id}`, (e as Error).message);
    }
    await sleep(PAUSE_MS);
  }
  if (!ok) throw new Error('Nessuna serie storica a 5 anni disponibile (Yahoo limita le richieste o non risponde)');
  return ok;
}

/* ---------------- Criptovalute: CoinPaprika (gratuito, senza chiave) ---------------- */
type CpTicker = {
  id: string; name: string; symbol: string; rank: number; circulating_supply: number; max_supply: number;
  quotes: { USD: { price: number; volume_24h: number; market_cap: number; percent_change_1h: number; percent_change_24h: number; percent_change_7d: number; ath_price: number | null; ath_date: string | null } };
};

export async function refreshCrypto() {
  try {
    const data = await fetchJson<CpTicker[]>('https://api.coinpaprika.com/v1/tickers?quotes=USD', { sourceId: 'coinpaprika', timeoutMs: 30000 });
    const coins: CryptoCoin[] = data.filter((t) => t.rank > 0).sort((a, b) => a.rank - b.rank).slice(0, 100).map((t) => {
      const q = t.quotes.USD;
      return { id: t.id, symbol: t.symbol, name: t.name, rank: t.rank, price: q.price, marketCap: q.market_cap || null, volume24h: q.volume_24h, ch1h: q.percent_change_1h, ch24h: q.percent_change_24h, ch7d: q.percent_change_7d, circulating: t.circulating_supply || null, maxSupply: t.max_supply || null, ath: q.ath_price, athDate: q.ath_date };
    });
    setCache('crypto:top', coins, 'CoinPaprika');
    const g = await fetchJson<any>('https://api.coinpaprika.com/v1/global', { sourceId: 'coinpaprika' });
    setCache('crypto:global', { totalMarketCap: g.market_cap_usd ?? null, totalVolume: g.volume_24h_usd ?? null, btcDominance: g.bitcoin_dominance_percentage ?? null, marketCapChange24h: g.market_cap_change_24h ?? null, activeCryptos: g.cryptocurrencies_number ?? null } satisfies CryptoGlobal, 'CoinPaprika');
    mark('coinpaprika', true);
    return coins.length;
  } catch (e) {
    setCacheError('crypto:top', (e as Error).message);
    mark('coinpaprika', false, (e as Error).message);
    throw e;
  }
}

export async function refreshFearGreed() {
  try {
    const r = await fetchJson<{ data: { value: string; value_classification: string; timestamp: string }[] }>('https://api.alternative.me/fng/?limit=30', { sourceId: 'feargreed' });
    setCache('crypto:feargreed', r.data.map((d) => ({ value: Number(d.value), label: d.value_classification, at: new Date(Number(d.timestamp) * 1000).toISOString() })), 'Alternative.me');
    return r.data.length;
  } catch (e) {
    setCacheError('crypto:feargreed', (e as Error).message);
    throw e;
  }
}
