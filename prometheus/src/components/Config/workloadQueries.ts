type WorkloadKind = 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'ReplicaSet';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deploymentHashPattern(length: number, exactLength: boolean) {
  // SafeEncodeString maps decimal digits 0-9 to these characters in order.
  const digits = '456789bcdf';
  const digit = `[${digits}]`;
  const nonzero = `[${digits.slice(1)}]`;
  if (length < 10) {
    if (length === 1) return digit;
    return exactLength
      ? `${nonzero}${digit}{${length - 1}}`
      : `(${digits[0]}|${nonzero}${digit}{0,${length - 1}})`;
  }

  const alternatives = exactLength ? [] : [digits[0], `${nonzero}${digit}{0,8}`];
  const maximum = '4294967295';
  let prefix = '';
  // Ten-digit hashes must not exceed the encoded uint32 maximum.
  for (let i = 0; i < maximum.length; i++) {
    const upper = Number(maximum[i]);
    const lower = i === 0 ? 1 : 0;
    if (upper > lower) {
      alternatives.push(`${prefix}[${digits.slice(lower, upper)}]${digit}{${9 - i}}`);
    }
    prefix += digits[upper];
  }
  alternatives.push(prefix);
  return `(${alternatives.join('|')})`;
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
  const shapes: string[] = [];
  if (available > 1) shapes.push(`${deploymentHashPattern(Math.min(10, available - 1), false)}-`);
  if (available <= 10) shapes.push(deploymentHashPattern(available, true));
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
