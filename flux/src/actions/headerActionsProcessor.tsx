import {
  DetailsViewDefaultHeaderActions,
  registerDetailsViewHeaderActionsProcessor,
} from '@kinvolk/headlamp-plugin/lib';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { HeaderAction } from '@kinvolk/headlamp-plugin/lib/redux/actionButtonsSlice';
import { Chip, Tooltip } from '@mui/material';

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

const FLUX_MANAGED_ACTION_ID = 'flux-managed-indicator';

export function registerFluxHeaderActionsProcessor() {
  registerDetailsViewHeaderActionsProcessor((resource, headerActions: HeaderAction[]) => {
    if (!resource || !isManagedByFlux(resource)) {
      return headerActions;
    }

    const kind = resource.jsonData?.kind;
    if (kind && EPHEMERAL_KINDS.has(kind)) {
      return headerActions;
    }

    // Resolved inside the callback so the enum is guaranteed to be initialized.
    const mutatingActions = new Set<string>([
      DetailsViewDefaultHeaderActions.DELETE,
      DetailsViewDefaultHeaderActions.EDIT,
      DetailsViewDefaultHeaderActions.SCALE,
      'rollback',
    ]);

    const filtered = headerActions.filter(action => !mutatingActions.has(action.id));

    const indicator: HeaderAction = {
      id: FLUX_MANAGED_ACTION_ID,
      action: (
        <Tooltip title="This resource is managed by Flux. Some actions are hidden because changes would be reverted by Flux.">
          <Chip label="Flux managed" size="small" variant="outlined" color="primary" />
        </Tooltip>
      ),
    };

    return [...filtered, indicator];
  });
}
