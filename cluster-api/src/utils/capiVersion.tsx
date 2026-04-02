import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';

type CapiCrdVersion = {
  name?: string;
  served?: boolean;
  storage?: boolean;
};

type CapiCrdData = {
  spec?: {
    versions?: CapiCrdVersion[];
  };
  status?: {
    storedVersions?: string[];
  };
};

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

export function useCapiApiVersion(crdName: string, defaultVersion: string): string | undefined {
  const [crd, error] = CustomResourceDefinition.useGet(crdName, undefined);
  const version = getStoredVersionFromCrd(crd);
  if (version) return version;
  if (error) return defaultVersion;
  return undefined;
}
