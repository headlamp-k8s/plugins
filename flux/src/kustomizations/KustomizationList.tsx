import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox, SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import { NotSupported } from '../checkflux';
import { Kustomization } from '../common/Resources';
import Table from '../common/Table';
import { NameLink, useNamespaces } from '../helpers';

export function Kustomizations() {
  const filterFunction = useFilterFunc();
  const [resources, error] = Kustomization.useList({ namespace: useNamespaces() });
  const { t } = useTranslation();

  if (error?.status === 404) {
    return <NotSupported typeName={t('Kustomizations')} />;
  }

  return (
    <SectionBox title={<SectionFilterHeader title={t('Kustomizations')} />}>
      <Table
        data={resources}
        // @ts-ignore -- TODO Update the sorting param
        defaultSortingColumn={2}
        columns={[
          NameLink(Kustomization),
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
