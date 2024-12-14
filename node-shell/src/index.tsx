import { registerDetailsViewHeaderActionsProcessor, registerPluginSettings} from '@kinvolk/headlamp-plugin/lib';
import { NodeShellAction } from './components/NodeShellAction';
import { Settings } from './components/Settings';

registerPluginSettings('node-shell', Settings, true);

registerDetailsViewHeaderActionsProcessor((resource, actions) => {
  // Ignore if there is no resource.
  if (!resource) {
    return actions;
  }

  if (resource.kind !== "Node") {
    return actions
  }

  actions.splice(0, 0, {
    id: 'node-shell',
    action: <NodeShellAction item={resource} />,
  });
  return actions;
});
