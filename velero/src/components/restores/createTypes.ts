/** Backup phases Velero accepts as a Restore source. */
const RESTORABLE_BACKUP_PHASES = new Set(['Completed', 'PartiallyFailed']);

/** Keep backups a Restore can use. In-progress, failed, and deleting backups are omitted. */
export function restorableBackupNames(backups: Array<{ name: string; phase: string }>): string[] {
  return backups
    .filter(backup => RESTORABLE_BACKUP_PHASES.has(backup.phase))
    .map(backup => backup.name);
}

export type BackupSelection = {
  next: string;
  /** True only until the first discovered list has supplied a source, or a choice was cleared. */
  allowInitial: boolean;
};

/**
 * Next Backup source for the Create Restore form.
 * The first discovered list may fill an empty selection once.
 * After that, an empty selection stays empty, including when a chosen backup disappears.
 * An empty list keeps a typed name, because backup discovery may be unavailable.
 */
export function nextBackupSelection(
  current: string,
  backups: string[],
  allowInitial: boolean
): BackupSelection {
  if (!current) {
    if (allowInitial && backups.length > 0) {
      return { next: backups[0], allowInitial: false };
    }
    return { next: '', allowInitial };
  }
  if (backups.length === 0 || backups.includes(current)) {
    return { next: current, allowInitial: false };
  }
  return { next: '', allowInitial: false };
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
