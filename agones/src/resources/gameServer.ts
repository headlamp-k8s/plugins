import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export class GameServer extends KubeObject {
  static kind = 'GameServer';
  static apiName = 'gameservers';
  static apiVersion = 'agones.dev/v1';
  static isNamespaced = true;

  // -----------------------
  // Status helpers
  // -----------------------
  get state() {
    return this.jsonData?.status?.state || '-';
  }

  get address() {
    return this.jsonData?.status?.address || '-';
  }

  get port() {
    return this.jsonData?.status?.ports?.[0]?.port || '-';
  }

  get nodeName() {
    return this.jsonData?.status?.nodeName || '-';
  }

  // -----------------------
  // Relationship helpers
  // -----------------------

  /**
   * Fleet that created this GameServer
   * THIS is the key for relational navigation
   */
  get fleet() {
  return this.metadata?.labels?.['agones.dev/fleet'] || '';
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

  static get detailsRoute() {
  return 'agones-gameserver';
  }

  get ports() {
  const ports = this.jsonData?.status?.ports ?? [];

  if (ports.length === 0) {
    return '';
  }

  return ports.map((p: any) => p.port).join(', ');
}
}