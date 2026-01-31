import {
  HoverInfoLabel,
  Link,
  SectionBox,
  ShowHideLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import K8s from '@kinvolk/headlamp-plugin/lib/k8s';
import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import { KubeObject, KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { localeDate, timeAgo } from '@kinvolk/headlamp-plugin/lib/Utils';
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Table from '../common/Table';
import { PluralName } from './pluralName';

export function getSourceNameAndPluralKind(item: KubeObject): {
  name: string;
  pluralKind: string;
  namespace: string | undefined;
} {
  const itemKind = item.jsonData.kind;
  let pluralKind = '';
  let name = '';
  let namespace: string | undefined;

  if (itemKind === 'Kustomization') {
    pluralKind = PluralName(item.jsonData.spec.sourceRef.kind);
    name = item.jsonData.spec?.sourceRef?.name;
    namespace = item.jsonData.spec.sourceRef.namespace;
  } else if (itemKind === 'HelmRelease') {
    const refToCheck =
      item?.jsonData?.spec?.chartRef ?? item?.jsonData?.spec?.chart?.spec?.sourceRef;
    if (refToCheck) {
      pluralKind = PluralName(refToCheck.kind);
      name = refToCheck.name;
      namespace = refToCheck.namespace;
    }
  } else {
    pluralKind = PluralName(itemKind);
    name = item.metadata.name;
  }

  return { name, pluralKind, namespace };
}

export function ObjectEvents(props: {
  name: string;
  namespace: string;
  resourceClass: KubeObjectClass;
}) {
  const { name, namespace, resourceClass } = props;

  const [events] = Event.useList({
    namespace,
    fieldSelector: `involvedObject.name=${name},involvedObject.kind=${resourceClass.kind}`,
  });

  if (!events) {
    return <></>;
  }
  return <ObjectEventsRenderer events={events} />;
}

export function ObjectEventsRenderer(props: { events?: Event[] }) {
  const { events } = props;

  if (!events) {
    return <></>;
  }

  return (
    <SectionBox title={'Events'}>
      <Table
        // @ts-ignore -- TODO Update the sorting param
        defaultSortingColumn={4}
        columns={[
          {
            header: 'Type',
            gridTemplate: 'min-content',
            accessorFn: item => {
              return item.type;
            },
          },
          {
            header: 'Reason',
            gridTemplate: 'min-content',
            accessorFn: item => {
              return item.reason;
            },
          },
          {
            header: 'From',
            gridTemplate: 'min-content',
            accessorFn: item => {
              return item.source.component;
            },
          },
          {
            header: 'Message',
            accessorFn: item => {
              return (
                item && (
                  <ShowHideLabel labelId={`${item?.metadata?.uid}-message`}>
                    {item.message ?? ''}
                  </ShowHideLabel>
                )
              );
            },
          },
          {
            id: 'age',
            header: 'Age',
            accessorFn: item => {
              if (item.count > 1) {
                return `${timeAgo(item.lastOccurrence)} (${item.count} times over ${timeAgo(
                  item.firstOccurrence
                )})`;
              }
              const eventDate = timeAgo(item.lastOccurrence, { format: 'mini' });
              let label: string;
              if (item.count > 1) {
                label = `${eventDate} ${item.count} times since ${timeAgo(item.firstOccurrence)}`;
              } else {
                label = eventDate;
              }

              return (
                <HoverInfoLabel
                  label={label}
                  hoverInfo={localeDate(item.lastOccurrence)}
                  icon="mdi:calendar"
                />
              );
            },
            gridTemplate: 'min-content',
            enableColumnFilter: false,
            muiTableBodyCellProps: {
              align: 'right',
            },
          },
        ]}
        data={events}
        initialState={{
          sorting: [
            {
              id: 'age',
              desc: false,
            },
          ],
        }}
      />
    </SectionBox>
  );
}

export function parseDuration(duration) {
  const regex = /(\d+)([hms])/g; // Match numbers followed by h, m, or s
  let totalMilliseconds = 0;
  let match;

  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h':
        totalMilliseconds += value * 60 * 60 * 1000; // Convert hours to milliseconds
        break;
      case 'm':
        totalMilliseconds += value * 60 * 1000; // Convert minutes to milliseconds
        break;
      case 's':
        totalMilliseconds += value * 1000; // Convert seconds to milliseconds
        break;
    }
  }

  return totalMilliseconds;
}

export function NameLink(resourceClass: KubeObjectClass) {
  const apiVersion = new String(resourceClass.apiVersion); // explicit String cast is needed for string methods
  const slashIndex = apiVersion.lastIndexOf('/');
  const groupName = slashIndex > 0 ? apiVersion.substring(0, slashIndex) : apiVersion;
  const pluralName = PluralName(resourceClass.kind);

  return {
    header: 'Name',
    accessorKey: 'metadata.name',
    Cell: ({ cell, row }) => (
      <Link
        routeName={groupName.substring(0, groupName.indexOf('.'))}
        params={{
          name: row.original.jsonData.metadata.name,
          namespace: row.original.jsonData.metadata.namespace,
          pluralName: pluralName,
        }}
      >
        {cell.getValue()}
      </Link>
    ),
  };
}
export function useFluxCheck() {
  const [crds] = K8s.ResourceClasses.CustomResourceDefinition.useList();
  const [fluxCRDs, setFluxCrds] = React.useState([]);
  useEffect(() => {
    if (!crds) return;
    setFluxCrds(crds?.filter(crd => crd.metadata.name.includes('fluxcd.')));
  }, [crds]);
  const [gitRepoCRD, allCrdsSuccessful] = React.useMemo(() => {
    const gitRepoCRD = fluxCRDs.find(
      crd => crd?.jsonData?.metadata?.name === 'gitrepositories.source.toolkit.fluxcd.io'
    );
    const allCrdsSuccessful = fluxCRDs.every(crd => {
      if (!crd) return true;
      const conditions = crd?.jsonData.status?.conditions || [];
      // Check if any condition has  status "True"
      const isSuccess = conditions.some(cond => cond.status === 'True');
      return isSuccess;
    });

    return [gitRepoCRD, allCrdsSuccessful];
  }, [fluxCRDs]);

  const fluxCheck = React.useMemo(() => {
    const partOfLabel = 'app.kubernetes.io/part-of';
    const kustomizeLabel = 'kustomize.toolkit.fluxcd.io';
    const version = gitRepoCRD?.jsonData?.metadata.labels?.['app.kubernetes.io/version'] ?? '';
    const name = gitRepoCRD?.jsonData?.metadata.labels?.[kustomizeLabel + '/name'] ?? '';
    const namespace = gitRepoCRD?.jsonData?.metadata.labels?.[kustomizeLabel + '/namespace'] ?? '';
    const partOf = gitRepoCRD?.jsonData?.metadata.labels?.[partOfLabel] ?? '';

    return {
      version,
      isBoostrapped: !!name && !!namespace,
      distribution: !!partOf && !!version ? partOf + '-' + version : '',
      namespace,
    };
  }, [gitRepoCRD]);

  return {
    ...fluxCheck,
    allCrdsSuccessful,
  };
}

export const useNamespaces = () => {
  interface FilterState {
    namespaces: Set<string>;
  }

  const namespacesSet = useSelector(({ filter }: { filter: FilterState }) => filter.namespaces);
  return useMemo(() => [...namespacesSet], [namespacesSet]);
};
