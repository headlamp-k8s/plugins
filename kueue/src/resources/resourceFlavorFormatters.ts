import type { NodeLabels, ResourceFlavorTaint, ResourceFlavorToleration } from './resourceFlavor';

export function renderNodeLabels(nodeLabels: NodeLabels) {
  const labels = Object.entries(nodeLabels);

  if (labels.length === 0) {
    return '-';
  }

  return labels.map(([key, value]) => `${key}=${value}`).join(', ');
}

export function renderTaints(taints: ResourceFlavorTaint[]) {
  if (taints.length === 0) {
    return '-';
  }

  return taints.map(renderTaint).join(', ');
}

export function renderTaint(taint: ResourceFlavorTaint) {
  const value = taint.value ? `=${taint.value}` : '';

  return `${taint.key}${value}:${taint.effect}`;
}

export function renderTolerations(tolerations: ResourceFlavorToleration[]) {
  if (tolerations.length === 0) {
    return '-';
  }

  return tolerations.map(renderToleration).join(', ');
}

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
