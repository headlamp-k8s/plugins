import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export class GameServerSet extends KubeObject {
  static kind = 'GameServerSet';
  static apiName = 'gameserversets';
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
  // Relationship helpers
  // -----------------------

  /**
   * Fleet that owns this GameServerSet
   */
  get fleetName() {
    return this.metadata?.ownerReferences?.[0]?.name || null;
  }

  get namespace() {
    return this.metadata?.namespace;
  }

  get name() {
    return this.metadata?.name;
  }
}