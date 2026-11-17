import 'server-only';
import { all, run, get, getCache, jparse } from './db';
import { pushToDevice } from './push';
import type { Quote } from './market/types';
import { fmtPrice, fmtChange } from './format';
import { anomalyThreshold } from './market/derived';

export const ALERT_TYPES: Record<string, { label: string; needsTarget: boolean; needsThreshold: boolean; hint: string }> = {
  price_above: { label: 'Prezzo/livello sopra soglia', needsTarget: true, needsThreshold: true, hint: 'Strumento (es. ftsemib, eurusd, gold, btp10y) + livello nella valuta di quotazione (per i rendimenti in %)' },
  price_below: { label: 'Prezzo/livello sotto soglia', needsTarget: true, needsThreshold: true, hint: 'Strumento + livello nella valuta di quotazione' },
  change_1d: { label: 'Variazione giornaliera oltre ±', needsTarget: true, needsThreshold: true, hint: 'Strumento + soglia in % (per i rendimenti in punti base)' },
  spread_above: { label: 'Spread BTP–Bund sopra soglia', needsTarget: false, needsThreshold: true, hint: 'Soglia in punti base (es. 150)' },
  anomaly: { label: 'Movimenti anomali su uno strumento', needsTarget: true, needsThreshold: false, hint: 'Strumento: scatta a soglie diverse per classe (es. indice ±2,5%, cambio ±1,5%)' },
  breaking: { label: 'Notizie urgenti (breaking)', needsTarget: false, needsThreshold: false, hint: '' },
  crisis: { label: 'Crolli, default, sospensioni (confermati)', needsTarget: false, needsThreshold: false, hint: '' },
  centralbank: { label: 'Banche centrali e dati macro ufficiali', needsTarget: false, needsThreshold: false, hint: '' },
  regulation: { label: 'Autorità di vigilanza e regole', needsTarget: false, needsThreshold: false, hint: '' },
  scam: { label: 'Truffe e avvisi di tutela', needsTarget: false, needsThreshold: false, hint: '' },
  instrument_news: { label: 'Notizie su uno strumento', needsTarget: true, needsThreshold: false, hint: 'Strumento (id, es. eni o sp500)' },
  section_news: { label: 'Notizie di una sezione', needsTarget: true, needsThreshold: false, hint: 'Sezione (es. obbligazioni, valute, risparmio)' },
  keyword: { label: 'Parola chiave nelle notizie', needsTarget: true, needsThreshold: false, hint: 'Parola o frase' },
  expert: { label: 'Nuovi contributi di un esperto/fonte', needsTarget: true, needsThreshold: false, hint: 'Id della fonte (es. damodaran)' },
  watchlist_news: { label: 'Notizie sugli elementi della watchlist', needsTarget: false, needsThreshold: false, hint: '' },
};

type Rule = { id: number; device_id: string; type: string; target: string | null; threshold: number | null; cooldown_min: number; push: number; last_fired: string | null };

function emit(rule: Rule, dedupe: string, title: string, body: string, url: string) {
  const r = run('INSERT OR IGNORE INTO alert_events(device_id, rule_id, title, body, url, dedupe_key) VALUES(?,?,?,?,?,?)', rule.device_id, rule.id, title, body, url, `${rule.id}:${dedupe}`);
  if (!r.changes) return false;
  run('UPDATE alert_rules SET last_fired = ? WHERE id = ?', new Date().toISOString(), rule.id);
  if (rule.push) pushToDevice(rule.device_id, { title, body, url, tag: `r${rule.id}` }).catch(() => null);
  return true;
}

const coolingDown = (rule: Rule) => rule.last_fired && Date.now() - Date.parse(rule.last_fired) < rule.cooldown_min * 60e3;

/** Regole di corrispondenza notizie (condivise con il motore lato browser in clientAlerts.ts). */
export function newsMatches(type: string, target: string, a: { cats: string[]; ins: string[]; flags: string[]; breaking: boolean; status: string; sourceId: string; sourceCat: string; title: string }, watch: string[]) {
  const confirmed = a.status === 'CONFERMATA' || a.status === 'CONFERMATA PARZIALMENTE';
  switch (type) {
    case 'breaking': return a.breaking && a.status !== 'SMENTITA';
    case 'crisis': return a.flags.includes('urgent') && confirmed;
    case 'centralbank': return a.sourceCat === 'centralbank' || a.sourceCat === 'statistics';
    case 'regulation': return a.sourceCat === 'regulator';
    case 'scam': return a.sourceCat === 'investor-protection' || a.cats.includes('truffe');
    case 'instrument_news': return !!target && a.ins.includes(target);
    case 'section_news': return !!target && a.cats.includes(target);
    case 'keyword': return !!target && a.title.toLowerCase().includes(target.toLowerCase());
    case 'expert': return a.sourceId === target;
    case 'watchlist_news': return a.ins.some((x) => watch.includes(x));
    default: return false;
  }
}

