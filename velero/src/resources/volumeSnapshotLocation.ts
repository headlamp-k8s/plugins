import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/KubeObject';

const KubeObject = K8s.cluster.KubeObject;

export interface VeleroVSLSpec {
  provider: string;
  config?: Record<string, string>;
  [key: string]: any;
}

export interface VeleroVSLStatus {
  phase?: 'Available' | 'Unavailable' | string;
  [key: string]: any;
}

export interface VeleroVSLInterface extends KubeObjectInterface {
  spec: VeleroVSLSpec;
  status?: VeleroVSLStatus;
}

export class VeleroVolumeSnapshotLocation extends KubeObject<VeleroVSLInterface> {
  static kind = 'VolumeSnapshotLocation';
  static namespaced = true;
  static apiVersion = 'velero.io/v1';
  static isApiGroup = true;
  static apiGroup = 'velero.io';
  static get pluralName() {
    return 'volumesnapshotlocations';
  }

  get spec(): VeleroVSLSpec {
    return this.jsonData.spec ?? { provider: '' };
  }

  get status(): VeleroVSLStatus {
    return this.jsonData.status ?? {};
  }

  get provider(): string {
    return this.spec.provider;
  }

  get phase(): string {
    return this.status.phase ?? 'Unknown';
  }
}
