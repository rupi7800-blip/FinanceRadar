# FINANCE RADAR — *I mercati finanziari, sotto controllo*

Piattaforma web installabile (PWA) di informazione, monitoraggio e approfondimento su **tutti gli strumenti finanziari**, in italiano: azioni e indici, titoli di Stato e obbligazioni, ETF e fondi, valute, materie prime, derivati, criptovalute, immobiliare e private markets, macroeconomia e banche centrali, risparmio e previdenza, regole e fisco, truffe e tutele.

Raccoglie notizie e dati da fonti ufficiali e testate internazionali, li traduce, raggruppa gli articoli sullo stesso evento, ne valuta l'affidabilità in modo trasparente e li presenta in 14 sezioni tematiche, più mercati, schede strumento, guida agli strumenti, watchlist, avvisi, ricerca e archivio.

> Nessun dato viene inventato: se una fonte non risponde, l'interfaccia lo dice e mostra l'ultimo dato valido marcato come **non aggiornato**. Le quotazioni di borsa sono **ritardate** (in genere 15–20 minuti) e sempre etichettate con fonte e orario.

Stessa architettura di Crypto Radar: chi conosce quel progetto ritrova scheduler, affidabilità, AI, traduzione, avvisi, PWA e versione statica identici.

---

## 1. Avvio rapido

Requisiti: **Node.js ≥ 22.13** (usa il modulo SQLite integrato `node:sqlite`, nessun database esterno).

```bash
npm install
cp .env.example .env        # imposta almeno ADMIN_PASSWORD (FRED_API_KEY consigliata)
npm run build
npm start                   # http://localhost:3000
```

Sviluppo: `npm run dev`. Con Docker: `docker compose up -d --build` (il database resta in `./data`).

Al primo avvio lo scheduler registra le fonti e inizia subito l'acquisizione: notizie e quotazioni compaiono entro pochi minuti.

---

## 2. Due modi di farla funzionare da GitHub

### A) Versione statica su GitHub Pages (gratuita, già configurata)
Il workflow `.github/workflows/pages.yml` ogni 30 minuti raccoglie notizie e quotazioni, le traduce e (se ci sono chiavi AI) le analizza, genera il sito e lo pubblica su `https://<utente>.github.io/<repository>/`.

**Attivazione (una volta):**
1. Repository → **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
2. (Consigliato) **Settings → Secrets and variables → Actions → New repository secret**: `CONTACT_EMAIL`, `FRED_API_KEY`, `MYMEMORY_EMAIL` e almeno una chiave AI (`GEMINI_API_KEY` o `GROQ_API_KEY` hanno piani gratuiti; oppure `ANTHROPIC_API_KEY`).
3. **Actions → "Pubblica su GitHub Pages" → Run workflow** per la prima pubblicazione (poi parte da sola).

**Nessuna chiave a pagamento è necessaria**: quotazioni (Yahoo Finance → Stooq), BCE, Tesoro USA, Banca Mondiale e CoinPaprika sono gratuiti e senza registrazione. FRED è gratuita con registrazione.

GitHub Pages da un repository **privato** richiede un piano a pagamento; con un repository pubblico è gratuito, così come i minuti di Actions. Con un repository privato riduci la frequenza (riga `cron` del workflow, es. `'7 */3 * * *'`).

| Funzione | Versione statica |
|---|---|
| Notizie, sezioni, mercati, schede strumento, curve, spread, macro | ✅ aggiornati ogni ~30 min |
| Prezzi cripto principali | ✅ in tempo reale nel browser via Binance WebSocket (se raggiungibile) |
| Grafici (1 mese–5 anni), ricerca, filtri, watchlist | ✅ nel browser (watchlist salvata sul dispositivo) |
| Analisi AI | ✅ generate automaticamente per gli eventi principali; ❌ su richiesta |
| Avvisi | ✅ controllati nel browser **solo mentre l'app è aperta**; ❌ push in background |
| Pannello admin | ❌ — fonti in `src/lib/sources/catalog.ts`, strumenti in `src/lib/instruments/catalog.ts` |

