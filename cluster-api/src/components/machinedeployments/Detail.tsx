import {
  ConditionsSection,
  DetailsGrid,
  Link,
  MetadataDictGrid,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { MachineDeployment } from '../../resources/machinedeployment';
import { renderReplicas, renderUpdateStrategy, showReplicas } from '../common';

export function MachineDeploymentDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={MachineDeployment}
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
              name: 'Rollout After',
              value: item.spec?.rolloutAfter
                ? new Date(item.spec.rolloutAfter).toLocaleString()
                : 'default (immediate)',
            },
            {
              name: 'Min Ready Seconds',
              value: item.spec?.minReadySeconds,
            },
            {
              name: 'Paused',
              value: item.spec?.paused ? 'true' : 'false',
            },
            {
              name: 'Strategy Type',
              value: renderUpdateStrategy(item),
              hide: !item.spec?.strategy,
            },
            {
              name: 'Selector',
              value: item.spec?.selector && (
                <MetadataDictGrid
                  dict={item.spec?.selector.matchLabels as Record<string, string>}
                />
              ),
            },
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
              id: 'cluster-api.machine-deployment-conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </>
  );
}
