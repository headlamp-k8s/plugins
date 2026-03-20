import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';

/**
 * Returns the stored version of the CRD.
 * See: https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/#specify-multiple-versions
 */
export function getStoredVersionFromCrd(
  crd: { jsonData?: { spec?: { versions?: Array<{ name: string; storage?: boolean }> } } } | null
): string | undefined {
  const versions = crd?.jsonData?.spec?.versions;
  if (!Array.isArray(versions)) return undefined;
  const stored = versions.find(v => v.storage === true);
  return stored?.name;
}

/**
 * Resolves the API version for a CAPI resource from the CRD.
 */
export function useCapiApiVersion(crdName: string, defaultVersion: string): string | undefined {
  const [crd, error] = CustomResourceDefinition.useGet(crdName, undefined);
  const stored = getStoredVersionFromCrd(crd);
  if (stored) {
    return stored;
  }
  if (error) {
    return defaultVersion;
  }
  return crd !== null && crd !== undefined ? defaultVersion : undefined;
}

export { Loader as CapiVersionLoader };