Prova in locale: `npm run ingest && NEXT_PUBLIC_BASE_PATH=/FinanceRadar npm run build:static` → cartella `out/`.

### B) App completa con server
Tutte le funzioni (admin, push in background, AI su richiesta, aggiornamento continuo). **Render** (`render.yaml` incluso, piano Starter con disco ~7 $/mese) oppure Railway / Fly.io / VPS con il `Dockerfile` e un volume su `/app/data`.

---

## 3. Contenuti

| Sezione | Cosa contiene |
|---|---|
| **Radar** (home) | Mercati in sintesi, spread BTP–Bund, tasso BCE, inflazione, ampiezza del mercato, VIX, notizie più importanti, migliori/peggiori, movimenti anomali, briefing AI |
| **Mercati** | Tutti i 216 strumenti per classe, variazioni (oggi, settimana, mese, da inizio anno, anno), range a 52 settimane, classifiche, anomalie |
| **Azioni & Indici** | 22 indici mondiali; titoli USA, Europa, Italia (FTSE MIB), Asia |
| **Obbligazioni** | Rendimenti BTP, Bund, OAT, Bonos, Gilt, JGB, Treasury; spread BTP–Bund con storico; spread verso il Bund; curva Treasury ufficiale e curva BCE dell'area euro; ETF obbligazionari |
| **ETF & Fondi** | ETF UCITS su Borsa Italiana, ETF USA, settoriali, su materie prime e cripto, fondi comuni; come leggere un ETF |
| **Valute** | Cambi principali ed emergenti, indice del dollaro, cambi di riferimento ufficiali BCE |
| **Materie prime** | Energia (WTI, Brent, gas Henry Hub e TTF), metalli preziosi e industriali, agricoli; rapporto oro/argento |
| **Derivati** | Future su indici, VIX/VXN/MOVE, base del future, limiti ESMA sulla leva |
| **Cripto** | Principali cripto, ETF spot, top 100 CoinPaprika, Fear & Greed |
| **Macro & Banche centrali** | Tassi BCE, €STR, Euribor, inflazione HICP (area euro, Italia, Germania, Francia, Spagna), dati USA (FRED), economie a confronto (Banca Mondiale) |
| **Imprese & Bilanci** | Trimestrali, fusioni e acquisizioni, IPO, dividendi e buyback |
| **Risparmio & Previdenza** | Rendimenti di riferimento contro inflazione (reali), basi della pianificazione |
| **Immobiliare & Private** | REIT, gestori di private markets, Euribor e mutui |
| **Regole & Fisco** | Comunicazioni delle autorità, tassazione delle rendite in Italia, chi vigila su cosa |
| **Analisi & Esperti** | Economisti, accademici, gestori, ricercatori di banche centrali con conflitti d'interesse dichiarati; confronto AI delle opinioni |
| **Truffe & Tutele** | Campanelli d'allarme, dove verificare (Consob, Banca d'Italia, OAM, IOSCO), provvedimenti SEC/CFTC |
| **Guida agli strumenti** | 52 strumenti spiegati (conti e buoni postali, BOT/BTP/CCT, corporate, high yield, subordinate, azioni, fondi, ETF, ETC/ETN, ELTIF, PIR, fondi pensione, polizze, future, opzioni, certificati, CFD, swap, forex, oro, immobili, private equity, crowdfunding, cripto…): cos'è, come funziona, rischio, costi, **tasse in Italia**, dove si compra |
| **Scheda strumento** | Prezzo, variazioni, range, volatilità e massimo ribasso a 1 anno, grafico 1M–5A, notizie collegate, strumenti simili |

Il catalogo strumenti (`src/lib/instruments/catalog.ts`) si estende aggiungendo una riga con simbolo Yahoo e/o Stooq.

---

## 4. Credenziali

Tutte nel file `.env` sul server (mai nel frontend) o nei Secrets di GitHub. Stato visibile in **Admin → Configurazione**.

