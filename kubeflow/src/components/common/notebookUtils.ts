import { StatusLabelProps } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { ChipProps } from '@mui/material/Chip';

/**
 * Normalizes HTTP/API errors encountered during resource fetching into
 * user-friendly UI strings ('Not authorized', 'Not installed', etc).
 */
export function describeResourceError(error: any): string | null {
  if (!error) return null;

  const status = typeof error === 'object' && error !== null ? (error as any).status : undefined;
  if (status === 401 || status === 403) return 'Not authorized';
  if (status === 404) return 'Not installed';
  return 'Unavailable';
}

/**
 * UI metadata derived from a Kubeflow Notebook custom resource.
 *
 * @see {@link https://github.com/kubeflow/manifests/blob/master/applications/jupyter/notebook-controller/upstream/crd/bases/kubeflow.org_notebooks.yaml | Kubeflow Notebook CRD}
 */
export interface NotebookStatus {
  /** Human-readable status text shown in notebook tables and badges. */
  label: string;
  /** Headlamp status variant used to color the rendered status badge. */
  status: StatusLabelProps['status'];
  /** Iconify icon name paired with the derived notebook state. */
  icon: string;
  /** Optional controller reason or message surfaced in a tooltip. */
  reason?: string;
}

/**
 * Display metadata inferred from a Kubeflow Notebook image reference.
 *
 * @see {@link https://github.com/kubeflow/manifests/blob/master/applications/jupyter/notebook-controller/upstream/crd/bases/kubeflow.org_notebooks.yaml | Kubeflow Notebook CRD}
 */
export interface NotebookType {
  /** User-facing notebook flavor label. */
  label: string;
  /** Iconify icon name associated with the notebook flavor. */
  icon: string;
  /** Theme color used when rendering the notebook flavor badge. */
  color: ChipProps['color'];
}

/**
 * Derives a human-readable status from a Notebook's jsonData (i.e. the raw `.status` object).
 * Always pass `item?.jsonData` (not the item wrapper).
 *
 * @see {@link https://github.com/kubeflow/manifests/blob/master/applications/jupyter/notebook-controller/upstream/crd/bases/kubeflow.org_notebooks.yaml | Kubeflow Notebook CRD}
 */
export function getNotebookStatus(jsonData: any): NotebookStatus {
  const conditions = jsonData?.status?.conditions || [];
  const readyReplicas = jsonData?.status?.readyReplicas;
  const containerState = jsonData?.status?.containerState || {};

  if (readyReplicas && readyReplicas > 0) {
    return { label: 'Running', status: 'success', icon: 'mdi:check-circle' };
  }

  const failedCond = conditions.find((c: any) => c.type === 'Failed' && c.status === 'True');
  if (failedCond) {
    return {
      label: 'Failed',
      status: 'error',
      icon: 'mdi:alert-circle',
      reason: failedCond.reason || failedCond.message,
    };
  }

  // Check for waiting container state (ImagePullBackOff, CrashLoopBackOff, etc.)
  if (containerState?.waiting) {
    const reason = containerState.waiting.reason || 'Waiting';
    const isError =
      reason.includes('BackOff') || reason.includes('Error') || reason.includes('ErrImage');
    return {
      label: reason,
      status: isError ? 'error' : '',
      icon: isError ? 'mdi:alert-circle' : 'mdi:clock-outline',
      reason: containerState.waiting.message,
    };
  }

  // Check conditions for explicit waiting/error states
  const waitingCond = conditions.find((c: any) => c.type === 'Waiting' && c.status === 'True');
  if (waitingCond) {
    const reason = waitingCond.reason || 'Waiting';
    const isError =
      reason.includes('BackOff') || reason.includes('Error') || reason.includes('ErrImage');
    return {
      label: reason,
      status: isError ? 'error' : '',
      icon: isError ? 'mdi:alert-circle' : 'mdi:clock-outline',
      reason: waitingCond.message,
    };
  }

  const runningCond = conditions.find(
    (c: any) => (c.type === 'Running' || c.type === 'Ready') && c.status === 'True'
  );
  if (runningCond) {
    return { label: 'Running', status: 'success', icon: 'mdi:check-circle' };
  }

  if (containerState?.terminated) {
    return {
      label: containerState.terminated.reason || 'Terminated',
      status: 'error',
      icon: 'mdi:stop-circle',
      reason: `Exit code: ${containerState.terminated.exitCode}`,
    };
  }

  if (conditions.length > 0) {
    const lastCond = conditions[conditions.length - 1];
    return { label: lastCond.type || 'Pending', status: '', icon: 'mdi:clock-outline' };
  }

  return { label: 'Pending', status: '', icon: 'mdi:clock-outline' };
}

/**
 * Derives the notebook type (Jupyter / VS Code / RStudio / Custom) from a container image string.
 *
 * @see {@link https://github.com/kubeflow/manifests/blob/master/applications/jupyter/notebook-controller/upstream/crd/bases/kubeflow.org_notebooks.yaml | Kubeflow Notebook CRD}
 */
