import { INSTRUMENTS, CLASS_LABEL, type InstrumentDef } from './catalog';

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Ricerca nel catalogo strumenti (nome, id, simbolo, gruppo, Paese). Funziona sia sul server sia nel browser. */
export function searchInstruments(q: string, limit = 10): (InstrumentDef & { clsLabel: string })[] {
  const ql = norm(q.trim());
  if (ql.length < 2) return [];
  const score = (i: InstrumentDef) => {
    const name = norm(i.name), sym = norm(i.y ?? i.s ?? '');
    if (i.id === ql || sym === ql) return 0;
    if (name.startsWith(ql)) return 1;
    if (name.includes(ql)) return 2;
    if (sym.includes(ql)) return 3;
    if (norm(i.group).includes(ql) || norm(i.region).includes(ql)) return 4;
    return 9;
  };
  return INSTRUMENTS.map((i) => ({ i, s: score(i) })).filter((x) => x.s < 9).sort((a, b) => a.s - b.s).slice(0, limit).map(({ i }) => ({ ...i, clsLabel: CLASS_LABEL[i.cls] }));
}