| Variabile | Necessità | A cosa serve | Come ottenerla |
|---|---|---|---|
| `ADMIN_PASSWORD` | **obbligatoria** (app completa) | accesso a `/admin` | scegline una lunga |
| `SESSION_SECRET` | consigliata | firma delle sessioni admin | `openssl rand -hex 32` |
| `CONTACT_EMAIL` | consigliata | User-Agent richiesto dalla SEC | il tuo indirizzo |
| `FRED_API_KEY` | consigliata | dati USA: Fed Funds, CPI, PCE, disoccupazione, PIL, spread HY, mutui | fred.stlouisfed.org → API Keys (gratis) |
| `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `GROQ_API_KEY` / `MISTRAL_API_KEY` / `OPENAI_API_KEY` / `OPENROUTER_API_KEY` / `OLLAMA_URL` | almeno una per l'AI | traduzione AI, analisi, briefing, confronto esperti, glossario | console dei fornitori (Gemini, Groq, Mistral, OpenRouter hanno piani gratuiti; Ollama è locale) |
| `MYMEMORY_EMAIL` | facoltativa | quota di traduzione gratuita 50.000 caratteri/giorno | nessuna registrazione |
| `VAPID_*` | facoltativa | notifiche push | generate automaticamente |
| `CRON_SECRET` | facoltativa | scheduler esterno | stringa casuale |

---

## 5. Fonti integrate

Elenco completo con livello di affidabilità, gruppo editoriale, conflitti d'interesse, limiti e stato in tempo reale nella pagina **/fonti**.

**Testate internazionali:** CNBC, MarketWatch, Wall Street Journal, Financial Times, Bloomberg, The Economist, Yahoo Finance, Nasdaq.com, Investing.com, Seeking Alpha, FXStreet, OilPrice, MINING.COM, ETF Trends, The Real Deal, TechCrunch Venture, CoinDesk, Cointelegraph.
**Testate italiane:** Il Sole 24 Ore (Finanza, Economia), ANSA Economia, Corriere Economia, la Repubblica Economia, Investing.com Italia, Wall Street Italia, Money.it, FIRSTonline.
**Banche centrali e organismi:** BCE (comunicati e blog), Federal Reserve (comunicati e discorsi), Bank of England, Bank of Japan, FMI.
**Statistiche ufficiali:** BLS, BEA, ISTAT.
**Autorità:** SEC, CFTC, ESMA, FCA; tutela investitori: SEC litigation releases, provvedimenti CFTC.
**Esperti:** Aswath Damodaran, Liberty Street Economics (Fed di New York), VoxEU/CEPR, lavoce.info, Econopoly, Calculated Risk, Lyn Alden, Ben Carlson, Barry Ritholtz, Noah Smith, Apricitas Economics, Joachim Klement, Marginal Revolution.
**Community (mai usata come conferma):** Reddit r/investing, r/stocks, r/ItaliaPersonalFinance.
**Dati:** Yahoo Finance (quotazioni mondiali, ritardate) → Stooq (riserva automatica e rendimenti dei titoli di Stato europei); BCE Data Portal (tassi, €STR, Euribor, HICP, curva euro, cambi di riferimento); Tesoro USA (curva Treasury); Banca Mondiale (indicatori per Paese); FRED (con chiave gratuita); CoinPaprika e Alternative.me (cripto); Binance WebSocket (prezzi cripto live nel browser).

### Valutate e non integrate (motivo)
| Servizio | Motivo |
|---|---|
| Reuters, Associated Press | nessun feed RSS pubblico per l'uso da parte di terzi |
| Borsa Italiana / Euronext dati in tempo reale | dati di borsa in tempo reale a pagamento (licenza dei mercati) |
| Bloomberg, Refinitiv/LSEG, FactSet | terminali e API a pagamento |
| Alpha Vantage, Twelve Data, Polygon, Finnhub, FMP | chiave obbligatoria e piani gratuiti molto limitati (25–800 richieste/giorno): integrabili in seguito come riserva |
| CoinGecko | piano gratuito con chiave obbligatoria e limiti stretti: CoinPaprika copre le stesse esigenze senza chiave |
| Rendimenti BTP ufficiali giornalieri (MEF/Banca d'Italia) | nessuna API pubblica giornaliera; la BCE pubblica i rendimenti per Paese solo su base mensile |
| Calendario macro ed earnings | nessuna fonte gratuita autorizzata con API |
| Morningstar (rating fondi) | dati proprietari a pagamento |
| X/Twitter, Telegram | API a pagamento o monitoraggio di canali di terzi non consentito |

Yahoo Finance espone un endpoint pubblico per i grafici che non è documentato ufficialmente: per questo ogni quotazione ha la riserva Stooq e il fallimento di un singolo simbolo non blocca gli altri.

---

## 6. Architettura

```
src/
  lib/
    instruments/catalog.ts  216 strumenti: simboli Yahoo/Stooq, classe, gruppo, Paese, valuta, alias per le notizie
    instruments/guide.ts    guida a 52 strumenti finanziari (contenuto editoriale)
    market/                 fornitori (Yahoo → Stooq), calcolo variazioni, serie 1 anno e 5 anni, anomalie, spread
    macro/                  BCE, Tesoro USA, Banca Mondiale, FRED
    classify.ts             sezioni, strumenti citati, segnali (urgente, indiscrezione, smentita, previsione, sponsorizzato)
    reliability.ts          stati CONFERMATA / PARZIALE / NON VERIFICATA / SMENTITA con motivazioni
    ai/ translate.ts        AI multi-fornitore con fallback, budget, cache; traduzione
    alerts.ts clientAlerts  avvisi su livelli, variazioni, spread, anomalie e notizie (server e browser)
    scheduler.ts            job periodici, backup giornaliero
  app/                      pagine (sezioni, strumento/[id], strumenti, mercato…) e API REST
  components/               tabelle quotazioni, grafici SVG, curve dei rendimenti, ticker, ricerca, admin