export function getNotebookType(image: string | undefined | null): NotebookType {
  const lower = (image || '').toLowerCase();
  if (
    lower.includes('jupyter') ||
    lower.includes('scipy') ||
    lower.includes('tensorflow') ||
    lower.includes('pytorch')
  ) {
    return { label: 'Jupyter', icon: 'mdi:language-python', color: 'warning' };
  }
  if (lower.includes('code') || lower.includes('vscode') || lower.includes('codeserver')) {
    return { label: 'VS Code', icon: 'mdi:microsoft-visual-studio-code', color: 'info' };
  }
  if (lower.includes('rstudio') || lower.includes('tidyverse')) {
    return { label: 'RStudio', icon: 'mdi:language-r', color: 'secondary' };
  }
  return { label: 'Custom', icon: 'mdi:cube-outline', color: 'default' };
}

/**
 * UI metadata derived from a Kubeflow Profile custom resource.
 *
 * @see {@link https://github.com/kubeflow/manifests/blob/master/applications/profiles/upstream/crd/bases/kubeflow.org_profiles.yaml | Kubeflow Profile CRD}
 */
export interface ProfileStatus {
  /** Human-readable profile status label shown in tables and detail views. */
  label: string;
  /** Headlamp status variant used to style the profile status badge. */
  status: StatusLabelProps['status'];
  /** Iconify icon name paired with the derived profile state. */
  icon: string;
  /** Optional controller message surfaced when the profile is not ready. */
  reason?: string;
}

/**
 * Derives a human-readable status from a Profile's jsonData.
 * Always pass `item?.jsonData` (not the item wrapper).
 *
 * @see {@link https://github.com/kubeflow/manifests/blob/master/applications/profiles/upstream/crd/bases/kubeflow.org_profiles.yaml | Kubeflow Profile CRD}
 */
export function getProfileStatus(jsonData: any): ProfileStatus {
  const conditions = jsonData?.status?.conditions || [];

  if (conditions.length === 0) {
    return { label: 'Active', status: 'success', icon: 'mdi:check-circle' };
  }

  const readyCond = conditions.find((c: any) => c.type === 'Ready');
  if (readyCond) {
    const isReady = readyCond.status === 'True';
    return {
      label: isReady ? 'Ready' : 'Not Ready',
      status: isReady ? 'success' : 'error',
      icon: isReady ? 'mdi:check-circle' : 'mdi:alert-circle',
      reason: !isReady ? readyCond.message : undefined,
    };
  }

  const lastCond = conditions[conditions.length - 1];
  return {
    label: lastCond?.type || 'Unknown',
    status: '',
    icon: 'mdi:clock-outline',
  };
}

export const MEMORY_TO_GI_MULTIPLIER: Record<string, number> = {
  Ki: 1 / (1024 * 1024),
  Mi: 1 / 1024,
  Gi: 1,
  Ti: 1024,
  K: 1000 / 1024 ** 3,
  M: 1000 ** 2 / 1024 ** 3,
  G: 1000 ** 3 / 1024 ** 3,
  T: 1000 ** 4 / 1024 ** 3,
};

export function parseCpuQuantity(value: unknown): number {
  const quantity = `${value ?? '0'}`.trim();
  if (!quantity) {
    return 0;
  }
  if (quantity.endsWith('m')) {
    const milliCores = Number.parseFloat(quantity.slice(0, -1));
    return Number.isFinite(milliCores) ? milliCores / 1000 : 0;
  }
  const cores = Number.parseFloat(quantity);
  return Number.isFinite(cores) ? cores : 0;
}

export function parseMemoryQuantity(value: unknown): number {
  const quantity = `${value ?? '0'}`.trim();
  if (!quantity) {
    return 0;
  }
  const match = quantity.match(/^([0-9]*\.?[0-9]+)(Ki|Mi|Gi|Ti|K|M|G|T)?$/);
  if (!match) {
    return 0;
  }
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) {
    return 0;
  }
  const unit = match[2] || '';
  if (unit === '') {
    return amount / 1024 ** 3; // Treat unit-less as bytes
  }
  return amount * (MEMORY_TO_GI_MULTIPLIER[unit] ?? 0);
}

export function aggregateNotebookResources(notebooks: any[]) {
  return notebooks.reduce(
    (acc, nb) => {
      // Accommodate both wrapped and unwrapped items
      const spec = nb?.jsonData?.spec ?? nb?.spec;
      const containers = spec?.template?.spec?.containers || [];
      containers.forEach((container: any) => {
        const requests = container?.resources?.requests || {};
        acc.cpu += parseCpuQuantity(requests.cpu);
        acc.memory += parseMemoryQuantity(requests.memory);
        const limits = container?.resources?.limits || {};
        const requestedGpu =
          requests['nvidia.com/gpu'] ??
          requests['amd.com/gpu'] ??
          limits['nvidia.com/gpu'] ??
          limits['amd.com/gpu'] ??
          '0';
        acc.gpu += Number.parseInt(`${requestedGpu}`, 10) || 0;
      });
      return acc;
    },
    { cpu: 0, memory: 0, gpu: 0 }
  );
}
