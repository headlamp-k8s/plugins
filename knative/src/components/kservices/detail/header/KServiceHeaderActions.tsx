import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useKServiceActions } from '../hooks/useKServiceActions';
import { KService } from '../../../../resources/knative';

type KServiceHeaderActionsProps = {
  kservice: KService;
};

export function KServiceHeaderActions({ kservice }: KServiceHeaderActionsProps) {
  const { acting, handleRedeploy, handleRestart } = useKServiceActions(kservice);
  const disabled = acting !== null;

  return (
    <>
      <ActionButton
        description="Redeploy Latest Revision"
        icon="mdi:update"
        onClick={handleRedeploy}
        iconButtonProps={{ disabled }}
      />
      <ActionButton
        description="Restart"
        icon="mdi:restart"
        onClick={handleRestart}
        iconButtonProps={{ disabled }}
      />
    </>
  );
}
