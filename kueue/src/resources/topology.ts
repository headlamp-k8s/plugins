import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { TopologyLevel } from './topologyFormatters';
import {
  getTopologyNodeLabels,
  renderTopologyLevelsCount,
  renderTopologyLevelsSummary,
} from './topologyFormatters';

export interface TopologySpec {
  levels?: TopologyLevel[];
}

export interface KubeTopology extends KubeObjectInterface {
  spec?: TopologySpec;
}

export class Topology extends KubeObject<KubeTopology> {
  static kind = 'Topology';
  static apiName = 'topologies';
  static apiVersion = [...kueueApiVersions, 'kueue.x-k8s.io/v1alpha1'];
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.topologyDetail;
  }

  get spec(): TopologySpec {
    return this.jsonData.spec ?? {};
  }

  get levels(): TopologyLevel[] {
    return this.spec.levels ?? [];
  }

  get levelsDisplay(): string {
    return renderTopologyLevelsSummary(this.levels);
  }

  get levelsCount(): number {
    return renderTopologyLevelsCount(this.levels);
  }

  get nodeLabels(): string[] {
    return getTopologyNodeLabels(this.levels);
  }
}
