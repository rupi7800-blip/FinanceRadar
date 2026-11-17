import { SectionLayout } from '@/components/SectionLayout';
import { Card } from '@/components/ui';
import { NewsList } from '@/components/NewsCard';
import { listNews } from '@/lib/news';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Truffe e tutele' };

const SIGNS = [
  'Rendimenti "garantiti" e molto superiori a quelli di mercato: nessun investimento serio li promette.',
  'Contatto non richiesto (telefono, social, WhatsApp, app di incontri) da parte di un "consulente" o "trader".',
  'Pressione a decidere subito, segretezza, invito a non parlarne con familiari o con la banca.',
  'Richiesta di installare programmi di accesso remoto (AnyDesk, TeamViewer) o di inviare documenti e codici.',
  'Piattaforme che mostrano guadagni ma chiedono "tasse" o "commissioni di sblocco" per prelevare.',
  'Società non presenti negli albi Consob/Banca d\'Italia o con nomi quasi identici a intermediari veri (clonazione).',
  'Falsi articoli o video con volti di personaggi noti che "consigliano" una piattaforma: sono quasi sempre deepfake.',
  'Chi promette di recuperare i soldi persi in cambio di un anticipo: è spesso una seconda truffa.',
];

const CHECKS: [string, string, string][] = [
  ['Consob — "Occhio alle truffe!"', 'https://www.consob.it/web/area-pubblica/occhio-alle-truffe', 'Avvisi ai risparmiatori, società abusive e siti oscurati.'],
  ['Consob — albi ed elenchi degli intermediari', 'https://www.consob.it', 'Dalla home page: sezione "Albi ed elenchi" per verificare che chi ti offre investimenti sia autorizzato.'],
  ['Banca d\'Italia — albi ed elenchi', 'https://www.bancaditalia.it/compiti/vigilanza/albi-elenchi/', 'Banche, istituti di pagamento, intermediari finanziari.'],
  ['OAM — elenchi agenti e mediatori, operatori cripto', 'https://www.organismo-am.it', 'Agenti in attività finanziaria, mediatori creditizi, cambiavalute e operatori in valute virtuali.'],
  ['IOSCO I-SCAN', 'https://www.iosco.org/i-scan/', 'Avvisi delle autorità di vigilanza di tutto il mondo in un unico motore di ricerca.'],
  ['Arbitro per le Controversie Finanziarie (ACF)', 'https://www.acf.consob.it', 'Ricorso gratuito contro intermediari autorizzati per violazioni nei servizi d\'investimento.'],
];

export default function Truffe() {
  const official = listNews({ sourceCategory: ['investor-protection'], limit: 10 });
  const urgent = listNews({ q: 'scam OR fraud OR ponzi OR truffa OR frode OR abusivi OR phishing', limit: 10 });
  return (
    <SectionLayout id="truffe" disclaimer="Se sei vittima di una truffa: blocca i pagamenti con la tua banca, conserva prove (chat, bonifici, siti, numeri), sporgi denuncia alla Polizia Postale (commissariatodips.it) e segnala il sito alla Consob. Diffida di chi promette di recuperare i fondi a pagamento.">
      <Card title="Campanelli d'allarme">
        <ul className="grid gap-px bg-line sm:grid-cols-2">{SIGNS.map((s) => <li key={s} className="bg-panel px-4 py-2.5 text-sm">⚠ {s}</li>)}</ul>
      </Card>
      <Card title="Prima di investire, verifica qui">
        <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">{CHECKS.map(([n, u, d]) => <li key={n} className="bg-panel px-4 py-3 text-sm"><a href={u} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">{n} ↗</a><p className="text-xs text-mute">{d}</p></li>)}</ul>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Provvedimenti delle autorità (SEC, CFTC)"><NewsList items={official} compact empty="Nessun provvedimento recente." /></Card>
        <Card title="Truffe e frodi nelle notizie"><NewsList items={urgent} compact empty="Nessuna segnalazione recente." /></Card>
      </div>
    </SectionLayout>
  );
}
