import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { ProfileClass } from '../../resources/profile';
import { ProfileStatusBadge } from '../common/ProfileStatusBadge';

/**
 * Renders a brief "glance" summary for a Profile on the map.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function ProfilesGlance({ node }: { node: GraphNode }) {
  const { t } = useTranslation('kubeflow');
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== ProfileClass.kind || !kubeObject.jsonData) {
    return null;
  }

  const profile = kubeObject as ProfileClass;
  const owner = profile.owner?.name;

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="profile-glance">
      <ProfileStatusBadge jsonData={profile.jsonData} />
      {owner && <StatusLabel status="">{t('kubeflow|Owner: {{owner}}', { owner })}</StatusLabel>}
    </Box>
  );
}
