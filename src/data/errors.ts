/** Verstaendliche Saetze zu Fehlern des Browserspeichers. */

/**
 * Deutscher Satz zu einem Fehler aus der Datenbank.
 *
 * Dexie und IndexedDB melden englische Namen wie "DatabaseClosedError" oder
 * "QuotaExceededError". Ungefiltert stand so etwas in der Kurzmeldung: "Nicht
 * gespeichert: DatabaseClosedError Database has been closed." Die haeufigen
 * Faelle bekommen hier einen Satz, der auch sagt, was zu tun ist.
 *
 * Was nicht erkannt wird, behaelt seinen technischen Text. Der ist zwar
 * unverstaendlich, nennt aber die Ursache - besser als ein nichtssagender
 * Ersatzsatz, mit dem niemand weiterkommt.
 */
export function storageErrorText(error: unknown): string {
  if (!(error instanceof Error)) return 'Der Grund ist unbekannt.'

  switch (error.name) {
    case 'QuotaExceededError':
    case 'QuotaError':
      return 'Der Speicher dieses Browsers ist voll. Eine Sicherung anlegen und alte Einheiten löschen schafft Platz.'

    case 'MissingAPIError':
    case 'OpenFailedError':
    case 'InvalidStateError':
      return 'Dieser Browser lässt keinen Speicher zu. In einem privaten Fenster oder bei blockierten Website-Daten kann nichts gespeichert werden.'

    case 'DatabaseClosedError':
      return 'Die Datenbank wurde geschlossen. Die Seite neu laden und es noch einmal versuchen.'

    case 'VersionError':
      return 'Die App wurde in einem anderen Fenster aktualisiert. Die Seite neu laden.'

    case 'AbortError':
      return 'Das Speichern wurde abgebrochen. Die Seite neu laden und es noch einmal versuchen.'

    default:
      return error.message
  }
}
