import { KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

/** API group for the core Tinkerbell provisioning CRDs. */
export const TINKERBELL_API_GROUP = 'tinkerbell.org';

/** API version served by Tinkerbell v0.23.0 core provisioning CRDs. */
export const TINKERBELL_API_VERSION = `${TINKERBELL_API_GROUP}/v1alpha1`;

/** API group for Tinkerbell BMC management CRDs. */
export const TINKERBELL_BMC_API_GROUP = 'bmc.tinkerbell.org';

/** API version served by Tinkerbell v0.23.0 BMC CRDs. */
export const TINKERBELL_BMC_API_VERSION = `${TINKERBELL_BMC_API_GROUP}/v1alpha1`;

/**
 * Kubernetes-style condition status values.
 *
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#condition-v1-meta
 */
export type ConditionStatus = 'True' | 'False' | 'Unknown';

/**
 * Condition-like status entry used by Tinkerbell and BMC resources.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_workflows.yaml
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/bmc.tinkerbell.org_machines.yaml
 */
export interface TinkerbellCondition {
  /** Condition type, such as a readiness or execution state. */
  type?: string;

  /** Current condition status. */
  status?: ConditionStatus | string;

  /** Machine-readable reason for the current condition. */
  reason?: string;

  /** Human-readable message describing the condition. */
  message?: string;

  /** Time when this condition last changed. */
  lastTransitionTime?: Time;

  /** Observed generation for this condition, when reported. */
  observedGeneration?: number;

  /** Time when this condition was last updated, used by BMC CRDs. */
  lastUpdateTime?: Time;

  /** Time associated with the condition, used by Workflow CRDs. */
  time?: Time;
}

/**
 * Base interface for Tinkerbell custom resources.
 */
export interface TinkerbellResource extends KubeObjectInterface {
  /** Desired state written by users or automation. */
  spec?: Record<string, any>;

  /** Observed state written by Tinkerbell controllers. */
  status?: Record<string, any>;
}

/**
 * Reference that may include a namespace.
 *
 * This intentionally does not use the Kubernetes LocalObjectReference name
 * because Tinkerbell and BMC schemas may include namespace fields.
 */
export interface NamespacedObjectReference {
  /** Referenced object name. */
  name?: string;

  /** Referenced object namespace. */
  namespace?: string;
}

/**
 * Converts raw Tinkerbell state constants into user-facing labels.
 *
 * @param state - Raw state value from a Tinkerbell resource.
 * @returns A human-readable state label, or "Unknown" when absent.
 */
export function normalizeState(state: unknown): string {
  if (typeof state !== 'string' || !state) {
    return 'Unknown';
  }

  return state
    .replace(/^STATE_/, '')
    .toLowerCase()
    .replace(
      /(^|_)([a-z])/g,
      (_, separator: string, letter: string) =>
        `${separator === '_' ? ' ' : ''}${letter.toUpperCase()}`
    );
}