```

**Next.js 15 + TypeScript + Tailwind**, **SQLite** integrato, grafici SVG senza librerie.

**Aggiornamento (app completa, modificabile da Admin → Job):** notizie ogni minuto (ogni fonte con la sua frequenza); quotazioni 5 min; cripto 10 min; BCE e Tesoro USA 3 h; FRED 6 h; serie a 5 anni 12 h; Banca Mondiale 24 h; traduzioni 2 min; avvisi 1 min.

---

## 7. Sicurezza

Identica a Crypto Radar: chiavi solo lato server e mai nei log, admin con password a confronto costante, limite di tentativi e sessione HMAC, protezione CSRF e rate limiting, input validati con Zod, SQL parametrizzato, nessun HTML esterno renderizzato, feed XML senza DTD, protezione SSRF, contenuti esterni trattati come non attendibili dall'AI, backup giornaliero.

---

## 8. Verifiche eseguite

Nell'ambiente di sviluppo (rete filtrata) sono stati verificati: controllo dei tipi, build dell'app completa e della versione statica (313 pagine), tutte le pagine a larghezza smartphone senza scorrimento orizzontale né errori nel browser, watchlist e avvisi lato browser, ricerca, grafici, raccolta reale di notizie (CoinDesk, Cointelegraph, BCE, SEC) e dati cripto (CoinPaprika), gestione degli errori quando Yahoo, Stooq, BCE, Tesoro USA e Banca Mondiale non sono raggiungibili. **Non** è stato possibile verificare dal vivo le quotazioni Yahoo/Stooq e le API BCE/Tesoro/Banca Mondiale (bloccate dalla rete di test): la prima esecuzione su GitHub Actions o sul tuo server lo farà; lo stato di ogni fonte è in **/fonti** e gli strumenti non aggiornati sono elencati in fondo alla pagina **/mercato**.

---

⚖ *Finance Radar ha scopo informativo. Nessun contenuto costituisce consulenza finanziaria, legale o fiscale né sollecitazione all'investimento. Ogni investimento comporta rischi, inclusa la perdita del capitale.*
