import 'server-only';
import { setCache, setCacheError, getCache } from '../db';
import { fetchJson } from '../http';
import { INSTRUMENTS, type InstrumentDef } from '../instruments/catalog';
import { fetchQuote, fetchLongSeries } from './providers';
import type { Quote, Series, CryptoCoin, CryptoGlobal } from './types';
import { markSuccess, markFailure, getSource } from '../sources/registry';

function mark(id: string, ok: boolean, err?: string) {
  if (!getSource(id)) return;
  if (ok) markSuccess(id, 0);
  else markFailure(id, err ?? 'errore');
}

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k]);
    }
  }));
  return out;
}

/**
 * Aggiorna le quotazioni di tutto il catalogo. Per ogni strumento: Yahoo → Stooq.
 * Se entrambe falliscono resta l'ultima quotazione valida, marcata con l'errore (mai valori inventati).
 */
export async function refreshQuotes(filter: (d: InstrumentDef) => boolean = () => true) {
  const prev = new Map((getCache<Quote[]>('market:quotes').value ?? []).map((q) => [q.id, q]));
  const defs = INSTRUMENTS.filter(filter);
  let ok = 0, yahooOk = 0, stooqOk = 0;
  const errors: string[] = [];
  const results = await pool(defs, 4, async (def) => {
    try {
      const { quote, points } = await fetchQuote(def);
      setCache(`series:${def.id}`, { points, source: quote.source } satisfies Series, quote.source);
      ok++;
      if (quote.source === 'Yahoo Finance') yahooOk++; else stooqOk++;
      return quote;
    } catch (e) {
      const msg = (e as Error).message;
      errors.push(`${def.id}: ${msg}`);
      const old = prev.get(def.id);
      return old ? { ...old, error: msg } : null;
    }
  });
  const merged = new Map(prev);
  for (const q of results) if (q) merged.set(q.id, q);
  const order = new Map(INSTRUMENTS.map((d, i) => [d.id, i]));
  const list = [...merged.values()].filter((q) => order.has(q.id)).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  if (yahooOk) mark('yahoo', true); else if (defs.some((d) => d.y)) mark('yahoo', false, errors.find((e) => /yahoo/i.test(e)) ?? 'nessuna risposta');
  if (stooqOk) mark('stooq', true);
  if (!ok) {
    setCacheError('market:quotes', errors.slice(0, 5).join(' | '));
    throw new Error(`Nessuna quotazione aggiornata: ${errors.slice(0, 3).join(' | ')}`);
  }
  setCache('market:quotes', list, stooqOk && yahooOk ? 'Yahoo Finance + Stooq' : yahooOk ? 'Yahoo Finance' : 'Stooq');
  if (errors.length) setCache('market:quote_errors', errors.slice(0, 80), 'sistema');
  else setCache('market:quote_errors', [], 'sistema');
  return ok;
}

/** Serie a 5 anni (settimanali) per le schede strumento: lente, aggiornate due volte al giorno. */
export async function refreshLongSeries() {
  let ok = 0;
  await pool(INSTRUMENTS, 3, async (def) => {
    try {
      const s = await fetchLongSeries(def);
      setCache(`series5y:${def.id}`, s, s.source);
      ok++;
    } catch (e) {
      setCacheError(`series5y:${def.id}`, (e as Error).message);
    }
  });
  if (!ok) throw new Error('Nessuna serie storica a 5 anni disponibile');
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
