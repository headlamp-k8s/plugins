import type { ResourceFlavorTaint, ResourceFlavorToleration, NodeLabels } from './resourceFlavor';

/** Render a ResourceFlavor's node label selector as a comma-separated key=value list. */
export function renderNodeLabels(nodeLabels?: NodeLabels) {
  const labels = Object.entries(nodeLabels || {});

  if (labels.length === 0) {
    return '-';
  }

  return labels.map(([key, value]) => `${key}=${value}`).join(', ');
}

/** Render a single ResourceFlavor node taint as `key=value:effect`. */
export function renderTaint(taint: ResourceFlavorTaint) {
  const value = taint.value ? `=${taint.value}` : '';

  return `${taint.key}${value}:${taint.effect}`;
}

/** Render a ResourceFlavor's node taints as a comma-separated list. */
export function renderTaints(taints?: ResourceFlavorTaint[]) {
  if (!taints || taints.length === 0) {
    return '-';
  }

  return taints.map(renderTaint).join(', ');
}

/** Render a single ResourceFlavor toleration as `key=value:effect (Ns)`. */
export function renderToleration(toleration: ResourceFlavorToleration) {
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

/** Render a ResourceFlavor's tolerations as a comma-separated list. */
export function renderTolerations(tolerations?: ResourceFlavorToleration[]) {
  if (!tolerations || tolerations.length === 0) {
    return '-';
  }

  return tolerations.map(renderToleration).join(', ');
}

/** Render a ResourceFlavor's topology name, falling back when the API omits the field. */
export function renderTopologyName(topologyName?: string) {
  return topologyName || '-';
}