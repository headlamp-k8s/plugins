import { KubeObject, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { TINKERBELL_BMC_API_VERSION, TinkerbellCondition, TinkerbellResource } from './common';

/** Fully qualified CRD name for Tinkerbell BMC Task resources. */
export const BMC_TASK_CRD_NAME = 'tasks.bmc.tinkerbell.org';

/**
 * Desired task configuration for a direct BMC operation.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/bmc.tinkerbell.org_tasks.yaml
 */
export interface BmcTaskSpec {
  /** BMC connection configuration used by this task. */
  connection?: Record<string, any>;

  /** Operation requested by this task. */
  task?: Record<string, any>;
}

/** Observed status for a BMC Task object. */
export interface BmcTaskStatus {
  /** Time when the task completed. */
  completionTime?: Time;

  /** Condition list reported by the BMC controller. */
  conditions?: TinkerbellCondition[];

  /** Time when the task started. */
  startTime?: Time;
}

/** Kubernetes object shape for a Tinkerbell BMC Task resource. */
export interface TinkerbellBmcTask extends TinkerbellResource {
  /** Desired BMC task configuration. */
  spec?: BmcTaskSpec;

  /** Observed BMC task status. */
  status?: BmcTaskStatus;
}

/**
 * Headlamp resource model for Tinkerbell BMC Task.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/bmc.tinkerbell.org_tasks.yaml
 */
export class BmcTask extends KubeObject<TinkerbellBmcTask> {
  static readonly apiName = 'tasks';
  static readonly apiVersion = TINKERBELL_BMC_API_VERSION;
  static readonly crdName = BMC_TASK_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Task';

  static get detailsRoute() {
    return '/tinkerbell/bmc/tasks/:namespace/:name';
  }

  get spec(): BmcTaskSpec | undefined {
    return this.jsonData.spec;
  }

  get status(): BmcTaskStatus | undefined {
    return this.jsonData.status;
  }
}
