import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, LabelSelector } from './common';

/**
 * MachineHealthCheck resource definition.
 * @see https://cluster-api.sigs.k8s.io/tasks/healthcheck.html
 */
export interface ClusterApiMachineHealthCheck extends KubeObjectInterface {
  /** Spec defines the desired state of MachineHealthCheck. */
  spec?: {
    /** ClusterName is the name of the Cluster this object belongs to. */
    clusterName: string;
    /** Label selector to find machines the MHC should check. */
    selector: LabelSelector;
    /**
     * v1beta2: checks block for machine/node health.
     * @see https://cluster-api.sigs.k8s.io/reference/resources/machinehealthcheck.html
     */
    checks?: {
      nodeStartupTimeoutSeconds?: number;
      unhealthyMachineConditions?: Array<{
        type: string;
        status: string;
        timeoutSeconds: number;
      }>;
      unhealthyNodeConditions?: Array<{
        type: string;
        status: string;
        timeoutSeconds: number;
      }>;
    };
    /** v1beta1: UnhealthyConditions are the conditions that identify an unhealthy machine. */
    unhealthyConditions?: UnhealthyCondition[];
    /** @deprecated use remediation instead. */
    maxUnhealthy?: string | number;
    /** @deprecated use remediation instead. */
    unhealthyRange?: string;
    /** v1beta1: NodeStartupTimeout is the maximum duration for a node to startup. */
    nodeStartupTimeout?: number;
    /** RemediationTemplate is a reference to a remediation template. */
    remediationTemplate?: KubeObjectInterface;
  };
  /** Status defines the current state of MachineHealthCheck. */
  status?: {
    /** Total number of machines targeted by this MHC. */
    expectedMachines?: number;
    /** Total number of healthy machines. */
    currentHealthy?: number;
    /** Total number of remediations allowed. */
    remediationsAllowed?: number;
    /** ObservedGeneration is the generation observed by the MHC controller. */
    observedGeneration?: bigint;
    /** Targets are the names of the machines targeted by this MHC. */
    targets?: string[];
    /** Conditions define the current state of the MHC. */
    conditions?: Condition[];
    /** v1beta2 status fields. */
    v1beta2?: {
      /** conditions define the current state of the MHC in v1beta2. */
      conditions?: Condition[];
    };
  };
}

const MACHINEHEALTHCHECK_API_GROUP = 'cluster.x-k8s.io';
const MACHINEHEALTHCHECK_CRD_NAME = 'machinehealthchecks.cluster.x-k8s.io';

/**
 * MachineHealthCheck is the KubeObject implementation for the Cluster API MachineHealthCheck resource.
 * @see https://cluster-api.sigs.k8s.io/tasks/healthcheck.html
 */
export class MachineHealthCheck extends KubeObject<ClusterApiMachineHealthCheck> {
  static readonly apiName = 'machinehealthchecks';
  static apiVersion = `${MACHINEHEALTHCHECK_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINEHEALTHCHECK_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachineHealthCheck';

  /**
   * Returns the route for the machine health check details page.
   */
  static get detailsRoute() {
    return '/cluster-api/machinehealthchecks/:namespace/:name';
  }

  /**
   * Returns a version of the MachineHealthCheck class with a specific API version.
   */
  static withApiVersion(version: string): typeof MachineHealthCheck {
    const versionedClass = class extends MachineHealthCheck {} as typeof MachineHealthCheck;
    versionedClass.apiVersion = `${MACHINEHEALTHCHECK_API_GROUP}/${version}`;
    return versionedClass;
  }

  /**
   * Returns the machine health check specification.
   */
  get spec() {
    return this.jsonData.spec;
  }

  /**
   * Returns the raw status object.
   */
  get status() {
    return this.jsonData.status;
  }

  /**
   * Returns normalized conditions for the machine health check.
   */
  get conditions() {
    return getMachineHealthCheckConditions(this.jsonData);
  }
}

/**
 * Extracts and normalizes conditions from a MachineHealthCheck resource.
 *
 * @param item - The MachineHealthCheck resource.
 * @returns An array of Conditions or undefined.
 */
export function getMachineHealthCheckConditions(
  item: ClusterApiMachineHealthCheck | null | undefined
) {
  const status = item?.status;
  if (!status) return undefined;

  if (status.v1beta2?.conditions?.length) {
    return status.v1beta2.conditions;
  }

  return status.conditions;
}

/**
 * UnhealthyCondition defines the conditions that identify an unhealthy machine.
 */
export interface UnhealthyCondition {
  /** Type of the condition (e.g., Ready). */
  type: 'Ready' | 'MemoryPressure' | 'DiskPressure' | 'PIDPressure' | 'NetworkUnavailable';
  /** Status of the condition (True, False, or Unknown). */
  status: 'True' | 'False' | 'Unknown';
  /** Timeout is the duration for which the condition must be in the status before it is considered unhealthy. */
  timeout: number;
}
