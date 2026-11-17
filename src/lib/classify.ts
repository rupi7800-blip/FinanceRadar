import 'server-only';
import { getSetting } from './db';
import { INSTRUMENTS, CLASS_SECTION } from './instruments/catalog';

/** Parole chiave predefinite per sezione (in inglese e italiano; modificabili da Admin → impostazione "category_keywords"). */
export const DEFAULT_CATEGORY_KEYWORDS: Record<string, string> = {
  azioni: '\\bstocks?\\b|\\bshares\\b|equit(y|ies)|wall street|stock market|\\bindex\\b|borsa|azion[ei]|titol[oi] (in|a) (rialzo|ribasso)|listino|piazza affari|rally|sell-?off|\\bbull market|\\bbear market|correction|correzione|S&P|Nasdaq|Dow|FTSE|DAX|Nikkei',
  obbligazioni: '\\bbonds?\\b|treasury (yields?|bonds?|notes?|bills?|auction|market)|\\btreasuries\\b(?! (holdings?|reserves?|companies|firms))|\\byields?\\b|\\bgilts?\\b|\\bBunds?\\b|\\bBTPs?\\b|titoli di stato|obbligazion|rendiment[oi] (dei|del|dei titoli|a \\d+ anni)|spread (btp|bund|sovrano)|BTP-Bund|\\bcoupon|cedola|debt sale|bond (sale|issue)|asta (dei|del) (bot|btp|titoli)|debt auction|credit rating|rating agenc|Moody.s|Fitch|DBRS|S&P Global Ratings|high[- ]yield|investment[- ]grade|curva dei rendimenti|yield curve',
  etf: '\\bETFs?\\b|\\bETCs?\\b|\\bETNs?\\b|exchange[- ]traded|index fund|mutual funds?|fondi? comun[ei]|risparmio gestito|asset manager|BlackRock|Vanguard|iShares|Amundi|flussi|inflows?|outflows?|\\bAUM\\b|SICAV|UCITS',
  valute: '\\bforex\\b|\\bFX\\b|currenc(y|ies)|exchange rate|tasso di cambio|cambio|\\bdollar\\b|dollaro|\\beuro\\b(?! area| zone)|\\byen\\b|sterlin|\\bpound\\b|\\bfranc\\b|\\byuan\\b|devaluation|svalutazione|carry trade',
  materie: 'commodit(y|ies)|materie prime|\\boil\\b|petrolio|crude|\\bOPEC|\\bgold\\b|\\boro\\b|\\bsilver\\b|argento|copper|\\brame\\b|natural gas|gas naturale|\\bLNG\\b|wheat|grano|\\bcorn\\b|coffee|cocoa|cacao|lithium|litio|uranium|uranio|metals?|metalli|mining|miniere',
  derivati: 'derivativ|derivati|futures?|\\boptions?\\b|opzion[ei]|\\bcalls?\\b and puts?|\\bputs?\\b|0DTE|\\bVIX\\b|volatilit|swaps?\\b|\\bCDS\\b|\\bCFDs?\\b|certificat[ei]|warrant|leverage|leva finanziaria|margin call|short squeeze|open interest|hedg',
  cripto: '\\bcrypto|cripto|bitcoin|\\bBTC\\b|ethereum|\\bETH\\b|blockchain|stablecoin|tokeni[sz]|digital assets?|asset digital|\\bMiCA\\b|Coinbase|Binance|\\bDeFi\\b|\\bCBDC|euro digitale|digital euro',
  macro: 'central bank|banca centrale|\\bFed\\b|Federal Reserve|FOMC|\\bECB\\b|\\bBCE\\b|Bank of (England|Japan)|\\bBoJ\\b|\\bBoE\\b|Lagarde|Powell|interest rates?|tass[oi] di interesse|rate (cut|hike)|tagli[oa] dei tassi|rialz[oi] dei tassi|inflation|inflazione|\\bCPI\\b|\\bPCE\\b|\\bGDP\\b|\\bPIL\\b|recession|recessione|jobs report|payrolls|unemployment|disoccupazione|\\bPMI\\b|\\bISTAT\\b|Eurostat|tariff|dazi|deficit|debito pubblico|stimulus|quantitative|\\bQE\\b|\\bQT\\b',
  imprese: 'earnings|quarterly results|trimestral|bilancio|risultati|revenue|ricavi|fatturato|utile|profit|guidance|dividend|dividendo|buyback|riacquisto|\\bIPO\\b|quotazione in borsa|listing|merger|acquisition|acquisizion|fusion[ei]|\\bM&A\\b|takeover|\\bOPA\\b|\\bOPS\\b|offerta pubblica|deal|spin-?off|layoffs?|licenziament|CEO|amministratore delegato|stock split|aumento di capitale|bond aziendal',
  risparmio: 'risparmi|savings|conto deposito|conti deposito|buoni postali|libretto|\\bPAC\\b|piano di accumulo|pension|previdenza|fondo pensione|\\bTFR\\b|mutu[oi]|mortgage|retirement|401\\(k\\)|\\bIRA\\b|BTP (Italia|Valore|Più|Futura)|retail investors?|piccoli risparmiatori|educazione finanziaria|financial literacy|personal finance|finanza personale|asset allocation|portafoglio',
  immobiliare: 'real estate|immobil|\\bREITs?\\b|housing|house prices|prezzi delle case|home sales|compravendite|mattone|commercial property|private equity|private credit|private markets|venture capital|\\bVC\\b|startup|buyout|crowdfunding|Blackstone|\\bKKR\\b|Apollo|Carlyle|infrastructure fund',
  regole: '\\bSEC\\b|\\bCFTC\\b|\\bESMA\\b|\\bConsob\\b|\\bIVASS\\b|\\bCOVIP\\b|Banca d.Italia|\\bEBA\\b|\\bFCA\\b|\\bFINRA\\b|regulat|regolament|vigilanza|supervision|sanction|sanzion|fine[sd]?\\b|multa|lawsuit|causa|court|tribunale|\\bMiFID|\\bPRIIPs?\\b|\\bKID\\b|Basel|Basilea|capital requirements|stress test|tax(es|ation)?\\b|fisco|tasse|tassazione|imposta|aliquota|capital gain|plusvalenz|Agenzia delle Entrate|legge di bilancio|manovra|antitrust|golden power',
  esperti: 'analyst|analista|research|ricerca|outlook|prospettive|strategist|strategist|economist|economista|interview|intervista|opinion|opinione|commentary|commento|forecast|previsione|note to clients',
  truffe: 'scam|truffa|fraud|frode|ponzi|piramidal|phishing|abusiv|unauthori[sz]ed|non autorizzat|oscurament|blacklist|warning list|insider trading|market manipulation|manipolazione|pump and dump|money laundering|riciclaggio|embezzlement|appropriazione|crack|bancarotta|bankruptcy|default|insolven|data breach|furto|stolen|hack',
};

