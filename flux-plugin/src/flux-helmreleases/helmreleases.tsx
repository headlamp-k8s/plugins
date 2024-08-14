import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  DateLabel,
  Link,
  SectionBox,
  ShowHideLabel,
  StatusLabel,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeCRD } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';
import { getSourceNameAndType } from '../helpers/index';
import CheckIfFluxInstalled from '../checkflux';

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

  function prepareStatus(item: KubeCRD) {
    const ready = item?.status?.conditions?.find(c => c.type === 'Ready');
    if (ready.status === 'Unknown') {
      return <StatusLabel status="warning">Reconciling</StatusLabel>;
    }
    return (
      <StatusLabel status={ready.status === 'True' ? 'success' : 'error'}>
        {ready.status === 'True' ? 'Ready' : 'Failed'}
      </StatusLabel>
    );
  }

  function prepareLastUpdated(item: KubeCRD) {
    const condition = item?.jsonData?.status?.conditions?.find(c => c.type === 'Ready');
    return condition?.lastTransitionTime;
  }

  return (
    <SectionBox title={'Helm Releases'}>
      <Table
        data={resource}
        defaultSortingColumn={2}
        columns={[
          {
            header: 'Name',
            accessorKey: 'metadata.name',
            Cell: ({ row: { original: item } }) => {
              return (
                <Link
                  routeName={`/flux/helmreleases/:namespace/:name`}
                  params={{
                    name: item.metadata.name,
                    namespace: item.metadata.namespace,
                  }}
                >
                  {' '}
                  {item.metadata.name}{' '}
                </Link>
              );
            },
          },
          {
            header: 'Namespace',
            accessorKey: 'metadata.namespace',
            Cell: ({ row: { original: item } }) => (
              <Link
                routeName="namespace"
                params={{
                  name: item.metadata.namespace,
                }}
              >
                {item.metadata.namespace}
              </Link>
            ),
          },
          {
            header: 'Status',
            accessorFn: item => {
              return prepareStatus(item.jsonData);
            },
          },
          {
            header: 'Source',
            accessorFn: item => {
              const { name } = getSourceNameAndType(item);
              return (
                <Link
                  routeName={`/flux/sources/:namespace/:name`}
                  params={{ namespace: item.jsonData.metadata.namespace, name }}
                >
                  {name}
                </Link>
              );
            },
          },
          {
            header: 'Revision',
            accessorFn: item => {
              const reference = item.jsonData.status?.lastAttemptedRevision;
              return reference || '-';
            },
          },
          {
            header: 'Message',
            accessorFn: item => {
              const message = item.jsonData.status?.conditions?.find(
                c => c.type === 'Ready'
              )?.message;
              return (
                <ShowHideLabel labelId={item?.metadata?.uid || ''}>{message || ''}</ShowHideLabel>
              );
            },
          },
          {
            header: 'Last Updated',
            accessorFn: item => <DateLabel date={prepareLastUpdated(item)} />,
          },
        ]}
      />
    </SectionBox>
  );
}
