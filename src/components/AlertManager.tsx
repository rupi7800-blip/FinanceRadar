'use client';
import { useEffect, useState } from 'react';
import { STATIC, withBase } from '@/lib/mode';
import { getRules, setRules, evaluateClient } from '@/lib/clientAlerts';
import { groupsOf } from '@/lib/instruments/catalog';
import { SECTIONS } from '@/lib/sections';

type T = Record<string, { label: string; needsTarget: boolean; needsThreshold: boolean; hint: string }>;
type Rule = { id: number; type: string; target: string | null; threshold: number | null; cooldown_min: number; push: number; enabled: number; last_fired: string | null };

function b64ToUint8(b: string) {
  const pad = '='.repeat((4 - (b.length % 4)) % 4);
  const raw = atob((b + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function AlertManager({ types }: { types: T }) {
  const [rules, setRulesState] = useState<Rule[]>([]);
  const [type, setType] = useState('breaking');
  const [target, setTarget] = useState('');
  const [threshold, setThreshold] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const [push, setPush] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [pushState, setPushState] = useState<'unsupported' | 'off' | 'on' | 'denied' | 'loading'>('loading');

  const load = async () => (STATIC ? setRulesState(getRules()) : setRulesState((await (await fetch('/api/alerts', { cache: 'no-store' })).json()).rules ?? []));
  useEffect(() => {
    load();
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setPushState('unsupported');
      if (Notification.permission === 'denied') return setPushState('denied');
      if (STATIC) return setPushState(Notification.permission === 'granted' ? 'on' : 'off');
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setPushState(sub ? 'on' : 'off');
    })();
  }, []);

  const enablePush = async () => {
    try {
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register(withBase('/sw.js'), { scope: withBase('/') }));
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return setPushState('denied');
      if (STATIC) return setPushState('on');
      const { publicKey } = await (await fetch('/api/push/key')).json();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(publicKey) });
      const r = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
      setPushState(r.ok ? 'on' : 'off');
    } catch (e) { setMsg('Attivazione push non riuscita: ' + (e as Error).message); }
  };
  const disablePush = async () => {
    if (STATIC) { setMsg('Per disattivarle revoca il permesso notifiche dalle impostazioni del sito nel browser.'); return; }
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
    setPushState('off');
  };

  const t = types[type];
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (STATIC) {
      if (t.needsTarget && !target.trim()) return setMsg('Indica l\'elemento da monitorare');
      const th = Number(threshold.replace(',', '.'));
      if (t.needsThreshold && !(th > 0)) return setMsg('Indica una soglia positiva');
      const list = getRules();
      if (list.length >= 50) return setMsg('Massimo 50 regole');
      setRules([{ id: Date.now(), type, target: t.needsTarget ? target.trim().toLowerCase() : null, threshold: t.needsThreshold ? th : null, cooldown_min: cooldown, push: push ? 1 : 0, enabled: 1, last_fired: null }, ...list]);
      setTarget(''); setThreshold(''); setMsg('Regola creata (salvata su questo dispositivo).');
      load(); evaluateClient().catch(() => null);
      return;
    }
    const r = await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, target: t.needsTarget ? target.trim().toLowerCase() : null, threshold: t.needsThreshold ? Number(threshold.replace(',', '.')) : null, cooldown_min: cooldown, push }) });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error);
    setTarget(''); setThreshold(''); setMsg('Regola creata.');
    load();
  };
  const toggle = async (r: Rule) => { if (STATIC) { setRules(getRules().map((x) => (x.id === r.id ? { ...x, enabled: x.enabled ? 0 : 1 } : x))); return load(); } await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, enabled: !r.enabled }) }); load(); };
  const del = async (r: Rule) => { if (STATIC) { setRules(getRules().filter((x) => x.id !== r.id)); return load(); } await fetch('/api/alerts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id }) }); load(); };

  return (
    <div className="space-y-4">
      <section className="card flex flex-wrap items-center gap-3 p-4 text-sm">
        <span className="font-semibold">{STATIC ? 'Notifiche del browser' : 'Notifiche push'}</span>
        {STATIC && <span className="w-full text-xs text-warn">Versione statica (GitHub Pages): gli avvisi vengono controllati sul tuo dispositivo all&apos;apertura e ogni 5 minuti <b>solo mentre l&apos;app è aperta</b>; regole e notifiche restano salvate in questo browser. Le notifiche push in background richiedono l&apos;app completa con server.</span>}
        {pushState === 'on' && <><span className="chip border-up/40 text-up">attive su questo dispositivo</span><button className="btn" onClick={disablePush}>Disattiva</button></>}
        {pushState === 'off' && <button className="btn btn-primary" onClick={enablePush}>Attiva notifiche push</button>}
        {pushState === 'denied' && <span className="text-xs text-warn">Permesso negato nel browser: riabilitalo dalle impostazioni del sito.</span>}
        {pushState === 'unsupported' && <span className="text-xs text-mute">Non supportate da questo browser/dispositivo (su iOS installa prima l&apos;app nella schermata Home). Le notifiche restano visibili nel centro 🔔.</span>}
      </section>
      <form onSubmit={add} className="card grid gap-3 p-4 text-sm sm:grid-cols-2 lg:grid-cols-6">
        <label className="lg:col-span-2"><span className="text-xs text-mute">Tipo di avviso</span>
          <select className="input mt-1" value={type} onChange={(e) => { setType(e.target.value); setTarget(''); }}>{Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        {t.needsTarget && <label><span className="text-xs text-mute">{type === 'keyword' ? 'Parola chiave' : type === 'expert' ? 'Id fonte' : type === 'section_news' ? 'Sezione' : 'Strumento (id del catalogo)'}</span>
          {type === 'section_news' ? <select className="input mt-1" value={target} onChange={(e) => setTarget(e.target.value)} required><option value="">Scegli…</option>{SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          : type === 'keyword' || type === 'expert' ? <input className="input mt-1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={type === 'keyword' ? 'es. Euribor' : 'es. damodaran'} required maxLength={100} />
          : <select className="input mt-1" value={target} onChange={(e) => setTarget(e.target.value)} required><option value="">Scegli…</option>{groupsOf(() => true).map((g) => <optgroup key={g.group} label={g.group}>{g.items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</optgroup>)}</select>}</label>}
        {t.needsThreshold && <label><span className="text-xs text-mute">{type.startsWith('price') ? 'Livello (valuta dello strumento; % per i rendimenti)' : type === 'spread_above' ? 'Punti base' : 'Soglia (%; punti base per i rendimenti)'}</span><input className="input mt-1" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} required /></label>}
        <label><span className="text-xs text-mute">Silenzio tra due avvisi</span>
          <select className="input mt-1" value={cooldown} onChange={(e) => setCooldown(Number(e.target.value))}>{[[15, '15 min'], [60, '1 ora'], [240, '4 ore'], [720, '12 ore'], [1440, '1 giorno']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="flex items-end gap-2 pb-2"><input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} className="h-4 w-4 accent-sky-400" /> Push</label>
        <div className="flex items-end"><button className="btn btn-primary w-full">+ Crea avviso</button></div>
        {t.hint && <p className="text-xs text-mute sm:col-span-2 lg:col-span-6">{t.hint}</p>}
        {msg && <p className="text-xs text-accent sm:col-span-2 lg:col-span-6">{msg}</p>}
      </form>
      <section className="card">
        <div className="card-h">Le mie regole ({rules.length})</div>
        {rules.length === 0 ? <p className="p-4 text-sm text-mute">Nessuna regola. Suggerimento: inizia con &quot;Notizie urgenti&quot; e &quot;Banche centrali e dati macro ufficiali&quot;.</p> : (
          <ul className="divide-y divide-line">{rules.map((r) => (
            <li key={r.id} className={`flex flex-wrap items-center gap-2 px-4 py-2 text-sm ${r.enabled ? '' : 'opacity-50'}`}>
              <span className="font-medium">{types[r.type]?.label ?? r.type}</span>
              {r.target && <span className="chip border-line">{r.target}</span>}
              {r.threshold != null && <span className="chip border-line">{r.type === 'spread_above' ? `${r.threshold} pb` : r.type.startsWith('price') ? `livello ${r.threshold}` : `±${r.threshold}`}</span>}
              <span className="text-xs text-mute">silenzio {r.cooldown_min} min · {r.push ? 'push' : 'solo in app'} · {r.last_fired ? `ultimo: ${new Date(r.last_fired).toLocaleString('it-IT')}` : 'mai scattato'}</span>
              <span className="ml-auto flex gap-1"><button className="btn px-2 py-0.5 text-xs" onClick={() => toggle(r)}>{r.enabled ? 'Pausa' : 'Riattiva'}</button><button className="btn px-2 py-0.5 text-xs hover:text-down" onClick={() => del(r)}>Elimina</button></span>
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
