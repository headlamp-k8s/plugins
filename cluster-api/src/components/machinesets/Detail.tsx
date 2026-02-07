import {
  ConditionsSection,
  DetailsGrid,
  Link,
  MetadataDictGrid,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { MachineSet } from '../../resources/machineset';
import { renderReplicas, showReplicas } from '../common';

export function MachineSetDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={MachineSet}
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
              name: 'Replicas',
              value: renderReplicas(item),
              hide: !showReplicas(item),
            },
            {
              name: 'Min Ready Seconds',
              value: item.spec?.minReadySeconds,
            },
            {
              name: 'Delete Policy',
              value: item.spec?.deletePolicy || 'default (Random)',
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
              name: 'Machine Template',
              value: item.spec?.template?.metadata?.name,
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.machine-set-conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </>
  );
}
