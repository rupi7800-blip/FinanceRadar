/** Definizione delle sezioni (condivisa server/client). */
export type SectionId = 'azioni' | 'etf' | 'obbligazioni' | 'valute' | 'materie' | 'derivati' | 'cripto' | 'macro' | 'imprese' | 'risparmio' | 'immobiliare' | 'regole' | 'esperti' | 'truffe';

export const SECTIONS: { id: SectionId; label: string; href: string; color: string; icon: string; desc: string }[] = [
  { id: 'azioni', label: 'Azioni & Indici', href: '/azioni', color: '#3b82f6', icon: '▲', desc: 'Borse mondiali, indici, titoli USA, Europa, Italia e Asia' },
  { id: 'obbligazioni', label: 'Obbligazioni', href: '/obbligazioni', color: '#22c55e', icon: '◫', desc: 'Titoli di Stato, BTP, spread, curve dei rendimenti, corporate e high yield' },
  { id: 'etf', label: 'ETF & Fondi', href: '/etf', color: '#8b5cf6', icon: '◈', desc: 'ETF, ETC/ETN, fondi comuni, risparmio gestito' },
  { id: 'valute', label: 'Valute', href: '/valute', color: '#eab308', icon: '€', desc: 'Cambi principali ed emergenti, dollaro, cambi di riferimento BCE' },
  { id: 'materie', label: 'Materie prime', href: '/materie-prime', color: '#f97316', icon: '⛽', desc: 'Energia, metalli preziosi e industriali, agricoli' },
  { id: 'derivati', label: 'Derivati', href: '/derivati', color: '#ec4899', icon: '∂', desc: 'Future, opzioni, volatilità, certificati, CFD e warrant' },
  { id: 'cripto', label: 'Cripto', href: '/cripto', color: '#f7931a', icon: '₿', desc: 'Criptovalute, stablecoin, ETF e regole sugli asset digitali' },
  { id: 'macro', label: 'Macro & Banche centrali', href: '/macro', color: '#06b6d4', icon: '%', desc: 'BCE, Fed, inflazione, PIL, lavoro, tassi e Euribor' },
  { id: 'imprese', label: 'Imprese & Bilanci', href: '/imprese', color: '#14b8a6', icon: '⚑', desc: 'Trimestrali, dividendi, IPO, fusioni e acquisizioni, buyback' },
  { id: 'risparmio', label: 'Risparmio & Previdenza', href: '/risparmio', color: '#84cc16', icon: '⌂', desc: 'Conti deposito, BTP retail, buoni postali, PAC, fondi pensione, mutui' },
  { id: 'immobiliare', label: 'Immobiliare & Private', href: '/immobiliare', color: '#a16207', icon: '▦', desc: 'REIT, mattone, private equity, private credit, venture capital' },
  { id: 'regole', label: 'Regole & Fisco', href: '/regole', color: '#a3a3a3', icon: '§', desc: 'Consob, ESMA, SEC, Banca d\'Italia, MiFID, tassazione delle rendite' },
  { id: 'esperti', label: 'Analisi & Esperti', href: '/esperti', color: '#0ea5e9', icon: '✎', desc: 'Analisi, ricerche e opinioni a confronto' },
  { id: 'truffe', label: 'Truffe & Tutele', href: '/truffe', color: '#ef4444', icon: '⛨', desc: 'Abusivi, schemi Ponzi, phishing finanziario, tutela del risparmiatore' },
];

export const SECTION_LABEL: Record<string, string> = Object.fromEntries(SECTIONS.map((s) => [s.id, s.label]));
export const SECTION_BY_ID: Record<string, (typeof SECTIONS)[number]> = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

export const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  CONFERMATA: { label: 'Confermata', cls: 'bg-up/15 text-up border-up/40' },
  'CONFERMATA PARZIALMENTE': { label: 'Confermata parzialmente', cls: 'bg-info/15 text-info border-info/40' },
  'NON VERIFICATA': { label: 'Non verificata', cls: 'bg-warn/15 text-warn border-warn/40' },
  SMENTITA: { label: 'Smentita', cls: 'bg-down/15 text-down border-down/40' },
};
export const STATUSES = Object.keys(STATUS_STYLE);