/** Valuta tutte le regole attive. Deduplica per evento e rispetta il periodo di silenzio (cooldown) di ogni regola. */
export function evaluateAlerts() {
  const rules = all<Rule>('SELECT * FROM alert_rules WHERE enabled = 1');
  if (!rules.length) return 0;
  const qs = getCache<Quote[]>('market:quotes').value ?? [];
  const byId = new Map(qs.map((q) => [q.id, q]));
  const since = new Date(Date.now() - 2 * 3600e3).toISOString();
  const recent = all<{ id: number; title: string; title_it: string | null; categories: string; coins: string; flags: string; source_id: string; is_breaking: number; cluster_id: number; status: string; source_cat: string }>(
    `SELECT a.id, a.title, a.title_it, a.categories, a.coins, a.flags, a.source_id, a.is_breaking, a.cluster_id, COALESCE(c.status_override, c.status) AS status, s.category AS source_cat
     FROM articles a JOIN clusters c ON c.id = a.cluster_id JOIN sources s ON s.id = a.source_id WHERE a.fetched_at >= ? OR a.published_at >= ? ORDER BY a.published_at DESC LIMIT 300`,
    since.replace('T', ' ').slice(0, 19), since,
  );
  const hour = new Date().toISOString().slice(0, 13);
  let fired = 0;
  for (const rule of rules) {
    if (coolingDown(rule)) continue;
    const q = rule.target ? byId.get(rule.target.toLowerCase()) : undefined;
    const t = rule.threshold ?? 0;
    const url = q ? `/strumento/${q.id}` : '/mercato';
    if (rule.type === 'price_above') { if (q?.price != null && q.price >= t && emit(rule, `above:${hour}`, `${q.name} sopra ${fmtPrice(t, q)}`, `Ultimo valore ${fmtPrice(q.price, q)} (${q.source}, dato ritardato)`, url)) fired++; continue; }
    if (rule.type === 'price_below') { if (q?.price != null && q.price <= t && emit(rule, `below:${hour}`, `${q.name} sotto ${fmtPrice(t, q)}`, `Ultimo valore ${fmtPrice(q.price, q)} (${q.source})`, url)) fired++; continue; }
    if (rule.type === 'change_1d') { if (q?.ch1d != null && Math.abs(q.ch1d) >= t && emit(rule, `ch:${hour}`, `${q.name} ${fmtChange(q.ch1d, q)} oggi`, `Soglia ±${t}${q.cls === 'yield' ? ' pb' : '%'} superata. Valore ${fmtPrice(q.price, q)}`, url)) fired++; continue; }
    if (rule.type === 'spread_above') {
      const b = byId.get('btp10y'), d = byId.get('bund10y');
      const sp = b?.price != null && d?.price != null ? Math.round((b.price - d.price) * 100) : null;
      if (sp != null && sp >= t && emit(rule, `spread:${hour}`, `Spread BTP–Bund a ${sp} pb`, `Soglia ${t} pb superata (BTP ${b!.price!.toFixed(2)}%, Bund ${d!.price!.toFixed(2)}%)`, '/obbligazioni')) fired++;
      continue;
    }
    if (rule.type === 'anomaly') {
      if (q?.ch1d != null && Math.abs(q.ch1d) >= anomalyThreshold(q.cls) && emit(rule, `an:${hour}`, `Movimento anomalo: ${q.name}`, `${fmtChange(q.ch1d, q)} nella seduta`, url)) fired++;
      continue;
    }
    const watch = rule.type === 'watchlist_news' ? all<{ item_id: string }>("SELECT item_id FROM watchlist WHERE device_id = ? AND item_type = 'instrument'", rule.device_id).map((x) => x.item_id) : [];
    for (const a of recent) {
      const title = a.title_it || a.title;
      const ok = newsMatches(rule.type, rule.target ?? '', { cats: jparse(a.categories, []), ins: jparse(a.coins, []), flags: jparse(a.flags, []), breaking: a.is_breaking === 1, status: a.status, sourceId: a.source_id, sourceCat: a.source_cat, title: `${title} ${a.title}` }, watch);
      // una notifica per evento (cluster), non per ogni articolo che lo riprende; max 1 per regola a ciclo
      if (ok && emit(rule, `c${a.cluster_id}`, ALERT_TYPES[rule.type]?.label ?? 'Avviso', title, `/notizia/${a.id}`)) { fired++; break; }
    }
  }
  return fired;
}

export function unreadCount(deviceId: string) {
  return get<{ n: number }>('SELECT COUNT(*) AS n FROM alert_events WHERE device_id = ? AND read = 0', deviceId)?.n ?? 0;
}
