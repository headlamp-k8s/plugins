import {
  DetailsViewDefaultHeaderActions,
  registerDetailsViewHeaderActionsProcessor,
} from '@kinvolk/headlamp-plugin/lib';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { HeaderAction } from '@kinvolk/headlamp-plugin/lib/redux/actionButtonsSlice';

const FLUX_OWNERSHIP_LABELS = ['kustomize.toolkit.fluxcd.io/name', 'helm.toolkit.fluxcd.io/name'];

// Ephemeral resources that Flux will recreate, so deleting/editing them is fine.
const EPHEMERAL_KINDS = new Set(['Pod', 'Job', 'Event']);

function isManagedByFlux(resource: KubeObject | null): boolean {
  if (!resource) {
    return false;
  }

  const labels = resource.jsonData?.metadata?.labels;
  if (!labels) {
    return false;
  }

  return FLUX_OWNERSHIP_LABELS.some(label => !!labels[label]);
}

export function registerFluxHeaderActionsProcessor() {
  registerDetailsViewHeaderActionsProcessor((resource, headerActions: HeaderAction[]) => {
    if (!resource || !isManagedByFlux(resource)) {
      return headerActions;
    }

    const kind = resource.jsonData?.kind;
    if (kind && EPHEMERAL_KINDS.has(kind)) {
      return headerActions;
    }

    // Actions that mutate the desired state and would be reverted by Flux.
    const disallowedActions = new Set<string>([
      DetailsViewDefaultHeaderActions.DELETE,
      DetailsViewDefaultHeaderActions.EDIT,
      DetailsViewDefaultHeaderActions.SCALE,
      'rollback',
    ]);

    const filtered = headerActions.filter(action => !disallowedActions.has(action.id));

    return filtered;
  });
}
