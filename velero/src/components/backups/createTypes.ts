/** Form values for creating a Velero Backup (Phase 4). */
export interface BackupCreateInput {
  name: string;
  includedNamespaces: string[];
  excludedNamespaces: string[];
  includedResources: string[];
  excludedResources: string[];
  storageLocation: string;
  ttl: string;
  snapshotVolumes: boolean;
  /** When true, use FS/kopia path (PodVolumeBackup) instead of relying on CSI only. */
  defaultVolumesToFsBackup: boolean;
}

export interface BackupCreateFormProps {
  namespaces: string[];
  storageLocations: string[];
  onSubmit: (values: BackupCreateInput) => Promise<void>;
  onCancel: () => void;
}
