import { registerMapSource } from '@kinvolk/headlamp-plugin/lib';
import { kmeshMapSource } from './mapView';

/**
 * Registers KMesh's traffic topology into Headlamp's shared Map view:
 * Namespace -> Waypoint -> Service, linked via the `istio.io/use-waypoint`
 * convention rather than ownerReferences (KMesh/Istio ambient resources
 * aren't owned by their waypoint, they're routed to it by label).
 */
export function registerKmeshMapExtensions() {
  registerMapSource(kmeshMapSource);
}
