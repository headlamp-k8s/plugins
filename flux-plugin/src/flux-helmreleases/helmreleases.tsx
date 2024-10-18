import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import CheckIfFluxInstalled from '../checkflux';
import Table from '../common/Table';

export function HelmReleases() {
  const [helmReleases] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'helmreleases.helm.toolkit.fluxcd.io'
  );

  const helmReleaseResourceClass = React.useMemo(() => {
    return helmReleases?.makeCRClass();
  }, [helmReleases]);

  return (
    <div>
      <CheckIfFluxInstalled />
      {helmReleaseResourceClass && <HelmReleasesList resourceClass={helmReleaseResourceClass} />}
    </div>
  );
}

function HelmReleasesList({ resourceClass }) {
  const [resource] = resourceClass.useList();

  return (
    <SectionBox title={'Helm Releases'}>
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
