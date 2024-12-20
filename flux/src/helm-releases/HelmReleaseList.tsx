import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Loader,
  SectionBox,
  SectionFilterHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Link as MuiLink } from '@mui/material';
import React from 'react';
import { useTheme } from '@mui/material/styles';
import  { useFluxControllerAvailableCheck, useFluxInstallCheck } from '../checkflux';
import Table from '../common/Table';
import Flux404 from '../checkflux';

export function HelmReleases() {
  const isHelmReleasesControllerAvailable = useFluxControllerAvailableCheck({
    name: 'helm-controller',
  });

  if (isHelmReleasesControllerAvailable === null) {
    return <Loader />;
  }

  if (!isHelmReleasesControllerAvailable) {
    return (
      <SectionBox sx={{
        padding: '1rem',
        alignItems: 'center',
        margin: '2rem auto',
        maxWidth: '600px',
      }}>
        <h1>Helm Controller is not installed</h1>
        <p>
          Follow the{' '}
          <MuiLink target="_blank" href="https://fluxcd.io/docs/components/helm/">
            installation guide
          </MuiLink>{' '}
          to install Helm Controller on your cluster
        </p>
      </SectionBox>
    );
  }
  return <HelmReleasesListWrapper />;
}

function HelmReleasesListWrapper() {
  const [helmReleases] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'helmreleases.helm.toolkit.fluxcd.io'
  );

  const helmReleaseResourceClass = React.useMemo(() => {
    return helmReleases?.makeCRClass();
  }, [helmReleases]);

  const isFluxInstalled = useFluxInstallCheck();
  
  if(isFluxInstalled === null) {
    return <Loader />;
  }
  
  if(!isFluxInstalled) {
    return <Flux404 />;
  }

  return (
    <div>
      {helmReleaseResourceClass && <HelmReleasesList resourceClass={helmReleaseResourceClass} />}
    </div>
  );
}

function HelmReleasesList({ resourceClass }) {
  const [resource] = resourceClass.useList();

  return (
    <SectionBox title={<SectionFilterHeader title="Helm Releases" />}>
      <Table
        data={resource}
        defaultSortingColumn={2}
        filterFunction={useFilterFunc()}
        columns={['name', 'namespace', 'status', 'source', 'revision', 'message', 'lastUpdated']}
      />
    </SectionBox>
  );
}
