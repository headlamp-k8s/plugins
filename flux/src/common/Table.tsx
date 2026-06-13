import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  DateLabel,
  Link,
  ShowHideLabel,
  Table as HTable,
  TableColumn,
  TableProps as HTableProps,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { KubeCRD } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';
import { getSourceNameAndPluralKind } from '../helpers';
import { PluralName } from '../helpers/pluralName';
import StatusLabel, { getStatusText } from './StatusLabel';

type CommonColumnType =
  | 'namespace'
  | 'name'
  | 'lastUpdated'
  | 'age'
  | 'source'
  | 'message'
  | 'status'
  | 'revision';

interface TableCol {
  id?: string;
  header: string;
  accessorKey?: string;
  accessorFn?: (item: any) => React.ReactNode;
  Cell?: (props: { row: { original: any } }) => React.ReactNode;
}

interface NameColumn extends Partial<TableCol> {
  extends: 'name';
  routeName?: string;
}

export interface TableProps extends Omit<HTableProps<any>, 'columns'> {
  columns: (TableCol | CommonColumnType | NameColumn | TableColumn<any, any>)[];
}

function prepareLastUpdated(item: KubeCRD) {
  const condition = item?.jsonData?.status?.conditions?.find(c => c.type === 'Ready');
  return condition?.lastTransitionTime;
}

function prepareNameColumn(
  colProps: Partial<NameColumn> = {},
  t: (key: string) => string
): TableCol {
  const { routeName, ...genericProps } = colProps;

  // Remove the extends property from the genericProps
  delete genericProps.extends;

  return {
    header: t('Name'),
    accessorKey: 'metadata.name',
    Cell: ({ row: { original: item } }) => (
      <Link
        routeName={routeName}
        params={{
          name: item.metadata.name,
          namespace: item.metadata.namespace,
          pluralName: PluralName(item.kind),
        }}
      >
        {item.metadata.name}
      </Link>
    ),
    ...genericProps,
  };
}

export function Table(props: TableProps) {
  const { columns, data, ...otherProps } = props;
  const { t } = useTranslation();

  const processedColumns = React.useMemo(() => {
    const seenIds = new Set<string>();

    return columns.map((column, index) => {
      let colObj: any;
      if (typeof column === 'string') {
        switch (column) {
          case 'namespace':
            colObj = {
              id: 'namespace',
              header: t('Namespace'),
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
            break;
          case 'name':
            colObj = {
              id: 'name',
              ...prepareNameColumn(undefined, t),
            };
            break;
          case 'lastUpdated':
            colObj = {
              id: 'lastUpdated',
              header: t('Last Updated'),
              accessorFn: item => prepareLastUpdated(item),
              Cell: ({ cell }: any) => <DateLabel format="mini" date={cell.getValue()} />,
            };
            break;
          case 'age':
            colObj = {
              id: 'age',
              header: t('Age'),
              gridTemplate: 'min-content',
              accessorFn: (item: KubeObject) =>
                -new Date(item.metadata.creationTimestamp).getTime(),
              enableColumnFilter: false,
              muiTableBodyCellProps: {
                align: 'right',
              },
              Cell: ({ row }) =>
                row.original && (
                  <DateLabel date={row.original.metadata.creationTimestamp} format="mini" />
                ),
            };
            break;
          case 'source':
            colObj = {
              id: 'source',
              header: t('Source'),
              accessorFn: item => {
                const { name } = getSourceNameAndPluralKind(item);
                return name;
              },
              Cell: ({ row }: any) => {
                const { name, pluralKind, namespace } = getSourceNameAndPluralKind(row.original);
                return (
                  <Link
                    routeName="source"
                    params={{
                      pluralName: pluralKind,
                      namespace: namespace ?? row.original.jsonData.metadata.namespace,
                      name: name,
                    }}
                  >
                    {name}
                  </Link>
                );
              },
            };
            break;
          case 'status':
            colObj = {
              id: 'status',
              header: t('Status'),
              accessorFn: item => t(getStatusText(item)),
              Cell: ({ row: { original: item } }: any) => <StatusLabel item={item} />,
            };
            break;
          case 'revision':
            colObj = {
              id: 'revision',
              header: t('Revision'),
              accessorFn: item => {
                const reference = item.jsonData.status?.lastAttemptedRevision;
                return (
                  <ShowHideLabel labelId={`${item?.metadata?.uid}-revision`}>
                    {reference ?? ''}
                  </ShowHideLabel>
                );
              },
            };
            break;
          case 'message':
            colObj = {
              id: 'message',
              header: t('Message'),
              accessorFn: item => {
                const message = item.jsonData.status?.conditions?.find(
                  c => c.type === 'Ready'
                )?.message;
                return (
                  <ShowHideLabel labelId={`${item?.metadata?.uid}-message`}>
                    {message ?? ''}
                  </ShowHideLabel>
                );
              },
            };
            break;
          default:
            colObj = { id: column, header: column };
        }
      } else if ((column as NameColumn).extends === 'name') {
        colObj = prepareNameColumn(column as NameColumn, t);
      } else {
        colObj = { ...column };
      }

      const baseId =
        colObj.id || colObj.accessorKey || (colObj.key ? `${colObj.key}_${index}` : `col_${index}`);

      let finalId = String(baseId);
      let counter = 1;
      while (seenIds.has(finalId)) {
        finalId = `${baseId}_${counter}`;
        counter++;
      }
      seenIds.add(finalId);
      colObj.id = finalId;

      return colObj;
    });
  }, [columns, t]);

  return (
    <HTable
      data={data}
      loading={data === null}
      {...otherProps}
      columns={processedColumns as TableCol[]}
    />
  );
}

export default Table;
