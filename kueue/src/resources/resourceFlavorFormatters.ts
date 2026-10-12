/** Node taint entry used by ResourceFlavor node selection. */
export interface ResourceFlavorTaintLike {
  /** Taint key applied to matching nodes. */
  key: string;
  /** Optional taint value. */
  value?: string;
  /** Taint effect; Kueue evaluates NoSchedule and NoExecute. */
  effect: string;
}

/** Extra pod toleration entry added to workloads admitted with a ResourceFlavor. */
export interface ResourceFlavorTolerationLike {
  /** Toleration key. Empty key with Exists matches all taint keys. */
  key?: string;
  /** Relationship between the key and value, such as Equal or Exists. */
  operator?: string;
  /** Toleration value matched against the taint value. */
  value?: string;
  /** Taint effect tolerated by this entry. */
  effect?: string;
  /** Time period in seconds for which a NoExecute taint is tolerated. */
  tolerationSeconds?: number;
}

/** Render a Kubernetes node label map as compact "key=value" detail text. */
export function renderNodeLabels(nodeLabels: Record<string, string>) {
  const labels = Object.entries(nodeLabels);

  if (labels.length === 0) {
    return '-';
  }

  return labels.map(([key, value]) => `${key}=${value}`).join(', ');
}

/** Render all node taints for a ResourceFlavor as compact detail text. */
export function renderTaints(taints: ResourceFlavorTaintLike[]) {
  if (taints.length === 0) {
    return '-';
  }

  return taints.map(renderTaint).join(', ');
}

/** Render one node taint entry as "key=value:effect". */
export function renderTaint(taint: ResourceFlavorTaintLike) {
  const value = taint.value ? `=${taint.value}` : '';

  return `${taint.key}${value}:${taint.effect}`;
}

/** Render all extra tolerations for a ResourceFlavor as compact detail text. */
export function renderTolerations(tolerations: ResourceFlavorTolerationLike[]) {
  if (tolerations.length === 0) {
    return '-';
  }

  return tolerations.map(renderToleration).join(', ');
}

/**
 * Render one toleration entry as "key=value:effect (Ns)".
 *
 * An empty/omitted key renders as "*" (matches all taint keys, the standard
 * Kubernetes convention for a key-less toleration). When `operator` is
 * `Exists`, any configured `value` is ignored for display, matching how the
 * Kubernetes API itself treats `value` as meaningless for that operator even
 * if a manifest sets both (this is technically an invalid combination, but
 * the API does not reject it).
 */
export function renderToleration(toleration: ResourceFlavorTolerationLike) {
  const key = toleration.key || '*';
  const value =
    toleration.operator === 'Exists' || toleration.value === undefined
      ? ''
      : `=${toleration.value}`;
  const effect = toleration.effect ? `:${toleration.effect}` : '';
  const seconds =
    toleration.tolerationSeconds === undefined ? '' : ` (${toleration.tolerationSeconds}s)`;

  return `${key}${value}${effect}${seconds}`;
}