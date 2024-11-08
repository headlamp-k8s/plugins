import {
  registerDetailsViewHeaderActionsProcessor,
  registerPluginSettings,
} from '@kinvolk/headlamp-plugin/lib';
import { BackstageButton } from './components/BackstageButton/BackstageButton';
import { Settings } from './components/Settings/Settings';

registerDetailsViewHeaderActionsProcessor((resource, actions) => {
  const labels = resource?.metadata?.labels || {};
  const backstageLabels = Object.entries(labels).filter(([key]) => key.startsWith('backstage.io/'));

  const kubernetesId = backstageLabels.find(
    ([key]) => key === 'backstage.io/kubernetes-id'
  )?.[1] as string;
  const namespace =
    (backstageLabels.find(([key]) => key === 'backstage.io/kubernetes-namespace')?.[1] as string) ||
    'default';

  if (kubernetesId && namespace) {
    actions.unshift({
      id: 'open-with-backstage',
      action: <BackstageButton kubernetesId={kubernetesId} namespace={namespace} />,
    });
  }

  return actions;
});

registerPluginSettings('@headlamp-k8s/backstage', Settings, true);
