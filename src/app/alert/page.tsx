import { PageHeader, Card } from '@/components/ui';
import AlertManager from '@/components/AlertManager';
import { ALERT_TYPES } from '@/lib/alerts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notifiche e alert' };

export default function Alert() {
  return (
    <div className="space-y-4">
      <PageHeader title="Notifiche e alert" desc="Livelli di prezzo, variazioni, spread BTP–Bund, movimenti anomali, notizie urgenti, banche centrali, regole, truffe ed esperti" color="#f97316" />
      <AlertManager types={ALERT_TYPES} />
      <Card title="Come funzionano">
        <ul className="list-disc space-y-1 p-4 pl-8 text-sm text-mute">
          <li>Le regole vengono valutate ogni minuto sui dati più recenti acquisiti dal server (le quotazioni sono aggiornate periodicamente e, per le borse, con il ritardo della fonte: non tick per tick).</li>
          <li>Per evitare notifiche ripetitive: una sola notifica per evento (anche se riportato da più fonti), massimo una per regola a ogni ciclo, e un periodo di silenzio configurabile per ogni regola.</li>
          <li>Le notifiche push funzionano quando il browser/dispositivo le supporta (su iPhone/iPad occorre prima installare l&apos;app nella schermata Home). In ogni caso le trovi nel centro notifiche 🔔.</li>
        </ul>
      </Card>
    </div>
  );
}
