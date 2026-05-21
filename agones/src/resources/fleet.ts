import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export class Fleet extends KubeObject {
  static kind = 'Fleet';
  static apiName = 'fleets';
  static apiVersion = 'agones.dev/v1';
  static isNamespaced = true;

  // -----------------------
  // Status helpers
  // -----------------------
  get replicas() {
    return this.jsonData?.status?.replicas || 0;
  }

  get readyReplicas() {
    return this.jsonData?.status?.readyReplicas || 0;
  }

  get allocatedReplicas() {
    return this.jsonData?.status?.allocatedReplicas || 0;
  }

  // -----------------------
  // Spec helpers
  // -----------------------
  get selector() {
    return this.jsonData?.spec?.template?.metadata?.labels || {};
  }

  // -----------------------
  // Identity helpers
  // -----------------------
  get name() {
    return this.metadata?.name;
  }

  get namespace() {
    return this.metadata?.namespace;
  }

  // -----------------------
  // Relationship helpers
  // -----------------------

  /**
   * Label used to find GameServers created by this Fleet
   */
  get fleetSelector() {
    return {
      'agones.dev/fleet': this.name,
    };
  }
  static get detailsRoute() {
  return 'agones-fleet';
  }
}