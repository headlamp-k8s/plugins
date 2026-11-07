/** Form values for creating a Velero Restore (Phase 4). */
export interface RestoreCreateInput {
  name: string;
  backupName: string;
  includedNamespaces: string[];
  excludedNamespaces: string[];
  restorePVs: boolean;
}

export interface RestoreCreateFormProps {
  backups: string[];
  namespaces: string[];
  defaultBackupName?: string;
  onSubmit: (values: RestoreCreateInput) => Promise<void>;
  onCancel: () => void;
}
