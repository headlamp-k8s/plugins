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
import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Link as MuiLink } from '@mui/material';

export default function FluxRunTime(props) {
  const [pods, error] = K8s.ResourceClasses.Pod.useList();
  const [crds] = K8s.ResourceClasses.CustomResourceDefinition.useList();
  const helmController = pods?.filter(pod => pod.metadata.labels['app'] === 'helm-controller');
  const kustomizeController = pods?.filter(
    pod => pod.metadata.labels['app'] === 'kustomize-controller'
  );
  const notificationController = pods?.filter(
    pod => pod.metadata.labels['app'] === 'notification-controller'
  );
  const sourceController = pods?.filter(pod => pod.metadata.labels['app'] === 'source-controller');
  const imageReflectorController = pods?.filter(
    pod => pod.metadata.labels['app'] === 'image-reflector-controller'
  );
  const imageAutomationController = pods?.filter(
    pod => pod.metadata.labels['app'] === 'image-automation-controller'
  );

  const controllers = helmController?.concat(
    kustomizeController,
    notificationController,
    sourceController,
    imageReflectorController,
    imageAutomationController
  );

  return (
    <>
      <SectionBox title="Controllers">
        <Table
          data={controllers}
          columns={[
            {
              header: 'Name',
              accessorFn: item => (
                <Link
                  routeName="pod"
                  params={{ name: item.metadata.name, namespace: item.metadata.namespace }}
                >
                  {item.metadata.name}
                </Link>
              ),
            },
            {
              header: 'Namespace',
              accessorFn: item => (
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
              accessorFn: item => (
                <MuiLink href={item.spec.containers[0].image}>
                  {item.spec.containers[0].image}
                </MuiLink>
              ),
            },
          ]}
        />
      </SectionBox>
      <SectionBox title="Custom Resource Definitions">
        <Table
          data={crds?.filter(crd => crd.metadata.name.includes('fluxcd.'))}
          columns={[
            {
              header: 'Name',
              accessorFn: item => (
                <Link
                  routeName="crd"
                  params={{
                    name: item.metadata.name,
                    namespace: item.metadata.namespace,
                  }}
                >
                  {item.metadata.name}
                </Link>
              ),
            },
            {
              header: 'Scope',
              accessorFn: item => item.spec.scope,
            },
          ]}
        />
      </SectionBox>
    </>
  );
}
