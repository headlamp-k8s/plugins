import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { DateLabel, Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import React, { cloneElement } from 'react';
import Table from '../common/Table';
import { prepareNameLink } from '../helpers/index';

export const KUSTOMIZE_CRD = 'kustomizations.kustomize.toolkit.fluxcd.io';
export const HELMRELEASE_CRD = 'helmreleases.helm.toolkit.fluxcd.io';

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
  return { namespace, name, group, kind };
}

export function GetResourcesFromInventory(props: {
  inventory: {
    id: string;
    v: string;
  }[];
}) {
  const [resources, setResources] = React.useState<KubeObject[]>([]);
  React.useEffect(() => {
    props.inventory?.forEach(item => {
      const parsedID = parseID(item.id);
      const { namespace, name, kind } = parsedID;
      const resource = K8s.ResourceClasses[kind];
      if (!resource) {
        return;
      }
      resource.apiGet(
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
    <>
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
            accessorKey: 'metadata.creationTimestamp',
            Cell: ({ cell }: any) => <DateLabel date={cell.getValue()} />,
          },
        ]}
      />
      <GetCustomResourceCRWrapper setResources={setResources} resources={resources} />
    </>
  );
}

function GetCustomResourceCRWrapper(props) {
  const { resources, setResources } = props;
  const CRDs = resources?.filter(item => {
    return item.kind === 'CustomResourceDefinition';
  });
  return CRDs
    ? CRDs.map(crd => (
        <GetCustomResourceCR resource={crd} resources={resources} setResources={setResources} />
      ))
    : null;
}

function GetCustomResourceCR(props: {
  resources: KubeObject[];
  resource: KubeObject;
  setResources: (...args) => void;
}) {
  const { resource, setResources } = props;
  const resourceClass = React.useMemo(() => {
    return resource.makeCRClass();
  }, [resource]);

  const [crs] = resourceClass.useList();

  React.useEffect(() => {
    if (crs) {
      const massagedResources = [];

      crs.map(data => {
        massagedResources.push(data);
      });
      setResources(prevResources => {
        // check if entries from massagedResources are already there in prevResources

        const filteredResources = massagedResources.filter(
          item => !prevResources.find(r => r.metadata.uid === item.metadata.uid)
        );
        return [...prevResources, ...filteredResources];
      });
    }
  }, [crs]);

  return null;
}
