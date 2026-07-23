/**
 * Pure instance-API discovery logic, kept free of Headlamp runtime
 * imports so it stays unit-testable.
 */

export interface InstanceApiInfo {
  group: string;
  version: string;
  plural: string;
  kind: string;
  isNamespaced: boolean;
}

/** The subset of a CRD's spec that instance discovery reads. */
export interface CrdSpecLike {
  group?: string;
  scope?: string;
  names?: { kind?: string; plural?: string };
  versions?: { name?: string; storage?: boolean }[];
}

/**
 * Whether a CRD spec is the one an RGD generates: same group and the
 * generated kind from spec.schema.
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
 * storage version, which the RGD does not publish. Returns null on
 * partial specs.
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
