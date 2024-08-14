import { K8s } from '@kinvolk/headlamp-plugin/lib';
import CheckIfFluxInstalled from '../checkflux';
import FluxSourceCustomResource from './SourceCustomResourceSingle';

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

  const sourceTables = [
    {
      title: 'Git Repositories',
      crd: gitRepoCRD,
    },
    {
      title: 'OCI Repositories',
      crd: ociRepos,
    },
    {
      title: 'Buckets',
      crd: bucketRepos,
    },
    {
      title: 'Helm Repositories',
      crd: helmRepos,
    },
    {
      title: 'Helm Charts',
      crd: helmCharts,
    },
  ];

  return (
    <div>
      <CheckIfFluxInstalled />
      {sourceTables.map(
        ({ title, crd }) => crd && <FluxSourceCustomResource crd={crd} title={title} />
      )}
    </div>
  );
}
