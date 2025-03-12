import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import { NotSupported } from '../checkflux';
import SourceLink from '../common/Link';
import Table, { TableProps } from '../common/Table';

const sourceGroup = 'source.toolkit.fluxcd.io';

export function gitRepositoryClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: sourceGroup, version: 'v1' }],
    isNamespaced: true,
    singularName: 'gitrepository',
    pluralName: 'gitrepositories',
  });
}

export function ociRepositoryClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: sourceGroup, version: 'v1beta2' }],
    isNamespaced: true,
    singularName: 'ocirepository',
    pluralName: 'ocirepositories',
  });
}

export function bucketRepositoryClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: sourceGroup, version: 'v1' }],
    isNamespaced: true,
    singularName: 'bucket',
    pluralName: 'buckets',
  });
}

export function helmRepositoryClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: sourceGroup, version: 'v1' }],
    isNamespaced: true,
    singularName: 'helmrepository',
    pluralName: 'helmrepositories',
  });
}

export function helmChartClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: sourceGroup, version: 'v1' }],
    isNamespaced: true,
    singularName: 'helmchart',
    pluralName: 'helmcharts',
  });
}

export function FluxSources() {
  return (
    <>
      <FluxSource
        resourceClass={gitRepositoryClass()}
        pluralName="gitrepositories"
        title={'Git Repositories'}
      />
      <FluxSource
        resourceClass={ociRepositoryClass()}
        pluralName="ocirepositories"
        title={'OCI Repositories'}
      />
      <FluxSource resourceClass={bucketRepositoryClass()} pluralName="buckets" title={'Buckets'} />
      <FluxSource
        resourceClass={helmRepositoryClass()}
        pluralName="helmrepositories"
        title={'Helm Repositories'}
      />
      <FluxSource resourceClass={helmChartClass()} pluralName="helmcharts" title={'Helm Charts'} />
    </>
  );
}

interface FluxSourceCustomResourceRendererProps {
  resourceClass: KubeObjectClass;
  title: string;
  pluralName: string;
}

function FluxSource(props: FluxSourceCustomResourceRendererProps) {
  const filterFunction = useFilterFunc();
  const { resourceClass, title, pluralName } = props;
  const [resources, setResources] = React.useState(null);
  const [error, setError] = React.useState(null);

  resourceClass.useApiList(setResources, setError);

  function prepareColumns() {
    const columns: TableProps['columns'] = [
      {
        extends: 'name',
        Cell: ({ row: { original: item } }) => (
          <Link
            routeName={'source'}
            params={{
              name: item.metadata.name,
              namespace: item.metadata.namespace,
              pluralName: pluralName,
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
  const isHelmChart = resources?.[0]?.jsonData?.kind === 'HelmChart';
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
              routeName={'source'}
              params={{
                namespace: item.jsonData.metadata.namespace,
                pluralName: item.jsonData.spec.sourceRef.kind,
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
        const url = item?.jsonData?.spec?.url;
        return url ? <SourceLink url={url} wrap /> : '-';
      },
    });
  }
  

  if (error?.status === 404) {
    return <NotSupported typeName={title} />;
  }

  return (
    <SectionBox title={title}>
      <Table
        data={resources}
        columns={columns}
        // @ts-ignore -- TODO Update the sorting column param
        defaultSortingColumn={3}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
