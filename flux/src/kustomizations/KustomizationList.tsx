import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import MuiLink from '@mui/material/Link';
import React from 'react';
import CheckIfFluxInstalled, { useFluxControllerAvailableCheck } from '../checkflux';
import Table from '../common/Table';

export function Kustomizations() {
  const isKustomizationControllerAvailable = useFluxControllerAvailableCheck({
    name: 'kustomize-controller',
  });

  if (isKustomizationControllerAvailable === null) {
    return <Loader />;
  }

  if (!isKustomizationControllerAvailable) {
    return (
      <SectionBox>
        <h1>Kustomize Controller is not installed</h1>
        <p>
          Follow the{' '}
          <MuiLink target="_blank" href="https://fluxcd.io/docs/components/kustomize/">
            installation guide
          </MuiLink>{' '}
          to install Kustomize Controller on your cluster
        </p>
      </SectionBox>
    );
  }

  return <KustomizationListWrapper />;
}

export function KustomizationListWrapper() {
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
        columns={['name', 'namespace', 'status', 'source', 'revision', 'message', 'lastUpdated']}
      />
    </SectionBox>
  );
}
