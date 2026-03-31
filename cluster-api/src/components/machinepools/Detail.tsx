import {
  ConditionsSection,
  DetailsGrid,
  Loader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { MachinePool } from '../../resources/machinepool';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { renderReplicas, ScaleButton, showReplicas } from '../common/index';

export function MachinePoolDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const apiVersion = useCapiApiVersion(MachinePool.crdName, 'v1beta1');
  const VersionedMachinePool = useMemo(
    () => (apiVersion ? MachinePool.withApiVersion(apiVersion) : MachinePool),
    [apiVersion]
  );

  if (!apiVersion) return <Loader title="Detecting MachinePool version" />;

  return (
    <>
      <DetailsGrid
        resourceType={VersionedMachinePool}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        actions={item => (item ? [<ScaleButton item={item} />] : [])}
        extraInfo={item =>
          item && [
            {
              name: 'Replicas',
              value: renderReplicas(item),
              hide: !showReplicas(item),
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.machine-pool-conditions',
              section: (
                <ConditionsSection
                  resource={{
                    ...item.jsonData,
                    status: {
                      ...item.jsonData.status,
                      conditions: item.conditions, // MachinePool has a conditions getter
                    },
                  }}
                />
              ),
            },
          ]
        }
      />
    </>
  );
}
