'use client';
import { useState } from 'react';
import { addWatch } from '@/lib/local';
import { searchInstruments } from '@/lib/instruments/search';

type R = { id: string; name: string; sub: string };
export default function AddInstrument() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<R[]>([]);
  const [type, setType] = useState<'instrument' | 'topic' | 'company'>('instrument');
  const [msg, setMsg] = useState<string | null>(null);
  const add = async (r: R) => {
    if (!r.id) return;
    const err = await addWatch({ type, id: r.id, label: r.name });
    setMsg(err ?? `Aggiunto: ${r.name}`);
    setRes([]); setQ('');
  };
  const search = () => {
    if (type !== 'instrument') return add({ id: q.trim().toLowerCase(), name: q.trim(), sub: '' });
    const r = searchInstruments(q, 12).map((i) => ({ id: i.id, name: i.name, sub: `${i.clsLabel} · ${i.group}` }));
    setRes(r);
    if (!r.length) setMsg('Nessuno strumento trovato nel catalogo. Puoi seguirlo come argomento: le notizie che lo citano compariranno nella watchlist.');
  };
  return (
    <div className="p-4">
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); setMsg(null); if (q.trim()) search(); }}>
        <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          <option value="instrument">Strumento quotato</option><option value="company">Società / emittente (nome)</option><option value="topic">Argomento / parola chiave</option>
        </select>
        <input className="input min-w-0 flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder={type === 'instrument' ? 'Nome o simbolo (es. Eni, S&P 500, EUR/USD, oro, BTP)' : 'Testo da seguire nelle notizie'} maxLength={80} />
        <button className="btn btn-primary">{type === 'instrument' ? 'Cerca' : 'Aggiungi'}</button>
      </form>
      {res.length > 0 && <ul className="mt-2 divide-y divide-line rounded border border-line">{res.map((c) => <li key={c.id}><button onClick={() => add(c)} className="w-full px-3 py-2 text-left text-sm hover:bg-panel2">{c.name} <span className="text-mute">{c.sub}</span> <span className="float-right text-accent">+ aggiungi</span></button></li>)}</ul>}
      {msg && <p className="mt-2 text-xs text-up">{msg}</p>}
    </div>
  );
}
