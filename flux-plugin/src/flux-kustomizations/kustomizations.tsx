import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import Table from '../common/Table';
import CheckIfFluxInstalled from '../checkflux';

export function Kustomizations() {
  const [kustomizations] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'kustomizations.kustomize.toolkit.fluxcd.io'
  );

  const kustomizationResourceClass = React.useMemo(() => {
    return kustomizations?.makeCRClass();
  }, [kustomizations]);

  return (
    <div>
      <CheckIfFluxInstalled />
      {kustomizationResourceClass && (
        <KustomizationList resourceClass={kustomizationResourceClass} />
      )}
    </div>
  );
}

function KustomizationList({ resourceClass }) {
  const [resource] = resourceClass.useList();

  return (
    <SectionBox title={'Kustomizations'}>
      <Table
        data={resource}
        defaultSortingColumn={2}
        columns={[
          'name',
          'namespace',
          'status',
          'source',
          'revision',
          'message',
          'lastUpdated',
        ]}
      />
    </SectionBox>
  );
}
