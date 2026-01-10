import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KService } from '../../../../resources/knative';
import { useKServiceActions } from '../hooks/useKServiceActions';
import { useKServicePermissions } from '../permissions/KServicePermissionsProvider';

type KServiceHeaderActionsProps = {
  kservice: KService;
};

export function KServiceHeaderActions({ kservice }: KServiceHeaderActionsProps) {
  const { acting, handleRedeploy, handleRestart } = useKServiceActions(kservice);
  const disabled = acting !== null;
  const { canPatchKService, canDeletePods } = useKServicePermissions();

  return (
    <>
      {canPatchKService === true && (
        <ActionButton
          description="Redeploy Latest Revision"
          icon="mdi:update"
          onClick={handleRedeploy}
          iconButtonProps={{ disabled }}
        />
      )}
      {canDeletePods === true && (
        <ActionButton
          description="Restart"
          icon="mdi:restart"
          onClick={handleRestart}
          iconButtonProps={{ disabled }}
        />
      )}
    </>
  );
}
