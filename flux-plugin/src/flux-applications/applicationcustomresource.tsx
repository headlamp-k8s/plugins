import { DateLabel, Link, SectionBox, StatusLabel, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { KubeCRD } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { Alert } from '@mui/material';
import { getSourceNameAndType } from '../helpers/index';

export default function FluxCustomResource(props: {
  resourceClass: KubeObject;
  title?: string;
  type: string;
}) {
  const { resourceClass, title, type } = props;
  const [resource] = resourceClass.useList();

  function prepareStatus(item: KubeCRD) {
    console.log("preparing status ",item);
    const ready  = item.status?.conditions?.find(c => c.type === 'Ready');
    return <StatusLabel status={item.spec.suspend ? 'warning' : ready ? 'success':'error'} >
      {item.spec.suspend ? 'Suspended' : ready ? 'Ready' : 'Not Ready'}
    </StatusLabel>;
  }

  return (
    <SectionBox title={title}>
      <Table
        data={resource}
        columns={[
          {
            header: 'Name',
            accessorFn: item => {
              return (
                <Link
                  routeName={`/flux/${type}/:namespace/:type/:name`}
                  params={{
                    name: item.metadata.name,
                    namespace: item.metadata.namespace,
                    type: title.split(' ').join('').toLowerCase(),
                  }}
                >
                  {' '}
                  {item.metadata.name}{' '}
                </Link>
              );
            },
          },
          {
            header: 'Namespace',
            accessorFn: item => (
              <Link
                routeName="namespace"
                params={{
                  name: item.metadata.namespace,
                }}
              >
                {item.metadata.namespace}
              </Link>
            ),
          },
          {
            header: 'Status',
            accessorFn: item => {
              return prepareStatus(item.jsonData);
            }
          },
          {
            header: 'Source',
            accessorFn: item => {
              const { name, type } = getSourceNameAndType(item);
              return (
                <Link
                  routeName={`/flux/sources/:namespace/:type/:name`}
                  params={{ namespace: item.jsonData.metadata.namespace, type, name }}
                >
                  {name}
                </Link>
              );
            },
          },
          {
            header: 'Message',
            accessorFn: item => {
              const message = item.jsonData.status?.conditions?.find(
                c => c.type === 'Ready'
              )?.message;
              return message || '-';
            },
          },
          {
            header: 'Revision',
            accessorFn: item => {
              const reference = item.jsonData.status?.lastAppliedRevision;
              return reference || '-';
            },
          },
          {
            header: 'Last Updated',
            accessorFn: item => <DateLabel date={item.metadata.creationTimestamp} />,
          },
        ]}
      />
    </SectionBox>
  );
}
