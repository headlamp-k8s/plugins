import { SectionBox, SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import { NotSupported } from '../checkflux';
import { HelmRelease } from '../common/Resources';
import Table from '../common/Table';
import { NameLink, useNamespaces } from '../helpers';

export function HelmReleases() {
  const filterFunction = useFilterFunc();
  const [resources, error] = HelmRelease.useList({ namespace: useNamespaces() });

  if (error?.status === 404) {
    return <NotSupported typeName="Helm Releases" />;
  }

  return (
    <SectionBox title={<SectionFilterHeader title="Helm Releases" />}>
      <Table
        data={resources}
        // @ts-ignore -- TODO Update the sorting param
        defaultSortingColumn={2}
        columns={[
          NameLink(HelmRelease),
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
