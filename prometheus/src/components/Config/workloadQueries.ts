type WorkloadKind = 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'ReplicaSet';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function podPattern(kind: WorkloadKind, name: string) {
  if (kind === 'StatefulSet') return `${escapeRegex(name)}-[0-9]+`;

  // Kubernetes truncates generateName prefixes to 58 characters before adding five random characters.
  const prefix = `${name}-`;
  const suffix = '[bcdfghjklmnpqrstvwxz2456789]{5}';
  if (kind !== 'Deployment' || prefix.length >= 58) {
    return `${escapeRegex(prefix.slice(0, 58))}${suffix}`;
  }

  // Deployments add a decimal-derived ReplicaSet hash (up to ten characters) before the Pod suffix.
  const available = 58 - prefix.length;
  // SafeEncodeString maps decimal hash digits to this subset of the random-name alphabet.
  const hash = '[456789bcdf]';
  const shapes: string[] = [];
  if (available > 1) shapes.push(`${hash}{1,${Math.min(10, available - 1)}}-`);
  if (available <= 10) shapes.push(`${hash}{${available}}`);
  return `${escapeRegex(prefix)}(${shapes.join('|')})${suffix}`;
}

export function getWorkloadQueries(kind: WorkloadKind, namespace: string, name: string) {
  const labels = `namespace=${JSON.stringify(namespace)},pod=~${JSON.stringify(
    podPattern(kind, name)
  )}`;
  const rate = (metric: string, extraLabels = '') =>
    `sum(rate(${metric}{${extraLabels}${labels}}[1m])) by (namespace)`;
  return {
    cpuQuery: rate('container_cpu_usage_seconds_total', "container!='',"),
    memoryQuery: `sum(container_memory_working_set_bytes{container!='',${labels}}) by (namespace)`,
    networkRxQuery: rate('container_network_receive_bytes_total'),
    networkTxQuery: rate('container_network_transmit_bytes_total'),
    filesystemReadQuery: rate('container_fs_reads_bytes_total', "container!='',"),
    filesystemWriteQuery: rate('container_fs_writes_bytes_total', "container!='',"),
  };
}
