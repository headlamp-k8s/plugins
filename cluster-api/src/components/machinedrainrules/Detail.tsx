import { DetailsGrid, MetadataDictGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { LabelSelector } from '../../resources/common';
import { MachineDrainRule } from '../../resources/machinedrainrule';

function renderSelector(selector?: LabelSelector) {
  if (!selector?.matchLabels) {
    return null;
  }
  return <MetadataDictGrid dict={selector.matchLabels as Record<string, string>} />;
}

export function MachineDrainRuleDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={MachineDrainRule}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        extraInfo={item =>
          item && [
            {
              name: 'Drain Behavior',
              value: item.spec?.drain?.behavior,
            },
            {
              name: 'Drain Order',
              value: item.spec?.drain?.order,
              hide: item.spec?.drain?.order === undefined,
            },
            {
              name: 'Machine Selector',
              value: item.spec?.machines?.[0]?.selector &&
                renderSelector(item.spec.machines[0].selector),
              hide: !item.spec?.machines?.[0]?.selector?.matchLabels,
            },
            {
              name: 'Machine Cluster Selector',
              value: item.spec?.machines?.[0]?.clusterSelector &&
                renderSelector(item.spec.machines[0].clusterSelector),
              hide: !item.spec?.machines?.[0]?.clusterSelector?.matchLabels,
            },
            {
              name: 'Pod Selector',
              value: item.spec?.pods?.[0]?.selector &&
                renderSelector(item.spec.pods[0].selector),
              hide: !item.spec?.pods?.[0]?.selector?.matchLabels,
            },
            {
              name: 'Pod Namespace Selector',
              value: item.spec?.pods?.[0]?.namespaceSelector &&
                renderSelector(item.spec.pods[0].namespaceSelector),
              hide: !item.spec?.pods?.[0]?.namespaceSelector?.matchLabels,
            },
          ]
        }
      />
    </>
  );
}
