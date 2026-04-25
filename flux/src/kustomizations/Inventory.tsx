import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { DateLabel, Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';
import Table from '../common/Table';
import { PluralName } from '../helpers/pluralName';

function parseID(id: string) {
  const parts = id.split('_');
  const isClusterScoped = id.startsWith('_');
  if (isClusterScoped) {
    return {
      namespace: undefined,
      group: parts[1],
      kind: parts[2],
      name: parts[3],
    };
  }
  return {
    namespace: parts[0],
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

  React.useEffect(() => {
    props.inventory?.forEach(item => {
      const parsedID = parseID(item.id);
      const { name, namespace, group, kind } = parsedID;

      // @todo: this use of makeCustomResourceClass is deprecated
      // "Use the version of the function that receives an object as its argument."
      const resourceClass = makeCustomResourceClass({
        apiInfo: [{ group: group, version: item.v }],
        isNamespaced: !!namespace,
        singularName: kind,
        pluralName: PluralName(kind),
        kind: kind,
        customResourceDefinition: undefined as any,
      });

      resourceClass.apiGet(
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
    });
  }, []);

  return (
    <Table
      data={resources}
      columns={[
        {
          header: 'Name',
          accessorKey: 'metadata.name',
          Cell: ({ row: { original: item } }) => inventoryNameLink(item),
        },
        {
          header: 'Namespace',
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
          header: 'Kind',
          accessorFn: (item: KubeObject) => item.kind,
        },
        {
          header: 'Ready',
          accessorFn: (item: KubeObject) => {
            if (item.jsonData?.status) {
              return item.jsonData.status.conditions?.findIndex(c => c.type === 'Ready') !== -1
                ? 'True'
                : 'False';
            }
            return 'Unknown';
          },
        },
        {
          header: 'Age',
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

function inventoryNameLink(item: KubeObject) {
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
    if (resource?.getDetailsLink && resource.getDetailsLink()) {
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
