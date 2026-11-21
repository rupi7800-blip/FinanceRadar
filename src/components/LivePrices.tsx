'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { STATIC, dataUrl } from '@/lib/mode';
import { fmtPrice, fmtChange } from '@/lib/format';

type Q = { id: string; name: string; symbol: string; cls: string; ccy: string; price: number | null; ch1d: number | null; source: string; marketTime: string | null };

/** Simboli Binance (coppie USDT) per le criptovalute del catalogo: solo per queste esiste un flusso realmente in tempo reale gratuito. */
const BINANCE: Record<string, string> = { btc: 'BTCUSDT', eth: 'ETHUSDT', sol: 'SOLUSDT', xrp: 'XRPUSDT', bnb: 'BNBUSDT', ada: 'ADAUSDT', doge: 'DOGEUSDT' };

/**
 * Riquadri dei prezzi principali. Dato base: aggiornamento periodico dal server (Yahoo Finance e fonti alternative, borse ritardate).
 * Per le criptovalute, se il browser raggiunge il WebSocket pubblico di Binance, i prezzi diventano in tempo reale.
 */
export default function LivePrices({ initial, fetchedAt, source }: { initial: Q[]; fetchedAt: string | null; source: string | null }) {
  const [qs, setQs] = useState(initial);
  const [live, setLive] = useState<Record<string, { p: number; c: number }>>({});
  const [wsOk, setWsOk] = useState(false);
  const [meta, setMeta] = useState({ fetchedAt, source });
  const flash = useRef<Record<string, number>>({});

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch(STATIC ? dataUrl('market.json') : `/api/market?ids=${initial.map((q) => q.id).join(',')}`, { cache: 'no-store' });
        const j = await r.json();
        if (j.quotes?.length) { setQs(initial.map((q) => j.quotes.find((x: Q) => x.id === q.id) ?? q)); setMeta({ fetchedAt: j.fetchedAt, source: j.source }); }
      } catch { /* */ }
    }, STATIC ? 300_000 : 60_000);
    return () => clearInterval(t);
  }, [initial]);

  useEffect(() => {
    const syms = initial.map((q) => BINANCE[q.id]).filter(Boolean).map((s) => s.toLowerCase());
    if (!syms.length) return;
    let ws: WebSocket | null = null;
    let closed = false;
    try {
      ws = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${syms.map((s) => `${s}@miniTicker`).join('/')}`);
      ws.onopen = () => setWsOk(true);
      ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data)?.data;
        if (!m?.s) return;
        const id = Object.entries(BINANCE).find(([, v]) => v === m.s)?.[0];
        if (!id) return;
        const p = Number(m.c), o = Number(m.o);
        flash.current[id] = Date.now();
        setLive((l) => ({ ...l, [id]: { p, c: o ? ((p - o) / o) * 100 : 0 } }));
      };
      ws.onerror = () => setWsOk(false);
      ws.onclose = () => { if (!closed) setWsOk(false); };
    } catch { setWsOk(false); }
    return () => { closed = true; ws?.close(); };
  }, [initial]);

  // calcolato solo nel browser: il valore del server (o della build statica) sarebbe diverso e romperebbe l'idratazione
  const [ago, setAgo] = useState<number | null>(null);
  useEffect(() => {
    const f = () => setAgo(meta.fetchedAt ? Math.round((Date.now() - Date.parse(meta.fetchedAt)) / 60000) : null);
    f();
    const t = setInterval(f, 30_000);
    return () => clearInterval(t);
  }, [meta.fetchedAt]);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3 text-[11px] text-mute">
        <span className="chip border-line">Periodico · {meta.source ?? 'n.d.'} · {ago != null ? `${ago} min fa` : 'in attesa'} · borse con ritardo di ~15–20 min</span>
        {wsOk && <span className="chip border-up/40 text-up"><span className="pulse-dot">●</span> Cripto LIVE · Binance (USDT, variazione 24h mobile)</span>}
      </div>
      <div className="grid grid-cols-2 gap-px bg-line p-px sm:grid-cols-3 lg:grid-cols-6">
        {qs.map((q) => {
          const l = live[q.id];
          const price = l?.p ?? q.price;
          const ch = l?.c ?? q.ch1d;
          const recent = l && Date.now() - (flash.current[q.id] ?? 0) < 1200;
          return (
            <Link key={q.id} href={`/strumento/${q.id}`} className="bg-panel px-3 py-2.5 hover:bg-panel2">
              <div className="flex items-center gap-1.5 text-xs text-mute">
                <span className="truncate font-semibold text-ink">{q.name}</span>
                {l && <span className="ml-auto text-[9px] text-up" title="prezzo in tempo reale">●</span>}
              </div>
              <div className={`mt-0.5 text-base font-semibold tabular-nums transition-colors ${recent ? 'text-white' : ''}`}>{fmtPrice(price, q)}</div>
              <div className={`text-xs tabular-nums ${ch == null ? 'text-mute' : ch >= 0 ? 'up' : 'down'}`}>{fmtChange(ch, q)} <span className="text-mute">{l ? '24h' : 'oggi'}</span></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
