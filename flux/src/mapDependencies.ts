/**
 * Minimal shape of a Flux object (Kustomization or HelmRelease) needed to
 * resolve `spec.dependsOn`.
 */
interface DependsOnObject {
  /** Name of the Headlamp cluster the object comes from. */
  cluster?: string;
  metadata: { uid: string; name: string; namespace?: string };
  jsonData?: { spec?: { dependsOn?: { name?: string; namespace?: string }[] } };
}

export const DEPENDS_ON_LABEL = 'depends on';

/**
 * Builds one labelled edge for every `spec.dependsOn` entry that points to
 * another object in `objects`. The edge goes from the dependent object to the
 * object it depends on.
 *
 * Flux defaults the namespace of a reference to the namespace of the object
 * that declares it, so a reference with a missing or empty namespace stays in
 * the same one. A reference always points to an object in the same cluster, so
 * objects with the same namespace and name in different clusters stay apart.
 * References to objects that are not in the list, references to the object
 * itself and duplicate references produce no edge.
 */
export function buildDependsOnEdges(objects: DependsOnObject[]) {
  const keyOf = (cluster: string | undefined, namespace: string | undefined, name: string) =>
    `${cluster ?? ''}/${namespace}/${name}`;

  const byKey = new Map<string, DependsOnObject>();
  objects.forEach(it => byKey.set(keyOf(it.cluster, it.metadata.namespace, it.metadata.name), it));

  const edges: { id: string; source: string; target: string; label: string }[] = [];
  const seen = new Set<string>();

  objects.forEach(dependent => {
    dependent.jsonData?.spec?.dependsOn?.forEach(ref => {
      if (!ref?.name) return;

      // An empty namespace counts as unset, like in the Dependencies tables of the details pages.
      const dependency = byKey.get(
        keyOf(dependent.cluster, ref.namespace || dependent.metadata.namespace, ref.name)
      );
      if (!dependency || dependency.metadata.uid === dependent.metadata.uid) return;

      const id = `${dependent.metadata.uid}-${dependency.metadata.uid}-depends-on`;
      if (seen.has(id)) return;
      seen.add(id);

      edges.push({
        id,
        source: dependent.metadata.uid,
        target: dependency.metadata.uid,
        label: DEPENDS_ON_LABEL,
      });
    });
  });

  return edges;
}
