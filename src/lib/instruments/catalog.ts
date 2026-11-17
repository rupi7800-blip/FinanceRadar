/**
 * Catalogo degli strumenti quotati monitorati (condiviso server/client).
 * Ogni voce indica il simbolo Yahoo Finance (fonte primaria, dati ritardati) e, dove esiste, il simbolo Stooq (fonte di riserva).
 * Il catalogo si estende aggiungendo righe: nessun'altra modifica al codice è necessaria.
 *
 * cls (classe di strumento) → determina la sezione, il formato del prezzo e le regole di anomalia.
 * aliases: espressione regolare usata per riconoscere lo strumento nelle notizie (senza flag 'i' se cs = true).
 */
export type AssetClass = 'index' | 'equity' | 'etf' | 'fund' | 'bond' | 'yield' | 'fx' | 'commodity' | 'future' | 'volatility' | 'crypto' | 'reit';

export type InstrumentDef = {
  id: string;
  y?: string; // simbolo Yahoo Finance
  s?: string; // simbolo Stooq
  name: string;
  cls: AssetClass;
  group: string;
  region: string;
  ccy: string;
  aliases?: string;
  cs?: boolean; // alias sensibile alle maiuscole
  note?: string;
};

export const CLASS_LABEL: Record<AssetClass, string> = {
  index: 'Indice azionario', equity: 'Azione', etf: 'ETF', fund: 'Fondo comune', bond: 'Obbligazioni (ETF/future)', yield: 'Rendimento titolo di Stato',
  fx: 'Cambio valutario', commodity: 'Materia prima', future: 'Future su indice', volatility: 'Indice di volatilità', crypto: 'Criptovaluta', reit: 'Immobiliare / private markets',
};

/** Sezione di riferimento per ciascuna classe (vedi sections.ts). */
export const CLASS_SECTION: Record<AssetClass, string> = {
  index: 'azioni', equity: 'azioni', etf: 'etf', fund: 'etf', bond: 'obbligazioni', yield: 'obbligazioni', fx: 'valute', commodity: 'materie',
  future: 'derivati', volatility: 'derivati', crypto: 'cripto', reit: 'immobiliare',
};

const I = (id: string, y: string | undefined, s: string | undefined, name: string, cls: AssetClass, group: string, region: string, ccy: string, aliases?: string, extra: Partial<InstrumentDef> = {}): InstrumentDef =>
  ({ id, y, s, name, cls, group, region, ccy, aliases, ...extra });

