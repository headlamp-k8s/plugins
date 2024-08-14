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
  console.log(resource);
  return (
    <SectionBox title={title}>
      <Table
        data={resource}
        columns={[
          {
            header: 'Name',
            accessorFn: item => {
              console.log(item);
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
            header: 'Ready',
            accessorFn: item => {
              const ready =
                item.jsonData.status?.conditions?.findIndex(c => c.type === 'Ready') !== -1
                  ? 'True'
                  : 'False';
              return ready;
            },
          },
          {
            header: 'Message',
            accessorFn: item => {
              const message = item.jsonData.status?.conditions?.find(
                c => c.type === 'Ready'
              )?.message;
              return message || '-';
            },
          },
          {
            header: 'URL',
            accessorFn: item => {
              const url = item.jsonData.spec?.url;
              return <MuiLink href={url}> {url} </MuiLink> || '-';
            },
          },
          {
            header: 'Chart',
            accessorFn: item => {
              const chart = item.jsonData.spec?.chart;
              return chart || '-';
            },
          },
          {
            header: 'Reference',
            accessorFn: item => {
              const reference = item.jsonData.spec?.ref?.branch;
              return reference || '-';
            },
          },
          {
            header: 'Interval',
            accessorFn: item => {
              const interval = item.jsonData.spec?.interval;
              return interval || '-';
            },
          },
          {
            header: 'Last Updated',
            accessorFn: item => <DateLabel date={item.metadata.creationTimestamp} />,
          },
        ]}
      />
    </SectionBox>
  );
}
