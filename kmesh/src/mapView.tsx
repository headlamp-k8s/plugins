import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import type {
  GraphEdge,
  GraphNode,
  GraphSource,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { ComponentType } from 'react';
import { useMemo } from 'react';
import WaypointDetail from './components/waypoints/Detail';
import {
  getWaypointNodeStatus,
  isWaypointEnrolled,
  resolveEffectiveWaypointName,
} from './map/mapUtils';
import { KMESH_WAYPOINT_GATEWAY_CLASS, Waypoint } from './resources/waypoint';
import { getWaypointCurrentStatus } from './resources/waypointUtils';

const kmeshMapIcon = <Icon icon="mdi:vector-triangle" width="100%" height="100%" />;

const NamespaceResource = K8s.ResourceClasses.Namespace;
const ServiceResource = K8s.ResourceClasses.Service;

type DetailsComponent = ComponentType<{ node: GraphNode }>;

/** Wraps an existing route-param-driven Detail component so it can also be
 * rendered as a Map node's details panel, given only the underlying KubeObject. */
function makeDetailsComponent(
  Detail: ComponentType<{ namespace?: string; name?: string }>
): DetailsComponent {
  return function NodeDetails({ node }: { node: GraphNode }) {
    const meta = node.kubeObject?.jsonData?.metadata;
    if (!meta) return null;
    return <Detail namespace={meta.namespace} name={meta.name} />;
  };
}

const WaypointNodeDetails = makeDetailsComponent(WaypointDetail);

function makeKubeToKubeEdge(from: KubeObject, to: KubeObject, label?: string): GraphEdge {
  return {
    id: `${from.metadata.uid}-${to.metadata.uid}`,
    source: from.metadata.uid,
    target: to.metadata.uid,
    label,
  };
}

function isKmeshWaypoint(waypoint: Waypoint): boolean {
  return waypoint.spec?.gatewayClassName === KMESH_WAYPOINT_GATEWAY_CLASS;
}

/**
 * Waypoints (KMesh Gateways), plus a "hosts" edge back to their own Namespace.
 */
const waypointSource: GraphSource = {
  id: 'kmesh-map-waypoints',
  label: 'KMesh Waypoints',
  icon: kmeshMapIcon,
  useData() {
    const [waypoints] = Waypoint.useList();
    const [namespaces] = NamespaceResource.useList();

    return useMemo(() => {
      if (!waypoints || !namespaces) return null;

      const kmeshWaypoints = waypoints.filter(isKmeshWaypoint);

      const nodes: GraphNode[] = kmeshWaypoints.map(waypoint => ({
        id: waypoint.metadata.uid,
        kubeObject: waypoint,
        weight: 2000,
        status: getWaypointNodeStatus(getWaypointCurrentStatus(waypoint.status?.conditions)),
        detailsComponent: WaypointNodeDetails,
      }));

      const edges: GraphEdge[] = kmeshWaypoints
        .map(waypoint => {
          const ns = namespaces.find(n => n.metadata.name === waypoint.metadata.namespace);
          return ns ? makeKubeToKubeEdge(ns, waypoint, 'hosts') : null;
        })
        .filter((edge): edge is GraphEdge => edge !== null);

      return { nodes, edges };
    }, [waypoints, namespaces]);
  },
};

/**
 * Namespaces that participate in the mesh: they either host a KMesh Waypoint,
 * or they (or a Service inside them) are routed through one via the
 * `istio.io/use-waypoint` label. Unrelated namespaces are left off the map
 * so it doesn't balloon to the whole cluster.
 */
const namespaceSource: GraphSource = {
  id: 'kmesh-map-namespaces',
  label: 'KMesh Namespaces',
  useData() {
    const [namespaces] = NamespaceResource.useList();
    const [waypoints] = Waypoint.useList();
    const [services] = ServiceResource.useList();

    return useMemo(() => {
      if (!namespaces || !waypoints || !services) return null;

      const kmeshWaypoints = waypoints.filter(isKmeshWaypoint);
      const waypointHostNamespaces = new Set(kmeshWaypoints.map(w => w.metadata.namespace));

      const relevantNamespaces = namespaces.filter(ns => {
        if (waypointHostNamespaces.has(ns.metadata.name)) return true;
        if (isWaypointEnrolled(ns.metadata.labels, undefined)) return true;
        return services.some(
          svc =>
            svc.metadata.namespace === ns.metadata.name &&
            isWaypointEnrolled(svc.metadata.labels, ns.metadata.labels)
        );
      });

      const nodes: GraphNode[] = relevantNamespaces.map(ns => ({
        id: ns.metadata.uid,
        kubeObject: ns,
        weight: 3000,
      }));

      const edges: GraphEdge[] = relevantNamespaces
        .map(ns => {
          const waypointName = resolveEffectiveWaypointName(ns.metadata.labels, undefined);
          if (!waypointName) return null;
          const target = kmeshWaypoints.find(
            w => w.metadata.name === waypointName && w.metadata.namespace === ns.metadata.name
          );
          return target ? makeKubeToKubeEdge(ns, target, 'uses') : null;
        })
        .filter((edge): edge is GraphEdge => edge !== null);

      return { nodes, edges };
    }, [namespaces, waypoints, services]);
  },
};

/**
 * Services routed through a KMesh Waypoint, either via their own
 * `istio.io/use-waypoint` label or one inherited from their Namespace.
 */
const serviceSource: GraphSource = {
  id: 'kmesh-map-services',
  label: 'KMesh Services',
  useData() {
    const [services] = ServiceResource.useList();
    const [namespaces] = NamespaceResource.useList();
    const [waypoints] = Waypoint.useList();

    return useMemo(() => {
      if (!services || !namespaces || !waypoints) return null;

      const kmeshWaypoints = waypoints.filter(isKmeshWaypoint);
      const namespacesByName = new Map(namespaces.map(ns => [ns.metadata.name, ns]));

      const enrolledServices = services.filter(svc => {
        const ns = namespacesByName.get(svc.metadata.namespace);
        return isWaypointEnrolled(svc.metadata.labels, ns?.metadata.labels);
      });

      const nodes: GraphNode[] = enrolledServices.map(svc => ({
        id: svc.metadata.uid,
        kubeObject: svc,
        weight: 1000,
      }));

      const edges: GraphEdge[] = enrolledServices
        .map(svc => {
          const ns = namespacesByName.get(svc.metadata.namespace);
          const waypointName = resolveEffectiveWaypointName(
            svc.metadata.labels,
            ns?.metadata.labels
          );
          const target = kmeshWaypoints.find(
            w => w.metadata.name === waypointName && w.metadata.namespace === svc.metadata.namespace
          );
          return target ? makeKubeToKubeEdge(svc, target, 'routed via') : null;
        })
        .filter((edge): edge is GraphEdge => edge !== null);

      return { nodes, edges };
    }, [services, namespaces, waypoints]);
  },
};

/** Top-level KMesh source shown in the Map view's source picker. */
export const kmeshMapSource: GraphSource = {
  id: 'kmesh',
  label: 'KMesh',
  icon: kmeshMapIcon,
  sources: [namespaceSource, waypointSource, serviceSource],
};
