import {
  registerDetailsViewHeaderActionsProcessor,
  registerPluginSettings,
} from '@kinvolk/headlamp-plugin/lib';
import { GrafanaButton } from './components/GrafanaButton/GrafanaButton';
import { Settings } from './components/Settings/Settings';

/**
 * Registers a processor that injects a Grafana deep-link button into the
 * header action bar of any Kubernetes resource view, provided the resource
 * has the 'grafana.com/dashboard' annotation.
 */
registerDetailsViewHeaderActionsProcessor((resource, actions) => {
  const annotations = resource?.metadata?.annotations || {};
  const dashboard = annotations['grafana.com/dashboard'];

  if (dashboard) {
    actions.unshift({
      id: 'open-with-grafana',
      action: <GrafanaButton dashboard={dashboard} />,
    });
  }

  return actions;
});

registerPluginSettings('@headlamp-k8s/grafana', Settings, true);
