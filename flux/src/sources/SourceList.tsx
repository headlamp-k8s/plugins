import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Loader, SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import  { useFluxInstallCheck } from '../checkflux';
import FluxSourceCustomResource from './SourceCustomResourceSingle';
import Flux404 from '../checkflux';

export default function FluxSources() {
  const isFluxInstalled = useFluxInstallCheck();
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
      title: <SectionFilterHeader title={'Git Repositories'} />,
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

  if(isFluxInstalled === null) {
    return <Loader />;
  }

  if(!isFluxInstalled) {
    return <Flux404 />
  }

  return (
    <div>
      {sourceTables.map(
        ({ title, crd }) => crd && <FluxSourceCustomResource crd={crd} title={title} />
      )}
    </div>
  );
}
