import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { DateLabel, Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';
import Table from '../common/Table';
import { PluralName } from '../helpers/pluralName';
import { getMatchingResourceClass } from './inventoryResourceClass';

export function parseID(id: string) {
  const parts = id.split('_');
  return {
    namespace: parts[0] || undefined,
    name: parts[1],
    group: parts[2],
    kind: parts[3],
  };
}

export function GetResourcesFromInventory(
  props: Readonly<{
    inventory: {
      id: string;
      v: string;
    }[];
  }>
) {
  const [resources, setResources] = React.useState<KubeObject[]>([]);
  const { t } = useTranslation();

  React.useEffect(() => {
    setResources([]);
    const unsubscribes: Promise<() => void>[] = [];

    props.inventory?.forEach(item => {
      const parsedID = parseID(item.id);
      const { name, namespace, group, kind } = parsedID;

      // Prefer registered Headlamp resource classes when their kind, group, and version
      // match (e.g. CustomResourceDefinition, Pod, Service) so built-in getters/methods
      // are preserved and classes are not overwritten. Fall back to makeCustomResourceClass
      // for unregistered custom resources or when API group/version differs.
      const resourceClass =
        getMatchingResourceClass(kind, group, item.v) ??
        makeCustomResourceClass({
          apiInfo: [{ group: group, version: item.v }],
          isNamespaced: !!namespace,
          singularName: kind,
          pluralName: PluralName(kind),
          kind: kind,
          customResourceDefinition: undefined as any,
        });

      const unsubscribe = resourceClass.apiGet(
        data => {
          // add the resource if it does not exist yet, compare with uid.
          setResources(prevResources => {
            if (prevResources.find(r => r.metadata.uid === data.metadata.uid)) {
              return prevResources;
            }
            return [...prevResources, data];
          });
        },
        name,
        namespace,
        () /* on error */ => {
          const resource = { metadata: { name: name, namespace: namespace } };
          setResources(prevResources => {
            return [...prevResources, resource as KubeObject];
          });
        }
      )();

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsubscribePromise => {
        unsubscribePromise
          .then(cancelFn => {
            if (typeof cancelFn === 'function') {
              cancelFn();
            }
          })
          .catch(() => {
            /* ignore */
          });
      });
    };
  }, [props.inventory]);

  return (
    <Table
      data={resources}
      columns={[
        {
          header: t('Name'),
          accessorKey: 'metadata.name',
          Cell: ({ row: { original: item } }) => inventoryNameLink(item),
        },
        {
          header: t('Namespace'),
          accessorFn: item => item.metadata?.namespace ?? '',
          id: 'namespace',
          Cell: ({ row: { original: item } }) =>
            item.metadata.namespace ? (
              <Link
                routeName="namespace"
                params={{
                  name: item?.metadata?.namespace,
                }}
              >
                {item?.metadata?.namespace}
              </Link>
            ) : (
              ''
            ),
        },
        {
          header: t('Kind'),
          accessorFn: (item: KubeObject) => item.kind,
        },
        {
          header: t('Ready'),
          accessorFn: (item: KubeObject) => {
            if (item.jsonData?.status) {
              return item.jsonData.status.conditions?.findIndex(c => c.type === 'Ready') !== -1
                ? t('True')
                : t('False');
            }
            return t('Unknown');
          },
        },
        {
          header: t('Age'),
          accessorFn: (item: KubeObject) => {
            if (item?.metadata?.creationTimestamp) {
              return <DateLabel date={item?.metadata?.creationTimestamp} />;
            }
          },
        },
      ]}
    />
  );
}

export function inventoryNameLink(item: KubeObject) {
  // return the name and not a link if we could not query the resource
  if (!item.metadata.creationTimestamp) {
    return item.metadata.name;
  }

  const kind = item.kind;
  const itemJsonData: KubeObjectInterface = item.jsonData;
  // remove version from apiVersion to get the groupName
  const apiVersion = itemJsonData.apiVersion;
  const slashIndex = apiVersion.lastIndexOf('/');
  const groupName = slashIndex > 0 ? apiVersion.substring(0, slashIndex) : apiVersion;
  const pluralName = PluralName(kind);

  // Flux types
  const allowedDomain = 'toolkit.fluxcd.io';
  if (groupName === allowedDomain || groupName.endsWith(`.${allowedDomain}`)) {
    const routeName =
      groupName === allowedDomain ? 'toolkit' : groupName.substring(0, groupName.indexOf('.'));

    return (
      <Link
        routeName={routeName}
        params={{
          pluralName: pluralName,
          name: item.metadata.name,
          namespace: item.metadata.namespace,
        }}
      >
        {item.metadata.name}
      </Link>
    );
  }

  // CRD
  if (kind === 'CustomResourceDefinition') {
    return (
      <Link
        routeName="crd"
        params={{
          name: item.metadata.name,
        }}
      >
        {item.metadata.name}
      </Link>
    );
  }

  // Standard k8s types
  const resourceKind = K8s.ResourceClasses[kind];
  if (resourceKind) {
    const resource = new resourceKind(item);
    // skip namespaced details link when cluster scoped resource has no namespace
    const canBuildLink = !(resource.isNamespaced && !item.metadata.namespace);
    if (canBuildLink && resource?.getDetailsLink && resource.getDetailsLink()) {
      return <Link kubeObject={resource}>{item.metadata.name}</Link>;
    }
    return item.metadata.name;
  }

  // Custom resources
  return (
    <Link
      routeName="customresource"
      params={{
        crName: item.metadata.name,
        crd: `${pluralName}.${groupName}`,
        namespace: item.metadata.namespace || '-',
      }}
    >
      {item.metadata.name}
    </Link>
  );
}