export const INSTRUMENTS: InstrumentDef[] = [
  /* ---------------- Indici azionari ---------------- */
  I('sp500', '^GSPC', '^spx', 'S&P 500', 'index', 'Indici USA', 'USA', 'USD', 'S&P ?500|\\bSPX\\b'),
  I('dowjones', '^DJI', '^dji', 'Dow Jones Industrial', 'index', 'Indici USA', 'USA', 'USD', 'Dow Jones|\\bthe Dow\\b'),
  I('nasdaq', '^IXIC', '^ndq', 'Nasdaq Composite', 'index', 'Indici USA', 'USA', 'USD', 'Nasdaq(?! ?100)'),
  I('nasdaq100', '^NDX', '^ndx', 'Nasdaq 100', 'index', 'Indici USA', 'USA', 'USD', 'Nasdaq[- ]?100'),
  I('russell2000', '^RUT', undefined, 'Russell 2000', 'index', 'Indici USA', 'USA', 'USD', 'Russell 2000|small[- ]caps?'),
  I('ftsemib', 'FTSEMIB.MI', '^fmib', 'FTSE MIB', 'index', 'Indici Europa', 'Italia', 'EUR', 'FTSE ?MIB|Piazza Affari|Borsa (di )?Milano|Borsa Italiana'),
  I('dax', '^GDAXI', '^dax', 'DAX 40', 'index', 'Indici Europa', 'Germania', 'EUR', '\\bDAX\\b', { cs: true }),
  I('cac40', '^FCHI', '^cac', 'CAC 40', 'index', 'Indici Europa', 'Francia', 'EUR', 'CAC ?40'),
  I('ftse100', '^FTSE', '^ukx', 'FTSE 100', 'index', 'Indici Europa', 'Regno Unito', 'GBP', 'FTSE ?100'),
  I('eurostoxx50', '^STOXX50E', undefined, 'Euro Stoxx 50', 'index', 'Indici Europa', 'Eurozona', 'EUR', 'Euro ?Stoxx ?50|Eurostoxx'),
  I('stoxx600', '^STOXX', undefined, 'Stoxx Europe 600', 'index', 'Indici Europa', 'Europa', 'EUR', 'Stoxx ?(Europe )?600'),
  I('ibex35', '^IBEX', '^ibex', 'IBEX 35', 'index', 'Indici Europa', 'Spagna', 'EUR', 'IBEX'),
  I('aex', '^AEX', '^aex', 'AEX', 'index', 'Indici Europa', 'Paesi Bassi', 'EUR', '\\bAEX\\b', { cs: true }),
  I('smi', '^SSMI', '^smi', 'SMI', 'index', 'Indici Europa', 'Svizzera', 'CHF', 'Swiss Market Index|\\bSMI\\b', { cs: true }),
  I('nikkei', '^N225', '^nkx', 'Nikkei 225', 'index', 'Indici Asia e resto del mondo', 'Giappone', 'JPY', 'Nikkei'),
  I('hangseng', '^HSI', '^hsi', 'Hang Seng', 'index', 'Indici Asia e resto del mondo', 'Hong Kong', 'HKD', 'Hang Seng'),
  I('shanghai', '000001.SS', '^shc', 'Shanghai Composite', 'index', 'Indici Asia e resto del mondo', 'Cina', 'CNY', 'Shanghai Composite|CSI ?300'),
  I('kospi', '^KS11', undefined, 'KOSPI', 'index', 'Indici Asia e resto del mondo', 'Corea del Sud', 'KRW', 'KOSPI'),
  I('sensex', '^BSESN', undefined, 'BSE Sensex', 'index', 'Indici Asia e resto del mondo', 'India', 'INR', 'Sensex|Nifty'),
  I('asx200', '^AXJO', undefined, 'S&P/ASX 200', 'index', 'Indici Asia e resto del mondo', 'Australia', 'AUD', 'ASX ?200'),
  I('tsx', '^GSPTSE', undefined, 'S&P/TSX Composite', 'index', 'Indici Asia e resto del mondo', 'Canada', 'CAD', '\\bTSX\\b', { cs: true }),
  I('bovespa', '^BVSP', undefined, 'Bovespa', 'index', 'Indici Asia e resto del mondo', 'Brasile', 'BRL', 'Bovespa|Ibovespa'),

  /* ---------------- Azioni USA ---------------- */
  I('aapl', 'AAPL', 'aapl.us', 'Apple', 'equity', 'Azioni USA', 'USA', 'USD', '\\bApple\\b|\\bAAPL\\b'),
  I('msft', 'MSFT', 'msft.us', 'Microsoft', 'equity', 'Azioni USA', 'USA', 'USD', 'Microsoft|\\bMSFT\\b'),
  I('nvda', 'NVDA', 'nvda.us', 'Nvidia', 'equity', 'Azioni USA', 'USA', 'USD', 'Nvidia|\\bNVDA\\b'),
  I('amzn', 'AMZN', 'amzn.us', 'Amazon', 'equity', 'Azioni USA', 'USA', 'USD', '\\bAmazon\\b|\\bAMZN\\b'),
  I('googl', 'GOOGL', 'googl.us', 'Alphabet (Google)', 'equity', 'Azioni USA', 'USA', 'USD', 'Alphabet|\\bGoogle\\b'),
  I('meta', 'META', 'meta.us', 'Meta Platforms', 'equity', 'Azioni USA', 'USA', 'USD', 'Meta Platforms|\\bMeta\\b(?! ?(della|del|di|tra|per))|Facebook', { cs: true }),
  I('tsla', 'TSLA', 'tsla.us', 'Tesla', 'equity', 'Azioni USA', 'USA', 'USD', '\\bTesla\\b|\\bTSLA\\b'),
  I('brk', 'BRK-B', 'brk-b.us', 'Berkshire Hathaway', 'equity', 'Azioni USA', 'USA', 'USD', 'Berkshire'),
  I('avgo', 'AVGO', 'avgo.us', 'Broadcom', 'equity', 'Azioni USA', 'USA', 'USD', 'Broadcom'),
  I('jpm', 'JPM', 'jpm.us', 'JPMorgan Chase', 'equity', 'Azioni USA', 'USA', 'USD', 'JPMorgan|JP Morgan'),
  I('v', 'V', 'v.us', 'Visa', 'equity', 'Azioni USA', 'USA', 'USD', '\\bVisa\\b(?! (for|per))', { cs: true }),
  I('ma', 'MA', 'ma.us', 'Mastercard', 'equity', 'Azioni USA', 'USA', 'USD', 'Mastercard'),
  I('lly', 'LLY', 'lly.us', 'Eli Lilly', 'equity', 'Azioni USA', 'USA', 'USD', 'Eli Lilly|\\bLilly\\b'),
  I('unh', 'UNH', 'unh.us', 'UnitedHealth', 'equity', 'Azioni USA', 'USA', 'USD', 'UnitedHealth'),
  I('xom', 'XOM', 'xom.us', 'ExxonMobil', 'equity', 'Azioni USA', 'USA', 'USD', 'Exxon'),
  I('cvx', 'CVX', 'cvx.us', 'Chevron', 'equity', 'Azioni USA', 'USA', 'USD', 'Chevron'),
  I('wmt', 'WMT', 'wmt.us', 'Walmart', 'equity', 'Azioni USA', 'USA', 'USD', 'Walmart'),
  I('cost', 'COST', 'cost.us', 'Costco', 'equity', 'Azioni USA', 'USA', 'USD', 'Costco'),
  I('jnj', 'JNJ', 'jnj.us', 'Johnson & Johnson', 'equity', 'Azioni USA', 'USA', 'USD', 'Johnson ?& ?Johnson'),
  I('pg', 'PG', 'pg.us', 'Procter & Gamble', 'equity', 'Azioni USA', 'USA', 'USD', 'Procter'),
  I('ko', 'KO', 'ko.us', 'Coca-Cola', 'equity', 'Azioni USA', 'USA', 'USD', 'Coca[- ]Cola'),
  I('mcd', 'MCD', 'mcd.us', "McDonald's", 'equity', 'Azioni USA', 'USA', 'USD', "McDonald'?s"),
  I('orcl', 'ORCL', 'orcl.us', 'Oracle', 'equity', 'Azioni USA', 'USA', 'USD', '\\bOracle\\b'),
  I('nflx', 'NFLX', 'nflx.us', 'Netflix', 'equity', 'Azioni USA', 'USA', 'USD', 'Netflix'),
  I('amd', 'AMD', 'amd.us', 'AMD', 'equity', 'Azioni USA', 'USA', 'USD', '\\bAMD\\b|Advanced Micro', { cs: true }),
  I('intc', 'INTC', 'intc.us', 'Intel', 'equity', 'Azioni USA', 'USA', 'USD', '\\bIntel\\b'),
  I('ibm', 'IBM', 'ibm.us', 'IBM', 'equity', 'Azioni USA', 'USA', 'USD', '\\bIBM\\b', { cs: true }),
  I('crm', 'CRM', 'crm.us', 'Salesforce', 'equity', 'Azioni USA', 'USA', 'USD', 'Salesforce'),
  I('adbe', 'ADBE', 'adbe.us', 'Adobe', 'equity', 'Azioni USA', 'USA', 'USD', '\\bAdobe\\b'),
  I('pltr', 'PLTR', 'pltr.us', 'Palantir', 'equity', 'Azioni USA', 'USA', 'USD', 'Palantir'),
  I('bac', 'BAC', 'bac.us', 'Bank of America', 'equity', 'Azioni USA', 'USA', 'USD', 'Bank of America'),
  I('gs', 'GS', 'gs.us', 'Goldman Sachs', 'equity', 'Azioni USA', 'USA', 'USD', 'Goldman'),
  I('ms', 'MS', 'ms.us', 'Morgan Stanley', 'equity', 'Azioni USA', 'USA', 'USD', 'Morgan Stanley'),
  I('ba', 'BA', 'ba.us', 'Boeing', 'equity', 'Azioni USA', 'USA', 'USD', 'Boeing'),
  I('cat', 'CAT', 'cat.us', 'Caterpillar', 'equity', 'Azioni USA', 'USA', 'USD', 'Caterpillar'),
  I('dis', 'DIS', 'dis.us', 'Walt Disney', 'equity', 'Azioni USA', 'USA', 'USD', '\\bDisney\\b'),
  I('pfe', 'PFE', 'pfe.us', 'Pfizer', 'equity', 'Azioni USA', 'USA', 'USD', 'Pfizer'),
  I('nke', 'NKE', 'nke.us', 'Nike', 'equity', 'Azioni USA', 'USA', 'USD', '\\bNike\\b'),
  I('coin', 'COIN', 'coin.us', 'Coinbase', 'equity', 'Azioni USA', 'USA', 'USD', 'Coinbase'),

  /* ---------------- Azioni Europa ---------------- */
  I('asml', 'ASML.AS', undefined, 'ASML', 'equity', 'Azioni Europa', 'Paesi Bassi', 'EUR', '\\bASML\\b', { cs: true }),
  I('sap', 'SAP.DE', undefined, 'SAP', 'equity', 'Azioni Europa', 'Germania', 'EUR', '\\bSAP\\b', { cs: true }),
  I('lvmh', 'MC.PA', undefined, 'LVMH', 'equity', 'Azioni Europa', 'Francia', 'EUR', 'LVMH'),
  I('novo', 'NOVO-B.CO', undefined, 'Novo Nordisk', 'equity', 'Azioni Europa', 'Danimarca', 'DKK', 'Novo Nordisk'),
  I('nestle', 'NESN.SW', undefined, 'Nestlé', 'equity', 'Azioni Europa', 'Svizzera', 'CHF', 'Nestl[eé]'),
  I('roche', 'ROG.SW', undefined, 'Roche', 'equity', 'Azioni Europa', 'Svizzera', 'CHF', '\\bRoche\\b'),
  I('novartis', 'NOVN.SW', undefined, 'Novartis', 'equity', 'Azioni Europa', 'Svizzera', 'CHF', 'Novartis'),
  I('siemens', 'SIE.DE', undefined, 'Siemens', 'equity', 'Azioni Europa', 'Germania', 'EUR', '\\bSiemens\\b'),
  I('totalenergies', 'TTE.PA', undefined, 'TotalEnergies', 'equity', 'Azioni Europa', 'Francia', 'EUR', 'TotalEnergies'),
  I('shell', 'SHEL.L', undefined, 'Shell', 'equity', 'Azioni Europa', 'Regno Unito', 'GBp', '\\bShell\\b', { cs: true }),
  I('astrazeneca', 'AZN.L', undefined, 'AstraZeneca', 'equity', 'Azioni Europa', 'Regno Unito', 'GBp', 'AstraZeneca'),
  I('hsbc', 'HSBA.L', undefined, 'HSBC', 'equity', 'Azioni Europa', 'Regno Unito', 'GBp', '\\bHSBC\\b'),
  I('airbus', 'AIR.PA', undefined, 'Airbus', 'equity', 'Azioni Europa', 'Francia', 'EUR', 'Airbus'),
  I('allianz', 'ALV.DE', undefined, 'Allianz', 'equity', 'Azioni Europa', 'Germania', 'EUR', 'Allianz'),
  I('santander', 'SAN.MC', undefined, 'Banco Santander', 'equity', 'Azioni Europa', 'Spagna', 'EUR', 'Santander'),
  I('bnp', 'BNP.PA', undefined, 'BNP Paribas', 'equity', 'Azioni Europa', 'Francia', 'EUR', 'BNP Paribas'),
  I('volkswagen', 'VOW3.DE', undefined, 'Volkswagen', 'equity', 'Azioni Europa', 'Germania', 'EUR', 'Volkswagen|\\bVW\\b'),
  I('loreal', 'OR.PA', undefined, "L'Oréal", 'equity', 'Azioni Europa', 'Francia', 'EUR', "L'Or[ée]al"),
  I('iberdrola', 'IBE.MC', undefined, 'Iberdrola', 'equity', 'Azioni Europa', 'Spagna', 'EUR', 'Iberdrola'),
  I('inditex', 'ITX.MC', undefined, 'Inditex', 'equity', 'Azioni Europa', 'Spagna', 'EUR', 'Inditex|\\bZara\\b'),

  /* ---------------- Azioni Italia (FTSE MIB) ---------------- */
  I('eni', 'ENI.MI', undefined, 'Eni', 'equity', 'Azioni Italia', 'Italia', 'EUR', '\\bEni\\b', { cs: true }),
  I('enel', 'ENEL.MI', undefined, 'Enel', 'equity', 'Azioni Italia', 'Italia', 'EUR', '\\bEnel\\b'),
  I('intesa', 'ISP.MI', undefined, 'Intesa Sanpaolo', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Intesa Sanpaolo|\\bIntesa\\b'),
  I('unicredit', 'UCG.MI', undefined, 'UniCredit', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'UniCredit'),
  I('stellantis', 'STLAM.MI', undefined, 'Stellantis', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Stellantis'),
  I('generali', 'G.MI', undefined, 'Generali', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Generali'),
  I('ferrari', 'RACE.MI', undefined, 'Ferrari', 'equity', 'Azioni Italia', 'Italia', 'EUR', '\\bFerrari\\b'),
  I('stm', 'STMMI.MI', undefined, 'STMicroelectronics', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'STMicro'),
  I('prysmian', 'PRY.MI', undefined, 'Prysmian', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Prysmian'),
  I('leonardo', 'LDO.MI', undefined, 'Leonardo', 'equity', 'Azioni Italia', 'Italia', 'EUR', '\\bLeonardo\\b(?! da Vinci| DiCaprio)', { cs: true }),
  I('mediobanca', 'MB.MI', undefined, 'Mediobanca', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Mediobanca'),
  I('bancobpm', 'BAMI.MI', undefined, 'Banco BPM', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Banco ?BPM'),
  I('mps', 'BMPS.MI', undefined, 'Banca Monte dei Paschi', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Monte dei Paschi|\\bMps\\b'),
  I('poste', 'PST.MI', undefined, 'Poste Italiane', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Poste Italiane'),
  I('terna', 'TRN.MI', undefined, 'Terna', 'equity', 'Azioni Italia', 'Italia', 'EUR', '\\bTerna\\b'),
  I('snam', 'SRG.MI', undefined, 'Snam', 'equity', 'Azioni Italia', 'Italia', 'EUR', '\\bSnam\\b'),
  I('moncler', 'MONC.MI', undefined, 'Moncler', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Moncler'),
  I('campari', 'CPR.MI', undefined, 'Campari', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Campari'),
  I('tim', 'TIT.MI', undefined, 'Telecom Italia (TIM)', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Telecom Italia|\\bTIM\\b', { cs: true }),
  I('a2a', 'A2A.MI', undefined, 'A2A', 'equity', 'Azioni Italia', 'Italia', 'EUR', '\\bA2A\\b'),
  I('fineco', 'FBK.MI', undefined, 'FinecoBank', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Fineco'),
  I('tenaris', 'TEN.MI', undefined, 'Tenaris', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Tenaris'),
  I('saipem', 'SPM.MI', undefined, 'Saipem', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Saipem'),
  I('pirelli', 'PIRC.MI', undefined, 'Pirelli', 'equity', 'Azioni Italia', 'Italia', 'EUR', 'Pirelli'),
  I('nexi', 'NEXI.MI', undefined, 'Nexi', 'equity', 'Azioni Italia', 'Italia', 'EUR', '\\bNexi\\b'),

  /* ---------------- Azioni Asia ---------------- */
  I('tsmc', '2330.TW', undefined, 'TSMC', 'equity', 'Azioni Asia', 'Taiwan', 'TWD', '\\bTSMC\\b|Taiwan Semiconductor'),
  I('samsung', '005930.KS', undefined, 'Samsung Electronics', 'equity', 'Azioni Asia', 'Corea del Sud', 'KRW', 'Samsung'),
  I('toyota', '7203.T', undefined, 'Toyota', 'equity', 'Azioni Asia', 'Giappone', 'JPY', 'Toyota'),
  I('sony', '6758.T', undefined, 'Sony', 'equity', 'Azioni Asia', 'Giappone', 'JPY', '\\bSony\\b'),
  I('softbank', '9984.T', undefined, 'SoftBank Group', 'equity', 'Azioni Asia', 'Giappone', 'JPY', 'SoftBank'),
  I('tencent', '0700.HK', undefined, 'Tencent', 'equity', 'Azioni Asia', 'Cina', 'HKD', 'Tencent'),
  I('alibaba', '9988.HK', undefined, 'Alibaba', 'equity', 'Azioni Asia', 'Cina', 'HKD', 'Alibaba'),
  I('byd', '1211.HK', undefined, 'BYD', 'equity', 'Azioni Asia', 'Cina', 'HKD', '\\bBYD\\b'),
  I('reliance', 'RELIANCE.NS', undefined, 'Reliance Industries', 'equity', 'Azioni Asia', 'India', 'INR', 'Reliance Industries'),

  /* ---------------- ETF ---------------- */
  I('swda', 'SWDA.MI', undefined, 'iShares Core MSCI World (Acc)', 'etf', 'ETF UCITS (Borsa Italiana)', 'Globale', 'EUR', 'MSCI World'),
  I('vwce', 'VWCE.DE', undefined, 'Vanguard FTSE All-World (Acc)', 'etf', 'ETF UCITS (Borsa Italiana)', 'Globale', 'EUR', 'All[- ]World|\\bVWCE\\b'),
  I('csspx', 'CSSPX.MI', undefined, 'iShares Core S&P 500 (Acc)', 'etf', 'ETF UCITS (Borsa Italiana)', 'USA', 'EUR'),
  I('csndx', 'CSNDX.MI', undefined, 'iShares Nasdaq 100 (Acc)', 'etf', 'ETF UCITS (Borsa Italiana)', 'USA', 'EUR'),
  I('eimi', 'EIMI.MI', undefined, 'iShares Core MSCI EM IMI (Acc)', 'etf', 'ETF UCITS (Borsa Italiana)', 'Emergenti', 'EUR', 'MSCI (EM|Emerging)'),
  I('sgld', 'SGLD.MI', undefined, 'Invesco Physical Gold (ETC)', 'etf', 'ETF UCITS (Borsa Italiana)', 'Globale', 'EUR', undefined, { note: 'ETC: strumento garantito da oro fisico, non un fondo UCITS.' }),
  I('spy', 'SPY', 'spy.us', 'SPDR S&P 500 ETF', 'etf', 'ETF USA', 'USA', 'USD', '\\bSPY\\b', { cs: true }),
  I('qqq', 'QQQ', 'qqq.us', 'Invesco QQQ (Nasdaq 100)', 'etf', 'ETF USA', 'USA', 'USD', '\\bQQQ\\b', { cs: true }),
  I('vti', 'VTI', 'vti.us', 'Vanguard Total Stock Market', 'etf', 'ETF USA', 'USA', 'USD'),
  I('iwm', 'IWM', 'iwm.us', 'iShares Russell 2000', 'etf', 'ETF USA', 'USA', 'USD'),
  I('eem', 'EEM', 'eem.us', 'iShares MSCI Emerging Markets', 'etf', 'ETF USA', 'Emergenti', 'USD'),
  I('vgk', 'VGK', 'vgk.us', 'Vanguard FTSE Europe', 'etf', 'ETF USA', 'Europa', 'USD'),
  I('xlk', 'XLK', 'xlk.us', 'Technology Select Sector SPDR', 'etf', 'ETF settoriali USA', 'USA', 'USD'),
  I('xlf', 'XLF', 'xlf.us', 'Financial Select Sector SPDR', 'etf', 'ETF settoriali USA', 'USA', 'USD'),
  I('xle', 'XLE', 'xle.us', 'Energy Select Sector SPDR', 'etf', 'ETF settoriali USA', 'USA', 'USD'),
  I('xlv', 'XLV', 'xlv.us', 'Health Care Select Sector SPDR', 'etf', 'ETF settoriali USA', 'USA', 'USD'),
  I('arkk', 'ARKK', 'arkk.us', 'ARK Innovation ETF', 'etf', 'ETF settoriali USA', 'USA', 'USD', '\\bARKK\\b|Cathie Wood'),
  I('gld', 'GLD', 'gld.us', 'SPDR Gold Shares', 'etf', 'ETF su materie prime', 'Globale', 'USD', '\\bGLD\\b', { cs: true }),
  I('slv', 'SLV', 'slv.us', 'iShares Silver Trust', 'etf', 'ETF su materie prime', 'Globale', 'USD'),
  I('uso', 'USO', 'uso.us', 'United States Oil Fund', 'etf', 'ETF su materie prime', 'Globale', 'USD'),
  I('ibit', 'IBIT', 'ibit.us', 'iShares Bitcoin Trust (ETF spot)', 'etf', 'ETF su cripto', 'USA', 'USD', '\\bIBIT\\b|bitcoin ETFs?|ETF (spot )?(su )?bitcoin', { note: 'Negli USA; non acquistabile dagli investitori retail UE (mancanza del KID PRIIPs).' }),

  /* ---------------- Fondi comuni ---------------- */
  I('vfiax', 'VFIAX', undefined, 'Vanguard 500 Index Admiral', 'fund', 'Fondi comuni USA', 'USA', 'USD', undefined, { note: 'Fondo comune USA: NAV calcolato una volta al giorno a fine seduta.' }),
  I('fxaix', 'FXAIX', undefined, 'Fidelity 500 Index Fund', 'fund', 'Fondi comuni USA', 'USA', 'USD', undefined, { note: 'Fondo comune USA: NAV giornaliero.' }),
  I('vtsax', 'VTSAX', undefined, 'Vanguard Total Stock Market Admiral', 'fund', 'Fondi comuni USA', 'USA', 'USD', undefined, { note: 'Fondo comune USA: NAV giornaliero.' }),

  /* ---------------- Obbligazioni: rendimenti e ETF ---------------- */
  I('ust3m', '^IRX', undefined, 'Treasury USA 13 settimane', 'yield', 'Rendimenti titoli di Stato', 'USA', '%', 'T-?bills?'),
  I('ust5y', '^FVX', undefined, 'Treasury USA 5 anni', 'yield', 'Rendimenti titoli di Stato', 'USA', '%'),
  I('ust10y', '^TNX', '10usy.b', 'Treasury USA 10 anni', 'yield', 'Rendimenti titoli di Stato', 'USA', '%', '10-year (Treasury|yield|note)|Treasur(y|ies) yields?|rendimento (del )?Treasury'),
  I('ust30y', '^TYX', '30usy.b', 'Treasury USA 30 anni', 'yield', 'Rendimenti titoli di Stato', 'USA', '%', '30-year (Treasury|bond|yield)'),
  I('btp10y', undefined, '10ity.b', 'BTP 10 anni (rendimento)', 'yield', 'Rendimenti titoli di Stato', 'Italia', '%', '\\bBTP\\b|titoli di Stato italiani|Italian (bonds?|yields?|debt)', { cs: false }),
  I('btp2y', undefined, '2ity.b', 'BTP 2 anni (rendimento)', 'yield', 'Rendimenti titoli di Stato', 'Italia', '%'),
  I('bund10y', undefined, '10dey.b', 'Bund 10 anni (rendimento)', 'yield', 'Rendimenti titoli di Stato', 'Germania', '%', '\\bBunds?\\b|German (bonds?|yields?)'),
  I('bund2y', undefined, '2dey.b', 'Schatz 2 anni (rendimento)', 'yield', 'Rendimenti titoli di Stato', 'Germania', '%'),
  I('oat10y', undefined, '10fry.b', 'OAT 10 anni (rendimento)', 'yield', 'Rendimenti titoli di Stato', 'Francia', '%', '\\bOATs?\\b|French (bonds?|yields?)', { cs: true }),
  I('bono10y', undefined, '10esy.b', 'Bonos 10 anni (rendimento)', 'yield', 'Rendimenti titoli di Stato', 'Spagna', '%', '\\bBonos\\b'),
  I('gilt10y', undefined, '10uky.b', 'Gilt 10 anni (rendimento)', 'yield', 'Rendimenti titoli di Stato', 'Regno Unito', '%', '\\bgilts?\\b'),
  I('jgb10y', undefined, '10jpy.b', 'JGB 10 anni (rendimento)', 'yield', 'Rendimenti titoli di Stato', 'Giappone', '%', '\\bJGBs?\\b|Japanese (bonds?|yields?)'),
  I('tlt', 'TLT', 'tlt.us', 'iShares 20+ Year Treasury Bond', 'bond', 'ETF obbligazionari', 'USA', 'USD', '\\bTLT\\b', { cs: true }),
  I('agg', 'AGG', 'agg.us', 'iShares Core US Aggregate Bond', 'bond', 'ETF obbligazionari', 'USA', 'USD'),
  I('lqd', 'LQD', 'lqd.us', 'iShares iBoxx $ Investment Grade Corporate', 'bond', 'ETF obbligazionari', 'USA', 'USD', 'investment[- ]grade'),
  I('hyg', 'HYG', 'hyg.us', 'iShares iBoxx $ High Yield Corporate', 'bond', 'ETF obbligazionari', 'USA', 'USD', 'high[- ]yield|junk bonds?'),
  I('zn', 'ZN=F', undefined, 'Future Treasury Note 10 anni (CBOT)', 'bond', 'Future su titoli di Stato', 'USA', 'USD'),

  /* ---------------- Valute ---------------- */
  I('eurusd', 'EURUSD=X', 'eurusd', 'Euro / Dollaro USA', 'fx', 'Cambi principali', 'Globale', 'USD', 'EUR/?USD|euro[- ]dollaro|euro[- ]dollar'),
  I('gbpusd', 'GBPUSD=X', 'gbpusd', 'Sterlina / Dollaro USA', 'fx', 'Cambi principali', 'Globale', 'USD', 'GBP/?USD|\\bsterling\\b|sterlina|\\bcable\\b'),
  I('usdjpy', 'JPY=X', 'usdjpy', 'Dollaro USA / Yen', 'fx', 'Cambi principali', 'Globale', 'JPY', 'USD/?JPY|\\byen\\b'),
  I('usdchf', 'CHF=X', 'usdchf', 'Dollaro USA / Franco svizzero', 'fx', 'Cambi principali', 'Globale', 'CHF', 'USD/?CHF|Swiss franc|franco svizzero'),
  I('audusd', 'AUDUSD=X', 'audusd', 'Dollaro australiano / Dollaro USA', 'fx', 'Cambi principali', 'Globale', 'USD', 'AUD/?USD|Aussie dollar|dollaro australiano'),
  I('usdcad', 'CAD=X', 'usdcad', 'Dollaro USA / Dollaro canadese', 'fx', 'Cambi principali', 'Globale', 'CAD', 'USD/?CAD|loonie'),
  I('nzdusd', 'NZDUSD=X', 'nzdusd', 'Dollaro neozelandese / Dollaro USA', 'fx', 'Cambi principali', 'Globale', 'USD', 'NZD/?USD|kiwi dollar'),
  I('eurgbp', 'EURGBP=X', 'eurgbp', 'Euro / Sterlina', 'fx', 'Cambi dell\'euro', 'Globale', 'GBP', 'EUR/?GBP'),
  I('eurchf', 'EURCHF=X', 'eurchf', 'Euro / Franco svizzero', 'fx', 'Cambi dell\'euro', 'Globale', 'CHF', 'EUR/?CHF'),
  I('eurjpy', 'EURJPY=X', 'eurjpy', 'Euro / Yen', 'fx', 'Cambi dell\'euro', 'Globale', 'JPY', 'EUR/?JPY'),
  I('usdcny', 'CNY=X', 'usdcny', 'Dollaro USA / Yuan cinese', 'fx', 'Cambi emergenti', 'Cina', 'CNY', 'yuan|renminbi|\\bCNY\\b'),
  I('usdinr', 'INR=X', 'usdinr', 'Dollaro USA / Rupia indiana', 'fx', 'Cambi emergenti', 'India', 'INR', 'rupee|rupia'),
  I('usdbrl', 'BRL=X', 'usdbrl', 'Dollaro USA / Real brasiliano', 'fx', 'Cambi emergenti', 'Brasile', 'BRL', '\\breal brasiliano|Brazilian real'),
  I('usdtry', 'TRY=X', 'usdtry', 'Dollaro USA / Lira turca', 'fx', 'Cambi emergenti', 'Turchia', 'TRY', 'lira turca|Turkish lira'),
  I('usdmxn', 'MXN=X', 'usdmxn', 'Dollaro USA / Peso messicano', 'fx', 'Cambi emergenti', 'Messico', 'MXN', 'peso messicano|Mexican peso'),
  I('usdzar', 'ZAR=X', 'usdzar', 'Dollaro USA / Rand sudafricano', 'fx', 'Cambi emergenti', 'Sudafrica', 'ZAR', '\\brand\\b'),
  I('dxy', 'DX-Y.NYB', undefined, 'Indice del dollaro (DXY)', 'fx', 'Cambi principali', 'USA', 'pt', 'dollar index|\\bDXY\\b|indice del dollaro'),

  /* ---------------- Materie prime (future) ---------------- */
  I('gold', 'GC=F', 'xauusd', 'Oro', 'commodity', 'Metalli preziosi', 'Globale', 'USD', '\\bgold\\b|\\boro\\b|bullion|lingott'),
  I('silver', 'SI=F', 'xagusd', 'Argento', 'commodity', 'Metalli preziosi', 'Globale', 'USD', '\\bsilver\\b|\\bargento\\b'),
  I('platinum', 'PL=F', undefined, 'Platino', 'commodity', 'Metalli preziosi', 'Globale', 'USD', 'platinum|platino'),
  I('palladium', 'PA=F', undefined, 'Palladio', 'commodity', 'Metalli preziosi', 'Globale', 'USD', 'palladium|palladio'),
  I('copper', 'HG=F', undefined, 'Rame', 'commodity', 'Metalli industriali', 'Globale', 'USD', '\\bcopper\\b|\\brame\\b'),
  I('aluminium', 'ALI=F', undefined, 'Alluminio', 'commodity', 'Metalli industriali', 'Globale', 'USD', 'alumin(i)?um|alluminio'),
  I('wti', 'CL=F', 'cl.f', 'Petrolio WTI', 'commodity', 'Energia', 'Globale', 'USD', '\\bWTI\\b|crude oil|\\boil prices?\\b|petrolio|greggio|\\bOPEC'),
  I('brent', 'BZ=F', undefined, 'Petrolio Brent', 'commodity', 'Energia', 'Globale', 'USD', '\\bBrent\\b'),
  I('natgas', 'NG=F', 'ng.f', 'Gas naturale (Henry Hub)', 'commodity', 'Energia', 'USA', 'USD', 'natural gas|gas naturale|\\bLNG\\b|Henry Hub'),
  I('ttf', 'TTF=F', undefined, 'Gas naturale TTF (Europa)', 'commodity', 'Energia', 'Europa', 'EUR', '\\bTTF\\b|prezzo del gas'),
  I('gasoline', 'RB=F', undefined, 'Benzina RBOB', 'commodity', 'Energia', 'USA', 'USD', 'gasoline|benzina'),
  I('heatingoil', 'HO=F', undefined, 'Gasolio da riscaldamento', 'commodity', 'Energia', 'USA', 'USD', 'heating oil|diesel|gasolio'),
  I('wheat', 'ZW=F', undefined, 'Grano', 'commodity', 'Agricoli', 'Globale', 'USD', '\\bwheat\\b|\\bgrano\\b|frumento'),
  I('corn', 'ZC=F', undefined, 'Mais', 'commodity', 'Agricoli', 'Globale', 'USD', '\\bcorn\\b|\\bmais\\b'),
  I('soybeans', 'ZS=F', undefined, 'Soia', 'commodity', 'Agricoli', 'Globale', 'USD', 'soybeans?|\\bsoia\\b'),
  I('coffee', 'KC=F', undefined, 'Caffè (Arabica)', 'commodity', 'Agricoli', 'Globale', 'USD', '\\bcoffee\\b|\\bcaff[eè]\\b'),
  I('cocoa', 'CC=F', undefined, 'Cacao', 'commodity', 'Agricoli', 'Globale', 'USD', '\\bcocoa\\b|\\bcacao\\b'),
  I('sugar', 'SB=F', undefined, 'Zucchero', 'commodity', 'Agricoli', 'Globale', 'USD', '\\bsugar\\b|zucchero'),
  I('cotton', 'CT=F', undefined, 'Cotone', 'commodity', 'Agricoli', 'Globale', 'USD', '\\bcotton\\b|\\bcotone\\b'),
  I('cattle', 'LE=F', undefined, 'Bovini vivi', 'commodity', 'Agricoli', 'USA', 'USD', 'live cattle|bestiame'),

  /* ---------------- Derivati: future su indici e volatilità ---------------- */
  I('es', 'ES=F', undefined, 'Future E-mini S&P 500', 'future', 'Future su indici', 'USA', 'USD', 'S&P (500 )?futures|E-mini', { cs: false }),
  I('nq', 'NQ=F', undefined, 'Future E-mini Nasdaq 100', 'future', 'Future su indici', 'USA', 'USD', 'Nasdaq futures'),
  I('ym', 'YM=F', undefined, 'Future E-mini Dow', 'future', 'Future su indici', 'USA', 'USD', 'Dow futures'),
  I('rty', 'RTY=F', undefined, 'Future E-mini Russell 2000', 'future', 'Future su indici', 'USA', 'USD'),
  I('btcfut', 'BTC=F', undefined, 'Future Bitcoin (CME)', 'future', 'Future su cripto', 'USA', 'USD', 'CME bitcoin futures|bitcoin futures'),
  I('vix', '^VIX', undefined, 'VIX (volatilità S&P 500)', 'volatility', 'Indici di volatilità', 'USA', 'pt', '\\bVIX\\b|fear (index|gauge)|indice della paura', { cs: false }),
  I('vxn', '^VXN', undefined, 'VXN (volatilità Nasdaq 100)', 'volatility', 'Indici di volatilità', 'USA', 'pt'),
  I('move', '^MOVE', undefined, 'MOVE (volatilità Treasury)', 'volatility', 'Indici di volatilità', 'USA', 'pt', 'MOVE index'),

  /* ---------------- Criptovalute (principali; elenco esteso nella sezione Cripto) ---------------- */
  I('btc', 'BTC-USD', 'btcusd', 'Bitcoin', 'crypto', 'Criptovalute principali', 'Globale', 'USD', '\\bbitcoin\\b|\\bBTC\\b'),
  I('eth', 'ETH-USD', 'ethusd', 'Ethereum', 'crypto', 'Criptovalute principali', 'Globale', 'USD', '\\bethereum\\b|\\bether\\b|\\bETH\\b'),
  I('sol', 'SOL-USD', undefined, 'Solana', 'crypto', 'Criptovalute principali', 'Globale', 'USD', '\\bSolana\\b'),
  I('xrp', 'XRP-USD', undefined, 'XRP', 'crypto', 'Criptovalute principali', 'Globale', 'USD', '\\bXRP\\b|Ripple', { cs: true }),
  I('bnb', 'BNB-USD', undefined, 'BNB', 'crypto', 'Criptovalute principali', 'Globale', 'USD', '\\bBNB\\b', { cs: true }),
  I('ada', 'ADA-USD', undefined, 'Cardano', 'crypto', 'Criptovalute principali', 'Globale', 'USD', 'Cardano'),
  I('doge', 'DOGE-USD', undefined, 'Dogecoin', 'crypto', 'Criptovalute principali', 'Globale', 'USD', 'Dogecoin|\\bDOGE\\b'),

  /* ---------------- Immobiliare quotato e private markets ---------------- */
  I('vnq', 'VNQ', 'vnq.us', 'Vanguard Real Estate ETF', 'reit', 'REIT e immobiliare quotato', 'USA', 'USD', '\\bREITs?\\b'),
  I('realtyincome', 'O', undefined, 'Realty Income', 'reit', 'REIT e immobiliare quotato', 'USA', 'USD', 'Realty Income'),
  I('prologis', 'PLD', 'pld.us', 'Prologis', 'reit', 'REIT e immobiliare quotato', 'USA', 'USD', 'Prologis'),
  I('equinix', 'EQIX', 'eqix.us', 'Equinix', 'reit', 'REIT e immobiliare quotato', 'USA', 'USD', 'Equinix'),
  I('vonovia', 'VNA.DE', undefined, 'Vonovia', 'reit', 'REIT e immobiliare quotato', 'Germania', 'EUR', 'Vonovia'),
  I('blackstone', 'BX', 'bx.us', 'Blackstone', 'reit', 'Gestori di private markets', 'USA', 'USD', 'Blackstone'),
  I('kkr', 'KKR', 'kkr.us', 'KKR', 'reit', 'Gestori di private markets', 'USA', 'USD', '\\bKKR\\b', { cs: true }),
  I('apollo', 'APO', 'apo.us', 'Apollo Global Management', 'reit', 'Gestori di private markets', 'USA', 'USD', 'Apollo Global'),
];

export const INSTRUMENT_BY_ID: Record<string, InstrumentDef> = Object.fromEntries(INSTRUMENTS.map((i) => [i.id, i]));

/** Gruppi nell'ordine del catalogo (per tabelle e menu). */
export function groupsOf(filter: (i: InstrumentDef) => boolean): { group: string; items: InstrumentDef[] }[] {
  const out = new Map<string, InstrumentDef[]>();
  for (const i of INSTRUMENTS.filter(filter)) {
    if (!out.has(i.group)) out.set(i.group, []);
    out.get(i.group)!.push(i);
  }
  return [...out.entries()].map(([group, items]) => ({ group, items }));
}
