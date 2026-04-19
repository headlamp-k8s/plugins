import { SectionBox, SectionFilterHeader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import { NotSupported } from '../checkflux';
import { Terraform } from '../common/Resources';
import Table from '../common/Table';
import { NameLink, useNamespaces } from '../helpers';

export function TerraformList() {
  const filterFunction = useFilterFunc();
  const [resources, error] = Terraform.useList({ namespace: useNamespaces() });

  if (error?.status === 404) {
    return <NotSupported typeName="Terraforms" />;
  }

  return (
    <SectionBox title={<SectionFilterHeader title="Terraforms" />}>
      <Table
        data={resources}
        // @ts-ignore -- TODO Update the sorting param
        defaultSortingColumn={2}
        columns={[NameLink(Terraform), 'namespace', 'status', 'message', 'lastUpdated']}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
