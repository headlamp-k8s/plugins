/** True when the chosen storage location is no longer in the discovered list. */
export function isUnavailableStorageLocation(selected: string, available: string[]): boolean {
  return selected !== '' && !available.includes(selected);
}

/** Whether Create Backup forces kopia file backup or leaves Velero's server default. */
export type FsBackupChoice = 'server' | 'on' | 'off';

/**
 * Map the form control to spec.defaultVolumesToFsBackup.
 * `undefined` means omit the field so `--default-volumes-to-fs-backup` still applies.
 */
export function fsBackupChoiceToSpec(choice: FsBackupChoice): boolean | undefined {
  if (choice === 'server') {
    return undefined;
  }
  return choice === 'on';
}

/** Values submitted by the Create Backup form. */
export interface BackupCreateInput {
  /** DNS-1123 name of the Backup in the Velero namespace. */
  name: string;
  /** Namespaces to include. Empty lets Velero include all namespaces. */
  includedNamespaces: string[];
  /** Namespaces to leave out of this backup. */
  excludedNamespaces: string[];
  /** Resource kinds to include, such as pods. Empty lets Velero include all kinds. */
  includedResources: string[];
  /** Resource kinds to leave out of this backup. */
  excludedResources: string[];
  /**
   * BackupStorageLocation name. Empty omits spec.storageLocation so Velero
   * uses its configured default.
   */
  storageLocation: string;
  /** How long Velero keeps the backup, for example 720h0m0s. */
  ttl: string;
  /** When true, request CSI volume snapshots. */
  snapshotVolumes: boolean;
  /**
   * Pod volume file backup (kopia). Undefined omits the field so the server
   * default applies. True forces it on, false forces it off.
   */
  defaultVolumesToFsBackup?: boolean;
}

/** Props for the Create Backup form. Lookups are already scoped to one cluster. */
export interface BackupCreateFormProps {
  /** Namespace names the user may pick. Typed names are also accepted. */
  namespaces: string[];
  /** BackupStorageLocation names. Empty still allows Velero's default. */
  storageLocations: string[];
  onSubmit: (values: BackupCreateInput) => Promise<void>;
  onCancel: () => void;
}
