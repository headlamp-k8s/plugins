import { Icon } from '@iconify/react';
import { ActionButton, EditorDialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KService } from '../../../../resources/knative';
import { Activity } from '../../../common/activity/Activity';
import { useKServicePermissions } from '../permissions/KServicePermissionsProvider';

type KServiceViewYamlHeaderButtonProps = {
  kservice: KService;
};

function KServiceYamlActivityContent({
  kservice,
  activityId,
}: {
  kservice: KService;
  activityId: string;
}) {
  const name = kservice.metadata.name ?? '';
  const namespace = kservice.metadata.namespace ?? '';
  const cluster = kservice.cluster;

  const [latestKService] = KService.useGet(name, namespace, { cluster });

  return (
    <EditorDialog
      noDialog
      item={latestKService?.jsonData ?? kservice.jsonData}
      open
      allowToHideManagedFields
      onClose={() => Activity.close(activityId)}
      onSave={null}
    />
  );
}

export function KServiceViewYamlHeaderButton({ kservice }: KServiceViewYamlHeaderButtonProps) {
  const { canPatchKService } = useKServicePermissions();

  // Hide in read-only mode (no patch permission).
  // Reason: this view renders header actions and can end up showing the same "View YAML"
  // button twice. Keeping the decision inside this *HeaderButton* component makes it
  // consistent wherever it is rendered.
  if (canPatchKService !== true) {
    return null;
  }

  const activityId = `kservice-yaml-${kservice.metadata.uid ?? kservice.metadata.name}`;

  const openYaml = () => {
    Activity.launch({
      id: activityId,
      title: kservice.metadata.name,
      cluster: kservice.cluster,
      icon: <Icon icon="mdi:eye" />,
      location: 'window',
      content: <KServiceYamlActivityContent kservice={kservice} activityId={activityId} />,
    });
  };

  return <ActionButton icon="mdi:eye" onClick={openYaml} description="View YAML" />;
}
