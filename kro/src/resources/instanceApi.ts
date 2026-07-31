/**
 * Pure instance-API discovery logic, kept free of Headlamp runtime
 * imports so it stays unit-testable.
 */

/** The API coordinates needed to build a watchable instance class. */
export interface InstanceApiInfo {
  /** API group, e.g. "kro.run". */
  group: string;
  /** Served storage version, e.g. "v1alpha1". */
  version: string;
  /** Plural resource name from the CRD, e.g. "genaiservices". */
  plural: string;
  /** Kind, e.g. "GenAIService". */
  kind: string;
  /** Whether the CRD is Namespaced (vs Cluster) scoped. */
  isNamespaced: boolean;
}

/**
 * The subset of a CRD's spec that instance discovery reads.
 *
 * @see https://kubernetes.io/docs/reference/kubernetes-api/extend-resources/custom-resource-definition-v1/
 */
export interface CrdSpecLike {
  /** API group the CRD serves. */
  group?: string;
  /** "Namespaced" or "Cluster". */
  scope?: string;
  /** Naming block; kind and plural are what discovery needs. */
  names?: { kind?: string; plural?: string };
  /** Served versions; exactly one is flagged as storage. */
  versions?: { name?: string; storage?: boolean }[];
}

/**
 * Whether a CRD spec is the one an RGD generates: same group and the
 * generated kind from spec.schema.
 *
 * @param crdSpec - Candidate CRD spec (may be partial or undefined).
 * @param generatedGroup - Group of the RGD's generated API.
 * @param generatedKind - Kind of the RGD's generated API.
 * @returns True when the CRD serves the generated API.
 */
export function matchesGeneratedCrd(
  crdSpec: CrdSpecLike | undefined,
  generatedGroup: string,
  generatedKind: string
): boolean {
  return crdSpec?.group === generatedGroup && crdSpec?.names?.kind === generatedKind;
}

/**
 * Extract the API info needed to build an instance class from a CRD
 * spec — the CRD is the source of truth for plural, scope, and the
 * storage version, which the RGD does not publish.
 *
 * @param crdSpec - The CRD spec to read; may be partial or undefined.
 * @returns The API info, or null when the spec is missing required
 *   fields (group, names, or any served version).
 */
export function instanceApiInfoFromCrdSpec(
  crdSpec: CrdSpecLike | undefined
): InstanceApiInfo | null {
  if (!crdSpec?.group || !crdSpec.names?.plural || !crdSpec.names?.kind) {
    return null;
  }
  const storageVersion =
    crdSpec.versions?.find(version => version.storage)?.name ?? crdSpec.versions?.[0]?.name;
  if (!storageVersion) {
    return null;
  }
  return {
    group: crdSpec.group,
    version: storageVersion,
    plural: crdSpec.names.plural,
    kind: crdSpec.names.kind,
    isNamespaced: crdSpec.scope === 'Namespaced',
  };
}
