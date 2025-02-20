import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { DateLabel, Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';
import Table from '../common/Table';
import { PluralName } from '../helpers/pluralName';

function parseID(id: string) {
  /* ID is the string representation of the Kubernetes resource object's
    metadata,
    in the format '<namespace>_<name>_<group>_<kind>'.
    */
  const parsedID = id.split('_');
  const namespace = parsedID[0] === '' ? undefined : parsedID[0];
  const name = parsedID[1];
  const group = parsedID[2];
  const kind = parsedID[3];
  return { name, namespace, group, kind };
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

      const resourceClass = makeCustomResourceClass({
        apiInfo: [{ group: group, version: item.v }],
        isNamespaced: !!namespace,
        singularName: kind,
        pluralName: PluralName(kind),
      });

      resourceClass.apiGet(
        data => {
          // if the resource already exist replace it with the new one which is data otherwise add it
          // use uid as the filter
          setResources(prevResources => {
            if (prevResources.find(r => r.metadata.uid === data.metadata.uid)) {
              return prevResources;
            }
            return [...prevResources, data];
          });
        },
        name,
        namespace
      )();
    });
  }, []);

  return (
    <Table
      data={resources.map((item: KubeObject) => {
        return item;
      })}
      columns={[
        {
          header: 'Name',
          accessorKey: 'metadata.name',
          Cell: ({ row: { original: item } }) => inventoryNameLink(item),
        },
        {
          header: 'Namespace',
          accessorKey: 'metadata.namespace',
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
          accessorFn: item => item.kind,
        },
        {
          header: 'Ready',
          accessorFn: item => {
            const ready =
              item.jsonData?.status?.conditions?.findIndex(c => c.type === 'Ready') !== -1
                ? 'True'
                : 'False';
            return ready;
          },
        },
        {
          header: 'Age',
          accessorFn: item => <DateLabel date={item?.metadata?.creationTimestamp} />,
        },
      ]}
    />
  );
}

function inventoryNameLink(item) {
  const kind = item.kind;

  // remove version from apiVersion to get the groupName
  const apiVersion = item.jsonData.apiVersion;
  const slashIndex = apiVersion.lastIndexOf('/');
  const groupName = slashIndex > 0 ? apiVersion.substring(0, slashIndex) : apiVersion;
  const pluralName = PluralName(kind);

  // Flux types
  if (groupName.endsWith('toolkit.fluxcd.io')) {
    return (
      <Link
        routeName={groupName.substr(0, groupName.indexOf('.'))}
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

  // standard k8s types
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
