import {
  ConditionsSection,
  DetailsGrid,
  Link,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { MachinePool } from '../../resources/machinepool';
import { renderReplicas, showReplicas } from '../common';

export function MachinePoolDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={MachinePool}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        extraInfo={item =>
          item && [
            {
              name: 'Cluster',
              value: item.spec?.clusterName && (
                <Link
                  routeName="capicluster"
                  params={{
                    name: item.spec.clusterName,
                    namespace: item.metadata.namespace,
                  }}
                >
                  {item.spec.clusterName}
                </Link>
              ),
            },
            {
              name: 'Phase',
              value: item.status?.phase,
            },
            {
              name: 'Bootstrap Ready',
              value: item.status?.bootstrapReady ? 'True' : 'False',
              hide: item.status?.bootstrapReady === undefined,
            },
            {
              name: 'Infrastructure Ready',
              value: item.status?.infrastructureReady ? 'True' : 'False',
              hide: item.status?.infrastructureReady === undefined,
            },
            {
              name: 'Replicas',
              value: renderReplicas(item),
              hide: !showReplicas(item),
            },
            {
              name: 'Min Ready Seconds',
              value: item.spec?.minReadySeconds,
              hide: item.spec?.minReadySeconds === undefined,
            },
            {
              name: 'Failure Domains',
              value: item.spec?.failureDomains?.join(', '),
              hide: !item.spec?.failureDomains || item.spec.failureDomains.length === 0,
            },
            {
              name: 'Version',
              value: item.spec?.template?.spec?.version,
            },
          ]
        }
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
