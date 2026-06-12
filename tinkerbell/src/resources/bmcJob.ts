import { KubeObject, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  NamespacedObjectReference,
  TINKERBELL_BMC_API_VERSION,
  TinkerbellCondition,
  TinkerbellResource,
} from './common';

/** Fully qualified CRD name for Tinkerbell BMC Job resources. */
export const BMC_JOB_CRD_NAME = 'jobs.bmc.tinkerbell.org';

/**
 * Desired job configuration for BMC operations.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/bmc.tinkerbell.org_jobs.yaml
 */
export interface BmcJobSpec {
  /** Machine that this job targets. */
  machineRef?: NamespacedObjectReference;

  /** Tasks requested by this job. */
  tasks?: Record<string, any>[];
}

/** Observed status for a BMC Job object. */
export interface BmcJobStatus {
  /** Time when the job completed. */
  completionTime?: Time;

  /** Condition list reported by the BMC controller. */
  conditions?: TinkerbellCondition[];

  /** Time when the job started. */
  startTime?: Time;
}

/** Kubernetes object shape for a Tinkerbell BMC Job resource. */
export interface TinkerbellBmcJob extends TinkerbellResource {
  /** Desired BMC job configuration. */
  spec?: BmcJobSpec;

  /** Observed BMC job status. */
  status?: BmcJobStatus;
}

/**
 * Headlamp resource model for Tinkerbell BMC Job.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/bmc.tinkerbell.org_jobs.yaml
 */
export class BmcJob extends KubeObject<TinkerbellBmcJob> {
  static readonly apiName = 'jobs';
  static readonly apiVersion = TINKERBELL_BMC_API_VERSION;
  static readonly crdName = BMC_JOB_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Job';

  static get detailsRoute() {
    return '/tinkerbell/bmc/jobs/:namespace/:name';
  }

  get spec(): BmcJobSpec | undefined {
    return this.jsonData.spec;
  }

  get status(): BmcJobStatus | undefined {
    return this.jsonData.status;
  }
}
