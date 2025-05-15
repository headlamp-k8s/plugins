import { FalcoEvent } from '../types/FalcoEvent';

/**
 * Format Falco event time (RFC3339 or nanosecond epoch) to human readable string.
 * @param ev - Falco event object
 * @returns Human-readable time string
 */
export function formatFalcoTime(ev: FalcoEvent): string {
  // Try ev.time (RFC3339)
  if (ev.time) {
    const d = new Date(ev.time);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }
  }
  // Try output_fields["evt.time"] (nanoseconds since epoch)
  const ns = ev.output_fields?.['evt.time'];
  if (typeof ns === 'number' || (typeof ns === 'string' && ns.length > 10)) {
    const ms = Math.floor(Number(ns) / 1e6);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }
  }
  return ev.time || ev.output_fields?.['evt.time'] || '';
}

/**
 * Checks if a string is a valid Kubernetes resource name.
 * @param name - String to validate
 * @returns Boolean indicating if the string is a valid Kubernetes resource name
 */
export function isValidK8sName(name: any): boolean {
  // Allow dots in resource names (Kubernetes DNS subdomain spec)
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    name.length <= 253 &&
    /^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(name)
  );
}

/**
 * Extract the namespace from a Falco event, using multiple fallback strategies.
 * @param ev - Falco event object
 * @returns Namespace string
 */
export function getNamespace(ev: FalcoEvent): string {
  // 1. Try standard fields
  const ns =
    ev.k8s_ns_name ||
    ev.output_fields?.['k8s.ns.name'] ||
    ev.k8s_ns ||
    ev.output_fields?.['k8s_ns'] ||
    ev.output_fields?.['ka.target.namespace'] ||
    '';
  if (ns && ns !== 'N/A') return ns;

  // 2. Try to extract from container_name field (k8s_<container>_<pod>_<namespace>_<uid>_<N>)
  const cname = ev.output_fields?.['container.name'] || ev.container_name || '';
  const cnameMatch = cname.match(/^k8s_[^_]+_[^_]+_([^_]+)_[^_]+_\d+$/);
  if (cnameMatch && cnameMatch[1]) {
    return cnameMatch[1];
  }

  // 3. Try to extract from output/msg using stricter regex
  const msg = ev.output || ev.msg || '';
  const patterns = [
    /namespace[_:=\s]+([a-z0-9-]{3,})\b/i,
    /ns[_:=\s]+([a-z0-9-]{3,})\b/i,
    /namespace['"]?:?\s*([a-z0-9-]{3,})\b/i,
  ];
  for (const pat of patterns) {
    const m = msg.match(pat);
    if (m && m[1] && m[1] !== 'default') {
      return m[1];
    }
  }
  return 'N/A';
}

/**
 * Extracts the Kubernetes resource source from a Falco event.
 * Returns { kind, name, namespace } if available.
 */
export function getK8sSource(ev: FalcoEvent): { kind: string; name: string; namespace: string } {
  const of = ev.output_fields || {};
  // k8s_audit: use ka.target.resource, ka.target.name, ka.target.namespace
  if (ev.source === 'k8s_audit') {
    const kind = of['ka.target.resource'] || '';
    const name = of['ka.target.name'] || of['ka.resp.name'] || '';
    const namespace = of['ka.target.namespace'] || '';
    if (kind && name) return { kind, name, namespace };
    // fallback: service creation events
    if (of['ka.req.pod.name'] && of['ka.req.pod.namespace']) {
      return { kind: 'pod', name: of['ka.req.pod.name'], namespace: of['ka.req.pod.namespace'] };
    }
  }
  // syscall: treat as pod
  if (ev.source === 'syscall') {
    const name = of['k8s.pod.name'] || '';
    const namespace = of['k8s.ns.name'] || '';
    if (name) return { kind: 'pod', name, namespace };
    // fallback: parse from container.name
    const cname = of['container.name'] || ev.container_name || '';
    const match = cname.match(/^k8s_[^_]+_([^_]+)_([^_]+)_[^_]+_[^_]+$/);
    if (match && match[1] && match[2]) return { kind: 'pod', name: match[1], namespace: match[2] };
  }
  // Try generic resource/name/ns fields (common in Falco output)
  const genericKind = of['resource'] || '';
  const genericName =
    of['pod'] ||
    of['serviceaccount'] ||
    of['configmap'] ||
    of['secret'] ||
    of['deployment'] ||
    of['daemonset'] ||
    of['statefulset'] ||
    of['job'] ||
    of['cronjob'] ||
    '';
  const genericNs = of['ns'] || '';
  if (genericKind && genericName)
    return { kind: genericKind, name: genericName, namespace: genericNs };
  // fallback: legacy pod fields
  const name = ev.k8s_pod_name || ev.k8s_pod || of['k8s_pod'] || '';
  const namespace = ev.k8s_ns_name || ev.k8s_ns || of['k8s_ns'] || '';
  if (name) return { kind: 'pod', name, namespace };
  return { kind: '', name: '', namespace: '' };
}

/**
 * Get username from Falco event (supports k8s_audit and syscall)
 * @param ev - Falco event object
 * @returns Username string
 */
export function getEventUser(ev: FalcoEvent): string {
  if (ev.source === 'k8s_audit') {
    return ev.output_fields?.['ka.user.name'] || 'N/A';
  }
  if (ev.source === 'syscall') {
    // Try user.name, fallback to user field, fallback to N/A
    return ev.output_fields?.['user.name'] || ev.output_fields?.['user'] || 'N/A';
  }
  return 'N/A';
}

/**
 * Truncate a string to a maximum length, adding ellipsis if needed.
 * @param str - Input string
 * @param max - Maximum length (default 60)
 * @returns Truncated string
 */
export function truncate(str: string, max = 60): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

/**
 * Convert a plural kind to singular, lowercase form
 * @param kind - The kind to convert
 * @returns Singular, lowercase kind name
 */
export function singularizeKind(kind: string): string {
  if (kind.endsWith('s')) return kind.slice(0, -1).toLowerCase();
  return kind.toLowerCase();
}

/**
 * Helper function to get severity color
 * @param sev - Severity string
 * @returns Color hex code for the severity
 */
export function getSeverityColor(sev: string): string {
  switch ((sev || '').toLowerCase()) {
    case 'emergency':
      return '#C62828';
    case 'alert':
      return '#D32F2F';
    case 'critical':
      return '#E53935';
    case 'error':
      return '#FF5252';
    case 'warning':
      return '#FB8C00';
    case 'notice':
      return '#1976D2';
    case 'informational':
    case 'info':
      return '#03A9F4';
    case 'debug':
      return '#29B6F6';
    default:
      return '#555';
  }
}

/**
 * Helper function to get a color for a tag.
 * @param tag - The tag to get a color for.
 * @returns The color for the tag.
 */
export function getTagColor(tag: string): string {
  // Assign common tags fixed colors
  const palette: Record<string, string> = {
    k8s: '#1976D2',
    container: '#43A047',
    shell: '#6D4C41',
    mitre_execution: '#8E24AA',
    maturity_stable: '#00897B',
    t1059: '#C62828',
    privileged: '#FB8C00',
    syscall: '#3949AB',
    k8s_audit: '#00838F',
    network: '#039BE5',
    file: '#757575',
    process: '#7B1FA2',
    default: '#607D8B',
  };
  const lower = tag.toLowerCase();
  if (palette[lower]) return palette[lower];
  // Otherwise, generate a color hash
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate pastel color
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 60%)`;
}
