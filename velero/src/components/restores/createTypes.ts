/** Backup phases Velero accepts as a Restore source. */
const RESTORABLE_BACKUP_PHASES = new Set(['Completed', 'PartiallyFailed']);

/** Keep backups a Restore can use. In-progress, failed, and deleting backups are omitted. */
export function restorableBackupNames(backups: Array<{ name: string; phase: string }>): string[] {
  return backups
    .filter(backup => RESTORABLE_BACKUP_PHASES.has(backup.phase))
    .map(backup => backup.name);
}

/**
 * Next Backup source for the Create Restore form.
 * An empty selection takes the first available name when the list arrives.
 * A selection that disappears is cleared so the form does not switch to another backup.
 * An empty list keeps a typed name, because namespace discovery may be unavailable.
 */
export function nextBackupSelection(current: string, backups: string[]): string {
  if (!current) {
    return backups[0] ?? '';
  }
  if (backups.length === 0 || backups.includes(current)) {
    return current;
  }
  return '';
}

/** Values submitted by the Create Restore form. */
export interface RestoreCreateInput {
  /** DNS-1123 name of the Restore in the Velero namespace. */
  name: string;
  /** Name of the Backup this restore reads. */
  backupName: string;
  /** Namespaces to restore. Empty lets Velero restore every namespace in the backup. */
  includedNamespaces: string[];
  /** Namespaces in the backup to leave unrestored. */
  excludedNamespaces: string[];
  /** When true, also restore persistent volumes from the backup. */
  restorePVs: boolean;
}

/** Props for the Create Restore form. Backup names are already limited to restorable phases. */
export interface RestoreCreateFormProps {
  /** Completed or PartiallyFailed backup names on the destination cluster. */
  backups: string[];
  /** Namespace names the user may pick. Typed names are also accepted. */
  namespaces: string[];
  /** Initial backup selection when the form opens. */
  defaultBackupName?: string;
  onSubmit: (values: RestoreCreateInput) => Promise<void>;
  onCancel: () => void;
}
