import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { VeleroPhase } from './common';

/**
 * Where Velero stores volume snapshots for a given provider.
 *
 * @see https://velero.io/docs/main/api-types/volumesnapshotlocation/
 */
export interface VolumeSnapshotLocationSpec {
  provider?: string;
  config?: Record<string, string>;
  credential?: {
    name?: string;
    key?: string;
  };
}

export interface VolumeSnapshotLocationStatus {
  phase?: VeleroPhase;
}

export interface KubeVolumeSnapshotLocation extends KubeObjectInterface {
  spec?: VolumeSnapshotLocationSpec;
  status?: VolumeSnapshotLocationStatus;
}

export class VolumeSnapshotLocation extends KubeObject<KubeVolumeSnapshotLocation> {
  static kind = 'VolumeSnapshotLocation';
  static apiName = 'volumesnapshotlocations';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  get spec(): VolumeSnapshotLocationSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): VolumeSnapshotLocationStatus {
    return this.jsonData.status ?? {};
  }

  get phase() {
    return this.status.phase;
  }
}
