/*
Get all pods and then from them get the controllers for flux

1. helm-controller
2. kustomize-controller
3. notification-controller
4. source-controller
5. image-reflector-controller
6. image-automation-controller

*/
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import SourceLink from '../common/Link';
import Table from '../common/Table';

export function FluxRunTime() {
  const [pods] = K8s.ResourceClasses.Pod.useList();
  const [crds] = K8s.ResourceClasses.CustomResourceDefinition.useList();
  const helmController = pods?.filter(pod => pod.metadata.labels?.['app'] === 'helm-controller');
  const kustomizeController = pods?.filter(
    pod => pod.metadata.labels?.['app'] === 'kustomize-controller'
  );
  const notificationController = pods?.filter(
    pod => pod.metadata.labels?.['app'] === 'notification-controller'
  );
  const sourceController = pods?.filter(
    pod => pod.metadata.labels?.['app'] === 'source-controller'
  );
  const imageReflectorController = pods?.filter(
    pod => pod.metadata.labels?.['app'] === 'image-reflector-controller'
  );
  const imageAutomationController = pods?.filter(
    pod => pod.metadata.labels?.['app'] === 'image-automation-controller'
  );
  const sourceWatcher = pods?.filter(pod => pod.metadata.labels?.['app'] === 'source-watcher');

  const controllers = helmController?.concat(
    kustomizeController,
    notificationController,
    sourceController,
    imageReflectorController,
    imageAutomationController,
    sourceWatcher
  );

  return (
    <>
      <SectionBox title="Controllers">
        <Table
          data={controllers}
          columns={[
            {
              extends: 'name',
              routeName: 'pod',
            },
            {
              header: 'Namespace',
              accessorKey: 'metadata.namespace',
              Cell: ({ row: { original: item } }) => (
                <Link routeName="namespace" params={{ name: item.metadata.namespace }}>
                  {item.metadata.namespace}
                </Link>
              ),
            },
            {
              header: 'Status',
              accessorFn: item => item.status.phase,
            },
            {
              header: 'Image',
              accessorFn: item => <SourceLink url={item.spec.containers[0].image} />,
            },
          ]}
        />
      </SectionBox>
      <SectionBox title="Custom Resource Definitions">
        <Table
          data={crds?.filter(crd => crd.metadata.name.includes('fluxcd.'))}
          columns={[
            {
              extends: 'name',
              routeName: 'crd',
            },
            {
              header: 'Scope',
              accessorFn: item => item.spec.scope,
            },
            {
              header: 'Stored Versions',
              accessorFn: item => item?.status?.storedVersions.join(', '),
            },
          ]}
        />
      </SectionBox>
    </>
  );
}
