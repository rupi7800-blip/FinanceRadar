'use client';
/** Motore di avvisi lato browser (versione statica): regole, eventi e notifiche restano sul dispositivo. */
import { lsGet, lsSet } from './local';
import { dataUrl, withBase } from './mode';
import { fmtPrice, fmtChange } from './format';

export type CRule = { id: number; type: string; target: string | null; threshold: number | null; cooldown_min: number; push: number; enabled: number; last_fired: string | null };
export type CEvent = { id: number; title: string; body: string | null; url: string | null; read: number; created_at: string; key: string };
type NewsLite = { id: number; t: string; ti: string | null; c: string[]; k: string[]; f: string[]; b: boolean; st: string; sid: string; scat: string; cl: number };
type QLite = { id: string; name: string; cls: string; ccy: string; price: number | null; ch1d: number | null; source: string };

/** Soglie di anomalia per classe (uguali a quelle del server, market/derived.ts). */
const TH: Record<string, number> = { index: 2.5, equity: 7, etf: 4, fund: 3, bond: 2, yield: 15, fx: 1.5, commodity: 5, future: 3, volatility: 20, crypto: 10, reit: 6 };

const RK = 'fr_rules', EK = 'fr_events';
export const getRules = () => lsGet<CRule[]>(RK, []);
export const setRules = (r: CRule[]) => lsSet(RK, r);
export const getEvents = () => lsGet<CEvent[]>(EK, []);
export const setEvents = (e: CEvent[]) => { lsSet(EK, e.slice(0, 100)); window.dispatchEvent(new Event('fr-events')); };

async function notify(title: string, body: string, url: string) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: withBase('/icons/icon-192.png'), data: { url: withBase(url) } });
    else new Notification(title, { body });
  } catch { /* */ }
}

function newsOk(type: string, t: string, a: NewsLite, title: string, wl: string[]) {
  const confirmed = a.st === 'CONFERMATA' || a.st === 'CONFERMATA PARZIALMENTE';
  switch (type) {
    case 'breaking': return a.b && a.st !== 'SMENTITA';
    case 'crisis': return a.f.includes('urgent') && confirmed;
    case 'centralbank': return a.scat === 'centralbank' || a.scat === 'statistics';
    case 'regulation': return a.scat === 'regulator';
    case 'scam': return a.scat === 'investor-protection' || a.k.includes('truffe');
    case 'instrument_news': return !!t && a.c.includes(t);
    case 'section_news': return !!t && a.k.includes(t);
    case 'keyword': return !!t && (title.toLowerCase().includes(t) || a.t.toLowerCase().includes(t));
    case 'expert': return a.sid === t;
    case 'watchlist_news': return a.c.some((x) => wl.includes(x));
    default: return false;
  }
}

export async function evaluateClient() {
  const rules = getRules().filter((r) => r.enabled);
  if (!rules.length) return 0;
  const [m, n] = await Promise.all([
    fetch(dataUrl('market.json'), { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    fetch(dataUrl('news.json'), { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
  ]);
  const qs: QLite[] = m?.quotes ?? [];
  const news: NewsLite[] = n?.items ?? [];
  const events = getEvents();
  const all = getRules();
  const hour = new Date().toISOString().slice(0, 13);
  const wl = lsGet<{ type: string; id: string }[]>('fr_watchlist', []).filter((x) => x.type === 'instrument').map((x) => x.id);
  let fired = 0;
  const emit = (r: CRule, key: string, title: string, body: string, url: string) => {
    const k = `${r.id}:${key}`;
    if (events.some((e) => e.key === k)) return false;
    events.unshift({ id: Date.now() + Math.random(), title, body, url, read: 0, created_at: new Date().toISOString(), key: k });
    const rr = all.find((x) => x.id === r.id);
    if (rr) rr.last_fired = new Date().toISOString();
    if (r.push) notify(title, body, url);
    fired++;
    return true;
  };
  for (const r of rules) {
    if (r.last_fired && Date.now() - Date.parse(r.last_fired) < r.cooldown_min * 60e3) continue;
    const t = (r.target ?? '').toLowerCase();
    const q = t ? qs.find((x) => x.id === t) : undefined;
    const th = r.threshold ?? 0;
    const url = q ? `/strumento/${q.id}/` : '/mercato/';
    if (r.type === 'price_above') { if (q?.price != null && q.price >= th) emit(r, `above:${hour}`, `${q.name} sopra ${fmtPrice(th, q)}`, `Ultimo valore ${fmtPrice(q.price, q)} (${q.source}, dato ritardato)`, url); continue; }
    if (r.type === 'price_below') { if (q?.price != null && q.price <= th) emit(r, `below:${hour}`, `${q.name} sotto ${fmtPrice(th, q)}`, `Ultimo valore ${fmtPrice(q.price, q)}`, url); continue; }
    if (r.type === 'change_1d') { if (q?.ch1d != null && Math.abs(q.ch1d) >= th) emit(r, `ch:${hour}`, `${q.name} ${fmtChange(q.ch1d, q)} oggi`, `Soglia ±${th}${q.cls === 'yield' ? ' pb' : '%'} superata`, url); continue; }
    if (r.type === 'anomaly') { if (q?.ch1d != null && Math.abs(q.ch1d) >= (TH[q.cls] ?? 5)) emit(r, `an:${hour}`, `Movimento anomalo: ${q.name}`, `${fmtChange(q.ch1d, q)} nella seduta`, url); continue; }
    if (r.type === 'spread_above') {
      const b = qs.find((x) => x.id === 'btp10y'), d = qs.find((x) => x.id === 'bund10y');
      const sp = b?.price != null && d?.price != null ? Math.round((b.price - d.price) * 100) : null;
      if (sp != null && sp >= th) emit(r, `spread:${hour}`, `Spread BTP–Bund a ${sp} pb`, `Soglia ${th} pb superata`, '/obbligazioni/');
      continue;
    }
    for (const a of news) {
      const title = a.ti || a.t;
      if (newsOk(r.type, t, a, title, wl) && emit(r, `c${a.cl}`, r.type === 'breaking' ? 'Notizia urgente' : 'Finance Radar', title, `/notizia/${a.id}/`)) break;
    }
  }
  setRules(all);
  setEvents(events);
  return fired;
}
