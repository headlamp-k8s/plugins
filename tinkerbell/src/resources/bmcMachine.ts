import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { TINKERBELL_BMC_API_VERSION, TinkerbellCondition, TinkerbellResource } from './common';

/** Fully qualified CRD name for Tinkerbell BMC Machine resources. */
export const BMC_MACHINE_CRD_NAME = 'machines.bmc.tinkerbell.org';

/**
 * Desired connection details for a BMC controlled machine.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/bmc.tinkerbell.org_machines.yaml
 */
export interface BmcMachineSpec {
  /** BMC connection configuration such as host, credentials, and provider data. */
  connection?: Record<string, any>;
}

/** Observed status for a BMC Machine object. */
export interface BmcMachineStatus {
  /** Condition list reported by the BMC controller. */
  conditions?: TinkerbellCondition[];

  /** Current power state of the physical machine. */
  powerState?: string;
}

/** Kubernetes object shape for a Tinkerbell BMC Machine resource. */
export interface TinkerbellBmcMachine extends TinkerbellResource {
  /** Desired BMC machine configuration. */
  spec?: BmcMachineSpec;

  /** Observed BMC machine status. */
  status?: BmcMachineStatus;
}

/**
 * Headlamp resource model for Tinkerbell BMC Machine.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/bmc.tinkerbell.org_machines.yaml
 */
export class BmcMachine extends KubeObject<TinkerbellBmcMachine> {
  static readonly apiName = 'machines';
  static readonly apiVersion = TINKERBELL_BMC_API_VERSION;
  static readonly crdName = BMC_MACHINE_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Machine';

  static get detailsRoute() {
    return '/tinkerbell/bmc/machines/:namespace/:name';
  }

  get spec(): BmcMachineSpec | undefined {
    return this.jsonData.spec;
  }

  get status(): BmcMachineStatus | undefined {
    return this.jsonData.status;
  }
}
