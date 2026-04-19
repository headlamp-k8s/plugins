import { ContainerSpec, LifecyclePolicy, TaskSpec } from '../../resources/job';

type DetailRow = {
  name: string;
  value: string | number;
};

/**
 * Formats a list of strings for display in Job details rows.
 *
 * @param values String values to display.
 * @returns Comma-separated string or `-` when empty.
 */
export function formatStringList(values?: string[]) {
  return values && values.length > 0 ? values.join(', ') : '-';
}

/**
 * Formats a string/number map for display in Job details rows.
 *
 * @param values Key-value map to display.
 * @returns Comma-separated string or `-` when empty.
 */
export function formatKeyValueMap(values?: Record<string, string | number>) {
  if (!values || Object.keys(values).length === 0) {
    return '-';
  }

  return Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}

/**
 * Formats container ports for display in Job details rows.
 *
 * @param ports Container ports to display.
 * @returns Comma-separated port definitions or `-` when empty.
 */
export function formatContainerPorts(ports?: ContainerSpec['ports']) {
  if (!ports || ports.length === 0) {
    return '-';
  }

  return ports
    .map(port => {
      const name = port?.name ? `${port.name}: ` : '';
      const number = port?.containerPort ?? '-';
      const protocol = port?.protocol ?? 'TCP';
      return `${name}${number}/${protocol}`;
    })
    .join(', ');
}

function formatEnvVars(env?: ContainerSpec['env']) {
  if (!env || env.length === 0) {
    return '-';
  }

  return env
    .map(variable => {
      if (variable.value !== undefined) {
        return `${variable.name}=${variable.value}`;
      }

      if (variable.valueFrom) {
        return `${variable.name}=<valueFrom>`;
      }

      return variable.name;
    })
    .join(', ');
}

/**
 * Builds detail rows for a Volcano Job lifecycle policy.
 *
 * @param policy Job lifecycle policy.
 * @returns Detail rows describing the policy.
 */
export function getPolicyRows(policy: LifecyclePolicy): DetailRow[] {
  const rows: DetailRow[] = [];

  if (policy.action !== undefined) {
    rows.push({ name: 'Action', value: policy.action || '-' });
  }

  if (policy.event !== undefined) {
    rows.push({ name: 'Event', value: policy.event || '-' });
  }

  if (policy.events !== undefined) {
    rows.push({
      name: 'Events',
      value: policy.events.length ? policy.events.join(', ') : '-',
    });
  }

  if (policy.exitCode !== undefined) {
    rows.push({ name: 'Exit Code', value: policy.exitCode });
  }

  if (policy.timeout !== undefined) {
    rows.push({ name: 'Timeout', value: policy.timeout || '-' });
  }

  return rows;
}

/**
 * Builds detail rows for a task container.
 *
 * @param container Task container definition.
 * @returns Detail rows describing the container.
 */
export function getTaskContainerRows(container: ContainerSpec): DetailRow[] {
  return [
    { name: 'Name', value: container.name || '-' },
    { name: 'Image', value: container.image || '-' },
    { name: 'Image Pull Policy', value: container.imagePullPolicy || '-' },
    { name: 'Command', value: formatStringList(container.command) },
    { name: 'Args', value: formatStringList(container.args) },
    { name: 'Environment', value: formatEnvVars(container.env) },
    { name: 'Ports', value: formatContainerPorts(container.ports) },
    { name: 'Resource Requests', value: formatKeyValueMap(container.resources?.requests) },
    { name: 'Resource Limits', value: formatKeyValueMap(container.resources?.limits) },
    { name: 'Working Dir', value: container.workingDir || '-' },
  ];
}

/**
 * Builds detail rows for a Volcano Job task.
 *
 * @param task Task definition shown in the details page.
 * @param index Task index used as a fallback label.
 * @returns Detail rows describing the task.
 */
export function getTaskRows(task: TaskSpec, index: number): DetailRow[] {
  return [
    { name: 'Name', value: task.name || `Task ${index + 1}` },
    { name: 'Replicas', value: task.replicas },
    { name: 'Min Available', value: task.minAvailable ?? task.replicas },
    { name: 'Max Retry', value: task.maxRetry ?? '-' },
    { name: 'Restart Policy', value: task.template?.spec?.restartPolicy || '-' },
    {
      name: 'Image Pull Secrets',
      value: formatStringList(
        task.template?.spec?.imagePullSecrets
          ?.map(secret => secret.name || '')
          .filter(secretName => secretName)
      ),
    },
    {
      name: 'Template Annotations',
      value: formatKeyValueMap(task.template?.metadata?.annotations),
    },
    {
      name: 'Template Creation Timestamp',
      value: task.template?.metadata?.creationTimestamp || '-',
    },
  ];
}
