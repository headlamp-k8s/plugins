import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kmeshRoutePaths } from '../utils/kmeshRoutes';
import {
  getWaypointCurrentStatus,
  getWaypointImage,
  type WaypointCondition,
} from './waypointUtils';

/** GatewayClass name used to identify KMesh Waypoints */
export const KMESH_WAYPOINT_GATEWAY_CLASS = 'kmesh-waypoint';

/**
 * Specification of a KMesh Waypoint (Gateway).
 * @see https://gateway-api.sigs.k8s.io/reference/api-types/gateway/
 */
export interface WaypointSpec {
  /** The GatewayClass used for this waypoint */
  gatewayClassName?: string;
}

/**
 * Represents a Kubernetes Gateway resource acting as a KMesh Waypoint.
 * @see https://kmesh.net/docs/application-layer/install_waypoint
 */
export interface KubeWaypoint extends KubeObjectInterface {
  /** Waypoint specification */
  spec?: WaypointSpec;
  /** Waypoint status including Gateway API conditions */
  status?: {
    conditions?: WaypointCondition[];
  };
}

export class Waypoint extends KubeObject<KubeWaypoint> {
  static kind = 'Gateway';
  static apiName = 'gateways';
  static apiVersion = 'gateway.networking.k8s.io/v1';
  static isNamespaced = true;

  static get detailsRoute() {
    return kmeshRoutePaths.waypointDetail;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get image() {
    return getWaypointImage(this.metadata?.annotations);
  }

  get currentStatus() {
    return getWaypointCurrentStatus(this.status?.conditions);
  }
}
