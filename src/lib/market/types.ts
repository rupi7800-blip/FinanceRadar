import type { AssetClass } from '../instruments/catalog';

/** Quotazione normalizzata di uno strumento (qualsiasi classe). Mai valori inventati: ciò che la fonte non fornisce resta null. */
export type Quote = {
  id: string;
  symbol: string;
  name: string;
  cls: AssetClass;
  group: string;
  region: string;
  ccy: string;
  price: number | null;
  prevClose: number | null;
  ch1d: number | null; // % rispetto alla chiusura precedente (per i rendimenti: differenza in punti base)
  ch1w: number | null;
  ch1m: number | null;
  chYtd: number | null;
  ch1y: number | null;
  high52: number | null;
  low52: number | null;
  volume: number | null;
  exchange: string | null;
  marketTime: string | null; // orario dell'ultimo prezzo secondo la fonte
  sparkline: number[] | null; // ultimi ~3 mesi, campionati
  source: string;
  delayed: boolean;
  error?: string | null;
};

/** Serie storica giornaliera: [timestamp ms, chiusura]. */
export type Series = { points: [number, number][]; source: string };

export type CryptoCoin = {
  id: string; symbol: string; name: string; rank: number | null; price: number | null; marketCap: number | null; volume24h: number | null;
  ch1h: number | null; ch24h: number | null; ch7d: number | null; circulating: number | null; maxSupply: number | null; ath: number | null; athDate: string | null;
};
export type CryptoGlobal = { totalMarketCap: number | null; totalVolume: number | null; btcDominance: number | null; marketCapChange24h: number | null; activeCryptos: number | null };
