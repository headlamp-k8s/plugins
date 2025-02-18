import { SectionBox, SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { NotSupported } from '../checkflux';
import Table from '../common/Table';

export function Kustomizations() {
  return (
    <div>
      <KustomizationList />
    </div>
  );
}

export function kustomizationClass() {
  const kustomizationGroup = 'kustomize.toolkit.fluxcd.io';
  const kustomizationVersion = 'v1';

  return makeCustomResourceClass({
    apiInfo: [{ group: kustomizationGroup, version: kustomizationVersion }],
    isNamespaced: true,
    singularName: 'kustomization',
    pluralName: 'kustomizations',
  });
}

function KustomizationList() {
  const filterFunction = useFilterFunc();

  const [kustomizations, error] = kustomizationClass().useList();

  return (
    <SectionBox title={<SectionFilterHeader title="Kustomizations" />}>
      {error?.status === 404 && <NotSupported typeName="Kustomizations" />}
      <Table
        data={kustomizations}
        defaultSortingColumn={2}
        columns={['name', 'namespace', 'status', 'source', 'revision', 'message', 'lastUpdated']}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
