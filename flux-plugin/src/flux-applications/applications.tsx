import React from 'react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import FluxApplicationCustomResource from '../flux-applications/applicationcustomresource';
import CheckIfFluxInstalled from '../checkflux';

export default function FluxApplications() {
  const [helmReleases] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'helmreleases.helm.toolkit.fluxcd.io'
  );
  const [kustomizations] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'kustomizations.kustomize.toolkit.fluxcd.io'
  );

  const helmReleaseResourceClass = React.useMemo(() => {
    return helmReleases?.makeCRClass();
  }, [helmReleases]);

  const kustomizationResourceClass = React.useMemo(() => {
    return kustomizations?.makeCRClass();
  }, [kustomizations]);

  return (
    <div>
      <CheckIfFluxInstalled />
      {helmReleaseResourceClass && (
        <FluxApplicationCustomResource
          type="applications"
          resourceClass={helmReleaseResourceClass}
          title="HelmReleases"
        />
      )}
      {kustomizationResourceClass && (
        <FluxApplicationCustomResource
          type="applications"
          resourceClass={kustomizationResourceClass}
          title="Kustomizations"
        />
      )}
    </div>
  );
}
