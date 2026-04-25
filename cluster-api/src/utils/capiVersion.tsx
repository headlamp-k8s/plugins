import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';

/**
 * Represents a single version within a CustomResourceDefinition spec.
 */
type CapiCrdVersion = {
  name?: string;
  served?: boolean;
  storage?: boolean;
};

/**
 * Internal interface for parsing CRD spec and status fields.
 */
type CapiCrdData = {
  spec?: {
    versions?: CapiCrdVersion[];
  };
  status?: {
    storedVersions?: string[];
  };
};

/**
 * Extracts the storage or served version from a CRD object.
 *
 * @param crd - The CustomResourceDefinition object from Headlamp.
 * @returns The version string (e.g., v1beta1) or undefined.
 */
export function getStoredVersionFromCrd(crd: CustomResourceDefinition | null): string | undefined {
  if (!crd) return undefined;

  const crdData = (crd.jsonData ?? {}) as CapiCrdData;
  const versions = crdData.spec?.versions ?? [];

  const storageVersion = versions.find(
    version => version.storage && version.served !== false
  )?.name;
  if (storageVersion) return storageVersion;

  const servedStoredVersion = crdData.status?.storedVersions?.find(storedVersion =>
    versions.some(version => version.name === storedVersion && version.served !== false)
  );
  if (servedStoredVersion) return servedStoredVersion;

  const [, preferredVersion] = crd.getMainAPIGroup();
  return preferredVersion;
}

/**
 * Hook to retrieve the correct CAPI API version for a given CRD.
 *
 * @param crdName - The fully qualified name of the CRD.
 * @param defaultVersion - A fallback version if detection fails.
 * @returns The version string or undefined while loading.
 */
export function useCapiApiVersion(crdName: string, defaultVersion: string): string | undefined {
  const [crd, error] = CustomResourceDefinition.useGet(crdName);
  const version = getStoredVersionFromCrd(crd);
  if (version) return version;
  if (error) return defaultVersion;
  return defaultVersion;
}
