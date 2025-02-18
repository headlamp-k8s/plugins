import { SectionBox, SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { NotSupported } from '../checkflux';
import Table from '../common/Table';

export function HelmReleases() {
  return <HelmReleasesList />;
}

export function helmReleaseClass() {
  const helmreleaseGroup = 'helm.toolkit.fluxcd.io';
  const helmreleaseVersion = 'v2';

  return makeCustomResourceClass({
    apiInfo: [{ group: helmreleaseGroup, version: helmreleaseVersion }],
    isNamespaced: true,
    singularName: 'helmrelease',
    pluralName: 'helmreleases',
  });
}

function HelmReleasesList() {
  const filterFunction = useFilterFunc();

  const [helmReleases, error] = helmReleaseClass().useList();

  return (
    <SectionBox title={<SectionFilterHeader title="Helm Releases" />}>
      {error?.status === 404 && <NotSupported typeName="Helm Releases" />}
      <Table
        data={helmReleases}
        defaultSortingColumn={2}
        columns={['name', 'namespace', 'status', 'source', 'revision', 'message', 'lastUpdated']}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
