import {
  DetailsViewDefaultHeaderActions,
  registerDetailsViewHeaderActionsProcessor,
} from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, EditorDialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { Chip, Tooltip } from '@mui/material';
import { useState } from 'react';

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
const FLUX_VIEW_YAML_ACTION_ID = 'flux-view-yaml';

function ViewYAMLButton({ item }: { item: KubeObject }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionButton description="View YAML" icon="mdi:eye" onClick={() => setOpen(true)} />
      <EditorDialog
        item={item.jsonData}
        open={open}
        onClose={() => setOpen(false)}
        onSave={null}
        allowToHideManagedFields
        PaperProps={{
          sx: {
            height: '90vh',
            // Hide the "Upload File/URL" button in view-only mode.
            '& .MuiFormGroup-row > .MuiButton-root': { display: 'none' },
          },
        }}
      />
    </>
  );
}

export function registerFluxHeaderActionsProcessor() {
  registerDetailsViewHeaderActionsProcessor((resource, headerActions) => {
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

    const viewAction = {
      id: FLUX_VIEW_YAML_ACTION_ID,
      action: <ViewYAMLButton item={resource} />,
    };

    const indicator = {
      id: FLUX_MANAGED_ACTION_ID,
      action: (
        <Tooltip title="This resource is managed by Flux. Some actions are hidden because changes would be reverted by Flux.">
          <Chip label="Flux managed" size="small" variant="outlined" color="primary" />
        </Tooltip>
      ),
    };

    return [...filtered, viewAction, indicator];
  });
}
