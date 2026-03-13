import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export type PodGroupPhase = 'Pending' | 'Running' | 'Unknown' | 'Inqueue' | 'Completed';

export interface PodGroupCondition {
  type?: string;
  status?: 'True' | 'False' | 'Unknown';
  transitionID?: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface PodGroupSpec {
  minMember?: number;
  minTaskMember?: Record<string, number>;
  queue?: string;
  priorityClassName?: string;
  minResources?: Record<string, string | number>;
}

export interface PodGroupStatus {
  phase?: PodGroupPhase;
  conditions?: PodGroupCondition[];
  running?: number;
  succeeded?: number;
  failed?: number;
}

export interface KubeVolcanoPodGroup extends KubeObjectInterface {
  spec: PodGroupSpec;
  status?: PodGroupStatus;
}

export class VolcanoPodGroup extends KubeObject<KubeVolcanoPodGroup> {
  static kind = 'PodGroup';
  static apiName = 'podgroups';
  static apiVersion = 'scheduling.volcano.sh/v1beta1';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/volcano/podgroups/:namespace/:name';
  }

  static getBaseObject() {
    return {
      apiVersion: 'scheduling.volcano.sh/v1beta1',
      kind: 'PodGroup',
      metadata: {
        name: '',
        namespace: '',
      },
      spec: {
        queue: 'default',
        minMember: 1,
      },
    };
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get phase(): PodGroupPhase {
    return this.status?.phase || 'Pending';
  }

  get queue(): string {
    return this.spec.queue || 'default';
  }

  get minMember(): number {
    return this.spec.minMember || 0;
  }

  get runningCount(): number {
    return this.status?.running || 0;
  }

  get succeededCount(): number {
    return this.status?.succeeded || 0;
  }

  get failedCount(): number {
    return this.status?.failed || 0;
  }
}
