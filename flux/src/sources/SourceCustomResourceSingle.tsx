import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { KubeCRD } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import SourceLink from '../common/Link';
import Table, { TableProps } from '../common/Table';

interface FluxSourceCustomResourceProps {
  crd: KubeCRD;
  title?: string | JSX.Element;
}

export default function FluxSourceCustomResource(props: FluxSourceCustomResourceProps) {
  const { crd, title } = props;
  const resourceClass = React.useMemo(() => {
    return crd?.makeCRClass();
  }, [crd]);

  if (!resourceClass) {
    return null;
  }

  return (
    <FluxSourceCustomResourceRenderer
      resourceClass={resourceClass}
      title={title || crd.metadata.name}
      type={crd.spec.names.plural}
    />
  );
}

interface FluxSourceCustomResourceRendererProps {
  resourceClass: KubeObject;
  title: string | JSX.Element;
  type: string;
}

function FluxSourceCustomResourceRenderer(props: FluxSourceCustomResourceRendererProps) {
  const { resourceClass, title, type } = props;
  const [resource] = resourceClass.useList();

  function prepareColumns() {
    const columns: TableProps['columns'] = [
      {
        extends: 'name',
        Cell: ({ row: { original: item } }) => (
          <Link
            routeName={`/flux/sources/:type/:namespace/:name`}
            params={{
              name: item.metadata.name,
              namespace: item.metadata.namespace,
              type,
            }}
          >
            {item.metadata.name}
          </Link>
        ),
      },
      'namespace',
      'status',
      'message',
      'lastUpdated',
    ];

    return columns;
  }
  const isHelmChart = resource?.[0]?.jsonData?.kind === 'HelmChart';
  const columns = prepareColumns();
  let colIndexToInsert = columns.length - 2;
  if (isHelmChart) {
    // add chart column to second index
    columns.splice(colIndexToInsert++, 0, {
      header: 'Chart',
      accessorFn: item => {
        const chart = item?.jsonData?.spec?.chart;
        return chart || '-';
      },
    });

    // add Version  column to third index
    columns.splice(colIndexToInsert++, 0, {
      header: 'Version',
      accessorFn: item => {
        const version = item?.jsonData?.spec?.version;
        return version || '-';
      },
    });

    // add source kind column to fourth index

    columns.splice(colIndexToInsert++, 0, {
      header: 'Source Kind',
      accessorFn: item => {
        const sourceKind = item?.jsonData?.spec?.sourceRef.kind;
        return sourceKind || '-';
      },
    });

    // add source name column to fifth index

    columns.splice(colIndexToInsert++, 0, {
      header: 'Source Name',
      accessorFn: item => {
        const sourceName = item?.jsonData?.spec?.sourceRef.name;
        if (sourceName) {
          return (
            <Link
              routeName={`/flux/sources/:type/:namespace/:name`}
              params={{
                namespace: item.jsonData.metadata.namespace,
                type: item.jsonData.spec.sourceRef.kind,
                name: sourceName,
              }}
            >
              {sourceName}
            </Link>
          );
        }
        return '-';
      },
    });
  } else {
    columns.splice(colIndexToInsert++, 0, {
      header: 'URL',
      accessorFn: item => {
        console.log(item);
        const url = item?.jsonData?.spec?.url;
        return url ? <SourceLink url={url} wrap /> : '-';
      },
    });
  }

  console.log(title);
  return (
    <SectionBox title={title}>
      <Table
        data={resource}
        columns={columns}
        defaultSortingColumn={3}
        filterFunction={useFilterFunc()}
      />
    </SectionBox>
  );
}