export const FLAG_PATTERNS: Record<string, RegExp> = {
  rumor: /\b(reportedly|rumou?rs?|according to (people|sources|a source|insiders)|people familiar|allegedly|unconfirmed|speculation|leaked|insiders say|indiscrezion\w*|secondo fonti|rumors?|voci di mercato|sarebbe pronto|sarebbero)\b/i,
  denial: /\b(denies|denied|deny|refutes?|debunk(s|ed)?|fake news|false (report|claim)s?|smentisc\w*|smentita|not true|no plans? to)\b/i,
  urgent: /\b(crash(es|ed)?|plunges?|plummets?|tumbles?|halts? trading|trading (halt|suspended)|circuit breaker|sospes\w* (le )?(contrattazioni|negoziazioni)|default(s|ed)?|bankrupt\w*|bancarotta|insolven\w*|bank run|collapse[sd]?|crollo|crolla|emergency (rate|meeting|cut)|riunione d.emergenza|downgrade[sd]? to junk|margin calls?|flash crash|outage|hack(ed|s)?|fraud charges)\b/i,
  breaking: /^breaking\b|\bbreaking:|\bjust in\b|^ultim.ora\b|\bultim.ora:/i,
  prediction: /\b(price target|target price|prezzo obiettivo|could (reach|hit|soar|surge|crash|fall)|predicts?|forecasts?|expected to|projected|outlook|previsione|prevede|stima|stime|consensus)\b/i,
  sponsored: /\b(sponsored|press release|partner content|paid content|advertorial|comunicato sponsorizzato|contenuto sponsorizzato|publiredazionale)\b/i,
};

