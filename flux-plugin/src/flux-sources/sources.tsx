import React from 'react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import FluxSourceCustomResource from '../flux-sources/sourcecustomresource';
import CheckIfFluxInstalled from '../checkflux';

export default function FluxSources() {
  const [gitRepoCRD] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'gitrepositories.source.toolkit.fluxcd.io'
  );
  const [ociRepos] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'ocirepositories.source.toolkit.fluxcd.io'
  );
  const [bucketRepos] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'buckets.source.toolkit.fluxcd.io'
  );
  const [helmRepos] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'helmrepositories.source.toolkit.fluxcd.io'
  );
  const [helmCharts] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'helmcharts.source.toolkit.fluxcd.io'
  );

  const gitRepoResourceClass = React.useMemo(() => {
    return gitRepoCRD?.makeCRClass();
  }, [gitRepoCRD]);

  const ociRepoResourceClass = React.useMemo(() => {
    return ociRepos?.makeCRClass();
  }, [ociRepos]);

  const bucketRepoResourceClass = React.useMemo(() => {
    return bucketRepos?.makeCRClass();
  }, [bucketRepos]);

  const helmRepoResourceClass = React.useMemo(() => {
    return helmRepos?.makeCRClass();
  }, [helmRepos]);

  const helmChartResourceClass = React.useMemo(() => {
    return helmCharts?.makeCRClass();
  }, [helmCharts]);

  return (
    <div>
      <CheckIfFluxInstalled />
      {gitRepoResourceClass && (
        <FluxSourceCustomResource
          type="sources"
          resourceClass={gitRepoResourceClass}
          title="Git Repositories"
        />
      )}
      {ociRepoResourceClass && (
        <FluxSourceCustomResource
          type="sources"
          resourceClass={ociRepoResourceClass}
          title="OCI Repositories"
        />
      )}
      {bucketRepoResourceClass && (
        <FluxSourceCustomResource
          type="sources"
          resourceClass={bucketRepoResourceClass}
          title="Buckets"
        />
      )}
      {helmRepoResourceClass && (
        <FluxSourceCustomResource
          type="sources"
          resourceClass={helmRepoResourceClass}
          title="Helm Repositories"
        />
      )}
      {helmChartResourceClass && (
        <FluxSourceCustomResource
          type="sources"
          resourceClass={helmChartResourceClass}
          title="Helm Charts"
        />
      )}
    </div>
  );
}
