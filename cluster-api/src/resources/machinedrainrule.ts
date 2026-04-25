import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { LabelSelector } from './common';

const MACHINEDRAINRULE_API_GROUP = 'cluster.x-k8s.io';
const MACHINEDRAINRULE_CRD_NAME = 'machinedrainrules.cluster.x-k8s.io';

/**
 * MachineDrainRule is the KubeObject implementation for the Cluster API MachineDrainRule resource.
 * Managed Drain allows Cluster API to coordinate node draining with external agents.
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/managed-drain.html
 */
export class MachineDrainRule extends KubeObject<ClusterApiMachineDrainRule> {
  static readonly apiName = 'machinedrainrules';
  static apiVersion = `${MACHINEDRAINRULE_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINEDRAINRULE_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachineDrainRule';

  /**
   * Returns the route for the machine drain rule details page.
   */
  static get detailsRoute() {
    return '/cluster-api/machinedrainrules/:namespace/:name';
  }

  /**
   * Returns a version of the MachineDrainRule class with a specific API version.
   */
  static withApiVersion(version: string): typeof MachineDrainRule {
    const versionedClass = class extends MachineDrainRule {} as typeof MachineDrainRule;
    versionedClass.apiVersion = `${MACHINEDRAINRULE_API_GROUP}/${version}`;
    return versionedClass;
  }

  /**
   * Returns the machine drain rule specification.
   */
  get spec() {
    return this.jsonData.spec;
  }
}

/**
 * MachineDrainRule resource definition.
 * Managed Drain allows Cluster API to coordinate node draining with external agents.
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/managed-drain.html
 */
export interface ClusterApiMachineDrainRule extends KubeObjectInterface {
  /** Spec defines the desired state of MachineDrainRule. */
  spec: {
    /** Drain specifies the drain behavior. */
    drain: {
      /** Behavior specifies how the drain should be handled. */
      behavior: 'Drain' | 'Skip' | 'WaitCompleted';
      /** Order specifies the order in which the drain should be handled. */
      order?: number;
    };
    /** Machines specifies the machines the rule applies to. */
    machines?: Array<{
      /** Selector is a label selector to find machines. */
      selector?: LabelSelector;
      /** ClusterSelector is a label selector to find clusters. */
      clusterSelector?: LabelSelector;
    }>;
    /** Pods specifies the pods the rule applies to. */
    pods?: Array<{
      /** Selector is a label selector to find pods. */
      selector?: LabelSelector;
      /** NamespaceSelector is a label selector to find namespaces. */
      namespaceSelector?: LabelSelector;
    }>;
  };
}
