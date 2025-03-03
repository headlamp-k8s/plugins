import { SectionBox, SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { NotSupported } from '../checkflux';
import Table from '../common/Table';
import React from 'react';
import { NameLink } from '../helpers';

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
  const [resources, setResources] = React.useState(null);
  const [error, setError] = React.useState(null);

  kustomizationClass().useApiList(setResources, setError);

  if (error?.status === 404) {
    return <NotSupported typeName="Kustomizations" />
  }

  return (
    <SectionBox title={<SectionFilterHeader title="Kustomizations" />}>
      <Table
        data={resources}
        defaultSortingColumn={2}
        columns={[NameLink(kustomizationClass()), 'namespace', 'status', 'source', 'revision', 'message', 'lastUpdated']}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
