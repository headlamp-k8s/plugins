import { DateLabel, Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Link as MuiLink } from '@mui/material';
import React from 'react';

export default function FluxSourceCustomResource(props: {
  resourceClass: KubeObject;
  title?: string;
  type: string;
}) {
  const { resourceClass, title, type } = props;
  const [resource] = resourceClass.useList();

  function prepareColumns() {
    const columns = [
      {
        header: 'Name',
        accessorFn: item => {
          return (
            <Link
              routeName={`/flux/${type}/:namespace/:type/:name`}
              params={{
                name: item.metadata.name,
                namespace: item.metadata.namespace,
                type: title.split(' ').join('').toLowerCase(),
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
        accessorFn: item => (
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
        header: 'Age',
        accessorFn: item => <DateLabel date={item.metadata.creationTimestamp} />,
      },
      {
        header: 'Ready',
        accessorFn: item => {
          const ready = item.jsonData.status?.conditions?.find(c => c.type === 'Ready')?.status;
          return ready || '-';
        },
      },
      {
        header: 'Status',
        accessorFn: item => {
          const message = item.jsonData.status?.conditions?.find(
            c => c.type === 'Ready'
          )?.message;
          return message || '-';
        },
      },
    ];

    return columns;
  }
  console.log("resource is ",resource);
  const isHelmChart = resource?.[0]?.jsonData?.kind === 'HelmChart';
  const columns = prepareColumns();
  if(isHelmChart) {
    console.log("resource is HelmChart");
    // add chart column to second index
    columns.splice(2, 0, {
      header: 'Chart',
      accessorFn: item => {
        const chart = item?.jsonData?.spec?.chart;
        return chart || '-';
      },
    });

    // add Version  column to third index
    columns.splice(3, 0, {
      header: 'Version',
      accessorFn: item => {
        const version = item?.jsonData?.spec?.version;
        return version || '-';
      },
    });

    // add source kind column to fourth index

    columns.splice(4, 0, {
      header: 'Source Kind',
      accessorFn: item => {
        const sourceKind = item?.jsonData?.spec?.sourceRef.kind;
        return sourceKind || '-';
      },
    });

    // add source name column to fifth index

    columns.splice(5, 0, {
      header: 'Source Name',
      accessorFn: item => {
        const sourceName = item?.jsonData?.spec?.sourceRef.name;
        if(sourceName) {
          return <Link routeName={`/flux/sources/:namespace/:type/:name`} params={{ namespace: item.jsonData.metadata.namespace, type: item.jsonData.spec.sourceRef.kind, name: sourceName }}>{sourceName}</Link>;
        }
        return '-';
      },
    });
  } else {
    columns.splice(2, 0, {
      header: 'URL',
      accessorFn: item => {
        const url = item?.jsonData?.spec?.url;
        return url || '-';
      },
    })
  }
  console.log("columns is ",columns);
  return (
    <SectionBox title={title}>
      <Table
        data={resource}
        columns={columns}
      />
    </SectionBox>
  );
}
