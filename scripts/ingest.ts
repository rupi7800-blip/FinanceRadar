/**
 * Raccolta dati "una tantum" per la versione statica (eseguita da GitHub Actions prima della build).
 * Avvio: npx tsx --conditions=react-server scripts/ingest.ts
 * Usa esattamente gli stessi job dell'app completa; il database persiste tra un'esecuzione e l'altra tramite la cache di Actions.
 */
import { seedSources } from '../src/lib/sources/registry';
import { runJob, JOBS, jobFrequency } from '../src/lib/scheduler';
import { run, get, getCache } from '../src/lib/db';

const ORDER = ['quotes', 'news', 'crypto', 'feargreed', 'ecb', 'uscurve', 'worldbank', 'fred', 'series5y', 'breaking', 'translate', 'translate', 'translate', 'ai_auto', 'briefing'];

async function main() {
  const t0 = Date.now();
  seedSources();
  run("UPDATE ingest_runs SET finished_at = ?, ok = 0, error = 'interrotto' WHERE finished_at IS NULL", new Date().toISOString());
  // conservazione: in versione statica bastano 30 giorni di archivio
  const keep = Number(process.env.ARCHIVE_RETENTION_DAYS || 30);
  run('DELETE FROM articles WHERE published_at < ?', new Date(Date.now() - keep * 86400e3).toISOString());
  run('DELETE FROM api_log WHERE at < ?', new Date(Date.now() - 7 * 86400e3).toISOString().replace('T', ' ').slice(0, 19));
  run('DELETE FROM ingest_runs WHERE started_at < ?', new Date(Date.now() - 7 * 86400e3).toISOString());
  for (const id of ORDER) {
    const s = Date.now();
    // i job lenti (serie a 5 anni, BCE, Banca Mondiale…) non vanno ripetuti a ogni pubblicazione: si rispetta la loro frequenza
    const job = JOBS.find((j) => j.id === id);
    const lastOk = get<{ started_at: string }>('SELECT started_at FROM ingest_runs WHERE job = ? AND ok = 1 ORDER BY id DESC LIMIT 1', id)?.started_at;
    if (job && jobFrequency(job) >= 3 * 3600 && lastOk && Date.now() - Date.parse(lastOk) < jobFrequency(job) * 1000) {
      console.log(`${id.padEnd(12)} non necessario (ultimo aggiornamento ${Math.round((Date.now() - Date.parse(lastOk)) / 60000)} min fa)`);
      continue;
    }
    const r = await runJob(id).catch((e: Error) => ({ ok: false, error: e.message }));
    const label = 'skipped' in r ? 'saltato (disattivato o senza chiave)' : r.ok ? `ok (${(r as { items?: number }).items ?? 0})` : `ERRORE: ${(r as { error?: string }).error}`;
    console.log(`${id.padEnd(12)} ${label} — ${Date.now() - s} ms`);
  }
  // riepilogo degli errori di quotazione, raggruppati per motivo (utile per capire quale fonte non risponde)
  const groups = new Map<string, number>();
  for (const e of getCache<string[]>('market:quote_errors').value ?? []) {
    const reason = e.replace(/^[a-z0-9]+: /, '').replace(/\([^)]*\)/g, '').slice(0, 160);
    groups.set(reason, (groups.get(reason) ?? 0) + 1);
  }
  for (const [reason, n] of [...groups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  errore quotazioni x${n}: ${reason}`);
  console.log(`Raccolta completata in ${Math.round((Date.now() - t0) / 1000)} s`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
