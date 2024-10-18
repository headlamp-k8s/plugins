import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  DateLabel,
  Link,
  Table as HTable,
  TableProps as HTableProps,
  ShowHideLabel,
  StatusLabel
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { KubeCRD } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';
import { getSourceNameAndType } from '../helpers';

type CommonColumnType = 'namespace' | 'name' | 'lastUpdated' | 'age' | 'source' | 'message' | 'status' | 'revision';

export interface TableProps extends Omit<HTableProps, 'columns'> {
  columns: ({
    header: string;
    accessorKey?: string;
    accessorFn?: (item: any) => React.ReactNode;
    Cell?: (props: { row: { original: any } }) => React.ReactNode;
  } | CommonColumnType)[];
}

function prepareLastUpdated(item: KubeCRD) {
  const condition = item?.jsonData?.status?.conditions?.find(c => c.type === 'Ready');
  return condition?.lastTransitionTime;
}

function prepareStatus(item: KubeCRD) {
  const ready = item?.status?.conditions?.find(c => c.type === 'Ready');
  if (!ready) {
    return '-';
  }
  if (ready.status === 'Unknown') {
    return <StatusLabel status="warning">Reconciling</StatusLabel>;
  }
  return (
    <StatusLabel status={ready.status === 'True' ? 'success' : 'error'}>
      {ready.status === 'True' ? 'Ready' : 'Failed'}
    </StatusLabel>
  );
}

export function Table(props: TableProps) {
  const { columns, ...otherProps } = props;

  const processedColumns = React.useMemo(() => {
    return columns.map(column => {
      if (typeof column === 'string') {
        switch (column) {
          case 'namespace':
            return {
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
            };
          case 'name':
            return {
              header: 'Name',
              accessorKey: 'metadata.name',
              Cell: ({ row: { original: item } }) => (
                <Link
                  routeName={`/flux/${item.kind.toLowerCase()}s/:namespace/:name`}
                  params={{
                    name: item.metadata.name,
                    namespace: item.metadata.namespace,
                  }}
                >
                  {item.metadata.name}
                </Link>
              ),
            };
          case 'lastUpdated':
            return {
              header: 'Last Updated',
              accessorFn: item => <DateLabel format="mini" date={prepareLastUpdated(item)} />,
            };
          case 'age':
            return {
              id: 'age',
              header: 'Age',
              gridTemplate: 'min-content',
              accessorFn: (item: KubeObject) =>
                -new Date(item.metadata.creationTimestamp).getTime(),
              enableColumnFilter: false,
              muiTableBodyCellProps: {
                align: 'right',
              },
              Cell: ({ row }) =>
                row.original && (
                  <DateLabel
                    date={row.original.metadata.creationTimestamp}
                    format="mini"
                  />
                ),
            };
          case 'source':
            return {
              header: 'Source',
              accessorFn: item => {
                const { name, type } = getSourceNameAndType(item);
                return (
                  <Link
                    routeName={`/flux/sources/:namespace/:type/:name`}
                    params={{ namespace: item.jsonData.metadata.namespace, type, name }}
                  >
                    {name}
                  </Link>
                );
              },
            };
          case 'status':
            return {
              header: 'Status',
              accessorFn: item => {
                return prepareStatus(item.jsonData);
              },
            };
          case 'revision':
            return {
              header: 'Revision',
              accessorFn: item => {
                const reference = item.jsonData.status?.lastAttemptedRevision;
                return (
                  <ShowHideLabel labelId={`${item?.metadata?.uid}-revision`}>{reference ?? ''}</ShowHideLabel>
                );
              },
            };
          case 'message':
            return {
              header: 'Message',
              accessorFn: item => {
                const message = item.jsonData.status?.conditions?.find(
                  c => c.type === 'Ready'
                )?.message;
                return (
                  <ShowHideLabel labelId={`${item?.metadata?.uid}-message`}>{message ?? ''}</ShowHideLabel>
                );
              },
            };
          default:
            return column;
        }
      }
      return column;
    });
  },
  [columns]);

  return <HTable {...otherProps} columns={processedColumns} />;
}

export default Table;