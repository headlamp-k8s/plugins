import { DateLabel, Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import React from 'react';
import Table from '../common/Table';
import { prepareNameLink } from '../helpers/index';
import { PluralName } from './pluralName';

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
          Cell: ({ row: { original: item } }) => prepareNameLink(item),
        },
        {
          header: 'Namespace',
          accessorKey: 'metadata.namespace',
          Cell: ({ row: { original: item } }) =>
            item.metadata.namespace ? (
              <Link
                routeName={`namespace`}
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
