/** Form values for creating a Velero Schedule (Phase 4). */
export interface ScheduleCreateInput {
  name: string;
  schedule: string;
  includedNamespaces: string[];
  excludedNamespaces: string[];
  ttl: string;
  paused: boolean;
}

export interface ScheduleCreateFormProps {
  namespaces: string[];
  onSubmit: (values: ScheduleCreateInput) => Promise<void>;
  onCancel: () => void;
}
