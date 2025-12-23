import { KubeObject, type KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { Condition } from './common';

export interface KRevisionResource extends KubeObjectInterface {
  spec?: {
    containerConcurrency?: number;
  };
  status?: {
    conditions?: Condition[];
  };
}

export class KRevision extends KubeObject<KRevisionResource> {
  static kind = 'Revision';
  static apiName = 'revisions';
  static apiVersion = 'serving.knative.dev/v1';
  static isNamespaced = true;

  get metadata() {
    return this.jsonData.metadata;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get readyCondition() {
    return this.status?.conditions?.find((c: Condition) => c.type === 'Ready');
  }

  get isReady(): boolean {
    return this.readyCondition?.status === 'True';
  }
}
