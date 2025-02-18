import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectIface, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Link as MUILink } from '@mui/material';
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
  resourceClass: KubeObjectIface<KubeObjectInterface>;
  title: string;
  pluralName: string;
}

function FluxSource(props: FluxSourceCustomResourceRendererProps) {
  const filterFunction = useFilterFunc();
  const { resourceClass, title, pluralName } = props;
  const [resource, error] = resourceClass.useList();

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
              type: pluralName,
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
        const url = item?.jsonData?.spec?.url;
        return url ? <SourceLink url={url} wrap /> : '-';
      },
    });
  }

  return (
    <SectionBox title={title}>
      {error?.status === 404 && (
        <>
          <p>Flux installation has no support for {title}.</p>
          <p>
            Follow the{' '}
            <MUILink target="_blank" href="https://fluxcd.io/docs/installation/">
              installation guide
            </MUILink>{' '}
            to support {title} on your cluster
          </p>
        </>
      )}
      <Table
        data={resource}
        columns={columns}
        defaultSortingColumn={3}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
