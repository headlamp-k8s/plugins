import type { GraphEdge } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';

/** Fields of a Kueue object that the Map edges are derived from. */
export interface KueueMapObject {
  /** Cluster the object was listed from. */
  cluster?: string;
  metadata: {
    uid: string;
    name: string;
    namespace?: string;
    ownerReferences?: { uid: string }[];
  };
}

function makeEdge(source: string, target: string): GraphEdge {
  return { id: `${source}-${target}`, source, target };
}

/**
 * Link each object to the targets it names, matched by name in the same cluster, and in the
 * same namespace when sameNamespace is set. Edges point from the referencing object to the
 * target, like Headlamp's own owner edges.
 */
export function getReferenceEdges<T extends KueueMapObject>(
  objects: T[],
  targets: KueueMapObject[],
  getTargetNames: (object: T) => (string | undefined)[],
  sameNamespace = false
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  objects.forEach(object => {
    getTargetNames(object).forEach(name => {
      const target = targets.find(
        candidate =>
          candidate.metadata.name === name &&
          candidate.cluster === object.cluster &&
          (!sameNamespace || candidate.metadata.namespace === object.metadata.namespace)
      );
      if (target) {
        edges.push(makeEdge(object.metadata.uid, target.metadata.uid));
      }
    });
  });

  return edges;
}

/**
 * Link each object to its owners. The owners (Jobs, Pods and so on) come from Headlamp's own
 * Map sources, and the Map drops an edge whose owner is not shown.
 */
export function getOwnerEdges(objects: KueueMapObject[]): GraphEdge[] {
  return objects.flatMap(object =>
    (object.metadata.ownerReferences ?? []).map(owner => makeEdge(object.metadata.uid, owner.uid))
  );
}