type IndexEntry = { id: string; re: RegExp; cls: string };
let idxCache: IndexEntry[] | null = null;
function instrumentIndex(): IndexEntry[] {
  if (idxCache) return idxCache;
  idxCache = INSTRUMENTS.filter((i) => i.aliases).flatMap((i) => {
    try {
      return [{ id: i.id, cls: i.cls, re: new RegExp(i.aliases as string, i.cs ? '' : 'i') }];
    } catch {
      return [];
    }
  });
  return idxCache;
}

/** Strumenti citati nel testo (id del catalogo), nell'ordine del catalogo, massimo 6. */
export function detectInstruments(text: string): string[] {
  const found: string[] = [];
  for (const e of instrumentIndex()) {
    if (found.length >= 6) break;
    if (!found.includes(e.id) && e.re.test(text)) found.push(e.id);
  }
  return found;
}

let kwCache: { key: string; compiled: Record<string, RegExp> } | null = null;
function categoryRegexes(): Record<string, RegExp> {
  const custom = getSetting<Record<string, string>>('category_keywords', {});
  const merged = { ...DEFAULT_CATEGORY_KEYWORDS, ...custom };
  const key = JSON.stringify(merged);
  if (kwCache?.key === key) return kwCache.compiled;
  const compiled: Record<string, RegExp> = {};
  for (const [k, v] of Object.entries(merged)) {
    try {
      compiled[k] = new RegExp(v, 'i');
    } catch {
      compiled[k] = new RegExp(DEFAULT_CATEGORY_KEYWORDS[k] ?? '(?!)', 'i');
    }
  }
  kwCache = { key, compiled };
  return compiled;
}

/** Le categorie "larghe" si valutano solo sul titolo, per ridurre i falsi positivi. */
const TITLE_ONLY = new Set(['regole', 'esperti', 'imprese', 'truffe', 'valute', 'azioni']);

export function classify(title: string, excerpt: string, sourceCategory: string, sectionHint: string | null) {
  const text = `${title}. ${excerpt}`;
  const cats = new Set<string>();
  for (const [cat, re] of Object.entries(categoryRegexes())) {
    if (cat === 'esperti') continue;
    if (re.test(TITLE_ONLY.has(cat) ? title : text)) cats.add(cat);
  }
  if (sectionHint) for (const h of sectionHint.split(',')) cats.add(h.trim());
  if (sourceCategory === 'expert') cats.add('esperti');
  if (sourceCategory === 'regulator') cats.add('regole');
  if (sourceCategory === 'centralbank') cats.add('macro');
  if (sourceCategory === 'investor-protection') cats.add('truffe');
  const flags: string[] = [];
  for (const [f, re] of Object.entries(FLAG_PATTERNS)) {
    const target = f === 'prediction' || f === 'sponsored' ? text : title;
    if (re.test(target)) flags.push(f);
  }
  const instruments = detectInstruments(text);
  const clsOf = new Map(INSTRUMENTS.map((i) => [i.id, i.cls]));
  for (const id of instruments) {
    const c = clsOf.get(id);
    if (c) cats.add(CLASS_SECTION[c]);
  }
  return { categories: [...cats], coins: instruments, flags };
}
