import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { MachineHealthCheck } from '../../resources/machinehealthcheck';

export function MachineHealthCheckDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={MachineHealthCheck}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.machine-health-check-conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </>
  );
}
