import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';

/**
 * Returns the stored version of the CRD.
 * See: https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/#specify-multiple-versions
 */
export function getStoredVersionFromCrd(crd: CustomResourceDefinition | null): string | undefined {
  if (!crd) return undefined;
  const [, version] = crd.getMainAPIGroup();
  return version;
}

/**
 * Resolves the API version for a CAPI resource from the CRD.
 */
export function useCapiApiVersion(crdName: string, defaultVersion: string): string | undefined {
  const [crd, error] = CustomResourceDefinition.useGet(crdName, undefined);
  const version = getStoredVersionFromCrd(crd);
  if (version) return version;
  if (error) return defaultVersion;
  return undefined;
}

export { Loader as CapiVersionLoader };
