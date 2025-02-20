import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectIface, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Link as MUILink } from '@mui/material';
import SourceLink from '../common/Link';
import Table, { TableProps } from '../common/Table';
import { NameLink } from '../helpers';
import { PluralName } from '../helpers/pluralName';

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
      <FluxSource resourceClass={gitRepositoryClass()} title={'Git Repositories'} />
      <FluxSource resourceClass={ociRepositoryClass()} title={'OCI Repositories'} />
      <FluxSource resourceClass={bucketRepositoryClass()} title={'Buckets'} />
      <FluxSource resourceClass={helmRepositoryClass()} title={'Helm Repositories'} />
      <FluxSource resourceClass={helmChartClass()} title={'Helm Charts'} />
    </>
  );
}

interface FluxSourceCustomResourceRendererProps {
  resourceClass: KubeObjectIface<KubeObjectInterface>;
  title: string;
}

function FluxSource(props: FluxSourceCustomResourceRendererProps) {
  const filterFunction = useFilterFunc();
  const { resourceClass, title } = props;
  const [resource, error] = resourceClass.useList();

  function prepareColumns() {
    const columns: TableProps['columns'] = [
      NameLink(resourceClass),
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
              routeName="source"
              params={{
                namespace: item.jsonData.metadata.namespace,
                name: sourceName,
                pluralName: PluralName(item.jsonData.spec.sourceRef.kind),
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
        detailRoute="source"
        data={resource}
        columns={columns}
        defaultSortingColumn={3}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
