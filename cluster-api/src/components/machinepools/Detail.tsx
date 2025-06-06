import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { MachinePool } from '../../resources/machinepool';

export function MachinePoolDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={MachinePool}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.machine-pool-conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </>
  );
}
