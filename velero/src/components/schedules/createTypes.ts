/** Values submitted by the Create Schedule form. */
export interface ScheduleCreateInput {
  /** DNS-1123 name of the Schedule in the Velero namespace. */
  name: string;
  /** Velero cron expression or @every duration. */
  schedule: string;
  /** Namespaces each scheduled backup includes. Empty means all namespaces. */
  includedNamespaces: string[];
  /** Namespaces each scheduled backup leaves out. */
  excludedNamespaces: string[];
  /** TTL applied to backups this schedule creates, for example 720h0m0s. */
  ttl: string;
  /** When true, the schedule is created paused. */
  paused: boolean;
}

/** Props for the Create Schedule form. Namespace options are scoped to one cluster. */
export interface ScheduleCreateFormProps {
  /** Namespace names the user may pick. Typed names are also accepted. */
  namespaces: string[];
  onSubmit: (values: ScheduleCreateInput) => Promise<void>;
  onCancel: () => void;
}
