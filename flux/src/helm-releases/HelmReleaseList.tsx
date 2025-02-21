import { SectionBox, SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import { NotSupported } from '../checkflux';
import Table from '../common/Table';
import { NameLink } from '../helpers';

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
  const [resources, setResources] = React.useState(null);
  const [error, setError] = React.useState(null);

  helmReleaseClass().useApiList(setResources, setError);

  return (
    <SectionBox title={<SectionFilterHeader title="Helm Releases" />}>
      {error?.status === 404 && <NotSupported typeName="Helm Releases" />}
      <Table
        data={resources}
        defaultSortingColumn={2}
        columns={[
          NameLink(helmReleaseClass()),
          'namespace',
          'status',
          'source',
          'revision',
          'message',
          'lastUpdated',
        ]}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
