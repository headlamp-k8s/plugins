import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import { NotSupported } from '../checkflux';
import SourceLink from '../common/Link';
import {
  BucketRepository,
  ExternalArtifact,
  GitRepository,
  HelmChart,
  HelmRepository,
  OCIRepository,
} from '../common/Resources';
import Table, { TableProps } from '../common/Table';
import { useNamespaces } from '../helpers';

export function FluxSources() {
  const { t } = useTranslation();
  return (
    <>
      <FluxSource
        resourceClass={GitRepository}
        pluralName="gitrepositories"
        title={t('Git Repositories')}
      />
      <FluxSource
        resourceClass={HelmRepository}
        pluralName="helmrepositories"
        title={t('Helm Repositories')}
      />
      <FluxSource resourceClass={HelmChart} pluralName="helmcharts" title={t('Helm Charts')} />
      <FluxSource
        resourceClass={OCIRepository}
        pluralName="ocirepositories"
        title={t('OCI Repositories')}
      />
      <FluxSource resourceClass={BucketRepository} pluralName="buckets" title={t('Buckets')} />
      <FluxSource
        resourceClass={ExternalArtifact}
        pluralName="externalartifacts"
        title={t('External Artifacts')}
      />
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
  const [resources, error] = resourceClass.useList({ namespace: useNamespaces() });
  const { t } = useTranslation();

  // eslint-disable-next-line react/no-unstable-nested-components
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
      header: t('Chart'),
      accessorFn: item => {
        const chart = item?.jsonData?.spec?.chart;
        return chart || '-';
      },
    });

    // add Version  column to third index
    columns.splice(colIndexToInsert++, 0, {
      header: t('Version'),
      accessorFn: item => {
        const version = item?.jsonData?.spec?.version;
        return version || '-';
      },
    });

    // add source kind column to fourth index

    columns.splice(colIndexToInsert++, 0, {
      header: t('Source Kind'),
      accessorFn: item => {
        const sourceKind = item?.jsonData?.spec?.sourceRef.kind;
        return sourceKind || '-';
      },
    });

    // add source name column to fifth index

    columns.splice(colIndexToInsert++, 0, {
      header: t('Source Name'),
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
      header: t('URL'),
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
